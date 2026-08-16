import { ShopPackage, type IShopPackage, type ShopPackageType, type ShopRewardType } from '../models/ShopPackage';

let useMemory = true;

export function setShopPackagesMemory(val: boolean): void {
  useMemory = val;
}

export interface ShopPackageMemEntry {
  _id: string;
  sku: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  priceTomans: number;
  type: ShopPackageType;
  rewardType: ShopRewardType;
  rewardValue: number | string | null;
  badge: string;
  badgeEn: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SHOP_PACKAGES: Array<Omit<ShopPackageMemEntry, '_id' | 'createdAt' | 'updatedAt'>> = [
  {
    sku: 'energy_refill',
    title: 'پر کردن کامل انرژی',
    titleEn: 'Full Energy Refill',
    description: 'انرژی را کامل پر می‌کند و خستگی را برطرف می‌سازد',
    descriptionEn: 'Instantly restores your energy to maximum capacity',
    priceTomans: 1000,
    type: 'consumable',
    rewardType: 'energy_refill',
    rewardValue: null,
    badge: 'ضروری',
    badgeEn: 'Essential',
    icon: 'energy',
    sortOrder: 1,
    isActive: true,
  },
  {
    sku: 'gold_200',
    title: 'کیسه سکه (۲۰۰ طلا)',
    titleEn: 'Coin Pouch (200 Gold)',
    description: '۲۰۰ سکه طلا برای خرید تجهیزات و ارتقای بازی',
    descriptionEn: '200 gold coins for purchasing gear and upgrades',
    priceTomans: 2000,
    type: 'consumable',
    rewardType: 'gold',
    rewardValue: 200,
    badge: 'محبوب',
    badgeEn: 'Popular',
    icon: 'gold',
    sortOrder: 2,
    isActive: true,
  },
  {
    sku: 'gold_600',
    title: 'صندوقچه سکه (۶۰۰ طلا)',
    titleEn: 'Chest of Gold (600 Gold)',
    description: '۶۰۰ سکه طلا با تخفیف ویژه به همراه پاداش ماجراجو',
    descriptionEn: '600 gold coins with special value discount',
    priceTomans: 5000,
    type: 'consumable',
    rewardType: 'gold',
    rewardValue: 600,
    badge: 'بهترین ارزش',
    badgeEn: 'Best Value',
    icon: 'chest',
    sortOrder: 3,
    isActive: true,
  },
  {
    sku: 'scenario_kavir',
    title: 'سناریو: شن‌های کویر',
    titleEn: 'Scenario: Desert Sands',
    description: 'باز کردن سناریو و ماجرای رازآلود کویر سوزان',
    descriptionEn: 'Unlock the special Desert Sands adventure scenario',
    priceTomans: 5000,
    type: 'non_consumable',
    rewardType: 'scenario',
    rewardValue: 'desert_spirit',
    badge: 'داستان ویژه',
    badgeEn: 'Special Story',
    icon: 'scenario',
    sortOrder: 4,
    isActive: true,
  },
  {
    sku: 'unlock_full_ui',
    title: 'باز کردن رابط کاربری کامل',
    titleEn: 'Unlock Full UI',
    description: 'دسترسی فوری به تمامی بخش‌های بازی بدون نیاز به صبر ۳ روزه',
    descriptionEn: 'Instant access to all game tabs without waiting 3 days',
    priceTomans: 2000,
    type: 'non_consumable',
    rewardType: 'unlock_full_ui',
    rewardValue: null,
    badge: 'ویژه',
    badgeEn: 'Feature',
    icon: 'unlock',
    sortOrder: 5,
    isActive: true,
  },
];

let memStore: ShopPackageMemEntry[] = [];
let memIdCounter = 1;

export function resetMemStoreForTest(): void {
  memStore = [];
  memIdCounter = 1;
}

function toPublic(doc: IShopPackage | ShopPackageMemEntry) {
  const isDoc = typeof (doc as IShopPackage).toObject === 'function';
  const raw = isDoc ? (doc as IShopPackage).toObject() : doc;
  return {
    id: String(raw._id || (doc as any).id),
    sku: raw.sku,
    title: raw.title,
    titleEn: raw.titleEn || '',
    description: raw.description,
    descriptionEn: raw.descriptionEn || '',
    priceTomans: Number(raw.priceTomans),
    type: raw.type as ShopPackageType,
    rewardType: raw.rewardType as ShopRewardType,
    rewardValue: raw.rewardValue ?? null,
    badge: raw.badge || '',
    badgeEn: raw.badgeEn || '',
    icon: raw.icon || '',
    sortOrder: Number(raw.sortOrder || 0),
    isActive: Boolean(raw.isActive),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : String(raw.createdAt || ''),
    updatedAt: raw.updatedAt instanceof Date ? raw.updatedAt.toISOString() : String(raw.updatedAt || ''),
  };
}

export type PublicShopPackage = ReturnType<typeof toPublic>;

export async function ensureShopPackageSeeds(): Promise<void> {
  if (useMemory) {
    if (memStore.length === 0) {
      const now = new Date();
      memStore = DEFAULT_SHOP_PACKAGES.map((pkg) => ({
        _id: `mem_pkg_${memIdCounter++}`,
        ...pkg,
        rewardValue: pkg.rewardValue ?? null,
        createdAt: now,
        updatedAt: now,
      }));
    }
    return;
  }

  const count = await ShopPackage.countDocuments({});
  if (count === 0) {
    for (const pkg of DEFAULT_SHOP_PACKAGES) {
      await ShopPackage.create(pkg);
    }
  }
}

export async function listPublicShopPackages(): Promise<PublicShopPackage[]> {
  if (useMemory) {
    return memStore
      .filter((p) => p.isActive)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(toPublic);
  }

  const docs = await ShopPackage.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map(toPublic);
}

export async function listAllShopPackages(): Promise<PublicShopPackage[]> {
  if (useMemory) {
    return [...memStore]
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(toPublic);
  }

  const docs = await ShopPackage.find({}).sort({ sortOrder: 1, createdAt: 1 });
  return docs.map(toPublic);
}

export async function getShopPackageBySku(sku: string): Promise<PublicShopPackage | null> {
  const cleanSku = sku.trim();
  if (useMemory) {
    const found = memStore.find((p) => p.sku === cleanSku);
    return found ? toPublic(found) : null;
  }

  const doc = await ShopPackage.findOne({ sku: cleanSku });
  return doc ? toPublic(doc) : null;
}

export interface CreateShopPackageInput {
  sku: string;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  priceTomans: number;
  type?: ShopPackageType;
  rewardType?: ShopRewardType;
  rewardValue?: number | string | null;
  badge?: string;
  badgeEn?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createShopPackage(input: CreateShopPackageInput): Promise<PublicShopPackage> {
  const sku = input.sku.trim();
  const existing = await getShopPackageBySku(sku);
  if (existing) {
    const err = new Error(`بسته‌ای با شناسه (SKU) «${sku}» از قبل وجود دارد`);
    (err as any).status = 400;
    throw err;
  }

  const docData = {
    sku,
    title: input.title.trim(),
    titleEn: input.titleEn?.trim() || '',
    description: input.description?.trim() || '',
    descriptionEn: input.descriptionEn?.trim() || '',
    priceTomans: Math.max(0, Math.round(input.priceTomans)),
    type: input.type || 'consumable',
    rewardType: input.rewardType || 'energy_refill',
    rewardValue: input.rewardValue ?? null,
    badge: input.badge?.trim() || '',
    badgeEn: input.badgeEn?.trim() || '',
    icon: input.icon?.trim() || '',
    sortOrder: Number(input.sortOrder ?? 0),
    isActive: input.isActive !== false,
  };

  if (useMemory) {
    const now = new Date();
    const entry: ShopPackageMemEntry = {
      _id: `mem_pkg_${memIdCounter++}`,
      ...docData,
      createdAt: now,
      updatedAt: now,
    };
    memStore.push(entry);
    return toPublic(entry);
  }

  const created = await ShopPackage.create(docData);
  return toPublic(created);
}

export interface UpdateShopPackageInput {
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  priceTomans?: number;
  type?: ShopPackageType;
  rewardType?: ShopRewardType;
  rewardValue?: number | string | null;
  badge?: string;
  badgeEn?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export async function updateShopPackage(
  idOrSku: string,
  input: UpdateShopPackageInput,
): Promise<PublicShopPackage> {
  const target = idOrSku.trim();

  if (useMemory) {
    const index = memStore.findIndex((p) => p._id === target || p.sku === target);
    if (index === -1) {
      const err = new Error('بسته مورد نظر یافت نشد');
      (err as any).status = 404;
      throw err;
    }

    const current = memStore[index];
    const updated: ShopPackageMemEntry = {
      ...current,
      title: input.title !== undefined ? input.title.trim() : current.title,
      titleEn: input.titleEn !== undefined ? input.titleEn.trim() : current.titleEn,
      description: input.description !== undefined ? input.description.trim() : current.description,
      descriptionEn: input.descriptionEn !== undefined ? input.descriptionEn.trim() : current.descriptionEn,
      priceTomans: input.priceTomans !== undefined ? Math.max(0, Math.round(input.priceTomans)) : current.priceTomans,
      type: input.type !== undefined ? input.type : current.type,
      rewardType: input.rewardType !== undefined ? input.rewardType : current.rewardType,
      rewardValue: input.rewardValue !== undefined ? input.rewardValue : current.rewardValue,
      badge: input.badge !== undefined ? input.badge.trim() : current.badge,
      badgeEn: input.badgeEn !== undefined ? input.badgeEn.trim() : current.badgeEn,
      icon: input.icon !== undefined ? input.icon.trim() : current.icon,
      sortOrder: input.sortOrder !== undefined ? Number(input.sortOrder) : current.sortOrder,
      isActive: input.isActive !== undefined ? Boolean(input.isActive) : current.isActive,
      updatedAt: new Date(),
    };
    memStore[index] = updated;
    return toPublic(updated);
  }

  const query = target.match(/^[0-9a-fA-F]{24}$/) ? { _id: target } : { sku: target };
  const doc = await ShopPackage.findOne(query);
  if (!doc) {
    const err = new Error('بسته مورد نظر یافت نشد');
    (err as any).status = 404;
    throw err;
  }

  if (input.title !== undefined) doc.title = input.title.trim();
  if (input.titleEn !== undefined) doc.titleEn = input.titleEn.trim();
  if (input.description !== undefined) doc.description = input.description.trim();
  if (input.descriptionEn !== undefined) doc.descriptionEn = input.descriptionEn.trim();
  if (input.priceTomans !== undefined) doc.priceTomans = Math.max(0, Math.round(input.priceTomans));
  if (input.type !== undefined) doc.type = input.type;
  if (input.rewardType !== undefined) doc.rewardType = input.rewardType;
  if (input.rewardValue !== undefined) doc.rewardValue = input.rewardValue;
  if (input.badge !== undefined) doc.badge = input.badge.trim();
  if (input.badgeEn !== undefined) doc.badgeEn = input.badgeEn.trim();
  if (input.icon !== undefined) doc.icon = input.icon.trim();
  if (input.sortOrder !== undefined) doc.sortOrder = Number(input.sortOrder);
  if (input.isActive !== undefined) doc.isActive = Boolean(input.isActive);

  await doc.save();
  return toPublic(doc);
}

export async function deleteShopPackage(idOrSku: string): Promise<boolean> {
  const target = idOrSku.trim();

  if (useMemory) {
    const prevLen = memStore.length;
    memStore = memStore.filter((p) => p._id !== target && p.sku !== target);
    if (memStore.length === prevLen) {
      const err = new Error('بسته مورد نظر یافت نشد');
      (err as any).status = 404;
      throw err;
    }
    return true;
  }

  const query = target.match(/^[0-9a-fA-F]{24}$/) ? { _id: target } : { sku: target };
  const result = await ShopPackage.deleteOne(query);
  if (result.deletedCount === 0) {
    const err = new Error('بسته مورد نظر یافت نشد');
    (err as any).status = 404;
    throw err;
  }
  return true;
}
