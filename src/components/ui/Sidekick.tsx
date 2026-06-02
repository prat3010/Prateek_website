'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './Sidekick.module.css';

// Random click quotes for Comic Mode (Byte)
const BYTE_QUOTES = [
  "Don't forget to push your code! 🚀",
  "I run on 99% coffee and 1% compiler warnings! ☕",
  "Have you tried turning the compiler off and on again? 🔌",
  "Semicolons are tiny ninjas hiding in your syntax... 🥷",
  "ZAP! That bug was toasted! ⚡",
  "I'm keeping an eye on your scrollbar. Keep scrolling! 📜",
  "Beep boop! Prateeq's coding stats are off the charts! 📈",
  "Wait! I'm monitoring our live edge middleware telemetry... check out the stats page! 📈",
];

// Random click quotes for Noir Mode (Clue)
const CLUE_QUOTES = [
  "Semicolons... they're like shadows. You only miss them when they're gone.",
  "Every code branch has its secrets. Some run deeper than others.",
  "The compiler never lies. But it doesn't tell the whole truth either.",
  "Stay alert. The layout files are quiet... too quiet.",
  "In this town, you either fix the memory leak, or it leaks you.",
  "Evidence points to a major database query anomaly. Keep digging.",
  "Just another night in the terminal grid. Watch your step.",
  "Evidence logged in the edge files. See the live case record telemetry... if you dare.",
];

// Contextual section speech comments
const COMMENTS: Record<string, { light: string; noir: string }> = {
  home: {
    light: "Meet Prateeq! Developer, Designer, and Storyteller. Let's explore his world! 🚀",
    noir: "Case record: Prateeq Sharma. Let's inspect the files and see what clues we gather.",
  },
  about: {
    light: "Wait, Prateeq does programming AND comic drawing? Talk about multiclassing! 🎨",
    noir: "The ledger says he's a seasoned operator. Codes by day, designs by night.",
  },
  skills: {
    light: "Wow, look at all these power-up badges! Try hovering over them! ⚡",
    noir: "His tech stack checks out. Heavy tools for clean, custom execution.",
  },
  projects: {
    light: "Ooh! Real interactive projects! Click to reveal details! 👾",
    noir: "Case dossiers. Inspect these operations closely. Groundwork is solid.",
  },
  playground: {
    light: "Dijkstra and A* algorithm engines! Fire up the simulator! 🛸",
    noir: "Algorithm lab desk cleared. Adjust coordination vectors to map paths.",
  },
  contact: {
    light: "Send a message and say hi! We don't bite, promise! 📧",
    noir: "Leave a report at the desk. We will verify the lead and get back to you.",
  },
};

export default function Sidekick() {
  const { isNoir } = useTheme();
  
  // Section Tracking State
  const [activeSection, setActiveSection] = useState('home');
  const [speechText, setSpeechText] = useState('');
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Eye tracking state (Pupil Offset)
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  
  // Sleep / Idle state
  const [isAsleep, setIsAsleep] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  
  // Pipe smoke effect particles (Noir Crow)
  const [smokePuffs, setSmokePuffs] = useState<number[]>([]);
  
  const sidekickRef = useRef<HTMLDivElement>(null);
  const bubbleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const smokeCounterRef = useRef<number>(0);

  // 1. Scroll-Observer for Section Tracking
  useEffect(() => {
    const sections = ['home', 'about', 'skills', 'projects', 'playground', 'contact'];
    
    // Config intersection observer
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -30% 0px', // Inspect viewport center region
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          setActiveSection(sectionId);
        }
      });
    }, observerOptions);

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // 2. Fire speech bubbles when section changes
  useEffect(() => {
    const comment = COMMENTS[activeSection];
    if (!comment) return;

    const quote = isNoir ? comment.noir : comment.light;
    setSpeechText(quote);
    setIsBubbleVisible(true);

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, 6500);

    return () => {
      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    };
  }, [activeSection, isNoir]);

  // 3. Eye Tracking Pupil Move Calculations
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastActivityRef.current = Date.now();
      setIsAsleep(false);
      setIsIdle(false);

      if (!sidekickRef.current || isAsleep) return;

      const rect = sidekickRef.current.getBoundingClientRect();
      const eyeX = rect.left + rect.width / 2;
      const eyeY = rect.top + rect.height / 3;

      const dx = e.clientX - eyeX;
      const dy = e.clientY - eyeY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) return;

      const maxOffset = isNoir ? 2.5 : 4; 
      const limitX = (dx / dist) * Math.min(dist * 0.05, maxOffset);
      const limitY = (dy / dist) * Math.min(dist * 0.05, maxOffset);

      setPupilOffset({ x: limitX, y: limitY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isAsleep, isNoir]);

  // 4. Inactivity Idle/Sleep check loop
  useEffect(() => {
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      setIsAsleep(false);
      setIsIdle(false);
    };

    window.addEventListener('scroll', resetActivity, { passive: true });
    window.addEventListener('click', resetActivity);
    window.addEventListener('touchstart', resetActivity, { passive: true });

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > 45000) {
        setIsAsleep(true);
        setIsIdle(false);
      } else if (elapsed > 15000) {
        setIsIdle(true);
      }
    }, 1000);

    return () => {
      window.removeEventListener('scroll', resetActivity);
      window.removeEventListener('click', resetActivity);
      window.removeEventListener('touchstart', resetActivity);
      clearInterval(interval);
    };
  }, []);

  // 5. Pipe Steam Spawner Loop (Noir Crow Clue only)
  useEffect(() => {
    if (!isNoir || isAsleep) {
      setSmokePuffs([]);
      return;
    }

    const interval = setInterval(() => {
      smokeCounterRef.current++;
      const nextId = smokeCounterRef.current;
      
      setSmokePuffs(prev => [...prev, nextId]);
      
      setTimeout(() => {
        setSmokePuffs(prev => prev.filter(pId => pId !== nextId));
      }, 2000);
    }, 3500);

    return () => clearInterval(interval);
  }, [isNoir, isAsleep]);

  // 6. Click Handler to fire random messages
  const handleSidekickClick = () => {
    if (isAsleep) {
      setIsAsleep(false);
      lastActivityRef.current = Date.now();
      return;
    }

    const quotes = isNoir ? CLUE_QUOTES : BYTE_QUOTES;
    const randIndex = Math.floor(Math.random() * quotes.length);
    setSpeechText(quotes[randIndex]);
    setIsBubbleVisible(true);

    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current);
    bubbleTimeoutRef.current = setTimeout(() => {
      setIsBubbleVisible(false);
    }, 6000);
  };

  // 7. Draggable Pointer Events
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    
    const padding = 60;
    const maxLeft = -window.innerWidth + padding;
    const maxTop = -window.innerHeight + padding;
    
    setPosition({ 
      x: Math.max(maxLeft, Math.min(padding, nextX)), 
      y: Math.max(maxTop, Math.min(padding, nextY)) 
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (err) {}
    setPosition({ x: 0, y: 0 });
  };

  // Combined style for transforms
  const wrapperStyle: React.CSSProperties = {
    transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
    transition: isDragging ? 'none' : 'transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  };

  return (
    <div className={styles.sidekickContainer} ref={sidekickRef}>
      {/* Speech Bubble */}
      <div className={`${styles.speechBubble} ${isBubbleVisible ? styles.speechBubbleShow : ''}`}>
        <p className={styles.speechText}>{speechText}</p>
      </div>

      {/* Floating sleep Zzz indicator */}
      {isAsleep && (
        <div className={styles.sleepBubble} aria-label="Asleep Zzz">
          Zzz
        </div>
      )}

      {/* Character body */}
      <div
        className={styles.characterWrapper}
        style={wrapperStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleSidekickClick}
      >
        {/* Hover / Idle nod wrapper separating active keyframe animations from dragging transforms */}
        <div
          className={isAsleep ? styles.asleep : isIdle ? styles.idle : styles.hovering}
          style={{ width: '100%', height: '100%', pointerEvents: 'none', position: 'relative' }}
        >
          {isNoir ? (
            /* ====================================================
               NOIR THEME: Clue (The Detective Crow / Raven)
               ==================================================== */
            <svg viewBox="0 0 100 100" className={styles.characterSvg} aria-label="Detective Crow Sidekick">
              {/* Shadows / Trench Coat */}
              <path d="M 30 75 Q 50 65 70 75 L 75 95 L 25 95 Z" fill="#1C1C22" stroke="#2F2F3D" strokeWidth="2.5" />
              <path d="M 45 72 L 50 85 L 55 72" fill="none" stroke="#FF1744" strokeWidth="2.5" strokeLinecap="round" />
              
              {/* Crow Body & Head */}
              <circle cx="50" cy="50" r="24" fill="#121216" stroke="#2F2F3D" strokeWidth="2" />
              
              {/* Beak & Pipe */}
              <path d="M 32 46 Q 16 48 24 58 Q 30 52 32 46 Z" fill="#FFA000" stroke="#FF6F00" strokeWidth="1.5" />
              
              {/* Detective Monocle / Glowing Eye */}
              {isAsleep ? (
                // Closed eye sleeping path
                <path d="M 44 48 Q 50 53 56 48" fill="none" stroke="#FF1744" strokeWidth="3" strokeLinecap="round" />
              ) : (
                // Active tracking eye
                <>
                  <circle cx="50" cy="46" r="8" fill="#1E1E26" stroke="#FF1744" strokeWidth="2.5" />
                  <circle 
                    cx={50 + pupilOffset.x} 
                    cy={46 + pupilOffset.y} 
                    r="3" 
                    fill="#FF1744" 
                    className={styles.pupil}
                    filter="drop-shadow(0 0 2px #FF1744)"
                  />
                </>
              )}

              {/* Detective Fedora Hat */}
              <path d="M 28 34 Q 50 28 72 34 L 70 30 Q 50 18 30 30 Z" fill="#212126" stroke="#3F3F4D" strokeWidth="2" />
              <rect x="36" y="24" width="28" height="8" rx="1" fill="#1A1A22" stroke="#3F3F4D" strokeWidth="1.5" />
              <line x1="36" y1="30" x2="64" y2="30" stroke="#FF1744" strokeWidth="2.5" />

              {/* Vintage pipe accessory */}
              <path d="M 26 56 L 16 56 L 14 50 L 18 50 Z" fill="#5D4037" stroke="#3E2723" strokeWidth="1.5" />
              <circle cx="16" cy="49" r="1.5" fill="#FF1744" filter="drop-shadow(0 0 2px #FF1744)" />
            </svg>
          ) : (
            /* ====================================================
               COMIC THEME: Byte (The Flying Robo-Drone)
               ==================================================== */
            <svg viewBox="0 0 100 100" className={styles.characterSvg} aria-label="Byte Robot Sidekick">
              {/* Flying Red Cape */}
              <path d="M 34 56 L 10 74 L 26 84 L 38 72 Z" fill="#D32F2F" stroke="#000000" strokeWidth="3" className={styles.cape} />
              <path d="M 34 56 L 15 72 L 26 78 Z" fill="#B71C1C" />

              {/* Floating Thruster Flame */}
              <path d="M 45 74 L 50 94 L 55 74 Z" fill="#FF9100" stroke="#000000" strokeWidth="2" className={styles.flame} />
              <path d="M 47 74 L 50 86 L 53 74 Z" fill="#FFEA00" />

              {/* Robotic Main Body Frame */}
              <rect x="28" y="28" width="44" height="46" rx="12" fill="#FFE082" stroke="#000000" strokeWidth="3.5" />
              
              {/* Bottom Thruster nozzle ring */}
              <rect x="42" y="70" width="16" height="6" rx="2" fill="#757575" stroke="#000000" strokeWidth="3.5" />

              {/* Digital Eye Screen Plate */}
              <rect x="34" y="34" width="32" height="24" rx="6" fill="#1565C0" stroke="#000000" strokeWidth="3" />

              {/* Robotic Screen Eyes */}
              {isAsleep ? (
                <>
                  <path d="M 38 46 Q 43 51 46 46" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M 54 46 Q 59 51 62 46" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  {/* Left Eye */}
                  <circle cx="43" cy="46" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
                  <circle 
                    cx={43 + pupilOffset.x} 
                    cy={46 + pupilOffset.y} 
                    r="2.5" 
                    fill="#000000" 
                    className={styles.pupil}
                  />
                  
                  {/* Right Eye */}
                  <circle cx="57" cy="46" r="6" fill="#FFFFFF" stroke="#000" strokeWidth="1" />
                  <circle 
                    cx={57 + pupilOffset.x} 
                    cy={46 + pupilOffset.y} 
                    r="2.5" 
                    fill="#000000" 
                    className={styles.pupil}
                  />
                </>
              )}

              {/* Drone Side Antennas */}
              <line x1="28" y1="46" x2="22" y2="46" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="72" y1="46" x2="78" y2="46" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="50" y1="28" x2="50" y2="20" stroke="#000000" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="50" cy="18" r="4.5" fill="#D32F2F" stroke="#000000" strokeWidth="3.5" />
            </svg>
          )}

          {/* Noir Pipe Steam Particles overlay */}
          {isNoir && !isAsleep && smokePuffs.map((puffId, idx) => (
            <div
              key={puffId}
              className={styles.steamParticle}
              style={{
                left: '12px',
                top: '46px',
                animationDelay: `${idx * 0.15}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
