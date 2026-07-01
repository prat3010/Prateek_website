'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import { ThemeProvider } from '@/context/ThemeContext';
import { LenisProvider } from '@/context/LenisProvider';
import ThemeTransition from '@/components/effects/ThemeTransition';
import { LazyMotion, domAnimation } from 'framer-motion';

// Lazy load heavy client side animations
const NoirSkyline = dynamic(() => import('@/components/effects/NoirSkyline'), { 
  ssr: false,
  loading: () => <div className="skyline-skeleton" />
});
const CursorTrail = dynamic(() => import('@/components/effects/CursorTrail'), { ssr: false });
const ZenToggle = dynamic(() => import('@/components/ui/ZenToggle'), { ssr: false });
const InfoButton = dynamic(() => import('@/components/ui/InfoButton'), { ssr: false });
const ThreeGremlinParade = dynamic(() => import('@/components/effects/ThreeGremlinParade'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  const [isKonamiActive, setIsKonamiActive] = useState(false);

  // Konami Code global listener
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let keyBuffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if user is typing in form elements
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.getAttribute('contenteditable') === 'true'
      ) {
        return;
      }

      keyBuffer.push(e.key);
      keyBuffer = keyBuffer.slice(-10);

      const isMatch = konamiCode.every((key, i) => key.toLowerCase() === keyBuffer[i]?.toLowerCase());
      if (isMatch) {
        const nextState = document.documentElement.classList.toggle('konami-active');
        setIsKonamiActive(nextState);
        keyBuffer = [];
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Konami Code auto-timeout observer (deactivates after 30 seconds)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isClassActive = document.documentElement.classList.contains('konami-active');
          setIsKonamiActive(isClassActive);
          
          if (isClassActive) {
            // Clear any active timeouts first
            if (timeoutId) clearTimeout(timeoutId);
            
            // Set 30-second safety timer
            timeoutId = setTimeout(() => {
              document.documentElement.classList.remove('konami-active');
            }, 30000);
          } else {
            // If deactivated manually, clear the timer
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => {
      observer.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <ThemeProvider>
      <LazyMotion features={domAnimation}>
        <LenisProvider>
          <ThemeTransition />
          {!isAdminRoute && <NoirSkyline />}
          {!isAdminRoute && <CursorTrail />}
          {!isAdminRoute && <Navbar />}
          <main>{children}</main>
          {!isAdminRoute && <Footer />}
          {!isAdminRoute && <ZenToggle />}
          {!isAdminRoute && <InfoButton />}
          {!isAdminRoute && isKonamiActive && <ThreeGremlinParade />}
        </LenisProvider>
      </LazyMotion>
    </ThemeProvider>
  );
}
