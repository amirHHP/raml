import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useWordTypewriter } from '../hooks/useWordTypewriter';
import type { EnemyLineArtType, GameOption, GameState, StoryHistoryEntry } from '../types/game';

function parseHistoryBubbles(
  history: Array<string | StoryHistoryEntry>,
  currentState?: { enemyLineArtType: EnemyLineArtType; asciiArt?: string | null; svgArt?: string | null },
): ChatBubble[] {
  if (!history || history.length === 0) return [];
  return history.map((item, idx) => {
    if (typeof item === 'string') {
      const isLast = idx === history.length - 1;
      return {
        id: `hist-story-${idx}`,
        kind: 'story',
        text: item,
        enemyLineArtType: isLast ? currentState?.enemyLineArtType : 'none',
        asciiArt: isLast ? currentState?.asciiArt : null,
        svgArt: isLast ? currentState?.svgArt : null,
      };
    }
    if (item.kind === 'choice') {
      return {
        id: `hist-choice-${idx}`,
        kind: 'choice',
        text: item.text,
        effect: item.effect || '',
        icon: item.icon || 'search',
      };
    }
    const isLast = idx === history.length - 1;
    return {
      id: `hist-story-${idx}`,
      kind: 'story',
      text: item.text,
      enemyLineArtType: item.enemyLineArtType || (isLast ? currentState?.enemyLineArtType : 'none'),
      asciiArt: item.asciiArt !== undefined ? item.asciiArt : (isLast ? currentState?.asciiArt : null),
      svgArt: item.svgArt !== undefined ? item.svgArt : (isLast ? currentState?.svgArt : null),
    };
  });
}
import { optionEffectLabel } from '../utils/optionEffect';
import { ActionCards } from './ActionCards';
import { DiceRoller } from './DiceRoller';
import { EnemyLineArt } from './EnemyLineArt';
import { EnergyDepletedScreen } from './EnergyDepletedScreen';
import { ACTION_ICONS, IconChevronDown, IconPin } from './icons';
import { DEFAULT_STORY_MS_PER_WORD } from '../utils/storyPacing';
import { track } from '../analytics/funnel';

const NEAR_BOTTOM_PX = 80;

type StoryBubble = {
  id: string;
  kind: 'story';
  text: string;
  enemyLineArtType?: EnemyLineArtType;
  asciiArt?: string | null;
  svgArt?: string | null;
};

type ChoiceBubble = {
  id: string;
  kind: 'choice';
  text: string;
  effect: string;
  icon: GameOption['icon'];
};

type ChatBubble = StoryBubble | ChoiceBubble;

let bubbleSeq = 0;
function nextId(prefix: string): string {
  bubbleSeq += 1;
  return `${prefix}-${bubbleSeq}`;
}

function StoryBubbleView({
  text,
  animate,
  msPerWord,
  onDone,
}: {
  text: string;
  animate: boolean;
  msPerWord: number;
  onDone?: () => void;
}) {
  const { displayed, done, skip } = useWordTypewriter(text, msPerWord);

  useEffect(() => {
    if (!animate) skip();
    // intentionally omit skip — unstable identity from hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, text]);

  useEffect(() => {
    if (!animate || done) onDone?.();
  }, [animate, done, onDone]);

  return (
    <button
      type="button"
      onClick={() => {
        if (animate && !done) track('story_skipped');
        skip();
      }}
      className="w-full text-right"
      aria-label="متن داستان — برای نمایش کامل لمس کنید"
    >
      <p className="whitespace-pre-wrap text-[15px] leading-8 text-ink">
        {animate ? displayed : text}
        {animate && !done && (
          <span className="mr-0.5 inline-block w-1.5 animate-pulse bg-ink-muted align-middle">
            {' '}
          </span>
        )}
      </p>
      {animate && !done && (
        <span className="mt-3 block text-[11px] text-ink-muted">
          برای رد کردن، لمس کن
        </span>
      )}
    </button>
  );
}

function ChoiceBubbleView({ bubble }: { bubble: ChoiceBubble }) {
  const Icon = ACTION_ICONS[bubble.icon] || ACTION_ICONS.search;
  return (
    <div className="flex justify-end px-1">
      <div className="inline-flex max-w-[92%] items-center gap-2 rounded-xl border border-amber/50 bg-panel px-3 py-2.5">
        <Icon size={16} className="shrink-0 text-amber" />
        <p className="text-sm leading-6 text-ink">{bubble.text}</p>
        <span className="shrink-0 text-[11px] text-amber">{bubble.effect}</span>
      </div>
    </div>
  );
}

export function StoryChat({
  state,
  busy,
  refillPriceTomans,
  scrollContainerRef,
  onChoose,
  onRoll,
  onWatchAd,
  onBuyRefill,
  onTimerElapsed,
}: {
  state: GameState;
  busy: boolean;
  refillPriceTomans: number | null;
  scrollContainerRef: RefObject<HTMLElement | null>;
  onChoose: (optionId: string) => void;
  onRoll: (raw: number, modifier: number) => Promise<void>;
  onWatchAd: () => void;
  onBuyRefill: () => void;
  onTimerElapsed: () => void;
}) {
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [animateLatest, setAnimateLatest] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [showJump, setShowJump] = useState(false);
  const [stickToBottom, setStickToBottom] = useState(true);

  const lastStoryRef = useRef<string | null>(null);
  const lastTurnRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingDoneRef = useRef(false);
  const choicePendingRef = useRef(false);
  const turnAtChoiceRef = useRef(0);
  const energyEmpty = state.stats.energy < 1;
  const msPerWord = state.storyMsPerWord || DEFAULT_STORY_MS_PER_WORD;
  const latestKind = bubbles.length > 0 ? bubbles[bubbles.length - 1]?.kind : null;
  const latestIsStory = latestKind === 'story';

  // Hydrate past turns, then sync when a new turn arrives
  useEffect(() => {
    const history =
      state.storyHistory?.length > 0
        ? state.storyHistory
        : state.storyText
          ? [state.storyText]
          : [];

    if (!hydrated) {
      const initialBubbles = parseHistoryBubbles(history, {
        enemyLineArtType: state.enemyLineArtType,
        asciiArt: state.asciiArt,
        svgArt: state.svgArt,
      });
      setBubbles(initialBubbles);
      lastStoryRef.current = state.storyText;
      lastTurnRef.current = state.storyTurnCount || history.length;
      const animateFirst = history.length <= 1;
      setAnimateLatest(animateFirst);
      setTypingDone(!animateFirst);
      typingDoneRef.current = !animateFirst;
      setHydrated(true);
      return;
    }

    const turn = state.storyTurnCount || 0;
    const textChanged = Boolean(state.storyText) && state.storyText !== lastStoryRef.current;
    const turnAdvanced = turn > lastTurnRef.current;

    if (!textChanged && !turnAdvanced) return;
    if (!state.storyText) return;

    lastStoryRef.current = state.storyText;
    lastTurnRef.current = turnAdvanced ? turn : lastTurnRef.current + 1;

    setBubbles(
      parseHistoryBubbles(history, {
        enemyLineArtType: state.enemyLineArtType,
        asciiArt: state.asciiArt,
        svgArt: state.svgArt,
      }),
    );
    setAnimateLatest(true);
    setTypingDone(false);
    typingDoneRef.current = false;
    setStickToBottom(true);
  }, [hydrated, state.storyHistory, state.storyText, state.storyTurnCount]);

  const handleTypingDone = () => {
    if (typingDoneRef.current) return;
    typingDoneRef.current = true;
    setTypingDone(true);
    setAnimateLatest(false);
  };

  const handleChoose = (optionId: string) => {
    const opt = state.options.find((o) => o.id === optionId);
    if (!opt || busy) return;
    track('first_choice');
    choicePendingRef.current = true;
    turnAtChoiceRef.current = state.storyTurnCount || 0;
    setBubbles((prev) => [
      ...prev,
      {
        id: nextId('choice'),
        kind: 'choice',
        text: opt.text,
        effect: optionEffectLabel(opt),
        icon: opt.icon,
      },
    ]);
    setStickToBottom(true);
    onChoose(optionId);
  };

  // If AI failed, story turn didn't advance — remove optimistic choice bubble
  useEffect(() => {
    if (busy || !choicePendingRef.current) return;
    choicePendingRef.current = false;
    if ((state.storyTurnCount || 0) <= turnAtChoiceRef.current) {
      setBubbles((prev) => {
        const last = prev[prev.length - 1];
        if (last?.kind === 'choice') return prev.slice(0, -1);
        return prev;
      });
    }
  }, [busy, state.storyTurnCount]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setStickToBottom(true);
    setShowJump(false);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      const near = distance <= NEAR_BOTTOM_PX;
      setStickToBottom(near);
      setShowJump(!near);
    };

    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    if (!stickToBottom) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [bubbles, typingDone, busy, stickToBottom, scrollContainerRef, state.options]);

  // If a choice was locked in but story didn't advance (error), still allow picking again
  // once busy clears and options are present.
  const showActions =
    typingDone &&
    !busy &&
    !state.needsDiceRoll &&
    !energyEmpty &&
    state.options.length > 0 &&
    (latestIsStory || latestKind === 'choice');

  return (
    <div className="relative flex flex-col gap-5 px-4 pb-4 pt-4">
      {(state.featureUnlocks?.inventory ||
        state.featureUnlocks?.stats ||
        state.unlockedFullUi) && (
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <IconPin size={14} className="text-amber" />
          <span>{state.currentLocation}</span>
        </p>
      )}

      {bubbles.map((bubble, index) => {
        const isLatest = index === bubbles.length - 1;
        if (bubble.kind === 'choice') {
          return <ChoiceBubbleView key={bubble.id} bubble={bubble} />;
        }

        const lineArtType = isLatest ? state.enemyLineArtType : (bubble.enemyLineArtType || 'none');
        const asciiArt = isLatest ? state.asciiArt : bubble.asciiArt;
        const svgArt = isLatest ? state.svgArt : bubble.svgArt;

        return (
          <div key={bubble.id} className="flex flex-col gap-3">
            <EnemyLineArt type={lineArtType} asciiArt={asciiArt} svgArt={svgArt} />
            <StoryBubbleView
              text={bubble.text}
              animate={isLatest && animateLatest}
              msPerWord={msPerWord}
              onDone={isLatest ? handleTypingDone : undefined}
            />
          </div>
        );
      })}

      {typingDone && state.needsDiceRoll && (
        <DiceRoller state={state} busy={busy} onRoll={onRoll} />
      )}

      {typingDone && !state.needsDiceRoll && energyEmpty && (
        <EnergyDepletedScreen
          msUntilNextEnergy={state.msUntilNextEnergy}
          energyRegenMinutes={state.energyRegenMinutes}
          refillPriceTomans={refillPriceTomans}
          busy={busy}
          onWatchAd={onWatchAd}
          onBuyRefill={onBuyRefill}
          onTimerElapsed={onTimerElapsed}
        />
      )}

      {showActions && (
        <div className="-mx-4">
          <ActionCards
            options={state.options}
            stats={state.stats}
            busy={busy}
            onChoose={handleChoose}
          />
        </div>
      )}

      {busy && (
        <p className="text-center text-xs text-ink-muted">
          استاد بازی در حال نوشتن...
        </p>
      )}

      <div ref={bottomRef} />

      {showJump && (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="fixed bottom-24 left-1/2 z-30 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-amber/40 bg-panel text-amber shadow-lg amber-glow"
          aria-label="رفتن به پایین"
        >
          <IconChevronDown size={20} />
        </button>
      )}
    </div>
  );
}
