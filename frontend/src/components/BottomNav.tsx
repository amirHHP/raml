import { IconBag, IconCart, IconScroll, IconUser } from './icons';
import type { TabId } from '../types/game';

const ALL_TABS: {
  id: TabId;
  label: string;
  Icon: typeof IconScroll;
  requires?: 'inventory' | 'stats';
}[] = [
  { id: 'story', label: 'داستان', Icon: IconScroll },
  { id: 'inventory', label: 'کوله‌پشتی', Icon: IconBag, requires: 'inventory' },
  { id: 'stats', label: 'آمار', Icon: IconUser, requires: 'stats' },
  { id: 'shop', label: 'فروشگاه', Icon: IconCart },
];

export function BottomNav({
  active,
  onChange,
  showInventory = true,
  showStats = true,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  showInventory?: boolean;
  showStats?: boolean;
}) {
  const tabs = ALL_TABS.filter((tab) => {
    if (tab.requires === 'inventory') return showInventory;
    if (tab.requires === 'stats') return showStats;
    return true;
  });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-oled/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      <ul className="mx-auto flex max-w-lg items-center justify-around px-2">
        {tabs.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                className={`flex min-w-[4.5rem] flex-col items-center gap-1 rounded-lg px-2 py-1.5 text-[10px] transition ${
                  on ? 'text-amber amber-text-glow' : 'text-ink-muted hover:text-ink-dim'
                }`}
              >
                <Icon size={22} className={on ? 'drop-shadow-[0_0_6px_#f59e0b]' : ''} />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
