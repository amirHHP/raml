import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { requireAdmin } from '../middleware/requireAdmin';
import { config } from '../config';
import { maskApiKey, setAiSettingsMemory, updateAiSettings, getRuntimeAiSettings, clearAiSettingsCache } from '../services/aiSettings';
import {
  setPromptServiceMemory,
  ensurePromptSeeds,
  listPrompts,
  updatePrompt,
  buildAwakenPrompt,
} from '../services/promptService';
import { setUseMemory, getOrCreatePlayer } from '../services/gameState';
import { sendNotification, getPlayerInbox, markInboxRead } from '../services/notifications';
import { getAdminStats, listPlayers, patchPlayer } from '../services/adminPlayers';
import { renderTemplate } from '../prompts/templates';
import type { Request, Response, NextFunction } from 'express';

describe('requireAdmin', () => {
  it('rejects missing token', () => {
    const prev = config.adminToken;
    config.adminToken = 'secret-admin';
    let statusCode = 0;
    let body: unknown;
    const req = { header: () => undefined } as unknown as Request;
    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: unknown) {
        body = payload;
        return this;
      },
    } as unknown as Response;
    let nextCalled = false;
    requireAdmin(req, res, (() => {
      nextCalled = true;
    }) as NextFunction);
    assert.equal(statusCode, 401);
    assert.equal(nextCalled, false);
    assert.deepEqual(body, { error: 'دسترسی ادمین غیرمجاز' });
    config.adminToken = prev;
  });

  it('accepts valid bearer token', () => {
    const prev = config.adminToken;
    config.adminToken = 'secret-admin';
    const req = {
      header: (name: string) =>
        name.toLowerCase() === 'authorization' ? 'Bearer secret-admin' : undefined,
    } as unknown as Request;
    let nextCalled = false;
    requireAdmin(req, {} as Response, (() => {
      nextCalled = true;
    }) as NextFunction);
    assert.equal(nextCalled, true);
    config.adminToken = prev;
  });
});

describe('prompt templates', () => {
  before(async () => {
    setPromptServiceMemory(true);
    await ensurePromptSeeds();
  });

  it('renders placeholders', () => {
    assert.equal(renderTemplate('سلام {{name}}', { name: 'رمل' }), 'سلام رمل');
  });

  it('lists seeded prompts', async () => {
    const prompts = await listPrompts();
    assert.equal(prompts.length, 4);
    assert.ok(prompts.some((p) => p.key === 'system' && p.body.length > 20));
  });

  it('updates and uses awaken prompt', async () => {
    await updatePrompt(
      'awaken',
      'بازیکن تازه چشم‌هایش را باز کرده است.\nنام: {{name}} / {{classType}}',
    );
    const text = await buildAwakenPrompt('آریا', 'mage');
    assert.match(text, /آریا/);
    assert.match(text, /mage/);
  });
});

describe('ai settings', () => {
  before(() => {
    setAiSettingsMemory(true);
    clearAiSettingsCache();
  });

  it('masks api keys', () => {
    assert.equal(maskApiKey('sk-abcdefghij'), 'sk-…ghij');
  });

  it('updates runtime settings and forces mock without key', async () => {
    const publicSettings = await updateAiSettings({
      openaiApiKey: '',
      openaiModel: 'gpt-test',
      useMockAi: false,
    });
    assert.equal(publicSettings.openaiModel, 'gpt-test');
    assert.equal(publicSettings.useMockAi, true);
    assert.equal(publicSettings.openaiApiKeySet, false);
    assert.equal(publicSettings.aiLiveFromTurn, 5);

    const runtime = await getRuntimeAiSettings();
    assert.equal(runtime.useMockAi, true);
    assert.equal(runtime.openaiModel, 'gpt-test');
  });

  it('switches Gemini key to Gemini OpenAI-compatible base URL', async () => {
    const publicSettings = await updateAiSettings({
      openaiApiKey: 'AIzaSyTestKeyForAdmin123456',
      openaiBaseUrl: 'https://api.openai.com/v1',
      openaiModel: 'gemini-2.0-flash',
      useMockAi: false,
    });
    assert.equal(publicSettings.provider, 'gemini');
    assert.match(publicSettings.openaiBaseUrl, /generativelanguage\.googleapis\.com/);
    assert.equal(publicSettings.useMockAi, false);
  });
});

describe('admin players + notifications (memory)', () => {
  before(async () => {
    setUseMemory(true);
    setPromptServiceMemory(true);
    setAiSettingsMemory(true);
  });

  it('tracks players in stats and supports patch', async () => {
    const p = await getOrCreatePlayer('device-admin-test-001');
    p.characterName = 'مسافر';
    p.awakened = true;

    const stats = await getAdminStats();
    assert.ok(stats.totalPlayers >= 1);

    const listed = await listPlayers({ q: 'مسافر' });
    assert.ok(listed.items.some((i) => i.deviceId === 'device-admin-test-001'));

    const patched = await patchPlayer('device-admin-test-001', {
      unlockedFullUi: true,
      refillEnergy: true,
    });
    assert.equal(patched.summary.unlockedFullUi, true);
    assert.equal(patched.state.stats.energy, patched.state.stats.maxEnergy);
  });

  it('sends notification into inbox and toast', async () => {
    const player = await getOrCreatePlayer('device-admin-test-002');
    player.toastMessage = null;

    const sent = await sendNotification({
      title: 'سلام',
      body: 'پیام تست ادمین',
      targetType: 'device',
      targetDeviceId: 'device-admin-test-002',
    });
    assert.equal(sent.notification.delivered, 1);

    const inbox = await getPlayerInbox('device-admin-test-002');
    assert.ok(inbox.unreadCount >= 1);
    assert.ok(inbox.items[0].title === 'سلام');

    const updated = await getOrCreatePlayer('device-admin-test-002');
    assert.ok(updated.toastMessage?.includes('سلام'));

    const read = await markInboxRead('device-admin-test-002', inbox.items[0].id);
    assert.ok(read.readAt);
  });
});
