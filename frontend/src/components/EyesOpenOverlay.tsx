import { useEffect, useState } from 'react';
import { EYES_OPEN_SKIPPABLE_AFTER_MS } from '../utils/storyPacing';

/** Full-screen natural eye-opening transition before entering the world. */
export function EyesOpenOverlay({
  visible,
  onSkip,
}: {
  visible: boolean;
  onSkip?: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [skippable, setSkippable] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      setSkippable(false);
      const t = window.setTimeout(
        () => setSkippable(true),
        EYES_OPEN_SKIPPABLE_AFTER_MS,
      );
      return () => window.clearTimeout(t);
    }
    if (!mounted) return;

    setExiting(true);
    const t = window.setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, 700);
    return () => window.clearTimeout(t);
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <div
      className={`eyes-open-overlay${exiting ? ' is-exiting' : ''}`}
      role={skippable ? 'button' : 'presentation'}
      tabIndex={skippable ? 0 : -1}
      aria-label={skippable ? 'رد کردن بیداری' : undefined}
      aria-hidden={!skippable}
      onClick={skippable ? onSkip : undefined}
    >
      <div className="eyes-open-pair">
        <Eye />
        <Eye />
      </div>
      <span
        className={`eyes-open-hint${skippable && !exiting ? ' is-visible' : ''}`}
      >
        برای رد کردن، لمس کن
      </span>
    </div>
  );
}

function Eye() {
  return (
    <div className="eye-socket">
      <div className="eye-globe">
        <span className="eye-iris" />
        <span className="eye-pupil" />
        <span className="eye-shine" />
      </div>
      <div className="eye-lid eye-lid-upper" />
      <div className="eye-lid eye-lid-lower" />
    </div>
  );
}
