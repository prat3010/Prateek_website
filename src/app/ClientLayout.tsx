'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import type { Theme, Audience } from '@/context/ThemeContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LenisProvider } from '@/context/LenisProvider';
import { PerformanceGovernorProvider } from '@/context/PerformanceGovernor';
import ThemeTransition from '@/components/effects/ThemeTransition';
import { LazyMotion, domAnimation } from 'framer-motion';
import OnboardingSelector from '@/components/ui/OnboardingSelector';

// Lazy load heavy client side animations
const NoirSkyline = dynamic(() => import('@/components/effects/NoirSkyline'), { ssr: false });
const CursorTrail = dynamic(() => import('@/components/effects/CursorTrail'), { ssr: false });
const ZenToggle = dynamic(() => import('@/components/ui/ZenToggle'), { ssr: false });
const TerminalButton = dynamic(() => import('@/components/ui/TerminalButton'), { ssr: false });
const ThreeGremlinParade = dynamic(() => import('@/components/effects/ThreeGremlinParade'), { ssr: false });

interface ClientLayoutProps {
  children: React.ReactNode;
  initialTheme: Theme;
  initialAudience: Audience | null;
}

function ClientLayoutContent({ 
  children, 
  isAdminRoute, 
  isKonamiActive 
}: { 
  children: React.ReactNode; 
  isAdminRoute: boolean; 
  isKonamiActive: boolean; 
}) {
  const { audience } = useTheme();

  return (
    <PerformanceGovernorProvider>
      <LenisProvider>
        <ThemeTransition />
        {!isAdminRoute && <NoirSkyline />}
        {!isAdminRoute && <CursorTrail />}
        {!isAdminRoute && <Navbar />}
        
        {audience === null ? (
          <OnboardingSelector />
        ) : (
          <main id="main-content">{children}</main>
        )}

        {!isAdminRoute && <Footer />}
        {!isAdminRoute && <ZenToggle />}
        {!isAdminRoute && <TerminalButton />}
        {!isAdminRoute && isKonamiActive && <ThreeGremlinParade />}
      </LenisProvider>
    </PerformanceGovernorProvider>
  );
}

export default function ClientLayout({ 
  children,
  initialTheme,
  initialAudience
}: ClientLayoutProps) {
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
    <ThemeProvider initialTheme={initialTheme} initialAudience={initialAudience}>
      <LazyMotion features={domAnimation}>
        <ClientLayoutContent isAdminRoute={isAdminRoute} isKonamiActive={isKonamiActive}>
          {children}
        </ClientLayoutContent>
      </LazyMotion>
    </ThemeProvider>
  );
}
