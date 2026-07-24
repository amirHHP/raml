import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/requireAdmin';
import { getAdminStats, getPlayerDetail, listPlayers, patchPlayer } from '../services/adminPlayers';
import { getPublicAiSettings, getRuntimeAiSettings, updateAiSettings } from '../services/aiSettings';
import {
  getPublicGameSettings,
  MAX_STORY_MS_PER_WORD,
  MIN_STORY_MS_PER_WORD,
  updateGameSettings,
} from '../services/gameSettings';
import { listGeminiModels } from '../services/geminiModels';
import { listPrompts, updatePrompt } from '../services/promptService';
import { PROMPT_KEYS } from '../models/PromptTemplate';
import {
  listAdminNotifications,
  sendNotification,
} from '../services/notifications';

const router = Router();

router.use(requireAdmin);

function sendError(res: import('express').Response, err: unknown, fallback: string) {
  const e = err as Error & { status?: number };
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'داده نامعتبر' });
    return;
  }
  console.error(err);
  res.status(e.status || 500).json({ error: e.message || fallback });
}

router.get('/stats', async (_req, res) => {
  try {
    const stats = await getAdminStats();
    res.json(stats);
  } catch (err) {
    sendError(res, err, 'خطا در آمار');
  }
});

router.get('/players', async (req, res) => {
  try {
    const query = z
      .object({
        q: z.string().optional(),
        status: z.enum(['active', 'banned', 'all']).optional(),
        page: z.coerce.number().int().min(1).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
      })
      .parse(req.query);

    const result = await listPlayers(query);
    res.json(result);
  } catch (err) {
    sendError(res, err, 'خطا در لیست بازیکن‌ها');
  }
});

router.get('/players/:deviceId', async (req, res) => {
  try {
    const detail = await getPlayerDetail(String(req.params.deviceId));
    res.json(detail);
  } catch (err) {
    sendError(res, err, 'خطا در جزئیات بازیکن');
  }
});

router.patch('/players/:deviceId', async (req, res) => {
  try {
    const body = z
      .object({
        status: z.enum(['active', 'banned']).optional(),
        unlockedFullUi: z.boolean().optional(),
        refillEnergy: z.boolean().optional(),
      })
      .parse(req.body);

    const result = await patchPlayer(String(req.params.deviceId), body);
    res.json(result);
  } catch (err) {
    sendError(res, err, 'خطا در به‌روزرسانی بازیکن');
  }
});

router.get('/ai', async (_req, res) => {
  try {
    const settings = await getPublicAiSettings();
    res.json(settings);
  } catch (err) {
    sendError(res, err, 'خطا در تنظیمات AI');
  }
});

router.put('/ai', async (req, res) => {
  try {
    const body = z
      .object({
        openaiApiKey: z.string().optional(),
        openaiBaseUrl: z.string().url().optional(),
        openaiModel: z.string().min(1).optional(),
        useMockAi: z.boolean().optional(),
      })
      .parse(req.body);

    const settings = await updateAiSettings(body);
    res.json(settings);
  } catch (err) {
    sendError(res, err, 'خطا در ذخیره تنظیمات AI');
  }
});

router.get('/game', async (_req, res) => {
  try {
    const settings = await getPublicGameSettings();
    res.json(settings);
  } catch (err) {
    sendError(res, err, 'خطا در تنظیمات بازی');
  }
});

router.put('/game', async (req, res) => {
  try {
    const body = z
      .object({
        storyMsPerWord: z
          .number()
          .int()
          .min(MIN_STORY_MS_PER_WORD)
          .max(MAX_STORY_MS_PER_WORD),
      })
      .parse(req.body);

    const settings = await updateGameSettings(body);
    res.json(settings);
  } catch (err) {
    sendError(res, err, 'خطا در ذخیره تنظیمات بازی');
  }
});

/** List Gemini generative models + free-tier rate limits for the admin picker. */
router.post('/ai/gemini-models', async (req, res) => {
  try {
    const body = z
      .object({
        apiKey: z.string().optional(),
      })
      .parse(req.body ?? {});

    const runtime = await getRuntimeAiSettings();
    const apiKey = (body.apiKey?.trim() || runtime.openaiApiKey).trim();
    const models = await listGeminiModels(apiKey);
    res.json({ models, baseUrlHint: 'https://generativelanguage.googleapis.com/v1beta/openai/' });
  } catch (err) {
    sendError(res, err, 'خطا در دریافت مدل‌های Gemini');
  }
});

router.get('/prompts', async (_req, res) => {
  try {
    const prompts = await listPrompts();
    res.json({ prompts });
  } catch (err) {
    sendError(res, err, 'خطا در پرامپت‌ها');
  }
});

router.put('/prompts/:key', async (req, res) => {
  try {
    const key = z.enum(PROMPT_KEYS).parse(req.params.key);
    const body = z.object({ body: z.string().min(1) }).parse(req.body);
    const prompt = await updatePrompt(key, body.body);
    res.json(prompt);
  } catch (err) {
    sendError(res, err, 'خطا در ذخیره پرامپت');
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const query = z
      .object({ limit: z.coerce.number().int().min(1).max(100).optional() })
      .parse(req.query);
    const items = await listAdminNotifications(query.limit || 50);
    res.json({ items });
  } catch (err) {
    sendError(res, err, 'خطا در تاریخچه اعلان‌ها');
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const body = z
      .object({
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(2000),
        targetType: z.enum(['all', 'device']),
        targetDeviceId: z.string().min(8).optional().nullable(),
      })
      .parse(req.body);

    const result = await sendNotification(body);
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err, 'خطا در ارسال اعلان');
  }
});

export default router;
