import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceId } from '../middleware/deviceId';
import {
  awakenPlayer,
  cancelHomeActivity,
  chooseOption,
  claimHomeActivity,
  clearToast,
  debugUnlock,
  getOrCreatePlayer,
  restorePlayer,
  speedUpHomeActivity,
  startHomeActivity,
  submitDiceRoll,
  toClientState,
  toggleEquipItem,
  unlockOrReturnHome,
} from '../services/gameState';
import { getPlayerInbox, markInboxRead } from '../services/notifications';
import { recordEvents } from '../services/funnel';
import { FUNNEL_EVENT_NAMES } from '../models/FunnelEvent';

const router = Router();

const DAY_MS = 24 * 60 * 60 * 1000;

/** Onboarding telemetry. Failures are swallowed: never break a turn over a metric. */
router.post('/events', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        sessionId: z.string().min(8).max(64),
        events: z
          .array(
            z.object({
              name: z.enum(FUNNEL_EVENT_NAMES),
              atMs: z.number().int().min(0).max(DAY_MS),
            }),
          )
          .min(1)
          .max(20),
      })
      .parse(req.body);

    await recordEvents(req.deviceId, body.sessionId, body.events);
    res.status(204).end();
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'رویداد نامعتبر' });
      return;
    }
    console.error(err);
    res.status(204).end();
  }
});

/** Restore a prior save by code (deviceId). Does not create a new player. */
router.post('/restore', async (req, res) => {
  try {
    const body = z.object({ saveCode: z.string().min(8).max(128) }).parse(req.body);
    const state = await restorePlayer(body.saveCode);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'کد ذخیره نامعتبر است' });
      return;
    }
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در بازیابی' });
  }
});

router.get('/state', requireDeviceId, async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.deviceId);
    res.json(toClientState(player));
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در دریافت وضعیت' });
  }
});

router.post('/awaken', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        characterName: z.string().min(1).max(24),
        classType: z.enum(['warrior', 'mage', 'rogue', 'ranger']).optional(),
      })
      .parse(req.body);

    const state = await awakenPlayer(
      req.deviceId,
      body.characterName,
      body.classType ?? 'warrior',
    );
    res.json(state);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'نام شخصیت نامعتبر است' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'خطا در بیداری' });
  }
});

router.post('/action', requireDeviceId, async (req, res) => {
  try {
    const body = z.object({ optionId: z.string().min(1) }).parse(req.body);
    const state = await chooseOption(req.deviceId, body.optionId);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'گزینه نامعتبر' });
      return;
    }
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در اقدام' });
  }
});

router.post('/dice', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        rawRoll: z.number().int().min(1).max(20),
        modifier: z.number().int(),
        total: z.number().int(),
      })
      .parse(req.body);

    const state = await submitDiceRoll(req.deviceId, body);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'نتیجه تاس نامعتبر' });
      return;
    }
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در تاس' });
  }
});

router.post('/toast/clear', requireDeviceId, async (req, res) => {
  try {
    const state = await clearToast(req.deviceId);
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا' });
  }
});

router.post('/inventory/equip', requireDeviceId, async (req, res) => {
  try {
    const body = z.object({ itemId: z.string().min(1) }).parse(req.body);
    const state = await toggleEquipItem(req.deviceId, body.itemId);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'آیتم نامعتبر است' });
      return;
    }
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در تجهیز آیتم' });
  }
});

/** Dev helper: unlock full UI without waiting 3 days */
router.post('/debug/unlock', requireDeviceId, async (req, res) => {
  try {
    const state = await debugUnlock(req.deviceId);
    res.json(state);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در آنلاک' });
  }
});

router.get('/inbox', requireDeviceId, async (req, res) => {
  try {
    const inbox = await getPlayerInbox(req.deviceId);
    res.json(inbox);
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در صندوق پیام' });
  }
});

router.post('/inbox/:id/read', requireDeviceId, async (req, res) => {
  try {
    const inboxId = String(req.params.id);
    const item = await markInboxRead(req.deviceId, inboxId);
    const inbox = await getPlayerInbox(req.deviceId);
    res.json({ item, unreadCount: inbox.unreadCount });
  } catch (err) {
    const e = err as Error & { status?: number };
    console.error(err);
    res.status(e.status || 500).json({ error: e.message || 'خطا در خواندن پیام' });
  }
});

/* Home endpoints */
router.post('/home/return', requireDeviceId, async (req, res) => {
  try {
    const state = await unlockOrReturnHome(req.deviceId);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message || 'خطا در بازگشت به خانه' });
  }
});

router.post('/home/start', requireDeviceId, async (req, res) => {
  try {
    const body = z
      .object({
        activityId: z.enum([
          'sword_training',
          'obstacle_jump',
          'meditation',
          'excavation',
          'hunting',
        ]),
        durationMinutes: z.number().int().positive(),
      })
      .parse(req.body);

    const state = await startHomeActivity(
      req.deviceId,
      body.activityId,
      body.durationMinutes,
    );
    res.json(state);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: 'پارامترهای فعالیت نامعتبر است' });
      return;
    }
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message || 'خطا در شروع فعالیت' });
  }
});

router.post('/home/speedup', requireDeviceId, async (req, res) => {
  try {
    const state = await speedUpHomeActivity(req.deviceId);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message || 'خطا در تسریع فعالیت' });
  }
});

router.post('/home/cancel', requireDeviceId, async (req, res) => {
  try {
    const state = await cancelHomeActivity(req.deviceId);
    res.json(state);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message || 'خطا در لغو فعالیت' });
  }
});

router.post('/home/claim', requireDeviceId, async (req, res) => {
  try {
    const result = await claimHomeActivity(req.deviceId);
    res.json(result);
  } catch (err) {
    const e = err as Error & { status?: number };
    res.status(e.status || 500).json({ error: e.message || 'خطا در دریافت پاداش فعالیت' });
  }
});

export default router;