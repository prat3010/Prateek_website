'use client';

import React from 'react';
import ZenToggle from '@/components/ui/ZenToggle';
import GestureScroll from '@/components/ui/GestureScroll/GestureScroll';
import styles from './FloatingUtilityBar.module.css';

export default function FloatingUtilityBar() {
  return (
    <div className={styles.barContainer}>
      <ZenToggle />
      <GestureScroll />
    </div>
  );
}
