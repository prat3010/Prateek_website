'use client';

import React, { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface GremlinPhysics {
  group: any; // THREE.Group
  radius: number;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  rotationSpeed: { x: number; y: number; z: number };
  driftSeed: number;
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
    let animationFrameId: number;
    let renderer: any; // THREE.WebGLRenderer
    let scene: any; // THREE.Scene
    let camera: any; // THREE.PerspectiveCamera
    const gremlins: GremlinPhysics[] = [];
    const disposables: any[] = []; // To track meshes/geometries/materials for cleanup

    const init = async () => {
      // Dynamic import of Three.js so it isn't bundled on initial site load
      const THREE = await import('three');
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
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

      // 5. Procedural 3D Gremlin Constructor
      const create3DGremlin = (noir: boolean) => {
        const group = new THREE.Group();

        // Theme materials
        const bodyMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0x18181b, roughness: 0.2, metalness: 0.1, emissive: 0x08080a }
            : { color: 0x5a8eb6, roughness: 0.6, metalness: 0.0 } // Slate Blue
        );
        const earMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0x1c1c24, roughness: 0.3, emissive: 0x121214 }
            : { color: 0xd95d67, roughness: 0.6 } // Terracotta Red
        );
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.1 });
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x2b2b36, roughness: 0.1 });
        const cheekMat = new THREE.MeshStandardMaterial(
          noir
            ? { color: 0xff2a55, emissive: 0xff2a55, emissiveIntensity: 0.7 } // Neon Pink Blush
            : { color: 0xdf8b98, roughness: 0.7 } // Soft Peach
        );

        // Keep track of materials for cleanup
        disposables.push(bodyMat, earMat, eyeMat, pupilMat, cheekMat);

        // -- Main Body (Rounded capsule look made from sphere + cylinder) --
        const bodyGeom = new THREE.SphereGeometry(1.0, 32, 32);
        bodyGeom.scale(1.0, 1.25, 1.0); // Stretch vertically
        const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(bodyMesh);
        disposables.push(bodyGeom);

        // -- Left & Right Ears (Pointy Cones) --
        const earGeom = new THREE.ConeGeometry(0.35, 1.1, 16);
        disposables.push(earGeom);

        const leftEar = new THREE.Mesh(earGeom, earMat);
        leftEar.position.set(-0.85, 0.45, 0);
        leftEar.rotation.z = Math.PI / 3.2; // Angle outward
        leftEar.rotation.y = -Math.PI / 8;  // Angle forward
        group.add(leftEar);

        const rightEar = new THREE.Mesh(earGeom, earMat);
        rightEar.position.set(0.85, 0.45, 0);
        rightEar.rotation.z = -Math.PI / 3.2;
        rightEar.rotation.y = Math.PI / 8;
        group.add(rightEar);

        // -- Large Eyes (Spheres) --
        const eyeGeom = new THREE.SphereGeometry(0.26, 16, 16);
        disposables.push(eyeGeom);

        const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
        leftEye.position.set(-0.35, 0.15, 0.8);
        group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
        rightEye.position.set(0.35, 0.15, 0.8);
        group.add(rightEye);

        // -- Pupils (Spheres) --
        const pupilGeom = new THREE.SphereGeometry(0.1, 16, 16);
        disposables.push(pupilGeom);

        const leftPupil = new THREE.Mesh(pupilGeom, pupilMat);
        leftPupil.position.set(-0.35, 0.15, 1.02);
        group.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeom, pupilMat);
        rightPupil.position.set(0.35, 0.15, 1.02);
        group.add(rightPupil);

        // -- Blushing Cheeks (Flat Spheres) --
        const cheekGeom = new THREE.SphereGeometry(0.18, 16, 16);
        cheekGeom.scale(1.2, 0.8, 0.5); // Flatten cheek
        disposables.push(cheekGeom);

        const leftCheek = new THREE.Mesh(cheekGeom, cheekMat);
        leftCheek.position.set(-0.65, -0.15, 0.75);
        leftCheek.rotation.y = Math.PI / 6;
        group.add(leftCheek);

        const rightCheek = new THREE.Mesh(cheekGeom, cheekMat);
        rightCheek.position.set(0.65, -0.15, 0.75);
        rightCheek.rotation.y = -Math.PI / 6;
        group.add(rightCheek);

        // -- Mouth Line --
        const mouthGeom = new THREE.TorusGeometry(0.2, 0.04, 8, 24, Math.PI);
        const mouthMat = new THREE.MeshBasicMaterial({ color: noir ? 0x00f0ff : 0x2b2b36 }); // Cyan / Charcoal
        const mouth = new THREE.Mesh(mouthGeom, mouthMat);
        mouth.position.set(0, -0.22, 0.95);
        mouth.rotation.x = Math.PI; // Flip Torus upside down for small smile
        group.add(mouth);
        disposables.push(mouthGeom, mouthMat);

        // -- Neon accent ring if in Noir mode --
        if (noir) {
          const glowColor = [0x00f0ff, 0xff2a55, 0x39ff14, 0xffe600][Math.floor(Math.random() * 4)];
          const ringGeom = new THREE.RingGeometry(1.05, 1.12, 32);
          const ringMat = new THREE.MeshBasicMaterial({ 
            color: glowColor, 
            side: THREE.DoubleSide, 
            transparent: true,
            opacity: 0.8
          });
          const ring = new THREE.Mesh(ringGeom, ringMat);
          ring.position.set(0, 0, -0.1);
          group.add(ring);
          disposables.push(ringGeom, ringMat);
        }

        scene.add(group);
        return group;
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
        const group = create3DGremlin(themeNoir);

        // Distribute randomly offscreen below
        const x = (Math.random() - 0.5) * bounds.width;
        const y = -bounds.height / 2 - 3 - Math.random() * 8; // Spawn below
        const z = (Math.random() - 0.5) * 6; // varying depth

        group.position.set(x, y, z);

        // Bounding radius for collision calculations
        const radius = 1.35;

        // Set scaling based on z depth to look perspective-correct
        const scaleVal = 0.8 + Math.random() * 0.4;
        group.scale.set(scaleVal, scaleVal, scaleVal);

        // Speeds
        const speedY = 1.2 + Math.random() * 1.5;
        const speedX = (Math.random() - 0.5) * 0.8;
        const speedZ = (Math.random() - 0.5) * 0.4;

        gremlins.push({
          group,
          radius: radius * scaleVal,
          position: { x, y, z },
          velocity: { x: speedX, y: speedY, z: speedZ },
          rotationSpeed: {
            x: (Math.random() - 0.5) * 0.8,
            y: (Math.random() - 0.5) * 1.2,
            z: (Math.random() - 0.5) * 0.5
          },
          driftSeed: Math.random() * 100
        });
      }

      // 7. Resize Event Handler
      const handleResize = () => {
        if (!camera || !renderer) return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      // 8. Physics & Animation loop
      let lastTime = performance.now();

      const animate = () => {
        if (!active) return;
        animationFrameId = requestAnimationFrame(animate);

        const currentTime = performance.now();
        const dt = Math.min((currentTime - lastTime) / 1000, 0.1); // cap dt
        lastTime = currentTime;

        const currentBounds = getBounds();

        // A. Move each gremlin and apply drift forces
        gremlins.forEach((gremlin) => {
          // Horizontal wavy drift force
          gremlin.driftSeed += dt * 1.5;
          const driftX = Math.sin(gremlin.driftSeed) * 0.015;
          gremlin.velocity.x += driftX;

          // Apply velocity
          gremlin.position.x += gremlin.velocity.x * dt;
          gremlin.position.y += gremlin.velocity.y * dt;
          gremlin.position.z += gremlin.velocity.z * dt;

          // Apply rotations
          gremlin.group.rotation.x += gremlin.rotationSpeed.x * dt;
          gremlin.group.rotation.y += gremlin.rotationSpeed.y * dt;
          gremlin.group.rotation.z += gremlin.rotationSpeed.z * dt;

          // Sync Three.js mesh transform
          gremlin.group.position.set(gremlin.position.x, gremlin.position.y, gremlin.position.z);

          // Boundary checks: if went off top screen, reset at the bottom
          const topLimit = currentBounds.height / 2 + 3.0;
          if (gremlin.position.y > topLimit) {
            gremlin.position.y = -currentBounds.height / 2 - 3.0;
            gremlin.position.x = (Math.random() - 0.5) * currentBounds.width;
            gremlin.velocity.y = 1.2 + Math.random() * 1.5;
            gremlin.velocity.x = (Math.random() - 0.5) * 0.8;
          }

          // Wall bounce (Left/Right bounds check)
          const sideLimit = currentBounds.width / 2;
          if (gremlin.position.x < -sideLimit && gremlin.velocity.x < 0) {
            gremlin.velocity.x *= -1.0;
          } else if (gremlin.position.x > sideLimit && gremlin.velocity.x > 0) {
            gremlin.velocity.x *= -1.0;
          }
        });

        // B. Handle Elastic Collisions (Physics Sweep)
        for (let i = 0; i < gremlins.length; i++) {
          for (let j = i + 1; j < gremlins.length; j++) {
            const g1 = gremlins[i];
            const g2 = gremlins[j];

            const dx = g2.position.x - g1.position.x;
            const dy = g2.position.y - g1.position.y;
            const dz = g2.position.z - g1.position.z;
            const distSq = dx * dx + dy * dy + dz * dz;

            const minDist = g1.radius + g2.radius;

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001; // Avoid divide by zero

              // Collision Normal Vector
              const nx = dx / dist;
              const ny = dy / dist;
              const nz = dz / dist;

              // 1. Separate the overlapping spheres
              const overlap = minDist - dist;
              g1.position.x -= nx * overlap * 0.51; // push back slightly more than 50% to prevent sticking
              g1.position.y -= ny * overlap * 0.51;
              g1.position.z -= nz * overlap * 0.51;

              g2.position.x += nx * overlap * 0.51;
              g2.position.y += ny * overlap * 0.51;
              g2.position.z += nz * overlap * 0.51;

              // 2. Elastic Collision impulse calculations
              const rvx = g2.velocity.x - g1.velocity.x;
              const rvy = g2.velocity.y - g1.velocity.y;
              const rvz = g2.velocity.z - g1.velocity.z;

              const velAlongNormal = rvx * nx + rvy * ny + rvz * nz;

              // Do not bounce if they are already moving apart
              if (velAlongNormal < 0) {
                const restitution = 0.85; // highly bouncy
                const impulseScalar = -(1 + restitution) * velAlongNormal / 2; // Assuming equal mass particles

                g1.velocity.x -= impulseScalar * nx;
                g1.velocity.y -= impulseScalar * ny;
                g1.velocity.z -= impulseScalar * nz;

                g2.velocity.x += impulseScalar * nx;
                g2.velocity.y += impulseScalar * ny;
                g2.velocity.z += impulseScalar * nz;

                // Add slight torque change on collision
                g1.rotationSpeed.y += (Math.random() - 0.5) * 1.5;
                g2.rotationSpeed.y -= (Math.random() - 0.5) * 1.5;
              }
            }
          }
        }

        renderer.render(scene, camera);
      };

      animate();
    };

    init();

    // 9. CLEANUP / LIFECYCLE DISPOSAL
    return () => {
      active = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      // Clean up window resize listener
      // eslint-disable-next-line react-hooks/exhaustive-deps
      window.removeEventListener('resize', () => {});

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
