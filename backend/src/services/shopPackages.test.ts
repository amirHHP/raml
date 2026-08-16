import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  setShopPackagesMemory,
  resetMemStoreForTest,
  ensureShopPackageSeeds,
  listPublicShopPackages,
  listAllShopPackages,
  createShopPackage,
  updateShopPackage,
  deleteShopPackage,
  getShopPackageBySku,
} from './shopPackages';

describe('ShopPackages Service', () => {
  beforeEach(async () => {
    setShopPackagesMemory(true);
    resetMemStoreForTest();
    await ensureShopPackageSeeds();
  });

  it('should seed default packages and list them', async () => {
    const packages = await listPublicShopPackages();
    assert.ok(packages.length >= 3);
    const energyRefill = packages.find((p) => p.sku === 'energy_refill');
    assert.ok(energyRefill);
    assert.strictEqual(energyRefill?.priceTomans, 1000);
    assert.strictEqual(energyRefill?.type, 'consumable');
  });

  it('should get package by SKU', async () => {
    const pkg = await getShopPackageBySku('gold_200');
    assert.ok(pkg);
    assert.strictEqual(pkg?.rewardType, 'gold');
    assert.strictEqual(pkg?.rewardValue, 200);
  });

  it('should create a new shop package', async () => {
    const created = await createShopPackage({
      sku: 'diamond_pass',
      title: 'گذرنامه الماس',
      titleEn: 'Diamond Pass',
      description: 'دسترسی به تمامی ماجراهای ویژه',
      priceTomans: 15000,
      type: 'non_consumable',
      rewardType: 'unlock_full_ui',
      badge: 'ویژه',
      sortOrder: 10,
    });

    assert.strictEqual(created.sku, 'diamond_pass');
    assert.strictEqual(created.priceTomans, 15000);

    const all = await listAllShopPackages();
    assert.ok(all.some((p) => p.sku === 'diamond_pass'));
  });

  it('should reject duplicate SKU on create', async () => {
    await assert.rejects(async () => {
      await createShopPackage({
        sku: 'energy_refill',
        title: 'تکراری',
        priceTomans: 500,
      });
    }, /از قبل وجود دارد/);
  });

  it('should update an existing package', async () => {
    const updated = await updateShopPackage('energy_refill', {
      priceTomans: 1500,
      badge: 'تخفیف ویژه',
    });

    assert.strictEqual(updated.priceTomans, 1500);
    assert.strictEqual(updated.badge, 'تخفیف ویژه');

    const pkg = await getShopPackageBySku('energy_refill');
    assert.strictEqual(pkg?.priceTomans, 1500);
  });

  it('should toggle active status and filter inactive in public list', async () => {
    await updateShopPackage('energy_refill', {
      isActive: false,
    });

    const publicList = await listPublicShopPackages();
    assert.ok(!publicList.some((p) => p.sku === 'energy_refill'));

    const allList = await listAllShopPackages();
    assert.ok(allList.some((p) => p.sku === 'energy_refill'));
  });

  it('should delete a package', async () => {
    const created = await createShopPackage({
      sku: 'temp_pack',
      title: 'بسته موقت',
      priceTomans: 100,
    });

    await deleteShopPackage(created.id);
    const pkg = await getShopPackageBySku('temp_pack');
    assert.strictEqual(pkg, null);
  });
});
