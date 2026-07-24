import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/raml',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  useMockAi: process.env.USE_MOCK_AI === 'true' || !process.env.OPENAI_API_KEY,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  energyRegenMinutes: Number(process.env.ENERGY_REGEN_MINUTES) || 20,
  energyMax: Number(process.env.ENERGY_MAX) || 10,
};