import { useRef, useState } from 'react';
import { useGame } from './hooks/useGame';
import { StatusBar } from './components/StatusBar';
import { StoryChat } from './components/StoryChat';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import { AwakenScreen } from './components/AwakenScreen';
import { EyesOpenOverlay } from './components/EyesOpenOverlay';
import { InventoryPanel } from './components/panels/InventoryPanel';
import { StatsPanel } from './components/panels/StatsPanel';
import { ShopPanel } from './components/panels/ShopPanel';
import { RewardedAdModal } from './components/monetization/RewardedAdModal';
import { SettingsModal } from './components/SettingsModal';
import { InboxModal } from './components/InboxModal';

const EYES_OPEN_MS = 5400;

export default function App() {
  const game = useGame();
  const [openingEyes, setOpeningEyes] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);

  const handleAwaken = async (name: string) => {
    setOpeningEyes(true);
    const minAnim = new Promise<void>((resolve) => {
      window.setTimeout(resolve, EYES_OPEN_MS);
    });
    await game.awaken(name);
    await minAnim;
    setOpeningEyes(false);
  };

  if (game.loading) {
    return (
      <div className="flex h-full items-center justify-center bg-oled text-ink-muted">
        در حال بارگذاری رمل...
      </div>
    );
  }

  if (!game.state) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-oled px-6 text-center">
        <p className="text-ink">{game.error || 'اتصال به سرور برقرار نشد'}</p>
        <button
          type="button"
          onClick={() => void game.refresh().then(() => undefined)}
          className="rounded-lg border border-amber px-4 py-2 text-sm text-amber"
        >
          تلاش دوباره
        </button>
      </div>
    );
  }

  const { state } = game;
  const sparse = !state.unlockedFullUi;
  const showChrome = state.awakened && !openingEyes;
  const refillPrice =
    game.shop.find((item) => item.sku === 'energy_refill')?.priceTomans ?? null;

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-oled">
      {showChrome && (
        <StatusBar
          state={state}
          sparse={sparse}
          onSettings={() => game.setSettingsOpen(true)}
          onInbox={() => {
            void game.refreshInbox().catch(() => undefined);
            game.setInboxOpen(true);
          }}
          unreadCount={game.unreadCount}
        />
      )}

      {showChrome && <Toast message={state.toastMessage} />}

      {game.error && !openingEyes && (
        <div className="mx-4 mt-3 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {game.error}
          <button
            type="button"
            className="mr-2 underline"
            onClick={() => game.setError(null)}
          >
            بستن
          </button>
        </div>
      )}

      <EyesOpenOverlay visible={openingEyes} />

      <main
        ref={scrollRef}
        className={`flex-1 overflow-y-auto story-scroll ${
          state.awakened && state.unlockedFullUi ? 'pb-24' : 'pb-8'
        }`}
      >
        {!state.awakened ? (
          <AwakenScreen
            storyText={state.storyText}
            busy={game.busy || openingEyes}
            storyMsPerWord={state.storyMsPerWord}
            onAwaken={handleAwaken}
          />
        ) : (
          <>
            {game.tab === 'story' && (
              <StoryChat
                state={state}
                busy={game.busy}
                refillPriceTomans={refillPrice}
                scrollContainerRef={scrollRef}
                onChoose={(id) => void game.choose(id)}
                onRoll={game.submitDice}
                onWatchAd={() => game.setAdOpen(true)}
                onBuyRefill={() => void game.buySku('energy_refill')}
                onTimerElapsed={() => {
                  void game.refresh().catch(() => undefined);
                }}
              />
            )}
            {game.tab === 'inventory' && (
              <InventoryPanel items={state.inventory} />
            )}
            {game.tab === 'stats' && <StatsPanel state={state} />}
            {game.tab === 'shop' && (
              <ShopPanel
                items={game.shop}
                state={state}
                busy={game.busy}
                onBuy={(sku) => void game.buySku(sku)}
                onWatchAd={() => game.setAdOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {showChrome && state.unlockedFullUi && (
        <BottomNav active={game.tab} onChange={game.setTab} />
      )}

      {showChrome && !state.unlockedFullUi && (
        <div className="border-t border-line/50 px-4 py-3 text-center text-[11px] text-ink-muted">
          رابط کامل پس از ۳ روز بازی — یا از فروشگاه / تنظیمات آنلاک کنید.
          <div className="mt-2 flex justify-center gap-4">
            <button
              type="button"
              className="text-amber underline"
              onClick={() => game.setTab('story')}
            >
              داستان
            </button>
            <button
              type="button"
              className="text-amber underline"
              onClick={() => game.setTab('shop')}
            >
              فروشگاه
            </button>
          </div>
        </div>
      )}

      <SettingsModal
        open={game.settingsOpen}
        onClose={() => game.setSettingsOpen(false)}
        onUnlock={() => void game.unlockDebug()}
        busy={game.busy}
        playDayCount={state.playDayCount}
        unlocked={state.unlockedFullUi}
      />

      <InboxModal
        open={game.inboxOpen}
        items={game.inboxItems}
        onClose={() => game.setInboxOpen(false)}
        onRead={(id) => void game.markInboxRead(id)}
      />

      <RewardedAdModal
        open={game.adOpen}
        busy={game.busy}
        onClose={() => game.setAdOpen(false)}
        onComplete={() => void game.claimAd()}
      />
    </div>
  );
}
