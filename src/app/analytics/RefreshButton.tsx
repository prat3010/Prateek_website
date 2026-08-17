'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import styles from './analytics.module.css';

export default function RefreshButton() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    // Give it a brief spin animation duration
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  return (
    <button
      onClick={handleRefresh}
      className={`comic-btn comic-btn-blue font-headline ${styles.refreshBtn}`}
      disabled={isRefreshing}
    >
      <RefreshCw
        size={18}
        style={{ marginRight: '8px' }}
        className={isRefreshing ? styles.spinning : ''}
      />
      {isRefreshing ? 'REFRESHING...' : 'REFRESH PANEL'}
    </button>
  );
}
