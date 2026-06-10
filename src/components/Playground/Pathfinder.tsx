'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GridNode } from './pathfindingAlgorithms';
import styles from './Playground.module.css';

interface CellProps {
  col: number;
  row: number;
  isStart: boolean;
  isEnd: boolean;
  isWall: boolean;
  isVisited: boolean;
  isPath: boolean;
  isNoir: boolean;
}

const Cell = React.memo(function Cell({
  col,
  row,
  isStart,
  isEnd,
  isWall,
  isVisited,
  isPath,
  isNoir,
}: CellProps) {
  let cellClass = styles.cell;
  if (isStart) cellClass += ` ${styles.cellStart}`;
  else if (isEnd) cellClass += ` ${styles.cellEnd}`;
  else if (isWall) cellClass += ` ${styles.cellWall}`;
  else if (isPath) cellClass += ` ${styles.cellPath}`;
  else if (isVisited) cellClass += ` ${styles.cellVisited}`;

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

  return (
    <div
      className={cellClass}
      data-col={col}
      data-row={row}
      role="gridcell"
      aria-label={`Cell col ${col}, row ${row}. ${
        isStart ? 'Start' : isEnd ? 'End' : isWall ? 'Wall' : isPath ? 'Path' : isVisited ? 'Visited' : 'Empty'
      }`}
    >
      {nodeContent}
    </div>
  );
});

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

  const handleGridMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isRunning) return;
    const target = e.target as HTMLElement;
    const cellElement = target.closest('[data-col]');
    if (!cellElement) return;

    const col = parseInt(cellElement.getAttribute('data-col') || '', 10);
    const row = parseInt(cellElement.getAttribute('data-row') || '', 10);
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
        setWalls((prev) => {
          const newWalls = new Set(prev);
          newWalls.delete(key);
          return newWalls;
        });
      } else {
        setInteractionMode('draw-walls');
        setWalls((prev) => {
          const newWalls = new Set(prev);
          newWalls.add(key);
          return newWalls;
        });
      }
    }
  }, [isRunning, startNode.col, startNode.row, endNode.col, endNode.row, walls, setWalls]);

  const handleGridMouseOver = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isRunning || interactionMode === 'idle') return;
    const target = e.target as HTMLElement;
    const cellElement = target.closest('[data-col]');
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
        setWalls((prev) => {
          const newWalls = new Set(prev);
          newWalls.add(key);
          return newWalls;
        });
      }
    } else if (interactionMode === 'erase-walls') {
      if (walls.has(key)) {
        setWalls((prev) => {
          const newWalls = new Set(prev);
          newWalls.delete(key);
          return newWalls;
        });
      }
    }
  }, [isRunning, interactionMode, startNode.col, startNode.row, endNode.col, endNode.row, walls, setStartNode, setEndNode, setWalls]);

  const gridInnerRef = useRef<HTMLDivElement>(null);

  // Touch Handlers for Mobile Draw/Drag Support with non-passive options
  useEffect(() => {
    const gridEl = gridInnerRef.current;
    if (!gridEl) return;

    const onTouchStart = (e: TouchEvent) => {
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
          setWalls((prev) => {
            const newWalls = new Set(prev);
            newWalls.delete(key);
            return newWalls;
          });
        } else {
          setInteractionMode('draw-walls');
          setWalls((prev) => {
            const newWalls = new Set(prev);
            newWalls.add(key);
            return newWalls;
          });
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
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
          setWalls((prev) => {
            const newWalls = new Set(prev);
            newWalls.add(key);
            return newWalls;
          });
        }
      } else if (interactionMode === 'erase-walls') {
        if (walls.has(key)) {
          setWalls((prev) => {
            const newWalls = new Set(prev);
            newWalls.delete(key);
            return newWalls;
          });
        }
      }
    };

    const onTouchEnd = () => {
      setInteractionMode('idle');
    };

    gridEl.addEventListener('touchstart', onTouchStart, { passive: false });
    gridEl.addEventListener('touchmove', onTouchMove, { passive: false });
    gridEl.addEventListener('touchend', onTouchEnd);

    return () => {
      gridEl.removeEventListener('touchstart', onTouchStart);
      gridEl.removeEventListener('touchmove', onTouchMove);
      gridEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [isRunning, interactionMode, startNode, endNode, walls, setStartNode, setEndNode, setWalls]);

  // Render grid cells grouped by rows
  const gridRows: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    const rowCells: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      const key = `${c},${r}`;
      const isStart = c === startNode.col && r === startNode.row;
      const isEnd = c === endNode.col && r === endNode.row;
      const isWall = walls.has(key);
      const isVisited = visitedNodes.has(key);
      const isPath = pathNodes.has(key);

      rowCells.push(
        <Cell
          key={key}
          col={c}
          row={r}
          isStart={isStart}
          isEnd={isEnd}
          isWall={isWall}
          isVisited={isVisited}
          isPath={isPath}
          isNoir={isNoir}
        />
      );
    }
    gridRows.push(
      <div key={`row-${r}`} role="row" style={{ display: 'contents' }}>
        {rowCells}
      </div>
    );
  }

  return (
    <div className={styles.gridWrapper} ref={gridRef}>
      <div
        ref={gridInnerRef}
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
        }}
        role="grid"
        onMouseDown={handleGridMouseDown}
        onMouseOver={handleGridMouseOver}
      >
        {gridRows}
      </div>
    </div>
  );
}
