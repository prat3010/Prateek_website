/** Sticky navbar height + breathing room for smooth scroll offsets */
export const NAVBAR_SCROLL_OFFSET = -80;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 992,
  XL: 1200,
} as const;

export type BreakpointName = keyof typeof BREAKPOINTS;
