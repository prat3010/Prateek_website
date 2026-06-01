'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CursorTrail from '@/components/effects/CursorTrail';
import Sidekick from '@/components/ui/Sidekick';
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeTransition from '@/components/effects/ThemeTransition';
import NoirSkyline from '@/components/effects/NoirSkyline';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <ThemeProvider>
      <ThemeTransition />
      <NoirSkyline />
      <CursorTrail />
      {!isAdminRoute && <Sidekick />}
      {!isAdminRoute && <Navbar />}
      <main>{children}</main>
      {!isAdminRoute && <Footer />}
    </ThemeProvider>
  );
}
