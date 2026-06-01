'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

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
      className="comic-btn comic-btn-blue text-sm flex items-center justify-center font-headline"
      disabled={isRefreshing}
      style={{ minWidth: '150px' }}
    >
      <RefreshCw
        size={18}
        className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
      />
      {isRefreshing ? 'REFRESHING...' : 'REFRESH PANEL'}
    </button>
  );
}
