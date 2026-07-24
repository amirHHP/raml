import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { config } from './config';
import gameRoutes from './routes/game';
import monetizationRoutes from './routes/monetization';
import adminRoutes from './routes/admin';
import { setUseMemory } from './services/gameState';
import { setPromptServiceMemory, ensurePromptSeeds } from './services/promptService';
import { setAiSettingsMemory } from './services/aiSettings';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

const mongoReady = mongoose
  .connect(config.mongoUri, { serverSelectionTimeoutMS: 2500 })
  .then(async () => {
    console.log('MongoDB connected');
    setUseMemory(false);
    setPromptServiceMemory(false);
    setAiSettingsMemory(false);
    await ensurePromptSeeds();
  })
  .catch(async (err) => {
    console.warn('MongoDB unavailable — using in-memory store for development.');
    console.warn(String(err));
    setUseMemory(true);
    setPromptServiceMemory(true);
    setAiSettingsMemory(true);
    (global as { __ramlMemory?: boolean }).__ramlMemory = true;
    await ensurePromptSeeds();
  });

app.use(async (_req, _res, next) => {
  await mongoReady;
  next();
});

function healthHandler(_req: express.Request, res: express.Response): void {
  res.json({
    ok: true,
    service: 'raml-backend',
    mockAi: config.useMockAi,
    memoryStore: (global as { __ramlMemory?: boolean }).__ramlMemory === true,
    adminConfigured: Boolean(config.adminToken),
  });
}

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/game', gameRoutes);
app.use('/api/mono', monetizationRoutes);
app.use('/api/admin', adminRoutes);

if (!process.env.VERCEL) {
  mongoReady.finally(() => {
    app.listen(config.port, () => {
      console.log(`Raml backend listening on http://localhost:${config.port}`);
      console.log(`AI mode: ${config.useMockAi ? 'MOCK' : config.openaiModel}`);
      console.log(
        `Admin API: ${config.adminToken ? 'enabled' : 'DISABLED (set ADMIN_TOKEN)'}`,
      );
    });
  });
}

export default app;
