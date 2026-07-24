/**
 * Tapsell / Yektanet rewarded video placeholder for Capacitor WebView.
 */

export type AdResult = { watched: boolean; network: 'mock' | 'tapsell' | 'yektanet' };

export async function showRewardedVideo(): Promise<AdResult> {
  // TODO: Capacitor plugin bridge, e.g. Tapsell.showRewarded()
  await new Promise((r) => setTimeout(r, 1500));
  return { watched: true, network: 'mock' };
}
