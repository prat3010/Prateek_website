'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import ZenToggle from '@/components/ui/ZenToggle';
import styles from './FloatingUtilityBar.module.css';

const GestureScroll = dynamic(
  () => import('@/components/ui/GestureScroll/GestureScroll'),
  { ssr: false }
);

export default function FloatingUtilityBar() {
  return (
    <div className={styles.barContainer}>
      <ZenToggle />
      <GestureScroll />
    </div>
  );
}
