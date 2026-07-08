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

/**
 * Greedy Best-First Search Generator
 */
export function* runGreedyBestFirst(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const visited = new Set<string>();
  const prev: Record<string, GridNode | null> = {};
  const openSet: GridNode[] = [start];
  const openSetKeys = new Set<string>([nodeToKey(start)]);

  while (openSet.length > 0) {
    // Sort openSet by Manhattan distance to end node only (Greedy)
    openSet.sort((a, b) => getManhattanDistance(a, end) - getManhattanDistance(b, end));
    const current = openSet.shift()!;
    const currentKey = nodeToKey(current);
    openSetKeys.delete(currentKey);

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

    visited.add(currentKey);

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visited.has(neighborKey) || openSetKeys.has(neighborKey)) continue;

      prev[neighborKey] = current;
      openSet.push(neighbor);
      openSetKeys.add(neighborKey);
    }
  }

  yield { type: 'no-path' };
}

/**
 * Bidirectional Breadth-First Search (BFS) Pathfinding Generator
 */
export function* runBidirectionalBFS(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const queueForward: GridNode[] = [start];
  const queueBackward: GridNode[] = [end];

  const prevForward: Record<string, GridNode | null> = { [nodeToKey(start)]: null };
  const prevBackward: Record<string, GridNode | null> = { [nodeToKey(end)]: null };

  const visitedForward = new Set<string>([nodeToKey(start)]);
  const visitedBackward = new Set<string>([nodeToKey(end)]);

  while (queueForward.length > 0 && queueBackward.length > 0) {
    // Expand forward search front
    const currentF = queueForward.shift()!;
    const currentFKey = nodeToKey(currentF);

    if (visitedBackward.has(currentFKey)) {
      yield { type: 'path', path: mergePaths(currentFKey, prevForward, prevBackward) };
      return;
    }

    if (!isSameNode(currentF, start) && !isSameNode(currentF, end)) {
      yield { type: 'visit', col: currentF.col, row: currentF.row };
    }

    const neighborsF = getNeighbors(currentF, cols, rows);
    for (const neighbor of neighborsF) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visitedForward.has(neighborKey)) continue;

      visitedForward.add(neighborKey);
      prevForward[neighborKey] = currentF;
      queueForward.push(neighbor);

      if (visitedBackward.has(neighborKey)) {
        yield { type: 'path', path: mergePaths(neighborKey, prevForward, prevBackward) };
        return;
      }
    }

    // Expand backward search front
    const currentB = queueBackward.shift()!;
    const currentBKey = nodeToKey(currentB);

    if (visitedForward.has(currentBKey)) {
      yield { type: 'path', path: mergePaths(currentBKey, prevForward, prevBackward) };
      return;
    }

    if (!isSameNode(currentB, start) && !isSameNode(currentB, end)) {
      yield { type: 'visit', col: currentB.col, row: currentB.row };
    }

    const neighborsB = getNeighbors(currentB, cols, rows);
    for (const neighbor of neighborsB) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || visitedBackward.has(neighborKey)) continue;

      visitedBackward.add(neighborKey);
      prevBackward[neighborKey] = currentB;
      queueBackward.push(neighbor);

      if (visitedForward.has(neighborKey)) {
        yield { type: 'path', path: mergePaths(neighborKey, prevForward, prevBackward) };
        return;
      }
    }
  }

  yield { type: 'no-path' };
}

// Helper to merge paths from forward and backward searches
const mergePaths = (
  intersectionKey: string,
  prevForward: Record<string, GridNode | null>,
  prevBackward: Record<string, GridNode | null>
): GridNode[] => {
  const path: GridNode[] = [];

  // Reconstruct path backward from intersection to start
  let currentKey: string | null = intersectionKey;
  while (currentKey) {
    const node = keyToNode(currentKey);
    path.unshift(node);
    const parentNode: GridNode | null = prevForward[currentKey] || null;
    currentKey = parentNode ? nodeToKey(parentNode) : null;
  }

  // Reconstruct path forward from intersection to end
  const nextNode: GridNode | null = prevBackward[intersectionKey] || null;
  currentKey = nextNode ? nodeToKey(nextNode) : null;
  while (currentKey) {
    const node = keyToNode(currentKey);
    path.push(node);
    const parentNode: GridNode | null = prevBackward[currentKey] || null;
    currentKey = parentNode ? nodeToKey(parentNode) : null;
  }

  return path;
};

const keyToNode = (key: string): GridNode => {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
};

/**
 * 4-Directional Jump Point Search (JPS) Helper
 */
function jump(
  current: GridNode,
  parent: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): GridNode | null {
  if (current.col < 0 || current.col >= cols || current.row < 0 || current.row >= rows) return null;
  const key = nodeToKey(current);
  if (walls.has(key)) return null;
  if (isSameNode(current, end)) return current;

  const dx = current.col - parent.col;
  const dy = current.row - parent.row;

  if (dx !== 0) {
    // Horizontal movement: Check for forced neighbors above and below
    const aboveCurrent = `${current.col},${current.row - 1}`;
    const aboveParent = `${parent.col},${parent.row - 1}`;
    if (current.row > 0 && !walls.has(aboveCurrent) && walls.has(aboveParent)) {
      return current;
    }
    const belowCurrent = `${current.col},${current.row + 1}`;
    const belowParent = `${parent.col},${parent.row + 1}`;
    if (current.row < rows - 1 && !walls.has(belowCurrent) && walls.has(belowParent)) {
      return current;
    }

    // Check vertical branches recursively
    const upNode = { col: current.col, row: current.row - 1 };
    const downNode = { col: current.col, row: current.row + 1 };
    if (
      jump(upNode, current, end, cols, rows, walls) ||
      jump(downNode, current, end, cols, rows, walls)
    ) {
      return current;
    }
  } else if (dy !== 0) {
    // Vertical movement: Check for forced neighbors to the left and right
    const leftCurrent = `${current.col - 1},${current.row}`;
    const leftParent = `${parent.col - 1},${parent.row}`;
    if (current.col > 0 && !walls.has(leftCurrent) && walls.has(leftParent)) {
      return current;
    }
    const rightCurrent = `${current.col + 1},${current.row}`;
    const rightParent = `${parent.col + 1},${parent.row}`;
    if (current.col < cols - 1 && !walls.has(rightCurrent) && walls.has(rightParent)) {
      return current;
    }
  }

  // Keep jumping in the same direction
  const nextNode = { col: current.col + dx, row: current.row + dy };
  return jump(nextNode, current, end, cols, rows, walls);
}

/**
 * Jump Point Search (JPS) Algorithm Generator
 */
export function* runJPS(
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
    openSet.sort((a, b) => fScore[nodeToKey(a)] - fScore[nodeToKey(b)]);
    const current = openSet.shift()!;
    const currentKey = nodeToKey(current);
    openSetKeys.delete(currentKey);

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

    closedSetKeys.add(currentKey);

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      if (walls.has(nodeToKey(neighbor)) || closedSetKeys.has(nodeToKey(neighbor))) continue;

      const jumpPoint = jump(neighbor, current, end, cols, rows, walls);
      if (jumpPoint) {
        const jumpPointKey = nodeToKey(jumpPoint);
        if (closedSetKeys.has(jumpPointKey)) continue;

        const d = getManhattanDistance(current, jumpPoint);
        const tentativeGScore = gScore[currentKey] + d;

        if (tentativeGScore < gScore[jumpPointKey]) {
          prev[jumpPointKey] = current;
          gScore[jumpPointKey] = tentativeGScore;
          fScore[jumpPointKey] = tentativeGScore + getManhattanDistance(jumpPoint, end);

          // Animate intermediary cells between current node and jumpPoint to visualize the leap
          let animNode = neighbor;
          const dx = Math.sign(jumpPoint.col - current.col);
          const dy = Math.sign(jumpPoint.row - current.row);
          while (!isSameNode(animNode, jumpPoint)) {
            if (!isSameNode(animNode, start) && !isSameNode(animNode, end)) {
              yield { type: 'visit', col: animNode.col, row: animNode.row };
            }
            animNode = { col: animNode.col + dx, row: animNode.row + dy };
          }

          if (!openSetKeys.has(jumpPointKey)) {
            openSet.push(jumpPoint);
            openSetKeys.add(jumpPointKey);
          }
        }
      }
    }
  }

  yield { type: 'no-path' };
}

/**
 * Iterative Deepening DFS (IDDFS) Algorithm Generator
 */
export function* runIDDFS(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const maxDepth = cols * rows;
  for (let depthLimit = 1; depthLimit <= maxDepth; depthLimit++) {
    const visited = new Set<string>();
    const path: GridNode[] = [];
    const found = yield* dls(start, end, depthLimit, visited, path, cols, rows, walls, start);
    if (found) {
      yield { type: 'path', path };
      return;
    }
  }
  yield { type: 'no-path' };
}

/**
 * Depth-Limited Search Helper for IDDFS
 */
function* dls(
  current: GridNode,
  end: GridNode,
  limit: number,
  visited: Set<string>,
  path: GridNode[],
  cols: number,
  rows: number,
  walls: Set<string>,
  start: GridNode
): Generator<PathfindingStep, boolean, unknown> {
  path.push(current);
  const currentKey = nodeToKey(current);
  visited.add(currentKey);

  if (isSameNode(current, end)) {
    return true;
  }

  if (limit <= 0) {
    path.pop();
    return false;
  }

  if (!isSameNode(current, start) && !isSameNode(current, end)) {
    yield { type: 'visit', col: current.col, row: current.row };
  }

  const neighbors = getNeighbors(current, cols, rows);
  for (const neighbor of neighbors) {
    const neighborKey = nodeToKey(neighbor);
    if (walls.has(neighborKey) || visited.has(neighborKey)) continue;

    const found = yield* dls(neighbor, end, limit - 1, visited, path, cols, rows, walls, start);
    if (found) return true;
  }

  path.pop();
  return false;
}

/**
 * Random Walk (Stochastic Search) Algorithm Generator
 */
export function* runRandomWalk(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  let current = start;
  const maxSteps = 3000;
  let steps = 0;
  const prev: Record<string, GridNode | null> = {};

  while (!isSameNode(current, end) && steps < maxSteps) {
    const neighbors = getNeighbors(current, cols, rows).filter((n) => !walls.has(nodeToKey(n)));
    if (neighbors.length === 0) {
      yield { type: 'no-path' };
      return;
    }
    const nextNode = neighbors[Math.floor(Math.random() * neighbors.length)];
    const nextKey = nodeToKey(nextNode);

    prev[nextKey] = current;
    current = nextNode;
    steps++;

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }
  }

  if (isSameNode(current, end)) {
    const path: GridNode[] = [];
    let temp: GridNode | null = current;
    while (temp) {
      path.unshift(temp);
      temp = prev[nodeToKey(temp)] || null;
    }
    yield { type: 'path', path };
  } else {
    yield { type: 'no-path' };
  }
}

/**
 * Wall Follower (Left-Hand Rule) Algorithm Generator
 */
export function* runWallFollower(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  let current = start;
  let dir = 0; // 0=Up, 1=Right, 2=Down, 3=Left
  const maxSteps = 1000;
  let steps = 0;
  const prev: Record<string, GridNode | null> = {};

  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];

  while (!isSameNode(current, end) && steps < maxSteps) {
    steps++;

    const directionsToCheck = [
      (dir + 3) % 4, // Left
      dir,           // Straight
      (dir + 1) % 4, // Right
      (dir + 2) % 4  // Back
    ];

    let moved = false;
    for (const nextDir of directionsToCheck) {
      const nextNode = { col: current.col + dx[nextDir], row: current.row + dy[nextDir] };
      const nextKey = nodeToKey(nextNode);

      if (
        nextNode.col >= 0 &&
        nextNode.col < cols &&
        nextNode.row >= 0 &&
        nextNode.row < rows &&
        !walls.has(nextKey)
      ) {
        prev[nextKey] = current;
        current = nextNode;
        dir = nextDir;
        moved = true;
        break;
      }
    }

    if (!moved) {
      yield { type: 'no-path' };
      return;
    }

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }
  }

  if (isSameNode(current, end)) {
    const path: GridNode[] = [];
    let temp: GridNode | null = current;
    while (temp) {
      path.unshift(temp);
      temp = prev[nodeToKey(temp)] || null;
    }
    yield { type: 'path', path };
  } else {
    yield { type: 'no-path' };
  }
}

/**
 * Trémaux's Maze-Solving Algorithm Generator
 */
export function* runTremaux(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  const marks: Record<string, number> = {};
  const prev: Record<string, GridNode | null> = {};
  const stack: GridNode[] = [];

  let current = start;
  prev[nodeToKey(start)] = null;

  while (!isSameNode(current, end)) {
    const currentKey = nodeToKey(current);
    marks[currentKey] = (marks[currentKey] || 0) + 1;

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows).filter(
      (n) => !walls.has(nodeToKey(n))
    );

    const zeroMarkNeighbors = neighbors.filter((n) => !marks[nodeToKey(n)]);
    const oneMarkNeighbors = neighbors.filter((n) => marks[nodeToKey(n)] === 1);

    if (zeroMarkNeighbors.length > 0) {
      const nextNode = zeroMarkNeighbors[0];
      prev[nodeToKey(nextNode)] = current;
      stack.push(current);
      current = nextNode;
    } else if (oneMarkNeighbors.length > 0 && stack.length > 0) {
      const nextNode = stack.pop()!;
      marks[currentKey] = 2;
      current = nextNode;
    } else {
      yield { type: 'no-path' };
      return;
    }
  }

  const path: GridNode[] = [];
  let temp: GridNode | null = current;
  while (temp) {
    path.unshift(temp);
    temp = prev[nodeToKey(temp)] || null;
  }
  yield { type: 'path', path };
}

/**
 * Bresenham's Line Algorithm to check line of sight between two grid nodes.
 */
export const hasLineOfSight = (a: GridNode, b: GridNode, walls: Set<string>): boolean => {
  let x0 = a.col;
  let y0 = a.row;
  const x1 = b.col;
  const y1 = b.row;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    if (x0 === x1 && y0 === y1) break;

    if ((x0 !== a.col || y0 !== a.row) && walls.has(`${x0},${y0}`)) {
      return false;
    }

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
  return true;
};

/**
 * Theta* Pathfinding Algorithm Generator (Any-Angle Pathfinding)
 */
export function* runThetaStar(
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

  const getEuclideanDistance = (a: GridNode, b: GridNode): number => {
    return Math.sqrt((a.col - b.col) ** 2 + (a.row - b.row) ** 2);
  };

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
  fScore[startKey] = getEuclideanDistance(start, end);

  while (openSet.length > 0) {
    openSet.sort((a, b) => fScore[nodeToKey(a)] - fScore[nodeToKey(b)]);
    const current = openSet.shift()!;
    const currentKey = nodeToKey(current);
    openSetKeys.delete(currentKey);

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

    closedSetKeys.add(currentKey);

    if (!isSameNode(current, start) && !isSameNode(current, end)) {
      yield { type: 'visit', col: current.col, row: current.row };
    }

    const neighbors = getNeighbors(current, cols, rows);
    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || closedSetKeys.has(neighborKey)) continue;

      const parentNode = prev[currentKey] || start;
      const parentKey = nodeToKey(parentNode);

      let tentativeGScore = 0;
      let pathParent = current;

      if (hasLineOfSight(parentNode, neighbor, walls)) {
        tentativeGScore = gScore[parentKey] + getEuclideanDistance(parentNode, neighbor);
        pathParent = parentNode;
      } else {
        tentativeGScore = gScore[currentKey] + getEuclideanDistance(current, neighbor);
        pathParent = current;
      }

      if (tentativeGScore < gScore[neighborKey]) {
        prev[neighborKey] = pathParent;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + getEuclideanDistance(neighbor, end);

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
 * Iterative Deepening A* (IDA*) Pathfinding Generator
 */
export function* runIDAStar(
  start: GridNode,
  end: GridNode,
  cols: number,
  rows: number,
  walls: Set<string>
): Generator<PathfindingStep, void, unknown> {
  let threshold = getManhattanDistance(start, end);

  function* search(
    node: GridNode,
    g: number,
    threshold: number,
    pathKeys: Set<string>,
    path: GridNode[]
  ): Generator<PathfindingStep, { minExceeded: number; foundPath: GridNode[] | null }, unknown> {
    const f = g + getManhattanDistance(node, end);

    if (f > threshold) {
      return { minExceeded: f, foundPath: null };
    }
    if (isSameNode(node, end)) {
      return { minExceeded: Infinity, foundPath: [...path, node] };
    }

    if (!isSameNode(node, start) && !isSameNode(node, end)) {
      yield { type: 'visit', col: node.col, row: node.row };
    }

    let min = Infinity;
    const neighbors = getNeighbors(node, cols, rows);

    neighbors.sort((a, b) => {
      const fA = (g + 1) + getManhattanDistance(a, end);
      const fB = (g + 1) + getManhattanDistance(b, end);
      return fA - fB;
    });

    for (const neighbor of neighbors) {
      const neighborKey = nodeToKey(neighbor);
      if (walls.has(neighborKey) || pathKeys.has(neighborKey)) continue;

      pathKeys.add(neighborKey);
      path.push(neighbor);

      const result = yield* search(neighbor, g + 1, threshold, pathKeys, path);

      if (result.foundPath) {
        return result;
      }
      if (result.minExceeded < min) {
        min = result.minExceeded;
      }

      path.pop();
      pathKeys.delete(neighborKey);
    }

    return { minExceeded: min, foundPath: null };
  }

  while (threshold !== Infinity) {
    const pathKeys = new Set<string>([nodeToKey(start)]);
    const path: GridNode[] = [start];

    const result = yield* search(start, 0, threshold, pathKeys, path);

    if (result.foundPath) {
      yield { type: 'path', path: result.foundPath };
      return;
    }
    if (result.minExceeded === Infinity) {
      break;
    }
    threshold = result.minExceeded;
  }

  yield { type: 'no-path' };
}


