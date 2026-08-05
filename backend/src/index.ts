import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '1.0.0.1']);
} catch {
  // Ignore DNS set failures if restricted by environment
}

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
import {
  setMilestonePromptMemory,
  ensureMilestoneSeeds,
} from './services/milestonePromptService';
import { setAiSettingsMemory } from './services/aiSettings';
import {
  ensureGameSettingsLoaded,
  setGameSettingsMemory,
} from './services/gameSettings';
import { setFunnelMemory } from './services/funnel';

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

let mongoError: string | null = null;

const mongoReady = mongoose
  .connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log('MongoDB connected');
    mongoError = null;
    setUseMemory(false);
    setPromptServiceMemory(false);
    setMilestonePromptMemory(false);
    setAiSettingsMemory(false);
    setGameSettingsMemory(false);
    setFunnelMemory(false);
    await ensurePromptSeeds();
    await ensureMilestoneSeeds();
    await ensureGameSettingsLoaded();
  })
  .catch(async (err) => {
    mongoError = err instanceof Error ? err.message : String(err);
    console.warn('MongoDB unavailable — using in-memory store for development.');
    console.warn(mongoError);
    setUseMemory(true);
    setPromptServiceMemory(true);
    setMilestonePromptMemory(true);
    setAiSettingsMemory(true);
    setGameSettingsMemory(true);
    setFunnelMemory(true);
    (global as { __ramlMemory?: boolean }).__ramlMemory = true;
    await ensurePromptSeeds();
    await ensureMilestoneSeeds();
    await ensureGameSettingsLoaded();
  });

app.use(async (_req, _res, next) => {
  await mongoReady;
  next();
});

function healthHandler(_req: express.Request, res: express.Response): void {
  const memoryStore = (global as { __ramlMemory?: boolean }).__ramlMemory === true;
  res.json({
    ok: true,
    service: 'raml-backend',
    mockAi: config.useMockAi,
    memoryStore,
    mongoConfigured: Boolean(process.env.MONGODB_URI),
    mongoHost: (() => {
      try {
        return new URL(config.mongoUri.replace('mongodb+srv://', 'https://')).hostname;
      } catch {
        return null;
      }
    })(),
    mongoError: memoryStore ? mongoError : null,
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
