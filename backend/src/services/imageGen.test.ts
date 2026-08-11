import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSvgMockImage, generateImage } from './imageGen';
import { setAiSettingsMemory, updateAiSettings } from './aiSettings';

describe('imageGen service', () => {
  setAiSettingsMemory(true);

  it('generates SVG mock image data URL with encoded prompt and details', () => {
    const svgUrl = createSvgMockImage('A serene koi pond at sunset, ukiyo-e style.', {
      quality: 'low',
      size: '1024x1536',
      mode: 'generation',
    });
    assert.ok(svgUrl.startsWith('data:image/svg+xml;utf8,'));
    assert.ok(svgUrl.includes('RAML%20AI%20Image%20Generator'));
    assert.ok(svgUrl.includes('A%20serene%20koi%20pond'));
    assert.ok(svgUrl.includes('low'));
    assert.ok(svgUrl.includes('1024x1536'));
  });

  it('returns error when prompt is empty', async () => {
    const result = await generateImage({ prompt: '   ' });
    assert.equal(result.ok, false);
    assert.match(result.error || '', /خالی/);
  });

  it('returns mock image with custom quality, size, and mode when useMockImageGen is true', async () => {
    await updateAiSettings({
      tokenbazaarApiKey: 'tblive_test_key_123',
      useMockImageGen: true,
      imageQuality: 'low',
      imageSize: '1024x1536',
      imageMode: 'generation',
    });
    const result = await generateImage({
      prompt: 'A serene koi pond at sunset, ukiyo-e style.',
      model: 'flux-2-pro',
      size: '1536x1024',
      quality: 'high',
      mode: 'edit',
    });

    assert.equal(result.ok, true);
    assert.ok(result.imageUrl?.startsWith('data:image/svg+xml'));
    assert.equal(result.prompt, 'A serene koi pond at sunset, ukiyo-e style.');
    assert.equal(result.size, '1536x1024');
    assert.equal(result.quality, 'high');
    assert.equal(result.mode, 'edit');
    assert.match(result.model, /mock/);
  });

  it('falls back to default settings when options are omitted', async () => {
    await updateAiSettings({
      tokenbazaarApiKey: '',
      useMockImageGen: false,
      imageQuality: 'low',
      imageSize: '1024x1536',
      imageMode: 'generation',
    });
    const result = await generateImage({
      prompt: 'Dragon in ancient castle',
    });

    assert.equal(result.ok, true);
    assert.equal(result.quality, 'low');
    assert.equal(result.size, '1024x1536');
    assert.equal(result.mode, 'generation');
    assert.ok(result.imageUrl?.startsWith('data:image/svg+xml'));
  });
});
