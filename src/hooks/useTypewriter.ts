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
  const [state, setState] = useState({
    displayText: '',
    isTyping: false,
    prevText: text,
  });

  if (text !== state.prevText) {
    setState({
      displayText: '',
      isTyping: false,
      prevText: text,
    });
  }

  const { displayText, isTyping } = state;
  const isDone = !loop && !isTyping && text !== '' && displayText === text;

  useEffect(() => {
    if (!text) return;

    const delayTimer = setTimeout(() => {
      setState(prev => ({ ...prev, isTyping: true }));
    }, delay);

    return () => {
      clearTimeout(delayTimer);
    };
  }, [text, delay]);

  useEffect(() => {
    if (!isTyping || !text) return;

    if (displayText.length < text.length) {
      const timeout = setTimeout(() => {
        setState(prev => ({
          ...prev,
          displayText: text.slice(0, prev.displayText.length + 1)
        }));
      }, speed);
      return () => clearTimeout(timeout);
    }

    if (!loop) {
      const doneTimer = setTimeout(() => {
        setState(prev => ({ ...prev, isTyping: false }));
      }, 0);
      return () => clearTimeout(doneTimer);
    }

    const loopTimer = setTimeout(() => {
      setState(prev => ({ ...prev, displayText: '', isTyping: true }));
    }, 2000);
    return () => clearTimeout(loopTimer);
  }, [displayText, isTyping, text, speed, loop]);

  return { displayText, isTyping, isDone };
}
