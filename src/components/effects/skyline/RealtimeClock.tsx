'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '../NoirSkyline.module.css';
import { WobblyLine } from '../WobblySVG';

interface RealtimeClockProps {
  wobble: boolean;
  strength: number;
}

function RealtimeClock({ wobble, strength }: RealtimeClockProps) {
  const [time, setTime] = useState<Date>(() => new Date());
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const handler = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isVisibleRef.current) return;
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) {
    return (
      <g>
        {/* Clock Face Circle */}
        <circle cx="1275" cy="580" r="10" fill="var(--skyline-clock-face)" stroke="var(--skyline-clock-border)" strokeWidth="1.2" className={styles.clockFace} />
        {/* Clock hands pointing at 11:45 */}
        <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1275" y2="572" stroke="var(--skyline-clock-details)" strokeWidth="1" /> {/* Minute hand */}
        <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1268" y2="583" stroke="var(--skyline-clock-details)" strokeWidth="1.2" /> {/* Hour hand */}
      </g>
    );
  }

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  // Compute angles
  const secondsAngle = seconds * 6;
  const minutesAngle = minutes * 6 + seconds * 0.1;
  const hoursAngle = (hours % 12) * 30 + minutes * 0.5;

  return (
    <g>
      {/* Clock Face Circle */}
      <circle cx="1275" cy="580" r="10" fill="var(--skyline-clock-face)" stroke="var(--skyline-clock-border)" strokeWidth="1.2" className={styles.clockFace} />
      
      {/* Hour Hand (pointing straight up at 12 when angle is 0, length = 5.5 units) */}
      <g transform={`rotate(${hoursAngle}, 1275, 580)`}>
        <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1275" y2="574.5" stroke="var(--skyline-clock-details)" strokeWidth="1.3" />
      </g>

      {/* Minute Hand (pointing straight up at 12 when angle is 0, length = 8 units) */}
      <g transform={`rotate(${minutesAngle}, 1275, 580)`}>
        <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1275" y2="572" stroke="var(--skyline-clock-details)" strokeWidth="0.9" />
      </g>

      {/* Second Hand (pointing straight up at 12 when angle is 0, length = 9 units) */}
      <g transform={`rotate(${secondsAngle}, 1275, 580)`}>
        <line x1="1275" y1="580" x2="1275" y2="571" stroke="var(--skyline-clock-seconds)" strokeWidth="0.6" className={styles.clockSeconds} />
      </g>
      
      {/* Center Pin */}
      <circle cx="1275" cy="580" r="1.2" fill="var(--skyline-clock-details)" />
    </g>
  );
}

export default RealtimeClock;
