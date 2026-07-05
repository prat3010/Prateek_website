'use client';

import React, { useEffect, useRef } from 'react';
import type { Group, WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, MeshStandardMaterial } from 'three';
import { useTheme } from '@/context/ThemeContext';

interface GremlinPhysics {
  group: Group;
  bodyMesh: Mesh;
  antennaBulb: Mesh;
  radius: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  targetRotY: number;
  bouncePhase: number;
  bounceSpeedMultiplier: number;
}

export default function ThreeGremlinParade() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isNoir } = useTheme();
  const isNoirRef = useRef(isNoir);

  // Sync theme ref
  useEffect(() => {
    isNoirRef.current = isNoir;
  }, [isNoir]);

  useEffect(() => {
    if (!containerRef.current) return;

    let active = true;
    let isTabVisible = true;
    let animationFrameId: number;
    let renderer: WebGLRenderer;
    let scene: Scene;
    let camera: PerspectiveCamera;
    const gremlins: GremlinPhysics[] = [];
    const disposables: { dispose?: () => void }[] = []; // To track meshes/geometries/materials for cleanup

    const handleResize = () => {
      if (!camera || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let tiltX = 0;

    const handleMouseMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      tiltX = ((event.clientX - centerX) / centerX) * 2.0;
    };

    const handleMouseLeave = () => {
      tiltX = 0;
    };

    const init = async () => {
      // Dynamic import of Three.js so it isn't bundled on initial site load
      const THREE = await import('three');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js') as { RoundedBoxGeometry: new (w: number, h: number, d: number, s: number, r: number) => BufferGeometry };
      if (!active) return;

      const container = containerRef.current!;
      const width = window.innerWidth;
      const height = window.innerHeight;



      // 1. Create Scene
      scene = new THREE.Scene();

      // 2. Create Camera (Perspective for 3D depth)
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 18;

      // 3. Create WebGL Renderer with Alpha transparent background
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      // 4. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      const pointLight = new THREE.PointLight(0xffffff, 0.5, 30);
      pointLight.position.set(-5, -5, 5);
      scene.add(pointLight);

      const createProceduralTextures = (type: 'body' | 'ear', noir: boolean) => {
        const width = 512;
        const height = 512;

        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = width;
        colorCanvas.height = height;
        const colorCtx = colorCanvas.getContext('2d')!;

        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = width;
        bumpCanvas.height = height;
        const bumpCtx = bumpCanvas.getContext('2d')!;

        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = width;
        roughnessCanvas.height = height;
        const roughnessCtx = roughnessCanvas.getContext('2d')!;

        const metalnessCanvas = document.createElement('canvas');
        metalnessCanvas.width = width;
        metalnessCanvas.height = height;
        const metalnessCtx = metalnessCanvas.getContext('2d')!;

        const emissiveCanvas = document.createElement('canvas');
        emissiveCanvas.width = width;
        emissiveCanvas.height = height;
        const emissiveCtx = emissiveCanvas.getContext('2d')!;

        // Fill backgrounds
        emissiveCtx.fillStyle = '#000000';
        emissiveCtx.fillRect(0, 0, width, height);

        metalnessCtx.fillStyle = '#000000';
        metalnessCtx.fillRect(0, 0, width, height);

        if (noir) {
          // --- NOIR HIGH-END CYBERPUNK NANO-EXOSKELETON ---
          const bg = type === 'body' ? '#0d0d10' : '#121217';
          colorCtx.fillStyle = bg;
          colorCtx.fillRect(0, 0, width, height);

          // Base roughness: PCB board is matte
          roughnessCtx.fillStyle = '#9e9e9e'; // 0.62 roughness
          roughnessCtx.fillRect(0, 0, width, height);

          // Base bump: flat grey (neutral displacement)
          bumpCtx.fillStyle = '#808080';
          bumpCtx.fillRect(0, 0, width, height);

          // 1. Draw Hexagonal Carbon Fiber Weave Pattern
          const drawHex = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const angle = (k * Math.PI) / 3;
              ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.stroke();
          };

          colorCtx.strokeStyle = 'rgba(25, 25, 30, 0.4)';
          colorCtx.lineWidth = 1.0;
          
          bumpCtx.strokeStyle = '#858585';
          bumpCtx.lineWidth = 0.5;

          const hexSize = 14;
          const hSpacing = hexSize * 1.5;
          const vSpacing = hexSize * Math.sqrt(3);

          for (let y = -vSpacing; y < height + vSpacing; y += vSpacing) {
            for (let x = -hSpacing; x < width + hSpacing; x += hSpacing) {
              const yOffset = (Math.floor(x / hSpacing) % 2 === 0) ? vSpacing / 2 : 0;
              drawHex(colorCtx, x, y + yOffset, hexSize * 0.95);
              drawHex(bumpCtx, x, y + yOffset, hexSize * 0.95);
            }
          }

          // 2. High-Tech Stencil Decals
          if (type === 'body') {
            // A. Yellow/Black Hazard Warning Stripes (on right shoulder area)
            colorCtx.save();
            colorCtx.beginPath();
            colorCtx.rect(360, 160, 60, 20);
            colorCtx.clip();
            colorCtx.fillStyle = '#00f0ff'; // neon cyan background warning stripes
            colorCtx.fillRect(360, 160, 60, 20);
            colorCtx.strokeStyle = '#000000';
            colorCtx.lineWidth = 5;
            for (let offset = -20; offset < 80; offset += 12) {
              colorCtx.beginPath();
              colorCtx.moveTo(360 + offset, 160);
              colorCtx.lineTo(360 + offset - 10, 180);
              colorCtx.stroke();
            }
            colorCtx.restore();

            // Register warning stripes on bump and roughness map
            bumpCtx.fillStyle = '#8e8e8e';
            bumpCtx.fillRect(360, 160, 60, 20);
            roughnessCtx.fillStyle = '#606060'; // slightly glossier than board
            roughnessCtx.fillRect(360, 160, 60, 20);

            // B. Barcode decal (on left shoulder/back area)
            colorCtx.fillStyle = '#ffffff';
            colorCtx.fillRect(80, 180, 70, 36);
            colorCtx.fillStyle = '#000000';
            colorCtx.font = 'bold 8px monospace';
            colorCtx.fillText('GRMLN-9000-X', 84, 212);
            let bx = 85;
            const lineW = [2, 1, 3, 1, 2, 4, 1, 2, 1, 3];
            for (let l = 0; l < lineW.length; l++) {
              colorCtx.fillRect(bx, 184, lineW[l], 22);
              bx += lineW[l] + 2;
            }

            bumpCtx.fillStyle = '#909090'; // raised sticker
            bumpCtx.fillRect(80, 180, 70, 36);
            roughnessCtx.fillStyle = '#404040'; // semi-gloss sticker
            roughnessCtx.fillRect(80, 180, 70, 36);

            // C. Chest Energy Core Reactor (Arc Reactor Style, centered at 256, 280)
            const rx = 256;
            const ry = 280;

            // Outer ring
            colorCtx.strokeStyle = '#3a3a4c';
            colorCtx.lineWidth = 4;
            colorCtx.beginPath();
            colorCtx.arc(rx, ry, 34, 0, Math.PI * 2);
            colorCtx.stroke();

            bumpCtx.strokeStyle = '#b0b0b0'; // raised ring housing
            bumpCtx.lineWidth = 5;
            bumpCtx.beginPath();
            bumpCtx.arc(rx, ry, 34, 0, Math.PI * 2);
            bumpCtx.stroke();

            roughnessCtx.strokeStyle = '#101010'; // shiny metallic ring
            roughnessCtx.lineWidth = 4;
            roughnessCtx.beginPath();
            roughnessCtx.arc(rx, ry, 34, 0, Math.PI * 2);
            roughnessCtx.stroke();

            metalnessCtx.fillStyle = '#ffffff';
            metalnessCtx.beginPath();
            metalnessCtx.arc(rx, ry, 36, 0, Math.PI * 2);
            metalnessCtx.fill();

            // Inner blue glowing core
            colorCtx.fillStyle = '#00f0ff';
            colorCtx.shadowColor = '#00f0ff';
            colorCtx.shadowBlur = 18;
            colorCtx.beginPath();
            colorCtx.arc(rx, ry, 22, 0, Math.PI * 2);
            colorCtx.fill();
            colorCtx.shadowBlur = 0;

            emissiveCtx.fillStyle = '#00f0ff';
            emissiveCtx.shadowColor = '#00f0ff';
            emissiveCtx.shadowBlur = 18;
            emissiveCtx.beginPath();
            emissiveCtx.arc(rx, ry, 22, 0, Math.PI * 2);
            emissiveCtx.fill();
            emissiveCtx.shadowBlur = 0;

            // Turbine blades / segmented radiation spokes
            colorCtx.strokeStyle = '#00f0ff';
            colorCtx.lineWidth = 3.5;
            emissiveCtx.strokeStyle = '#00f0ff';
            emissiveCtx.lineWidth = 3.5;
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
              const x1 = rx + Math.cos(a) * 22;
              const y1 = ry + Math.sin(a) * 22;
              const x2 = rx + Math.cos(a) * 33;
              const y2 = ry + Math.sin(a) * 33;
              colorCtx.beginPath(); colorCtx.moveTo(x1, y1); colorCtx.lineTo(x2, y2); colorCtx.stroke();
              emissiveCtx.beginPath(); emissiveCtx.moveTo(x1, y1); emissiveCtx.lineTo(x2, y2); emissiveCtx.stroke();
            }

            // D. Tech circuit traces mapping outward
            const traceColor = '#00f0ff';
            const drawTrace = (points: {x: number; y: number}[]) => {
              const ctxs = [colorCtx, bumpCtx, roughnessCtx, metalnessCtx, emissiveCtx];
              
              colorCtx.strokeStyle = traceColor;
              colorCtx.lineWidth = 3.0;
              colorCtx.shadowColor = traceColor;
              colorCtx.shadowBlur = 6;

              emissiveCtx.strokeStyle = traceColor;
              emissiveCtx.lineWidth = 3.0;
              emissiveCtx.shadowColor = traceColor;
              emissiveCtx.shadowBlur = 6;

              bumpCtx.strokeStyle = '#b0b0b0';
              bumpCtx.lineWidth = 4.0;

              roughnessCtx.strokeStyle = '#151515';
              roughnessCtx.lineWidth = 3.0;

              metalnessCtx.strokeStyle = '#e0e0e0';
              metalnessCtx.lineWidth = 3.0;

              ctxs.forEach(c => {
                c.beginPath();
                c.moveTo(points[0].x, points[0].y);
                for (let idx = 1; idx < points.length; idx++) {
                  c.lineTo(points[idx].x, points[idx].y);
                }
                c.stroke();
              });

              // White core center for intense glow
              [colorCtx, emissiveCtx].forEach(c => {
                c.save();
                c.shadowBlur = 0;
                c.strokeStyle = '#ffffff';
                c.lineWidth = 1.0;
                c.beginPath();
                c.moveTo(points[0].x, points[0].y);
                for (let idx = 1; idx < points.length; idx++) {
                  c.lineTo(points[idx].x, points[idx].y);
                }
                c.stroke();
                c.restore();
              });

              colorCtx.shadowBlur = 0;
              emissiveCtx.shadowBlur = 0;
            };

            const drawVia = (vx: number, vy: number) => {
              colorCtx.fillStyle = traceColor;
              colorCtx.shadowColor = traceColor;
              colorCtx.shadowBlur = 8;
              colorCtx.beginPath();
              colorCtx.arc(vx, vy, 6, 0, Math.PI * 2);
              colorCtx.fill();
              colorCtx.shadowBlur = 0;

              colorCtx.fillStyle = '#ffc83b'; // gold via core
              colorCtx.beginPath();
              colorCtx.arc(vx, vy, 3, 0, Math.PI * 2);
              colorCtx.fill();

              emissiveCtx.fillStyle = traceColor;
              emissiveCtx.beginPath();
              emissiveCtx.arc(vx, vy, 6, 0, Math.PI * 2);
              emissiveCtx.fill();

              bumpCtx.fillStyle = '#d0d0d0';
              bumpCtx.beginPath();
              bumpCtx.arc(vx, vy, 6, 0, Math.PI * 2);
              bumpCtx.fill();

              roughnessCtx.fillStyle = '#101010';
              roughnessCtx.beginPath();
              roughnessCtx.arc(vx, vy, 6, 0, Math.PI * 2);
              roughnessCtx.fill();

              metalnessCtx.fillStyle = '#ffffff';
              roughnessCtx.beginPath();
              roughnessCtx.arc(vx, vy, 6, 0, Math.PI * 2);
              roughnessCtx.fill();
            };

            // Connect reactor housing outwards
            drawTrace([{x: rx - 34, y: ry}, {x: rx - 100, y: ry}, {x: rx - 130, y: ry - 40}]);
            drawTrace([{x: rx + 34, y: ry}, {x: rx + 100, y: ry}, {x: rx + 130, y: ry + 40}]);
            drawTrace([{x: rx, y: ry - 34}, {x: rx, y: ry - 120}, {x: rx - 50, y: ry - 160}]);
            
            drawVia(rx - 130, ry - 40);
            drawVia(rx + 130, ry + 40);
            drawVia(rx - 50, ry - 160);
          } else {
            // Ear: simple high-energy neon line
            colorCtx.strokeStyle = '#ff2a55';
            colorCtx.lineWidth = 4;
            colorCtx.shadowColor = '#ff2a55';
            colorCtx.shadowBlur = 10;
            colorCtx.beginPath();
            colorCtx.moveTo(256, 20);
            colorCtx.lineTo(256, 492);
            colorCtx.stroke();
            colorCtx.shadowBlur = 0;

            emissiveCtx.strokeStyle = '#ff2a55';
            emissiveCtx.lineWidth = 4;
            emissiveCtx.beginPath();
            emissiveCtx.moveTo(256, 20);
            emissiveCtx.lineTo(256, 492);
            emissiveCtx.stroke();

            // Inner white line
            colorCtx.strokeStyle = '#ffffff';
            colorCtx.lineWidth = 1;
            colorCtx.beginPath();
            colorCtx.moveTo(256, 20);
            colorCtx.lineTo(256, 492);
            colorCtx.stroke();

            emissiveCtx.strokeStyle = '#ffffff';
            emissiveCtx.lineWidth = 1;
            emissiveCtx.beginPath();
            emissiveCtx.moveTo(256, 20);
            colorCtx.lineTo(256, 492);
            emissiveCtx.stroke();

            bumpCtx.strokeStyle = '#b0b0b0';
            bumpCtx.lineWidth = 5;
            bumpCtx.beginPath();
            bumpCtx.moveTo(256, 20);
            bumpCtx.lineTo(256, 492);
            bumpCtx.stroke();
          }
        } else {
          // --- AZURE VINTAGE WATERCOLOR COMIC ART ---
          // 1. Soft overlapping watercolor washes (using canvas blurs!)
          colorCtx.fillStyle = '#6597be'; // base light watercolor paper
          colorCtx.fillRect(0, 0, width, height);

          colorCtx.save();
          // Draw blurred color spots
          colorCtx.filter = 'blur(35px)';
          colorCtx.fillStyle = type === 'body' ? '#42749a' : '#b64750'; // darker spots
          colorCtx.beginPath();
          colorCtx.arc(150, 180, 90, 0, Math.PI * 2);
          colorCtx.arc(380, 320, 110, 0, Math.PI * 2);
          colorCtx.fill();

          colorCtx.fillStyle = type === 'body' ? '#8cb8db' : '#ea8b94'; // lighter spots
          colorCtx.beginPath();
          colorCtx.arc(320, 140, 80, 0, Math.PI * 2);
          colorCtx.arc(160, 360, 100, 0, Math.PI * 2);
          colorCtx.fill();
          colorCtx.restore();

          // Base paper displacement
          bumpCtx.fillStyle = '#808080';
          bumpCtx.fillRect(0, 0, width, height);

          // Base roughness: paper is extremely matte
          roughnessCtx.fillStyle = '#dedede'; 
          roughnessCtx.fillRect(0, 0, width, height);

          // 2. Hand-Drawn Shading (Cross-Hatching lines)
          colorCtx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
          colorCtx.lineWidth = 1.0;
          colorCtx.beginPath();
          
          // Hatching lines in lower section (shadow area)
          for (let offset = -50; offset < width + 100; offset += 10) {
            // Draw diagonal stripes representing hatching
            colorCtx.moveTo(offset, 400);
            colorCtx.lineTo(offset + 30, 480);
          }
          colorCtx.stroke();

          // Hatching on bump map to give them physical ink ridge depth
          bumpCtx.strokeStyle = '#747474';
          bumpCtx.lineWidth = 1.0;
          bumpCtx.beginPath();
          for (let offset = -50; offset < width + 100; offset += 10) {
            bumpCtx.moveTo(offset, 400);
            bumpCtx.lineTo(offset + 30, 480);
          }
          bumpCtx.stroke();

          // Draw organic paper fibers (cardstock detail)
          for (let i = 0; i < 200; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            const len = 5 + Math.random() * 8;
            const angle = Math.random() * Math.PI * 2;
            const cpX = rx + Math.cos(angle) * (len / 2) + (Math.random() - 0.5) * 2;
            const cpY = ry + Math.sin(angle) * (len / 2) + (Math.random() - 0.5) * 2;
            const endX = rx + Math.cos(angle) * len;
            const endY = ry + Math.sin(angle) * len;
            
            colorCtx.strokeStyle = Math.random() > 0.5 ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
            colorCtx.lineWidth = 0.5;
            colorCtx.beginPath();
            colorCtx.moveTo(rx, ry);
            colorCtx.quadraticCurveTo(cpX, cpY, endX, endY);
            colorCtx.stroke();
            
            bumpCtx.strokeStyle = Math.random() > 0.5 ? '#8b8b8b' : '#757575';
            bumpCtx.lineWidth = 0.5;
            bumpCtx.beginPath();
            bumpCtx.moveTo(rx, ry);
            bumpCtx.quadraticCurveTo(cpX, cpY, endX, endY);
            bumpCtx.stroke();
          }

          // 3. Comic Stencil Stamped Logo
          if (type === 'body') {
            const cx = 256;
            const cy = 280;

            const drawStar = (ctx: CanvasRenderingContext2D, spikes: number, outer: number, inner: number) => {
              let rot = (Math.PI / 2) * 3;
              let x = cx;
              let y = cy;
              const step = Math.PI / spikes;

              ctx.beginPath();
              ctx.moveTo(cx, cy - outer);
              for (let s = 0; s < spikes; s++) {
                x = cx + Math.cos(rot) * outer;
                y = cy + Math.sin(rot) * outer;
                ctx.lineTo(x, y);
                rot += step;

                x = cx + Math.cos(rot) * inner;
                y = cy + Math.sin(rot) * inner;
                ctx.lineTo(x, y);
                rot += step;
              }
              ctx.lineTo(cx, cy - outer);
              ctx.closePath();
            };

            // Terracotta star fill
            colorCtx.fillStyle = '#d95d67';
            drawStar(colorCtx, 5, 24, 10);
            colorCtx.fill();

            // Hand-drawn sketchy black border outline
            colorCtx.strokeStyle = 'rgba(20, 20, 20, 0.6)';
            colorCtx.lineWidth = 2.0;
            drawStar(colorCtx, 5, 24, 10);
            colorCtx.stroke();

            // Register star stamp slightly indented on bump map
            bumpCtx.fillStyle = '#707070';
            drawStar(bumpCtx, 5, 24, 10);
            bumpCtx.fill();

            // Circular comic badge border
            colorCtx.strokeStyle = 'rgba(20, 20, 20, 0.4)';
            colorCtx.lineWidth = 1.5;
            colorCtx.beginPath();
            colorCtx.arc(cx, cy, 38, 0, Math.PI * 2);
            colorCtx.stroke();
            
            bumpCtx.strokeStyle = '#707070';
            bumpCtx.lineWidth = 1.5;
            bumpCtx.beginPath();
            bumpCtx.arc(cx, cy, 38, 0, Math.PI * 2);
            bumpCtx.stroke();
          }

          // 4. Staggered Comic Halftone dots
          const spacing = 18;
          colorCtx.save();
          colorCtx.translate(width / 2, height / 2);
          colorCtx.rotate(15 * Math.PI / 180);
          
          bumpCtx.save();
          bumpCtx.translate(width / 2, height / 2);
          bumpCtx.rotate(15 * Math.PI / 180);

          roughnessCtx.save();
          roughnessCtx.translate(width / 2, height / 2);
          roughnessCtx.rotate(15 * Math.PI / 180);

          const start = -width;
          const end = width * 2;
          for (let x = start; x < end; x += spacing) {
            for (let y = start; y < end; y += spacing) {
              const staggerX = (Math.floor((y - start) / spacing) % 2 === 0) ? spacing / 2 : 0;
              const px = x - staggerX;
              const py = y;
              
              if (px < -width || px > width * 2 || py < -height || py > height * 2) continue;

              // Don't draw dots in the face area and chest logo area to prevent visual clutter
              const cRad = 15 * Math.PI / 180;
              const origX = px * Math.cos(cRad) + py * Math.sin(cRad) + width/2;
              const origY = -px * Math.sin(cRad) + py * Math.cos(cRad) + height/2;
              if (origX > 170 && origX < 342 && origY > 110 && origY < 390) continue;

              // Misregistered plates
              colorCtx.fillStyle = 'rgba(235, 64, 120, 0.26)'; // magenta plate
              colorCtx.beginPath();
              colorCtx.arc(px - 1.2, py - 0.8, 3.8, 0, Math.PI * 2);
              colorCtx.fill();

              colorCtx.fillStyle = 'rgba(0, 210, 240, 0.26)'; // cyan plate
              colorCtx.beginPath();
              colorCtx.arc(px + 0.8, py + 1.0, 3.8, 0, Math.PI * 2);
              colorCtx.fill();

              colorCtx.fillStyle = type === 'body' ? '#3e6d92' : '#b2454f';
              colorCtx.beginPath();
              colorCtx.arc(px, py, 3.2, 0, Math.PI * 2);
              colorCtx.fill();

              bumpCtx.fillStyle = '#6a6a6a'; // debossed slightly
              bumpCtx.beginPath();
              bumpCtx.arc(px, py, 3.2, 0, Math.PI * 2);
              bumpCtx.fill();

              roughnessCtx.fillStyle = '#8f8f8f'; // slightly glossier ink
              roughnessCtx.beginPath();
              roughnessCtx.arc(px, py, 3.8, 0, Math.PI * 2);
              roughnessCtx.fill();
            }
          }
          colorCtx.restore();
          bumpCtx.restore();
          roughnessCtx.restore();
        }

        // Convert canvases to CanvasTextures
        const map = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
        const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);
        const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);

        const textures = [map, bumpMap, roughnessMap, metalnessMap, emissiveMap];
        textures.forEach(t => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(1, 1);
        });

        return { map, bumpMap, roughnessMap, metalnessMap, emissiveMap };
      };

      const themeNoir = isNoirRef.current;
      const bodyTextures = createProceduralTextures('body', themeNoir);
      const earTextures = createProceduralTextures('ear', themeNoir);

      // Register shared textures for cleanup
      disposables.push(
        bodyTextures.map, bodyTextures.bumpMap, bodyTextures.roughnessMap, bodyTextures.metalnessMap, bodyTextures.emissiveMap,
        earTextures.map, earTextures.bumpMap, earTextures.roughnessMap, earTextures.metalnessMap, earTextures.emissiveMap
      );

      // 5. Procedural 3D Gremlin Constructor
      const create3DGremlin = (noir: boolean) => {
        const group = new THREE.Group();

        // Theme materials
        const bodyMat = new THREE.MeshStandardMaterial({
          map: bodyTextures.map,
          bumpMap: bodyTextures.bumpMap,
          bumpScale: noir ? 0.012 : 0.02,
          roughnessMap: bodyTextures.roughnessMap,
          metalnessMap: noir ? bodyTextures.metalnessMap : undefined,
          emissiveMap: noir ? bodyTextures.emissiveMap : undefined,
          roughness: 1.0,
          metalness: noir ? 1.0 : 0.0,
          emissive: noir ? 0xffffff : 0x000000,
          emissiveIntensity: noir ? 1.2 : 0.0,
        });
        const earMat = new THREE.MeshStandardMaterial({
          map: earTextures.map,
          bumpMap: earTextures.bumpMap,
          bumpScale: noir ? 0.012 : 0.02,
          roughnessMap: earTextures.roughnessMap,
          metalnessMap: noir ? earTextures.metalnessMap : undefined,
          emissiveMap: noir ? earTextures.emissiveMap : undefined,
          roughness: 1.0,
          metalness: noir ? 1.0 : 0.0,
          emissive: noir ? 0xffffff : 0x000000,
          emissiveIntensity: noir ? 1.2 : 0.0,
        });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2b2b36, roughness: 0.1 });
        const cheekMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0xff2a55, emissive: 0xff2a55, emissiveIntensity: 0.7 } // Neon Pink Blush
            : { color: 0xdf8b98, roughness: 0.7 } // Soft Peach
        );

        // Keep track of materials & geometries for cleanup
        disposables.push(bodyMat, earMat, eyeMat, pupilMat, cheekMat);

        // -- Main Body (Rounded Box/Cube, pivot translated to bottom) --
        const bodyGeom = new RoundedBoxGeometry(1.5, 1.5, 1.5, 5, 0.3);
        bodyGeom.translate(0, 0.75, 0); // shift origin to bottom face
        const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(bodyMesh);
        disposables.push(bodyGeom);

        // -- Left & Right Ears (Pointy Cones attached to Body) --
        const earGeom = new THREE.ConeGeometry(0.35, 1.1, 16);
        disposables.push(earGeom);

        const leftEar = new THREE.Mesh(earGeom, earMat);
        leftEar.position.set(-0.75, 1.4, 0);
        leftEar.rotation.z = Math.PI / 4.5; // Angle outward
        leftEar.rotation.y = -Math.PI / 8;  // Angle forward
        bodyMesh.add(leftEar);

        const rightEar = new THREE.Mesh(earGeom, earMat);
        rightEar.position.set(0.75, 1.4, 0);
        rightEar.rotation.z = -Math.PI / 4.5;
        rightEar.rotation.y = Math.PI / 8;
        bodyMesh.add(rightEar);

        // -- Large Eyes (Spheres attached to Body) --
        const eyeGeom = new THREE.SphereGeometry(0.26, 16, 16);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.35, 0.9, 0.75);
        bodyMesh.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.35, 0.9, 0.75);
        bodyMesh.add(rightEye);

        // -- Pupils (Spheres attached to Body) --
        const pupilGeom = new THREE.SphereGeometry(0.1, 16, 16);
        disposables.push(pupilGeom);

        const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
        leftPupil.position.set(-0.35, 0.9, 0.98);
        bodyMesh.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
        rightPupil.position.set(0.35, 0.9, 0.98);
        bodyMesh.add(rightPupil);

        // -- Blushing Cheeks (Flat Spheres attached to Body) --
        const cheekGeom = new THREE.SphereGeometry(0.18, 16, 16);
        cheekGeom.scale(1.2, 0.8, 0.5);
        disposables.push(cheekGeom);

        const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
        leftCheek.position.set(-0.6, 0.65, 0.7);
        leftCheek.rotation.y = Math.PI / 6;
        bodyMesh.add(leftCheek);

        const rightCheek = new THREE.Mesh(cheekGeom, cheekMat);
        rightCheek.position.set(0.6, 0.65, 0.7);
        rightCheek.rotation.y = -Math.PI / 6;
        bodyMesh.add(rightCheek);

        // -- Mouth Torus (attached to Body) --
        const mouthGeom = new THREE.TorusGeometry(0.18, 0.035, 8, 24, Math.PI);
        const mouthMat = new THREE.MeshBasicMaterial({ color: noir ? 0x00f0ff : 0x2b2b36 });
        const mouth = new THREE.Mesh(mouthGeom, mouthMat);
        mouth.position.set(0, 0.55, 0.74);
        mouth.rotation.x = Math.PI; // Flip Torus upside down for smile
        bodyMesh.add(mouth);
        disposables.push(mouthGeom, mouthMat);

        // -- Angler Antenna (attached to Body) --
        const antennaGroup = new THREE.Group();
        antennaGroup.position.set(0, 1.3, 0.35); // forehead placement
        
        const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), bodyMat);
        seg1.position.set(0, 0.12, 0.06);
        seg1.rotation.x = 0.4;
        antennaGroup.add(seg1);

        const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 8), bodyMat);
        seg2.position.set(0, 0.28, 0.18);
        seg2.rotation.x = 0.9;
        antennaGroup.add(seg2);

        const seg3 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), bodyMat);
        seg3.position.set(0, 0.38, 0.34);
        seg3.rotation.x = 1.4;
        antennaGroup.add(seg3);

        const bulbMat = new THREE.MeshStandardMaterial({
          color: noir ? 0x00f0ff : 0xd95d67,
          emissive: noir ? 0x00f0ff : 0xd95d67,
          emissiveIntensity: noir ? 2.5 : 0.2,
          roughness: 0.1
        });
        disposables.push(bulbMat);
        
        const antennaBulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), bulbMat);
        antennaBulb.position.set(0, 0.42, 0.45);
        antennaGroup.add(antennaBulb);
        
        bodyMesh.add(antennaGroup);

        // -- Hair/Fur Tufts (attached to Body) --
        const hairGeom = new THREE.ConeGeometry(0.06, 0.25, 8);
        disposables.push(hairGeom);
        for (let h = 0; h < 4; h++) {
          const hair = new THREE.Mesh(hairGeom, bodyMat);
          const angle = -0.2 - h * 0.15; // angle backwards
          hair.position.set((h - 1.5) * 0.25, 1.4, -0.3);
          hair.rotation.x = angle;
          hair.rotation.z = (h - 1.5) * 0.2;
          bodyMesh.add(hair);
        }

        // -- Neon accent ring if in Noir mode (attached to Body) --
        if (noir) {
          const glowColor = [0x00f0ff, 0xff2a55, 0x39ff14, 0xffe600][Math.floor(Math.random() * 4)];
          const ringGeom = new THREE.RingGeometry(0.95, 1.05, 32);
          const ringMat = new THREE.MeshBasicMaterial({ 
            color: glowColor, 
            side: THREE.DoubleSide, 
            transparent: true,
            opacity: 0.8
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.position.set(0, 0.75, -0.05); // center of cube
          bodyMesh.add(ring);
          disposables.push(ringGeom, ringMat);
        }

        scene.add(group);
        return { group, bodyMesh, antennaBulb };
      };

      // 6. Spawn Gremlins in WebGL Space
      const numGremlins = 7;
      const getBounds = () => {
        // Find viewport edges at z=0 coordinate
        const vFOV = (camera.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;
        return {
          width: visibleWidth,
          height: visibleHeight
        };
      };

      const bounds = getBounds();

      for (let i = 0; i < numGremlins; i++) {
        const themeNoir = isNoirRef.current;
        const gremlinParts = create3DGremlin(themeNoir);

        // Distribute randomly across the bottom ground level
        const x = (Math.random() - 0.5) * bounds.width * 0.9;
        const z = (Math.random() - 0.5) * 4.0; // depth layers (-2 to 2)
        
        // Ground Y level adjusted for perspective depth
        const groundY = -bounds.height / 2 + 1.2;
        const y = groundY + z * 0.15; // further away (negative z) runs slightly higher

        gremlinParts.group.position.set(x, y, z);

        // Bounding radius for collision calculations (cube is ~1.5 wide, so radius ~0.85)
        const radius = 0.85;

        // Set scaling based on z depth to look perspective-correct (smaller in back)
        const scaleVal = 0.95 + (z / 2.0) * 0.22; // ~0.7 to 1.2
        gremlinParts.group.scale.set(scaleVal, scaleVal, scaleVal);

        // Horizontal speed
        const isRunningRight = Math.random() > 0.5;
        const runSpeed = 1.5 + Math.random() * 2.0;
        const speedX = isRunningRight ? runSpeed : -runSpeed;
        
        // Face the direction of running initially
        const targetRotY = isRunningRight ? Math.PI / 2 : -Math.PI / 2;
        gremlinParts.group.rotation.y = targetRotY;

        gremlins.push({
          group: gremlinParts.group,
          bodyMesh: gremlinParts.bodyMesh,
          antennaBulb: gremlinParts.antennaBulb,
          radius: radius * scaleVal,
          position: { x, y: groundY, z }, // y stores the logical ground level baseline
          velocity: { x: speedX, y: 0, z: 0 }, // running horizontally
          targetRotY,
          bouncePhase: Math.random() * Math.PI * 2,
          bounceSpeedMultiplier: 1.0 + Math.random() * 0.4
        });
      }

      // 7a. Resize & Mouse Event Handlers
      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);




      // 8. Physics & Animation loop
      let lastTime = performance.now();

      const animate = () => {
        if (!active) return;
        animationFrameId = requestAnimationFrame(animate);
        if (!isTabVisible) return;

        const currentTime = performance.now();
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // cap dt
        lastTime = currentTime;

        const currentBounds = getBounds();

        // A. Move each gremlin and animate bouncing
        gremlins.forEach((gremlin) => {
          // Apply horizontal gravity force from laptop tilt/gyroscope
          if (Math.abs(tiltX) > 0.08) {
            // Laptop is tilted left/right
            const forceX = tiltX * 18.0; // gravity force scalar
            gremlin.velocity.x += forceX * dt;
            // Cap speed during slide
            const maxSpeed = 12.0;
            gremlin.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, gremlin.velocity.x));
            // Set target running/facing direction
            gremlin.targetRotY = gremlin.velocity.x > 0 ? Math.PI / 2 : -Math.PI / 2;
          } else {
            // Flat/Centered: decelerate back to default running speed
            const defaultSpeed = gremlin.targetRotY === Math.PI / 2 ? 2.0 : -2.0;
            // Smoothly damp velocity back to defaultSpeed
            gremlin.velocity.x += (defaultSpeed - gremlin.velocity.x) * dt * 4.0;
          }

          // Horizontal running movement
          gremlin.position.x += gremlin.velocity.x * dt;
          gremlin.position.z += gremlin.velocity.z * dt;

          // Bounce cycle update
          gremlin.bouncePhase += dt * 4.5 * gremlin.bounceSpeedMultiplier;

          const sineVal = Math.sin(gremlin.bouncePhase);
          const bounceHeight = 1.6;
          const currentHeight = Math.abs(sineVal) * bounceHeight;

          // Squash & Stretch calculation (Y squashes on impact, stretches in air)
          const hFactor = Math.abs(sineVal); // 0 to 1
          const scaleY = 0.8 + hFactor * 0.35; // 0.8 on ground, 1.15 at peak
          const scaleX = 1.15 - hFactor * 0.23; // 1.15 on ground, 0.92 at peak
          const scaleZ = 1.15 - hFactor * 0.23;

          // Apply squash and stretch directly to bodyMesh (pivoted at bottom)
          gremlin.bodyMesh.scale.set(scaleX, scaleY, scaleZ);

          // Dynamic forward lean proportional to speed and direction
          const targetLean = -gremlin.velocity.x * 0.05;
          gremlin.group.rotation.z += (targetLean - gremlin.group.rotation.z) * 0.15;

          // Smooth turnaround rotation Y-axis (facing left or right)
          let diff = gremlin.targetRotY - gremlin.group.rotation.y;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          gremlin.group.rotation.y += diff * 0.15;

          // Calculate Y baseline position with perspective and bouncing
          const localGroundY = gremlin.position.y + gremlin.position.z * 0.15;
          
          // Sync Three.js mesh transform
          gremlin.group.position.set(gremlin.position.x, localGroundY + currentHeight, gremlin.position.z);

          // D. Pulse Emission intensities over time
          const pulseVal = 1.6 + Math.sin(currentTime * 0.006) * 0.9;
          if (isNoirRef.current) {
            // Pulse antenna bulb
            const bulbMat = gremlin.antennaBulb.material as MeshStandardMaterial;
            if (bulbMat) {
              bulbMat.emissiveIntensity = pulseVal * 1.5;
            }
            // Pulse reactor in body material
            const bodyMat = gremlin.bodyMesh.material as MeshStandardMaterial;
            if (bodyMat) {
              bodyMat.emissiveIntensity = pulseVal * 0.85;
            }
          } else {
            const bulbMat = gremlin.antennaBulb.material as MeshStandardMaterial;
            if (bulbMat) {
              bulbMat.emissiveIntensity = 0.25 + Math.sin(currentTime * 0.003) * 0.15;
            }
          }

          // Wall bounce (Left/Right bounds check)
          const sideLimit = currentBounds.width / 2 + 1.0;
          if (gremlin.position.x < -sideLimit && gremlin.velocity.x < 0) {
            gremlin.velocity.x *= -1.0;
            gremlin.targetRotY = Math.PI / 2;
          } else if (gremlin.position.x > sideLimit && gremlin.velocity.x > 0) {
            gremlin.velocity.x *= -1.0;
            gremlin.targetRotY = -Math.PI / 2;
          }

          // Z boundary check to keep them on screen vertically
          if (gremlin.position.z < -2.2 && gremlin.velocity.z < 0) {
            gremlin.velocity.z *= -0.8;
            gremlin.position.z = -2.2;
          } else if (gremlin.position.z > 2.2 && gremlin.velocity.z > 0) {
            gremlin.velocity.z *= -0.8;
            gremlin.position.z = 2.2;
          }
          gremlin.velocity.z *= 0.95; // slide damping
        });

        // E. Handle Elastic Collisions (Physics Sweep in X-Z Plane)
        for (let i = 0; i < gremlins.length; i++) {
          for (let j = i + 1; j < gremlins.length; j++) {
            const g1 = gremlins[i];
            const g2 = gremlins[j];

            const dx = g2.position.x - g1.position.x;
            const dz = g2.position.z - g1.position.z;
            const distSq = dx * dx + dz * dz;

            const minDist = g1.radius + g2.radius;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001;

              // 1. Separate the overlapping spheres in X-Z plane
              const overlap = minDist - dist;
              const nx = dx / dist;
              const nz = dz / dist;

              g1.position.x -= nx * overlap * 0.51;
              g1.position.z -= nz * overlap * 0.51;

              g2.position.x += nx * overlap * 0.51;
              g2.position.z += nz * overlap * 0.51;

              // Keep Z bounds safe
              g1.position.z = Math.max(-2.2, Math.min(2.2, g1.position.z));
              g2.position.z = Math.max(-2.2, Math.min(2.2, g2.position.z));

              // 2. Elastic Collision impulse calculations (assume equal mass)
              const rvx = g2.velocity.x - g1.velocity.x;
              const rvz = g2.velocity.z - g1.velocity.z;

              const velAlongNormal = rvx * nx + rvz * nz;

              if (velAlongNormal < 0) {
                const restitution = 0.8;
                const impulseScalar = -(1 + restitution) * velAlongNormal / 2;

                g1.velocity.x -= impulseScalar * nx;
                g1.velocity.z -= impulseScalar * nz;

                g2.velocity.x += impulseScalar * nx;
                g2.velocity.z += impulseScalar * nz;

                // Turn around on bounce
                g1.targetRotY = g1.velocity.x > 0 ? Math.PI / 2 : -Math.PI / 2;
                g2.targetRotY = g2.velocity.x > 0 ? Math.PI / 2 : -Math.PI / 2;
              }
            }
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    };

    init();

    const handleVisibility = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // 9. CLEANUP / LIFECYCLE DISPOSAL
    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Clean up window resize, mouse, and visibility listeners
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);



      // Explicitly dispose Three.js meshes & WebGL resources to free GPU memory
      if (scene) {
        gremlins.forEach((g) => {
          scene.remove(g.group);
        });
      }

      disposables.forEach((item) => {
        if (item.dispose) item.dispose();
      });

      if (renderer) {
        if (renderer.domElement && containerRef.current) {
          // eslint-disable-next-line react-hooks/exhaustive-deps
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
  }, []);

  return <div className="gremlin-canvas-container" ref={containerRef} />;
}
