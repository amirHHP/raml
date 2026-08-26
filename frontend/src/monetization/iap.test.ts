import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { listSkus, purchaseSku, restorePurchases } from './iap.ts';

describe('Cafe Bazaar IAP', () => {
  it('lists catalog SKUs from pool.json', async () => {
    const skus = await listSkus();
    assert.ok(skus.length > 0);
    assert.ok(skus.every((item) => item.sku && item.type === 'inapp'));
  });

  it('returns a purchase token for the requested SKU', async () => {
    const purchase = await purchaseSku('energy_refill');
    assert.equal(purchase.sku, 'energy_refill');
    assert.ok(purchase.purchaseToken.startsWith('mock_bazaar_energy_refill_'));
    assert.ok(purchase.orderId);
  });

  it('has no restored purchases until native Bazaar billing is wired', async () => {
    const restored = await restorePurchases();
    assert.deepEqual(restored, []);
  });
});
