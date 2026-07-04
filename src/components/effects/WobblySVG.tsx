import React, { useMemo } from 'react';
import { WOBBLY_PATH_CACHE } from './wobblyPaths.generated';

interface WobblyProps {
  wobble?: boolean;
  wobbleStrength?: number;
  segmentLength?: number;
  baseFreq?: number;
  octaves?: number;
}

function normalizeOptionalNumber(value: number | undefined): string {
  return value === undefined ? '' : String(Number(value));
}

function makePathKey(
  d: string,
  wobbleStrength: number,
  segmentLength?: number,
  baseFreq?: number,
  octaves?: number
): string {
  return [
    d,
    String(Number(wobbleStrength)),
    normalizeOptionalNumber(segmentLength),
    normalizeOptionalNumber(baseFreq),
    normalizeOptionalNumber(octaves),
  ].join('|');
}

function getPrebakedPath(
  d: string,
  wobbleStrength: number,
  segmentLength?: number,
  baseFreq?: number,
  octaves?: number
): string | undefined {
  return WOBBLY_PATH_CACHE[makePathKey(d, wobbleStrength, segmentLength, baseFreq, octaves)];
}

export interface WobblyPathProps extends React.SVGProps<SVGPathElement>, WobblyProps {}
export interface WobblyLineProps extends React.SVGProps<SVGLineElement>, WobblyProps {}
export interface WobblyRectProps extends React.SVGProps<SVGPathElement>, WobblyProps {
  x: string | number;
  y: string | number;
  width: string | number;
  height: string | number;
}
export interface WobblyPolygonProps extends React.SVGProps<SVGPathElement>, WobblyProps {
  points: string;
}
export interface WobblyLineSegment {
  x1: string | number;
  y1: string | number;
  x2: string | number;
  y2: string | number;
}
export interface WobblyLineGroupProps extends React.SVGProps<SVGPathElement>, WobblyProps {
  lines: WobblyLineSegment[];
}
export interface WobblyPathGroupProps extends React.SVGProps<SVGPathElement>, WobblyProps {
  paths: string[];
}

// Deterministic integer hash function returning [0, 1)
function hash(x: number, y: number): number {
  let h = (x | 0) * 1597334677 ^ (y | 0) * 2860486313;
  h = Math.imul(h ^ (h >>> 15), h | 1);
  h ^= h + Math.imul(h ^ (h >>> 7), h | 61);
  return ((h ^ (h >>> 14)) >>> 0) / 4294967296;
}

// 2D Value Noise with bilinear Hermite interpolation
function noise2D(x: number, y: number): number {
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

// Fractal Brownian Motion (FBM) with rotated coordinate space
function fbm(x: number, y: number, octaves: number): number {
  let value = 0.0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxVal = 0.0;

  let px = x;
  let py = y;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * noise2D(px * frequency, py * frequency);
    maxVal += amplitude;

    // Rotate and shift coordinates to eliminate grid-alignment artifacts
    const tx = px;
    px = px * 0.8 + py * 0.6;
    py = -tx * 0.6 + py * 0.8;

    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return (value / maxVal) * 2.0 - 1.0; // Scale to [-1, 1]
}

// Deterministic displacement based on 2D FBM noise fields
export function getDisplacement(
  x: number,
  y: number,
  scale: number,
  baseFreq: number,
  octaves: number
): { dx: number; dy: number } {
  const nx = fbm(x * baseFreq, y * baseFreq, octaves);
  const ny = fbm(x * baseFreq + 123.45, y * baseFreq + 67.89, octaves);
  return {
    dx: nx * scale,
    dy: ny * scale,
  };
}

function wobbleLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segmentLength: number,
  scale: number,
  baseFreq: number,
  octaves: number,
  result: string[]
) {
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

export function wobblePath(
  d: string,
  segmentLength?: number,
  wobbleStrength = 1.0,
  baseFreq?: number,
  octaves?: number
): string {
  if (!d) return '';

  // Auto-detect parameters based on wobbleStrength if they are not provided
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

  // Fallback values for type safety
  const freqVal: number = finalBaseFreq !== undefined ? finalBaseFreq : 0.04;
  const octVal: number = finalOctaves !== undefined ? finalOctaves : 3;
  const segLenVal: number = finalSegmentLength;

  const commandRegex = /([a-df-z])([^a-df-z]*)/ig;
  let match;
  const result: string[] = [];

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  while ((match = commandRegex.exec(d)) !== null) {
    const cmd = match[1];
    const argsStr = match[2].trim();
    const args = argsStr ? argsStr.split(/[\s,]+/).map(Number).filter(n => !isNaN(n)) : [];

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
        if (isRelative) {
          targetX += currentX;
        }
        wobbleLine(currentX, currentY, targetX, currentY, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentX = targetX;
      }
    } else if (upperCmd === 'V') {
      for (let i = 0; i < args.length; i++) {
        let targetY = args[i];
        if (isRelative) {
          targetY += currentY;
        }
        wobbleLine(currentX, currentY, currentX, targetY, segLenVal, wobbleStrength, freqVal, octVal, result);
        currentY = targetY;
      }
    } else if (upperCmd === 'Z') {
      wobbleLine(currentX, currentY, startX, startY, segLenVal, wobbleStrength, freqVal, octVal, result);
      result.push('Z');
      currentX = startX;
      currentY = startY;
    } else {
      if (args.length >= 2) {
        let endX = args[args.length - 2];
        let endY = args[args.length - 1];

        if (isRelative) {
          endX += currentX;
          endY += currentY;
        }

        if (upperCmd === 'C') {
          for (let i = 0; i < args.length; i += 6) {
            if (i + 5 < args.length) {
              let cx1 = args[i], cy1 = args[i+1];
              let cx2 = args[i+2], cy2 = args[i+3];
              let tx = args[i+4], ty = args[i+5];
              if (isRelative) {
                cx1 += currentX; cy1 += currentY;
                cx2 += currentX; cy2 += currentY;
                tx += currentX; ty += currentY;
              }
              
              // Approximate cubic bezier curve with 12 segments
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
          }
        } else if (upperCmd === 'Q') {
          for (let i = 0; i < args.length; i += 4) {
            if (i + 3 < args.length) {
              let cx = args[i], cy = args[i+1];
              let tx = args[i+2], ty = args[i+3];
              if (isRelative) {
                cx += currentX; cy += currentY;
                tx += currentX; ty += currentY;
              }
              
              // Approximate quadratic bezier curve with 10 segments
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
          }
        } else {
          // Keep original control-point shifting logic for S, T, A as fallback
          const modifiedArgs = [...args];
          if (upperCmd === 'S') {
            for (let i = 0; i < args.length; i += 4) {
              if (i + 3 < args.length) {
                let cx2 = args[i], cy2 = args[i+1];
                let tx = args[i+2], ty = args[i+3];
                if (isRelative) {
                  cx2 += currentX; cy2 += currentY;
                  tx += currentX; ty += currentY;
                }
                const d2 = getDisplacement(cx2, cy2, wobbleStrength, freqVal, octVal);
                const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);

                modifiedArgs[i] = Number((cx2 + d2.dx).toFixed(1));
                modifiedArgs[i+1] = Number((cy2 + d2.dy).toFixed(1));
                modifiedArgs[i+2] = Number((tx + dt.dx).toFixed(1));
                modifiedArgs[i+3] = Number((ty + dt.dy).toFixed(1));
              }
            }
          } else if (upperCmd === 'T') {
            for (let i = 0; i < args.length; i += 2) {
              if (i + 1 < args.length) {
                let tx = args[i], ty = args[i+1];
                if (isRelative) {
                  tx += currentX; ty += currentY;
                }
                const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);
                modifiedArgs[i] = Number((tx + dt.dx).toFixed(1));
                modifiedArgs[i+1] = Number((ty + dt.dy).toFixed(1));
              }
            }
          } else if (upperCmd === 'A') {
            for (let i = 0; i < args.length; i += 7) {
              if (i + 6 < args.length) {
                let tx = args[i+5], ty = args[i+6];
                if (isRelative) {
                  tx += currentX; ty += currentY;
                }
                const dt = getDisplacement(tx, ty, wobbleStrength, freqVal, octVal);
                modifiedArgs[i+5] = Number((tx + dt.dx).toFixed(1));
                modifiedArgs[i+6] = Number((ty + dt.dy).toFixed(1));
              }
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
  }

  return result.join(' ');
}

function getWobbledPath(
  d: string,
  segmentLength: number | undefined,
  wobbleStrength: number,
  baseFreq: number | undefined,
  octaves: number | undefined
): string {
  return getPrebakedPath(d, wobbleStrength, segmentLength, baseFreq, octaves) ??
    wobblePath(d, segmentLength, wobbleStrength, baseFreq, octaves);
}

function getGroupedWobbledPath(
  paths: string[],
  wobble: boolean,
  segmentLength: number | undefined,
  wobbleStrength: number,
  baseFreq: number | undefined,
  octaves: number | undefined
): string {
  return paths
    .map((d) => {
      if (!wobble) return d;
      return getWobbledPath(d, segmentLength, wobbleStrength, baseFreq, octaves);
    })
    .join(' ');
}

export const WobblyPath = React.memo(function WobblyPath({
  d,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyPathProps) {
  const wobbledD = useMemo(() => {
    if (!wobble || !d) return d;
    return getWobbledPath(d, segmentLength, wobbleStrength, baseFreq, octaves);
  }, [d, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  return <path d={wobbledD} {...props} />;
});

export const WobblyLine = React.memo(function WobblyLine({
  x1,
  y1,
  x2,
  y2,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyLineProps) {
  const wobbledD = useMemo(() => {
    const nx1 = Number(x1);
    const ny1 = Number(y1);
    const nx2 = Number(x2);
    const ny2 = Number(y2);
    const d = `M ${nx1} ${ny1} L ${nx2} ${ny2}`;
    if (!wobble) return d;
    return getWobbledPath(d, segmentLength, wobbleStrength, baseFreq, octaves);
  }, [x1, y1, x2, y2, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  if (!wobble) {
    return <line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <path d={wobbledD} {...(props as any)} />;
});

export const WobblyLineGroup = React.memo(function WobblyLineGroup({
  lines,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyLineGroupProps) {
  const groupedD = useMemo(() => {
    const paths = lines.map(({ x1, y1, x2, y2 }) => (
      `M ${Number(x1)} ${Number(y1)} L ${Number(x2)} ${Number(y2)}`
    ));
    return getGroupedWobbledPath(paths, wobble, segmentLength, wobbleStrength, baseFreq, octaves);
  }, [lines, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  return <path d={groupedD} {...props} />;
});

export const WobblyPathGroup = React.memo(function WobblyPathGroup({
  paths,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyPathGroupProps) {
  const groupedD = useMemo(() => (
    getGroupedWobbledPath(paths, wobble, segmentLength, wobbleStrength, baseFreq, octaves)
  ), [paths, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  return <path d={groupedD} {...props} />;
});

export const WobblyRect = React.memo(function WobblyRect({
  x,
  y,
  width,
  height,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyRectProps) {
  const wobbledD = useMemo(() => {
    const nx = Number(x);
    const ny = Number(y);
    const nw = Number(width);
    const nh = Number(height);
    const d = `M ${nx} ${ny} L ${nx + nw} ${ny} L ${nx + nw} ${ny + nh} L ${nx} ${ny + nh} Z`;
    if (!wobble) return d;
    return getWobbledPath(d, segmentLength, wobbleStrength, baseFreq, octaves);
  }, [x, y, width, height, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  if (!wobble) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <rect x={x} y={y} width={width} height={height} {...(props as any)} />;
  }
  return <path d={wobbledD} {...props} />;
});

export const WobblyPolygon = React.memo(function WobblyPolygon({
  points,
  wobble = true,
  wobbleStrength = 1.0,
  segmentLength,
  baseFreq,
  octaves,
  ...props
}: WobblyPolygonProps) {
  const wobbledD = useMemo(() => {
    if (!points) return '';
    const pts = points.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
    if (pts.length < 4) return '';
    let d = `M ${pts[0]} ${pts[1]}`;
    for (let i = 2; i < pts.length; i += 2) {
      d += ` L ${pts[i]} ${pts[i + 1]}`;
    }
    d += ' Z';
    if (!wobble) return d;
    return getWobbledPath(d, segmentLength, wobbleStrength, baseFreq, octaves);
  }, [points, wobble, wobbleStrength, segmentLength, baseFreq, octaves]);

  if (!wobble) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return <polygon points={points} {...(props as any)} />;
  }
  return <path d={wobbledD} {...props} />;
});
