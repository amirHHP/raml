import { useState } from 'react';
import { CLASS_LABELS, type ClassType } from '../types/game';
import { IconEye } from './icons';

export function AwakenScreen({
  storyText,
  busy,
  onAwaken,
}: {
  storyText: string;
  busy: boolean;
  onAwaken: (name: string, classType: ClassType) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [classType, setClassType] = useState<ClassType>('warrior');

  return (
    <div className="flex flex-1 flex-col px-5 pb-10 pt-6">
      <div className="mx-auto w-full max-w-md flex-1">
        <p className="mb-8 whitespace-pre-wrap text-center text-[15px] leading-8 text-ink-dim">
          {storyText}
        </p>

        <label className="mb-2 block text-xs text-ink-muted" htmlFor="char-name">
          نام شخصیت
        </label>
        <input
          id="char-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          placeholder="مثلاً آریا"
          className="mb-5 w-full rounded-lg border border-line bg-oled px-3 py-3 text-center text-ink outline-none transition focus:border-amber focus:amber-glow"
        />

        <p className="mb-2 text-xs text-ink-muted">کلاس</p>
        <div className="mb-8 grid grid-cols-2 gap-2">
          {(Object.keys(CLASS_LABELS) as ClassType[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setClassType(c)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                classType === c
                  ? 'border-amber text-amber amber-glow'
                  : 'border-line text-ink-dim'
              }`}
            >
              {CLASS_LABELS[c]}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={busy || name.trim().length < 1}
          onClick={() => void onAwaken(name.trim(), classType)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber bg-oled py-3.5 text-base text-amber amber-glow transition enabled:hover:bg-amber/10 disabled:opacity-40"
        >
          <IconEye size={20} />
          باز کردن چشم‌ها
        </button>
      </div>
    </div>
  );
}
