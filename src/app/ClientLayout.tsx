'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import Sidekick from '@/components/ui/Sidekick';
import { ThemeProvider, Theme } from '@/context/ThemeContext';
import ThemeTransition from '@/components/effects/ThemeTransition';
import { LazyMotion, domAnimation } from 'framer-motion';

// Lazy load heavy client side animations
const NoirSkyline = dynamic(() => import('@/components/effects/NoirSkyline'), { 
  ssr: false,
  loading: () => <div className="skyline-skeleton" />
});
const CursorTrail = dynamic(() => import('@/components/effects/CursorTrail'), { ssr: false });
const ZenToggle = dynamic(() => import('@/components/ui/ZenToggle'), { ssr: false });

export default function ClientLayout({ children, initialTheme }: { children: React.ReactNode; initialTheme?: Theme }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider initialTheme={initialTheme}>
      <LazyMotion features={domAnimation}>
        <ThemeTransition />
        {!isAdminRoute && <NoirSkyline />}
        {!isAdminRoute && <CursorTrail />}
        {!isAdminRoute && <Sidekick />}
        {!isAdminRoute && <Navbar />}
        <main>{children}</main>
        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <ZenToggle />}
      </LazyMotion>
    </ThemeProvider>
  );
}
