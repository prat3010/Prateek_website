'use client';

import React, { useEffect, useRef } from 'react';
import type { Group, WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, MeshStandardMaterial } from 'three';
import { useTheme } from '@/context/ThemeContext';

interface PizzaRatPhysics {
  group: Group;
  bodyMesh: Mesh;
  headGroup: Group;
  tailGroup: Group;
  pizzaGroup: Group;
  leftEar: Mesh;
  rightEar: Mesh;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  targetRotY: number;
  bouncePhase: number;
}

export default function ThreePizzaRat() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isNoir } = useTheme();
  const isNoirRef = useRef(isNoir);

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
    let rat: PizzaRatPhysics | null = null;
    const disposables: { dispose?: () => void }[] = [];

    const handleResize = () => {
      if (!camera || !renderer) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    let mouseActive = false;
    let mouseNormX = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseActive = true;
      mouseNormX = (event.clientX / window.innerWidth) * 2 - 1;
    };

    const handleMouseLeave = () => {
      mouseActive = false;
    };

    const init = async () => {
      const THREE = await import('three');
      const { RoundedBoxGeometry } = await import('three/examples/jsm/geometries/RoundedBoxGeometry.js') as { RoundedBoxGeometry: new (w: number, h: number, d: number, s: number, r: number) => BufferGeometry };
      if (!active) return;

      const container = containerRef.current!;
      const width = window.innerWidth;
      const height = window.innerHeight;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
      camera.position.z = 18;

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      container.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);
      const fillLight = new THREE.PointLight(0xffffff, 0.4, 30);
      fillLight.position.set(-5, -5, 5);
      scene.add(fillLight);

      const createFurTexture = (noir: boolean) => {
        const sz = 512;
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = sz; colorCanvas.height = sz;
        const colorCtx = colorCanvas.getContext('2d')!;
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = sz; bumpCanvas.height = sz;
        const bumpCtx = bumpCanvas.getContext('2d')!;
        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = sz; roughnessCanvas.height = sz;
        const roughnessCtx = roughnessCanvas.getContext('2d')!;
        const metalnessCanvas = document.createElement('canvas');
        metalnessCanvas.width = sz; metalnessCanvas.height = sz;
        const metalnessCtx = metalnessCanvas.getContext('2d')!;
        const emissiveCanvas = document.createElement('canvas');
        emissiveCanvas.width = sz; emissiveCanvas.height = sz;
        const emissiveCtx = emissiveCanvas.getContext('2d')!;

        emissiveCtx.fillStyle = '#000000';
        emissiveCtx.fillRect(0, 0, sz, sz);
        metalnessCtx.fillStyle = '#000000';
        metalnessCtx.fillRect(0, 0, sz, sz);

        if (noir) {
          colorCtx.fillStyle = '#0a0a0e';
          colorCtx.fillRect(0, 0, sz, sz);
          roughnessCtx.fillStyle = '#888888';
          roughnessCtx.fillRect(0, 0, sz, sz);
          bumpCtx.fillStyle = '#808080';
          bumpCtx.fillRect(0, 0, sz, sz);

          for (let i = 0; i < 600; i++) {
            const x = Math.random() * sz;
            const y = Math.random() * sz;
            const len = 3 + Math.random() * 5;
            const angle = Math.random() * Math.PI * 2;
            colorCtx.strokeStyle = `rgba(20, 20, 28, ${0.3 + Math.random() * 0.3})`;
            colorCtx.lineWidth = 0.8;
            colorCtx.beginPath();
            colorCtx.moveTo(x, y);
            colorCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            colorCtx.stroke();
          }

          const drawHex = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
            ctx.beginPath();
            for (let k = 0; k < 6; k++) {
              const a = (k * Math.PI) / 3;
              ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
            }
            ctx.closePath();
            ctx.stroke();
          };
          colorCtx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
          colorCtx.lineWidth = 0.6;
          const hexSz = 18;
          const hSp = hexSz * 1.5;
          const vSp = hexSz * Math.sqrt(3);
          for (let y = -vSp; y < sz + vSp; y += vSp) {
            for (let x = -hSp; x < sz + hSp; x += hSp) {
              const yOff = (Math.floor(x / hSp) % 2 === 0) ? vSp / 2 : 0;
              drawHex(colorCtx, x, y + yOff, hexSz * 0.95);
            }
          }

          colorCtx.strokeStyle = '#00f0ff';
          colorCtx.lineWidth = 2;
          colorCtx.shadowColor = '#00f0ff';
          colorCtx.shadowBlur = 8;
          colorCtx.beginPath();
          colorCtx.moveTo(80, 100);
          colorCtx.lineTo(200, 100);
          colorCtx.lineTo(200, 60);
          colorCtx.stroke();
          colorCtx.beginPath();
          colorCtx.moveTo(320, 80);
          colorCtx.lineTo(440, 80);
          colorCtx.lineTo(440, 140);
          colorCtx.stroke();
          colorCtx.shadowBlur = 0;

          emissiveCtx.strokeStyle = '#00f0ff';
          emissiveCtx.lineWidth = 2;
          emissiveCtx.beginPath();
          emissiveCtx.moveTo(80, 100);
          emissiveCtx.lineTo(200, 100);
          emissiveCtx.lineTo(200, 60);
          emissiveCtx.stroke();
          emissiveCtx.beginPath();
          emissiveCtx.moveTo(320, 80);
          emissiveCtx.lineTo(440, 80);
          emissiveCtx.lineTo(440, 140);
          emissiveCtx.stroke();

          colorCtx.strokeStyle = '#ff2a55';
          colorCtx.lineWidth = 2.5;
          colorCtx.shadowColor = '#ff2a55';
          colorCtx.shadowBlur = 10;
          colorCtx.beginPath();
          colorCtx.arc(256, 280, 24, 0, Math.PI * 2);
          colorCtx.stroke();
          colorCtx.shadowBlur = 0;
          emissiveCtx.strokeStyle = '#ff2a55';
          emissiveCtx.lineWidth = 2.5;
          emissiveCtx.beginPath();
          emissiveCtx.arc(256, 280, 24, 0, Math.PI * 2);
          emissiveCtx.stroke();
        } else {
          colorCtx.fillStyle = '#7a6555';
          colorCtx.fillRect(0, 0, sz, sz);

          colorCtx.save();
          colorCtx.filter = 'blur(25px)';
          colorCtx.fillStyle = '#8a7565';
          colorCtx.beginPath();
          colorCtx.arc(130, 180, 90, 0, Math.PI * 2);
          colorCtx.fill();
          colorCtx.fillStyle = '#6a5545';
          colorCtx.beginPath();
          colorCtx.arc(370, 340, 110, 0, Math.PI * 2);
          colorCtx.fill();
          colorCtx.fillStyle = '#9a8575';
          colorCtx.beginPath();
          colorCtx.arc(300, 120, 80, 0, Math.PI * 2);
          colorCtx.fill();
          colorCtx.restore();

          for (let i = 0; i < 800; i++) {
            const x = Math.random() * sz;
            const y = Math.random() * sz;
            const len = 2 + Math.random() * 4;
            const angle = Math.random() * Math.PI * 2;
            const shade = 90 + Math.random() * 50;
            colorCtx.strokeStyle = `rgba(${shade}, ${shade - 15}, ${shade - 25}, 0.4)`;
            colorCtx.lineWidth = 0.6;
            colorCtx.beginPath();
            colorCtx.moveTo(x, y);
            colorCtx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            colorCtx.stroke();
          }

          bumpCtx.fillStyle = '#808080';
          bumpCtx.fillRect(0, 0, sz, sz);
          roughnessCtx.fillStyle = '#d0d0d0';
          roughnessCtx.fillRect(0, 0, sz, sz);

          colorCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
          colorCtx.lineWidth = 0.8;
          for (let offset = -50; offset < sz + 100; offset += 7) {
            colorCtx.beginPath();
            colorCtx.moveTo(offset, 400);
            colorCtx.lineTo(offset + 20, 500);
            colorCtx.stroke();
          }

          const cx = 256, cy = 280;
          const drawStar = (ctx: CanvasRenderingContext2D, spikes: number, outer: number, inner: number) => {
            let rot = (Math.PI / 2) * 3;
            ctx.beginPath();
            ctx.moveTo(cx, cy - outer);
            for (let s = 0; s < spikes; s++) {
              ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
              rot += Math.PI / spikes;
              ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
              rot += Math.PI / spikes;
            }
            ctx.lineTo(cx, cy - outer);
            ctx.closePath();
          };
          colorCtx.fillStyle = '#d95d67';
          drawStar(colorCtx, 5, 20, 8);
          colorCtx.fill();
          colorCtx.strokeStyle = 'rgba(20, 20, 20, 0.4)';
          colorCtx.lineWidth = 1.5;
          drawStar(colorCtx, 5, 20, 8);
          colorCtx.stroke();

          const spacing = 16;
          colorCtx.save();
          colorCtx.translate(sz / 2, sz / 2);
          colorCtx.rotate(15 * Math.PI / 180);
          for (let x = -sz; x < sz * 2; x += spacing) {
            for (let y = -sz; y < sz * 2; y += spacing) {
              const staggerX = (Math.floor((y + sz) / spacing) % 2 === 0) ? spacing / 2 : 0;
              const px = x - staggerX;
              const py = y;
              if (px < -sz || px > sz * 2 || py < -sz || py > sz * 2) continue;
              const cRad = 15 * Math.PI / 180;
              const origX = px * Math.cos(cRad) + py * Math.sin(cRad) + sz / 2;
              const origY = -px * Math.sin(cRad) + py * Math.cos(cRad) + sz / 2;
              if (origX > 150 && origX < 362 && origY > 90 && origY < 410) continue;
              colorCtx.fillStyle = 'rgba(235, 64, 120, 0.18)';
              colorCtx.beginPath();
              colorCtx.arc(px - 1, py - 0.6, 3.0, 0, Math.PI * 2);
              colorCtx.fill();
              colorCtx.fillStyle = 'rgba(0, 210, 240, 0.18)';
              colorCtx.beginPath();
              colorCtx.arc(px + 0.6, py + 0.8, 3.0, 0, Math.PI * 2);
              colorCtx.fill();
              colorCtx.fillStyle = '#6a5545';
              colorCtx.beginPath();
              colorCtx.arc(px, py, 2.5, 0, Math.PI * 2);
              colorCtx.fill();
            }
          }
          colorCtx.restore();
        }

        const map = new THREE.CanvasTexture(colorCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
        const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);
        const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
        [map, bumpMap, roughnessMap, metalnessMap, emissiveMap].forEach(t => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
        });
        return { map, bumpMap, roughnessMap, metalnessMap, emissiveMap };
      };

      const createPizzaTexture = (noir: boolean) => {
        const sz = 512;
        const colorCanvas = document.createElement('canvas');
        colorCanvas.width = sz; colorCanvas.height = sz;
        const colorCtx = colorCanvas.getContext('2d')!;
        const emissiveCanvas = document.createElement('canvas');
        emissiveCanvas.width = sz; emissiveCanvas.height = sz;
        const emissiveCtx = emissiveCanvas.getContext('2d')!;
        const bumpCanvas = document.createElement('canvas');
        bumpCanvas.width = sz; bumpCanvas.height = sz;
        const bumpCtx = bumpCanvas.getContext('2d')!;
        const roughnessCanvas = document.createElement('canvas');
        roughnessCanvas.width = sz; roughnessCanvas.height = sz;
        const roughnessCtx = roughnessCanvas.getContext('2d')!;
        const metalnessCanvas = document.createElement('canvas');
        metalnessCanvas.width = sz; metalnessCanvas.height = sz;
        const metalnessCtx = metalnessCanvas.getContext('2d')!;

        emissiveCtx.fillStyle = '#000000';
        emissiveCtx.fillRect(0, 0, sz, sz);
        metalnessCtx.fillStyle = '#000000';
        metalnessCtx.fillRect(0, 0, sz, sz);
        roughnessCtx.fillStyle = '#b0b0b0';
        roughnessCtx.fillRect(0, 0, sz, sz);

        if (noir) {
          colorCtx.fillStyle = '#1a1408';
          colorCtx.fillRect(0, 0, sz, sz);

          const gradient = colorCtx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, 200);
          gradient.addColorStop(0, '#ffe600');
          gradient.addColorStop(0.6, '#e8c84a');
          gradient.addColorStop(1, '#c8a86e');
          colorCtx.fillStyle = gradient;
          colorCtx.beginPath();
          colorCtx.arc(sz / 2, sz / 2, 190, 0, Math.PI * 2);
          colorCtx.fill();

          emissiveCtx.fillStyle = '#ffe600';
          emissiveCtx.shadowColor = '#ffe600';
          emissiveCtx.shadowBlur = 25;
          emissiveCtx.beginPath();
          emissiveCtx.arc(sz / 2, sz / 2, 180, 0, Math.PI * 2);
          emissiveCtx.fill();
          emissiveCtx.shadowBlur = 0;

          for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + 0.4;
            const r = 60 + Math.random() * 70;
            const px = sz / 2 + Math.cos(angle) * r;
            const py = sz / 2 + Math.sin(angle) * r;
            colorCtx.fillStyle = '#c0392b';
            colorCtx.shadowColor = '#ff2a55';
            colorCtx.shadowBlur = 8;
            colorCtx.beginPath();
            colorCtx.arc(px, py, 16 + Math.random() * 6, 0, Math.PI * 2);
            colorCtx.fill();
            colorCtx.shadowBlur = 0;

            emissiveCtx.fillStyle = '#ff2a55';
            emissiveCtx.beginPath();
            emissiveCtx.arc(px, py, 16, 0, Math.PI * 2);
            emissiveCtx.fill();
          }

          for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 30 + Math.random() * 120;
            colorCtx.fillStyle = `rgba(50, 120, 50, ${0.5 + Math.random() * 0.3})`;
            colorCtx.beginPath();
            colorCtx.arc(sz / 2 + Math.cos(angle) * r, sz / 2 + Math.sin(angle) * r, 4 + Math.random() * 5, 0, Math.PI * 2);
            colorCtx.fill();
          }

          colorCtx.strokeStyle = '#ff8c00';
          colorCtx.shadowColor = '#ff8c00';
          colorCtx.shadowBlur = 12;
          colorCtx.lineWidth = 28;
          colorCtx.beginPath();
          colorCtx.arc(sz / 2, sz / 2, 200, 0, Math.PI * 2);
          colorCtx.stroke();
          colorCtx.shadowBlur = 0;
        } else {
          colorCtx.fillStyle = '#c8a86e';
          colorCtx.fillRect(0, 0, sz, sz);

          const gradient = colorCtx.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, 200);
          gradient.addColorStop(0, '#e8c84a');
          gradient.addColorStop(0.7, '#d4b84a');
          gradient.addColorStop(1, '#b8963e');
          colorCtx.fillStyle = gradient;
          colorCtx.beginPath();
          colorCtx.arc(sz / 2, sz / 2, 190, 0, Math.PI * 2);
          colorCtx.fill();

          for (let i = 0; i < 7; i++) {
            const angle = (i / 7) * Math.PI * 2 + 0.4;
            const r = 60 + Math.random() * 70;
            const px = sz / 2 + Math.cos(angle) * r;
            const py = sz / 2 + Math.sin(angle) * r;
            colorCtx.fillStyle = '#b03a2a';
            colorCtx.beginPath();
            colorCtx.arc(px, py, 14 + Math.random() * 5, 0, Math.PI * 2);
            colorCtx.fill();
          }

          for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 30 + Math.random() * 120;
            colorCtx.fillStyle = `rgba(60, 140, 60, ${0.4 + Math.random() * 0.3})`;
            colorCtx.beginPath();
            colorCtx.ellipse(sz / 2 + Math.cos(angle) * r, sz / 2 + Math.sin(angle) * r, 3 + Math.random() * 4, 2 + Math.random() * 3, Math.random() * Math.PI, 0, Math.PI * 2);
            colorCtx.fill();
          }

          for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 40 + Math.random() * 110;
            colorCtx.fillStyle = `rgba(255, 255, 200, ${0.15 + Math.random() * 0.15})`;
            colorCtx.beginPath();
            colorCtx.arc(sz / 2 + Math.cos(angle) * r, sz / 2 + Math.sin(angle) * r, 2 + Math.random() * 3, 0, Math.PI * 2);
            colorCtx.fill();
          }

          colorCtx.strokeStyle = '#a07840';
          colorCtx.lineWidth = 26;
          colorCtx.beginPath();
          colorCtx.arc(sz / 2, sz / 2, 200, 0, Math.PI * 2);
          colorCtx.stroke();

          bumpCtx.fillStyle = '#808080';
          bumpCtx.fillRect(0, 0, sz, sz);
        }

        const map = new THREE.CanvasTexture(colorCanvas);
        const emissiveMap = new THREE.CanvasTexture(emissiveCanvas);
        const bumpMap = new THREE.CanvasTexture(bumpCanvas);
        const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
        const metalnessMap = new THREE.CanvasTexture(metalnessCanvas);
        [map, emissiveMap, bumpMap, roughnessMap, metalnessMap].forEach(t => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
        });
        return { map, emissiveMap, bumpMap, roughnessMap, metalnessMap };
      };

      const themeNoir = isNoirRef.current;
      const furTextures = createFurTexture(themeNoir);
      const pizzaTextures = createPizzaTexture(themeNoir);
      disposables.push(
        furTextures.map, furTextures.bumpMap, furTextures.roughnessMap, furTextures.metalnessMap, furTextures.emissiveMap,
        pizzaTextures.map, pizzaTextures.emissiveMap, pizzaTextures.bumpMap, pizzaTextures.roughnessMap, pizzaTextures.metalnessMap
      );

      const create3DPizzaRat = (noir: boolean) => {
        const group = new THREE.Group();

        const furMat = new THREE.MeshStandardMaterial({
          map: furTextures.map,
          bumpMap: furTextures.bumpMap,
          bumpScale: noir ? 0.015 : 0.025,
          roughnessMap: furTextures.roughnessMap,
          metalnessMap: noir ? furTextures.metalnessMap : undefined,
          emissiveMap: noir ? furTextures.emissiveMap : undefined,
          roughness: 0.85,
          metalness: noir ? 0.8 : 0.0,
          emissive: noir ? 0xffffff : 0x000000,
          emissiveIntensity: noir ? 1.0 : 0.0,
        });
        const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.05, metalness: 0.0 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.05 });
        const noseMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0xff2a55, emissive: 0xff2a55, emissiveIntensity: 1.8, roughness: 0.2 }
            : { color: 0xdf8b98, roughness: 0.35, metalness: 0.1 }
        );
        const innerEarMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0xff2a55, emissive: 0xff2a55, emissiveIntensity: 0.5 }
            : { color: 0xea8b94, roughness: 0.65 }
        );
        const tailMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0x1a1a22, metalness: 0.9, roughness: 0.25 }
            : { color: 0x8a7565, roughness: 0.75 }
        );
        const whiskerMat = new THREE.MeshBasicMaterial({ color: noir ? 0x00f0ff : 0x3a2a1e });

        disposables.push(furMat, eyeWhiteMat, pupilMat, noseMat, innerEarMat, tailMat, whiskerMat);

        const bodyGeom = new RoundedBoxGeometry(1.6, 1.0, 0.95, 6, 0.3);
        bodyGeom.translate(0, 0.5, 0);
        const bodyMesh = new THREE.Mesh(bodyGeom, furMat);
        group.add(bodyMesh);
        disposables.push(bodyGeom);

        const headGroup = new THREE.Group();
        headGroup.position.set(0.65, 0.85, 0);
        bodyMesh.add(headGroup);

        const headGeom = new THREE.SphereGeometry(0.5, 20, 20);
        const headMesh = new THREE.Mesh(headGeom, furMat);
        headGroup.add(headMesh);
        disposables.push(headGeom);

        const snoutGeom = new THREE.SphereGeometry(0.22, 14, 14);
        snoutGeom.scale(1.1, 0.65, 1.1);
        const snoutMesh = new THREE.Mesh(snoutGeom, furMat);
        snoutMesh.position.set(0.38, -0.1, 0);
        headGroup.add(snoutMesh);
        disposables.push(snoutGeom);

        const noseGeom = new THREE.SphereGeometry(0.07, 10, 10);
        const noseMesh = new THREE.Mesh(noseGeom, noseMat);
        noseMesh.position.set(0.55, -0.06, 0);
        headGroup.add(noseMesh);
        disposables.push(noseGeom);

        const eyeGeom = new THREE.SphereGeometry(0.11, 14, 14);
        const leftEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
        leftEyeWhite.position.set(0.28, 0.12, 0.28);
        headGroup.add(leftEyeWhite);
        const rightEyeWhite = new THREE.Mesh(eyeGeom, eyeWhiteMat);
        rightEyeWhite.position.set(0.28, 0.12, -0.28);
        headGroup.add(rightEyeWhite);
        disposables.push(eyeGeom);

        const pupilGeom = new THREE.SphereGeometry(0.06, 10, 10);
        const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
        leftPupil.position.set(0.37, 0.13, 0.30);
        headGroup.add(leftPupil);
        const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
        rightPupil.position.set(0.37, 0.13, -0.30);
        headGroup.add(rightPupil);
        disposables.push(pupilGeom);

        const earGeomOuter = new THREE.SphereGeometry(0.22, 14, 14);
        earGeomOuter.scale(1.0, 1.0, 0.12);
        const leftEar = new THREE.Mesh(earGeomOuter, furMat);
        leftEar.position.set(-0.08, 0.45, 0.3);
        leftEar.rotation.set(0.2, 0.3, 0.4);
        headGroup.add(leftEar);
        const rightEar = new THREE.Mesh(earGeomOuter, furMat);
        rightEar.position.set(-0.08, 0.45, -0.3);
        rightEar.rotation.set(-0.2, -0.3, 0.4);
        headGroup.add(rightEar);
        disposables.push(earGeomOuter);

        const earGeomInner = new THREE.SphereGeometry(0.14, 12, 12);
        earGeomInner.scale(1.0, 1.0, 0.1);
        const leftEarInner = new THREE.Mesh(earGeomInner, innerEarMat);
        leftEarInner.position.set(-0.06, 0.45, 0.32);
        leftEarInner.rotation.set(0.2, 0.3, 0.4);
        headGroup.add(leftEarInner);
        const rightEarInner = new THREE.Mesh(earGeomInner, innerEarMat);
        rightEarInner.position.set(-0.06, 0.45, -0.32);
        rightEarInner.rotation.set(-0.2, -0.3, 0.4);
        headGroup.add(rightEarInner);
        disposables.push(earGeomInner);

        for (let side = -1; side <= 1; side += 2) {
          for (let w = 0; w < 3; w++) {
            const whiskerGeom = new THREE.CylinderGeometry(0.006, 0.002, 0.55, 4);
            const whisker = new THREE.Mesh(whiskerGeom, whiskerMat);
            whisker.position.set(0.48, -0.06 + w * 0.05, side * 0.16);
            whisker.rotation.z = -Math.PI / 2;
            whisker.rotation.y = side * (0.15 + w * 0.12);
            headGroup.add(whisker);
            disposables.push(whiskerGeom);
          }
        }

        const tailGroup = new THREE.Group();
        tailGroup.position.set(-0.8, 0.45, 0);
        bodyMesh.add(tailGroup);

        const tailSegments = 12;
        const tailLen = 2.2;
        const tailRadius = 0.04;
        for (let i = 0; i < tailSegments; i++) {
          const t = i / tailSegments;
          const segLen = tailLen / tailSegments;
          const r = tailRadius * (1.0 - t * 0.6);
          const segGeom = new THREE.CylinderGeometry(r * 0.8, r, segLen, 6);
          const seg = new THREE.Mesh(segGeom, tailMat);
          const curveAngle = t * Math.PI * 0.6;
          seg.position.set(
            -segLen * 0.5 * Math.cos(curveAngle) * (1 + t * 0.3),
            segLen * 0.5 * Math.sin(curveAngle) * 0.8 + t * 0.4,
            0
          );
          seg.rotation.z = curveAngle * 0.5;
          tailGroup.add(seg);
          disposables.push(segGeom);
        }

        const legGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.3, 8);
        disposables.push(legGeom);
        const pawGeom = new THREE.SphereGeometry(0.07, 8, 8);
        pawGeom.scale(1.2, 0.6, 1.4);
        disposables.push(pawGeom);

        const legData = [
          { x: 0.45, z: 0.3 },
          { x: 0.45, z: -0.3 },
          { x: -0.45, z: 0.3 },
          { x: -0.45, z: -0.3 },
        ];
        legData.forEach(pos => {
          const leg = new THREE.Mesh(legGeom, furMat);
          leg.position.set(pos.x, 0, pos.z);
          bodyMesh.add(leg);
          const paw = new THREE.Mesh(pawGeom, furMat);
          paw.position.set(pos.x, -0.15, pos.z);
          bodyMesh.add(paw);
        });

        const pizzaGroup = new THREE.Group();
        pizzaGroup.position.set(0.55, -0.15, 0);
        pizzaGroup.rotation.set(0.1, 0.8, -0.2);
        headGroup.add(pizzaGroup);

        const sliceShape = new THREE.Shape();
        sliceShape.moveTo(0, 0);
        sliceShape.lineTo(-0.55, 0.85);
        sliceShape.quadraticCurveTo(-0.5, 0.95, -0.35, 1.0);
        sliceShape.lineTo(0.35, 1.0);
        sliceShape.quadraticCurveTo(0.5, 0.95, 0.55, 0.85);
        sliceShape.lineTo(0, 0);

        const sliceGeom = new THREE.ExtrudeGeometry(sliceShape, {
          depth: 0.08,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelSegments: 2,
        });
        sliceGeom.rotateX(-Math.PI / 2);
        sliceGeom.translate(0, 0, -0.5);
        const sliceMat = new THREE.MeshStandardMaterial({
          map: pizzaTextures.map,
          emissiveMap: noir ? pizzaTextures.emissiveMap : undefined,
          emissive: noir ? 0xffffff : 0x000000,
          emissiveIntensity: noir ? 1.2 : 0.0,
          roughness: 0.55,
          metalness: 0.05,
        });
        const pizzaSlice = new THREE.Mesh(sliceGeom, sliceMat);
        pizzaGroup.add(pizzaSlice);
        disposables.push(sliceGeom, sliceMat);

        const crustGeom = new THREE.TorusGeometry(0.52, 0.06, 8, 16, Math.PI * 0.72);
        const crustMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0xff8c00, emissive: 0xff8c00, emissiveIntensity: 0.6, roughness: 0.4 }
            : { color: 0xa07840, roughness: 0.75, metalness: 0.05 }
        );
        const crust = new THREE.Mesh(crustGeom, crustMat);
        crust.position.set(0, 0.02, -0.95);
        crust.rotation.x = Math.PI / 2;
        crust.rotation.z = Math.PI;
        pizzaGroup.add(crust);
        disposables.push(crustGeom, crustMat);

        if (noir) {
          const glowColor = [0x00f0ff, 0xff2a55, 0x39ff14][Math.floor(Math.random() * 3)];
          const ringGeom = new THREE.RingGeometry(1.0, 1.08, 32);
          const ringMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.position.set(0, 0.5, 0);
          ring.rotation.x = Math.PI / 2;
          bodyMesh.add(ring);
          disposables.push(ringGeom, ringMat);
        }

        scene.add(group);
        return { group, bodyMesh, headGroup, tailGroup, pizzaGroup, leftEar, rightEar };
      };

      const getBounds = () => {
        const vFOV = (camera.fov * Math.PI) / 180;
        const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
        const visibleWidth = visibleHeight * camera.aspect;
        return { width: visibleWidth, height: visibleHeight };
      };

      const bounds = getBounds();
      const ratParts = create3DPizzaRat(isNoirRef.current);

      const spawnX = -(bounds.width * 0.5 + 3);
      const z = (Math.random() - 0.5) * 2.0;
      const groundY = -bounds.height / 2 + 1.2;
      const y = groundY + z * 0.15;
      const scaleVal = 1.15 + (z / 2.0) * 0.12;
      ratParts.group.position.set(spawnX, y, z);
      ratParts.group.scale.set(scaleVal, scaleVal, scaleVal);

      const runSpeed = 1.6 + Math.random() * 0.6;
      const targetRotY = Math.PI / 2;
      ratParts.group.rotation.y = targetRotY;

      rat = {
        group: ratParts.group,
        bodyMesh: ratParts.bodyMesh,
        headGroup: ratParts.headGroup,
        tailGroup: ratParts.tailGroup,
        pizzaGroup: ratParts.pizzaGroup,
        leftEar: ratParts.leftEar,
        rightEar: ratParts.rightEar,
        position: { x: spawnX, y: groundY, z },
        velocity: { x: runSpeed, y: 0, z: 0 },
        targetRotY,
        bouncePhase: Math.random() * Math.PI * 2,
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseleave', handleMouseLeave);

      let lastTime = performance.now();

      const animate = () => {
        if (!active) return;
        animationFrameId = requestAnimationFrame(animate);
        if (!isTabVisible || !rat) return;

        const currentTime = performance.now();
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;

        const currentBounds = getBounds();

        if (mouseActive) {
          const targetX = mouseNormX * currentBounds.width * 0.4;
          const pull = (targetX - rat.position.x) * 2.5;
          rat.velocity.x += pull * dt;
          rat.velocity.x *= (1 - 4.0 * dt);
          const maxSpeed = 8.0;
          rat.velocity.x = Math.max(-maxSpeed, Math.min(maxSpeed, rat.velocity.x));
        } else {
          const defaultSpeed = rat.targetRotY === Math.PI / 2 ? 1.6 : -1.6;
          rat.velocity.x += (defaultSpeed - rat.velocity.x) * dt * 2.5;
        }

        if (rat.velocity.x > 0.05) rat.targetRotY = Math.PI / 2;
        else if (rat.velocity.x < -0.05) rat.targetRotY = -Math.PI / 2;

        rat.position.x += rat.velocity.x * dt;

        rat.bouncePhase += dt * 2.5;
        const sineVal = Math.sin(rat.bouncePhase);
        const bounceHeight = 0.7;
        const currentHeight = Math.abs(sineVal) * bounceHeight;

        const hFactor = Math.abs(sineVal);
        const scaleY = 0.92 + hFactor * 0.2;
        const scaleX = 1.06 - hFactor * 0.12;
        const scaleZ = 1.06 - hFactor * 0.12;
        rat.bodyMesh.scale.set(scaleX, scaleY, scaleZ);

        const headTilt = Math.sin(rat.bouncePhase * 1.8) * 0.035;
        rat.headGroup.rotation.z = headTilt;
        const headNod = Math.sin(rat.bouncePhase * 3.5) * 0.025;
        const speedFactor = Math.min(Math.abs(rat.velocity.x) / 4.0, 1.0);
        rat.headGroup.rotation.x = headNod - speedFactor * 0.06;

        const earWiggle = Math.sin(currentTime * 0.005) * 0.06;
        const earForward = speedFactor * 0.15;
        rat.leftEar.rotation.z = 0.4 + earWiggle - earForward;
        rat.rightEar.rotation.z = 0.4 - earWiggle - earForward;

        const tailSway = Math.sin(currentTime * 0.0025) * 0.4;
        const tailDrag = rat.velocity.x * 0.02;
        rat.tailGroup.rotation.y = tailSway + tailDrag;
        rat.tailGroup.rotation.x = Math.sin(currentTime * 0.002 + 0.5) * 0.1;

        const pizzaTilt = Math.sin(rat.bouncePhase * 2.0) * 0.08;
        rat.pizzaGroup.rotation.z = -0.2 + pizzaTilt;

        const targetLean = -rat.velocity.x * 0.02;
        rat.group.rotation.z += (targetLean - rat.group.rotation.z) * 0.06;

        let diff = rat.targetRotY - rat.group.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        rat.group.rotation.y += diff * 0.07;

        const localGroundY = rat.position.y + rat.position.z * 0.15;
        rat.group.position.set(rat.position.x, localGroundY + currentHeight, rat.position.z);

        if (isNoirRef.current) {
          const bodyMat = rat.bodyMesh.material as MeshStandardMaterial;
          if (bodyMat) {
            const pulse = 1.0 + Math.sin(currentTime * 0.005) * 0.5;
            bodyMat.emissiveIntensity = pulse;
          }
        }

        const sideLimit = currentBounds.width / 2 + 1.5;
        if (rat.position.x < -sideLimit && rat.velocity.x < 0) {
          rat.velocity.x *= -1.0;
          rat.targetRotY = Math.PI / 2;
        } else if (rat.position.x > sideLimit && rat.velocity.x > 0) {
          rat.velocity.x *= -1.0;
          rat.targetRotY = -Math.PI / 2;
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

    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibility);

      if (scene && rat) {
        scene.remove(rat.group);
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

  return <div className="pizza-rat-canvas-container" ref={containerRef} />;
}
