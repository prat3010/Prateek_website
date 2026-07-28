'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLenis } from 'lenis/react';
import { useTheme } from '@/context/ThemeContext';
import { Hand, X, HelpCircle, Loader2 } from 'lucide-react';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import styles from './GestureScroll.module.css';

// Hand landmark connections index structure
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

  // Element Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Instance Refs
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Refs for state callbacks
  const lenisRef = useRef(lenis);
  useEffect(() => {
    lenisRef.current = lenis;
  }, [lenis]);

  const isNoirRef = useRef(isNoir);
  useEffect(() => {
    isNoirRef.current = isNoir;
  }, [isNoir]);

  // Scroll Tracking State
  const scrollState = useRef({
    isPinched: false,
    startY: 0,
    startScrollY: 0,
    currentScrollY: 0,
    targetScrollY: 0,
  });

  // Toggle Hand Gesture Mode
  const handleToggle = () => {
    if (isActive) {
      setIsActive(false);
    } else {
      setIsActive(true);
      setLoadError(null);
    }
  };

  // Scroll Event listener sync
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

  // Smooth lerp scroll loop
  useEffect(() => {
    if (!isActive) return;

    let frameId: number;
    const updateScroll = () => {
      const diff = scrollState.current.targetScrollY - scrollState.current.currentScrollY;
      if (Math.abs(diff) > 0.1) {
        scrollState.current.currentScrollY += diff * 0.2;
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

  // Main Hand Detection & Camera Loop using modern @mediapipe/tasks-vision
  useEffect(() => {
    if (!isActive) return;

    let isCancelled = false;
    let localStream: MediaStream | null = null;

    const initVision = async () => {
      try {
        // Load WASM fileset for Tasks Vision
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        if (isCancelled) return;

        // Initialize HandLandmarker
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numHands: 1
        });

        if (isCancelled) {
          landmarker.close();
          return;
        }

        landmarkerRef.current = landmarker;
        setIsModelLoaded(true);

        // Request camera access
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Webcam API is not supported in this browser.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          }
        });

        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          landmarker.close();
          return;
        }

        localStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(err => console.warn('Video play deferred:', err));
        }

        if (canvasRef.current) {
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;
        }

        // Render loop processing video frames
        let lastVideoTime = -1;

        const processVideoFrame = () => {
          if (isCancelled) return;

          const video = videoRef.current;
          const canvas = canvasRef.current;
          const currentLandmarker = landmarkerRef.current;

          if (video && canvas && currentLandmarker && video.readyState >= 2) {
            if (video.currentTime !== lastVideoTime) {
              lastVideoTime = video.currentTime;

              const startTimeMs = performance.now();
              const results = currentLandmarker.detectForVideo(video, startTimeMs);

              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const hasHand = results.landmarks && results.landmarks.length > 0;

                if (hasHand && results.landmarks) {
                  const landmarks = results.landmarks[0];

                  const wrist = landmarks[0];
                  const thumbTip = landmarks[4];
                  const indexTip = landmarks[8];
                  const middleMcp = landmarks[9];

                  // Scale-invariant pinch calculation
                  const dxHand = wrist.x - middleMcp.x;
                  const dyHand = wrist.y - middleMcp.y;
                  const handSize = Math.sqrt(dxHand * dxHand + dyHand * dyHand);

                  const dxPinch = thumbTip.x - indexTip.x;
                  const dyPinch = thumbTip.y - indexTip.y;
                  const pinchDist = Math.sqrt(dxPinch * dxPinch + dyPinch * dyPinch);

                  const ratio = handSize > 0 ? pinchDist / handSize : pinchDist / 0.15;
                  const isPinching = ratio < 0.23;

                  // Drag action transition
                  if (isPinching) {
                    const pinchY = (thumbTip.y + indexTip.y) / 2;
                    if (!scrollState.current.isPinched) {
                      scrollState.current.isPinched = true;
                      scrollState.current.startY = pinchY;
                      scrollState.current.startScrollY = lenisRef.current ? lenisRef.current.scroll : window.scrollY;
                      scrollState.current.currentScrollY = scrollState.current.startScrollY;
                      scrollState.current.targetScrollY = scrollState.current.startScrollY;
                      setScrollActiveState(true);
                    } else {
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
                    ? (noirActive ? '#00e676' : '#79B48B')
                    : (noirActive ? '#00f0ff' : '#5A8EB6');

                  CONNECTIONS.forEach(([start, end]) => {
                    const pt1 = landmarks[start];
                    const pt2 = landmarks[end];
                    ctx.beginPath();
                    ctx.moveTo(pt1.x * canvas.width, pt1.y * canvas.height);
                    ctx.lineTo(pt2.x * canvas.width, pt2.y * canvas.height);
                    ctx.stroke();
                  });

                  // Draw landmark points
                  landmarks.forEach((pt, idx) => {
                    ctx.beginPath();
                    if (idx === 4 || idx === 8) {
                      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 6, 0, 2 * Math.PI);
                      ctx.fillStyle = isPinching ? '#ff1744' : '#ffd600';
                    } else {
                      ctx.arc(pt.x * canvas.width, pt.y * canvas.height, 3.5, 0, 2 * Math.PI);
                      ctx.fillStyle = noirActive ? '#ffffff' : '#2B2B36';
                    }
                    ctx.fill();
                  });

                  // Draw pinch ring indicator
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
              }
            }
          }

          if (!isCancelled) {
            animFrameIdRef.current = requestAnimationFrame(processVideoFrame);
          }
        };

        animFrameIdRef.current = requestAnimationFrame(processVideoFrame);

      } catch (err) {
        const error = err as Error;
        console.error('Vision hand tracking initialization failed:', error);
        if (!isCancelled) {
          setLoadError(error.message || 'Webcam permission denied or not found.');
        }
      }
    };

    initVision();

    return () => {
      isCancelled = true;

      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
        animFrameIdRef.current = null;
      }

      if (landmarkerRef.current) {
        try {
          landmarkerRef.current.close();
        } catch (e) {
          console.warn('Error closing landmarker:', e);
        }
        landmarkerRef.current = null;
      }

      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }

      scrollState.current.isPinched = false;
      setScrollActiveState(false);
      setHasHandDetected(false);
      setIsModelLoaded(false);
    };
  }, [isActive]);

  // Indicator text state
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
