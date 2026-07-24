/**
 * Cafe Bazaar IAP skeleton.
 * Wire `@capacitor-community/...` or official Bazaar Capacitor plugin here.
 * SKU catalog mirrors `pool.json` / backend SHOP_SKUS.
 */

import pool from '../../pool.json';

export type BazaarPurchase = {
  sku: string;
  purchaseToken: string;
  orderId?: string;
};

export async function listSkus() {
  return pool.skus;
}

/**
 * Placeholder purchase flow.
 * Production: invoke native Bazaar billing, then POST token to `/api/mono/iap/verify`.
 */
export async function purchaseSku(sku: string): Promise<BazaarPurchase> {
  // TODO: Capacitor Bazaar IAP plugin
  // const result = await BazaarIap.purchase({ sku });
  return {
    sku,
    purchaseToken: `mock_bazaar_${sku}_${Date.now()}`,
    orderId: `mock_order_${Date.now()}`,
  };
}

export async function restorePurchases(): Promise<BazaarPurchase[]> {
  // TODO: BazaarIap.restore()
  return [];
}
