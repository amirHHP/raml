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

// ── List ───────────────────────────────────────────────────────

export async function listChangelogs() {
  if (useMemory) {
    const sorted = [...memStore].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return sorted.map(toPublic);
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
