import { useEffect, useState } from 'react';

/** Full-screen natural eye-opening transition before entering the world. */
export function EyesOpenOverlay({ visible }: { visible: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      return;
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
      role="presentation"
      aria-hidden
    >
      <div className="eyes-open-pair">
        <Eye />
        <Eye />
      </div>
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
