import { configure, requestRewardedAd } from 'adivery-js';

/**
 * Official Adivery Test App ID & Rewarded Placement ID
 * Docs: https://docs.adivery.com/testing
 */
const DEFAULT_APP_ID = '7e27fb38-5aff-473a-998f-437b89426f66';
const DEFAULT_REWARDED_PLACEMENT_ID = '3f97dc4d-3e09-4024-acaf-931862c03ba8';

export const ADIVERY_APP_ID =
  (import.meta.env.VITE_ADIVERY_APP_ID as string | undefined) || DEFAULT_APP_ID;

export const ADIVERY_REWARDED_PLACEMENT_ID =
  (import.meta.env.VITE_ADIVERY_REWARDED_PLACEMENT_ID as string | undefined) ||
  DEFAULT_REWARDED_PLACEMENT_ID;

let isConfigured = false;

export function initAdivery(appId = ADIVERY_APP_ID): void {
  if (isConfigured) return;
  try {
    configure(appId);
    isConfigured = true;
  } catch (err) {
    console.error('Failed to configure Adivery SDK:', err);
  }
}

export type AdResult = {
  watched: boolean;
  network: 'adivery' | 'mock';
  error?: string;
  canSimulate?: boolean;
};

/**
 * Shows Adivery Rewarded Video ad.
 * Returns { watched: true } if user watched the ad completely.
 */
export async function showRewardedVideo(
  placementId = ADIVERY_REWARDED_PLACEMENT_ID
): Promise<AdResult> {
  try {
    initAdivery();
    await new Promise((r) => setTimeout(r, 200));

    const ad = await requestRewardedAd(placementId);
    const isRewarded = await ad.show();

    if (isRewarded) {
      return { watched: true, network: 'adivery' };
    }
    return {
      watched: false,
      network: 'adivery',
      error: 'ویدیو تا انتها مشاهده نشد. برای دریافت پاداش باید تبلیغ کامل پخش شود.',
    };
  } catch (err: any) {
    console.error('Adivery ad playback error:', err);

    let userMsg = 'دریافت تبلیغ با خطا مواجه شد. لطفاً اتصال اینترنت را بررسی کنید.';
    const rawErrorStr = String(err?.message || err);

    if (rawErrorStr.includes('No fill')) {
      userMsg =
        'در حال حاضر تبلیغ ویدیویی فعال برای وب/این جایگاه وجود ندارد (No Fill) یا AdBlocker فعال است.';
    } else if (rawErrorStr.includes('400') || rawErrorStr.includes('Bad Request')) {
      userMsg =
        'خطا در شناسه جایگاه ادیوری (400 Bad Request). لطفاً App ID و Placement ID اختصاصی وب خود را در پنل Adivery بررسی کنید.';
    }

    return {
      watched: false,
      network: 'adivery',
      error: userMsg,
      canSimulate: true,
    };
  }
}

/**
 * Fallback simulator for development/testing when no ad fill is returned by network.
 */
export async function simulateAdReward(): Promise<AdResult> {
  await new Promise((r) => setTimeout(r, 1200));
  return { watched: true, network: 'mock' };
}
