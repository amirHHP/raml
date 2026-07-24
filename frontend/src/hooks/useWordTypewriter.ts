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

/** Word-by-word typewriter for atmospheric intro text. */
export function useWordTypewriter(text: string, msPerWord = 520) {
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
    const interval = window.setInterval(() => {
      i += 1;
      setDisplayed(joinWordParts(parts.slice(0, i)));
      if (i >= parts.length) {
        window.clearInterval(interval);
        setDone(true);
      }
    }, Math.max(80, msPerWord));

    return () => window.clearInterval(interval);
  }, [text, msPerWord]);

  const skip = () => {
    setDisplayed(text);
    setDone(true);
  };

  return { displayed, done, skip };
}
