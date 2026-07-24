import { Player, type IPlayer, type PlayerStatus } from '../models/Player';
import { config } from '../config';
import { refillEnergy } from './energy';
import {
  getMemoryPlayers,
  isUsingMemory,
  persistPlayer,
  toClientState,
} from './gameState';

export type AdminPlayerSummary = {
  deviceId: string;
  characterName: string;
  classType: string;
  status: PlayerStatus;
  awakened: boolean;
  unlockedFullUi: boolean;
  playDayCount: number;
  level: number;
  gold: number;
  energy: number;
  lastPlayedAt: string | null;
  createdAt: string | null;
  purchasedSkus: string[];
};

function asStatus(player: IPlayer): PlayerStatus {
  return player.status === 'banned' ? 'banned' : 'active';
}

function summarize(player: IPlayer): AdminPlayerSummary {
  return {
    deviceId: player.deviceId,
    characterName: player.characterName || '',
    classType: player.classType,
    status: asStatus(player),
    awakened: player.awakened,
    unlockedFullUi: player.unlockedFullUi,
    playDayCount: player.playDayCount,
    level: player.stats?.level ?? 1,
    gold: player.stats?.gold ?? 0,
    energy: player.stats?.energy ?? 0,
    lastPlayedAt: player.lastPlayedAt
      ? new Date(player.lastPlayedAt).toISOString()
      : null,
    createdAt: player.createdAt ? new Date(player.createdAt).toISOString() : null,
    purchasedSkus: player.purchasedSkus || [],
  };
}

export async function getAdminStats() {
  const now = Date.now();
  const dayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  if (isUsingMemory()) {
    const players = [...getMemoryPlayers().values()];
    const classBreakdown: Record<string, number> = {
      warrior: 0,
      mage: 0,
      rogue: 0,
      ranger: 0,
    };
    let awakened = 0;
    let banned = 0;
    let unlocked = 0;
    let dau = 0;
    let wau = 0;
    let withPurchases = 0;

    for (const p of players) {
      classBreakdown[p.classType] = (classBreakdown[p.classType] || 0) + 1;
      if (p.awakened) awakened += 1;
      if (p.status === 'banned') banned += 1;
      if (p.unlockedFullUi || (p.purchasedSkus || []).includes('unlock_full_ui') || p.playDayCount >= 3) {
        unlocked += 1;
      }
      if (p.lastPlayedAt && new Date(p.lastPlayedAt) >= dayAgo) dau += 1;
      if (p.lastPlayedAt && new Date(p.lastPlayedAt) >= weekAgo) wau += 1;
      if ((p.purchasedSkus || []).length > 0) withPurchases += 1;
    }

    return {
      totalPlayers: players.length,
      awakened,
      banned,
      unlocked,
      dau,
      wau,
      withPurchases,
      classBreakdown,
      memoryStore: true,
    };
  }

  const [
    totalPlayers,
    awakened,
    banned,
    unlocked,
    dau,
    wau,
    withPurchases,
    classAgg,
  ] = await Promise.all([
    Player.countDocuments(),
    Player.countDocuments({ awakened: true }),
    Player.countDocuments({ status: 'banned' }),
    Player.countDocuments({
      $or: [
        { unlockedFullUi: true },
        { purchasedSkus: 'unlock_full_ui' },
        { playDayCount: { $gte: 3 } },
      ],
    }),
    Player.countDocuments({ lastPlayedAt: { $gte: dayAgo } }),
    Player.countDocuments({ lastPlayedAt: { $gte: weekAgo } }),
    Player.countDocuments({ 'purchasedSkus.0': { $exists: true } }),
    Player.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$classType', count: { $sum: 1 } } },
    ]),
  ]);

  const classBreakdown: Record<string, number> = {
    warrior: 0,
    mage: 0,
    rogue: 0,
    ranger: 0,
  };
  for (const row of classAgg) {
    if (row._id) classBreakdown[row._id] = row.count;
  }

  return {
    totalPlayers,
    awakened,
    banned,
    unlocked,
    dau,
    wau,
    withPurchases,
    classBreakdown,
    memoryStore: false,
  };
}

export async function listPlayers(params: {
  q?: string;
  status?: PlayerStatus | 'all';
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const q = params.q?.trim() || '';
  const status = params.status || 'all';

  if (isUsingMemory()) {
    let players = [...getMemoryPlayers().values()];
    if (status !== 'all') {
      players = players.filter((p) => asStatus(p) === status);
    }
    if (q) {
      const needle = q.toLowerCase();
      players = players.filter(
        (p) =>
          p.deviceId.toLowerCase().includes(needle) ||
          (p.characterName || '').toLowerCase().includes(needle),
      );
    }
    players.sort(
      (a, b) =>
        new Date(b.lastPlayedAt).getTime() - new Date(a.lastPlayedAt).getTime(),
    );
    const total = players.length;
    const items = players.slice((page - 1) * limit, page * limit).map(summarize);
    return { items, total, page, limit };
  }

  const filter: Record<string, unknown> = {};
  if (status !== 'all') filter.status = status;
  if (q) {
    filter.$or = [
      { deviceId: { $regex: q, $options: 'i' } },
      { characterName: { $regex: q, $options: 'i' } },
    ];
  }

  const [total, docs] = await Promise.all([
    Player.countDocuments(filter),
    Player.find(filter)
      .sort({ lastPlayedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map((d) => summarize(d)),
    total,
    page,
    limit,
  };
}

export async function getPlayerDetail(deviceId: string) {
  if (isUsingMemory()) {
    const player = getMemoryPlayers().get(deviceId);
    if (!player) {
      throw Object.assign(new Error('بازیکن پیدا نشد'), { status: 404 });
    }
    return {
      summary: summarize(player),
      state: toClientState(player),
      storyHistory: player.storyHistory || [],
    };
  }

  const player = await Player.findOne({ deviceId });
  if (!player) {
    throw Object.assign(new Error('بازیکن پیدا نشد'), { status: 404 });
  }

  return {
    summary: summarize(player),
    state: toClientState(player),
    storyHistory: player.storyHistory || [],
  };
}

export async function patchPlayer(
  deviceId: string,
  patch: {
    status?: PlayerStatus;
    unlockedFullUi?: boolean;
    refillEnergy?: boolean;
  },
) {
  let player: IPlayer | null = null;

  if (isUsingMemory()) {
    player = getMemoryPlayers().get(deviceId) || null;
  } else {
    player = await Player.findOne({ deviceId });
  }

  if (!player) {
    throw Object.assign(new Error('بازیکن پیدا نشد'), { status: 404 });
  }

  if (patch.status) {
    player.status = patch.status;
  }
  if (typeof patch.unlockedFullUi === 'boolean') {
    player.unlockedFullUi = patch.unlockedFullUi;
    if (patch.unlockedFullUi) {
      player.playDayCount = Math.max(player.playDayCount, 3);
    }
  }
  if (patch.refillEnergy) {
    refillEnergy(player, player.stats.maxEnergy || config.energyMax);
  }

  await persistPlayer(player);
  return {
    summary: summarize(player),
    state: toClientState(player),
  };
}
