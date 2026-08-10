import { Router } from 'express';
import { z } from 'zod';
import { requireAdmin } from '../middleware/requireAdmin';
import {
  createChangelog,
  deleteChangelog,
  listChangelogs,
} from '../services/changelog';
import { getAdminStats, getPlayerDetail, listPlayers, patchPlayer } from '../services/adminPlayers';
import { getPublicAiSettings, getRuntimeAiSettings, updateAiSettings } from '../services/aiSettings';
import {
  getPublicGameSettings,
  MAX_STORY_MS_PER_WORD,
  MIN_STORY_MS_PER_WORD,
  MAX_UNLOCK_TURN,
  MIN_UNLOCK_TURN,
  updateGameSettings,
} from '../services/gameSettings';
import { listGeminiModels } from '../services/geminiModels';
import { formatAiError, resetAiClient } from '../services/ai';
import OpenAI from 'openai';
import { listPrompts, updatePrompt } from '../services/promptService';
import { PROMPT_KEYS } from '../models/PromptTemplate';
import {
  deleteMilestonePrompt,
  listMilestonePrompts,
  MILESTONE_INTERVAL,
  upsertMilestonePrompt,
} from '../services/milestonePromptService';
import {
  listAdminNotifications,
  sendNotification,
} from '../services/notifications';
import { getFunnelReport } from '../services/funnel';

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

router.get('/funnel', async (_req, res) => {
  try {
    const report = await getFunnelReport();
    res.json(report);
  } catch (err) {
    sendError(res, err, 'خطا در قیف انگیجمنت');
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
    const unlockTurn = z.number().int().min(MIN_UNLOCK_TURN).max(MAX_UNLOCK_TURN);
    const body = z
      .object({
        storyMsPerWord: z
          .number()
          .int()
          .min(MIN_STORY_MS_PER_WORD)
          .max(MAX_STORY_MS_PER_WORD)
          .optional(),
        unlockInventoryAtTurn: unlockTurn.optional(),
        unlockStatsAtTurn: unlockTurn.optional(),
        unlockHpAtTurn: unlockTurn.optional(),
        unlockManaAtTurn: unlockTurn.optional(),
        unlockGoldAtTurn: unlockTurn.optional(),
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

/** Smoke-test current AI key/model with a tiny JSON completion. */
router.post('/ai/test', async (_req, res) => {
  try {
    const runtime = await getRuntimeAiSettings();
    if (!runtime.openaiApiKey) {
      res.status(400).json({ ok: false, error: 'کلید API تنظیم نشده' });
      return;
    }
    if (runtime.useMockAi) {
      res.status(400).json({
        ok: false,
        error: 'حالت Mock کامل روشن است — اول خاموشش کنید',
      });
      return;
    }

    resetAiClient();
    const client = new OpenAI({
      apiKey: runtime.openaiApiKey,
      baseURL: runtime.openaiBaseUrl,
    });

    const started = Date.now();
    let content: string | null = null;
    try {
      const completion = await client.chat.completions.create({
        model: runtime.openaiModel,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: 'فقط این JSON را برگردان: {"ok":true,"ping":"رمـل"}',
          },
        ],
      });
      content = completion.choices[0]?.message?.content ?? null;
    } catch {
      const completion = await client.chat.completions.create({
        model: runtime.openaiModel,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: 'فقط این JSON را برگردان: {"ok":true,"ping":"رمـل"}',
          },
        ],
      });
      content = completion.choices[0]?.message?.content ?? null;
    }

    if (!content) {
      res.status(502).json({ ok: false, error: 'پاسخ خالی از مدل' });
      return;
    }

    res.json({
      ok: true,
      model: runtime.openaiModel,
      ms: Date.now() - started,
      sample: content.slice(0, 200),
    });
  } catch (err) {
    res.status(502).json({ ok: false, error: formatAiError(err) });
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

router.get('/milestone-prompts', async (_req, res) => {
  try {
    const prompts = await listMilestonePrompts();
    res.json({ interval: MILESTONE_INTERVAL, prompts });
  } catch (err) {
    sendError(res, err, 'خطا در پرامپت‌های مرحله‌ای');
  }
});

router.put('/milestone-prompts/:turn', async (req, res) => {
  try {
    const turn = z.coerce.number().int().parse(req.params.turn);
    const body = z.object({ body: z.string().min(1) }).parse(req.body);
    const prompt = await upsertMilestonePrompt(turn, body.body);
    res.json(prompt);
  } catch (err) {
    sendError(res, err, 'خطا در ذخیره پرامپت مرحله‌ای');
  }
});

router.delete('/milestone-prompts/:turn', async (req, res) => {
  try {
    const turn = z.coerce.number().int().parse(req.params.turn);
    await deleteMilestonePrompt(turn);
    res.json({ ok: true, turn });
  } catch (err) {
    sendError(res, err, 'خطا در حذف پرامپت مرحله‌ای');
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

// ── Changelogs ──────────────────────────────────────────────────

router.get('/changelogs', async (_req, res) => {
  try {
    const items = await listChangelogs();
    res.json({ items });
  } catch (err) {
    sendError(res, err, 'خطا در لیست تغییرات');
  }
});

router.post('/changelogs', async (req, res) => {
  try {
    const body = z
      .object({
        version: z.string().min(1).max(30),
        title: z.string().min(1).max(200),
        titleEn: z.string().max(200).optional(),
        items: z.array(z.string().min(1).max(500)).min(1).max(50),
        itemsEn: z.array(z.string().min(1).max(500)).max(50).optional(),
      })
      .parse(req.body);

    const item = await createChangelog(body);
    res.status(201).json(item);
  } catch (err) {
    sendError(res, err, 'خطا در ایجاد تغییرات');
  }
});

router.delete('/changelogs/:id', async (req, res) => {
  try {
    await deleteChangelog(String(req.params.id));
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err, 'خطا در حذف تغییرات');
  }
});

export default router;
