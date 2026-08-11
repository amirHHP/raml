import { execSync } from 'child_process';
import { Changelog, type IChangelog } from '../models/Changelog';

// ── In-memory fallback store ───────────────────────────────────

let useMemory = true;

export function setChangelogMemory(val: boolean) {
  useMemory = val;
}

interface ChangelogMemEntry {
  _id: string;
  version: string;
  title: string;
  titleEn: string;
  items: string[];
  itemsEn: string[];
  createdAt: Date;
}

let memStore: ChangelogMemEntry[] = [];
let memIdCounter = 1;

// ── Public helpers ─────────────────────────────────────────────

function toPublic(doc: IChangelog | ChangelogMemEntry) {
  return {
    id: String((doc as any)._id ?? (doc as any).id),
    version: doc.version,
    title: doc.title,
    titleEn: doc.titleEn || '',
    items: doc.items || [],
    itemsEn: doc.itemsEn || [],
    createdAt: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : String(doc.createdAt),
  };
}

// ── GitHub / Git Commit Sync Helper ─────────────────────────────

interface CommitInfo {
  hash: string;
  message: string;
  date: string; // YYYY-MM-DD
}

function parseCommitMessage(msg: string): { fa: string; en: string } {
  const cleanMsg = msg.trim();
  const lower = cleanMsg.toLowerCase();

  let prefixFa = '• ';
  let prefixEn = '• ';

  let body = cleanMsg;
  if (cleanMsg.includes(':')) {
    const parts = cleanMsg.split(':');
    const type = parts[0].trim().toLowerCase();
    body = parts.slice(1).join(':').trim();

    if (type.startsWith('feat')) {
      prefixFa = '✨ ویژگی جدید: ';
      prefixEn = '✨ Feature: ';
    } else if (type.startsWith('fix')) {
      prefixFa = '🐛 رفع اشکال: ';
      prefixEn = '🐛 Fix: ';
    } else if (type.startsWith('refactor')) {
      prefixFa = '⚙️ بهبود و به‌روزرسانی کد: ';
      prefixEn = '⚙️ Refactor: ';
    } else if (type.startsWith('ui') || type.startsWith('style')) {
      prefixFa = '🎨 تغییرات ظاهری و رابط کاربری: ';
      prefixEn = '🎨 UI & Styling: ';
    } else if (type.startsWith('docs')) {
      prefixFa = '📝 مستندات: ';
      prefixEn = '📝 Docs: ';
    } else if (type.startsWith('perf')) {
      prefixFa = '⚡ بهبود کارایی: ';
      prefixEn = '⚡ Performance: ';
    }
  }

  // Common phrase Persian translations
  let faBody = body;
  faBody = faBody
    .replace(/restrict AI image generation to turns meeting AI_LIVE_FROM_TURN threshold/gi, 'محدودسازی تولید تصویر AI به نوبت‌های بالاتر از آستانه مشخص شده')
    .replace(/remove default values for image settings to allow empty string configuration/gi, 'امکان تنظیم خالی بودن مقادیر کیفیت و سایز تصویر AI')
    .replace(/allow empty quality and size parameters and conditionally include them in request payload/gi, 'پشتیبانی از پارامترهای اختیاری کیفیت و ابعاد در تصویرساز AI')
    .replace(/simplify EnemyLineArt container and update image alt text/gi, 'بهینه‌سازی کادر نمایش خط‌کاری دشمنان و متن‌های جایگزین')
    .replace(/replace static dropdowns with free-text input fields for image configuration parameters in AiPage/gi, 'تغییر منوهای افتادنی به فیلدهای متنی آزاد در تنظیمات تصویرساز AI')
    .replace(/integrate AI-generated imagery into story turns and UI components/gi, 'ادغام تصاویر تولید شده توسط AI در نوبت‌های داستان و رابط کاربری')
    .replace(/update image generation to use base64 encoding and support b64_json response format/gi, 'پشتیبانی از فرمت base64 در خروجی تصویرساز AI')
    .replace(/add quality, size, and mode configurations to image generation settings and API/gi, 'افزودن تنظیمات کیفیت، ابعاد و حالت در تصویرساز AI')
    .replace(/implement TokenBazaar AI image generation service and admin configuration/gi, 'راه‌اندازی سرویس تولید تصویر TokenBazaar AI و تنظیمات ادمین')
    .replace(/implement mandatory unique referral codes and update schema indexing to prevent duplicates/gi, 'اجباری‌سازی کد دعوت یکتا و جلوگیری از ثبت کدهای تکراری')
    .replace(/implement iOS PWA installation prompt and update manifest metadata/gi, 'افزودن راهنما و بنر نصب وب‌اپلیکیشن (PWA) روی iOS')
    .replace(/stabilize RewardedAdModal lifecycle by removing callback dependencies and enforcing single-run execution/gi, 'پایدارسازی نمایش تبلیغات جایزه‌ای')
    .replace(/update referralCode schema to nullable and add migration to resolve duplicate index issues/gi, 'اصلاح ایندکس دیتابیس کدهای دعوت')
    .replace(/implement referral system with UI panel and backend reward configuration/gi, 'پیاده‌سازی سیستم دعوت از دوستان (Referral) همراه با پنل اختصاصی و سکه پاداش')
    .replace(/add referral system with reward tracking and implement changelog modal for game updates/gi, 'پیاده‌سازی مدال تاریخچه تغییرات بازی و سیستم دعوت')
    .replace(/add multilingual support to game state and UI components with i18n utility/gi, 'افزودن پشتیبانی کامل از زبان انگلیسی و فارسی (i18n)')
    .replace(/add SVG art support for game entities, update character types, and enhance line-art rendering components/gi, 'افزودن طرح‌های گرافیکی SVG برای موجودات بازی')
    .replace(/add ASCII\/SVG toggle with preset art to EnemyLineArt and improve JSON parsing with newline sanitization/gi, 'افزودن حالت سویچ بین ASCII و SVG برای کاراکترها')
    .replace(/implement dynamic AI-generated ASCII art rendering and add new SVG enemy icons/gi, 'تولید پویا و هوشمند آرت‌های ASCII توسط AI')
    .replace(/add ad reward simulation capability to RewardedAdModal for testing purposes/gi, 'امکان تست و شبیه‌سازی تماشای ویدیو تبلیغاتی')
    .replace(/initialize Adivery SDK in the main entry point/gi, 'راه‌اندازی SDK تبلیغات Adivery')
    .replace(/integrate Adivery rewarded ads and update modal UI for ad loading states/gi, 'اتصال تبلیغات جایزه‌ای Adivery برای شارژ انرژی')
    .replace(/implement player cave entry and home status tracking with navigation restrictions/gi, 'اضافه شدن غار و سیستم بازگشت به خانه')
    .replace(/implement equipment system with item stat bonuses and toggleable gear functionality/gi, 'پیاده‌سازی سیستم کوله‌پشتی و تجهیزات قهرمان با قابلیت افزایش ویژگی‌ها')
    .replace(/implement stat normalization for AI payloads, improve silhouette visual effects, and update stat reading/gi, 'بهبود نمایش ویژگی‌های قهرمان و آرت سیاه‌قلم')
    .replace(/implement home feature with unlockable base and idle activity system/gi, 'پیاده‌سازی بخش خانه (پناهگاه) و تمرین‌های روزانه قهرمان')
    .replace(/implement dynamic character class selection and update silhouette visualizations per class type/gi, 'امکان انتخاب کلاس‌های قهرمان (جنگجو، جادوگر، سایه، کماندار)')
    .replace(/implement item rewards, requirements, and effects with enriched history tracking and UI updates/gi, 'سیستم دریافت غنیمت و آیتم‌های داستان')
    .replace(/update Gemini model preferences and normalize OpenAI base URL handling/gi, 'بهینه‌سازی اتصال به مدل‌های AI')
    .replace(/configure custom DNS servers, broaden API key detection, and strip reasoning blocks from model output/gi, 'بهبود پایداری اتصال سرور به APIهای آنلاین');

  return {
    fa: `${prefixFa}${faBody}`,
    en: `${prefixEn}${body}`,
  };
}

async function fetchCommitsFromGitHub(): Promise<CommitInfo[]> {
  try {
    const res = await fetch('https://api.github.com/repos/amirHHP/raml/commits?per_page=100', {
      headers: {
        'User-Agent': 'Raml-App',
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = (await res.json()) as Array<{
        sha: string;
        commit: {
          message: string;
          author: { date: string };
        };
      }>;

      if (Array.isArray(data) && data.length > 0) {
        return data.map((c) => ({
          hash: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0],
          date: c.commit.author.date.slice(0, 10),
        }));
      }
    }
  } catch (e) {
    console.warn('GitHub API fetch failed, falling back to local git log:', e);
  }

  // Fallback to local git log command if available
  try {
    const logOutput = execSync('git log -n 100 --pretty=format:"%h|%ad|%s" --date=short', {
      encoding: 'utf8',
    });
    const lines = logOutput.trim().split('\n');
    return lines
      .map((line) => {
        const parts = line.split('|');
        if (parts.length >= 3) {
          return {
            hash: parts[0],
            date: parts[1],
            message: parts.slice(2).join('|'),
          };
        }
        return null;
      })
      .filter((c): c is CommitInfo => c !== null);
  } catch {
    return [];
  }
}

export async function syncChangelogsFromGitHub(): Promise<{ count: number }> {
  const rawCommits = await fetchCommitsFromGitHub();
  if (rawCommits.length === 0) {
    return { count: 0 };
  }

  // Group commits by date
  const groupsByDate = new Map<string, CommitInfo[]>();
  for (const c of rawCommits) {
    const list = groupsByDate.get(c.date) || [];
    list.push(c);
    groupsByDate.set(c.date, list);
  }

  // Sort dates descending
  const sortedDates = Array.from(groupsByDate.keys()).sort((a, b) => b.localeCompare(a));

  let addedCount = 0;
  let versionMajor = 1;
  let versionMinor = sortedDates.length;

  for (const dateStr of sortedDates) {
    const commits = groupsByDate.get(dateStr) || [];
    if (commits.length === 0) continue;

    const versionStr = `${versionMajor}.${versionMinor--}.0`;

    // Filter out minor merge or internal commits if needed, or parse all
    const itemsFa: string[] = [];
    const itemsEn: string[] = [];

    for (const c of commits) {
      const parsed = parseCommitMessage(c.message);
      if (!itemsFa.includes(parsed.fa)) {
        itemsFa.push(parsed.fa);
        itemsEn.push(parsed.en);
      }
    }

    if (itemsFa.length === 0) continue;

    const formattedDateFa = new Date(dateStr).toLocaleDateString('fa-IR');
    const titleFa = `تغییرات و آپدیت نسخه ${versionStr} (${formattedDateFa})`;
    const titleEn = `Update v${versionStr} (${dateStr})`;

    // Check if entry for this date/version exists
    if (useMemory) {
      const exists = memStore.some((e) => e.version === versionStr || e.title.includes(dateStr) || e.title.includes(formattedDateFa));
      if (!exists) {
        memStore.push({
          _id: `mem_cl_${memIdCounter++}`,
          version: versionStr,
          title: titleFa,
          titleEn: titleEn,
          items: itemsFa,
          itemsEn: itemsEn,
          createdAt: new Date(dateStr),
        });
        addedCount++;
      }
    } else {
      const existing = await Changelog.findOne({
        $or: [{ version: versionStr }, { title: { $regex: dateStr } }, { title: { $regex: formattedDateFa } }],
      });

      if (!existing) {
        await Changelog.create({
          version: versionStr,
          title: titleFa,
          titleEn: titleEn,
          items: itemsFa,
          itemsEn: itemsEn,
          createdAt: new Date(dateStr),
        });
        addedCount++;
      }
    }
  }

  return { count: addedCount };
}

// ── List ───────────────────────────────────────────────────────

export async function listChangelogs() {
  if (useMemory) {
    if (memStore.length === 0) {
      await syncChangelogsFromGitHub();
    }
    const sorted = [...memStore].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return sorted.map(toPublic);
  }

  let count = await Changelog.countDocuments();
  if (count === 0) {
    await syncChangelogsFromGitHub();
  }

  const docs = await Changelog.find().sort({ createdAt: -1 }).lean();
  return (docs as unknown as IChangelog[]).map(toPublic);
}

// ── Create ─────────────────────────────────────────────────────

export async function createChangelog(data: {
  version: string;
  title: string;
  titleEn?: string;
  items: string[];
  itemsEn?: string[];
}) {
  if (useMemory) {
    const entry: ChangelogMemEntry = {
      _id: `mem_cl_${memIdCounter++}`,
      version: data.version,
      title: data.title,
      titleEn: data.titleEn || '',
      items: data.items,
      itemsEn: data.itemsEn || [],
      createdAt: new Date(),
    };
    memStore.unshift(entry);
    return toPublic(entry);
  }

  const doc = await Changelog.create({
    version: data.version,
    title: data.title,
    titleEn: data.titleEn || '',
    items: data.items,
    itemsEn: data.itemsEn || [],
  });
  return toPublic(doc);
}

// ── Delete ─────────────────────────────────────────────────────

export async function deleteChangelog(id: string) {
  if (useMemory) {
    const idx = memStore.findIndex((e) => e._id === id);
    if (idx === -1) {
      const err = new Error('Changelog not found') as Error & { status?: number };
      err.status = 404;
      throw err;
    }
    memStore.splice(idx, 1);
    return;
  }

  const doc = await Changelog.findByIdAndDelete(id);
  if (!doc) {
    const err = new Error('Changelog not found') as Error & { status?: number };
    err.status = 404;
    throw err;
  }
}
