import { useRef, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
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
import { EYES_OPEN_MS } from './utils/storyPacing';
import { track } from './analytics/funnel';

export default function App() {
  const game = useGame();
  const [openingEyes, setOpeningEyes] = useState(false);
  const scrollRef = useRef<HTMLElement>(null);
  const skipEyesRef = useRef<(() => void) | null>(null);

  const handleAwaken = async (name: string) => {
    setOpeningEyes(true);
    const minAnim = new Promise<void>((resolve) => {
      const timer = window.setTimeout(resolve, EYES_OPEN_MS);
      skipEyesRef.current = () => {
        window.clearTimeout(timer);
        resolve();
      };
    });
    await game.awaken(name);
    await minAnim;
    skipEyesRef.current = null;
    setOpeningEyes(false);
    track('awaken_complete');
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
  const unlocks = state.featureUnlocks || {
    inventory: false,
    stats: false,
    hp: false,
    mana: false,
    gold: false,
  };
  const showChrome = state.awakened && !openingEyes;
  const showBottomNav = showChrome;
  const refillPrice =
    game.shop.find((item) => item.sku === 'energy_refill')?.priceTomans ?? null;

  return (
    <div className="mx-auto flex h-full max-w-lg flex-col bg-oled">
      {showChrome && (
        <StatusBar
          state={state}
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

      <EyesOpenOverlay
        visible={openingEyes}
        onSkip={() => {
          track('eyes_skipped');
          skipEyesRef.current?.();
        }}
      />

      <main
        ref={scrollRef}
        className={`flex-1 overflow-y-auto story-scroll ${
          showBottomNav ? 'pb-24' : 'pb-8'
        }`}
      >
        {!state.awakened ? (
          <AwakenScreen
            storyText={state.storyText}
            busy={game.busy || openingEyes}
            storyMsPerWord={state.storyMsPerWord}
            onAwaken={handleAwaken}
            onRestore={(code) => game.restoreSave(code)}
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
                  void game.refreshEnergy().catch(() => undefined);
                }}
              />
            )}
            {game.tab === 'inventory' && unlocks.inventory && (
              <InventoryPanel items={state.inventory} />
            )}
            {game.tab === 'stats' && unlocks.stats && <StatsPanel state={state} />}
            {game.tab === 'shop' && (
              <ShopPanel
                items={game.shop}
                state={state}
                busy={game.busy}
                onBuy={(sku) => void game.buySku(sku)}
                onWatchAd={() => game.setAdOpen(true)}
                onRestore={(code) => game.restoreSave(code)}
              />
            )}
          </>
        )}
      </main>

      {showBottomNav && (
        <BottomNav
          active={game.tab}
          onChange={game.setTab}
          showInventory={unlocks.inventory}
          showStats={unlocks.stats}
        />
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
      <Analytics />
      <SpeedInsights />
    </div>
  );
}
