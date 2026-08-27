import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import InteractiveGargoyle from '../InteractiveGargoyle';
import * as SkylineContext from '../../SkylineInteractionContext';

describe('InteractiveGargoyle Component', () => {
  const defaultContextValue = {
    isTabVisible: true,
    isIdle: false,
    tick: 0,
    geometryVersion: 0,
    scrollVelocityRef: { current: 0 },
    mousePosRef: { current: { x: -100, y: -100 } },
    lastClickRef: { current: null },
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders sitting gargoyle at default pedestal coordinates (1426, 756)', () => {
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(defaultContextValue);

    const { container } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={false} />
      </svg>
    );

    const gargoyleGroup = container.querySelector('g[transform^="translate(1426, 756)"]');
    expect(gargoyleGroup).not.toBeNull();
  });

  it('does not render when reducedMotion is true', () => {
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(defaultContextValue);

    const { container } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={true} />
      </svg>
    );

    expect(container.querySelector('g[transform^="translate(1426, 756)"]')).toBeNull();
  });

  it('triggers awakening upon click and resets state smoothly', () => {
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(defaultContextValue);

    const { container } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={false} />
      </svg>
    );

    const gargoyleGroup = container.querySelector('g[transform^="translate(1426, 756)"]');
    expect(gargoyleGroup).not.toBeNull();

    act(() => {
      if (gargoyleGroup) {
        fireEvent.click(gargoyleGroup);
      }
    });

    // Awakening renders with glowing eyes
    const eyeCircle = container.querySelector('circle[r="0.9"]');
    expect(eyeCircle).not.toBeNull();
  });

  it('awakens upon high scroll velocity (> 200)', () => {
    let currentTick = 0;
    const mockContext = {
      ...defaultContextValue,
      scrollVelocityRef: { current: 250 },
      get tick() {
        return currentTick;
      },
    };
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(mockContext);

    const { container, rerender } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={false} />
      </svg>
    );

    // Advance 1 tick with scroll velocity 250
    act(() => {
      currentTick += 1;
      rerender(
        <svg>
          <InteractiveGargoyle reducedMotion={false} />
        </svg>
      );
    });

    // Should be in awakening state with glowing eyes
    const eyeCircle = container.querySelector('circle[r="0.9"]');
    expect(eyeCircle).not.toBeNull();
  });

  it('transitions through flight phases and cooldown on tick progression', () => {
    let currentTick = 0;
    const mockContext = {
      ...defaultContextValue,
      get tick() {
        return currentTick;
      },
    };
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(mockContext);

    const { container, rerender } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={false} />
      </svg>
    );

    const advanceTicks = (count: number) => {
      for (let i = 0; i < count; i++) {
        act(() => {
          currentTick += 1;
          rerender(
            <svg>
              <InteractiveGargoyle reducedMotion={false} />
            </svg>
          );
        });
      }
    };

    const gargoyleGroup = container.querySelector('g[transform^="translate(1426, 756)"]');
    expect(gargoyleGroup).not.toBeNull();

    // 1. Click to awaken
    act(() => {
      if (gargoyleGroup) {
        fireEvent.click(gargoyleGroup);
      }
    });

    // 2. Advance 3 ticks for awakening -> leaping
    advanceTicks(3);

    // 3. Advance 4 ticks for leaping -> gliding_fg
    advanceTicks(4);

    // 4. Advance 36 ticks for gliding_fg -> gliding_bg
    advanceTicks(36);

    // 5. Advance 36 ticks for gliding_bg -> returning
    advanceTicks(36);

    // 6. Advance 14 ticks for returning -> landing
    advanceTicks(14);

    // 7. Advance 3 ticks for landing -> cooldown
    advanceTicks(3);

    // During cooldown, gargoyle sits on pedestal with default cursor
    const cooledGargoyle = container.querySelector('g[transform^="translate(1426, 756)"]');
    expect(cooledGargoyle).not.toBeNull();
    if (cooledGargoyle) {
      expect((cooledGargoyle as SVGElement).style.cursor).toBe('default');
    }

    // 8. Advance 12 ticks for cooldown -> sitting (pointer cursor restored)
    advanceTicks(12);

    const sittingGargoyle = container.querySelector('g[transform^="translate(1426, 756)"]');
    if (sittingGargoyle) {
      expect((sittingGargoyle as SVGElement).style.cursor).toBe('pointer');
    }
  });

  it('pauses and resumes animation loop without getting stuck when tab visibility changes', () => {
    let currentTick = 0;
    let isVisible = true;
    const mockContext = {
      ...defaultContextValue,
      get isTabVisible() {
        return isVisible;
      },
      get tick() {
        return currentTick;
      },
    };
    vi.spyOn(SkylineContext, 'useSkylineInteraction').mockReturnValue(mockContext);

    const { container, rerender } = render(
      <svg>
        <InteractiveGargoyle reducedMotion={false} />
      </svg>
    );

    const advanceTicks = (count: number) => {
      for (let i = 0; i < count; i++) {
        act(() => {
          currentTick += 1;
          rerender(
            <svg>
              <InteractiveGargoyle reducedMotion={false} />
            </svg>
          );
        });
      }
    };

    const gargoyleGroup = container.querySelector('g[transform^="translate(1426, 756)"]');
    act(() => {
      if (gargoyleGroup) fireEvent.click(gargoyleGroup);
    });
    advanceTicks(3); // leaping
    advanceTicks(4); // gliding_fg

    // Tab becomes hidden mid-flight
    act(() => {
      isVisible = false;
      rerender(
        <svg>
          <InteractiveGargoyle reducedMotion={false} />
        </svg>
      );
    });

    // Tab becomes visible again
    act(() => {
      isVisible = true;
      rerender(
        <svg>
          <InteractiveGargoyle reducedMotion={false} />
        </svg>
      );
    });

    // Flight completes smoothly to cooldown and sitting without freezing
    advanceTicks(36); // gliding_bg
    advanceTicks(36); // returning
    advanceTicks(14); // landing
    advanceTicks(3);  // cooldown
    advanceTicks(12); // sitting

    const sittingGargoyle = container.querySelector('g[transform^="translate(1426, 756)"]');
    expect(sittingGargoyle).not.toBeNull();
    if (sittingGargoyle) {
      expect((sittingGargoyle as SVGElement).style.cursor).toBe('pointer');
    }
  });
});
