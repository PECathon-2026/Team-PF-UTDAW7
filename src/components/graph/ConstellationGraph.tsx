"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Orbit,
  Sparkles,
  Plus,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  BookOpen,
  X,
  Maximize2,
  Minimize2,
  Moon,
  Compass
} from "lucide-react";

export interface GraphNode {
  id: string;
  name: string;
  domain: string;
  category: "Culture" | "Systems" | "Design" | "Business" | "Indie";
  kanjiCategory: string;
  isSubscribed: boolean;
  readersCount: number;
  description: string;
  recentTitle: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
  pulsePhase?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  overlap: number; // 0 to 100 percentage
}

interface StarParticle {
  x: number;
  y: number;
  size: number;
  baseAlpha: number;
  phase: number;
  speed: number;
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: "marginalian",
    name: "The Marginalian",
    domain: "themarginalian.org",
    category: "Culture",
    kanjiCategory: "文化",
    isSubscribed: true,
    readersCount: 4200,
    description: "Reflections on art, science, philosophy, and the search for meaning in an accelerated world.",
    recentTitle: "The Quiet Art of Building Things That Outlast Their Makers"
  },
  {
    id: "danluu",
    name: "Dan Luu",
    domain: "danluu.com",
    category: "Systems",
    kanjiCategory: "電脳",
    isSubscribed: true,
    readersCount: 5100,
    description: "Deep empirical dives into hardware performance, software reliability, and system latency.",
    recentTitle: "Why Modern Software Still Feels Sluggish on Fast Silicon"
  },
  {
    id: "alistapart",
    name: "A List Apart",
    domain: "alistapart.com",
    category: "Design",
    kanjiCategory: "造形",
    isSubscribed: true,
    readersCount: 3800,
    description: "Explores the design, development, and meaning of web content, with a focus on web standards.",
    recentTitle: "What Happens When We Design for the Decade, Not the Sprint?"
  },
  {
    id: "stratechery",
    name: "Stratechery",
    domain: "stratechery.com",
    category: "Business",
    kanjiCategory: "戦略",
    isSubscribed: true,
    readersCount: 6400,
    description: "On the business, strategy, and impact of technology and media aggregation.",
    recentTitle: "The Next Era of the Internet Isn't Social"
  },
  {
    id: "jvns",
    name: "Julia Evans",
    domain: "jvns.ca",
    category: "Systems",
    kanjiCategory: "電脳",
    isSubscribed: true,
    readersCount: 4900,
    description: "Making systems programming and networking accessible through visual, bite-sized explorations.",
    recentTitle: "Understanding How Packet Traversal and DNS Caching Actually Work"
  },
  {
    id: "simonw",
    name: "Simon Willison",
    domain: "simonwillison.net",
    category: "Systems",
    kanjiCategory: "電脳",
    isSubscribed: false,
    readersCount: 4100,
    description: "Daily notes, technical essays, and open-source tooling explorations on Python, Datasette, and LLMs.",
    recentTitle: "Catching Hallucinations with Deterministic Evaluation"
  },
  {
    id: "maggie",
    name: "Maggie Appleton",
    domain: "maggieappleton.com",
    category: "Design",
    kanjiCategory: "造形",
    isSubscribed: false,
    readersCount: 3200,
    description: "Visual essays on digital gardens, programming anthropology, and personal knowledge tools.",
    recentTitle: "A Brief History of Digital Gardens"
  },
  {
    id: "robin",
    name: "Robin Sloan",
    domain: "robinsloan.com",
    category: "Culture",
    kanjiCategory: "文化",
    isSubscribed: false,
    readersCount: 2900,
    description: "Writing on home-cooked software, publishing models, and small web experiments.",
    recentTitle: "An App Can Be a Home-Cooked Meal"
  },
  {
    id: "paulgraham",
    name: "Paul Graham",
    domain: "paulgraham.com",
    category: "Culture",
    kanjiCategory: "文化",
    isSubscribed: false,
    readersCount: 7800,
    description: "Essays on startups, programming craft, and general human intelligence.",
    recentTitle: "How to Think for Yourself"
  },
  {
    id: "brandur",
    name: "Brandur",
    domain: "brandur.org",
    category: "Systems",
    kanjiCategory: "電脳",
    isSubscribed: false,
    readersCount: 2300,
    description: "Elegant longform essays on databases, idempotency, and Postgres reliability.",
    recentTitle: "Doing Fast Work on Slow Hardware"
  }
];

const DEFAULT_EDGES: GraphEdge[] = [
  { source: "marginalian", target: "robin", overlap: 84 },
  { source: "marginalian", target: "maggie", overlap: 78 },
  { source: "danluu", target: "jvns", overlap: 91 },
  { source: "danluu", target: "simonw", overlap: 86 },
  { source: "danluu", target: "brandur", overlap: 79 },
  { source: "jvns", target: "simonw", overlap: 88 },
  { source: "alistapart", target: "maggie", overlap: 82 },
  { source: "alistapart", target: "robin", overlap: 68 },
  { source: "stratechery", target: "paulgraham", overlap: 75 },
  { source: "danluu", target: "paulgraham", overlap: 64 },
  { source: "marginalian", target: "danluu", overlap: 52 },
  { source: "simonw", target: "brandur", overlap: 71 }
];

const CATEGORY_TABS = [
  { key: "all", label: "全部 All", kanji: "全" },
  { key: "Systems", label: "電脳 Systems", kanji: "電" },
  { key: "Culture", label: "文化 Culture", kanji: "文" },
  { key: "Design", label: "造形 Design", kanji: "形" },
  { key: "Business", label: "戦略 Business", kanji: "戦" }
];

interface ConstellationGraphProps {
  onSubscribeFeed?: (name: string, domain: string) => void;
  onOpenArticle?: (title: string, author: string) => void;
  onClose?: () => void;
  isFullScreenModal?: boolean;
}

export default function ConstellationGraph({
  onSubscribeFeed,
  onOpenArticle,
  onClose,
  isFullScreenModal = false
}: ConstellationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(isFullScreenModal);

  // Simulation & Stars refs
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>(DEFAULT_EDGES);
  const starsRef = useRef<StarParticle[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const isDraggingNode = useRef<GraphNode | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseScreenPos = useRef({ x: 0, y: 0 });

  // Escape key handler to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Generate Mystic Japanese Night Sky Starfield
  useEffect(() => {
    const stars: StarParticle[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.8 + 0.6,
        baseAlpha: Math.random() * 0.5 + 0.25,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.002 + 0.001
      });
    }
    starsRef.current = stars;
  }, []);

  // Initialize node layout with center distribution
  const initPositions = useCallback((width: number, height: number) => {
    const cx = width / 2;
    const cy = height / 2;

    const initialized = DEFAULT_NODES.map((node, i) => {
      const angle = (i / DEFAULT_NODES.length) * 2 * Math.PI;
      const ringRadius = 150 + (i % 3) * 65;
      return {
        ...node,
        x: cx + Math.cos(angle) * ringRadius,
        y: cy + Math.sin(angle) * ringRadius,
        vx: 0,
        vy: 0,
        radius: node.isSubscribed ? 26 : 21,
        pulsePhase: Math.random() * Math.PI * 2
      };
    });

    nodesRef.current = initialized;
    setNodes(initialized);
  }, []);

  // Handle Resize and Canvas Resolution (High-DPI retina safe)
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const updateSize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      if (nodesRef.current.length === 0 || !nodesRef.current[0].x) {
        initPositions(width, height);
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);

    return () => observer.disconnect();
  }, [initPositions]);

  // Main Physics + Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;

    const loop = () => {
      time += 0.02;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const centerX = width / 2;
      const centerY = height / 2;

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      // 1. Repulsion force between nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n1 = currentNodes[i];
          const n2 = currentNodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 240) {
            const force = ((240 - dist) / dist) * 0.35;
            if (isDraggingNode.current !== n1) {
              n1.vx = (n1.vx || 0) - (dx / dist) * force;
              n1.vy = (n1.vy || 0) - (dy / dist) * force;
            }
            if (isDraggingNode.current !== n2) {
              n2.vx = (n2.vx || 0) + (dx / dist) * force;
              n2.vy = (n2.vy || 0) + (dy / dist) * force;
            }
          }
        }
      }

      // 2. Spring attraction along similarity edges
      currentEdges.forEach(edge => {
        const n1 = currentNodes.find(n => n.id === edge.source);
        const n2 = currentNodes.find(n => n.id === edge.target);
        if (!n1 || !n2 || !n1.x || !n1.y || !n2.x || !n2.y) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 175 - (edge.overlap / 100) * 45;
        const force = (dist - targetDist) * 0.02;

        if (isDraggingNode.current !== n1) {
          n1.vx = (n1.vx || 0) + (dx / dist) * force;
          n1.vy = (n1.vy || 0) + (dy / dist) * force;
        }
        if (isDraggingNode.current !== n2) {
          n2.vx = (n2.vx || 0) - (dx / dist) * force;
          n2.vy = (n2.vy || 0) - (dy / dist) * force;
        }
      });

      // 3. Central gravity & soft boundary clamping (nodes never fly away)
      const maxConstellationRadius = Math.min(width, height) * 0.44;

      currentNodes.forEach(node => {
        if (isDraggingNode.current === node) return;

        const toCenterX = centerX - (node.x || centerX);
        const toCenterY = centerY - (node.y || centerY);
        const distCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);

        // Gentle central gravity pull
        node.vx = (node.vx || 0) * 0.86 + toCenterX * 0.0018;
        node.vy = (node.vy || 0) * 0.86 + toCenterY * 0.0018;

        // Hard boundary retention
        if (distCenter > maxConstellationRadius) {
          const pullBack = (distCenter - maxConstellationRadius) * 0.025;
          node.vx += (toCenterX / (distCenter || 1)) * pullBack;
          node.vy += (toCenterY / (distCenter || 1)) * pullBack;
        }

        node.x = (node.x || centerX) + (node.vx || 0);
        node.y = (node.y || centerY) + (node.vy || 0);
      });

      // 4. Render Japanese Mystic Night Sky & Constellation
      renderScene(ctx, width, height, time);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [pan, zoomLevel, selectedCategory, hoveredNode, selectedNode]);

  // Render Scene onto Canvas
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep Mystic Indigo / Ink Black Background
    const bgGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      50,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    bgGrad.addColorStop(0, "#101229"); // subtle imperial violet core
    bgGrad.addColorStop(0.5, "#090a18");
    bgGrad.addColorStop(1, "#05060f"); // deep ink black edge
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Ethereal Nebula Clouds (Soft mystic purple & gold aura)
    ctx.save();
    const nebulaGrad = ctx.createRadialGradient(
      width * 0.45,
      height * 0.4,
      40,
      width * 0.45,
      height * 0.4,
      width * 0.35
    );
    nebulaGrad.addColorStop(0, "rgba(139, 92, 246, 0.12)"); // mystic violet
    nebulaGrad.addColorStop(0.6, "rgba(245, 158, 11, 0.04)"); // subtle gold dust
    nebulaGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = nebulaGrad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // Background Twinkling Stars
    starsRef.current.forEach(star => {
      const alpha = Math.max(
        0.1,
        star.baseAlpha + Math.sin(time * 1.5 + star.phase) * 0.25
      );
      ctx.fillStyle = `rgba(243, 240, 230, ${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Apply User Zoom & Pan Transformation
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoomLevel, zoomLevel);

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // --- DRAW CONSTELLATION EDGES (Golden Kintsugi Starlight Threads) ---
    currentEdges.forEach(edge => {
      const n1 = currentNodes.find(n => n.id === edge.source);
      const n2 = currentNodes.find(n => n.id === edge.target);
      if (!n1 || !n2 || !n1.x || !n1.y || !n2.x || !n2.y) return;

      const isConnectedToHovered =
        hoveredNode && (hoveredNode.id === n1.id || hoveredNode.id === n2.id);
      const isConnectedToSelected =
        selectedNode && (selectedNode.id === n1.id || selectedNode.id === n2.id);

      ctx.beginPath();
      ctx.moveTo(n1.x, n1.y);
      ctx.lineTo(n2.x, n2.y);

      if (isConnectedToHovered || isConnectedToSelected) {
        // Highlighting thread in radiant Mikado Gold
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "#f59e0b";
        ctx.shadowBlur = 12;
        ctx.globalAlpha = 0.95;
      } else {
        // Ambient starlight kintsugi cord
        ctx.strokeStyle = "#d4af37";
        ctx.lineWidth = Math.max(1, (edge.overlap / 100) * 1.8);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 0.22;
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      // Overlap Percentage Tag on Hovered or Selected
      if (isConnectedToHovered || isConnectedToSelected) {
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        const pillText = `${edge.overlap}% 縁`;

        ctx.font = "bold 10px monospace";
        const textWidth = ctx.measureText(pillText).width;

        // Pill background
        ctx.fillStyle = "rgba(18, 20, 38, 0.92)";
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - textWidth / 2 - 8, midY - 9, textWidth + 16, 18, 9);
        ctx.fill();
        ctx.stroke();

        // Pill text in luminous gold
        ctx.fillStyle = "#fde68a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pillText, midX, midY);
      }
    });

    // --- DRAW CONSTELLATION NODES (Celestial Mikado Orbs) ---
    currentNodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed =
        selectedCategory !== "all" &&
        node.category.toLowerCase() !== selectedCategory.toLowerCase();

      ctx.globalAlpha = isDimmed ? 0.25 : 1;
      const radius = (node.radius || 22) * (isHovered || isSelected ? 1.2 : 1);

      // Outer Corona Shimmer
      const pulse = Math.sin(time * 2 + (node.pulsePhase || 0)) * 3;
      const glowGrad = ctx.createRadialGradient(
        node.x,
        node.y,
        radius * 0.4,
        node.x,
        node.y,
        radius + 12 + pulse
      );

      if (node.isSubscribed) {
        // Imperial Gold Solar Aura for Subscribed Blogs
        glowGrad.addColorStop(0, "rgba(251, 191, 36, 0.9)");
        glowGrad.addColorStop(0.6, "rgba(217, 119, 6, 0.35)");
        glowGrad.addColorStop(1, "rgba(217, 119, 6, 0)");
      } else {
        // Celestial Cyan / Ethereal Indigo Aura for Recommended Blogs
        glowGrad.addColorStop(0, "rgba(56, 189, 248, 0.85)");
        glowGrad.addColorStop(0.6, "rgba(129, 140, 248, 0.3)");
        glowGrad.addColorStop(1, "rgba(99, 102, 241, 0)");
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 12 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = glowGrad;
      ctx.fill();

      // Core Celestial Orb
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      if (node.isSubscribed) {
        // Subscribed: Warm radiant golden sun
        ctx.fillStyle = "#1e1708";
        ctx.fill();
        ctx.strokeStyle = isSelected || isHovered ? "#fef08a" : "#fbbf24";
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.stroke();
      } else {
        // Recommendation: Obsidian night orb with starlight rim
        ctx.fillStyle = "#0c1020";
        ctx.fill();
        ctx.strokeStyle = isSelected || isHovered ? "#67e8f9" : "#38bdf8";
        ctx.lineWidth = isSelected ? 3 : 1.8;
        ctx.stroke();
      }

      // Kanji Crest / Monogram Inside Orb
      ctx.fillStyle = node.isSubscribed ? "#fbbf24" : "#e0f2fe";
      ctx.font = `bold ${Math.round(radius * 0.8)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.kanjiCategory || "星", node.x, node.y);

      // Node Name Label (Below Orb)
      ctx.font = isSelected || isHovered ? "bold 12px serif" : "11px serif";
      ctx.fillStyle = isSelected || isHovered ? "#fef08a" : "#e2e8f0";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 6;
      ctx.fillText(node.name, node.x, node.y + radius + 8);

      // Domain subtitle for hovered / selected
      if (isHovered || isSelected) {
        ctx.font = "9px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(node.domain, node.x, node.y + radius + 24);
      }
      ctx.shadowBlur = 0;
    });

    ctx.restore(); // restore zoom & pan
    ctx.restore(); // restore dpr
  };

  // Convert mouse screen coordinates to world coordinates (zoom & pan aware)
  const getMouseWorldPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { screenX: 0, screenY: 0, worldX: 0, worldY: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    return {
      screenX: mouseX,
      screenY: mouseY,
      worldX: (mouseX - pan.x) / zoomLevel,
      worldY: (mouseY - pan.y) / zoomLevel
    };
  };

  // Dragging & Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, screenX, screenY } = getMouseWorldPos(e);
    const currentNodes = nodesRef.current;

    // Check if clicked a node
    const clicked = currentNodes.find(node => {
      if (!node.x || !node.y) return false;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= (node.radius || 22) + 6;
    });

    if (clicked) {
      isDraggingNode.current = clicked;
      setSelectedNode(clicked);
    } else {
      isPanning.current = true;
      panStart.current = { x: screenX - pan.x, y: screenY - pan.y };
      setSelectedNode(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { worldX, worldY, screenX, screenY } = getMouseWorldPos(e);
    mouseScreenPos.current = { x: screenX, y: screenY };

    if (isDraggingNode.current) {
      isDraggingNode.current.x = worldX;
      isDraggingNode.current.y = worldY;
      isDraggingNode.current.vx = 0;
      isDraggingNode.current.vy = 0;
      return;
    }

    if (isPanning.current) {
      setPan({
        x: screenX - panStart.current.x,
        y: screenY - panStart.current.y
      });
      return;
    }

    // Hover detection
    const currentNodes = nodesRef.current;
    const hovered = currentNodes.find(node => {
      if (!node.x || !node.y) return false;
      const dx = worldX - node.x;
      const dy = worldY - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= (node.radius || 22) + 6;
    });

    setHoveredNode(hovered || null);
  };

  const handleMouseUp = () => {
    isDraggingNode.current = null;
    isPanning.current = false;
  };

  // Safe Clamped Wheel Zoom (Zoom Towards Cursor Math)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Smooth exponential delta
    const zoomFactor = Math.exp(-e.deltaY * 0.0018);
    const nextZoom = Math.min(Math.max(zoomLevel * zoomFactor, 0.55), 2.2);

    // Zoom focal point remains pinned under mouse
    const nextPanX = mouseX - (mouseX - pan.x) * (nextZoom / zoomLevel);
    const nextPanY = mouseY - (mouseY - pan.y) * (nextZoom / zoomLevel);

    setZoomLevel(nextZoom);
    setPan({ x: nextPanX, y: nextPanY });
  };

  const resetView = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
  };

  const toggleSubscribe = (nodeId: string) => {
    setNodes(prev =>
      prev.map(n => {
        if (n.id === nodeId) {
          const nextState = !n.isSubscribed;
          if (nextState && onSubscribeFeed) {
            onSubscribeFeed(n.name, n.domain);
          }
          return { ...n, isSubscribed: nextState };
        }
        return n;
      })
    );

    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(prev => (prev ? { ...prev, isSubscribed: !prev.isSubscribed } : null));
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none flex flex-col font-serif ${
        isFullScreenModal
          ? "w-full h-full bg-[#05060f]"
          : "h-[80vh] rounded-3xl border border-[#d4af37]/30 shadow-2xl bg-[#05060f]"
      }`}
    >
      {/* Top Floating Japanese Celestial Header */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Brand & Theme Crest */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#0d0f22]/90 backdrop-blur-xl border border-[#d4af37]/30 shadow-xl">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#b45309] to-[#fbbf24] flex items-center justify-center text-black font-bold text-xs shadow-md">
            <Orbit className="w-4 h-4 text-[#060713]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xs text-[#fef08a] tracking-wider">
                神秘の星座
              </span>
              <span className="text-[10px] font-mono text-[#94a3b8] uppercase tracking-widest">
                Mystic Mikado
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#64748b]">
              Small Web Co-subscription Graph
            </p>
          </div>
        </div>

        {/* Center: Category Filters in Obsidian Glass */}
        <div className="pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[#0d0f22]/90 backdrop-blur-xl border border-[#d4af37]/25 shadow-xl text-xs">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 font-serif ${
                selectedCategory === tab.key
                  ? "bg-gradient-to-r from-[#b45309] to-[#d97706] text-[#fef08a] font-bold shadow-md shadow-amber-900/30"
                  : "text-[#94a3b8] hover:text-[#f3f0e6] hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Controls & Exit Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom In / Out / Reset */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0d0f22]/90 backdrop-blur-xl border border-[#d4af37]/25 shadow-xl text-[#94a3b8]">
            <button
              onClick={() => setZoomLevel(z => Math.min(z * 1.15, 2.2))}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#fef08a] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.max(z * 0.85, 0.55))}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#fef08a] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-[#fef08a] transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Close / Exit Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0d0f22]/95 hover:bg-[#b45309] border border-[#d4af37]/40 text-[#fef08a] text-xs font-serif transition-all shadow-xl group"
              title="Close Constellation (Esc)"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>閉じる Close</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
      />

      {/* Bottom Subtle Japanese Zen Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-5 px-4 py-2 rounded-full bg-[#0d0f22]/85 backdrop-blur-xl border border-[#d4af37]/25 shadow-xl text-[11px] font-mono text-[#94a3b8]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] shadow-[0_0_8px_#fbbf24]" />
          <span className="text-[#e2e8f0]">講読 Subscribed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-[#38bdf8] bg-[#0c1020] shadow-[0_0_8px_#38bdf8]" />
          <span className="text-[#e2e8f0]">共読 Cluster Overlap</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#fbbf24]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Drag stars to reshape gravity</span>
        </div>
      </div>

      {/* Selected Node Inspection Card (Obsidian Japanese Dark Popover) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-5 right-5 z-40 w-88 max-w-[calc(100vw-2.5rem)] bg-[#090b16]/95 border border-[#d4af37]/40 rounded-3xl shadow-2xl p-6 space-y-4 backdrop-blur-2xl text-[#f3f0e6] font-serif"
          >
            {/* Popover Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#fbbf24] font-bold">
                    {selectedNode.kanjiCategory} • {selectedNode.category}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#b45309]/30 text-[#fef08a] border border-[#d4af37]/30">
                    星標
                  </span>
                </div>
                <h4 className="text-lg font-serif font-bold text-white mt-1 leading-snug">
                  {selectedNode.name}
                </h4>
                <a
                  href={`https://${selectedNode.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#94a3b8] hover:text-[#fbbf24] hover:underline flex items-center gap-1 mt-0.5 transition-colors"
                >
                  <span>{selectedNode.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-full text-[#94a3b8] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#cbd5e1] leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Shared Affinity Badge */}
            <div className="p-3 rounded-2xl bg-[#111328]/80 border border-[#d4af37]/30 text-xs font-mono text-[#fde68a] flex items-center gap-2.5 shadow-inner">
              <Sparkles className="w-4 h-4 text-[#fbbf24] flex-shrink-0" />
              <span>~{selectedNode.readersCount.toLocaleString()} 共有読者 (Shared Readers in Graph)</span>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center gap-2.5">
              <button
                onClick={() => toggleSubscribe(selectedNode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-serif font-medium transition-all shadow-lg ${
                  selectedNode.isSubscribed
                    ? "bg-[#181a33] text-[#fef08a] border border-[#d4af37]/50 hover:bg-[#202347]"
                    : "bg-gradient-to-r from-[#b45309] to-[#d97706] hover:from-[#d97706] hover:to-[#f59e0b] text-[#060713] font-bold shadow-amber-900/40"
                }`}
              >
                {selectedNode.isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#fbbf24]" /> 登録済み Subscribed
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> 講読する Follow Blog
                  </>
                )}
              </button>

              {onOpenArticle && (
                <button
                  onClick={() => onOpenArticle(selectedNode.recentTitle, selectedNode.name)}
                  className="p-2.5 rounded-xl border border-[#d4af37]/40 bg-[#121429] hover:bg-[#1a1d3b] text-[#fef08a] transition-colors shadow-md"
                  title="Read latest essay in reader view"
                >
                  <BookOpen className="w-4 h-4 text-[#fbbf24]" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
