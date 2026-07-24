import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceId } from '../middleware/deviceId';
import { getOrCreatePlayer, toClientState } from '../services/gameState';
import { refillEnergy } from '../services/energy';

/**
 * Cafe Bazaar monetization skeleton.
 * Real Tapsell/Yektanet + Bazaar IAP plug in via Capacitor on the client;
 * these endpoints validate server-side grants.
 */

export const SHOP_SKUS = [
  {
    sku: 'energy_refill',
    title: 'پر کردن انرژی',
    description: 'انرژی را کامل پر می‌کند',
    priceTomans: 1000,
    type: 'consumable' as const,
  },
  {
    sku: 'scenario_kavir',
    title: 'سناریو: شن‌های کویر',
    description: 'باز کردن ماجرای ویژه کویر',
    priceTomans: 5000,
    type: 'non_consumable' as const,
  },
  {
    sku: 'unlock_full_ui',
    title: 'باز کردن رابط کامل',
    description: 'بدون انتظار ۳ روزه',
    priceTomans: 2000,
    type: 'non_consumable' as const,
  },
];

const router = Router();

router.get('/shop', (_req, res) => {
  res.json({ items: SHOP_SKUS });
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
 * Mock IAP verify — production would validate Bazaar purchase token.
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

    const skuMeta = SHOP_SKUS.find((s) => s.sku === body.sku);
    if (!skuMeta) {
      res.status(400).json({ error: 'SKU نامعتبر' });
      return;
    }

    const player = await getOrCreatePlayer(req.deviceId);

    if (skuMeta.type === 'non_consumable' && player.purchasedSkus.includes(body.sku)) {
      res.json({ ...toClientState(player), alreadyOwned: true });
      return;
    }

    // TODO: call Cafe Bazaar purchase validation API with purchaseToken
    if (body.sku === 'energy_refill') {
      refillEnergy(player, player.stats.maxEnergy);
      player.toastMessage = 'انرژی کامل پر شد';
    } else if (body.sku === 'scenario_kavir') {
      if (!player.purchasedSkus.includes(body.sku)) {
        player.purchasedSkus.push(body.sku);
      }
      player.toastMessage = 'سناریو «شن‌های کویر» باز شد';
      player.currentLocation = 'دشت‌های سوزان کویر';
      player.storyText =
        'افق در حرارت می‌لرزد. شن‌های طلایی زیر پایت جاری‌اند و سایه‌ای ناشناس دعوتت می‌کند...';
      player.enemyLineArtType = 'desert_spirit';
    } else if (body.sku === 'unlock_full_ui') {
      if (!player.purchasedSkus.includes(body.sku)) {
        player.purchasedSkus.push(body.sku);
      }
      player.unlockedFullUi = true;
      player.playDayCount = Math.max(player.playDayCount, 3);
      player.toastMessage = 'رابط کامل باز شد';
    }

    if ('save' in player && typeof player.save === 'function') {
      await player.save();
    }

    res.json({ ...toClientState(player), verified: true });
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