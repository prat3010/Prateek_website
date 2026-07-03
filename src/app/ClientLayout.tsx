'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import type { Theme, Audience } from '@/context/ThemeContext';
import { ThemeProvider, useAudience } from '@/context/ThemeContext';
import { LenisProvider } from '@/context/LenisProvider';
import ThemeTransition from '@/components/effects/ThemeTransition';
import { LazyMotion, domAnimation } from 'framer-motion';
import OnboardingSelector from '@/components/ui/OnboardingSelector';

// Lazy load heavy client side animations
const NoirSkyline = dynamic(() => import('@/components/effects/NoirSkyline'), { 
  ssr: false,
  loading: () => <div className="skyline-skeleton" />
});
const CursorTrail = dynamic(() => import('@/components/effects/CursorTrail'), { ssr: false });
const ZenToggle = dynamic(() => import('@/components/ui/ZenToggle'), { ssr: false });
const TerminalButton = dynamic(() => import('@/components/ui/TerminalButton'), { ssr: false });

interface ClientLayoutProps {
  children: React.ReactNode;
  initialTheme: Theme;
  initialAudience: Audience | null;
}

function ClientLayoutContent({ children, isAdminRoute }: { children: React.ReactNode; isAdminRoute: boolean }) {
  const { audience } = useAudience();
  const [shouldRenderCursor, setShouldRenderCursor] = useState(false);

  useEffect(() => {
    if (isAdminRoute) return;

    if (typeof window !== 'undefined') {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lowCores = (navigator.hardwareConcurrency ?? 4) < 4;
      const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      const saveData = connection?.saveData;

      if (prefersReduced || lowCores || saveData) {
        return;
      }
    }

    const handleFirstMove = () => {
      setShouldRenderCursor(true);
      window.removeEventListener('mousemove', handleFirstMove);
    };

    window.addEventListener('mousemove', handleFirstMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleFirstMove);
  }, [isAdminRoute]);

  return (
    <LenisProvider>
      <ThemeTransition />
      {!isAdminRoute && <NoirSkyline />}
      {!isAdminRoute && shouldRenderCursor && <CursorTrail />}
      {!isAdminRoute && <Navbar />}
      
      {audience === null ? (
        <OnboardingSelector />
      ) : (
        <main>{children}</main>
      )}

      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ZenToggle />}
      {!isAdminRoute && <TerminalButton />}
    </LenisProvider>
  );
}

export default function ClientLayout({ children, initialTheme, initialAudience }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider initialTheme={initialTheme} initialAudience={initialAudience}>
      <LazyMotion features={domAnimation}>
        <ClientLayoutContent isAdminRoute={isAdminRoute}>
          {children}
        </ClientLayoutContent>
      </LazyMotion>
    </ThemeProvider>
  );
}
