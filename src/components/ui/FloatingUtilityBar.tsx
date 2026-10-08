'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import ZenToggle from '@/components/ui/ZenToggle';
import { useTheme } from '@/context/ThemeContext';
import styles from './FloatingUtilityBar.module.css';

const GestureScroll = dynamic(
  () => import('@/components/ui/GestureScroll/GestureScroll'),
  { ssr: false }
);

export default function FloatingUtilityBar() {
  const { isDetailsHidden } = useTheme();

  return (
    <aside className={styles.barContainer} aria-label="Quick controls dock">
      <div className={styles.dockCapsule}>
        <ZenToggle />
        {!isDetailsHidden && (
          <>
            <div className={styles.dockDivider} aria-hidden="true" />
            <GestureScroll />
          </>
        )}
      </div>
    </aside>
  );
}
