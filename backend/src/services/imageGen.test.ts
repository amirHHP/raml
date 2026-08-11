import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSvgMockImage, generateImage } from './imageGen';
import { setAiSettingsMemory, updateAiSettings } from './aiSettings';

describe('imageGen service', () => {
  setAiSettingsMemory(true);

  it('generates SVG mock image data URL with encoded prompt', () => {
    const svgUrl = createSvgMockImage('A serene koi pond at sunset, ukiyo-e style.');
    assert.ok(svgUrl.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(svgUrl.includes('RAML%20AI%20Image%20Generator'));
    assert.ok(svgUrl.includes('A%20serene%20koi%20pond'));
  });

  it('returns error when prompt is empty', async () => {
    const result = await generateImage({ prompt: '   ' });
    assert.equal(result.ok, false);
    assert.match(result.error || '', /خالی/);
  });

  it('returns mock image when useMockImageGen is true', async () => {
    await updateAiSettings({
      tokenbazaarApiKey: 'tblive_test_key_123',
      useMockImageGen: true,
    });
    const result = await generateImage({
      prompt: 'A serene koi pond at sunset, ukiyo-e style.',
      model: 'flux-2-pro',
      size: '1024x1024',
    });

    assert.equal(result.ok, true);
    assert.ok(result.imageUrl?.startsWith('data:image/svg+xml'));
    assert.equal(result.prompt, 'A serene koi pond at sunset, ukiyo-e style.');
    assert.match(result.model, /mock/);
  });

  it('falls back to mock image when tokenbazaarApiKey is empty', async () => {
    await updateAiSettings({
      tokenbazaarApiKey: '',
      useMockImageGen: false,
    });
    const result = await generateImage({
      prompt: 'Dragon in ancient castle',
    });

    assert.equal(result.ok, true);
    assert.ok(result.imageUrl?.startsWith('data:image/svg+xml'));
  });
});
