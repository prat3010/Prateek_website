'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Lock, AlertTriangle, Search, Zap } from 'lucide-react';
import { useLenis } from 'lenis/react';
import { useTheme } from '@/context/ThemeContext';
import Pathfinder from './Pathfinder';
import { GridNode, runDijkstra, runAStar, runBFS, runDFS, runGreedyBestFirst, runBidirectionalBFS, runJPS, runIDDFS, runRandomWalk, runWallFollower, runTremaux, runThetaStar, runIDAStar, PathfindingStep } from './pathfindingAlgorithms';
import styles from './Playground.module.css';

const GRID_COLS = 20;
const GRID_ROWS = 15;
const SPEED_DELAYS = [150, 80, 40, 15, 4];

interface LogEntry {
  timestamp: string;
  message: string;
}

interface AlgorithmInfo {
  name: string;
  nameNoir: string;
  works: string;
  property: string;
  useCase: string;
  tip: string;
  isWarningTip?: boolean;
}

const ALGORITHM_INFO_MAP: Record<string, AlgorithmInfo> = {
  dijkstra: {
    name: "Dijkstra's Algorithm (Full Grid Wave)",
    nameNoir: "Dijkstra's Algorithm (Complete Sweep)",
    works: "Explores nodes uniformly in all directions, evaluating total cumulative cost from the starting node.",
    property: "Guaranteed shortest path. Supports unweighted and weighted graphs.",
    useCase: "GPS routing engines, network routing protocols (like OSPF).",
    tip: "Perfect for finding the absolute shortest path, but checks a large number of cells."
  },
  astar: {
    name: "A* Heuristic Search (Guided Manhattan)",
    nameNoir: "A* Heuristic Search (Heuristic Scan)",
    works: "Uses Manhattan distance estimations to prioritize grid cells closer to the destination.",
    property: "Guaranteed shortest path. Highly optimal.",
    useCase: "Video game pathfinding, robotic path planning.",
    tip: "The most efficient general-purpose algorithm for grid layouts. Highly recommended."
  },
  greedy: {
    name: "Greedy Best-First Search (Heuristic Scan)",
    nameNoir: "Greedy Best-First Search (Tunnel Vision)",
    works: "Moves directly towards the target based solely on remaining distance estimation.",
    property: "No shortest path guarantee. Fast but can get trapped easily.",
    useCase: "Quick mapping estimation heuristics.",
    tip: "Easily gets stuck behind walls. Watch it run blindly into barriers!",
    isWarningTip: true
  },
  bfs: {
    name: "Breadth-First Search (Unweighted Wave)",
    nameNoir: "Breadth-First Search (Spread Search)",
    works: "Explores grid cells uniformly outward in radial layers (level-by-level).",
    property: "Guaranteed shortest path on unweighted grids.",
    useCase: "Social networks (degrees of connection), peer-to-peer network routing.",
    tip: "Excellent for unweighted maps, but does not support variable movement weights."
  },
  bidirectional: {
    name: "Bidirectional BFS (Dual Search)",
    nameNoir: "Bidirectional BFS (Dual Encircling)",
    works: "Launches two simultaneous BFS searches (from Start and End) that meet in the middle.",
    property: "Guaranteed shortest path on unweighted grids.",
    useCase: "Large-scale social networks, word ladders, database graph pathing.",
    tip: "Highly efficient! Reaches the target with a fraction of BFS's visited nodes."
  },
  dfs: {
    name: "Depth-First Search (Backtracking Path)",
    nameNoir: "Depth-First Search (Winding Probe)",
    works: "Probes as deep as possible along a single branch before backtracking.",
    property: "No shortest path guarantee. Highly winding paths.",
    useCase: "Maze generation, graph cycle checks, nested structures parsing.",
    tip: "Produces long, highly sub-optimal paths. Good for finding any valid solution."
  },
  jps: {
    name: "Jump Point Search (Quantum Leap)",
    nameNoir: "Jump Point Search (Grid Jump-Cut)",
    works: "Optimized A* variation that skips straight grid paths to jump directly to obstacle corners.",
    property: "Guaranteed shortest path. Highly optimal.",
    useCase: "Real-time strategy game pathfinding on large open maps.",
    tip: "Blazing fast in open fields, but behaves like normal A* if walls are dense."
  },
  iddfs: {
    name: "Iterative Deepening DFS (Pulsing Probe)",
    nameNoir: "Iterative Deepening DFS (Interrogative Probe)",
    works: "Repeatedly runs depth-limited DFS, increasing the depth limit by 1 each iteration loop.",
    property: "Guaranteed shortest path on unweighted grids. Low memory usage.",
    useCase: "Chess engines, artificial intelligence game decision trees.",
    tip: "Creates pulsating search waves. Re-visits cells, but uses very little RAM."
  },
  random: {
    name: "Random Walk Search (Brownian Drift)",
    nameNoir: "Random Walk Search (Drunkard's Crawl)",
    works: "Wanders randomly in adjacent cells until it happens to touch the target.",
    property: "No shortest path guarantee. Stochastic search.",
    useCase: "Brownian motion modeling, economic simulation mocks.",
    tip: "⚠️ High step counts! Might take a very long time if start and end are far apart.",
    isWarningTip: true
  },
  wall: {
    name: "Pledge Algorithm (Contour Hugger)",
    nameNoir: "Pledge Algorithm (Barricade Cordon)",
    works: "Hugs the left side of obstacles by always trying to turn left relative to its heading.",
    property: "No shortest path guarantee. Maze-solving rule.",
    useCase: "Robotic vacuum cleaners, maze-traversal devices.",
    tip: "⚠️ Requires walls to guide it! On an empty grid, it loops in a 2x2 circle forever.",
    isWarningTip: true
  },
  tremaux: {
    name: "Trémaux's Algorithm (Contour Tracker)",
    nameNoir: "Trémaux's Algorithm (Footprint Tracing)",
    works: "Places visual markers on traversed cells. Prefers unvisited junctions, backtracks by laying a second mark when stuck, and avoids double-marked routes.",
    property: "Guarantees escape from any solvable 2D maze. Non-shortest path.",
    useCase: "Robotics exploratory mapping, legacy maze solving.",
    tip: "Hugs passages and marks backtrack steps in real-time. Extremely fun to watch in dense mazes!"
  },
  thetastar: {
    name: "Theta* Search (Any-Angle Planner)",
    nameNoir: "Theta* Search (Direct Line-of-Sight)",
    works: "An A* variation that checks for a clear line of sight (Bresenham's check) back to parent nodes, bypassing intermediate grid lines.",
    property: "Guaranteed shortest path. Optimal any-angle vectors.",
    useCase: "Autonomous drone navigation, video game AI character movement.",
    tip: "Unlike standard A*, it produces perfectly smooth diagonal straight-line paths!"
  },
  idastar: {
    name: "Iterative Deepening A* (Elliptical Probe)",
    nameNoir: "Iterative Deepening A* (Elliptical Sweep)",
    works: "Performs DFS depth probes, setting the cost limit to the heuristic A* estimate f(n). Increases the threshold iteratively based on minimum cost overflow.",
    property: "Guaranteed shortest path. Extremely memory efficient.",
    useCase: "AI heuristic planners, game engines solving large state spaces (e.g., Rubik's cubes).",
    tip: "Creates a beautiful ellipse-shaped search pattern that expands and points towards the target node."
  }
};

function Playground() {
  const { isNoir } = useTheme();
  const lenis = useLenis();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Grid coordinates state
  const [startNode, setStartNode] = useState<GridNode>({ col: 3, row: 7 });
  const [endNode, setEndNode] = useState<GridNode>({ col: 16, row: 7 });
  const [walls, setWalls] = useState<Set<string>>(new Set<string>());
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set<string>());
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set<string>());

  // Controls state
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(3); // 1 = Slowest, 5 = Fastest
  const [algorithm, setAlgorithm] = useState<'dijkstra' | 'astar' | 'bfs' | 'dfs' | 'greedy' | 'bidirectional' | 'jps' | 'iddfs' | 'random' | 'wall' | 'tremaux' | 'thetastar' | 'idastar'>('dijkstra');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Launch overlay state
  const [isLaunched, setIsLaunched] = useState(false);
  const [isBooting, setIsBooting] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  const consoleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeVisitedRef = useRef<Set<string>>(new Set());

  const bootLinesNormal = [
    '>> CONNECTING ENGINE TO COORD_GRID...',
    '>> SHIFTING HEURISTICS INDEX MATRIX...',
    '>> BOOTING DIJKSTRA & A-STAR ALGORITHMS...',
    '>> VERIFYING TOUCH SENSOR CAPABILITIES...',
    'SYSTEM ONLINE // LAB CORE 100% ONLINE. SIMULATOR READY!'
  ];

  const bootLinesNoir = [
    'CASE // RETRIEVING ARCHIVED CRIME REPORTS...',
    'CASE // MAPPING CITY STREETS COORD SECTOR #11...',
    'CASE // RESOLVING EVIDENCE FILE BOUNDARIES...',
    'CASE // MOUNTING CRIME SCENE BARRICADES...',
    'RESOLVED // DECRYPTION COMPLETE. DESK UNLOCKED.'
  ];

  // Mobile body scroll lock when simulation is launched in fullscreen
  useEffect(() => {
    const handleResize = () => {
      if (isLaunched && window.innerWidth <= 992) {
        lenis?.stop();
      } else {
        lenis?.start();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      lenis?.start();
    };
  }, [isLaunched, lenis]);

  // Launch boot sequence orchestrator
  const handleLaunch = () => {
    setIsBooting(true);
    setBootLogs([]);

    const lines = isNoir ? bootLinesNoir : bootLinesNormal;
    let index = 0;

    const interval = setInterval(() => {
      if (index < lines.length) {
        setBootLogs((prev) => [...prev, lines[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLaunched(true);
          setIsBooting(false);
        }, 300);
      }
    }, 150);
  };

  const handleExitFullscreen = () => {
    setIsLaunched(false);
  };

  // Auto-scroll console to bottom locally
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Add line to terminal console log
  const addLog = useCallback((message: string) => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    setLogs((prev) => [...prev, { timestamp, message }]);
  }, []);

  // Stop / halt active pathfinding simulation
  const stopSimulation = useCallback(() => {
    if (!isRunning) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setVisitedNodes(new Set(activeVisitedRef.current));
    setIsRunning(false);
    addLog(isNoir ? 'Investigation aborted by inspector.' : 'Simulation halted by operator!');
  }, [isRunning, isNoir, addLog]);

  const systemInitLogs = isNoir ? [
    { timestamp: '--:--:--', message: 'LOG SYSTEM ONLINE. SUB-AGENT ACTIVE.' },
    { timestamp: '--:--:--', message: 'Ready to map crime scenes. Use grid above to draw brick barriers.' }
  ] : [
    { timestamp: '--:--:--', message: 'THE LAB COMPUTERS BOOTED UP! ONLINE.' },
    { timestamp: '--:--:--', message: 'Draw laser forcefields on the map and hit run to guide the hero!' }
  ];

  const displayLogs = logs.length === 0 ? systemInitLogs : logs;

  // Clear path and visited marks
  const clearPath = useCallback(() => {
    if (isRunning) return;
    // Remove custom visualizer classes from DOM directly
    document.querySelectorAll('.visualizer-visited').forEach(el => el.classList.remove('visualizer-visited'));
    document.querySelectorAll('.visualizer-path').forEach(el => el.classList.remove('visualizer-path'));
    setVisitedNodes(new Set<string>());
    setPathNodes(new Set<string>());
    addLog(isNoir ? 'Cleared search markers.' : 'Cleaned the graph! Ready for next run.');
  }, [isRunning, isNoir, addLog]);

  // Clear all walls
  const clearWalls = useCallback(() => {
    if (isRunning) return;
    setWalls(new Set<string>());
    addLog(isNoir ? 'Dismantled all street barricades.' : 'Deactivated all laser walls!');
  }, [isRunning, isNoir, addLog]);

  // Full reset
  const resetGrid = useCallback(() => {
    if (isRunning) return;
    // Remove custom visualizer classes from DOM directly
    document.querySelectorAll('.visualizer-visited').forEach(el => el.classList.remove('visualizer-visited'));
    document.querySelectorAll('.visualizer-path').forEach(el => el.classList.remove('visualizer-path'));
    setStartNode({ col: 3, row: 7 });
    setEndNode({ col: 16, row: 7 });
    setWalls(new Set<string>());
    setVisitedNodes(new Set<string>());
    setPathNodes(new Set<string>());
    setLogs([]);
    addLog(isNoir ? 'Reset system to defaults. Case record empty.' : 'Boom! Grid initialized back to start.');
  }, [isRunning, isNoir, addLog]);

  // Pathfinding visualizer orchestrator
  const visualize = useCallback(() => {
    if (isRunning) return;

    // Reset markers before starting
    document.querySelectorAll('.visualizer-visited').forEach(el => el.classList.remove('visualizer-visited'));
    document.querySelectorAll('.visualizer-path').forEach(el => el.classList.remove('visualizer-path'));
    setVisitedNodes(new Set<string>());
    setPathNodes(new Set<string>());
    activeVisitedRef.current = new Set<string>();
    setIsRunning(true);

    let algoName = '';
    if (algorithm === 'dijkstra') algoName = "Dijkstra's Shortest Path";
    else if (algorithm === 'astar') algoName = "A* Heuristic Search";
    else if (algorithm === 'bfs') algoName = "Breadth-First Search";
    else if (algorithm === 'dfs') algoName = "Depth-First Search";
    else if (algorithm === 'greedy') algoName = "Greedy Best-First Search";
    else if (algorithm === 'bidirectional') algoName = "Bidirectional BFS";
    else if (algorithm === 'jps') algoName = "Jump Point Search";
    else if (algorithm === 'iddfs') algoName = "Iterative Deepening DFS";
    else if (algorithm === 'random') algoName = "Random Walk Search";
    else if (algorithm === 'wall') algoName = "Wall Follower Route";

    addLog(isNoir 
      ? `Initializing ${algoName}. Calculating optimal vectors...`
      : `ZAP! Launching ${algoName}... tracking target path!`
    );

    // Instantiate selected algorithm generator
    let generator;
    if (algorithm === 'dijkstra') {
      generator = runDijkstra(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'astar') {
      generator = runAStar(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'bfs') {
      generator = runBFS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'greedy') {
      generator = runGreedyBestFirst(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'bidirectional') {
      generator = runBidirectionalBFS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'jps') {
      generator = runJPS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'iddfs') {
      generator = runIDDFS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'random') {
      generator = runRandomWalk(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'wall') {
      generator = runWallFollower(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'tremaux') {
      generator = runTremaux(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'thetastar') {
      generator = runThetaStar(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else if (algorithm === 'idastar') {
      generator = runIDAStar(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    } else {
      generator = runDFS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    }

    const step = () => {
      const result = generator.next();

      if (result.done) {
        setIsRunning(false);
        return;
      }

      const val = result.value as PathfindingStep;

      if (val.type === 'visit' && val.col !== undefined && val.row !== undefined) {
        const key = `${val.col},${val.row}`;
        activeVisitedRef.current.add(key);
        
        // Directly inject visualizer-visited class into DOM cell to avoid React re-renders during active search loop
        const el = document.querySelector(`[data-col="${val.col}"][data-row="${val.row}"]`);
        if (el) {
          el.classList.add('visualizer-visited');
        }
        
        // Schedule next iteration
        timerRef.current = setTimeout(step, SPEED_DELAYS[speed - 1]);
      } 
      else if (val.type === 'path' && val.path) {
        // Direct DOM update for path styling
        val.path.forEach((node) => {
          const el = document.querySelector(`[data-col="${node.col}"][data-row="${node.row}"]`);
          if (el) {
            el.classList.add('visualizer-path');
          }
        });

        // Sync final visited & path sets to React state in a single batch render at the end
        setVisitedNodes(new Set(activeVisitedRef.current));

        const newPath = new Set<string>();
        val.path.forEach((node) => {
          newPath.add(`${node.col},${node.row}`);
        });
        setPathNodes(newPath);

        setIsRunning(false);
        addLog(isNoir 
          ? `Path identified: shortest path found with cost of ${val.path.length} blocks.`
          : `Success! Route found in ${val.path.length} jumps!`
        );
      } 
      else if (val.type === 'no-path') {
        // Sync final visited set to React state in a single batch render at the end
        setVisitedNodes(new Set(activeVisitedRef.current));

        setIsRunning(false);
        addLog(isNoir 
          ? 'WARNING: Target unreachable. Barriers block all viable paths.'
          : 'Blocked! No route exists from Start to End!'
        );
      }
    };

    step();
  }, [isRunning, algorithm, startNode, endNode, walls, speed, isNoir, addLog]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getSpeedLabel = (val: number) => {
    switch (val) {
      case 1: return 'Snail';
      case 2: return 'Slow';
      case 3: return 'Cruise';
      case 4: return 'Rapid';
      case 5: return 'Insta';
      default: return 'Cruise';
    }
  };

  if (isMobile) {
    return (
      <section id="playground" className={styles.playground} aria-label="Playground">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>
            {isNoir ? 'THE DETECTIVE’S DESK' : 'THE ALGORITHM LAB'}
          </h2>
          <div className={styles.mobileWarning} style={{ display: 'flex' }}>
            <span className={styles.warningIcon}>{isNoir ? <Lock size={20} /> : <AlertTriangle size={20} />}</span>
            <h3 className={styles.warningHeader}>
              {isNoir ? 'CASE FILE ENCRYPTED' : 'ACCESS RESTRICTED!'}
            </h3>
            <p className={styles.warningText}>
              {isNoir
                ? 'City grid analysis requires desk clearance. Decrypt coordinate maps on your desktop terminal to run calculations.'
                : 'Powering up the algorithm engine requires terminal clearance. Visit this site on a desktop screen to sketch laser walls and run pathfinding simulations!'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="playground" className={styles.playground} aria-label="Playground">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {isNoir ? 'THE DETECTIVE’S DESK' : 'THE ALGORITHM LAB'}
        </h2>

        <div className={styles.moBanner}>
            <div className={styles.moBadge}>
              {isNoir ? 'INSTRUCTIONS' : 'INSTRUCTIONS'}
            </div>
            <p className={styles.moText}>
              {isNoir
                ? 'Case files are active. Drag the Detective (Search icon) and the Evidence (File icon) on the grid map. Click and hold to sketch brick wall barricades (obstacles). Select target computation methods below.'
                : 'Welcome to the lab! Drag the Start (Zap icon) and Target (Crosshair icon) to set your coordinates. Click and drag on empty cells to paint laser barriers. Hit visualize and watch the search algorithm expand!'}
            </p>
        </div>

        <div className={`${styles.desk} ${isLaunched ? styles.fullscreenMobile : ''}`}>
            
            {/* Header only visible in mobile fullscreen mode */}
            {isLaunched && (
              <div className={styles.fullscreenHeader}>
                <span className={styles.fullscreenTitle} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {isNoir ? <Search size={14} /> : <Zap size={14} />}
                  <span>{isNoir ? 'CASE #404 SEARCH' : 'PATHFINDER MOBILE'}</span>
                </span>
                <button
                  type="button"
                  className={styles.exitBtn}
                  onClick={handleExitFullscreen}
                  disabled={isRunning}
                >
                  {isNoir ? 'Close Ledger' : 'Exit Simulator'}
                </button>
              </div>
            )}

            {/* Launch Overlay (Desktop & Boot Sequence Overlay) */}
            {(!isLaunched || isBooting) && (
              <div className={styles.launchOverlay}>
                <div className={styles.scanline}></div>
                <div className={styles.crtContent}>
                  <h3 className={styles.overlayTitle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {isNoir ? <Search size={18} /> : <Zap size={18} />}
                    <span>{isNoir ? 'CASE LEDGER ACCESS' : 'PATH CORE v2.5'}</span>
                  </h3>
                  
                  {/* Themed Boot Logs / Diagnostic Specs */}
                  <div className={styles.sysLogs}>
                    {isBooting ? (
                      bootLogs.map((log, index) => (
                        <p key={index} className={styles.sysLogLine}>{log}</p>
                      ))
                    ) : (
                      <>
                        <p className={styles.sysLogLine}>
                          {isNoir ? 'STATUS: ACCESS RESTRICTED' : 'SYSTEM STATUS: STANDBY'}
                        </p>
                        <p className={styles.sysLogLine}>
                          {isNoir ? 'SECURITY LAYER: DEEP-GRID CORES' : 'PROCESSOR: 8-BIT CYBER-CORE'}
                        </p>
                        <p className={styles.sysLogLine}>
                          {isNoir ? 'LEDGER METHOD: TYPE-4 ANALYTICS' : 'GRAPH MATRIX: 300 CELLS (20x15)'}
                        </p>
                      </>
                    )}
                  </div>

                  {!isBooting && (
                    <button
                      type="button"
                      className={styles.launchBtn}
                      onClick={handleLaunch}
                    >
                      {isNoir ? 'Decrypt Ledger' : 'Launch Simulator'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Launcher Card (Displayed in place when not booted on mobile) */}
            {!isLaunched && !isBooting && (
              <div className={styles.mobileWarning}>
                <span className={styles.warningIcon}>{isNoir ? <Lock size={20} /> : <AlertTriangle size={20} />}</span>
                <h3 className={styles.warningHeader}>
                  {isNoir ? 'CASE FILE ENCRYPTED' : 'ACCESS RESTRICTED!'}
                </h3>
                <p className={styles.warningText}>
                  {isNoir
                    ? 'City grid analysis requires desk clearance. Touch below to decrypt coordinates on your mobile terminal.'
                    : 'Powering up the algorithm engine requires terminal clearance. Touch below to launch the mobile visualizer!'}
                </p>
                <button
                  type="button"
                  className={styles.launchBtn}
                  onClick={handleLaunch}
                  style={{ marginTop: '1.5rem', display: 'inline-block' }}
                >
                  {isNoir ? 'Decrypt Ledger' : 'Launch Simulator'}
                </button>
              </div>
            )}

            <div className={styles.panelLayout}>
              {/* Left Column: Grid & Terminal Console */}
              <div className={styles.leftColumn}>
                {/* Interactive Pathfinder Grid */}
                <Pathfinder
                  cols={GRID_COLS}
                  rows={GRID_ROWS}
                  startNode={startNode}
                  setStartNode={setStartNode}
                  endNode={endNode}
                  setEndNode={setEndNode}
                  walls={walls}
                  setWalls={setWalls}
                  visitedNodes={visitedNodes}
                  pathNodes={pathNodes}
                  isNoir={isNoir}
                  isRunning={isRunning}
                />

                {/* Retro Logs Terminal Output */}
                <div className={styles.console} ref={consoleRef} role="log" aria-label="Visualizer terminal output">
                  {displayLogs.map((log, index) => (
                    <p key={index} className={styles.consoleLine}>
                      <span className={styles.consoleTimestamp}>[{log.timestamp}]</span>
                      {log.message}
                    </p>
                  ))}
                </div>
              </div>

              {/* Right Column: Controls & Info Card */}
              <div className={styles.rightColumn}>
                <div className={styles.controls}>
                  {/* Algorithm Selector */}
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      {isNoir ? 'Case Ledger Method' : 'Algorithm Engine'}
                    </label>
                    <select
                      className={styles.select}
                      value={algorithm}
                      onChange={(e) => setAlgorithm(e.target.value as 'dijkstra' | 'astar' | 'bfs' | 'dfs' | 'greedy' | 'bidirectional' | 'jps' | 'iddfs' | 'random' | 'wall' | 'tremaux' | 'thetastar' | 'idastar')}
                      disabled={isRunning}
                    >
                      <option value="dijkstra">
                        {isNoir ? "Dijkstra's Algorithm (Complete Sweep)" : "Dijkstra's Algorithm (Full Grid Wave)"}
                      </option>
                      <option value="astar">
                        {isNoir ? "A* Heuristic Search (Heuristic Scan)" : "A* Heuristic Search (Guided Manhattan)"}
                      </option>
                      <option value="greedy">
                        {isNoir ? "Greedy Best-First Search (Tunnel Vision)" : "Greedy Best-First Search (Heuristic Scan)"}
                      </option>
                      <option value="bfs">
                        {isNoir ? "Breadth-First Search (Spread Search)" : "Breadth-First Search (Unweighted Wave)"}
                      </option>
                      <option value="bidirectional">
                        {isNoir ? "Bidirectional BFS (Dual Encircling)" : "Bidirectional BFS (Dual Search)"}
                      </option>
                      <option value="dfs">
                        {isNoir ? "Depth-First Search (Winding Probe)" : "Depth-First Search (Backtracking Path)"}
                      </option>
                      <option value="jps">
                        {isNoir ? "Jump Point Search (Grid Jump-Cut)" : "Jump Point Search (Quantum Leap)"}
                      </option>
                      <option value="iddfs">
                        {isNoir ? "Iterative Deepening DFS (Interrogative Probe)" : "Iterative Deepening DFS (Pulsing Probe)"}
                      </option>
                      <option value="random">
                        {isNoir ? "Random Walk Search (Drunkard's Crawl)" : "Random Walk Search (Brownian Drift)"}
                      </option>
                      <option value="wall">
                        {isNoir ? "Pledge Algorithm (Barricade Cordon)" : "Pledge Algorithm (Contour Hugger)"}
                      </option>
                      <option value="tremaux">
                        {isNoir ? "Trémaux's Algorithm (Footprint Tracing)" : "Trémaux's Algorithm (Contour Tracker)"}
                      </option>
                      <option value="thetastar">
                        {isNoir ? "Theta* Search (Direct Line-of-Sight)" : "Theta* Search (Any-Angle Planner)"}
                      </option>
                      <option value="idastar">
                        {isNoir ? "Iterative Deepening A* (Elliptical Sweep)" : "Iterative Deepening A* (Elliptical Probe)"}
                      </option>
                    </select>
                  </div>

                  {/* Speed Slider */}
                  <div className={styles.controlGroup}>
                    <label className={styles.label}>
                      {isNoir ? 'Search Intensity' : 'Visualizer Speed'}
                    </label>
                    <div className={styles.sliderContainer}>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        className={styles.slider}
                        value={speed}
                        onChange={(e) => setSpeed(Number(e.target.value))}
                        disabled={isRunning}
                      />
                      <span className={styles.speedText}>
                        {getSpeedLabel(speed)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={styles.buttonRow}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={isRunning ? stopSimulation : visualize}
                    >
                      {isRunning 
                        ? (isNoir ? 'Halt Search' : 'Stop!') 
                        : (isNoir ? 'Investigate' : 'Visualize!')}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={clearPath}
                      disabled={isRunning}
                    >
                      {isNoir ? 'Clear Ledger' : 'Clear Path'}
                    </button>
                  </div>

                  <div className={`${styles.buttonRow} ${styles.buttonRowFull}`}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={clearWalls}
                      disabled={isRunning}
                      style={{ width: '100%', marginBottom: '0.75rem' }}
                    >
                      {isNoir ? 'Clear Barriers' : 'Clear Walls'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnSecondary}`}
                      onClick={resetGrid}
                      disabled={isRunning}
                      style={{ width: '100%' }}
                    >
                      {isNoir ? 'Reset Desk' : 'Reset Grid'}
                    </button>
                  </div>
                </div>

                {/* Dynamic Algorithm Dossier / Specs Card */}
                {ALGORITHM_INFO_MAP[algorithm] && (
                  <div className={styles.infoCard}>
                    <h3 className={styles.infoTitle}>
                      {isNoir 
                        ? ALGORITHM_INFO_MAP[algorithm].nameNoir 
                        : ALGORITHM_INFO_MAP[algorithm].name}
                    </h3>
                    <p className={styles.infoItem}>
                      <span className={styles.infoLabel}>{isNoir ? 'Modus Operandi' : 'How it works'}</span>
                      {ALGORITHM_INFO_MAP[algorithm].works}
                    </p>
                    <p className={styles.infoItem}>
                      <span className={styles.infoLabel}>{isNoir ? 'Case Properties' : 'Properties'}</span>
                      {ALGORITHM_INFO_MAP[algorithm].property}
                    </p>
                    <p className={styles.infoItem}>
                      <span className={styles.infoLabel}>{isNoir ? 'Field Application' : 'Real-World Use'}</span>
                      {ALGORITHM_INFO_MAP[algorithm].useCase}
                    </p>
                    <div className={`${styles.infoTip} ${ALGORITHM_INFO_MAP[algorithm].isWarningTip ? styles.infoTipWarning : ''}`}>
                      <span className={styles.infoLabel}>{isNoir ? 'Agent Intel' : 'Tip & Diagnostics'}</span>
                      {ALGORITHM_INFO_MAP[algorithm].tip}
                    </div>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Playground);
