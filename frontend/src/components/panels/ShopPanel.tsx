import { useMemo, useState } from 'react';
import type { GameState, ShopSku } from '../../types/game';
import { t } from '../../utils/i18n';
import { ReferralPanel } from './ReferralPanel';
import {
  IconBolt,
  IconCart,
  IconCheck,
  IconChevronDown,
  IconCoin,
  IconFlask,
  IconHeart,
  IconSparkles,
} from '../icons';
type ShopCategory = 'all' | 'energy' | 'gold' | 'special';

// Fallback catalog in case server returns empty list
const FALLBACK_ITEMS: ShopSku[] = [
  {
    sku: 'energy_refill',
    title: 'پر کردن کامل انرژی',
    titleEn: 'Full Energy Refill',
    description: 'انرژی را کامل پر می‌کند و خستگی را برطرف می‌سازد',
    descriptionEn: 'Instantly restores your energy to maximum capacity',
    priceTomans: 2000,
    type: 'consumable',
    rewardType: 'energy_refill',
    badge: 'ضروری',
    badgeEn: 'Essential',
    sortOrder: 1,
    isActive: true,
  },
  {
    sku: 'energy_pack_large',
    title: 'معجون انرژی مضاعف (+۲۵ انرژی)',
    titleEn: 'Grand Energy Elixir (+25 Energy)',
    description: '۲۵ واحد انرژی فوری و مازاد بر ظرفیت برای ادامه بی‌وقفه ماجراجویی',
    descriptionEn: 'Instantly adds +25 bonus energy beyond your maximum limit',
    priceTomans: 6000,
    type: 'consumable',
    rewardType: 'energy_amount',
    rewardValue: 25,
    badge: 'انرژی اضافه',
    badgeEn: 'Bonus Energy',
    sortOrder: 2,
    isActive: true,
  },
  {
    sku: 'hp_elixir',
    title: 'اکسیر حیات (درمان کامل جان)',
    titleEn: 'Elixir of Life (Full HP Refill)',
    description: 'جان قهرمان را کامل احیا کرده و اثرات آسیب‌ها و خستگی را برطرف می‌سازد',
    descriptionEn: 'Fully restores hero HP and removes all battle wounds',
    priceTomans: 3000,
    type: 'consumable',
    rewardType: 'hp_refill',
    badge: 'حیاتی',
    badgeEn: 'Life Saver',
    sortOrder: 3,
    isActive: true,
  },
  {
    sku: 'mana_potion',
    title: 'معجون جوهره جادو (شارژ کامل مانا)',
    titleEn: 'Essence of Magic (Full Mana Refill)',
    description: 'حوضچه جادوی قهرمان را پر می‌کند تا آماده اجرای طلسم‌های سنگین باشید',
    descriptionEn: 'Fully replenishes your mana pool for powerful spells',
    priceTomans: 3000,
    type: 'consumable',
    rewardType: 'mana_refill',
    badge: 'جادو',
    badgeEn: 'Magic',
    sortOrder: 4,
    isActive: true,
  },
  {
    sku: 'gold_200',
    title: 'کیسه سکه (۲۰۰ طلا)',
    titleEn: 'Coin Pouch (200 Gold)',
    description: '۲۰۰ سکه طلا برای خرید تجهیزات و ارتقای بازی',
    descriptionEn: '200 gold coins for purchasing gear and upgrades',
    priceTomans: 4000,
    type: 'consumable',
    rewardType: 'gold',
    rewardValue: 200,
    badge: 'محبوب',
    badgeEn: 'Popular',
    sortOrder: 5,
    isActive: true,
  },
  {
    sku: 'gold_600',
    title: 'صندوقچه سکه (۶۰۰ طلا)',
    titleEn: 'Chest of Gold (600 Gold)',
    description: '۶۰۰ سکه طلا با تخفیف ویژه به همراه پاداش ماجراجو',
    descriptionEn: '600 gold coins with special value discount',
    priceTomans: 10000,
    type: 'consumable',
    rewardType: 'gold',
    rewardValue: 600,
    badge: 'بهترین ارزش',
    badgeEn: 'Best Value',
    sortOrder: 6,
    isActive: true,
  },
  {
    sku: 'gold_1500',
    title: 'خزانه سلطنتی طلا (۱,۵۰۰ طلا)',
    titleEn: 'Royal Treasury (1,500 Gold)',
    description: 'ثروتی عظیم شامل ۱۵۰۰ سکه طلا برای خرید آزادانه نایاب‌ترین تجهیزات',
    descriptionEn: 'A fortune of 1,500 gold coins for elite equipment and upgrades',
    priceTomans: 20000,
    type: 'consumable',
    rewardType: 'gold',
    rewardValue: 1500,
    badge: 'ویژه ثروتمندان',
    badgeEn: 'VIP Wealth',
    sortOrder: 7,
    isActive: true,
  },
  {
    sku: 'starter_bundle',
    title: 'بسته بقای ماجراجو (Starter Bundle)',
    titleEn: 'Adventurer Survival Kit (Starter Bundle)',
    description: 'بسته جامع: شارژ ۱۰۰٪ انرژی + درمان کامل جان (HP) + ۳۰۰ سکه طلا با تخفیف ۵۰٪',
    descriptionEn: 'Complete pack: Full Energy + Full HP Heal + 300 Gold Coins at 50% discount',
    priceTomans: 8000,
    type: 'consumable',
    rewardType: 'starter_bundle',
    rewardValue: 300,
    badge: 'پیشنهاد طلایی',
    badgeEn: 'Golden Offer',
    sortOrder: 8,
    isActive: true,
  },
  {
    sku: 'scenario_kavir',
    title: 'سناریو: شن‌های کویر',
    titleEn: 'Scenario: Desert Sands',
    description: 'باز کردن سناریو و ماجرای رازآلود کویر سوزان',
    descriptionEn: 'Unlock the special Desert Sands adventure scenario',
    priceTomans: 10000,
    type: 'non_consumable',
    rewardType: 'scenario',
    rewardValue: 'desert_spirit',
    badge: 'داستان ویژه',
    badgeEn: 'Special Story',
    sortOrder: 9,
    isActive: true,
  },
  {
    sku: 'unlock_full_ui',
    title: 'باز کردن رابط کاربری کامل',
    titleEn: 'Unlock Full UI',
    description: 'دسترسی فوری به تمامی بخش‌های بازی بدون نیاز به صبر ۳ روزه',
    descriptionEn: 'Instant access to all game tabs without waiting 3 days',
    priceTomans: 4000,
    type: 'non_consumable',
    rewardType: 'unlock_full_ui',
    badge: 'ویژه',
    badgeEn: 'Feature',
    sortOrder: 10,
    isActive: true,
  },
];

function getPackageMeta(item: ShopSku) {
  const sku = item.sku;
  if (sku === 'energy_refill') {
    return { icon: '⚡️', accent: 'border-amber/40 bg-amber-950/10' };
  }
  if (sku === 'energy_pack_large') {
    return { icon: '⚡️', accent: 'border-amber/50 bg-amber-950/20' };
  }
  if (sku === 'hp_elixir') {
    return { icon: '💖', accent: 'border-rose-500/40 bg-rose-950/20' };
  }
  if (sku === 'mana_potion') {
    return { icon: '🧪', accent: 'border-sky-500/40 bg-sky-950/20' };
  }
  if (sku === 'gold_200') {
    return { icon: '🪙', accent: 'border-amber/40 bg-amber-950/10' };
  }
  if (sku === 'gold_600') {
    return { icon: '💰', accent: 'border-amber/50 bg-amber-950/20' };
  }
  if (sku === 'gold_1500') {
    return { icon: '👑', accent: 'border-yellow-500/50 bg-yellow-950/30' };
  }
  if (sku === 'starter_bundle') {
    return { icon: '🎁', accent: 'border-amber/60 bg-gradient-to-r from-amber-950/30 to-amber-900/10' };
  }
  if (sku === 'scenario_kavir') {
    return { icon: '📜', accent: 'border-orange-500/40 bg-orange-950/20' };
  }
  if (sku === 'unlock_full_ui') {
    return { icon: '🔓', accent: 'border-indigo-500/40 bg-indigo-950/20' };
  }
  return { icon: '✨', accent: 'border-amber/30 bg-panel' };
}

export function ShopPanel({
  items,
  state,
  busy,
  onBuy,
  onWatchAd,
  onRestore,
}: {
  items: ShopSku[];
  state: GameState;
  busy: boolean;
  onBuy: (sku: string) => void | Promise<void>;
  onWatchAd: () => void;
  onRestore: (saveCode: string) => Promise<boolean>;
}) {
  const [category, setCategory] = useState<ShopCategory>('all');
  const [purchasingSku, setPurchasingSku] = useState<string | null>(null);

  // Backup & Restore state
  const [copied, setCopied] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoring, setRestoring] = useState(false);

  const lang = state.language || 'fa';
  const isEn = lang === 'en';

  const shopItems = items && items.length > 0 ? items : FALLBACK_ITEMS;

  const filteredItems = useMemo(() => {
    return shopItems.filter((item) => {
      if (category === 'all') return true;
      const sku = item.sku;
      const rType = item.rewardType;

      if (category === 'energy') {
        return (
          sku.startsWith('energy') ||
          sku.startsWith('hp_') ||
          sku.startsWith('mana_') ||
          rType === 'energy_refill' ||
          rType === 'energy_amount' ||
          rType === 'hp_refill' ||
          rType === 'mana_refill'
        );
      }
      if (category === 'gold') {
        return sku.startsWith('gold') || rType === 'gold';
      }
      if (category === 'special') {
        return (
          sku.startsWith('starter') ||
          sku.startsWith('scenario') ||
          sku.startsWith('unlock') ||
          rType === 'starter_bundle' ||
          rType === 'scenario' ||
          rType === 'unlock_full_ui'
        );
      }
      return true;
    });
  }, [shopItems, category]);

  const handleBuy = async (sku: string) => {
    if (busy || purchasingSku) return;
    setPurchasingSku(sku);
    try {
      await onBuy(sku);
    } finally {
      setPurchasingSku(null);
    }
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(state.deviceId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt(isEn ? 'Copy save code:' : 'کد ذخیره را کپی کن:', state.deviceId);
    }
  };

  const handleRestore = async () => {
    const code = restoreCode.trim();
    if (code.length < 8 || restoring || busy) return;
    setRestoring(true);
    try {
      const ok = await onRestore(code);
      if (ok) {
        setRestoreCode('');
        setRestoreOpen(false);
      }
    } finally {
      setRestoring(false);
    }
  };

  const { stats, featureUnlocks } = state;
  const unlocks = featureUnlocks || { hp: false, mana: false, gold: false };

  return (
    <div className="space-y-4 px-4 py-4 pb-12">
      {/* Shop Header Banner */}
      <header className="rounded-2xl border border-amber/40 bg-gradient-to-b from-amber-950/30 via-panel to-panel p-4 shadow-[0_0_15px_rgba(245,158,11,0.08)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber/50 bg-amber/10 text-amber shadow-[0_0_8px_rgba(245,158,11,0.2)]">
              <IconCart size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink flex items-center gap-1.5">
                {t('shopTitle', lang)}
                <span className="text-[10px] rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-amber font-mono">
                  {t('paymentGateway', lang)}
                </span>
              </h2>
              <p className="text-xs text-ink-muted leading-tight mt-0.5">
                {t('shopSubtitle', lang)}
              </p>
            </div>
          </div>
        </div>

        {/* Hero Current Resources Status Bar */}
        <div className="mt-3.5 flex flex-wrap items-center justify-around gap-2 rounded-xl border border-line/60 bg-oled/80 px-3 py-2 text-xs">
          <span className="inline-flex items-center gap-1.5 text-amber font-medium font-mono">
            <IconBolt size={14} className="text-amber drop-shadow-[0_0_4px_#f59e0b]" />
            <span className="text-ink-muted text-[11px] font-sans">{t('energy', lang)}:</span>
            {stats.energy}/{stats.maxEnergy}
          </span>

          {unlocks.gold && (
            <>
              <span className="text-line">|</span>
              <span className="inline-flex items-center gap-1.5 text-amber font-medium font-mono">
                <IconCoin size={14} className="text-amber" />
                <span className="text-ink-muted text-[11px] font-sans">{t('gold', lang)}:</span>
                {isEn ? stats.gold.toLocaleString('en-US') : stats.gold.toLocaleString('fa-IR')}
              </span>
            </>
          )}

          {unlocks.hp && (
            <>
              <span className="text-line">|</span>
              <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium font-mono">
                <IconHeart size={14} className="text-rose-400" />
                <span className="text-ink-muted text-[11px] font-sans">{t('hp', lang)}:</span>
                {stats.hp}/{stats.maxHp}
              </span>
            </>
          )}

          {unlocks.mana && (
            <>
              <span className="text-line">|</span>
              <span className="inline-flex items-center gap-1.5 text-sky-400 font-medium font-mono">
                <IconFlask size={14} className="text-sky-400" />
                <span className="text-ink-muted text-[11px] font-sans">{t('mana', lang)}:</span>
                {stats.mana}/{stats.maxMana}
              </span>
            </>
          )}
        </div>
      </header>

      {/* Free Daily Energy Ad Offer */}
      <button
        type="button"
        disabled={busy}
        onClick={onWatchAd}
        className="w-full group rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-right transition hover:border-emerald-500/70 hover:bg-emerald-950/30 disabled:opacity-40"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📺</span>
            <div className="text-start">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-emerald-300">
                  {t('shopFreeDailyOffer', lang)}
                </p>
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                  {isEn ? 'FREE' : 'رایگان'}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-muted">
                {t('shopFreeEnergyDesc', lang)}
              </p>
            </div>
          </div>
          <span className="rounded-lg border border-emerald-500/50 bg-emerald-900/40 px-3 py-1.5 text-xs font-medium text-emerald-300 transition group-hover:bg-emerald-900/60 shrink-0">
            {t('watchAdButton', lang)}
          </span>
        </div>
      </button>

      {/* Categories Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={`shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
            category === 'all'
              ? 'bg-amber text-oled font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'border border-line bg-panel text-ink-muted hover:text-ink'
          }`}
        >
          {t('shopCategoryAll', lang)}
        </button>
        <button
          type="button"
          onClick={() => setCategory('energy')}
          className={`shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
            category === 'energy'
              ? 'bg-amber text-oled font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'border border-line bg-panel text-ink-muted hover:text-ink'
          }`}
        >
          {t('shopCategoryEnergy', lang)}
        </button>
        <button
          type="button"
          onClick={() => setCategory('gold')}
          className={`shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
            category === 'gold'
              ? 'bg-amber text-oled font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'border border-line bg-panel text-ink-muted hover:text-ink'
          }`}
        >
          {t('shopCategoryGold', lang)}
        </button>
        <button
          type="button"
          onClick={() => setCategory('special')}
          className={`shrink-0 rounded-lg px-3 py-1.5 font-medium transition ${
            category === 'special'
              ? 'bg-amber text-oled font-bold shadow-[0_0_8px_rgba(245,158,11,0.3)]'
              : 'border border-line bg-panel text-ink-muted hover:text-ink'
          }`}
        >
          {t('shopCategorySpecial', lang)}
        </button>
      </div>

      {/* Empty Filter State */}
      {filteredItems.length === 0 && (
        <div className="rounded-xl border border-line bg-panel p-8 text-center text-ink-muted">
          <p className="text-2xl mb-2">🛍️</p>
          <p className="text-xs">{t('shopEmpty', lang)}</p>
        </div>
      )}

      {/* Shop Packages Grid */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const owned =
            item.type === 'non_consumable' && state.purchasedSkus.includes(item.sku);
          const isBuying = purchasingSku === item.sku;
          const meta = getPackageMeta(item);
          const title = isEn && item.titleEn ? item.titleEn : item.title;
          const description = isEn && item.descriptionEn ? item.descriptionEn : item.description;
          const badge = isEn && item.badgeEn ? item.badgeEn : item.badge;

          return (
            <div
              key={item.sku}
              className={`relative overflow-hidden rounded-xl border p-4 transition ${meta.accent} ${
                owned ? 'opacity-70 border-line' : 'hover:border-amber/70'
              }`}
            >
              {/* Corner Badge */}
              {badge && (
                <span
                  className={`absolute top-0 ${
                    isEn ? 'right-0 rounded-bl-lg' : 'left-0 rounded-br-lg'
                  } border-b border-amber/50 bg-amber/20 px-2 py-0.5 text-[10px] font-bold text-amber shadow-sm`}
                >
                  {badge}
                </span>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0 drop-shadow-sm select-none">
                    {meta.icon}
                  </span>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                      {title}
                    </h3>
                    <p className="text-xs leading-5 text-ink-muted">
                      {description}
                    </p>

                    {/* Specific Rewards Highlight */}
                    {item.rewardType === 'gold' && item.rewardValue && (
                      <p className="text-[11px] font-mono text-amber font-semibold">
                        +{Number(item.rewardValue).toLocaleString(isEn ? 'en-US' : 'fa-IR')}{' '}
                        {isEn ? 'Gold Coins' : 'سکه طلا'}
                      </p>
                    )}
                    {item.rewardType === 'energy_amount' && item.rewardValue && (
                      <p className="text-[11px] font-mono text-amber font-semibold">
                        +{item.rewardValue} {t('energy', lang)}
                      </p>
                    )}
                    {item.rewardType === 'hp_refill' && (
                      <p className="text-[11px] font-mono text-rose-400 font-semibold">
                        {isEn ? 'Full HP Restore (100%)' : 'درمان ۱۰۰٪ جان قهرمان'}
                      </p>
                    )}
                    {item.rewardType === 'mana_refill' && (
                      <p className="text-[11px] font-mono text-sky-400 font-semibold">
                        {isEn ? 'Full Mana Replenished' : 'شارژ کامل ظرفیت مانا'}
                      </p>
                    )}
                    {item.rewardType === 'starter_bundle' && (
                      <p className="text-[11px] font-mono text-amber font-semibold">
                        {isEn
                          ? 'Full Energy + Full HP + 300 Gold'
                          : 'انرژی کامل + جان کامل + ۳۰۰ سکه'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Price and Action Button */}
                <div className="shrink-0 text-left self-center">
                  {owned ? (
                    <span className="inline-flex items-center gap-1 rounded-lg border border-line bg-oled px-3 py-1.5 text-xs text-ink-muted">
                      <IconCheck size={14} className="text-emerald-400" />
                      {t('purchasedBadge', lang)}
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy || isBuying}
                      onClick={() => void handleBuy(item.sku)}
                      className="group flex flex-col items-center justify-center min-w-[5.5rem] rounded-xl border border-amber/60 bg-amber/10 px-3 py-2 text-center transition hover:bg-amber hover:text-oled disabled:opacity-40"
                    >
                      <span className="font-mono text-xs font-bold text-amber group-hover:text-oled">
                        {isEn
                          ? `${item.priceTomans.toLocaleString('en-US')} T`
                          : `${item.priceTomans.toLocaleString('fa-IR')} تومان`}
                      </span>
                      <span className="text-[10px] text-ink-muted group-hover:text-oled/80 mt-0.5">
                        {isBuying ? (isEn ? 'Connecting...' : 'در حال انتقال...') : t('buyButton', lang)}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible Utility & Backup Section (Save Code + Referral) */}
      <section className="mt-8 rounded-2xl border border-line/60 bg-panel overflow-hidden">
        <button
          type="button"
          onClick={() => setUtilitiesOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-medium text-ink-dim hover:text-ink transition"
        >
          <div className="flex items-center gap-2">
            <IconSparkles size={16} className="text-amber" />
            <span>{t('shopBackupAndReferrals', lang)}</span>
          </div>
          <IconChevronDown
            size={16}
            className={`transition-transform duration-200 ${utilitiesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {utilitiesOpen && (
          <div className="space-y-4 border-t border-line/50 p-4">
            {/* Save Code Backup & Restore */}
            <div className={`space-y-2 text-xs ${isEn ? 'text-left' : 'text-right'}`}>
              <p className="font-semibold text-amber">{t('saveCodeLabel', lang)}</p>
              <p className="text-ink-muted text-[11px] leading-5">
                {t('saveCodeDescription', lang)}
              </p>
              <p
                className="break-all rounded-lg border border-line bg-oled px-3 py-2 font-mono text-[11px] text-ink text-left"
                dir="ltr"
              >
                {state.deviceId}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="flex-1 rounded-lg border border-amber/50 py-1.5 text-xs text-amber transition hover:bg-amber/10"
                >
                  {copied ? t('copied', lang) : t('copySaveCode', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreOpen((v) => !v)}
                  className="flex-1 rounded-lg border border-line py-1.5 text-xs text-ink-dim hover:text-ink transition"
                >
                  {restoreOpen ? (isEn ? 'Close' : 'بستن') : t('restoreSaveCode', lang)}
                </button>
              </div>

              {restoreOpen && (
                <div className="mt-3 space-y-2 border-t border-line pt-3">
                  <p className="text-[11px] text-ink-muted">
                    {t('restoreModalHint', lang)}
                  </p>
                  <input
                    value={restoreCode}
                    onChange={(e) => setRestoreCode(e.target.value)}
                    placeholder={t('restoreInputPlaceholder', lang)}
                    disabled={busy || restoring}
                    dir="ltr"
                    className="w-full rounded-lg border border-line bg-oled px-3 py-2 text-left font-mono text-xs text-ink outline-none focus:border-amber/50"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    disabled={busy || restoring || restoreCode.trim().length < 8}
                    onClick={() => void handleRestore()}
                    className="w-full rounded-lg border border-amber/50 py-2 text-xs text-amber disabled:opacity-40"
                  >
                    {restoring
                      ? isEn
                        ? 'Loading...'
                        : 'در حال بارگذاری...'
                      : t('restoreButton', lang)}
                  </button>
                </div>
              )}
            </div>

            {/* Referral Section */}
            <div className="border-t border-line/40 pt-3">
              <ReferralPanel language={lang} referralCode={state.referralCode || ''} />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
