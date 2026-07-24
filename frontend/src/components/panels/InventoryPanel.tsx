import type { InventoryItem } from '../../types/game';

export function InventoryPanel({ items }: { items: InventoryItem[] }) {
  if (!items.length) {
    return (
      <p className="px-4 py-10 text-center text-sm text-ink-muted">
        کوله‌پشتی خالی است.
      </p>
    );
  }

  return (
    <ul className="space-y-2 px-4 py-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-xl border border-line bg-panel px-4 py-3"
        >
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm text-ink">{item.name}</h3>
            <span className="text-xs text-amber">×{item.quantity}</span>
          </div>
          <p className="mt-1 text-xs leading-6 text-ink-muted">{item.description}</p>
        </li>
      ))}
    </ul>
  );
}
