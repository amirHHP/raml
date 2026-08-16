import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceId } from '../middleware/deviceId';
import { getOrCreatePlayer, toClientState } from '../services/gameState';
import { refillEnergy } from '../services/energy';
import {
  listPublicShopPackages,
  getShopPackageBySku,
  DEFAULT_SHOP_PACKAGES,
} from '../services/shopPackages';
import {
  requestZarinpalPayment,
  verifyZarinpalPayment,
  applyPackageRewardToPlayer,
} from '../services/zarinpal';
import { config } from '../config';

export const SHOP_SKUS = DEFAULT_SHOP_PACKAGES;

const router = Router();

/**
 * Public shop endpoint — returns all active packages sorted.
 */
router.get('/shop', async (_req, res) => {
  try {
    const items = await listPublicShopPackages();
    res.json({ items });
  } catch (err) {
    console.error('Error fetching shop packages:', err);
    res.status(500).json({ error: 'خطا در دریافت بسته‌های فروشگاه' });
  }
});

/** Mock rewarded ad grant: +5 energy */
router.post('/ads/reward', requireDeviceId, async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.deviceId);
    refillEnergy(player, 5);
    player.toastMessage = '۵ انرژی از تبلیغ دریافت شد';
    if ('save' in player && typeof player.save === 'function') {
      await player.save();
    }
    res.json(toClientState(player));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در پاداش تبلیغ' });
  }
});

/**
 * ZarinPal payment request endpoint.
 * Body: { sku, mobile?, email?, callbackUrl? }
 */
router.post('/zarinpal/request', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        sku: z.string().min(1),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        callbackUrl: z.string().url().optional(),
      })
      .parse(req.body);

    const host = req.get('x-forwarded-host') || req.get('host');
    const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
    const dynamicOrigin = host ? `${proto}://${host}` : config.backendBaseUrl;
    const callbackUrl = body.callbackUrl || `${dynamicOrigin}/api/mono/zarinpal/callback`;

    const result = await requestZarinpalPayment({
      sku: body.sku,
      deviceId: req.deviceId,
      mobile: body.mobile,
      email: body.email,
      callbackUrl,
    });

    if (!result.ok) {
      res.status(400).json({ error: result.error || 'خطا در ایجاد تراکنش درگاه پرداخت' });
      return;
    }

    res.json({
      ok: true,
      authority: result.authority,
      paymentUrl: result.paymentUrl,
      fee: result.fee,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'داده‌های درخواست نامعتبر است' });
      return;
    }
    console.error('Zarinpal request error:', err);
    res.status(500).json({ error: 'خطا در ایجاد درخواست پرداخت زرین‌پال' });
  }
});

/**
 * ZarinPal browser callback endpoint.
 * ZarinPal redirects here with ?Authority=...&Status=OK/NOK
 */
router.get('/zarinpal/callback', async (req, res) => {
  const authority = String(req.query.Authority || req.query.authority || '');
  const status = String(req.query.Status || req.query.status || '');

  const host = req.get('x-forwarded-host') || req.get('host');
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const dynamicOrigin = host ? `${proto}://${host}` : config.frontendBaseUrl;
  const frontendUrl = dynamicOrigin.replace(/\/+$/, '');

  if (!authority) {
    res.redirect(`${frontendUrl}?payment_status=failed&error=missing_authority`);
    return;
  }

  try {
    const result = await verifyZarinpalPayment({
      authority,
      statusQuery: status,
    });

    if (result.ok) {
      const refId = encodeURIComponent(result.refId || '');
      const sku = encodeURIComponent(result.transaction?.sku || '');
      res.redirect(
        `${frontendUrl}?payment_status=success&ref_id=${refId}&sku=${sku}&authority=${encodeURIComponent(authority)}`,
      );
    } else {
      const err = encodeURIComponent(result.error || 'خطا در پرداخت');
      res.redirect(
        `${frontendUrl}?payment_status=failed&error=${err}&authority=${encodeURIComponent(authority)}`,
      );
    }
  } catch (err) {
    console.error('Zarinpal callback verification error:', err);
    res.redirect(`${frontendUrl}?payment_status=failed&error=server_error`);
  }
});

/**
 * ZarinPal client direct verification endpoint.
 * Body: { authority, status? }
 */
router.post('/zarinpal/verify', async (req, res) => {
  try {
    const body = z
      .object({
        authority: z.string().min(1),
        status: z.string().optional(),
      })
      .parse(req.body);

    const result = await verifyZarinpalPayment({
      authority: body.authority,
      statusQuery: body.status,
    });

    if (!result.ok) {
      res.status(400).json({
        ok: false,
        error: result.error || 'تأیید پرداخت با شکست مواجه شد',
        transaction: result.transaction,
      });
      return;
    }

    res.json({
      ok: true,
      refId: result.refId,
      cardPan: result.cardPan,
      rewardSummary: result.rewardSummary,
      transaction: result.transaction,
      playerState: result.playerState,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'اطلاعات ارسالی نامعتبر است' });
      return;
    }
    console.error('Zarinpal verify error:', err);
    res.status(500).json({ error: 'خطا در بررسی تراکنش زرین‌پال' });
  }
});

/**
 * Cafe Bazaar / Native IAP verification endpoint.
 * Body: { sku, purchaseToken }
 */
router.post('/iap/verify', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        sku: z.string(),
        purchaseToken: z.string().optional(),
      })
      .parse(req.body);

    const skuMeta = await getShopPackageBySku(body.sku);
    if (!skuMeta) {
      res.status(400).json({ error: 'SKU نامعتبر' });
      return;
    }

    const player = await getOrCreatePlayer(req.deviceId);

    if (skuMeta.type === 'non_consumable' && player.purchasedSkus.includes(body.sku)) {
      res.json({ ...toClientState(player), alreadyOwned: true });
      return;
    }

    const { player: updatedPlayer } = await applyPackageRewardToPlayer(req.deviceId, body.sku);

    res.json({ ...toClientState(updatedPlayer), verified: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'درخواست نامعتبر' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'خطا در تأیید خرید' });
  }
});

export default router;