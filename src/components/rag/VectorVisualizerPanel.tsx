"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { RetrieverClient } from "@/lib/rag-client";
import {
  EmbeddingProjectionResponse,
  ProjectedPoint,
} from "@/lib/rag-types";

import styles from "./rag.module.css";

// Distinctive palette for clusters in Azure & Noir themes
const CLUSTER_COLORS = [
  "#00E5FF", // Neon Cyan
  "#00E676", // Emerald Green
  "#FF9100", // Amber Orange
  "#E040FB", // Magenta Purple
  "#2979FF", // Royal Blue
  "#FF5252", // Bright Coral
  "#FFD600", // Bright Yellow
  "#7C4DFF", // Deep Violet
  "#00B0FF", // Sky Blue
  "#1DE9B6", // Teal
];

const OUTLIER_COLOR = "#888888";
const QUERY_BEACON_COLOR = "#FFEA00";

interface VectorVisualizerPanelProps {
  client: RetrieverClient | null;
  hidden?: boolean;
}

export function VectorVisualizerPanel({ client, hidden }: VectorVisualizerPanelProps) {
  const [data, setData] = useState<EmbeddingProjectionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Projection configuration state
  const [method, setMethod] = useState<"pca" | "tsne" | "umap">("pca");
  const [dimensions, setDimensions] = useState<2 | 3>(3);
  const [normalize, setNormalize] = useState<boolean>(true);
  const [selectedClusterId, setSelectedClusterId] = useState<number | null>(null);

  // Live Query Vector Projection state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [projectingQuery, setProjectingQuery] = useState<boolean>(false);
  const [activeQueryPoint, setActiveQueryPoint] = useState<ProjectedPoint | null>(null);

  // Inspector & Hovered node state
  const [hoveredPoint, setHoveredPoint] = useState<ProjectedPoint | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<ProjectedPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [viewMode, setViewMode] = useState<"3d" | "table">("3d");

  // Three.js refs
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointCloudGroupRef = useRef<THREE.Group | null>(null);
  const queryBeaconGroupRef = useRef<THREE.Group | null>(null);
  const pointsMeshMapRef = useRef<Map<THREE.Object3D, ProjectedPoint>>(new Map());
  const reqAnimFrameRef = useRef<number | null>(null);

  // Orbit rotation drag state
  const isDraggingRef = useRef<boolean>(false);
  const previousMousePositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotationRef = useRef<{ theta: number; phi: number; radius: number }>({
    theta: Math.PI / 4,
    phi: Math.PI / 4,
    radius: 240,
  });

  // Fetch projection from Retriever API
  const fetchProjection = useCallback(
    async (overrideQueryVector?: number[]) => {
      if (!client) return;
      setLoading(true);
      setError(null);
      try {
        const res = await client.projectEmbeddings({
          method,
          dimensions,
          normalize,
          query_vector: overrideQueryVector,
        });
        setData(res);
        if (res.query_point) {
          setActiveQueryPoint(res.query_point);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to project embeddings";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [client, method, dimensions, normalize]
  );

  useEffect(() => {
    let isMounted = true;
    if (!hidden && client) {
      Promise.resolve().then(async () => {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        try {
          const res = await client.projectEmbeddings({
            method,
            dimensions,
            normalize,
          });
          if (isMounted) {
            setData(res);
            if (res.query_point) {
              setActiveQueryPoint(res.query_point);
            }
          }
        } catch (err: unknown) {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : "Failed to project embeddings";
            setError(msg);
          }
        } finally {
          if (isMounted) setLoading(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [hidden, client, method, dimensions, normalize]);



  // Handle Search Query projection
  const handleProjectSearchQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !searchQuery.trim()) return;
    setProjectingQuery(true);
    setError(null);
    try {
      // Execute hybrid search to get query representation or candidate chunks
      const searchRes = await client.search(searchQuery.trim(), { limit: 5 });
      if (searchRes && searchRes.results && searchRes.results.length > 0) {
        // Re-fetch projection with active query
        await fetchProjection();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Query projection search failed";
      setError(msg);
    } finally {
      setProjectingQuery(false);
    }
  };

  // Update Camera position from spherical coordinates
  const updateCameraPosition = useCallback(() => {
    const camera = cameraRef.current;
    if (!camera) return;
    const { theta, phi, radius } = cameraRotationRef.current;
    const clampedPhi = Math.max(0.01, Math.min(Math.PI - 0.01, phi));
    cameraRotationRef.current.phi = clampedPhi;

    camera.position.x = radius * Math.sin(clampedPhi) * Math.sin(theta);
    camera.position.y = dimensions === 2 ? 0 : radius * Math.cos(clampedPhi);
    camera.position.z = radius * Math.sin(clampedPhi) * Math.cos(theta);
    camera.lookAt(0, 0, 0);
  }, [dimensions]);

  // Initialize Three.js WebGL Scene
  useEffect(() => {
    if (hidden || viewMode !== "3d") return;
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    cameraRef.current = camera;
    updateCameraPosition();

    // WebGL Renderer
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      container.innerHTML = "";
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn("WebGL renderer creation skipped or not supported in environment:", e);
      return;
    }

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(100, 200, 100);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00e5ff, 0.4);
    dirLight2.position.set(-100, -100, -100);
    scene.add(dirLight2);

    // Bounding Grid & Axis Helpers
    const gridHelper = new THREE.GridHelper(200, 20, 0x00f0ff, 0x223344);
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // Groups
    const pointCloudGroup = new THREE.Group();
    scene.add(pointCloudGroup);
    pointCloudGroupRef.current = pointCloudGroup;

    const queryBeaconGroup = new THREE.Group();
    scene.add(queryBeaconGroup);
    queryBeaconGroupRef.current = queryBeaconGroup;

    // Raycaster for hover/selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle drag rotation
      if (isDraggingRef.current) {
        const deltaX = e.clientX - previousMousePositionRef.current.x;
        const deltaY = e.clientY - previousMousePositionRef.current.y;

        cameraRotationRef.current.theta -= deltaX * 0.008;
        if (dimensions === 3) {
          cameraRotationRef.current.phi -= deltaY * 0.008;
        }
        updateCameraPosition();
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting for Hover Tooltip
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pointCloudGroup.children, false);
        if (intersects.length > 0) {
          const hitObj = intersects[0].object;
          const pt = pointsMeshMapRef.current.get(hitObj);
          if (pt) {
            setHoveredPoint(pt);
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            container.style.cursor = "pointer";
            return;
          }
        }
        setHoveredPoint(null);
        setTooltipPos(null);
        container.style.cursor = isDraggingRef.current ? "grabbing" : "grab";
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      container.style.cursor = "grabbing";
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      container.style.cursor = "grab";
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.15;
      cameraRotationRef.current.radius = Math.max(50, Math.min(600, cameraRotationRef.current.radius + zoomFactor));
      updateCameraPosition();
    };

    const handleClick = () => {
      if (hoveredPoint) {
        setSelectedPoint(hoveredPoint);
      }
    };

    const canvasDom = renderer.domElement;
    canvasDom.addEventListener("mousemove", handlePointerMove);
    canvasDom.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("mouseup", handlePointerUp);
    canvasDom.addEventListener("wheel", handleWheel, { passive: false });
    canvasDom.addEventListener("click", handleClick);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newW / newH;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    // Animation Render Loop
    let pulseAngle = 0;
    const animate = () => {
      reqAnimFrameRef.current = requestAnimationFrame(animate);

      // Subtle slow auto-rotation when idle
      if (!isDraggingRef.current) {
        pointCloudGroup.rotation.y += 0.0012;
        if (queryBeaconGroup) {
          queryBeaconGroup.rotation.y += 0.0012;
        }
      }

      // Animate pulsing query beacon if present
      if (queryBeaconGroup && queryBeaconGroup.children.length > 0) {
        pulseAngle += 0.05;
        const scale = 1.0 + 0.25 * Math.sin(pulseAngle);
        queryBeaconGroup.children.forEach((child) => {
          if (child instanceof THREE.Mesh && child.name === "beaconPulse") {
            child.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (reqAnimFrameRef.current) {
        cancelAnimationFrame(reqAnimFrameRef.current);
      }
      resizeObserver.disconnect();
      canvasDom.removeEventListener("mousemove", handlePointerMove);
      canvasDom.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("mouseup", handlePointerUp);
      canvasDom.removeEventListener("wheel", handleWheel);
      canvasDom.removeEventListener("click", handleClick);

      renderer.dispose();
      scene.clear();
    };
  }, [hidden, viewMode, dimensions, updateCameraPosition, hoveredPoint]);

  // Update Points & Meshes in Three.js Scene whenever data changes
  useEffect(() => {
    const pointCloudGroup = pointCloudGroupRef.current;
    if (!pointCloudGroup || !data) return;

    // Clear existing meshes
    while (pointCloudGroup.children.length > 0) {
      const obj = pointCloudGroup.children[0];
      pointCloudGroup.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    }
    pointsMeshMapRef.current.clear();

    const sphereGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sphereMatMap = new Map<string, THREE.MeshStandardMaterial>();

    const getColorForCluster = (cid: number) => {
      if (cid === -1) return OUTLIER_COLOR;
      const idx = Math.abs(cid) % CLUSTER_COLORS.length;
      return CLUSTER_COLORS[idx];
    };

    // Render Chunks
    data.points.forEach((pt) => {
      const isFilteredOut = selectedClusterId !== null && pt.cluster_id !== selectedClusterId;
      const hex = getColorForCluster(pt.cluster_id);

      if (!sphereMatMap.has(hex)) {
        sphereMatMap.set(
          hex,
          new THREE.MeshStandardMaterial({
            color: new THREE.Color(hex),
            roughness: 0.2,
            metalness: 0.8,
            emissive: new THREE.Color(hex),
            emissiveIntensity: 0.35,
          })
        );
      }

      const mat = sphereMatMap.get(hex)!;
      const mesh = new THREE.Mesh(sphereGeo, mat);

      const [x, y, z] = pt.coordinates;
      mesh.position.set(x || 0, dimensions === 2 ? 0 : y || 0, dimensions === 2 ? y || 0 : z || 0);

      if (isFilteredOut) {
        mesh.scale.set(0.4, 0.4, 0.4);
        mesh.visible = false;
      }

      pointCloudGroup.add(mesh);
      pointsMeshMapRef.current.set(mesh, pt);
    });

    // Render Centroid Marker Beacons
    data.centroids.forEach((centroid) => {
      if (selectedClusterId !== null && centroid.cluster_id !== selectedClusterId) return;
      const [cx, cy, cz] = centroid.coordinates;
      const hex = getColorForCluster(centroid.cluster_id);

      const ringGeo = new THREE.RingGeometry(6, 7.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(hex),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(cx || 0, dimensions === 2 ? 0 : cy || 0, dimensions === 2 ? cy || 0 : cz || 0);
      ringMesh.rotation.x = Math.PI / 2;
      pointCloudGroup.add(ringMesh);
    });

    // Render Active Query Vector Beacon if available
    const queryGroup = queryBeaconGroupRef.current;
    if (queryGroup) {
      while (queryGroup.children.length > 0) {
        const obj = queryGroup.children[0];
        queryGroup.remove(obj);
      }

      const qPt = activeQueryPoint || data.query_point;
      if (qPt) {
        const [qx, qy, qz] = qPt.coordinates;
        const qPos = new THREE.Vector3(qx || 0, dimensions === 2 ? 0 : qy || 0, dimensions === 2 ? qy || 0 : qz || 0);

        // Pulsing Yellow Beacon
        const beaconGeo = new THREE.SphereGeometry(6, 24, 24);
        const beaconMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(QUERY_BEACON_COLOR),
          emissive: new THREE.Color(QUERY_BEACON_COLOR),
          emissiveIntensity: 0.9,
          roughness: 0.1,
        });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.name = "beaconPulse";
        beaconMesh.position.copy(qPos);
        queryGroup.add(beaconMesh);

        // Laser Ray lines to nearest 3 document points
        const pointsWithDist = data.points
          .map((p) => {
            const [px, py, pz] = p.coordinates;
            const pVec = new THREE.Vector3(px || 0, dimensions === 2 ? 0 : py || 0, dimensions === 2 ? py || 0 : pz || 0);
            return { pt: p, vec: pVec, dist: qPos.distanceTo(pVec) };
          })
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);

        pointsWithDist.forEach(({ vec }) => {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([qPos, vec]);
          const lineMat = new THREE.LineBasicMaterial({
            color: new THREE.Color(QUERY_BEACON_COLOR),
            transparent: true,
            opacity: 0.65,
            linewidth: 2,
          });
          const line = new THREE.Line(lineGeo, lineMat);
          queryGroup.add(line);
        });
      }
    }
  }, [data, dimensions, selectedClusterId, activeQueryPoint]);

  if (hidden) return null;

  return (
    <div className={styles.panel} data-lenis-prevent style={{ position: "relative" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
        <div>
          <h2 className={styles.panelTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🪐</span>
            <span>3D Embedding Space Explorer</span>
            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "12px", background: "rgba(0, 229, 255, 0.15)", color: "var(--pop-cyan, #00e5ff)", border: "1px solid rgba(0, 229, 255, 0.3)" }}>
              Milestone 82 SOTA
            </span>
          </h2>
          <p className={styles.panelDesc} style={{ margin: 0 }}>
            Interactive 3D manifold projection of 768-dim pgvector embeddings clustered via Scikit-Learn HDBSCAN & c-TF-IDF.
          </p>
        </div>

        {/* Live Metrics Header Pills */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.8rem" }}>
            <span style={{ opacity: 0.6 }}>Total Chunks: </span>
            <strong style={{ color: "var(--pop-cyan, #00e5ff)" }}>{data ? data.total_points : 0}</strong>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.8rem" }}>
            <span style={{ opacity: 0.6 }}>Silhouette Score: </span>
            <strong style={{ color: (data?.silhouette_score || 0) > 0.3 ? "#00E676" : "#FF9100" }}>
              {data?.silhouette_score !== null && data?.silhouette_score !== undefined
                ? data.silhouette_score.toFixed(3)
                : "N/A"}
            </strong>
          </div>
          {data?.variance_explained && (
            <div style={{ background: "rgba(255,255,255,0.04)", padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--color-border)", fontSize: "0.8rem" }}>
              <span style={{ opacity: 0.6 }}>Variance: </span>
              <strong>{((data.variance_explained.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%</strong>
            </div>
          )}
        </div>
      </div>

      {/* Control Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", padding: "0.75rem 1rem", background: "var(--surface-elevated, rgba(0,0,0,0.2))", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "1rem" }}>
        {/* Left Controls: Method, Dims, Normalize */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ opacity: 0.7 }}>Algorithm:</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as "pca" | "tsne" | "umap")}
              style={{ background: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              <option value="pca">PCA (Deterministic)</option>
              <option value="tsne">t-SNE (Non-Linear)</option>
              <option value="umap">UMAP (Topological)</option>
            </select>
          </label>

          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ opacity: 0.7 }}>Dimensions:</span>
            <select
              value={dimensions}
              onChange={(e) => setDimensions(Number(e.target.value) as 2 | 3)}
              style={{ background: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)", borderRadius: "4px", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            >
              <option value={3}>3D Cartesian (x, y, z)</option>
              <option value={2}>2D Planar (x, y)</option>
            </select>
          </label>

          <label style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.35rem", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={normalize}
              onChange={(e) => setNormalize(e.target.checked)}
            />
            <span style={{ opacity: 0.8 }}>Normalize [-100, 100]</span>
          </label>
        </div>

        {/* Right Controls: View mode & Reset Camera */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => {
              cameraRotationRef.current = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 240 };
              updateCameraPosition();
            }}
            className="comic-btn"
            style={{ padding: "0.25rem 0.65rem", fontSize: "0.78rem" }}
            title="Reset Camera Orientation"
          >
            ↺ Reset Camera
          </button>

          <div style={{ display: "inline-flex", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setViewMode("3d")}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.78rem",
                background: viewMode === "3d" ? "var(--color-link, #00e5ff)" : "transparent",
                color: viewMode === "3d" ? "#000" : "var(--color-text)",
                border: "none",
                cursor: "pointer",
                fontWeight: viewMode === "3d" ? 600 : 400,
              }}
            >
              🪐 3D Cloud
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "0.25rem 0.6rem",
                fontSize: "0.78rem",
                background: viewMode === "table" ? "var(--color-link, #00e5ff)" : "transparent",
                color: viewMode === "table" ? "#000" : "var(--color-text)",
                border: "none",
                cursor: "pointer",
                fontWeight: viewMode === "table" ? 600 : 400,
              }}
            >
              📋 Table View
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Search Vector Projection Bar */}
      <form onSubmit={handleProjectSearchQuery} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type search query to project dynamic vector beacon (e.g. 'Stripe billing escrow webhook')..."
          className={styles.input}
          style={{ margin: 0, flex: 1, fontSize: "0.85rem" }}
        />
        <button
          type="submit"
          disabled={projectingQuery || loading || !client}
          className="comic-btn comic-btn-blue"
          style={{ padding: "0.4rem 0.9rem", fontSize: "0.82rem", whiteSpace: "nowrap" }}
        >
          {projectingQuery ? "Projecting..." : "⚡ Project Query Beacon"}
        </button>
        {activeQueryPoint && (
          <button
            type="button"
            onClick={() => setActiveQueryPoint(null)}
            className="comic-btn"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.8rem" }}
            title="Clear Query Beacon"
          >
            ✕ Clear Beacon
          </button>
        )}
      </form>

      {/* Topic Cluster Filter Pills */}
      {data && data.centroids.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <span style={{ fontSize: "0.75rem", opacity: 0.6, marginRight: "0.25rem" }}>Filter Topic:</span>
          <button
            onClick={() => setSelectedClusterId(null)}
            style={{
              padding: "0.2rem 0.6rem",
              borderRadius: "12px",
              fontSize: "0.75rem",
              border: selectedClusterId === null ? "1px solid #00E5FF" : "1px solid var(--color-border)",
              background: selectedClusterId === null ? "rgba(0, 229, 255, 0.2)" : "rgba(255,255,255,0.04)",
              color: "var(--color-text)",
              cursor: "pointer",
            }}
          >
            All Clusters ({data.total_points})
          </button>

          {data.centroids.map((c) => {
            const hex = CLUSTER_COLORS[Math.abs(c.cluster_id) % CLUSTER_COLORS.length];
            const isSelected = selectedClusterId === c.cluster_id;
            return (
              <button
                key={c.cluster_id}
                onClick={() => setSelectedClusterId(isSelected ? null : c.cluster_id)}
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  border: isSelected ? `1px solid ${hex}` : "1px solid var(--color-border)",
                  background: isSelected ? `${hex}33` : "rgba(255,255,255,0.04)",
                  color: "var(--color-text)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: hex, display: "inline-block" }} />
                <span>{c.cluster_label}</span>
                <span style={{ opacity: 0.6 }}>({c.chunk_count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main 3D Canvas / Table View Area */}
      {viewMode === "3d" ? (
        <div
          ref={mountRef}
          style={{
            width: "100%",
            height: "520px",
            background: "radial-gradient(circle at center, rgba(14, 23, 42, 0.7) 0%, rgba(8, 12, 22, 0.95) 100%)",
            borderRadius: "8px",
            border: "1px solid var(--color-border)",
            position: "relative",
            overflow: "hidden",
            cursor: "grab",
          }}
        >
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", zIndex: 10 }}>
              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: "1.5rem", display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span>
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.8 }}>Computing Dimensionality Reduction ({method.toUpperCase()})...</p>
              </div>
            </div>
          )}

          {error && (
            <div style={{ position: "absolute", top: "1rem", left: "1rem", right: "1rem", padding: "0.75rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#ef4444", fontSize: "0.82rem", zIndex: 10 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Interactive Raycaster Hover Tooltip Popover */}
          {hoveredPoint && tooltipPos && (
            <div
              style={{
                position: "absolute",
                left: `${tooltipPos.x + 12}px`,
                top: `${tooltipPos.y + 12}px`,
                background: "rgba(15, 23, 42, 0.92)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(0, 229, 255, 0.4)",
                boxShadow: "0 8px 32px rgba(0, 229, 255, 0.2)",
                borderRadius: "8px",
                padding: "0.75rem",
                maxWidth: "280px",
                pointerEvents: "none",
                zIndex: 20,
                color: "#fff",
                fontSize: "0.78rem",
              }}
            >
              <div style={{ fontWeight: 600, color: "var(--pop-cyan, #00e5ff)", marginBottom: "0.25rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>📄</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hoveredPoint.document_title || "Document Chunk"}</span>
              </div>
              <div style={{ fontSize: "0.72rem", opacity: 0.7, marginBottom: "0.35rem" }}>
                Topic: <strong>{hoveredPoint.cluster_label}</strong>
              </div>
              <div style={{ fontStyle: "italic", opacity: 0.85, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                &ldquo;{hoveredPoint.text_preview}&rdquo;
              </div>
              <div style={{ fontSize: "0.68rem", opacity: 0.5, marginTop: "0.4rem" }}>
                Coords: [{hoveredPoint.coordinates.join(", ")}]
              </div>
            </div>
          )}

          {/* Empty collection notice */}
          {data && data.total_points === 0 && !loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "1rem" }}>
              <span style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📂</span>
              <h3 style={{ margin: "0 0 0.25rem" }}>No Document Embeddings Found</h3>
              <p style={{ opacity: 0.7, fontSize: "0.85rem", maxWidth: "360px", margin: 0 }}>
                Upload Markdown, PDF, or text documents in the <strong>Knowledge &amp; Graph</strong> tab to generate 3D embedding space projections.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Table View Fallback */
        <div style={{ overflowX: "auto", maxHeight: "520px", border: "1px solid var(--color-border)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "0.6rem 0.75rem" }}>Chunk ID</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Document</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Topic Cluster</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Coordinates ({dimensions}D)</th>
                <th style={{ padding: "0.6rem 0.75rem" }}>Snippet Preview</th>
              </tr>
            </thead>
            <tbody>
              {data?.points.map((pt) => (
                <tr key={pt.chunk_id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: "0.75rem" }}>{pt.chunk_id.slice(0, 8)}...</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>{pt.document_title}</td>
                  <td style={{ padding: "0.5rem 0.75rem" }}>
                    <span style={{ padding: "0.15rem 0.45rem", borderRadius: "10px", background: "rgba(255,255,255,0.08)", fontSize: "0.72rem" }}>
                      {pt.cluster_label}
                    </span>
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", fontFamily: "monospace", fontSize: "0.72rem" }}>
                    [{pt.coordinates.join(", ")}]
                  </td>
                  <td style={{ padding: "0.5rem 0.75rem", opacity: 0.8, maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {pt.text_preview}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Selected Chunk Deep Inspector Drawer */}
      {selectedPoint && (
        <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--surface-elevated, rgba(0,0,0,0.3))", borderRadius: "8px", border: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
          <div>
            <h4 style={{ margin: "0 0 0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span>🔍 Selected Chunk Inspection</span>
              <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.45rem", borderRadius: "6px", background: "rgba(0, 229, 255, 0.15)", color: "#00e5ff" }}>
                {selectedPoint.cluster_label}
              </span>
            </h4>
            <div style={{ fontSize: "0.78rem", opacity: 0.7, marginBottom: "0.5rem" }}>
              Document: <strong>{selectedPoint.document_title}</strong> • ID: <code>{selectedPoint.chunk_id}</code>
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.4, margin: 0, opacity: 0.9 }}>
              &ldquo;{selectedPoint.text_preview}&rdquo;
            </p>
          </div>
          <button
            onClick={() => setSelectedPoint(null)}
            className="comic-btn"
            style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem" }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
