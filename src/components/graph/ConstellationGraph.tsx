"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import BlogCardSpotlight from "@/components/reader/BlogCardSpotlight";
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
  X
} from "lucide-react";

export interface GraphNode {
  id: string;
  name: string;
  initial: string;
  domain: string;
  category: "Culture" | "Systems" | "Design" | "Business" | "Indie";
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

interface AmbientSpeck {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speed: number;
  phase: number;
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: "marginalian",
    name: "The Marginalian",
    initial: "M",
    domain: "themarginalian.org",
    category: "Culture",
    isSubscribed: true,
    readersCount: 4200,
    description: "Reflections on art, science, philosophy, and the search for meaning in an accelerated world.",
    recentTitle: "The Quiet Art of Building Things That Outlast Their Makers"
  },
  {
    id: "danluu",
    name: "Dan Luu",
    initial: "D",
    domain: "danluu.com",
    category: "Systems",
    isSubscribed: true,
    readersCount: 5100,
    description: "Deep empirical dives into hardware performance, software reliability, and system latency.",
    recentTitle: "Why Modern Software Still Feels Sluggish on Fast Silicon"
  },
  {
    id: "alistapart",
    name: "A List Apart",
    initial: "A",
    domain: "alistapart.com",
    category: "Design",
    isSubscribed: true,
    readersCount: 3800,
    description: "Explores the design, development, and meaning of web content, with a focus on web standards.",
    recentTitle: "What Happens When We Design for the Decade, Not the Sprint?"
  },
  {
    id: "stratechery",
    name: "Stratechery",
    initial: "S",
    domain: "stratechery.com",
    category: "Business",
    isSubscribed: true,
    readersCount: 6400,
    description: "On the business, strategy, and impact of technology and media aggregation.",
    recentTitle: "The Next Era of the Internet Isn't Social"
  },
  {
    id: "jvns",
    name: "Julia Evans",
    initial: "J",
    domain: "jvns.ca",
    category: "Systems",
    isSubscribed: true,
    readersCount: 4900,
    description: "Making systems programming and networking accessible through visual, bite-sized explorations.",
    recentTitle: "Understanding How Packet Traversal and DNS Caching Actually Work"
  },
  {
    id: "simonw",
    name: "Simon Willison",
    initial: "S",
    domain: "simonwillison.net",
    category: "Systems",
    isSubscribed: false,
    readersCount: 4100,
    description: "Daily notes, technical essays, and open-source tooling explorations on Python, Datasette, and LLMs.",
    recentTitle: "Catching Hallucinations with Deterministic Evaluation"
  },
  {
    id: "maggie",
    name: "Maggie Appleton",
    initial: "M",
    domain: "maggieappleton.com",
    category: "Design",
    isSubscribed: false,
    readersCount: 3200,
    description: "Visual essays on digital gardens, programming anthropology, and personal knowledge tools.",
    recentTitle: "A Brief History of Digital Gardens"
  },
  {
    id: "robin",
    name: "Robin Sloan",
    initial: "R",
    domain: "robinsloan.com",
    category: "Culture",
    isSubscribed: false,
    readersCount: 2900,
    description: "Writing on home-cooked software, publishing models, and small web experiments.",
    recentTitle: "An App Can Be a Home-Cooked Meal"
  },
  {
    id: "paulgraham",
    name: "Paul Graham",
    initial: "P",
    domain: "paulgraham.com",
    category: "Culture",
    isSubscribed: false,
    readersCount: 7800,
    description: "Essays on startups, programming craft, and general human intelligence.",
    recentTitle: "How to Think for Yourself"
  },
  {
    id: "brandur",
    name: "Brandur",
    initial: "B",
    domain: "brandur.org",
    category: "Systems",
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
  { key: "all", label: "All Topics" },
  { key: "Systems", label: "Systems" },
  { key: "Culture", label: "Culture" },
  { key: "Design", label: "Design" },
  { key: "Business", label: "Business" }
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
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);
  isDarkRef.current = isDark;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Simulation refs
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>(DEFAULT_EDGES);
  const specksRef = useRef<AmbientSpeck[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const isDraggingNode = useRef<GraphNode | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseScreenPos = useRef({ x: 0, y: 0 });

  // Initialize ambient paper specks
  useEffect(() => {
    const specks: AmbientSpeck[] = [];
    for (let i = 0; i < 40; i++) {
      specks.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.22 + 0.1,
        speed: Math.random() * 0.0008 + 0.0004,
        phase: Math.random() * Math.PI * 2
      });
    }
    specksRef.current = specks;
  }, []);

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

      // 4. Render Warm Editorial Paper Scene
      renderScene(ctx, width, height, time);

      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [pan, zoomLevel, selectedCategory, hoveredNode, selectedNode]);

  // Render Scene onto Canvas (Editorial Parchment Palette)
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    const dpr = window.devicePixelRatio || 1;

    ctx.save();
    ctx.scale(dpr, dpr);

    const isNight = isDarkRef.current;

    // 1. Warm Editorial Vellum Ambient Lighting Gradient
    const vellumGrad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      60,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    if (isNight) {
      vellumGrad.addColorStop(0, "#191614");
      vellumGrad.addColorStop(0.55, "#131110");
      vellumGrad.addColorStop(1, "#0a0908");
    } else {
      vellumGrad.addColorStop(0, "#fdfbf7");
      vellumGrad.addColorStop(0.55, "#f8f3ea");
      vellumGrad.addColorStop(1, "#f1e6d7");
    }
    ctx.fillStyle = vellumGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Architectural Blueprint Grid & Metric Crosshairs
    ctx.save();
    ctx.strokeStyle = isNight ? "rgba(217, 119, 6, 0.08)" : "rgba(226, 214, 195, 0.45)";
    ctx.lineWidth = 1;
    const gridStep = 48;
    for (let x = 0; x <= width; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Grid Crosshairs at major intersections
    ctx.fillStyle = isNight ? "rgba(245, 158, 11, 0.2)" : "rgba(180, 83, 9, 0.25)";
    for (let x = gridStep * 2; x < width; x += gridStep * 2) {
      for (let y = gridStep * 2; y < height; y += gridStep * 2) {
        ctx.fillRect(x - 3, y - 0.5, 6, 1);
        ctx.fillRect(x - 0.5, y - 3, 1, 6);
      }
    }
    ctx.restore();

    // 3. Floating Ambient Amber Specks
    specksRef.current.forEach(speck => {
      const sx = ((speck.x * width + Math.sin(time + speck.phase) * 15) % width + width) % width;
      const sy = ((speck.y * height + time * speck.speed * 180) % height + height) % height;
      const a = speck.alpha + Math.sin(time * 1.5 + speck.phase) * 0.08;
      ctx.fillStyle = isNight
        ? `rgba(245, 158, 11, ${Math.max(0.06, a * 1.2)})`
        : `rgba(180, 83, 9, ${Math.max(0.04, a)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, speck.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Apply User Zoom & Pan Transformation
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoomLevel, zoomLevel);

    const centerX = width / 2;
    const centerY = height / 2;

    // 4. Astrolabe Celestial Orbit Guide Rings (In Graph World Coordinates)
    ctx.save();
    const ringRadii = [120, 230, 350, 480];
    ringRadii.forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = isNight
        ? (idx % 2 === 0 ? "rgba(245, 158, 11, 0.16)" : "rgba(85, 76, 65, 0.45)")
        : (idx % 2 === 0 ? "rgba(180, 83, 9, 0.18)" : "rgba(214, 202, 186, 0.45)");
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
    });

    // Cardinal Axes with Subtle Degree Marks
    ctx.strokeStyle = isNight ? "rgba(245, 158, 11, 0.1)" : "rgba(180, 83, 9, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.beginPath();
    ctx.moveTo(centerX - 550, centerY);
    ctx.lineTo(centerX + 550, centerY);
    ctx.moveTo(centerX, centerY - 550);
    ctx.lineTo(centerX, centerY + 550);
    ctx.stroke();

    // Subtle Cartographic Typography Watermark
    ctx.font = "italic 11px serif";
    ctx.fillStyle = isNight ? "rgba(245, 158, 11, 0.18)" : "rgba(180, 83, 9, 0.14)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SMALL WEB CONSTELLATION MAP • DECENTRALIZED TOPOLOGY", centerX, centerY - 14);
    ctx.font = "9px monospace";
    ctx.fillStyle = isNight ? "rgba(168, 159, 145, 0.25)" : "rgba(120, 107, 89, 0.2)";
    ctx.fillText("LATENCY-FREE • ZERO TRACKING • CO-SUBSCRIPTION GRAVITY", centerX, centerY + 10);
    ctx.restore();

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // --- DRAW CONSTELLATION EDGES (Warm Editorial Connecting Threads) ---
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
        // Highlighting thread in warm honey amber
        ctx.strokeStyle = isNight ? "#fbbf24" : "#b45309";
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.95;
      } else {
        // Subtle warm linen line
        ctx.strokeStyle = isNight ? "#423b32" : "#d6caba";
        ctx.lineWidth = Math.max(1, (edge.overlap / 100) * 2);
        ctx.globalAlpha = isNight ? 0.45 : 0.55;
      }
      ctx.stroke();

      // Overlap Percentage Tag on Hovered or Selected
      if (isConnectedToHovered || isConnectedToSelected) {
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        const pillText = `${edge.overlap}% overlap`;

        ctx.font = "bold 10px monospace";
        const textWidth = ctx.measureText(pillText).width;

        // Pill background
        ctx.fillStyle = isNight ? "#221f1c" : "#fdfaf5";
        ctx.strokeStyle = isNight ? "#fbbf24" : "#b45309";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(midX - textWidth / 2 - 8, midY - 9, textWidth + 16, 18, 9);
        ctx.fill();
        ctx.stroke();

        // Pill text in deep warm amber
        ctx.fillStyle = isNight ? "#fbbf24" : "#92400e";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(pillText, midX, midY);
      }
    });

    // --- DRAW CONSTELLATION NODES (Warm Editorial Paper Spheres) ---
    currentNodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isSelected = selectedNode?.id === node.id;
      const isHovered = hoveredNode?.id === node.id;
      const isDimmed =
        selectedCategory !== "all" &&
        node.category.toLowerCase() !== selectedCategory.toLowerCase();

      ctx.globalAlpha = isDimmed ? 0.2 : 1;
      const radius = (node.radius || 22) * (isHovered || isSelected ? 1.18 : 1);

      // Warm Amber Pulse Glow for Subscribed Nodes
      if (node.isSubscribed) {
        const pulse = Math.sin(time * 2 + (node.pulsePhase || 0)) * 2;
        const glowGrad = ctx.createRadialGradient(
          node.x,
          node.y,
          radius * 0.6,
          node.x,
          node.y,
          radius + 10 + pulse
        );
        glowGrad.addColorStop(0, isNight ? "rgba(245, 158, 11, 0.35)" : "rgba(180, 83, 9, 0.25)");
        glowGrad.addColorStop(1, "rgba(180, 83, 9, 0)");

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }

      // Core Node Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);

      if (node.isSubscribed) {
        // Subscribed: Warm honey amber fill with crisp darker border
        ctx.fillStyle = isNight
          ? (isSelected || isHovered ? "#3d2b17" : "#282119")
          : (isSelected || isHovered ? "#fef3c7" : "#ffedd5");
        ctx.fill();
        ctx.strokeStyle = isNight ? (isSelected ? "#fbbf24" : "#b45309") : "#b45309";
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      } else {
        // Recommended: Clean warm paper white with linen border
        ctx.fillStyle = isNight
          ? (isSelected || isHovered ? "#2e2417" : "#1e1b18")
          : (isSelected || isHovered ? "#fef8ee" : "#ffffff");
        ctx.fill();
        ctx.strokeStyle = isNight
          ? (isSelected || isHovered ? "#fbbf24" : "#3d362e")
          : (isSelected || isHovered ? "#b45309" : "#d6caba");
        ctx.lineWidth = isSelected ? 2.5 : 1.8;
        ctx.stroke();
      }

      // Initial Letter inside circle
      ctx.fillStyle = node.isSubscribed
        ? (isNight ? "#fde68a" : "#92400e")
        : (isNight ? "#cfc5b6" : "#574e44");
      ctx.font = `bold ${Math.round(radius * 0.85)}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.initial, node.x, node.y);

      // Node Name Label (Below Circle)
      ctx.font = isSelected || isHovered ? "bold 12px serif" : "11px serif";
      ctx.fillStyle = isSelected || isHovered
        ? (isNight ? "#fbbf24" : "#b45309")
        : (isNight ? "#f5efe6" : "#1f1c19");
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(node.name, node.x, node.y + radius + 7);

      // Domain subtitle for hovered / selected
      if (isHovered || isSelected) {
        ctx.font = "9px monospace";
        ctx.fillStyle = isNight ? "#a89f91" : "#8c7e6c";
        ctx.fillText(node.domain, node.x, node.y + radius + 23);
      }
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
      className={`relative w-full overflow-hidden select-none flex flex-col font-serif bg-[#fbf8f2] ${
        isFullScreenModal
          ? "w-full h-full"
          : "h-[80vh] rounded-3xl border border-[#e8dfd1] shadow-xl"
      }`}
    >
      {/* Top Floating Editorial Header Controls */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Brand Crest in Warm Parchment */}
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#fdfaf5]/95 backdrop-blur-md border border-[#e2d6c3] shadow-xs">
          <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Orbit className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xs text-[#1f1c19] tracking-tight">
                Constellation Graph
              </span>
              <span className="text-[10px] font-mono text-[#b45309] uppercase tracking-wider font-bold">
                Discovery
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#786b59]">
              Co-subscription Proximity Network
            </p>
          </div>
        </div>

        {/* Center: Category Filters in Warm Paper Segmented Control */}
        <div className="pointer-events-auto hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[#fdfaf5]/95 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-xs font-serif">
          {CATEGORY_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedCategory(tab.key)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                selectedCategory === tab.key
                  ? "bg-[#b45309] text-white font-bold shadow-xs"
                  : "text-[#574e44] hover:text-[#1f1c19] hover:bg-[#f4ece1]"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Controls & Exit Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Zoom In / Out / Reset */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#fdfaf5]/95 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-[#574e44]">
            <button
              onClick={() => setZoomLevel(z => Math.min(z * 1.15, 2.2))}
              className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel(z => Math.max(z * 0.85, 0.55))}
              className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
              title="Reset Perspective"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Close / Exit Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#fdfaf5]/95 hover:bg-[#b45309] hover:text-white border border-[#e2d6c3] text-[#574e44] text-xs font-serif transition-all shadow-xs group"
              title="Close Constellation (Esc)"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Close (Esc)</span>
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

      {/* Bottom Subtle Editorial Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-5 px-4 py-2 rounded-full bg-[#fdfaf5]/95 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-[11px] font-mono text-[#786b59]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
          <span className="text-[#1f1c19]">Subscribed Feed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full border border-[#d6caba] bg-white" />
          <span className="text-[#1f1c19]">Recommendation Overlap</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#b45309]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Drag nodes to reshape gravity</span>
        </div>
      </div>

      {/* Selected Node Inspection Card (Warm Editorial Slide-up Popover) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-5 right-5 z-40 w-88 max-w-[calc(100vw-2.5rem)] bg-[#fdfaf5] border border-[#e2d6c3] rounded-3xl shadow-2xl p-6 space-y-4 backdrop-blur-md text-[#1f1c19] font-serif relative overflow-hidden"
          >
            <BlogCardSpotlight isDark={isDark} size={100} />
            <div className="relative z-10 space-y-4">
            {/* Popover Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#b45309] font-bold">
                    {selectedNode.category}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                    Recommended
                  </span>
                </div>
                <h4 className="text-lg font-serif font-bold text-[#1f1c19] mt-1 leading-snug">
                  {selectedNode.name}
                </h4>
                <a
                  href={`https://${selectedNode.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#786b59] hover:text-[#b45309] hover:underline flex items-center gap-1 mt-0.5 transition-colors"
                >
                  <span>{selectedNode.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-full text-[#8c7e6c] hover:text-[#1f1c19] hover:bg-[#f4ece1] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-[#574e44] leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Shared Affinity Badge */}
            <div className="p-3 rounded-2xl bg-[#f4ece1] border border-[#e2d6c3] text-xs font-mono text-[#78350f] flex items-center gap-2.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#b45309] flex-shrink-0" />
              <span>~{selectedNode.readersCount.toLocaleString()} shared readers in graph</span>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center gap-2.5">
              <button
                onClick={() => toggleSubscribe(selectedNode.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-serif font-medium transition-all shadow-xs ${
                  selectedNode.isSubscribed
                    ? "bg-[#f4ece1] text-[#92400e] border border-[#e2d6c3] hover:bg-[#ebdcc8]"
                    : "bg-[#b45309] hover:bg-[#92400e] text-white font-medium"
                }`}
              >
                {selectedNode.isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#b45309]" /> Subscribed
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" /> Follow Blog
                  </>
                )}
              </button>

              {onOpenArticle && (
                <button
                  onClick={() => onOpenArticle(selectedNode.recentTitle, selectedNode.name)}
                  className="p-2.5 rounded-xl border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] transition-colors shadow-xs"
                  title="Read latest essay in reading view"
                >
                  <BookOpen className="w-4 h-4 text-[#b45309]" />
                </button>
              )}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
