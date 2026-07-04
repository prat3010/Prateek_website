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
  const [prevText, setPrevText] = useState(text);

  if (text !== prevText) {
    setPrevText(text);
    setDisplayText('');
    setIsTyping(false);
  }

  const isDone = !loop && !isTyping && text !== '' && displayText === text;

  useEffect(() => {
    if (!text) return;

    const delayTimer = setTimeout(() => {
      setIsTyping(true);
    }, delay);

    return () => {
      clearTimeout(delayTimer);
    };
  }, [text, delay]);

  useEffect(() => {
    if (!isTyping || !text) return;

    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(text.slice(0, displayText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    }

    if (!loop) {
      const doneTimer = setTimeout(() => {
        setIsTyping(false);
      }, 0);
      return () => clearTimeout(doneTimer);
    }

    const loopTimer = setTimeout(() => {
      setDisplayText('');
      setIsTyping(true);
    }, 2000);
    return () => clearTimeout(loopTimer);
  }, [displayText, isTyping, text, speed, loop]);

  return { displayText, isTyping, isDone };
}
