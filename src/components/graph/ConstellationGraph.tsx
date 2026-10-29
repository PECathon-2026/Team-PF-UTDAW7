"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Sparkles,
  Plus,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  BookOpen,
  X,
  Share2,
  Info
} from "lucide-react";

export interface GraphNode {
  id: string;
  name: string;
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
}

export interface GraphEdge {
  source: string;
  target: string;
  overlap: number; // 0 to 100 percentage
}

const DEFAULT_NODES: GraphNode[] = [
  {
    id: "marginalian",
    name: "The Marginalian",
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

interface ConstellationGraphProps {
  onSubscribeFeed?: (name: string, domain: string) => void;
  onOpenArticle?: (title: string, author: string) => void;
}

export default function ConstellationGraph({
  onSubscribeFeed,
  onOpenArticle
}: ConstellationGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>(DEFAULT_NODES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Physics simulation refs
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>(DEFAULT_EDGES);
  const animationFrameId = useRef<number | null>(null);
  const isDraggingNode = useRef<GraphNode | null>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Initialize node positions
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;

    const initialNodes = DEFAULT_NODES.map((node, i) => {
      const angle = (i / DEFAULT_NODES.length) * 2 * Math.PI;
      const radius = 140 + (i % 3) * 60;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: node.isSubscribed ? 28 : 22
      };
    });

    nodesRef.current = initialNodes;
    setNodes(initialNodes);
  }, []);

  // Physics simulation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width;
    let height = canvas.height;

    const runPhysics = () => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Repulsion between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const n1 = currentNodes[i];
          const n2 = currentNodes[j];
          const dx = (n2.x || 0) - (n1.x || 0);
          const dy = (n2.y || 0) - (n1.y || 0);
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          if (dist < 260) {
            const force = (260 - dist) / dist * 0.4;
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

      // 2. Attraction along edges (Spring force)
      currentEdges.forEach(edge => {
        const n1 = currentNodes.find(n => n.id === edge.source);
        const n2 = currentNodes.find(n => n.id === edge.target);
        if (!n1 || !n2) return;

        const dx = (n2.x || 0) - (n1.x || 0);
        const dy = (n2.y || 0) - (n1.y || 0);
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const targetDist = 170 - (edge.overlap / 100) * 50;
        const force = (dist - targetDist) * 0.025;

        if (isDraggingNode.current !== n1) {
          n1.vx = (n1.vx || 0) + (dx / dist) * force;
          n1.vy = (n1.vy || 0) + (dy / dist) * force;
        }
        if (isDraggingNode.current !== n2) {
          n2.vx = (n2.vx || 0) - (dx / dist) * force;
          n2.vy = (n2.vy || 0) - (dy / dist) * force;
        }
      });

      // 3. Gentle center pull & velocity damping
      currentNodes.forEach(node => {
        if (isDraggingNode.current === node) return;

        const toCenterX = centerX - (node.x || 0);
        const toCenterY = centerY - (node.y || 0);
        node.vx = (node.vx || 0) * 0.88 + toCenterX * 0.002;
        node.vy = (node.vy || 0) * 0.88 + toCenterY * 0.002;

        node.x = (node.x || 0) + (node.vx || 0);
        node.y = (node.y || 0) + (node.vy || 0);
      });

      // Render
      renderCanvas(ctx, width, height);
      animationFrameId.current = requestAnimationFrame(runPhysics);
    };

    animationFrameId.current = requestAnimationFrame(runPhysics);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [pan, zoomLevel, selectedCategory, hoveredNode, selectedNode]);

  // Canvas Drawing
  const renderCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoomLevel, zoomLevel);

    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    // Draw Edges (Co-subscription Links)
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
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = Math.max(2, (edge.overlap / 100) * 4);
        ctx.globalAlpha = 0.85;
      } else {
        ctx.strokeStyle = "#d6caba";
        ctx.lineWidth = Math.max(1, (edge.overlap / 100) * 2.5);
        ctx.globalAlpha = 0.35;
      }
      ctx.stroke();

      // Show overlap percentage badge on hover
      if (isConnectedToHovered || isConnectedToSelected) {
        const midX = (n1.x + n2.x) / 2;
        const midY = (n1.y + n2.y) / 2;
        ctx.fillStyle = "#fdfaf5";
        ctx.strokeStyle = "#b45309";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.95;
        ctx.beginPath();
        ctx.roundRect(midX - 18, midY - 9, 36, 18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#92400e";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${edge.overlap}%`, midX, midY);
      }
    });

    ctx.globalAlpha = 1;

    // Draw Nodes
    currentNodes.forEach(node => {
      if (!node.x || !node.y) return;

      const isDimmed =
        selectedCategory !== "all" &&
        node.category.toLowerCase() !== selectedCategory.toLowerCase();
      const isHovered = hoveredNode?.id === node.id;
      const isSelected = selectedNode?.id === node.id;
      const r = (node.radius || 24) * (isHovered ? 1.15 : 1);

      // Node Halo for Subscribed or Selected
      if (node.isSubscribed || isSelected || isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + (node.isSubscribed ? 6 : 4), 0, Math.PI * 2);
        ctx.fillStyle = isSelected
          ? "rgba(180, 83, 9, 0.25)"
          : node.isSubscribed
          ? "rgba(180, 83, 9, 0.12)"
          : "rgba(180, 83, 9, 0.1)";
        ctx.fill();
      }

      // Node Body Circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected
        ? "#b45309"
        : node.isSubscribed
        ? "#fef3c7"
        : "#fdfaf5";
      ctx.fill();

      ctx.strokeStyle = isSelected
        ? "#78350f"
        : node.isSubscribed
        ? "#b45309"
        : "#d6caba";
      ctx.lineWidth = isSelected ? 3 : node.isSubscribed ? 2 : 1.5;
      ctx.stroke();

      // Node Letter Initial
      ctx.fillStyle = isSelected
        ? "#ffffff"
        : node.isSubscribed
        ? "#92400e"
        : "#574e44";
      ctx.font = `bold ${node.isSubscribed ? 13 : 11}px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(node.name.charAt(0), node.x, node.y - 1);

      // Node Title Label under circle
      ctx.fillStyle = isSelected
        ? "#92400e"
        : isHovered
        ? "#b45309"
        : "#1f1c19";
      ctx.font = `${node.isSubscribed ? "bold" : "normal"} 11px serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.globalAlpha = isDimmed ? 0.3 : 1;
      ctx.fillText(node.name, node.x, node.y + r + 5);

      // Subscribed indicator dot
      if (node.isSubscribed) {
        ctx.beginPath();
        ctx.arc(node.x + r - 3, node.y - r + 3, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#b45309";
        ctx.fill();
      }
    });

    ctx.restore();
  };

  // Resize canvas when container size changes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;

      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Mouse & Touch Interaction Handlers
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    return {
      x: (mouseX - pan.x) / zoomLevel,
      y: (mouseY - pan.y) / zoomLevel
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const clickedNode = nodesRef.current.find(node => {
      if (!node.x || !node.y) return false;
      const dist = Math.hypot(node.x - coords.x, node.y - coords.y);
      return dist <= (node.radius || 24);
    });

    if (clickedNode) {
      isDraggingNode.current = clickedNode;
      setSelectedNode(clickedNode);
    } else {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingNode.current) {
      const coords = getCanvasCoords(e);
      isDraggingNode.current.x = coords.x;
      isDraggingNode.current.y = coords.y;
      isDraggingNode.current.vx = 0;
      isDraggingNode.current.vy = 0;
      return;
    }

    if (isPanning.current) {
      setPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y
      });
      return;
    }

    // Check hover
    const coords = getCanvasCoords(e);
    const hovered = nodesRef.current.find(node => {
      if (!node.x || !node.y) return false;
      const dist = Math.hypot(node.x - coords.x, node.y - coords.y);
      return dist <= (node.radius || 24);
    });

    setHoveredNode(hovered || null);
  };

  const handleMouseUp = () => {
    isDraggingNode.current = null;
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoomLevel(prev => Math.min(Math.max(prev * zoomFactor, 0.5), 2.5));
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
      className="relative w-full h-[78vh] bg-[#fbf8f2] rounded-3xl border border-[#e8dfd1] overflow-hidden shadow-xs flex flex-col select-none"
    >
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        
        {/* Left: Category Filters */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-[#fdfaf5]/90 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-xs font-serif">
          {["all", "Systems", "Culture", "Design", "Business"].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl transition-all capitalize ${
                selectedCategory === cat
                  ? "bg-[#b45309] text-white font-bold shadow-xs"
                  : "text-[#574e44] hover:bg-[#f4ece1]"
              }`}
            >
              {cat === "all" ? "All Stars" : cat}
            </button>
          ))}
        </div>

        {/* Right: Zoom & Reset Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-2xl bg-[#fdfaf5]/90 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-[#574e44]">
          <button
            onClick={() => setZoomLevel(z => Math.min(z * 1.15, 2.5))}
            className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(z => Math.max(z * 0.85, 0.5))}
            className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[#e2d6c3]" />
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-[#f4ece1] hover:text-[#b45309] transition-colors"
            title="Reset Perspective"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-none hidden sm:flex items-center gap-4 px-3.5 py-1.5 rounded-full bg-[#fdfaf5]/90 backdrop-blur-md border border-[#e2d6c3] shadow-xs text-[11px] font-mono text-[#786b59]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#b45309]" />
          <span>Subscribed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full border border-[#b45309] bg-[#fdfaf5]" />
          <span>Co-subscription Overlap</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#b45309]">
          <Sparkles className="w-3 h-3" />
          <span>Drag nodes to explore physics</span>
        </div>
      </div>

      {/* Selected Node Inspection Card (Slide-up Popover) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="absolute bottom-4 right-4 z-30 w-84 max-w-[calc(100vw-2rem)] bg-[#fdfaf5] border border-[#e2d6c3] rounded-3xl shadow-xl p-5 space-y-3 font-serif"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#b45309] font-bold">
                  {selectedNode.category}
                </span>
                <h4 className="text-base font-bold text-[#1f1c19] mt-0.5 leading-snug">
                  {selectedNode.name}
                </h4>
                <a
                  href={`https://${selectedNode.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-[#786b59] hover:underline flex items-center gap-1 mt-0.5"
                >
                  <span>{selectedNode.domain}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-full text-[#8c7e6c] hover:bg-[#f4ece1] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#574e44] leading-relaxed">
              {selectedNode.description}
            </p>

            <div className="p-2.5 rounded-xl bg-[#f4ece1] border border-[#e2d6c3] text-[11px] font-mono text-[#78350f] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0" />
              <span>~{selectedNode.readersCount} shared readers in graph</span>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center gap-2">
              <button
                onClick={() => toggleSubscribe(selectedNode.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-serif font-medium transition-colors shadow-xs ${
                  selectedNode.isSubscribed
                    ? "bg-[#f4ece1] text-[#92400e] border border-[#e2d6c3] hover:bg-[#ebdcc8]"
                    : "bg-[#b45309] hover:bg-[#92400e] text-white"
                }`}
              >
                {selectedNode.isSubscribed ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Subscribed
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
                  className="p-2 rounded-xl border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] transition-colors"
                  title="Read latest essay"
                >
                  <BookOpen className="w-4 h-4 text-[#b45309]" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
