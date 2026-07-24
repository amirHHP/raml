export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  const isError = message.startsWith('خطای AI') || message.includes('خطا');
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-40 flex justify-center px-4">
      <div
        className={`animate-[fadeSlide_0.35s_ease] rounded-full border px-4 py-2 text-sm ${
          isError
            ? 'border-red-500/50 bg-panel/95 text-red-300'
            : 'border-amber/40 bg-panel/95 text-amber amber-glow'
        }`}
      >
        {message}
      </div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
