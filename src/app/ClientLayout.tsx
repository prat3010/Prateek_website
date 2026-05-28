'use client';

import React from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CursorTrail from '@/components/effects/CursorTrail';
import { SoundProvider } from '@/components/effects/SoundManager';
import { ThemeProvider } from '@/context/ThemeContext';
import ThemeTransition from '@/components/effects/ThemeTransition';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <ThemeProvider>
        <ThemeTransition />
        <CursorTrail />
        <Navbar />
        <main>{children}</main>
        <Footer />
      </ThemeProvider>
    </SoundProvider>
  );
}
