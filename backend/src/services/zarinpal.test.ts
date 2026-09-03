import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  setZarinpalMemory,
  resetPaymentMemStoreForTest,
  createPaymentRecord,
  applyPackageRewardToPlayer,
  verifyZarinpalPayment,
  listAdminPayments,
  getAdminPaymentStats,
} from './zarinpal';
import {
  setShopPackagesMemory,
  resetMemStoreForTest,
  ensureShopPackageSeeds,
} from './shopPackages';
import { setUseMemory, getOrCreatePlayer, resetPlayerMemStoreForTest } from './gameState';

describe('Zarinpal Payment & Rewards Service', () => {
  const testDeviceId = 'test-player-device-123';

  beforeEach(async () => {
    setZarinpalMemory(true);
    setShopPackagesMemory(true);
    setUseMemory(true);
    resetPaymentMemStoreForTest();
    resetMemStoreForTest();
    resetPlayerMemStoreForTest?.();
    await ensureShopPackageSeeds();
  });

  it('should create payment transaction in pending state', async () => {
    const tx = await createPaymentRecord({
      authority: 'A00000000000000000000000000000000001',
      amountTomans: 2000,
      sku: 'gold_200',
      skuTitle: 'کیسه سکه (۲۰۰ طلا)',
      deviceId: testDeviceId,
    });

    assert.strictEqual(tx.authority, 'A00000000000000000000000000000000001');
    assert.strictEqual(tx.status, 'pending');
    assert.strictEqual(tx.amountTomans, 2000);
  });

  it('should apply gold reward to player', async () => {
    const playerBefore = await getOrCreatePlayer(testDeviceId);
    const initialGold = playerBefore.stats.gold || 0;

    const { player, rewardSummary } = await applyPackageRewardToPlayer(testDeviceId, 'gold_200');

    assert.strictEqual(player.stats.gold, initialGold + 200);
    assert.ok(rewardSummary.includes('طلا'));
  });

  it('should apply full energy refill reward to player', async () => {
    const player = await getOrCreatePlayer(testDeviceId);
    player.stats.energy = 0;

    const { player: updatedPlayer } = await applyPackageRewardToPlayer(testDeviceId, 'energy_refill');

    assert.strictEqual(updatedPlayer.stats.energy, updatedPlayer.stats.maxEnergy);
  });

  it('should apply unlock full ui non-consumable reward', async () => {
    const { player } = await applyPackageRewardToPlayer(testDeviceId, 'unlock_full_ui');

    assert.strictEqual(player.unlockedFullUi, true);
    assert.ok(player.purchasedSkus.includes('unlock_full_ui'));
    assert.ok(player.playDayCount >= 3);
  });

  it('should apply hp_elixir full health reward', async () => {
    const player = await getOrCreatePlayer(testDeviceId);
    player.stats.hp = 10;
    player.stats.maxHp = 120;

    const { player: updatedPlayer, rewardSummary } = await applyPackageRewardToPlayer(testDeviceId, 'hp_elixir');

    assert.strictEqual(updatedPlayer.stats.hp, 120);
    assert.ok(rewardSummary.includes('جان'));
  });

  it('should apply mana_potion full mana reward', async () => {
    const player = await getOrCreatePlayer(testDeviceId);
    player.stats.mana = 5;
    player.stats.maxMana = 60;

    const { player: updatedPlayer, rewardSummary } = await applyPackageRewardToPlayer(testDeviceId, 'mana_potion');

    assert.strictEqual(updatedPlayer.stats.mana, 60);
    assert.ok(rewardSummary.includes('مانا'));
  });

  it('should apply starter_bundle combo reward (energy + hp + gold)', async () => {
    const player = await getOrCreatePlayer(testDeviceId);
    player.stats.energy = 0;
    player.stats.hp = 20;
    player.stats.maxHp = 100;
    const goldBefore = player.stats.gold || 0;

    const { player: updatedPlayer, rewardSummary } = await applyPackageRewardToPlayer(testDeviceId, 'starter_bundle');

    assert.strictEqual(updatedPlayer.stats.energy, updatedPlayer.stats.maxEnergy);
    assert.strictEqual(updatedPlayer.stats.hp, 100);
    assert.strictEqual(updatedPlayer.stats.gold, goldBefore + 300);
    assert.ok(rewardSummary.includes('بسته بقای ماجراجو'));
  });

  it('should apply energy_pack_large bonus energy amount reward', async () => {
    const player = await getOrCreatePlayer(testDeviceId);
    player.stats.energy = 5;

    const { player: updatedPlayer } = await applyPackageRewardToPlayer(testDeviceId, 'energy_pack_large');

    assert.strictEqual(updatedPlayer.stats.energy, 5 + 25);
  });

  it('should mark payment as cancelled if statusQuery is NOK', async () => {
    const authority = 'A00000000000000000000000000000000002';
    await createPaymentRecord({
      authority,
      amountTomans: 5000,
      sku: 'gold_600',
      skuTitle: 'صندوقچه سکه',
      deviceId: testDeviceId,
    });

    const result = await verifyZarinpalPayment({
      authority,
      statusQuery: 'NOK',
    });

    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.transaction?.status, 'cancelled');
  });

  it('should list admin payments and calculate payment stats', async () => {
    const tx1 = await createPaymentRecord({
      authority: 'AUTH-1',
      amountTomans: 1000,
      sku: 'energy_refill',
      skuTitle: 'پر کردن انرژی',
      deviceId: testDeviceId,
    });

    const tx2 = await createPaymentRecord({
      authority: 'AUTH-2',
      amountTomans: 2000,
      sku: 'gold_200',
      skuTitle: 'کیسه سکه',
      deviceId: testDeviceId,
    });

    // Simulate tx1 paid
    (tx1 as any).status = 'paid';
    const list = await listAdminPayments({});
    assert.strictEqual(list.total, 2);

    const stats = await getAdminPaymentStats();
    assert.strictEqual(stats.pendingCount, 2);
  });
});
