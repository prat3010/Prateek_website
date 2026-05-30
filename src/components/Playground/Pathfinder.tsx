'use client';

import React, { useRef, useState, useEffect } from 'react';
import { GridNode } from './pathfindingAlgorithms';
import styles from './Playground.module.css';

interface PathfinderProps {
  cols: number;
  rows: number;
  startNode: GridNode;
  setStartNode: (node: GridNode) => void;
  endNode: GridNode;
  setEndNode: (node: GridNode) => void;
  walls: Set<string>;
  setWalls: React.Dispatch<React.SetStateAction<Set<string>>>;
  visitedNodes: Set<string>;
  pathNodes: Set<string>;
  isNoir: boolean;
  isRunning: boolean;
}

type InteractionMode = 'idle' | 'drag-start' | 'drag-end' | 'draw-walls' | 'erase-walls';

export default function Pathfinder({
  cols,
  rows,
  startNode,
  setStartNode,
  endNode,
  setEndNode,
  walls,
  setWalls,
  visitedNodes,
  pathNodes,
  isNoir,
  isRunning,
}: PathfinderProps) {
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('idle');
  const gridRef = useRef<HTMLDivElement>(null);

  // Global mouse up to clear interaction mode
  useEffect(() => {
    const handleMouseUp = () => {
      setInteractionMode('idle');
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const handleCellMouseDown = (col: number, row: number, e: React.MouseEvent) => {
    if (isRunning) return;
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
        const newWalls = new Set(walls);
        newWalls.delete(key);
        setWalls(newWalls);
      } else {
        setInteractionMode('draw-walls');
        const newWalls = new Set(walls);
        newWalls.add(key);
        setWalls(newWalls);
      }
    }
  };

  const handleCellMouseEnter = (col: number, row: number) => {
    if (isRunning || interactionMode === 'idle') return;

    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;

    if (interactionMode === 'drag-start') {
      if (!isEnd && !walls.has(key)) {
        setStartNode({ col, row });
      }
    } else if (interactionMode === 'drag-end') {
      if (!isStart && !walls.has(key)) {
        setEndNode({ col, row });
      }
    } else if (interactionMode === 'draw-walls') {
      if (!isStart && !isEnd && !walls.has(key)) {
        const newWalls = new Set(walls);
        newWalls.add(key);
        setWalls(newWalls);
      }
    } else if (interactionMode === 'erase-walls') {
      if (walls.has(key)) {
        const newWalls = new Set(walls);
        newWalls.delete(key);
        setWalls(newWalls);
      }
    }
  };

  // Touch Handlers for Mobile Draw/Drag Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRunning) return;

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cellElement = element.closest(`[data-col]`);
    if (!cellElement) return;

    const col = parseInt(cellElement.getAttribute('data-col') || '', 10);
    const row = parseInt(cellElement.getAttribute('data-row') || '', 10);
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
        const newWalls = new Set(walls);
        newWalls.delete(key);
        setWalls(newWalls);
      } else {
        setInteractionMode('draw-walls');
        const newWalls = new Set(walls);
        newWalls.add(key);
        setWalls(newWalls);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRunning || interactionMode === 'idle') return;

    // Prevent scrolling while drawing on the grid
    if (e.cancelable) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return;

    const cellElement = element.closest(`[data-col]`);
    if (!cellElement) return;

    const col = parseInt(cellElement.getAttribute('data-col') || '', 10);
    const row = parseInt(cellElement.getAttribute('data-row') || '', 10);
    if (isNaN(col) || isNaN(row)) return;

    const key = `${col},${row}`;
    const isStart = col === startNode.col && row === startNode.row;
    const isEnd = col === endNode.col && row === endNode.row;

    if (interactionMode === 'drag-start') {
      if (!isEnd && !walls.has(key)) {
        setStartNode({ col, row });
      }
    } else if (interactionMode === 'drag-end') {
      if (!isStart && !walls.has(key)) {
        setEndNode({ col, row });
      }
    } else if (interactionMode === 'draw-walls') {
      if (!isStart && !isEnd && !walls.has(key)) {
        const newWalls = new Set(walls);
        newWalls.add(key);
        setWalls(newWalls);
      }
    } else if (interactionMode === 'erase-walls') {
      if (walls.has(key)) {
        const newWalls = new Set(walls);
        newWalls.delete(key);
        setWalls(newWalls);
      }
    }
  };

  const handleTouchEnd = () => {
    setInteractionMode('idle');
  };

  // Render grid cells
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

      // Start/End Icon emojis corresponding to themes
      let nodeContent = null;
      if (isStart) {
        nodeContent = (
          <span className={styles.nodeIcon} aria-label="Start Node">
            {isNoir ? '🕶️' : '🦸'}
          </span>
        );
      } else if (isEnd) {
        nodeContent = (
          <span className={styles.nodeIcon} aria-label="End Node">
            {isNoir ? '📁' : '🌀'}
          </span>
        );
      }

      cells.push(
        <div
          key={key}
          className={cellClass}
          onMouseDown={(e) => handleCellMouseDown(c, r, e)}
          onMouseEnter={() => handleCellMouseEnter(c, r)}
          data-col={c}
          data-row={r}
          role="gridcell"
          aria-label={`Cell col ${c}, row ${r}. ${
            isStart ? 'Start' : isEnd ? 'End' : isWall ? 'Wall' : isPath ? 'Path' : isVisited ? 'Visited' : 'Empty'
          }`}
        >
          {nodeContent}
        </div>
      );
    }
  }

  return (
    <div className={styles.gridWrapper} ref={gridRef}>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
        role="grid"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {cells}
      </div>
    </div>
  );
}
