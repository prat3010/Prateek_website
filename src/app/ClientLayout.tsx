'use client';

import React from 'react';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import CursorTrail from '@/components/effects/CursorTrail';
import { SoundProvider } from '@/components/effects/SoundManager';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SoundProvider>
      <CursorTrail />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </SoundProvider>
  );
}
