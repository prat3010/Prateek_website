export interface GridNode {
  col: number;
  row: number;
}

export interface PathfindingStep {
  type: 'visit' | 'path' | 'no-path';
  col?: number;
  row?: number;
  path?: GridNode[];
}

/** Check if two nodes are equal */
export const isSameNode = (a: GridNode, b: GridNode) => a.col === b.col && a.row === b.row;

/** Convert node coordinates to a unique string key */
export const nodeToKey = (node: GridNode) => `${node.col},${node.row}`;

/** Standard 4-directional neighborhood */
const getNeighbors = (node: GridNode, cols: number, rows: number): GridNode[] => {
  const neighbors: GridNode[] = [];
  const { col, row } = node;

  if (row > 0) neighbors.push({ col, row: row - 1 }); // Up
  if (row < rows - 1) neighbors.push({ col, row: row + 1 }); // Down
  if (col > 0) neighbors.push({ col: col - 1, row }); // Left
  if (col < cols - 1) neighbors.push({ col: col + 1, row }); // Right

  return neighbors;
};

/** Manhattan distance heuristic for A* */
const getManhattanDistance = (a: GridNode, b: GridNode): number => {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
};

/**
 * Dijkstra's Pathfinding Algorithm Generator
 */
export function* runDijkstra(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const dist: Record<string, number> = {};
  const prev: Record<string, GridNode | null> = {};
  const visited = new Set<string>();
  const unvisited: GridNode[] = [];

  // Initialize
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const node = { col: c, row: r };
      const key = nodeToKey(node);
      dist[key] = Infinity;
      prev[key] = null;
      if (!walls.has(key)) {
        unvisited.push(node);
      }
    }
  }
  dist[nodeToKey(start)] = 0;

  while (unvisited.length > 0) {
    // Sort unvisited by distance to get the minimum distance node
    unvisited.sort((a, b) => dist[nodeToKey(a)] - dist[nodeToKey(b)]);
    const current = unvisited.shift()!;
    const currentKey = nodeToKey(current);

    // If the closest node is at Infinity, it's unreachable
    if (dist[currentKey] === Infinity) {
      yield { type: 'no-path' };
      return;
    }

    if (isSameNode(current, end)) {
      // Reconstruct path
      const path: GridNode[] = [];
      let temp: GridNode | null = current;
      while (temp) {
        path.unshift(temp);
        const tempKey = nodeToKey(temp);
        temp = prev[tempKey] || null;
      }
      yield { type: 'path', path };
      return;
    }

    visited.add(currentKey);

    // Don't animate the start and end nodes as visits
    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visited.has(neighborKey)) continue;

      const altDist = dist[currentKey] + 1;
      if (altDist < dist[neighborKey]) {
        dist[neighborKey] = altDist;
        prev[neighborKey] = current;
      }
    }
  }

  yield { type: 'no-path' };
}

/**
 * A* Pathfinding Algorithm Generator
 */
export function* runAStar(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const prev: Record<string, GridNode | null> = {};
  
  const openSet: GridNode[] = [start];
  const openSetKeys = new Set<string>([nodeToKey(start)]);
  const closedSetKeys = new Set<string>();

  // Initialize
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const key = `${c},${r}`;
      gScore[key] = Infinity;
      fScore[key] = Infinity;
      prev[key] = null;
    }
  }

  const startKey = nodeToKey(start);
  gScore[startKey] = 0;
  fScore[startKey] = getManhattanDistance(start, end);

  while (openSet.length > 0) {
    // Get node in openSet with lowest fScore
    openSet.sort((a, b) => fScore[nodeToKey(a)] - fScore[nodeToKey(b)]);
    const current = openSet.shift()!;
    const currentKey = nodeToKey(current);
    openSetKeys.delete(currentKey);

    if (isSameNode(current, end)) {
      // Reconstruct path
      const path: GridNode[] = [];
      let temp: GridNode | null = current;
      while (temp) {
        path.unshift(temp);
        const tempKey = nodeToKey(temp);
        temp = prev[tempKey] || null;
      }
      yield { type: 'path', path };
      return;
    }

    closedSetKeys.add(currentKey);

    // Don't animate start and end nodes as visits
    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || closedSetKeys.has(neighborKey)) continue;

      const tentativeGScore = gScore[currentKey] + 1;

      if (tentativeGScore < gScore[neighborKey]) {
        prev[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + getManhattanDistance(neighbor, end);

        if (!openSetKeys.has(neighborKey)) {
          openSet.push(neighbor);
          openSetKeys.add(neighborKey);
        }
      }
    }
  }

  yield { type: 'no-path' };
}

/**
 * Breadth-First Search (BFS) Pathfinding Generator
 */
export function* runBFS(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const queue: GridNode[] = [start];
  const visited = new Set<string>([nodeToKey(start)]);
  const prev: Record<string, GridNode | null> = {};

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (isSameNode(current, end)) {
      const path: GridNode[] = [];
      let temp: GridNode | null = current;
      while (temp) {
        path.unshift(temp);
        temp = prev[nodeToKey(temp)] || null;
      }
      yield { type: 'path', path };
      return;
    }

    if (!isSameNode(current, start)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visited.has(neighborKey)) continue;

      visited.add(neighborKey);
      prev[neighborKey] = current;
      queue.push(neighbor);
    }
  }

  yield { type: 'no-path' };
}

/**
 * Depth-First Search (DFS) Pathfinding Generator
 */
export function* runDFS(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const stack: GridNode[] = [start];
  const visited = new Set<string>([nodeToKey(start)]);
  const prev: Record<string, GridNode | null> = {};

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (isSameNode(current, end)) {
      const path: GridNode[] = [];
      let temp: GridNode | null = current;
      while (temp) {
        path.unshift(temp);
        temp = prev[nodeToKey(temp)] || null;
      }
      yield { type: 'path', path };
      return;
    }

    if (!isSameNode(current, start)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    // Push neighbors in reverse order to explore them top-to-bottom/left-to-right
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visited.has(neighborKey)) continue;

      visited.add(neighborKey);
      prev[neighborKey] = current;
      stack.push(neighbor);
    }
  }

  yield { type: 'no-path' };
}
