'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { isAdminEmail } from '@/lib/auth';
import { Layers, ShieldCheck, Bot, UserCheck } from 'lucide-react';
import styles from './WorkspaceSwitcher.module.css';

interface WorkspaceSwitcherProps {
  active: 'dashboard' | 'rag';
}

export default function WorkspaceSwitcher({ active }: WorkspaceSwitcherProps) {
  const { user } = useAuth();
  const isAdmin = isAdminEmail(user?.email);

  return (
    <div className={styles.container}>
      <div className={styles.switchGroup}>
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className={`${styles.switchBtn} ${active === 'dashboard' ? styles.activeDashboard : ''}`}
        >
          {isAdmin ? <ShieldCheck size={16} /> : <Layers size={16} />}
          <span>{isAdmin ? '🛡️ Master Admin Center' : '📁 Custom Dev Client Portal'}</span>
        </Link>
        <Link
          href="/rag/app"
          className={`${styles.switchBtn} ${active === 'rag' ? styles.activeRag : ''}`}
        >
          <Bot size={16} />
          <span>⚡ Retriever RAG Studio</span>
        </Link>
      </div>

      {user && (
        <div className={styles.userBadge}>
          <span className={styles.userDot} />
          <UserCheck size={14} />
          <span>{user.email}</span>
        </div>
      )}
    </div>
  );
}
