import { useWordTypewriter } from '../hooks/useWordTypewriter';
import type { EnemyLineArtType } from '../types/game';
import { EnemyLineArt } from './EnemyLineArt';
import { IconPin } from './icons';

const STORY_MS_PER_WORD = 700;

export function StoryArea({
  text,
  location,
  enemyType,
  showLocation,
}: {
  text: string;
  location: string;
  enemyType: EnemyLineArtType;
  showLocation: boolean;
}) {
  const { displayed, done, skip } = useWordTypewriter(text, STORY_MS_PER_WORD);

  return (
    <section className="px-4 pt-4">
      {showLocation && (
        <p className="mb-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <IconPin size={14} className="text-amber" />
          <span>{location}</span>
        </p>
      )}

      <EnemyLineArt type={enemyType} />

      <button
        type="button"
        onClick={skip}
        className="story-scroll w-full text-right"
        aria-label="متن داستان"
      >
        <p className="whitespace-pre-wrap text-[15px] leading-8 text-ink-dim">
          {displayed}
          {!done && (
            <span className="mr-0.5 inline-block w-1.5 animate-pulse bg-ink-muted align-middle">
              {' '}
            </span>
          )}
        </p>
      </button>
    </section>
  );
}
