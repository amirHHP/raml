import { useEffect, useState } from 'react';

/** Split text into words / newline runs for RTL-safe word reveal. */
export function splitWords(text: string): string[] {
  return text.match(/[^\s]+|\n+/g) ?? [];
}

export function joinWordParts(parts: string[]): string {
  let result = '';
  for (const part of parts) {
    if (part.startsWith('\n')) {
      result += part;
    } else if (result && !result.endsWith('\n')) {
      result += ` ${part}`;
    } else {
      result += part;
    }
  }
  return result;
}

/** Word-by-word typewriter for atmospheric intro text. Pauses while the tab is hidden. */
export function useWordTypewriter(text: string, msPerWord = 400) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) {
      setDone(true);
      return;
    }

    const parts = splitWords(text);
    if (parts.length === 0) {
      setDone(true);
      return;
    }

    let i = 0;
    let interval = 0;

    const clear = () => {
      if (interval) window.clearInterval(interval);
      interval = 0;
    };

    const tick = () => {
      if (document.hidden) return;
      i += 1;
      setDisplayed(joinWordParts(parts.slice(0, i)));
      if (i >= parts.length) {
        clear();
        setDone(true);
      }
    };

    const start = () => {
      if (interval || i >= parts.length) return;
      interval = window.setInterval(tick, Math.max(80, msPerWord));
    };

    const onVisibility = () => {
      if (document.hidden) {
        clear();
      } else if (i < parts.length && !document.hidden) {
        start();
      }
    };

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clear();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [text, msPerWord]);

  const skip = () => {
    setDisplayed(text);
    setDone(true);
  };

  return { displayed, done, skip };
}
