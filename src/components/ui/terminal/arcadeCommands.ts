import type { ConsoleLine } from './types';

export function getPlaygroundLaunchLines(): ConsoleLine[] {
  return [
    { text: 'LAUNCHING THE PLAYGROUND (PORTFOLIO SANDBOXES)...', type: 'success' },
    { text: '  - Redirecting to /playground interactive showcase.', type: 'output' },
  ];
}
