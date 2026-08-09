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
    return {
      watched: false,
      network: 'adivery',
      error:
        err?.message ||
        'دریافت تبلیغ با خطا مواجه شد. لطفاً اتصال اینترنت را بررسی کرده و دوباره تلاش کنید.',
    };
  }
}
