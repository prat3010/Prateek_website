'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLenis } from 'lenis/react';
import { useTheme } from '@/context/ThemeContext';
import { Hand, X, HelpCircle, Loader2 } from 'lucide-react';
import { Hands, Results as HandsResults } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import styles from './GestureScroll.module.css';

// Types for MediaPipe Landmarks
interface Landmark {
  x: number;
  y: number;
  z: number;
}

// Hand connections index structure
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // Index
  [5, 9], [9, 10], [10, 11], [11, 12], // Middle
  [9, 13], [13, 14], [14, 15], [15, 16], // Ring
  [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
  [0, 17] // Palm base
];

export default function GestureScroll() {
  const lenis = useLenis();
  const { isDetailsHidden, isNoir } = useTheme();
  
  // Component States
  const [isActive, setIsActive] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [hasHandDetected, setHasHandDetected] = useState(false);
  const [scrollActiveState, setScrollActiveState] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // HTML Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Library/Instance Refs
  const cameraRef = useRef<Camera | null>(null);
  const handsRef = useRef<Hands | null>(null);

  // Dynamic values stored in refs for callback stability
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  const isNoirRef = useRef(isNoir);
  useEffect(() => {
    isNoirRef.current = isNoir;
  }, [isNoir]);

  // Scroll Tracking State Ref
  const scrollState = useRef({
    isPinched: false,
    startY: 0,
    startScrollY: 0,
    currentScrollY: 0,
    targetScrollY: 0,
  });

  // Callback to process tracked hands
  const onResults = useCallback((results: HandsResults) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and paint camera image to canvas (acting as mirror background)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;

    if (hasHand && results.multiHandLandmarks) {
      const landmarks = results.multiHandLandmarks[0];
      
      const wrist = landmarks[0];
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const middleMcp = landmarks[9];

      // Hand Size Calculation (Wrist to Middle Finger MCP)
      const dxHand = wrist.x - middleMcp.x;
      const dyHand = wrist.y - middleMcp.y;
      const handSize = Math.sqrt(dxHand * dxHand + dyHand * dyHand);

      // Pinch Distance Calculation (Thumb tip to Index tip)
      const dxPinch = thumbTip.x - indexTip.x;
      const dyPinch = thumbTip.y - indexTip.y;
      const pinchDist = Math.sqrt(dxPinch * dxPinch + dyPinch * dyPinch);

      // Scale-invariant ratio
      const ratio = handSize > 0 ? pinchDist / handSize : pinchDist / 0.15;
      const isPinching = ratio < 0.23;

      // Handle dragging action transitions
      if (isPinching) {
        const pinchY = (thumbTip.y + indexTip.y) / 2;
        if (!scrollState.current.isPinched) {
          // Start a new scroll drag session
          scrollState.current.isPinched = true;
          scrollState.current.startY = pinchY;
          scrollState.current.startScrollY = lenisRef.current ? lenisRef.current.scroll : window.scrollY;
          scrollState.current.currentScrollY = scrollState.current.startScrollY;
          scrollState.current.targetScrollY = scrollState.current.startScrollY;
          setScrollActiveState(true);
        } else {
          // Active scroll drag session
          const sensitivity = 2.8;
          const deltaY = -(pinchY - scrollState.current.startY) * window.innerHeight * sensitivity;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          scrollState.current.targetScrollY = Math.max(0, Math.min(scrollState.current.startScrollY + deltaY, maxScroll));
        }
      } else {
        if (scrollState.current.isPinched) {
          scrollState.current.isPinched = false;
          setScrollActiveState(false);
        }
      }

      setHasHandDetected(true);

      const noirActive = isNoirRef.current;

      // Draw skeleton lines
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = isPinching
        ? (noirActive ? '#00e676' : '#79B48B')  // Neon/sage green
        : (noirActive ? '#00f0ff' : '#5A8EB6'); // Cyan/steel blue

      CONNECTIONS.forEach(([start, end]) => {
        const pt1 = landmarks[start];
        const pt2 = landmarks[end];
        ctx.beginPath();
        ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
        ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
        ctx.stroke();
      });

      // Draw landmark dots
      landmarks.forEach((pt: Landmark, idx: number) => {
        ctx.beginPath();
        if (idx === 4 || idx === 8) {
          // Make thumb and index tip prominent
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
          ctx.fillStyle = isPinching ? '#ff1744' : '#ffd600'; // red when pinched, yellow otherwise
        } else {
          ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3.5, 0, 2 * Math.PI);
          ctx.fillStyle = noirActive ? '#ffffff' : '#2B2B36';
        }
        ctx.fill();
      });

      // Draw visual ring connecting pinched points
      if (isPinching) {
        const pX = ((thumbTip.x + indexTip.x) / 2) * canvas.width;
        const pY = ((thumbTip.y + indexTip.y) / 2) * canvas.height;
        
        ctx.beginPath();
        ctx.arc(pX, pY, 12, 0, 2 * Math.PI);
        ctx.strokeStyle = '#ff1744';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pX, pY, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff1744';
        ctx.fill();
      }
    } else {
      setHasHandDetected(false);
      if (scrollState.current.isPinched) {
        scrollState.current.isPinched = false;
        setScrollActiveState(false);
      }
    }
  }, []);

  // Use a ref to hold onResults callback so MediaPipe callback reference never gets stale
  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  // Synchronize scroll coordinate state from scroll events when not pinching
  useEffect(() => {
    if (!isActive) return;

    const handleScroll = () => {
      if (!scrollState.current.isPinched) {
        const currentY = lenis ? lenis.scroll : window.scrollY;
        scrollState.current.currentScrollY = currentY;
        scrollState.current.targetScrollY = currentY;
      }
    };

    if (lenis) {
      lenis.on('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      if (lenis) {
        lenis.off('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lenis, isActive]);

  // Smoothly interpolate (lerp) the scroll position in an animation loop
  useEffect(() => {
    if (!isActive) return;

    let frameId: number;
    const updateScroll = () => {
      const diff = scrollState.current.targetScrollY - scrollState.current.currentScrollY;
      if (Math.abs(diff) > 0.1) {
        scrollState.current.currentScrollY += diff * 0.2; // Smooth linear interpolation
        const currentLenis = lenisRef.current;
        if (currentLenis) {
          currentLenis.scrollTo(scrollState.current.currentScrollY, { immediate: true });
        } else {
          window.scrollTo({ top: scrollState.current.currentScrollY, behavior: 'instant' });
        }
      }
      frameId = requestAnimationFrame(updateScroll);
    };

    frameId = requestAnimationFrame(updateScroll);
    return () => cancelAnimationFrame(frameId);
  }, [isActive]);

  // Shut down camera and cleanup tracks safely
  const shutdownCamera = useCallback(() => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (err) {
        console.warn('Error stopping camera utility:', err);
      }
      cameraRef.current = null;
    }

    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch (err) {
        console.warn('Error closing MediaPipe hands:', err);
      }
      handsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.error('Failed to stop video track:', e);
        }
      });
      videoRef.current.srcObject = null;
    }

    scrollState.current.isPinched = false;
    setScrollActiveState(false);
    setHasHandDetected(false);
    setIsModelLoaded(false);
  }, []);

  // Toggle Hand Gesture mode active state
  const handleToggle = () => {
    if (isActive) {
      shutdownCamera();
      setIsActive(false);
    } else {
      setIsActive(true);
      setLoadError(null);
    }
  };

  // Initialize MediaPipe packages and Camera feed
  useEffect(() => {
    if (!isActive) return;

    let isCancelled = false;

    const initMediaPipe = async () => {
      try {
        if (!handsRef.current) {
          const hands = new Hands({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
          });

          hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          hands.onResults((results: HandsResults) => {
            if (onResultsRef.current) {
              onResultsRef.current(results);
            }
          });

          handsRef.current = hands;
        }

        if (isCancelled) return;

        setIsModelLoaded(true);

        // Start camera stream via MediaPipe helper
        if (videoRef.current && canvasRef.current) {
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;

          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 320,
            height: 240
          });

          cameraRef.current = camera;
          await camera.start();
        }

      } catch (err) {
        const error = err as Error;
        console.error('Hand tracking initialization failed:', error);
        if (!isCancelled) {
          setLoadError(error.message || 'Webcam permission denied or not found.');
        }
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
      shutdownCamera();
    };
  }, [isActive, shutdownCamera]);

  // Determine indicator state
  let statusText = 'No hand detected';
  let indicatorClass = '';
  if (loadError) {
    statusText = 'Error loading camera';
  } else if (hasHandDetected) {
    if (scrollActiveState) {
      statusText = 'Scrolling';
      indicatorClass = styles.scrolling;
    } else {
      statusText = 'Hand ready';
      indicatorClass = styles.active;
    }
  }

  return (
    <div className={`${styles.container} ${isDetailsHidden ? styles.hidden : ''}`}>
      {/* Floating Toggle Button */}
      <button
        onClick={handleToggle}
        className={`${styles.gestureButton} ${isActive ? styles.active : ''}`}
        aria-label={isActive ? 'Disable hand gesture scrolling' : 'Enable hand gesture scrolling'}
        title="Scroll using Hand Gestures"
      >
        <span className={styles.iconWrapper}>
          <Hand className={styles.icon} size={20} strokeWidth={2.5} />
        </span>
        <span className={styles.buttonText}>
          {isActive ? 'GESTURE ON' : 'GESTURE SCROLL'}
        </span>
      </button>

      {/* Floating Video/Canvas Visualizer Panel */}
      {isActive && (
        <div className={styles.visualizerPanel}>
          <div className={styles.visualizerTitle}>
            <span>GESTURE SENSOR</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={() => setShowHelp(prev => !prev)} 
                className={styles.closeButton}
                title="How to scroll"
              >
                <HelpCircle size={14} />
              </button>
              <button 
                onClick={handleToggle} 
                className={styles.closeButton}
                title="Turn off"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div className={styles.canvasContainer}>
            <video
              ref={videoRef}
              className={styles.mirrorVideo}
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className={styles.overlayCanvas} />
            
            {!isModelLoaded && !loadError && (
              <div className={styles.loadingSpinner}>
                <Loader2 className="animate-spin" size={24} />
                <span>STARTING...</span>
              </div>
            )}

            {loadError && (
              <div className={styles.loadingSpinner} style={{ color: '#ff1744' }}>
                <span>CAMERA ERROR</span>
              </div>
            )}
          </div>

          <div className={styles.visualizerStatus}>
            <span className={`${styles.statusIndicator} ${indicatorClass}`} />
            <span>{statusText}</span>
          </div>

          {loadError && (
            <p className={styles.instructions} style={{ color: '#ff1744' }}>
              {loadError}
            </p>
          )}

          {showHelp && !loadError && (
            <p className={styles.instructions}>
              Pinch your <strong>Thumb & Index</strong> fingers together to grab the screen, then drag <strong>Up or Down</strong> to scroll. Release the pinch to stop.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

