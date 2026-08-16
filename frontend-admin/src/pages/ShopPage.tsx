import { useEffect, useState } from 'react';
import { adminApi } from '../api';
import type {
  PaymentStats,
  PaymentTransactionItem,
  ShopPackageItem,
  ShopPackageType,
  ShopRewardType,
} from '../types';

const REWARD_TYPE_LABELS: Record<ShopRewardType, string> = {
  energy_refill: 'شارژ کامل انرژی',
  energy_amount: 'مقدار مشخص انرژی',
  gold: 'سکه طلا',
  unlock_full_ui: 'باز کردن رابط کاربری',
  scenario: 'سناریوی داستانی ویژه',
  custom: 'سفارشی',
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: 'پرداخت موفق', color: 'bg-emerald-950 text-emerald-300 border-emerald-800/60' },
  pending: { label: 'در انتظار پرداخت', color: 'bg-amber-950 text-amber-300 border-amber-800/60' },
  failed: { label: 'ناموفق', color: 'bg-red-950 text-red-300 border-red-800/60' },
  cancelled: { label: 'لغو شده توسط کاربر', color: 'bg-stone-900 text-stone-400 border-stone-700/60' },
};

export function ShopPage() {
  const [packages, setPackages] = useState<ShopPackageItem[]>([]);
  const [payments, setPayments] = useState<PaymentTransactionItem[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'packages' | 'payments' | 'gateway'>('packages');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<ShopPackageItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    title: '',
    titleEn: '',
    description: '',
    descriptionEn: '',
    priceTomans: 1000,
    type: 'consumable' as ShopPackageType,
    rewardType: 'energy_refill' as ShopRewardType,
    rewardValue: '',
    badge: '',
    badgeEn: '',
    sortOrder: 1,
    isActive: true,
  });

  // Payments filter
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [paymentPage, setPaymentPage] = useState<number>(1);
  const [paymentsTotal, setPaymentsTotal] = useState<number>(0);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pkgRes, statsRes] = await Promise.all([
        adminApi.listShopPackages(),
        adminApi.getPaymentStats(),
      ]);
      setPackages(pkgRes.items || []);
      setStats(statsRes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await adminApi.listPayments({
        status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        page: paymentPage,
        limit: 25,
      });
      setPayments(res.items || []);
      setPaymentsTotal(res.total || 0);
    } catch (err) {
      console.error('Error loading payments:', err);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'payments') {
      void loadPayments();
    }
  }, [activeTab, paymentStatusFilter, paymentPage]);

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormData({
      sku: '',
      title: '',
      titleEn: '',
      description: '',
      descriptionEn: '',
      priceTomans: 2000,
      type: 'consumable',
      rewardType: 'gold',
      rewardValue: '200',
      badge: '',
      badgeEn: '',
      sortOrder: packages.length + 1,
      isActive: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (pkg: ShopPackageItem) => {
    setEditingPkg(pkg);
    setFormData({
      sku: pkg.sku,
      title: pkg.title,
      titleEn: pkg.titleEn || '',
      description: pkg.description || '',
      descriptionEn: pkg.descriptionEn || '',
      priceTomans: pkg.priceTomans,
      type: pkg.type,
      rewardType: pkg.rewardType,
      rewardValue: pkg.rewardValue != null ? String(pkg.rewardValue) : '',
      badge: pkg.badge || '',
      badgeEn: pkg.badgeEn || '',
      sortOrder: pkg.sortOrder || 0,
      isActive: pkg.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('عنوان بسته الزامی است');
      return;
    }
    if (!editingPkg && !formData.sku.trim()) {
      alert('شناسه (SKU) الزامی است');
      return;
    }

    try {
      setSaving(true);
      const parsedRewardVal =
        formData.rewardType === 'gold' || formData.rewardType === 'energy_amount'
          ? Number(formData.rewardValue) || 0
          : formData.rewardValue.trim() || null;

      if (editingPkg) {
        await adminApi.updateShopPackage(editingPkg.id, {
          title: formData.title,
          titleEn: formData.titleEn,
          description: formData.description,
          descriptionEn: formData.descriptionEn,
          priceTomans: Number(formData.priceTomans),
          type: formData.type,
          rewardType: formData.rewardType,
          rewardValue: parsedRewardVal,
          badge: formData.badge,
          badgeEn: formData.badgeEn,
          sortOrder: Number(formData.sortOrder),
          isActive: formData.isActive,
        });
      } else {
        await adminApi.createShopPackage({
          sku: formData.sku.trim(),
          title: formData.title,
          titleEn: formData.titleEn,
          description: formData.description,
          descriptionEn: formData.descriptionEn,
          priceTomans: Number(formData.priceTomans),
          type: formData.type,
          rewardType: formData.rewardType,
          rewardValue: parsedRewardVal,
          badge: formData.badge,
          badgeEn: formData.badgeEn,
          sortOrder: Number(formData.sortOrder),
          isActive: formData.isActive,
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (pkg: ShopPackageItem) => {
    try {
      await adminApi.updateShopPackage(pkg.id, {
        isActive: !pkg.isActive,
      });
      await loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (pkg: ShopPackageItem) => {
    if (!window.confirm(`آیا از حذف بسته «${pkg.title}» مطمئن هستید؟`)) return;
    try {
      await adminApi.deleteShopPackage(pkg.id);
      await loadData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header & Metric Highlights */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink">فروشگاه و درگاه پرداخت</h2>
          <p className="mt-1 text-sm text-ink-dim">
            مدیریت بسته‌های قابل خرید بازی و رهگیری تراکنش‌های زرین‌پال
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-stone-950 shadow-sm transition hover:bg-amber/90"
          >
            + بسته جدید
          </button>
          <button
            type="button"
            onClick={() => {
              void loadData();
              if (activeTab === 'payments') void loadPayments();
            }}
            className="rounded-lg border border-line bg-sand-2 px-3 py-2 text-sm text-ink-dim hover:text-ink"
          >
            بروزرسانی
          </button>
        </div>
      </div>

      {/* Revenue Summary Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs text-ink-dim">مجموع درآمد زرین‌پال</p>
            <p className="mt-2 font-mono text-xl font-bold text-emerald-400">
              {stats.totalRevenueTomans.toLocaleString('fa-IR')} <span className="text-xs text-ink-muted">تومان</span>
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs text-ink-dim">خریدهای موفق</p>
            <p className="mt-2 font-mono text-xl font-bold text-ink">
              {stats.paidCount.toLocaleString('fa-IR')} <span className="text-xs text-ink-muted">تراکنش</span>
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs text-ink-dim">در انتظار / لغو شده</p>
            <p className="mt-2 font-mono text-xl font-bold text-amber-400">
              {(stats.pendingCount + stats.cancelledCount).toLocaleString('fa-IR')}
            </p>
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="text-xs text-ink-dim">میانگین هر سفارش</p>
            <p className="mt-2 font-mono text-xl font-bold text-ink">
              {stats.averageOrderTomans.toLocaleString('fa-IR')} <span className="text-xs text-ink-muted">تومان</span>
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-800/50 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-line gap-4 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('packages')}
          className={`pb-3 font-medium transition ${
            activeTab === 'packages'
              ? 'border-b-2 border-amber text-amber'
              : 'text-ink-dim hover:text-ink'
          }`}
        >
          مدیریت بسته‌های فروشگاه ({packages.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`pb-3 font-medium transition ${
            activeTab === 'payments'
              ? 'border-b-2 border-amber text-amber'
              : 'text-ink-dim hover:text-ink'
          }`}
        >
          تاریخچه تراکنش‌ها {paymentsTotal > 0 ? `(${paymentsTotal})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('gateway')}
          className={`pb-3 font-medium transition ${
            activeTab === 'gateway'
              ? 'border-b-2 border-amber text-amber'
              : 'text-ink-dim hover:text-ink'
          }`}
        >
          تنظیمات درگاه زرین‌پال
        </button>
      </div>

      {/* TAB 1: SHOP PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-4">
          {loading && packages.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-dim">در حال بارگذاری بسته‌ها...</p>
          ) : packages.length === 0 ? (
            <div className="rounded-xl border border-line bg-panel p-8 text-center">
              <p className="text-sm text-ink-dim">هیچ بسته‌ای در فروشگاه تعریف نشده است.</p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-3 rounded-lg bg-amber px-4 py-2 text-xs font-medium text-stone-950"
              >
                ایجاد اولین بسته
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-panel">
              <table className="w-full text-right text-xs">
                <thead className="border-b border-line bg-sand-2 text-ink-dim">
                  <tr>
                    <th className="p-3">ترتیب</th>
                    <th className="p-3">شناسه (SKU)</th>
                    <th className="p-3">عنوان بسته</th>
                    <th className="p-3">قیمت (تومان)</th>
                    <th className="p-3">نوع پاداش</th>
                    <th className="p-3">نوع مصرف</th>
                    <th className="p-3">برچسب</th>
                    <th className="p-3">وضعیت</th>
                    <th className="p-3 text-left">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {packages.map((pkg) => (
                    <tr key={pkg.id} className="hover:bg-sand-2/50 transition">
                      <td className="p-3 font-mono text-ink-muted">{pkg.sortOrder}</td>
                      <td className="p-3 font-mono font-semibold text-amber">{pkg.sku}</td>
                      <td className="p-3">
                        <p className="font-medium text-ink">{pkg.title}</p>
                        {pkg.titleEn && <p className="text-[11px] text-ink-muted" dir="ltr">{pkg.titleEn}</p>}
                        {pkg.description && (
                          <p className="mt-0.5 max-w-xs truncate text-[11px] text-ink-dim">
                            {pkg.description}
                          </p>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-ink">
                        {pkg.priceTomans.toLocaleString('fa-IR')}
                      </td>
                      <td className="p-3">
                        <span className="rounded bg-sand-2 px-2 py-0.5 text-ink-dim">
                          {REWARD_TYPE_LABELS[pkg.rewardType] || pkg.rewardType}
                          {pkg.rewardValue != null && ` (${pkg.rewardValue})`}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-ink-muted">
                          {pkg.type === 'consumable' ? 'مصرفی' : 'دائمی (غیرمصرفی)'}
                        </span>
                      </td>
                      <td className="p-3">
                        {pkg.badge ? (
                          <span className="rounded-full border border-amber/50 bg-amber/10 px-2 py-0.5 text-[11px] text-amber">
                            {pkg.badge}
                          </span>
                        ) : (
                          <span className="text-ink-muted">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => void toggleActive(pkg)}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition ${
                            pkg.isActive
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : 'bg-stone-900 text-stone-400 border border-stone-700/60'
                          }`}
                        >
                          {pkg.isActive ? 'فعال' : 'غیرفعال'}
                        </button>
                      </td>
                      <td className="p-3 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(pkg)}
                            className="rounded border border-line px-2 py-1 text-[11px] text-ink-dim hover:border-amber hover:text-amber"
                          >
                            ویرایش
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(pkg)}
                            className="rounded border border-red-900/50 px-2 py-1 text-[11px] text-red-400 hover:bg-red-950"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENTS LOGS */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="filter-status" className="text-xs text-ink-dim">فیلتر وضعیت:</label>
              <select
                id="filter-status"
                value={paymentStatusFilter}
                onChange={(e) => {
                  setPaymentStatusFilter(e.target.value);
                  setPaymentPage(1);
                }}
                className="rounded-lg border border-line bg-sand-2 px-3 py-1.5 text-xs text-ink outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="paid">پرداخت‌های موفق</option>
                <option value="pending">در انتظار پرداخت</option>
                <option value="failed">ناموفق</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
            <p className="text-xs text-ink-muted">
              مجموع تراکنش‌ها: {paymentsTotal.toLocaleString('fa-IR')}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-line bg-panel">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-line bg-sand-2 text-ink-dim">
                <tr>
                  <th className="p-3">زمان</th>
                  <th className="p-3">شناسه درگاه (Authority)</th>
                  <th className="p-3">بسته</th>
                  <th className="p-3">شناسه بازیکن</th>
                  <th className="p-3">مبلغ</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">کد رهگیری / کارت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-ink-muted">
                      تراکنشی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  payments.map((tx) => {
                    const st = STATUS_LABELS[tx.status] || { label: tx.status, color: 'bg-sand-2 text-ink-dim' };
                    return (
                      <tr key={tx.id} className="hover:bg-sand-2/50 transition">
                        <td className="p-3 text-ink-muted whitespace-nowrap" dir="ltr">
                          {tx.createdAt ? new Date(tx.createdAt).toLocaleString('fa-IR') : '-'}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-amber break-all" dir="ltr">
                          {tx.authority}
                        </td>
                        <td className="p-3">
                          <p className="font-medium text-ink">{tx.skuTitle || tx.sku}</p>
                          <p className="font-mono text-[10px] text-ink-muted">{tx.sku}</p>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-ink-dim break-all" dir="ltr">
                          {tx.deviceId.slice(0, 16)}...
                        </td>
                        <td className="p-3 font-mono font-bold text-ink whitespace-nowrap">
                          {tx.amountTomans.toLocaleString('fa-IR')} تومان
                        </td>
                        <td className="p-3">
                          <span className={`inline-block rounded border px-2 py-0.5 text-[10px] ${st.color}`}>
                            {st.label}
                          </span>
                          {tx.errorMessage && (
                            <p className="mt-0.5 text-[10px] text-red-400">{tx.errorMessage}</p>
                          )}
                        </td>
                        <td className="p-3 text-ink-dim">
                          {tx.refId ? (
                            <p className="font-mono text-emerald-400 font-semibold" dir="ltr">
                              Ref: {tx.refId}
                            </p>
                          ) : (
                            <span className="text-ink-muted">-</span>
                          )}
                          {tx.cardPan && (
                            <p className="font-mono text-[10px] text-ink-muted" dir="ltr">
                              {tx.cardPan}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {paymentsTotal > 25 && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                disabled={paymentPage <= 1}
                onClick={() => setPaymentPage((p) => Math.max(1, p - 1))}
                className="rounded border border-line px-3 py-1 text-xs text-ink-dim disabled:opacity-40"
              >
                صفحه قبل
              </button>
              <span className="text-xs text-ink-muted">
                صفحه {paymentPage} از {Math.ceil(paymentsTotal / 25)}
              </span>
              <button
                type="button"
                disabled={paymentPage >= Math.ceil(paymentsTotal / 25)}
                onClick={() => setPaymentPage((p) => p + 1)}
                className="rounded border border-line px-3 py-1 text-xs text-ink-dim disabled:opacity-40"
              >
                صفحه بعد
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GATEWAY SETTINGS */}
      {activeTab === 'gateway' && (
        <div className="rounded-xl border border-line bg-panel p-6 space-y-4">
          <div className="border-b border-line pb-4">
            <h3 className="text-base font-semibold text-ink">مشخصات درگاه پرداخت زرین‌پال</h3>
            <p className="mt-1 text-xs text-ink-dim">
              درگاه پرداخت اینترنتی زرین‌پال نسخه ۴ (REST v4) برای تمامی خریدها و پرداخت‌های درون‌برنامه‌ای وب و PWA فعال است.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-lg border border-line bg-sand-2 p-3">
              <span className="text-ink-muted">کد پذیرنده (Merchant ID):</span>
              <p className="mt-1 font-mono text-amber font-semibold text-sm" dir="ltr">
                e4fe46b0-384d-4cd1-8aa1-d4bde5d2e511
              </p>
            </div>
            <div className="rounded-lg border border-line bg-sand-2 p-3">
              <span className="text-ink-muted">واحد پول درگاه:</span>
              <p className="mt-1 font-bold text-ink text-sm">
                تومان ایران (IRT)
              </p>
            </div>
            <div className="rounded-lg border border-line bg-sand-2 p-3">
              <span className="text-ink-muted">اندپوینت پرداخت (StartPay):</span>
              <p className="mt-1 font-mono text-ink-dim text-[11px]" dir="ltr">
                https://payment.zarinpal.com/pg/StartPay/:authority
              </p>
            </div>
            <div className="rounded-lg border border-line bg-sand-2 p-3">
              <span className="text-ink-muted">اندپوینت درخواست (Request):</span>
              <p className="mt-1 font-mono text-ink-dim text-[11px]" dir="ltr">
                POST https://payment.zarinpal.com/pg/v4/payment/request.json
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-4 text-xs text-emerald-300 leading-6">
            ✓ درگاه آماده اتصال و پردازش خریدهای واقعی بازیکنان است.
            کاربران به صورت خودکار پس از پرداخت به بازی برگشته و جوایز و بسته‌های خود را آنی تحویل می‌گیرند.
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-ink">
              {editingPkg ? `ویرایش بسته «${editingPkg.title}»` : 'ایجاد بسته جدید در فروشگاه'}
            </h3>
            <p className="mt-1 text-xs text-ink-dim">
              مشخصات بسته و نوع پاداشی که به بازیکن داده می‌شود را تعیین کنید.
            </p>

            <form onSubmit={handleSave} className="mt-4 space-y-4 text-xs">
              {/* SKU */}
              <div>
                <label className="block text-ink-dim mb-1">شناسه یکتا (SKU):</label>
                <input
                  type="text"
                  required
                  disabled={Boolean(editingPkg)}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="مثال: gold_1000 یا energy_boost"
                  dir="ltr"
                  className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 font-mono text-ink outline-none focus:border-amber disabled:opacity-50"
                />
              </div>

              {/* Title FA & EN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-dim mb-1">عنوان فارسی:*</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="مثال: کیسه ۱۰۰۰ سکه طلا"
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="block text-ink-dim mb-1">عنوان انگلیسی (اختیاری):</label>
                  <input
                    type="text"
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder="e.g. 1000 Gold Pouch"
                    dir="ltr"
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  />
                </div>
              </div>

              {/* Price & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-dim mb-1">قیمت (تومان):*</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.priceTomans}
                    onChange={(e) => setFormData({ ...formData, priceTomans: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 font-mono text-ink outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="block text-ink-dim mb-1">ترتیب نمایش (Sort Order):</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 font-mono text-ink outline-none focus:border-amber"
                  />
                </div>
              </div>

              {/* Type & Reward Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-dim mb-1">نوع بسته:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as ShopPackageType })}
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  >
                    <option value="consumable">مصرفی (چندبار قابل خرید)</option>
                    <option value="non_consumable">غیرمصرفی (یکبار خرید دائم)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-ink-dim mb-1">نوع پاداش به بازیکن:</label>
                  <select
                    value={formData.rewardType}
                    onChange={(e) => setFormData({ ...formData, rewardType: e.target.value as ShopRewardType })}
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  >
                    <option value="gold">سکه طلا (Gold)</option>
                    <option value="energy_refill">شارژ کامل انرژی</option>
                    <option value="energy_amount">افزایش مقداری انرژی</option>
                    <option value="unlock_full_ui">باز کردن رابط کامل بازی</option>
                    <option value="scenario">سناریوی داستانی ویژه</option>
                    <option value="custom">سفارشی</option>
                  </select>
                </div>
              </div>

              {/* Reward Value */}
              {(formData.rewardType === 'gold' ||
                formData.rewardType === 'energy_amount' ||
                formData.rewardType === 'scenario') && (
                <div>
                  <label className="block text-ink-dim mb-1">
                    {formData.rewardType === 'gold'
                      ? 'تعداد سکه طلا:'
                      : formData.rewardType === 'energy_amount'
                      ? 'مقدار انرژی دریافتی:'
                      : 'شناسه سناریو:'}
                  </label>
                  <input
                    type="text"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData({ ...formData, rewardValue: e.target.value })}
                    placeholder={
                      formData.rewardType === 'gold'
                        ? 'مثال: 500'
                        : formData.rewardType === 'energy_amount'
                        ? 'مثال: 10'
                        : 'مثال: desert_spirit'
                    }
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 font-mono text-ink outline-none focus:border-amber"
                  />
                </div>
              )}

              {/* Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink-dim mb-1">برچسب ویژه (Badge):</label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="مثال: محبوبترین، ویژه، تخفیف"
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  />
                </div>
                <div>
                  <label className="block text-ink-dim mb-1">برچسب انگلیسی:</label>
                  <input
                    type="text"
                    value={formData.badgeEn}
                    onChange={(e) => setFormData({ ...formData, badgeEn: e.target.value })}
                    placeholder="e.g. Popular, Best Value"
                    dir="ltr"
                    className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-ink-dim mb-1">توضیحات فارسی:</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحات کوتاه درباره بسته و محتوای آن"
                  className="w-full rounded-lg border border-line bg-sand-2 px-3 py-2 text-ink outline-none focus:border-amber"
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pkg-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-line bg-sand-2 text-amber focus:ring-0"
                />
                <label htmlFor="pkg-active" className="text-ink cursor-pointer">
                  بسته فعال باشد و در فروشگاه بازیکنان نمایش داده شود
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-line px-4 py-2 text-ink-dim hover:text-ink"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-amber px-5 py-2 font-semibold text-stone-950 hover:bg-amber/90 disabled:opacity-50"
                >
                  {saving ? 'در حال ذخیره...' : editingPkg ? 'ذخیره تغییرات' : 'ایجاد بسته'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
