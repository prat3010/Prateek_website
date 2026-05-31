'use client';

import React from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CursorTrail from '@/components/effects/CursorTrail';
import Sidekick from '@/components/ui/Sidekick';
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeTransition from '@/components/effects/ThemeTransition';
import NoirSkyline from '@/components/effects/NoirSkyline';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeTransition />
      <NoirSkyline />
      <CursorTrail />
      <Sidekick />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </ThemeProvider>
  );
}
