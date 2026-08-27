'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  Trash2,
  X,
  Zap,
  Search,
  Compass,
  FileText,
  Target,
  Sparkles
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import {
  GridNode,
  runDijkstra,
  runAStar,
  runBFS,
  runDFS,
  runGreedyBestFirst,
  runBidirectionalBFS,
  runJPS,
  runIDDFS,
  runRandomWalk,
  runWallFollower,
  runTremaux,
  runThetaStar,
  runIDAStar,
  PathfindingStep,
  nodeToKey
} from '@/lib/pathfindingAlgorithms';
import { playKeySound, playAchievementSound } from '@/lib/terminalAudio';
import styles from './TerminalPathfinder.module.css';

const DESKTOP_COLS = 24;
const DESKTOP_ROWS = 11;
const MOBILE_COLS = 16;
const MOBILE_ROWS = 9;

const SPEED_OPTIONS = [
  { label: '1x', delay: 80 },
  { label: '2x', delay: 30 },
  { label: '3x', delay: 10 },
  { label: 'Max', delay: 1 }
];

interface AlgorithmInfo {
  name: string;
  nameNoir: string;
  property: string;
}

const ALGORITHM_INFO_MAP: Record<string, AlgorithmInfo> = {
  astar: {
    name: "A* Search",
    nameNoir: "A* Heuristic",
    property: "Guaranteed Shortest Path (Guided Manhattan)"
  },
  dijkstra: {
    name: "Dijkstra's",
    nameNoir: "Dijkstra Wave",
    property: "Guaranteed Shortest Path (Uniform Wave)"
  },
  thetastar: {
    name: "Theta* Search",
    nameNoir: "Theta* Vector",
    property: "Guaranteed Any-Angle Straight Lines"
  },
  jps: {
    name: "Jump Point Search",
    nameNoir: "JPS Jump-Cut",
    property: "Guaranteed Shortest (Pruned Quantum Leap)"
  },
  bidirectional: {
    name: "Bidirectional BFS",
    nameNoir: "Dual Encircling",
    property: "Guaranteed Shortest (Dual Meeting Frontiers)"
  },
  bfs: {
    name: "Breadth-First",
    nameNoir: "BFS Radial Wave",
    property: "Guaranteed Fewest Hops (Unweighted)"
  },
  dfs: {
    name: "Depth-First",
    nameNoir: "DFS Backtrack",
    property: "Non-Shortest (Deep Winding Probes)"
  },
  greedy: {
    name: "Greedy Best-First",
    nameNoir: "Greedy Vector",
    property: "Non-Shortest (Distance Estimation)"
  },
  iddfs: {
    name: "Iterative Deepening DFS",
    nameNoir: "IDDFS Sweep",
    property: "Guaranteed Shortest (Low Memory)"
  },
  idastar: {
    name: "Iterative Deepening A*",
    nameNoir: "IDA* Probe",
    property: "Guaranteed Shortest (Elliptical Sweep)"
  },
  tremaux: {
    name: "Trémaux's Solver",
    nameNoir: "Trémaux Trace",
    property: "Guaranteed Maze Escape (Passage Marking)"
  },
  wall: {
    name: "Pledge Follower",
    nameNoir: "Pledge Cordon",
    property: "Maze Boundary Hugger"
  },
  random: {
    name: "Random Walk",
    nameNoir: "Brownian Drift",
    property: "Stochastic Brownian Exploration"
  }
};

type AlgorithmKey = keyof typeof ALGORITHM_INFO_MAP;

interface TerminalPathfinderProps {
  onClose: () => void;
  onAchievementUnlocked?: (id: string, title: string, desc: string) => void;
}

type InteractionMode = 'idle' | 'drag-start' | 'drag-end' | 'draw-walls' | 'erase-walls';

export default function TerminalPathfinder({ onClose, onAchievementUnlocked }: TerminalPathfinderProps) {
  const { isNoir } = useTheme();

  // Responsive mobile viewport detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const cols = isMobile ? MOBILE_COLS : DESKTOP_COLS;
  const rows = isMobile ? MOBILE_ROWS : DESKTOP_ROWS;

  // Grid coordinates (default start & target)
  const [startNode, setStartNode] = useState<GridNode>({ col: 2, row: 5 });
  const [endNode, setEndNode] = useState<GridNode>({ col: 21, row: 5 });
  const [walls, setWalls] = useState<Set<string>>(new Set<string>());
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set<string>());
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set<string>());

  // Controls
  const [isRunning, setIsRunning] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // default: 2x (30ms)
  const [algorithm, setAlgorithm] = useState<AlgorithmKey>('astar');
  const [stats, setStats] = useState({ visitedCount: 0, pathLength: 0, durationMs: 0 });
  const [hoverCoord, setHoverCoord] = useState<{ col: number; row: number; type: string } | null>(null);

  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeVisitedRef = useRef<Set<string>>(new Set());
  const startTimeRef = useRef<number>(0);

  // Sync coordinates when switching between mobile and desktop dimensions
  useEffect(() => {
    setStartNode(prev => ({
      col: Math.min(prev.col, cols - 2),
      row: Math.min(prev.row, rows - 1)
    }));
    setEndNode(prev => ({
      col: isMobile ? Math.min(Math.max(prev.col, 3), cols - 2) : Math.min(prev.col, cols - 2),
      row: Math.min(prev.row, rows - 1)
    }));
  }, [cols, rows, isMobile]);

  // Global mouseup and touchend to release drawing/dragging
  useEffect(() => {
    const handleRelease = () => setInteractionMode('idle');
    window.addEventListener('mouseup', handleRelease);
    window.addEventListener('touchend', handleRelease);
    return () => {
      window.removeEventListener('mouseup', handleRelease);
      window.removeEventListener('touchend', handleRelease);
    };
  }, []);

  // Halt simulation
  const stopSimulation = useCallback(() => {
    if (!isRunning) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisitedNodes(new Set(activeVisitedRef.current));
    setIsRunning(false);
  }, [isRunning]);

  // Keyboard shortcut listener (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isRunning) {
          stopSimulation();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, onClose, stopSimulation]);

  // Clear path
  const clearPath = useCallback(() => {
    if (isRunning) return;
    setVisitedNodes(new Set());
    setPathNodes(new Set());
    setStats(prev => ({ ...prev, pathLength: 0, durationMs: 0 }));
  }, [isRunning]);

  // Clear walls
  const clearWalls = useCallback(() => {
    if (isRunning) return;
    setWalls(new Set());
  }, [isRunning]);

  // Reset grid
  const resetGrid = useCallback(() => {
    if (isRunning) return;
    setStartNode({ col: isMobile ? 1 : 2, row: Math.floor(rows / 2) });
    setEndNode({ col: cols - 2, row: Math.floor(rows / 2) });
    setWalls(new Set());
    setVisitedNodes(new Set());
    setPathNodes(new Set());
    setStats({ visitedCount: 0, pathLength: 0, durationMs: 0 });
  }, [isRunning, isMobile, cols, rows]);

  // Procedural Maze Presets
  const applyMazePreset = useCallback((preset: 'random' | 'corridors' | 'slalom' | 'fortress') => {
    if (isRunning) return;
    clearPath();
    const newWalls = new Set<string>();

    if (preset === 'random') {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if ((c === startNode.col && r === startNode.row) || (c === endNode.col && r === endNode.row)) continue;
          if (Math.random() < 0.28) newWalls.add(`${c},${r}`);
        }
      }
    } else if (preset === 'corridors') {
      for (let r = 2; r < rows; r += 3) {
        const gap = Math.floor(Math.random() * (cols - 4)) + 2;
        for (let c = 0; c < cols; c++) {
          if (c === gap || c === gap + 1) continue;
          if ((c === startNode.col && r === startNode.row) || (c === endNode.col && r === endNode.row)) continue;
          newWalls.add(`${c},${r}`);
        }
      }
    } else if (preset === 'slalom') {
      for (let c = 3; c < cols - 2; c += 3) {
        const isOpenTop = (c / 3) % 2 === 0;
        for (let r = 0; r < rows; r++) {
          if (isOpenTop && r < 2) continue;
          if (!isOpenTop && r > rows - 3) continue;
          if ((c === startNode.col && r === startNode.row) || (c === endNode.col && r === endNode.row)) continue;
          newWalls.add(`${c},${r}`);
        }
      }
    } else if (preset === 'fortress') {
      const er = endNode.row;
      const ec = endNode.col;
      for (let r = Math.max(0, er - 2); r <= Math.min(rows - 1, er + 2); r++) {
        for (let c = Math.max(0, ec - 2); c <= Math.min(cols - 1, ec + 2); c++) {
          if (r === er && c === ec) continue;
          if (r === er && c === ec - 2) continue; // breach doorway
          if (r === er - 2 || r === er + 2 || c === ec - 2 || c === ec + 2) {
            if ((c === startNode.col && r === startNode.row)) continue;
            newWalls.add(`${c},${r}`);
          }
        }
      }
    }

    setWalls(newWalls);
  }, [isRunning, clearPath, startNode, endNode, cols, rows]);

  // Visualizer Orchestrator
  const visualize = useCallback(() => {
    if (isRunning) return;

    playKeySound();
    setVisitedNodes(new Set());
    setPathNodes(new Set());
    activeVisitedRef.current = new Set();
    setIsRunning(true);
    startTimeRef.current = performance.now();

    const info = ALGORITHM_INFO_MAP[algorithm];
    const algoName = isNoir ? info.nameNoir : info.name;

    let generator: Generator<PathfindingStep, void, unknown>;
    switch (algorithm) {
      case 'dijkstra':
        generator = runDijkstra(startNode, endNode, cols, rows, walls);
        break;
      case 'astar':
        generator = runAStar(startNode, endNode, cols, rows, walls);
        break;
      case 'bfs':
        generator = runBFS(startNode, endNode, cols, rows, walls);
        break;
      case 'dfs':
        generator = runDFS(startNode, endNode, cols, rows, walls);
        break;
      case 'greedy':
        generator = runGreedyBestFirst(startNode, endNode, cols, rows, walls);
        break;
      case 'bidirectional':
        generator = runBidirectionalBFS(startNode, endNode, cols, rows, walls);
        break;
      case 'jps':
        generator = runJPS(startNode, endNode, cols, rows, walls);
        break;
      case 'iddfs':
        generator = runIDDFS(startNode, endNode, cols, rows, walls);
        break;
      case 'random':
        generator = runRandomWalk(startNode, endNode, cols, rows, walls);
        break;
      case 'wall':
        generator = runWallFollower(startNode, endNode, cols, rows, walls);
        break;
      case 'tremaux':
        generator = runTremaux(startNode, endNode, cols, rows, walls);
        break;
      case 'thetastar':
        generator = runThetaStar(startNode, endNode, cols, rows, walls);
        break;
      case 'idastar':
        generator = runIDAStar(startNode, endNode, cols, rows, walls);
        break;
      default:
        generator = runDijkstra(startNode, endNode, cols, rows, walls);
    }

    const currentDelay = SPEED_OPTIONS[speedIndex]?.delay ?? 30;

    const stepSimulation = () => {
      const result = generator.next();
      if (result.done) {
        setIsRunning(false);
        const duration = Math.round(performance.now() - startTimeRef.current);
        setStats(prev => ({ ...prev, durationMs: duration }));
        return;
      }

      const step = result.value;
      if (step.type === 'visit' && step.col !== undefined && step.row !== undefined) {
        const key = `${step.col},${step.row}`;
        activeVisitedRef.current.add(key);
        setVisitedNodes(new Set(activeVisitedRef.current));
        setStats(prev => ({ ...prev, visitedCount: activeVisitedRef.current.size }));
        timerRef.current = setTimeout(stepSimulation, currentDelay);
      } else if (step.type === 'path' && step.path) {
        const pathSet = new Set(step.path.map(n => nodeToKey(n)));
        setPathNodes(pathSet);
        const duration = Math.round(performance.now() - startTimeRef.current);
        setStats(prev => ({ ...prev, pathLength: step.path!.length, durationMs: duration }));
        setIsRunning(false);
        playAchievementSound();
        onAchievementUnlocked?.('algorithm_explorer', 'Algorithm Explorer', `Executed ${algoName} in Terminal Pathfinder Lab`);
      } else if (step.type === 'no-path') {
        setIsRunning(false);
        const duration = Math.round(performance.now() - startTimeRef.current);
        setStats(prev => ({ ...prev, durationMs: duration }));
      }
    };

    stepSimulation();
  }, [isRunning, algorithm, isNoir, startNode, endNode, walls, speedIndex, cols, rows, onAchievementUnlocked]);

  // Grid Drag / Draw Wall handlers (Mouse)
  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isRunning) return;
    const target = e.target as HTMLElement;
    const cellEl = target.closest('[data-col]');
    if (!cellEl) return;

    const col = parseInt(cellEl.getAttribute('data-col') || '', 10);
    const row = parseInt(cellEl.getAttribute('data-row') || '', 10);
    if (isNaN(col) || isNaN(row)) return;

    e.preventDefault();
    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;

    if (isStart) {
      setInteractionMode('drag-start');
    } else if (isEnd) {
      setInteractionMode('drag-end');
    } else {
      if (walls.has(key)) {
        setInteractionMode('erase-walls');
        setWalls(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        setInteractionMode('draw-walls');
        setWalls(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    }
  }, [isRunning, startNode, endNode, walls]);

  const handleGridMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const cellEl = target.closest('[data-col]');
    if (!cellEl) {
      setHoverCoord(null);
      return;
    }

    const col = parseInt(cellEl.getAttribute('data-col') || '', 10);
    const row = parseInt(cellEl.getAttribute('data-row') || '', 10);
    if (isNaN(col) || isNaN(row)) return;

    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;
    const isWall = walls.has(key);
    const isPath = pathNodes.has(key);
    const isVisited = visitedNodes.has(key);

    const cellType = isStart ? 'Start Node' : isEnd ? 'Target Node' : isWall ? 'Wall Barricade' : isPath ? 'Shortest Path' : isVisited ? 'Visited Node' : 'Empty';
    setHoverCoord({ col, row, type: cellType });

    if (isRunning || interactionMode === 'idle') return;

    if (interactionMode === 'drag-start') {
      if (!isEnd && !walls.has(key)) setStartNode({ col, row });
    } else if (interactionMode === 'drag-end') {
      if (!isStart && !walls.has(key)) setEndNode({ col, row });
    } else if (interactionMode === 'draw-walls') {
      if (!isStart && !isEnd && !walls.has(key)) {
        setWalls(prev => new Set(prev).add(key));
      }
    } else if (interactionMode === 'erase-walls') {
      if (walls.has(key)) {
        setWalls(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  }, [isRunning, interactionMode, startNode, endNode, walls, pathNodes, visitedNodes]);

  // Touch handlers for Mobile / Tablet touchscreens
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isRunning) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    const cellEl = target?.closest('[data-col]');
    if (!cellEl) return;

    const col = parseInt(cellEl.getAttribute('data-col') || '', 10);
    const row = parseInt(cellEl.getAttribute('data-row') || '', 10);
    if (isNaN(col) || isNaN(row)) return;

    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;

    if (isStart) {
      setInteractionMode('drag-start');
    } else if (isEnd) {
      setInteractionMode('drag-end');
    } else {
      if (walls.has(key)) {
        setInteractionMode('erase-walls');
        setWalls(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      } else {
        setInteractionMode('draw-walls');
        setWalls(prev => {
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    }
  }, [isRunning, startNode, endNode, walls]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (isRunning || interactionMode === 'idle') return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    const cellEl = target?.closest('[data-col]');
    if (!cellEl) return;

    const col = parseInt(cellEl.getAttribute('data-col') || '', 10);
    const row = parseInt(cellEl.getAttribute('data-row') || '', 10);
    if (isNaN(col) || isNaN(row)) return;

    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;
    const isWall = walls.has(key);
    const isPath = pathNodes.has(key);
    const isVisited = visitedNodes.has(key);

    const cellType = isStart ? 'Start Node' : isEnd ? 'Target Node' : isWall ? 'Wall Barricade' : isPath ? 'Shortest Path' : isVisited ? 'Visited Node' : 'Empty';
    setHoverCoord({ col, row, type: cellType });

    if (interactionMode === 'drag-start') {
      if (!isEnd && !walls.has(key)) setStartNode({ col, row });
    } else if (interactionMode === 'drag-end') {
      if (!isStart && !walls.has(key)) setEndNode({ col, row });
    } else if (interactionMode === 'draw-walls') {
      if (!isStart && !isEnd && !walls.has(key)) {
        setWalls(prev => new Set(prev).add(key));
      }
    } else if (interactionMode === 'erase-walls') {
      if (walls.has(key)) {
        setWalls(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  }, [isRunning, interactionMode, startNode, endNode, walls, pathNodes, visitedNodes]);

  const activeInfo = ALGORITHM_INFO_MAP[algorithm];

  return (
    <div className={styles.wrapper}>
      {/* 1. Top Header Bar */}
      <div className={styles.headerBar}>
        <div className={styles.headerLeft}>
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            title="Exit Lab and return to terminal"
            aria-label="Exit Pathfinder Lab"
          >
            <X size={12} />
            <span>Exit [ESC]</span>
          </button>
          <span className={styles.titleBadge}>
            <Compass size={14} />
            <span>PATHFINDER LAB</span>
          </span>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>VISITED:</span>
            <span className={styles.statHighlight}>{stats.visitedCount}</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>PATH:</span>
            <span className={styles.statHighlight}>{stats.pathLength}</span>
          </div>
          <div className={styles.statPill}>
            <span className={styles.statLabel}>TIME:</span>
            <span className={styles.statHighlight}>{stats.durationMs}ms</span>
          </div>
        </div>
      </div>

      {/* 2. Compact Controls Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmKey)}
            disabled={isRunning}
            className={styles.algoSelect}
            aria-label="Pathfinding algorithm selection"
          >
            <optgroup label="⚡ Heuristic Shortest Path">
              <option value="astar">A* Search (Guided Manhattan)</option>
              <option value="thetastar">Theta* Any-Angle (Line-of-Sight)</option>
              <option value="jps">Jump Point Search (Quantum Leap)</option>
              <option value="greedy">Greedy Best-First (Direct)</option>
            </optgroup>
            <optgroup label="🌊 Radial Waves">
              <option value="dijkstra">Dijkstra&apos;s Algorithm (Uniform Wave)</option>
              <option value="bidirectional">Bidirectional BFS (Dual Search)</option>
              <option value="bfs">Breadth-First Search (BFS)</option>
            </optgroup>
            <optgroup label="🧠 Memory & Tree Probes">
              <option value="iddfs">Iterative Deepening DFS (IDDFS)</option>
              <option value="idastar">Iterative Deepening A* (IDA*)</option>
              <option value="dfs">Depth-First Search (DFS)</option>
            </optgroup>
            <optgroup label="🧩 Maze Solvers">
              <option value="tremaux">Trémaux&apos;s Maze Solver</option>
              <option value="wall">Pledge Wall Follower</option>
              <option value="random">Random Walk (Brownian)</option>
            </optgroup>
          </select>

          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) {
                applyMazePreset(e.target.value as 'random' | 'corridors' | 'slalom' | 'fortress');
                e.target.value = '';
              }
            }}
            disabled={isRunning}
            className={styles.mazeSelect}
            aria-label="Procedural maze presets"
          >
            <option value="" disabled>🎲 Maze Presets ▾</option>
            <option value="random">🎲 Random Scatter</option>
            <option value="corridors">🏛️ Corridors Maze</option>
            <option value="slalom">🪜 Slalom Course</option>
            <option value="fortress">🏰 Fortress Donut</option>
          </select>

          <div className={styles.speedGroup}>
            <span className={styles.speedLabel}>SPEED:</span>
            {SPEED_OPTIONS.map((opt, idx) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setSpeedIndex(idx)}
                disabled={isRunning}
                className={`${styles.speedBtn} ${speedIndex === idx ? styles.speedBtnActive : ''}`}
                aria-label={`Speed ${opt.label}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toolbarRight}>
          {!isRunning ? (
            <button
              type="button"
              onClick={visualize}
              className={styles.runBtn}
            >
              <Play size={12} fill="currentColor" />
              <span>RUN SEARCH</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopSimulation}
              className={styles.stopBtn}
            >
              <Square size={12} fill="currentColor" />
              <span>HALT</span>
            </button>
          )}

          <button
            type="button"
            onClick={clearPath}
            disabled={isRunning}
            className={styles.toolBtn}
            title="Clear visited & path marks"
            aria-label="Clear path"
          >
            <Sparkles size={11} />
            <span>Path</span>
          </button>

          <button
            type="button"
            onClick={clearWalls}
            disabled={isRunning}
            className={styles.toolBtn}
            title="Clear all walls"
            aria-label="Clear walls"
          >
            <Trash2 size={11} />
            <span>Walls</span>
          </button>

          <button
            type="button"
            onClick={resetGrid}
            disabled={isRunning}
            className={styles.toolBtn}
            title="Reset coordinates"
            aria-label="Reset grid"
          >
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* 3. Hero 2D Grid Arena */}
      <div className={styles.gridWrapper}>
        <div
          ref={gridRef}
          className={styles.grid}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          onMouseDown={handleGridMouseDown}
          onMouseOver={handleGridMouseOver}
          onMouseLeave={() => setHoverCoord(null)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setInteractionMode('idle')}
        >
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((__, c) => {
              const key = `${c},${r}`;
              const isStart = c === startNode.col && r === startNode.row;
              const isEnd = c === endNode.col && r === endNode.row;
              const isWall = walls.has(key);
              const isVisited = visitedNodes.has(key);
              const isPath = pathNodes.has(key);

              let cellClass = styles.cell;
              if (isStart) cellClass += ` ${styles.cellStart}`;
              else if (isEnd) cellClass += ` ${styles.cellEnd}`;
              else if (isWall) cellClass += ` ${styles.cellWall}`;
              else if (isPath) cellClass += ` ${styles.cellPath}`;
              else if (isVisited) cellClass += ` ${styles.cellVisited}`;

              const iconSize = isMobile ? 10 : 13;

              return (
                <div
                  key={key}
                  className={cellClass}
                  data-col={c}
                  data-row={r}
                  role="gridcell"
                  aria-label={`Cell ${c},${r}`}
                >
                  {isStart && (
                    <span className={styles.nodeIcon}>
                      {isNoir ? <Search size={iconSize} /> : <Zap size={iconSize} />}
                    </span>
                  )}
                  {isEnd && (
                    <span className={styles.nodeIcon}>
                      {isNoir ? <FileText size={iconSize} /> : <Target size={iconSize} />}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 4. Bottom HUD & Telemetry Strip */}
      <div className={styles.hudFooter}>
        <div className={styles.legendGroup}>
          <span className={styles.legendChip}>
            <span className={`${styles.legendDot} ${styles.dotStart}`} />
            <span>Start</span>
          </span>
          <span className={styles.legendChip}>
            <span className={`${styles.legendDot} ${styles.dotEnd}`} />
            <span>Target</span>
          </span>
          <span className={styles.legendChip}>
            <span className={`${styles.legendDot} ${styles.dotWall}`} />
            <span>Wall</span>
          </span>
          <span className={styles.legendChip}>
            <span className={`${styles.legendDot} ${styles.dotVisited}`} />
            <span>Wave</span>
          </span>
          <span className={styles.legendChip}>
            <span className={`${styles.legendDot} ${styles.dotPath}`} />
            <span>Path</span>
          </span>
        </div>

        <div className={styles.algoBadge}>
          <span>⚡ {isNoir ? activeInfo.nameNoir : activeInfo.name}</span>
          <span className={styles.algoPropText}>• {activeInfo.property}</span>
        </div>

        <div className={styles.coordText}>
          {hoverCoord
            ? `[${String(hoverCoord.col).padStart(2, '0')}, ${String(hoverCoord.row).padStart(2, '0')}] ${hoverCoord.type}`
            : (isMobile ? 'Touch & drag nodes or walls' : 'Drag nodes • Draw laser walls')}
        </div>
      </div>
    </div>
  );
}
