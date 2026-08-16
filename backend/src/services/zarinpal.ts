import { config } from '../config';
import { PaymentTransaction, type IPaymentTransaction, type PaymentStatus } from '../models/PaymentTransaction';
import { getShopPackageBySku } from './shopPackages';
import { getOrCreatePlayer, toClientState } from './gameState';
import { refillEnergy } from './energy';

let useMemory = true;

export function setZarinpalMemory(val: boolean): void {
  useMemory = val;
}

export interface PaymentMemEntry {
  _id: string;
  authority: string;
  amountTomans: number;
  sku: string;
  skuTitle: string;
  deviceId: string;
  status: PaymentStatus;
  refId: string;
  cardPan: string;
  cardHash: string;
  fee: number;
  gateway: string;
  errorMessage: string;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

let paymentMemStore: PaymentMemEntry[] = [];
let paymentMemCounter = 1;

export function resetPaymentMemStoreForTest(): void {
  paymentMemStore = [];
  paymentMemCounter = 1;
}

function toPublicTransaction(doc: IPaymentTransaction | PaymentMemEntry) {
  const isDoc = typeof (doc as IPaymentTransaction).toObject === 'function';
  const raw = isDoc ? (doc as IPaymentTransaction).toObject() : doc;
  return {
    id: String(raw._id || (doc as any).id),
    authority: raw.authority,
    amountTomans: Number(raw.amountTomans),
    sku: raw.sku,
    skuTitle: raw.skuTitle || '',
    deviceId: raw.deviceId,
    status: raw.status as PaymentStatus,
    refId: raw.refId || '',
    cardPan: raw.cardPan || '',
    cardHash: raw.cardHash || '',
    fee: Number(raw.fee || 0),
    gateway: raw.gateway || 'zarinpal',
    errorMessage: raw.errorMessage || '',
    verifiedAt: raw.verifiedAt instanceof Date ? raw.verifiedAt.toISOString() : (raw.verifiedAt ? String(raw.verifiedAt) : null),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt || ''),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt || ''),
  };
}

export type PublicPaymentTransaction = ReturnType<typeof toPublicTransaction>;

export function formatZarinpalError(body: any, fallbackStatus = 500): string {
  if (!body) return `خطای ارتباط با درگاه پرداخت (کد ${fallbackStatus})`;

  if (body.errors) {
    if (typeof body.errors === 'string') return body.errors;

    if (Array.isArray(body.errors)) {
      const msgs = body.errors
        .map((e: any) => (typeof e === 'string' ? e : e?.message || JSON.stringify(e)))
        .filter(Boolean);
      if (msgs.length > 0) return msgs.join(' | ');
    }

    if (typeof body.errors === 'object') {
      const errObj = body.errors;
      const parts: string[] = [];
      if (errObj.message) parts.push(String(errObj.message));
      if (errObj.validations) {
        if (Array.isArray(errObj.validations)) {
          parts.push(
            errObj.validations
              .map((v: any) => (typeof v === 'object' ? Object.values(v).join(', ') : String(v)))
              .join(', '),
          );
        } else if (typeof errObj.validations === 'object') {
          parts.push(
            Object.entries(errObj.validations)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', '),
          );
        }
      }
      if (parts.length > 0) return parts.join(' - ');
      if (errObj.code) return `کد خطای زرین‌پال: ${errObj.code}`;
    }
  }

  if (body.data?.message) return String(body.data.message);

  return `خطای درگاه زرین‌پال (کد ${body?.data?.code || fallbackStatus})`;
}

function getZarinpalBaseUrl(): string {
  return config.zarinpalSandbox
    ? 'https://sandbox.zarinpal.com/pg'
    : 'https://payment.zarinpal.com/pg';
}

export async function createPaymentRecord(data: {
  authority: string;
  amountTomans: number;
  sku: string;
  skuTitle: string;
  deviceId: string;
}): Promise<PublicPaymentTransaction> {
  const now = new Date();
  if (useMemory) {
    const entry: PaymentMemEntry = {
      _id: `mem_tx_${paymentMemCounter++}`,
      authority: data.authority,
      amountTomans: data.amountTomans,
      sku: data.sku,
      skuTitle: data.skuTitle,
      deviceId: data.deviceId,
      status: 'pending',
      refId: '',
      cardPan: '',
      cardHash: '',
      fee: 0,
      gateway: 'zarinpal',
      errorMessage: '',
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    paymentMemStore.push(entry);
    return toPublicTransaction(entry);
  }

  const created = await PaymentTransaction.create({
    authority: data.authority,
    amountTomans: data.amountTomans,
    sku: data.sku,
    skuTitle: data.skuTitle,
    deviceId: data.deviceId,
    status: 'pending',
    gateway: 'zarinpal',
  });
  return toPublicTransaction(created);
}

export async function findPaymentByAuthority(
  authority: string,
): Promise<IPaymentTransaction | PaymentMemEntry | null> {
  const cleanAuth = authority.trim();
  if (useMemory) {
    const found = paymentMemStore.find((p) => p.authority === cleanAuth);
    return found || null;
  }
  return PaymentTransaction.findOne({ authority: cleanAuth });
}

export interface RequestPaymentResult {
  ok: boolean;
  authority?: string;
  paymentUrl?: string;
  fee?: number;
  error?: string;
  code?: number;
}

export async function requestZarinpalPayment(options: {
  sku: string;
  deviceId: string;
  callbackUrl?: string;
  mobile?: string;
  email?: string;
}): Promise<RequestPaymentResult> {
  const { sku, deviceId, mobile, email } = options;

  const pkg = await getShopPackageBySku(sku);
  if (!pkg) {
    return { ok: false, error: 'بسته مورد نظر در فروشگاه یافت نشد' };
  }

  if (!pkg.isActive) {
    return { ok: false, error: 'این بسته در حال حاضر غیرفعال است' };
  }

  // Non-consumable check
  if (pkg.type === 'non_consumable') {
    const player = await getOrCreatePlayer(deviceId);
    if (player.purchasedSkus && player.purchasedSkus.includes(sku)) {
      return { ok: false, error: 'این بسته قبلاً توسط شما خریداری شده است' };
    }
  }

  const callbackUrl =
    options.callbackUrl ||
    `${config.backendBaseUrl}/api/mono/zarinpal/callback`;

  const merchantId = config.zarinpalMerchantId.trim();
  const amountTomans = pkg.priceTomans;
  const description = `خرید بسته ${pkg.title} - بازی رمل`;

  const baseUrl = getZarinpalBaseUrl();
  const requestEndpoint = `${baseUrl}/v4/payment/request.json`;

  try {
    const payload: Record<string, unknown> = {
      merchant_id: merchantId,
      amount: amountTomans,
      currency: 'IRT',
      description,
      callback_url: callbackUrl,
    };

    const metadata: Record<string, string> = {};
    if (mobile?.trim()) metadata.mobile = mobile.trim();
    if (email?.trim()) metadata.email = email.trim();
    if (Object.keys(metadata).length > 0) {
      payload.metadata = metadata;
    }

    const response = await fetch(requestEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as {
      data?: { code: number; message: string; authority: string; fee_type?: string; fee?: number };
      errors?: Array<{ code: number; message: string }> | Record<string, unknown>;
    };

    const isSuccess = response.ok && body.data && (body.data.code === 100 || body.data.code === 101);

    if (!isSuccess || !body.data?.authority) {
      const errMsg = formatZarinpalError(body, response.status);
      console.error('Zarinpal request failed:', {
        status: response.status,
        requestEndpoint,
        callbackUrl,
        merchantIdMasked: merchantId ? `${merchantId.slice(0, 8)}...` : '(empty)',
        body,
      });

      return {
        ok: false,
        code: body.data?.code || (body.errors as any)?.code || response.status,
        error: errMsg,
      };
    }

    const authority = body.data.authority;
    const paymentUrl = `${baseUrl}/StartPay/${authority}`;

    await createPaymentRecord({
      authority,
      amountTomans,
      sku: pkg.sku,
      skuTitle: pkg.title,
      deviceId,
    });

    return {
      ok: true,
      authority,
      paymentUrl,
      fee: body.data.fee,
      code: body.data.code,
    };
  } catch (err) {
    console.error('Zarinpal request payment network exception:', err);
    return {
      ok: false,
      error: 'خطا در برقراری ارتباط با درگاه پرداخت زرین‌پال',
    };
  }
}

export async function applyPackageRewardToPlayer(
  deviceId: string,
  sku: string,
): Promise<{ player: any; rewardSummary: string }> {
  const player = await getOrCreatePlayer(deviceId);
  const pkg = await getShopPackageBySku(sku);

  let rewardSummary = 'خرید با موفقیت انجام شد';

  if (!pkg) {
    if (sku === 'energy_refill') {
      refillEnergy(player, player.stats.maxEnergy);
      rewardSummary = 'انرژی کامل پر شد';
    }
    if ('save' in player && typeof player.save === 'function') {
      await player.save();
    }
    return { player, rewardSummary };
  }

  // Add to purchasedSkus if non-consumable
  if (pkg.type === 'non_consumable') {
    if (!player.purchasedSkus.includes(pkg.sku)) {
      player.purchasedSkus.push(pkg.sku);
    }
  }

  // Handle reward by type
  switch (pkg.rewardType) {
    case 'energy_refill': {
      refillEnergy(player, player.stats.maxEnergy);
      rewardSummary = 'انرژی کامل پر شد';
      break;
    }
    case 'energy_amount': {
      const amount = Number(pkg.rewardValue) || 5;
      refillEnergy(player, amount);
      rewardSummary = `${amount} واحد انرژی اضافه شد`;
      break;
    }
    case 'gold': {
      const goldAmount = Number(pkg.rewardValue) || 100;
      player.stats.gold = (player.stats.gold || 0) + goldAmount;
      rewardSummary = `${goldAmount.toLocaleString('fa-IR')} سکه طلا دریافت شد`;
      break;
    }
    case 'unlock_full_ui': {
      player.unlockedFullUi = true;
      player.playDayCount = Math.max(player.playDayCount || 1, 3);
      rewardSummary = 'رابط کاربری کامل باز شد';
      break;
    }
    case 'scenario': {
      rewardSummary = `سناریو «${pkg.title}» باز شد`;
      if (pkg.sku === 'scenario_kavir' || pkg.rewardValue === 'desert_spirit') {
        player.currentLocation = 'دشت‌های سوزان کویر';
        player.storyText =
          'افق در حرارت می‌لرزد. شن‌های طلایی زیر پایت جاری‌اند و سایه‌ای ناشناس دعوتت می‌کند...';
        player.enemyLineArtType = 'desert_spirit';
      }
      break;
    }
    case 'custom':
    default: {
      rewardSummary = `بسته «${pkg.title}» با موفقیت فعال شد`;
      break;
    }
  }

  player.toastMessage = rewardSummary;

  if ('save' in player && typeof player.save === 'function') {
    await player.save();
  }

  return { player, rewardSummary };
}

export interface VerifyPaymentResult {
  ok: boolean;
  code?: number;
  refId?: string;
  cardPan?: string;
  error?: string;
  transaction?: PublicPaymentTransaction;
  playerState?: any;
  rewardSummary?: string;
}

export async function verifyZarinpalPayment(options: {
  authority: string;
  statusQuery?: string;
}): Promise<VerifyPaymentResult> {
  const { authority, statusQuery } = options;
  const cleanAuth = authority.trim();

  const tx = await findPaymentByAuthority(cleanAuth);
  if (!tx) {
    return { ok: false, error: 'تراکنش پرداخت یافت نشد' };
  }

  // If already paid
  if (tx.status === 'paid') {
    const player = await getOrCreatePlayer(tx.deviceId);
    return {
      ok: true,
      code: 101,
      refId: tx.refId,
      cardPan: tx.cardPan,
      transaction: toPublicTransaction(tx),
      playerState: toClientState(player),
      rewardSummary: 'این تراکنش قبلاً تأیید و پاداش آن دریافت شده است',
    };
  }

  // If cancelled by user at gateway
  if (statusQuery && statusQuery.toUpperCase() !== 'OK') {
    tx.status = 'cancelled';
    tx.errorMessage = 'پرداخت توسط کاربر در درگاه لغو شد';
    tx.updatedAt = new Date();
    if ('save' in tx && typeof (tx as any).save === 'function') {
      await (tx as any).save();
    }
    return {
      ok: false,
      error: 'پرداخت لغو شد یا با خطا مواجه گردید',
      transaction: toPublicTransaction(tx),
    };
  }

  const merchantId = config.zarinpalMerchantId.trim();
  const baseUrl = getZarinpalBaseUrl();
  const verifyEndpoint = `${baseUrl}/v4/payment/verify.json`;

  try {
    const payload = {
      merchant_id: merchantId,
      amount: tx.amountTomans,
      authority: cleanAuth,
    };

    const response = await fetch(verifyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = (await response.json().catch(() => ({}))) as {
      data?: {
        code: number;
        message: string;
        ref_id: number | string;
        card_pan?: string;
        card_hash?: string;
        fee_type?: string;
        fee?: number;
      };
      errors?: Array<{ code: number; message: string }> | Record<string, unknown>;
    };

    const code = body.data?.code;
    const isSuccess = (code === 100 || code === 101);

    if (isSuccess && body.data) {
      tx.status = 'paid';
      tx.refId = String(body.data?.ref_id || '');
      tx.cardPan = body.data?.card_pan || '';
      tx.cardHash = body.data?.card_hash || '';
      tx.fee = Number(body.data?.fee || 0);
      tx.verifiedAt = new Date();
      tx.errorMessage = '';
      tx.updatedAt = new Date();

      if ('save' in tx && typeof (tx as any).save === 'function') {
        await (tx as any).save();
      }

      const { player, rewardSummary } = await applyPackageRewardToPlayer(tx.deviceId, tx.sku);

      return {
        ok: true,
        code,
        refId: tx.refId,
        cardPan: tx.cardPan,
        transaction: toPublicTransaction(tx),
        playerState: toClientState(player),
        rewardSummary,
      };
    }

    const errMsg = formatZarinpalError(body, response.status);
    console.error('Zarinpal verify failed:', {
      status: response.status,
      verifyEndpoint,
      authority: cleanAuth,
      merchantIdMasked: merchantId ? `${merchantId.slice(0, 8)}...` : '(empty)',
      body,
    });

    tx.status = 'failed';
    tx.errorMessage = errMsg;
    tx.updatedAt = new Date();

    if ('save' in tx && typeof (tx as any).save === 'function') {
      await (tx as any).save();
    }

    return {
      ok: false,
      code: code || (body.errors as any)?.code || response.status,
      error: errMsg,
      transaction: toPublicTransaction(tx),
    };
  } catch (err) {
    console.error('Zarinpal verify error:', err);
    tx.status = 'failed';
    tx.errorMessage = 'خطای شبکه در تأیید تراکنش';
    tx.updatedAt = new Date();
    if ('save' in tx && typeof (tx as any).save === 'function') {
      await (tx as any).save();
    }

    return {
      ok: false,
      error: 'خطای شبکه در تأیید پرداخت با زرین‌پال',
      transaction: toPublicTransaction(tx),
    };
  }
}

export async function listAdminPayments(query: {
  status?: PaymentStatus;
  sku?: string;
  page?: number;
  limit?: number;
}): Promise<{
  items: PublicPaymentTransaction[];
  total: number;
  page: number;
  limit: number;
}> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  if (useMemory) {
    let filtered = [...paymentMemStore];
    if (query.status) {
      filtered = filtered.filter((p) => p.status === query.status);
    }
    if (query.sku) {
      filtered = filtered.filter((p) => p.sku === query.sku);
    }
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const total = filtered.length;
    const items = filtered.slice(skip, skip + limit).map(toPublicTransaction);
    return { items, total, page, limit };
  }

  const filter: any = {};
  if (query.status) filter.status = query.status;
  if (query.sku) filter.sku = query.sku;

  const [total, docs] = await Promise.all([
    PaymentTransaction.countDocuments(filter),
    PaymentTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    items: docs.map(toPublicTransaction),
    total,
    page,
    limit,
  };
}

export async function getAdminPaymentStats(): Promise<{
  totalRevenueTomans: number;
  paidCount: number;
  pendingCount: number;
  failedCount: number;
  cancelledCount: number;
  averageOrderTomans: number;
}> {
  if (useMemory) {
    let totalRevenueTomans = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let failedCount = 0;
    let cancelledCount = 0;

    for (const tx of paymentMemStore) {
      if (tx.status === 'paid') {
        paidCount++;
        totalRevenueTomans += tx.amountTomans;
      } else if (tx.status === 'pending') {
        pendingCount++;
      } else if (tx.status === 'failed') {
        failedCount++;
      } else if (tx.status === 'cancelled') {
        cancelledCount++;
      }
    }

    const averageOrderTomans = paidCount > 0 ? Math.round(totalRevenueTomans / paidCount) : 0;
    return {
      totalRevenueTomans,
      paidCount,
      pendingCount,
      failedCount,
      cancelledCount,
      averageOrderTomans,
    };
  }

  const stats = await PaymentTransaction.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amountTomans' },
      },
    },
  ]);

  let totalRevenueTomans = 0;
  let paidCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let cancelledCount = 0;

  for (const s of stats) {
    if (s._id === 'paid') {
      paidCount = s.count;
      totalRevenueTomans = s.totalAmount;
    } else if (s._id === 'pending') {
      pendingCount = s.count;
    } else if (s._id === 'failed') {
      failedCount = s.count;
    } else if (s._id === 'cancelled') {
      cancelledCount = s.count;
    }
  }

  const averageOrderTomans = paidCount > 0 ? Math.round(totalRevenueTomans / paidCount) : 0;
  return {
    totalRevenueTomans,
    paidCount,
    pendingCount,
    failedCount,
    cancelledCount,
    averageOrderTomans,
  };
}
