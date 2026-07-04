import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKYLINE_DIR = path.join(ROOT, 'src/components/effects/skyline');
const OUTPUT_FILE = path.join(ROOT, 'src/components/effects/wobblyPaths.generated.ts');

const SOURCE_FILES = [
  'Layer1.tsx',
  'Layer1_5.tsx',
  'Layer2.tsx',
  'BridgeLayer.tsx',
  'Layer3.tsx',
  'RealtimeClock.tsx',
];

function hash(x, y) {
  let h = (x | 0) * 1597334677 ^ (y | 0) * 2860486313;
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

function noise2D(x, y) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;

  const ux = fx * fx * (3.0 - 2.0 * fx);
  const uy = fy * fy * (3.0 - 2.0 * fy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a * (1 - ux) * (1 - uy) +
         b * ux * (1 - uy) +
         c * (1 - ux) * uy +
         d * ux * uy;
}

function fbm(x, y, octaves) {
  let value = 0.0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxVal = 0.0;
  let px = x;
  let py = y;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(px * frequency, py * frequency);
    maxVal += amplitude;

    const tx = px;
    px = px * 0.8 + py * 0.6;
    py = -tx * 0.6 + py * 0.8;

    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return (value / maxVal) * 2.0 - 1.0;
}

function getDisplacement(x, y, scale, baseFreq, octaves) {
  const nx = fbm(x * baseFreq, y * baseFreq, octaves);
  const ny = fbm(x * baseFreq + 123.45, y * baseFreq + 67.89, octaves);
  return { dx: nx * scale, dy: ny * scale };
}

function wobbleLine(x1, y1, x2, y2, segmentLength, scale, baseFreq, octaves, result) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.hypot(dx, dy);

  if (distance <= segmentLength) {
    const disp = getDisplacement(x2, y2, scale, baseFreq, octaves);
    result.push(`L ${(x2 + disp.dx).toFixed(1)} ${(y2 + disp.dy).toFixed(1)}`);
    return;
  }

  const segmentsCount = Math.max(2, Math.floor(distance / segmentLength));

  for (let i = 1; i <= segmentsCount; i++) {
    const t = i / segmentsCount;
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    const disp = getDisplacement(px, py, scale, baseFreq, octaves);
    result.push(`L ${(px + disp.dx).toFixed(1)} ${(py + disp.dy).toFixed(1)}`);
  }
}

function wobblePath(d, segmentLength, wobbleStrength = 1.0, baseFreq, octaves) {
  if (!d) return '';

  let finalSegmentLength = segmentLength;
  let finalBaseFreq = baseFreq;
  let finalOctaves = octaves;

  if (finalBaseFreq === undefined) {
    if (wobbleStrength <= 0.6 || (wobbleStrength > 1.8 && wobbleStrength <= 2.5)) {
      finalBaseFreq = 0.04;
      finalOctaves = 2;
      if (finalSegmentLength === undefined || finalSegmentLength === 15) finalSegmentLength = 5;
    } else if ((wobbleStrength > 0.6 && wobbleStrength <= 1.2) || (wobbleStrength > 2.5 && wobbleStrength <= 3.5)) {
      finalBaseFreq = 0.04;
      finalOctaves = 3;
      if (finalSegmentLength === undefined || finalSegmentLength === 15) finalSegmentLength = 4;
    } else {
      finalBaseFreq = 0.03;
      finalOctaves = 3;
      if (finalSegmentLength === undefined || finalSegmentLength === 15) finalSegmentLength = 3;
    }
  }

  if (finalSegmentLength === undefined || finalSegmentLength === 15) {
    finalSegmentLength = 4;
  }

  const freqVal = finalBaseFreq !== undefined ? finalBaseFreq : 0.04;
  const octVal = finalOctaves !== undefined ? finalOctaves : 3;
  const segLenVal = finalSegmentLength;

  const commandRegex = /([a-df-z])([^a-df-z]*)/ig;
  let match;
  const result = [];
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  while ((match = commandRegex.exec(d)) !== null) {
    const cmd = match[1];
    const argsStr = match[2].trim();
    const args = argsStr ? argsStr.split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n)) : [];
    const isRelative = cmd === cmd.toLowerCase();
    const upperCmd = cmd.toUpperCase();

    if (upperCmd === 'M') {
      let targetX = args[0];
      let targetY = args[1];
      if (isRelative) {
        targetX += currentX;
        targetY += currentY;
      }
      startX = targetX;
      startY = targetY;
      const disp = getDisplacement(targetX, targetY, wobbleStrength, freqVal, octVal);
      result.push(`M ${(targetX + disp.dx).toFixed(1)} ${(targetY + disp.dy).toFixed(1)}`);
      currentX = targetX;
      currentY = targetY;

      for (let i = 2; i < args.length; i += 2) {
        let lx = args[i];
        let ly = args[i + 1];
        if (isRelative) {
          lx += currentX;
          ly += currentY;
        }
        wobbleLine(currentX, currentY, lx, ly, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentX = lx;
        currentY = ly;
      }
    } else if (upperCmd === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        let targetX = args[i];
        let targetY = args[i + 1];
        if (isRelative) {
          targetX += currentX;
          targetY += currentY;
        }
        wobbleLine(currentX, currentY, targetX, targetY, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentX = targetX;
        currentY = targetY;
      }
    } else if (upperCmd === 'H') {
      for (let i = 0; i < args.length; i++) {
        let targetX = args[i];
        if (isRelative) targetX += currentX;
        wobbleLine(currentX, currentY, targetX, currentY, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentX = targetX;
      }
    } else if (upperCmd === 'V') {
      for (let i = 0; i < args.length; i++) {
        let targetY = args[i];
        if (isRelative) targetY += currentY;
        wobbleLine(currentX, currentY, currentX, targetY, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentY = targetY;
      }
    } else if (upperCmd === 'Z') {
      wobbleLine(currentX, currentY, startX, startY, segLenVal, wobbleStrength, freqVal, octVal, result);
      result.push('Z');
      currentX = startX;
      currentY = startY;
    } else if (args.length >= 2) {
      let endX = args[args.length - 2];
      let endY = args[args.length - 1];
      if (isRelative) {
        endX += currentX;
        endY += currentY;
      }

      if (upperCmd === 'C') {
        for (let i = 0; i < args.length; i += 6) {
          if (i + 5 >= args.length) continue;
          let cx1 = args[i], cy1 = args[i + 1];
          let cx2 = args[i + 2], cy2 = args[i + 3];
          let tx = args[i + 4], ty = args[i + 5];
          if (isRelative) {
            cx1 += currentX; cy1 += currentY;
            cx2 += currentX; cy2 += currentY;
            tx += currentX; ty += currentY;
          }
          const steps = 12;
          let prevX = currentX;
          let prevY = currentY;
          for (let step = 1; step <= steps; step++) {
            const t = step / steps;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const mt3 = mt2 * mt;
            const t2 = t * t;
            const t3 = t2 * t;
            const px = mt3 * currentX + 3 * mt2 * t * cx1 + 3 * mt * t2 * cx2 + t3 * tx;
            const py = mt3 * currentY + 3 * mt2 * t * cy1 + 3 * mt * t2 * cy2 + t3 * ty;
            wobbleLine(prevX, prevY, px, py, segLenVal, wobbleStrength, freqVal, octVal, result);
            prevX = px;
            prevY = py;
          }
          currentX = tx;
          currentY = ty;
        }
      } else if (upperCmd === 'Q') {
        for (let i = 0; i < args.length; i += 4) {
          if (i + 3 >= args.length) continue;
          let cx = args[i], cy = args[i + 1];
          let tx = args[i + 2], ty = args[i + 3];
          if (isRelative) {
            cx += currentX; cy += currentY;
            tx += currentX; ty += currentY;
          }
          const steps = 10;
          let prevX = currentX;
          let prevY = currentY;
          for (let step = 1; step <= steps; step++) {
            const t = step / steps;
            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;
            const px = mt2 * currentX + 2 * mt * t * cx + t2 * tx;
            const py = mt2 * currentY + 2 * mt * t * cy + t2 * ty;
            wobbleLine(prevX, prevY, px, py, segLenVal, wobbleStrength, freqVal, octVal, result);
            prevX = px;
            prevY = py;
          }
          currentX = tx;
          currentY = ty;
        }
      } else {
        const modifiedArgs = [...args];
        if (upperCmd === 'S') {
          for (let i = 0; i < args.length; i += 4) {
            if (i + 3 >= args.length) continue;
            let cx2 = args[i], cy2 = args[i + 1];
            let tx = args[i + 2], ty = args[i + 3];
            if (isRelative) {
              cx2 += currentX; cy2 += currentY;
              tx += currentX; ty += currentY;
            }
            const d2 = getDisplacement(cx2, cy2, wobbleStrength, freqVal, octVal);
            const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);
            modifiedArgs[i] = Number((cx2 + d2.dx).toFixed(1));
            modifiedArgs[i + 1] = Number((cy2 + d2.dy).toFixed(1));
            modifiedArgs[i + 2] = Number((tx + dt.dx).toFixed(1));
            modifiedArgs[i + 3] = Number((ty + dt.dy).toFixed(1));
          }
        } else if (upperCmd === 'T') {
          for (let i = 0; i < args.length; i += 2) {
            if (i + 1 >= args.length) continue;
            let tx = args[i], ty = args[i + 1];
            if (isRelative) {
              tx += currentX; ty += currentY;
            }
            const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);
            modifiedArgs[i] = Number((tx + dt.dx).toFixed(1));
            modifiedArgs[i + 1] = Number((ty + dt.dy).toFixed(1));
          }
        } else if (upperCmd === 'A') {
          for (let i = 0; i < args.length; i += 7) {
            if (i + 6 >= args.length) continue;
            let tx = args[i + 5], ty = args[i + 6];
            if (isRelative) {
              tx += currentX; ty += currentY;
            }
            const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);
            modifiedArgs[i + 5] = Number((tx + dt.dx).toFixed(1));
            modifiedArgs[i + 6] = Number((ty + dt.dy).toFixed(1));
          }
        } else {
          const dt = getDisplacement(endX, endY, wobbleStrength, freqVal, octVal);
          modifiedArgs[args.length - 2] = Number((endX + dt.dx).toFixed(1));
          modifiedArgs[args.length - 1] = Number((endY + dt.dy).toFixed(1));
        }
        result.push(`${upperCmd} ${modifiedArgs.join(' ')}`);
        currentX = endX;
        currentY = endY;
      }
    } else {
      result.push(cmd + (args.length ? ' ' + args.join(' ') : ''));
    }
  }

  return result.join(' ');
}

function normalizeOptionalNumber(value) {
  return value === undefined ? '' : String(Number(value));
}

function makePathKey(d, wobbleStrength, segmentLength, baseFreq, octaves) {
  return [
    d,
    String(Number(wobbleStrength)),
    normalizeOptionalNumber(segmentLength),
    normalizeOptionalNumber(baseFreq),
    normalizeOptionalNumber(octaves),
  ].join('|');
}

function addPath(cache, d, wobbleStrength, segmentLength, baseFreq, octaves) {
  if (!d || d.includes('${') || d.includes('`')) return;
  const key = makePathKey(d, wobbleStrength, segmentLength, baseFreq, octaves);
  cache.set(key, wobblePath(d, segmentLength, wobbleStrength, baseFreq, octaves));
}

function attrValue(attrs, name) {
  const quoted = attrs.match(new RegExp(`${name}="([^"]*)"`, 'm'));
  if (quoted) return quoted[1];
  const braced = attrs.match(new RegExp(`${name}=\\{([^}]*)\\}`, 'm'));
  if (braced) return braced[1].trim();
  return undefined;
}

function resolveNumeric(value, defaultValue, strength) {
  if (value === undefined) return defaultValue;
  if (value === 'strength') return strength;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
}

function buildD(type, attrs) {
  if (type === 'Path') {
    return attrValue(attrs, 'd');
  }
  if (type === 'Line') {
    const x1 = Number(attrValue(attrs, 'x1'));
    const y1 = Number(attrValue(attrs, 'y1'));
    const x2 = Number(attrValue(attrs, 'x2'));
    const y2 = Number(attrValue(attrs, 'y2'));
    if (![x1, y1, x2, y2].every(Number.isFinite)) return undefined;
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }
  if (type === 'Rect') {
    const x = Number(attrValue(attrs, 'x'));
    const y = Number(attrValue(attrs, 'y'));
    const width = Number(attrValue(attrs, 'width'));
    const height = Number(attrValue(attrs, 'height'));
    if (![x, y, width, height].every(Number.isFinite)) return undefined;
    return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`;
  }
  if (type === 'Polygon') {
    const points = attrValue(attrs, 'points');
    if (!points) return undefined;
    const pts = points.trim().split(/[\s,]+/).map(Number).filter((n) => !Number.isNaN(n));
    if (pts.length < 4) return undefined;
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) {
      d += ` L ${pts[i]} ${pts[i + 1]}`;
    }
    return `${d} Z`;
  }
  return undefined;
}

function getFileStrength(source, filename) {
  const match = source.match(/const strength = ([0-9.]+)/);
  if (match) return Number(match[1]);
  if (filename === 'RealtimeClock.tsx') return 3;
  return 1;
}

function collectStaticPaths(cache) {
  let count = 0;
  for (const filename of SOURCE_FILES) {
    const filePath = path.join(SKYLINE_DIR, filename);
    const source = fs.readFileSync(filePath, 'utf8');
    const strength = getFileStrength(source, filename);
    const tagRegex = /<Wobbly(Path|Line|Rect|Polygon)\b([\s\S]*?)(?:\/>|>)/g;
    let match;
    while ((match = tagRegex.exec(source)) !== null) {
      const [, type, attrs] = match;
      const d = buildD(type, attrs);
      if (!d) continue;
      const wobbleStrength = resolveNumeric(attrValue(attrs, 'wobbleStrength'), 1, strength);
      const segmentLength = resolveNumeric(attrValue(attrs, 'segmentLength'), undefined, strength);
      const baseFreq = resolveNumeric(attrValue(attrs, 'baseFreq'), undefined, strength);
      const octaves = resolveNumeric(attrValue(attrs, 'octaves'), undefined, strength);
      if (wobbleStrength === undefined) continue;
      addPath(cache, d, wobbleStrength, segmentLength, baseFreq, octaves);
      count += 1;
    }
  }
  return count;
}

function getCableY(x) {
  if (x < 880) {
    const t = (-7 + Math.sqrt(49 + (880 - x) / 15)) / 2;
    return (1 - t) * (1 - t) * 730 + 2 * (1 - t) * t * 820 + t * t * 860;
  }
  const t = (-9 + Math.sqrt(81 + (x - 880) / 15)) / 2;
  return (1 - t) * (1 - t) * 730 + 2 * (1 - t) * t * 820 + t * t * 860;
}

function getDeckY(x) {
  const u = (-8 + Math.sqrt(64 + (x - 400) / 30)) / 2;
  return (1 - u) * (1 - u) * 854 + 2 * (1 - u) * u * 820 + u * u * 854;
}

function collectBridgeComputedPaths(cache) {
  let count = 0;
  const strength = 3.5;

  for (let x = 415; x <= 835; x += 15) {
    addPath(cache, `M ${x} ${getCableY(x)} L ${x} ${getDeckY(x)}`, strength);
    count += 1;
  }

  for (let x = 925; x <= 1465; x += 15) {
    addPath(cache, `M ${x} ${getCableY(x)} L ${x} ${getDeckY(x)}`, strength);
    count += 1;
  }

  for (let x = 405; x <= 1475; x += 15) {
    if (x >= 845 && x <= 915) continue;
    const y = getDeckY(x);
    addPath(cache, `M ${x} ${y} L ${x} ${y - 4.5}`, strength);
    count += 1;
  }

  const streetlights = [
    { cx: 546, cy: 830.3 },
    { cx: 646, cy: 825.7 },
    { cx: 746, cy: 822.7 },
    { cx: 846, cy: 821.2 },
    { cx: 954, cy: 821.1 },
    { cx: 1054, cy: 822.2 },
    { cx: 1154, cy: 824.5 },
    { cx: 1254, cy: 827.9 },
    { cx: 1354, cy: 832.3 },
  ];

  for (const light of streetlights) {
    const roadY = getDeckY(light.cx);
    addPath(cache, `M ${light.cx} ${light.cy} L ${light.cx - 9} ${roadY} L ${light.cx + 9} ${roadY} Z`, 1.5);
    count += 1;
  }

  return count;
}

function collectLayer2ComputedPaths(cache) {
  let count = 0;
  const strength = 3;

  for (let i = 0; i < 160; i++) {
    const x = -1000 + i * 25;
    if (x <= -1000 || x >= 2920) continue;
    addPath(cache, `M ${x} 938 L ${x} 950`, strength);
    count += 1;
  }

  for (const x of [485, 755, 985, 1225]) {
    addPath(cache, `M ${x} 938 L ${x} 918`, strength);
    addPath(cache, `M ${x} 918 Q ${x} 914 ${x + 3} 914`, strength);
    count += 2;
  }

  for (const x of [510, 590, 710, 790, 955, 1035, 1115, 1195, 1320]) {
    addPath(cache, `M ${x - 2} 934 L ${x + 2} 934`, strength);
    addPath(cache, `M ${x} 934 L ${x} 938`, strength);
    count += 2;
  }

  return count;
}

function writeGeneratedFile(cache, staticCount, computedCount) {
  const entries = [...cache.entries()].sort(([a], [b]) => a.localeCompare(b));
  const body = entries
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`)
    .join('\n');

  const output = `// Generated by scripts/generate-wobbly-paths.js. Do not edit by hand.\n` +
    `// Source elements scanned: ${staticCount}; computed bridge elements: ${computedCount}; unique paths: ${entries.length}.\n` +
    `\n` +
    `export const WOBBLY_PATH_CACHE: Record<string, string> = {\n${body}\n};\n`;

  fs.writeFileSync(OUTPUT_FILE, output);
  return entries.length;
}

const cache = new Map();
const staticCount = collectStaticPaths(cache);
const computedCount = collectBridgeComputedPaths(cache);
const layer2ComputedCount = collectLayer2ComputedPaths(cache);
const uniqueCount = writeGeneratedFile(cache, staticCount, computedCount + layer2ComputedCount);

console.log(`Generated ${uniqueCount} unique wobbly paths at ${path.relative(ROOT, OUTPUT_FILE)}.`);
