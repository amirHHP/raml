import { Player, type IPlayer } from '../models/Player';
import { persistPlayer, getOrCreatePlayer, isUsingMemory, getMemoryPlayers } from './gameState';

const MAX_REFERRALS = 20;
const REFERRER_REWARD_GOLD = 50;
const REFEREE_REWARD_GOLD = 25;

/**
 * Generate a unique 6-character alphanumeric referral code (uppercase + digits).
 */
function generateCode(): string {
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
  if (player.referralCode) return player.referralCode;

  let attempts = 0;
  while (attempts < 10) {
    const code = generateCode();
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
  player.referralCode = generateCode() + generateCode();
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

  // Grant rewards
  referrer.referralCount = (referrer.referralCount || 0) + 1;
  referrer.stats.gold += REFERRER_REWARD_GOLD;
  referrer.toastMessage = `🎉 دوست جدیدت ${newPlayer.characterName} بازی را شروع کرد! +${REFERRER_REWARD_GOLD} طلا`;
  await persistPlayer(referrer);

  // Grant referee reward
  newPlayer.stats.gold += REFEREE_REWARD_GOLD;
}
