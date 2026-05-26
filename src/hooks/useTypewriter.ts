'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseTypewriterOptions {
  text: string;
  speed?: number;
  delay?: number;
  loop?: boolean;
}

export function useTypewriter({
  text,
  speed = 60,
  delay = 500,
  loop = false,
}: UseTypewriterOptions) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const startTyping = useCallback(() => {
    setDisplayText('');
    setIsTyping(true);
    setIsDone(false);
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    // Initial delay before typing starts
    timeout = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!isTyping) return;

    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsTyping(false);
      setIsDone(true);

      if (loop) {
        const timeout = setTimeout(() => {
          startTyping();
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, isTyping, text, speed, loop, startTyping]);

  return { displayText, isTyping, isDone };
}
