import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isGeminiBaseUrl,
  looksLikeGeminiApiKey,
  lookupGeminiRateLimit,
} from '../services/geminiModels';
import { shouldUseMockAi } from '../services/ai';
import type { RuntimeAiSettings } from '../services/aiSettings';
import { AI_LIVE_FROM_TURN } from '../services/aiPolicy';

const liveSettings: RuntimeAiSettings = {
  openaiApiKey: 'AIzaSyDummyKeyForTests123',
  openaiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
  openaiModel: 'gemini-2.0-flash',
  useMockAi: false,
};

describe('gemini model helpers', () => {
  it('detects Gemini keys and base URLs', () => {
    assert.equal(looksLikeGeminiApiKey('AIzaSyAbc'), true);
    assert.equal(looksLikeGeminiApiKey('sk-openai'), false);
    assert.equal(
      isGeminiBaseUrl('https://generativelanguage.googleapis.com/v1beta/openai/'),
      true,
    );
    assert.equal(isGeminiBaseUrl('https://api.openai.com/v1'), false);
  });

  it('maps free-tier rate limits by model prefix', () => {
    const flash = lookupGeminiRateLimit('models/gemini-2.0-flash');
    assert.equal(flash.rpm, 15);
    assert.equal(flash.tpm, 1_000_000);
    assert.match(flash.label, /15 RPM/);

    const gemma = lookupGeminiRateLimit('gemma-4-31b-it');
    assert.equal(gemma.rpm, 15);
    assert.equal(gemma.tpm, 16_000);
    assert.match(gemma.label, /TPM/);

    const unknown = lookupGeminiRateLimit('totally-unknown-model-xyz');
    assert.equal(unknown.rpm, null);
    assert.match(unknown.label, /نامشخص/);
  });
});

describe('hybrid mock → live AI', () => {
  it(`uses mock before turn ${AI_LIVE_FROM_TURN} and live from turn ${AI_LIVE_FROM_TURN}`, () => {
    assert.equal(shouldUseMockAi(liveSettings, 1), true);
    assert.equal(shouldUseMockAi(liveSettings, 4), true);
    assert.equal(shouldUseMockAi(liveSettings, 5), false);
    assert.equal(shouldUseMockAi(liveSettings, 12), false);
  });

  it('forces mock when flag is on or key missing', () => {
    assert.equal(shouldUseMockAi({ ...liveSettings, useMockAi: true }, 10), true);
    assert.equal(shouldUseMockAi({ ...liveSettings, openaiApiKey: '' }, 10), true);
  });
});
