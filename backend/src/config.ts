import dotenv from 'dotenv';

dotenv.config();

function parseCorsOrigins(raw: string | undefined): string | string[] {
  const fallback = ['http://localhost:5173', 'http://localhost:5174'];
  if (!raw || !raw.trim()) return fallback;
  const parts = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts.length === 1 ? parts[0] : parts;
}

export const config = {
  port: Number(process.env.PORT) || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raml',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  useMockAi: process.env.USE_MOCK_AI === 'true',
  tokenbazaarApiKey: process.env.TOKENBAZAAR_API_KEY || '',
  tokenbazaarBaseUrl: process.env.TOKENBAZAAR_BASE_URL || 'https://api.tokenbazaar.ai/v1',
  imageModel: process.env.IMAGE_MODEL || 'flux-2-pro',
  imageQuality: process.env.IMAGE_QUALITY ?? '',
  imageSize: process.env.IMAGE_SIZE || '1024x1024',
  imageMode: process.env.IMAGE_MODE || 'generation',
  useMockImageGen: process.env.USE_MOCK_IMAGE_GEN === 'true',
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  adminToken: process.env.ADMIN_TOKEN || '',
  energyRegenMinutes: Number(process.env.ENERGY_REGEN_MINUTES) || 20,
  energyMax: Number(process.env.ENERGY_MAX) || 10,
  zarinpalMerchantId: process.env.ZARINPAL_MERCHANT_ID || 'e4fe46b0-384d-4cd1-8aa1-d4bde5d2e511',
  zarinpalSandbox: process.env.ZARINPAL_SANDBOX === 'true',
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || 'http://localhost:5173',
  backendBaseUrl: process.env.BACKEND_BASE_URL || 'http://localhost:3001',
};