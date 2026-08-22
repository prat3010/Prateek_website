'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { playEatSound, playGameOverSound, playAchievementSound } from '@/lib/terminalAudio';
import styles from './TerminalSnakeGame.module.css';

interface TerminalSnakeGameProps {
  onClose: () => void;
  onAchievementUnlocked?: (id: string, title: string, desc: string) => void;
}

interface Point {
  x: number;
  y: number;
}

interface LeaderEntry {
  player_name: string;
  score: number;
}

const GRID_COLS = 24;
const GRID_ROWS = 16;
const CELL_SIZE = 14;

export default function TerminalSnakeGame({ onClose, onAchievementUnlocked }: TerminalSnakeGameProps) {
  const [playerName, setPlayerName] = useState<string>('');
  const [isCallsignPrompt, setIsCallsignPrompt] = useState<boolean>(true);
  const [callsignInput, setCallsignInput] = useState<string>('');

  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [globalRecord, setGlobalRecord] = useState<{ player_name: string; score: number }>({
    player_name: 'CYBER_NINJA',
    score: 140,
  });
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snakeRef = useRef<Point[]>([
    { x: 10, y: 8 },
    { x: 9, y: 8 },
    { x: 8, y: 8 },
  ]);
  const dirRef = useRef<Point>({ x: 1, y: 0 });
  const foodRef = useRef<Point>({ x: 15, y: 8 });
  const gameLoopRef = useRef<number | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // 1. Fetch initial leaderboard and saved callsign on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('terminal_player_name') || '';
      if (savedName) {
        setPlayerName(savedName);
        setIsCallsignPrompt(false);
      }

      const savedHigh = Number(localStorage.getItem('terminal_snake_highscore') || '0');
      setHighScore(savedHigh);
    }

    fetch('/api/terminal/snake-leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.globalRecord) setGlobalRecord(data.globalRecord);
          if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
        }
      })
      .catch(() => {});
  }, []);

  const spawnFood = useCallback(() => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_COLS),
        y: Math.floor(Math.random() * GRID_ROWS),
      };
      const collision = snakeRef.current.some((seg) => seg.x === newFood.x && seg.y === newFood.y);
      if (!collision) break;
    }
    foodRef.current = newFood;
  }, []);

  const resetGame = useCallback(() => {
    snakeRef.current = [
      { x: 10, y: 8 },
      { x: 9, y: 8 },
      { x: 8, y: 8 },
    ];
    dirRef.current = { x: 1, y: 0 };
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsNewRecord(false);
    spawnFood();
  }, [spawnFood]);

  const handleCallsignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = callsignInput.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'PLAYER_1';
    setPlayerName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminal_player_name', name);
    }
    setIsCallsignPrompt(false);
    resetGame();
  };

  // Submit high score to Supabase API
  const submitScoreToLeaderboard = useCallback(
    (finalScore: number) => {
      if (finalScore <= 0) return;

      fetch('/api/terminal/snake-leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_name: playerName || 'PLAYER',
          score: finalScore,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            if (Array.isArray(data.leaderboard)) setLeaderboard(data.leaderboard);
            if (data.globalRecord) setGlobalRecord(data.globalRecord);
            if (data.isNewGlobalRecord) {
              setIsNewRecord(true);
              playAchievementSound();
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
              onAchievementUnlocked?.('snake_god', 'Global Record Holder', `Set #1 Snake Record: ${finalScore} pts`);
            }
          }
        })
        .catch(() => {});
    },
    [playerName, onAchievementUnlocked]
  );

  const gameOver = useCallback(() => {
    setIsGameOver(true);
    playGameOverSound();

    if (score > highScore) {
      setHighScore(score);
      if (typeof window !== 'undefined') {
        localStorage.setItem('terminal_snake_highscore', String(score));
      }
    }

    if (score >= 10) {
      onAchievementUnlocked?.('snake_charmer', 'Snake Charmer', 'Scored 10+ points in Terminal Snake');
    }

    submitScoreToLeaderboard(score);
  }, [score, highScore, submitScoreToLeaderboard, onAchievementUnlocked]);

  // Main Canvas Render
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear grid background
    ctx.fillStyle = '#040405';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines
    ctx.strokeStyle = '#121216';
    ctx.lineWidth = 1;
    for (let x = 0; x <= GRID_COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, GRID_ROWS * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(GRID_COLS * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw food (pulsing red/gold)
    const food = foodRef.current;
    ctx.fillStyle = '#ff2a55';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Snake Body
    const snake = snakeRef.current;
    snake.forEach((seg, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(seg.x * CELL_SIZE + 1, seg.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      } else {
        // Body
        ctx.fillStyle = '#39ff14';
        ctx.fillRect(seg.x * CELL_SIZE + 2, seg.y * CELL_SIZE + 2, CELL_SIZE - 4, CELL_SIZE - 4);
      }
    });
  }, []);

  // Snake Tick Engine
  const update = useCallback(() => {
    if (isGameOver || isPaused || isCallsignPrompt) return;

    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = dirRef.current;

    head.x += dir.x;
    head.y += dir.y;

    // Wall collision check
    if (head.x < 0 || head.x >= GRID_COLS || head.y < 0 || head.y >= GRID_ROWS) {
      gameOver();
      return;
    }

    // Self collision check
    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    // Food eating check
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      playEatSound();
      setScore((prev) => prev + 10);
      spawnFood();
    } else {
      snake.pop();
    }

    snakeRef.current = snake;
  }, [isGameOver, isPaused, isCallsignPrompt, gameOver, spawnFood]);

  // Game Loop requestAnimationFrame
  useEffect(() => {
    if (isCallsignPrompt) return;

    const tickInterval = Math.max(60, 140 - Math.floor(score / 30) * 10); // speed accelerates with score

    const loop = (timestamp: number) => {
      if (timestamp - lastTickTimeRef.current >= tickInterval) {
        update();
        draw();
        lastTickTimeRef.current = timestamp;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isCallsignPrompt, score, update, draw]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isCallsignPrompt) return;

      const key = e.key;
      const currentDir = dirRef.current;

      if ((key === 'ArrowUp' || key === 'w' || key === 'W') && currentDir.y === 0) {
        dirRef.current = { x: 0, y: -1 };
        e.preventDefault();
      } else if ((key === 'ArrowDown' || key === 's' || key === 'S') && currentDir.y === 0) {
        dirRef.current = { x: 0, y: 1 };
        e.preventDefault();
      } else if ((key === 'ArrowLeft' || key === 'a' || key === 'A') && currentDir.x === 0) {
        dirRef.current = { x: -1, y: 0 };
        e.preventDefault();
      } else if ((key === 'ArrowRight' || key === 'd' || key === 'D') && currentDir.x === 0) {
        dirRef.current = { x: 1, y: 0 };
        e.preventDefault();
      } else if (key === 'p' || key === 'P' || key === ' ') {
        if (isGameOver) {
          resetGame();
        } else {
          setIsPaused((prev) => !prev);
        }
        e.preventDefault();
      } else if (key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCallsignPrompt, isGameOver, resetGame, onClose]);

  return (
    <div className={styles.wrapper}>
      {/* Header Info Bar */}
      <div className={styles.headerBar}>
        <span className={styles.recordBadge}>
          🏆 RECORD: {globalRecord.score} pts (@{globalRecord.player_name})
        </span>
        <span className={styles.playerBadge}>PLAYER: @{playerName || 'ANONYMOUS'}</span>
        <span className={styles.scoreBadge}>SCORE: {score}</span>
      </div>

      {/* Callsign Prompt Modal */}
      {isCallsignPrompt ? (
        <div className={styles.promptContainer}>
          <h3 className={styles.promptTitle}>SNAKE LEADERBOARD ENTRY</h3>
          <p className={styles.promptSub}>Enter your callsign/handle to record high scores on Supabase:</p>
          <form onSubmit={handleCallsignSubmit} className={styles.callsignForm}>
            <input
              type="text"
              className={styles.callsignInput}
              value={callsignInput}
              onChange={(e) => setCallsignInput(e.target.value)}
              placeholder="e.g. CYBER_VIPER"
              maxLength={16}
              autoFocus
            />
            <button type="submit" className={styles.startBtn}>
              START
            </button>
          </form>
        </div>
      ) : (
        /* Game Canvas Container */
        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            width={GRID_COLS * CELL_SIZE}
            height={GRID_ROWS * CELL_SIZE}
            className={styles.gameCanvas}
          />

          {/* Game Over / Paused Overlay */}
          {(isGameOver || isPaused) && (
            <div className={styles.overlayModal}>
              {isGameOver ? (
                <>
                  <h3 className={styles.gameOverText}>GAME OVER</h3>
                  {isNewRecord && <div className={styles.newRecordBanner}>👑 NEW GLOBAL RECORD! 👑</div>}
                  <div>Final Score: {score} pts</div>

                  {leaderboard.length > 0 && (
                    <div className={styles.leaderList}>
                      <div>TOP GLOBAL LEADERBOARD:</div>
                      {leaderboard.slice(0, 3).map((entry, idx) => (
                        <div key={idx} className={`${styles.leaderRow} ${entry.player_name === playerName ? styles.highlight : ''}`}>
                          <span>#{idx + 1} @{entry.player_name}</span>
                          <span>{entry.score} pts</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className={styles.btnRow}>
                    <button onClick={resetGame} className={styles.actionBtn}>
                      RESTART
                    </button>
                    <button onClick={onClose} className={styles.actionBtn}>
                      EXIT
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ color: 'var(--pop-yellow)', margin: 0 }}>GAME PAUSED</h3>
                  <div>Press Space or P to resume</div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Keyboard Controls Help footer */}
      <div className={styles.controlsHelp}>
        CONTROLS: [Arrow Keys / WASD] to Move • [Space / P] to Pause • [Esc] to Exit Terminal
      </div>
    </div>
  );
}
