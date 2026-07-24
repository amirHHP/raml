import { useEffect, useState } from 'react';

/** Character-by-character typewriter for story text (RTL-safe). */
export function useTypewriter(text: string, cps = 28) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    if (!text) {
      setDone(true);
      return;
    }

    let i = 0;
    const interval = window.setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(interval);
        setDone(true);
      }
    }, Math.max(12, 1000 / cps));

    return () => window.clearInterval(interval);
  }, [text, cps]);

  const skip = () => {
    setDisplayed(text);
    setDone(true);
  };

  return { displayed, done, skip };
}
