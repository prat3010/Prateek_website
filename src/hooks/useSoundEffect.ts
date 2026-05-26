'use client';

import { useSoundContext } from '@/components/effects/SoundManager';

/**
 * Convenience hook wrapping SoundManager context for easy consumption.
 *
 * @example
 * ```tsx
 * const { play, toggleMute, isMuted } = useSoundEffect();
 * play('pow');
 * ```
 */
export function useSoundEffect() {
  const { playSound, toggleMute, isMuted } = useSoundContext();

  return {
    play: playSound,
    toggleMute,
    isMuted,
  };
}
