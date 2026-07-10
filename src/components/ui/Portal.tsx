'use client';

import { useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: ReactNode;
  /**
   * Optional custom selector or HTMLElement container.
   * Defaults to `document.body` if not specified.
   */
  target?: string | HTMLElement;
}

export default function Portal({ children, target }: PortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (active) {
        setMounted(true);
      }
    }, 0);
    return () => {
      active = false;
    };
  }, []);

  if (!mounted) return null;

  const container = !target
    ? document.body
    : target instanceof HTMLElement
    ? target
    : (document.querySelector(target) as HTMLElement) || document.body;

  return createPortal(children, container);
}
