'use client';

import { useState, useEffect } from 'react';

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

  // Reset and restart the typewriter process whenever the target text or delay changes
  useEffect(() => {
    setDisplayText('');
    setIsTyping(false);
    setIsDone(false);

    if (!text) return;

    const timeout = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  // Handle character-by-character typing
  useEffect(() => {
    if (!isTyping || !text) return;

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
          setDisplayText('');
          setIsTyping(true);
          setIsDone(false);
        }, 2000);
        return () => clearTimeout(timeout);
      }
    }
  }, [displayText, isTyping, text, speed, loop]);

  return { displayText, isTyping, isDone };
}

