'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import ActionWord from '@/components/ui/ActionWord';
import ScrollReveal from '@/components/effects/ScrollReveal';
import Pathfinder from './Pathfinder';
import { GridNode, runDijkstra, runAStar, runBFS, runDFS, PathfindingStep } from './pathfindingAlgorithms';
import styles from './Playground.module.css';

const GRID_COLS = 20;
const GRID_ROWS = 15;
const SPEED_DELAYS = [150, 80, 40, 15, 4];

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function Playground() {
  const { isNoir } = useTheme();

  // Grid coordinates state
  const [startNode, setStartNode] = useState<GridNode>({ col: 3, row: 7 });
  const [endNode, setEndNode] = useState<GridNode>({ col: 16, row: 7 });
  const [walls, setWalls] = useState<Set<string>>(new Set<string>());
  const [visitedNodes, setVisitedNodes] = useState<Set<string>>(new Set<string>());
  const [pathNodes, setPathNodes] = useState<Set<string>>(new Set<string>());

  // Controls state
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(3); // 1 = Slowest, 5 = Fastest
  const [algorithm, setAlgorithm] = useState<'dijkstra' | 'astar' | 'bfs' | 'dfs'>('dijkstra');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const consoleRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);



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

  const systemInitLogs = isNoir ? [
    { timestamp: '--:--:--', message: 'LOG SYSTEM ONLINE. SUB-AGENT ACTIVE.' },
    { timestamp: '--:--:--', message: 'Ready to map crime scenes. Use grid above to draw brick barriers.' }
  ] : [
    { timestamp: '--:--:--', message: 'THE LAB COMPUTERS BOOTED UP! ⚡' },
    { timestamp: '--:--:--', message: 'Draw laser forcefields on the map and hit run to guide the hero!' }
  ];

  const displayLogs = logs.length === 0 ? systemInitLogs : logs;

  // Clear path and visited marks
  const clearPath = useCallback(() => {
    if (isRunning) return;
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
    setVisitedNodes(new Set<string>());
    setPathNodes(new Set<string>());
    setIsRunning(true);

    let algoName = '';
    if (algorithm === 'dijkstra') algoName = "Dijkstra's Shortest Path";
    else if (algorithm === 'astar') algoName = "A* Heuristic Search";
    else if (algorithm === 'bfs') algoName = "Breadth-First Search";
    else if (algorithm === 'dfs') algoName = "Depth-First Search";

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
    } else {
      generator = runDFS(startNode, endNode, GRID_COLS, GRID_ROWS, walls);
    }

    const localVisited = new Set<string>();

    const step = () => {
      const result = generator.next();

      if (result.done) {
        setIsRunning(false);
        return;
      }

      const val = result.value as PathfindingStep;

      if (val.type === 'visit' && val.col !== undefined && val.row !== undefined) {
        const key = `${val.col},${val.row}`;
        localVisited.add(key);
        setVisitedNodes(new Set(localVisited));
        
        // Schedule next iteration
        timerRef.current = setTimeout(step, SPEED_DELAYS[speed - 1]);
      } 
      else if (val.type === 'path' && val.path) {
        const newPath = new Set<string>();
        val.path.forEach((node) => {
          newPath.add(`${node.col},${node.row}`);
        });
        setPathNodes(newPath);
        setIsRunning(false);
        addLog(isNoir 
          ? `Path identified: shortest path found with cost of ${val.path.length} blocks.`
          : `BOOM! Success! Route found in ${val.path.length} jumps!`
        );
      } 
      else if (val.type === 'no-path') {
        setIsRunning(false);
        addLog(isNoir 
          ? 'WARNING: Target unreachable. Barriers block all viable paths.'
          : 'WHACK! Blocked! No route exists from Start to End!'
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

  return (
    <section id="playground" className={styles.playground} aria-label="Playground">
      <div className={styles.container}>
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            {isNoir ? 'THE DETECTIVE’S DESK' : 'THE ALGORITHM LAB'}
            <span className={styles.titleAction}>
              <ActionWord
                word={isNoir ? 'CASE!' : 'POW!'}
                color={isNoir ? '#FFFFFF' : 'var(--pop-yellow)'}
                starburstColor={isNoir ? '#000000' : undefined}
                size="lg"
              />
            </span>
          </h2>
        </ScrollReveal>

        {/* M.O. Banner style for visualizer guidelines */}
        <ScrollReveal delay={80}>
          <div className={styles.moBanner}>
            <div className={styles.moBadge}>
              {isNoir ? 'INSTRUCTIONS' : 'INSTRUCTIONS'}
            </div>
            <p className={styles.moText}>
              {isNoir
                ? 'Case files are active. Drag the Detective (🕶️) and the Evidence file (📁) on the grid map. Click and hold to sketch brick wall barricades (obstacles). Select target computation methods below.'
                : 'Welcome to the lab! Drag our hero (🦸) and the portal (🌀) to set your coordinates. Click and drag on empty cells to paint laser barriers. Hit visualize and watch the search algorithm expand!'}
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={120}>
          <div className={styles.desk}>
            <div className={styles.panelLayout}>
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

              {/* Controls Console */}
              <div className={styles.controls}>
                {/* Algorithm Selector */}
                <div className={styles.controlGroup}>
                  <label className={styles.label}>
                    {isNoir ? 'Case Ledger Method' : 'Algorithm Engine'}
                  </label>
                  <select
                    className={styles.select}
                    value={algorithm}
                    onChange={(e) => setAlgorithm(e.target.value as 'dijkstra' | 'astar' | 'bfs' | 'dfs')}
                    disabled={isRunning}
                  >
                    <option value="dijkstra">
                      {isNoir ? 'Dijkstra (Complete Sweep)' : "Dijkstra's (Full Grid Wave)"}
                    </option>
                    <option value="astar">
                      {isNoir ? 'A* Search (Heuristic Scan)' : 'A* Search (Guided Manhattan)'}
                    </option>
                    <option value="bfs">
                      {isNoir ? 'BFS (Spread Search)' : 'BFS (Unweighted Wave)'}
                    </option>
                    <option value="dfs">
                      {isNoir ? 'DFS (Winding Probe)' : 'DFS (Backtracking Path)'}
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
                    onClick={visualize}
                    disabled={isRunning}
                  >
                    {isNoir ? 'Investigate' : 'Visualize!'}
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
            </div>

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
        </ScrollReveal>
      </div>
    </section>
  );
}
