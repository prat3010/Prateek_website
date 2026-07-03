'use client';

import { useState, useEffect, useRef } from 'react';

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
  const prevTextRef = useRef(text);

  useEffect(() => {
    if (text !== prevTextRef.current) {
      prevTextRef.current = text;
      setDisplayText('');
      setIsTyping(false);
    }
  }, [text]);

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
      queueMicrotask(() => setIsTyping(false));
      return;
    }

    const loopTimer = setTimeout(() => {
      setDisplayText('');
      setIsTyping(true);
    }, 2000);
    return () => clearTimeout(loopTimer);
  }, [displayText, isTyping, text, speed, loop]);

  return { displayText, isTyping, isDone };
}
