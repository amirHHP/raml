import { Player, type IPlayer } from '../models/Player';
import { persistPlayer, getOrCreatePlayer, isUsingMemory, getMemoryPlayers } from './gameState';
import { getReferralRewards } from './gameSettings';

const MAX_REFERRALS = 20;

/**
 * Generate a unique 6-character alphanumeric referral code (uppercase + digits).
 */
export function generateRandomReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous: 0/O, 1/I
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Ensure a player has a referral code; generate one if missing.
 */
export async function ensureReferralCode(player: IPlayer): Promise<string> {
  if (player.referralCode && player.referralCode.trim().length > 0) {
    return player.referralCode;
  }

  let attempts = 0;
  while (attempts < 15) {
    const code = generateRandomReferralCode();
    // Check uniqueness
    const exists = isUsingMemory()
      ? Array.from(getMemoryPlayers().values()).some((p) => p.referralCode === code)
      : await Player.findOne({ referralCode: code });
    if (!exists) {
      player.referralCode = code;
      await persistPlayer(player);
      return code;
    }
    attempts++;
  }
  // Fallback: use a longer random string
  player.referralCode = generateRandomReferralCode() + generateRandomReferralCode();
  await persistPlayer(player);
  return player.referralCode;
}

/**
 * Look up a player by their referral code.
 */
async function findByReferralCode(code: string): Promise<IPlayer | null> {
  const normalized = code.trim().toUpperCase();
  if (isUsingMemory()) {
    for (const p of getMemoryPlayers().values()) {
      if (p.referralCode === normalized) return p;
    }
    return null;
  }
  return Player.findOne({ referralCode: normalized });
}

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
  maxReferrals: number;
  referredBy: string | null;
  /** Names of referred friends. */
  referredFriends: string[];
}

/**
 * Get referral info for a player.
 */
export async function getReferralInfo(deviceId: string): Promise<ReferralInfo> {
  const player = await getOrCreatePlayer(deviceId);
  const code = await ensureReferralCode(player);

  // Find all players referred by this player
  let friends: string[];
  if (isUsingMemory()) {
    friends = Array.from(getMemoryPlayers().values())
      .filter((p) => p.referredBy === deviceId)
      .map((p) => p.characterName || '???');
  } else {
    const referred = await Player.find({ referredBy: deviceId }).select('characterName').lean();
    friends = referred.map((p: any) => p.characterName || '???');
  }

  return {
    referralCode: code,
    referralCount: player.referralCount || 0,
    maxReferrals: MAX_REFERRALS,
    referredBy: player.referredBy || null,
    referredFriends: friends,
  };
}

/**
 * Apply a referral code to a new player. This should be called BEFORE or DURING awaken.
 * Returns the referrer's character name on success.
 */
export async function applyReferralCode(
  newPlayerDeviceId: string,
  referralCode: string,
): Promise<{ referrerName: string }> {
  const normalized = referralCode.trim().toUpperCase();
  if (!normalized || normalized.length < 4) {
    throw Object.assign(new Error('کد دعوت نامعتبر است'), { status: 400 });
  }

  const newPlayer = await getOrCreatePlayer(newPlayerDeviceId);

  if (newPlayer.referredBy) {
    throw Object.assign(new Error('شما قبلاً از کد دعوت استفاده کرده‌اید'), { status: 400 });
  }

  const referrer = await findByReferralCode(normalized);
  if (!referrer) {
    throw Object.assign(new Error('کد دعوت پیدا نشد'), { status: 404 });
  }

  // Self-referral check
  if (referrer.deviceId === newPlayerDeviceId) {
    throw Object.assign(new Error('نمی‌توانید از کد دعوت خودتان استفاده کنید'), { status: 400 });
  }

  // Max referrals check
  if ((referrer.referralCount || 0) >= MAX_REFERRALS) {
    throw Object.assign(new Error('ظرفیت دعوت این بازیکن تکمیل شده است'), { status: 400 });
  }

  // Link the new player to the referrer
  newPlayer.referredBy = referrer.deviceId;
  await persistPlayer(newPlayer);

  return { referrerName: referrer.characterName || '???'  };
}

/**
 * Grant referral rewards to both parties after a referred player awakens.
 * Should be called inside the awaken flow.
 */
export async function grantReferralRewards(newPlayer: IPlayer): Promise<void> {
  if (!newPlayer.referredBy) return;

  // Find the referrer
  let referrer: IPlayer | null;
  if (isUsingMemory()) {
    referrer = getMemoryPlayers().get(newPlayer.referredBy) ?? null;
  } else {
    referrer = await Player.findOne({ deviceId: newPlayer.referredBy });
  }

  if (!referrer) return;
  if ((referrer.referralCount || 0) >= MAX_REFERRALS) return;

  const rewards = getReferralRewards();

  // Grant rewards
  referrer.referralCount = (referrer.referralCount || 0) + 1;
  referrer.stats.gold += rewards.referrerGold;
  referrer.toastMessage = `🎉 دوست جدیدت ${newPlayer.characterName} بازی را شروع کرد! +${rewards.referrerGold} طلا`;
  await persistPlayer(referrer);

  // Grant referee reward
  newPlayer.stats.gold += rewards.refereeGold;
}

export interface AdminReferralStats {
  totalReferredPlayers: number;
  totalReferralsCompleted: number;
  totalReferrerGoldGranted: number;
  totalRefereeGoldGranted: number;
  referrerGoldReward: number;
  refereeGoldReward: number;
  topReferrers: Array<{
    deviceId: string;
    characterName: string;
    referralCount: number;
  }>;
}

/**
 * Get aggregated referral statistics for the admin dashboard.
 */
export async function getAdminReferralStats(): Promise<AdminReferralStats> {
  const rewards = getReferralRewards();

  if (isUsingMemory()) {
    const players = Array.from(getMemoryPlayers().values());
    const referredPlayers = players.filter((p) => Boolean(p.referredBy));
    const totalReferredPlayers = referredPlayers.length;
    let totalReferralsCompleted = 0;

    const topReferrers = players
      .filter((p) => (p.referralCount || 0) > 0)
      .map((p) => {
        totalReferralsCompleted += p.referralCount || 0;
        return {
          deviceId: p.deviceId,
          characterName: p.characterName || 'نامشخص',
          referralCount: p.referralCount || 0,
        };
      })
      .sort((a, b) => b.referralCount - a.referralCount)
      .slice(0, 10);

    return {
      totalReferredPlayers,
      totalReferralsCompleted,
      totalReferrerGoldGranted: totalReferralsCompleted * rewards.referrerGold,
      totalRefereeGoldGranted: totalReferredPlayers * rewards.refereeGold,
      referrerGoldReward: rewards.referrerGold,
      refereeGoldReward: rewards.refereeGold,
      topReferrers,
    };
  }

  const [totalReferredPlayers, topReferrersDocs] = await Promise.all([
    Player.countDocuments({ referredBy: { $ne: null } }),
    Player.find({ referralCount: { $gt: 0 } })
      .select('deviceId characterName referralCount')
      .sort({ referralCount: -1 })
      .limit(10)
      .lean(),
  ]);

  const aggregateSum = await Player.aggregate([
    { $group: { _id: null, total: { $sum: '$referralCount' } } },
  ]);
  const totalReferralsCompleted = aggregateSum[0]?.total || 0;

  const topReferrers = topReferrersDocs.map((p: any) => ({
    deviceId: p.deviceId,
    characterName: p.characterName || 'نامشخص',
    referralCount: p.referralCount || 0,
  }));

  return {
    totalReferredPlayers,
    totalReferralsCompleted,
    totalReferrerGoldGranted: totalReferralsCompleted * rewards.referrerGold,
    totalRefereeGoldGranted: totalReferredPlayers * rewards.refereeGold,
    referrerGoldReward: rewards.referrerGold,
    refereeGoldReward: rewards.refereeGold,
    topReferrers,
  };
}

/**
 * Cleanup migration for MongoDB: updates any empty string/null referralCodes to valid unique codes
 * and rebuilds the index to prevent E11000 duplicate key errors.
 */
export async function fixReferralCodeDuplicates(): Promise<void> {
  if (isUsingMemory()) return;
  try {
    const unassigned = await Player.find({
      $or: [
        { referralCode: null },
        { referralCode: '' },
        { referralCode: { $exists: false } },
      ],
    });

    for (const p of unassigned) {
      let code = generateRandomReferralCode();
      let attempts = 0;
      while (attempts < 10) {
        const exists = await Player.findOne({ referralCode: code });
        if (!exists) break;
        code = generateRandomReferralCode();
        attempts++;
      }
      p.referralCode = code;
      await p.save().catch(() => undefined);
    }

    const collection = Player.collection;
    const indexes = await collection.indexes().catch(() => []);
    const hasReferralIndex = indexes.some((idx: any) => idx.name === 'referralCode_1');
    if (hasReferralIndex) {
      await collection.dropIndex('referralCode_1').catch(() => undefined);
    }
    await Player.createIndexes().catch(() => undefined);
  } catch (err) {
    console.warn('Referral index migration warning:', err);
  }
}
