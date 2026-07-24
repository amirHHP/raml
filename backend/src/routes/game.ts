import { Router } from 'express';
import { z } from 'zod';
import { requireDeviceId } from '../middleware/deviceId';
import {
  awakenPlayer,
  chooseOption,
  clearToast,
  debugUnlock,
  getOrCreatePlayer,
  submitDiceRoll,
  toClientState,
} from '../services/gameState';
import { getPlayerInbox, markInboxRead } from '../services/notifications';

const router = Router();

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

export default router;