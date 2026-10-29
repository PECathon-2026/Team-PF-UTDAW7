"use client";

import {
    motion,
    useTransform,
    useReducedMotion,
    useMotionValue,
    useSpring,
    MotionValue,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, Compass, ArrowRight, Feather, Coffee, Sparkles, ChevronDown } from "lucide-react";

interface BlogCardItem {
    src: string;
    author: string;
    title: string;
    readTime: string;
    category: string;
    date: string;
}

const BLOG_EDITORIAL_CARDS: BlogCardItem[] = [
    {
        src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
        author: "Paul Graham",
        title: "Maker's Schedule, Manager's Schedule",
        readTime: "6 min read",
        category: "Essays",
        date: "Classic",
    },
    {
        src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        author: "Dan Luu",
        title: "Why Modern Software Feels Sluggish",
        readTime: "12 min read",
        category: "Systems",
        date: "Deep Dive",
    },
    {
        src: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
        author: "Maggie Appleton",
        title: "A Brief History of Digital Gardens",
        readTime: "8 min read",
        category: "Indie Web",
        date: "Evergreen",
    },
    {
        src: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
        author: "Gwern Branwen",
        title: "Spaced Repetition & Longform Epistemics",
        readTime: "18 min read",
        category: "Philosophy",
        date: "Research",
    },
    {
        src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
        author: "Robin Sloan",
        title: "The Stock and the Flow of Reading",
        readTime: "5 min read",
        category: "Craft",
        date: "Essays",
    },
    {
        src: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80",
        author: "Simon Willison",
        title: "Small Software & Decentralized Feeds",
        readTime: "4 min read",
        category: "Open Web",
        date: "Weekly",
    },
    {
        src: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80",
        author: "Craig Mod",
        title: "The Solitary Walk as an Editorial Act",
        readTime: "9 min read",
        category: "Journals",
        date: "Reflections",
    },
    {
        src: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80",
        author: "Kev Quirk",
        title: "Why RSS Remains the Web's Greatest Gift",
        readTime: "4 min read",
        category: "Manifesto",
        date: "IndieWeb",
    },
    {
        src: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
        author: "Derek Sivers",
        title: "Obvious to You, Amazing to Others",
        readTime: "3 min read",
        category: "Thoughts",
        date: "Notes",
    },
];

interface TunnelCardData {
    item: BlogCardItem;
    angleCos: number;
    angleSin: number;
    radiusFactorX: number;
    radiusFactorY: number;
    rotationZ: number;
    index: number;
}

const SPRING_CONFIG = { stiffness: 60, damping: 25, mass: 0.5 };

interface StageDimensions {
    width: number;
    height: number;
    isMobile: boolean;
}

function useCameraParallax(enabled: boolean) {
    const rawX = useMotionValue(0);
    const rawY = useMotionValue(0);
    const x = useSpring(rawX, SPRING_CONFIG);
    const y = useSpring(rawY, SPRING_CONFIG);

    useEffect(() => {
        if (!enabled) return;
        const onMove = (e: PointerEvent) => {
            rawX.set((e.clientX / window.innerWidth - 0.5) * 2);
            rawY.set((e.clientY / window.innerHeight - 0.5) * 2);
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        return () => window.removeEventListener("pointermove", onMove);
    }, [enabled, rawX, rawY]);

    return { x, y };
}

interface TunnelCardProps {
    card: TunnelCardData;
    progress: MotionValue<number>;
    pointer: { x: MotionValue<number>; y: MotionValue<number> };
    total: number;
    stage: StageDimensions;
}

function TunnelCard({ card, progress, pointer, total, stage }: TunnelCardProps) {
    const staggerSpan = 0.55;
    const start = (card.index / total) * (1 - staggerSpan);
    const end = start + staggerSpan;

    const localProgress = useTransform(progress, [start, end], [0, 1]);

    const farZ = stage.isMobile ? -1200 : -1700;
    const nearZ = stage.isMobile ? 350 : 500;
    const z = useTransform(localProgress, [0, 1], [farZ, nearZ]);

    const opacity = useTransform(localProgress, [0, 0.18, 0.82, 0.98], [0, 1, 1, 0]);

    const cardWidth = stage.isMobile
        ? Math.max(170, Math.min(230, stage.width * 0.48))
        : Math.max(230, Math.min(320, stage.width * 0.23));

    const baseX = card.angleCos * (stage.width * card.radiusFactorX);
    const baseY = card.angleSin * (stage.height * card.radiusFactorY);
    const panStrength = stage.isMobile ? 22 : 48;

    const transform = useTransform(
        [z, pointer.x, pointer.y],
        ([currZ, px, py]: number[]) => {
            const offsetX = baseX - px * panStrength;
            const offsetY = baseY - py * panStrength;
            return `translate3d(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px), ${currZ}px) rotateZ(${card.rotationZ}deg)`;
        }
    );

    return (
        <motion.div
            style={{
                width: cardWidth,
                transform,
                opacity,
                zIndex: card.index + 1,
            }}
            className="pointer-events-auto absolute left-1/2 top-1/2 aspect-[3/4.2] will-change-transform select-none cursor-pointer"
        >
            {/* Tactile Warm Editorial Card in Crisp Book Paper */}
            <div className="group relative h-full w-full overflow-hidden rounded-2xl bg-[#fffdfa] border border-[#e8dfd3] shadow-[0_16px_40px_rgba(120,95,70,0.14)] transition-all duration-500 hover:border-[#b45309]/70 hover:shadow-[0_22px_50px_rgba(180,83,9,0.22)] flex flex-col">
                
                {/* Top Half: Warm Photography */}
                <div className="relative h-[56%] w-full overflow-hidden bg-[#f0e8dc]">
                    <img
                        src={card.item.src}
                        alt={card.item.title}
                        draggable={false}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 filter saturate-[0.95]"
                    />
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider uppercase bg-[#fffdfa]/95 text-[#92400e] border border-[#e8dfd3] shadow-sm backdrop-blur-sm">
                            <Feather className="w-2.5 h-2.5" />
                            {card.item.category}
                        </span>
                    </div>
                </div>

                {/* Bottom Half: Warm Editorial Paper Deck */}
                <div className="flex-1 flex flex-col justify-between p-4 bg-[#fffdfa] text-[#1f1c19] border-t border-[#f0e8dc]">
                    <div className="space-y-1">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#b45309] font-bold">
                            {card.item.author}
                        </p>
                        <h3 className="text-sm sm:text-base font-serif font-medium leading-snug tracking-tight text-[#1f1c19] group-hover:text-[#b45309] transition-colors line-clamp-2">
                            {card.item.title}
                        </h3>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-[#8c7e6c] border-t border-[#f5ede0]">
                        <span>{card.item.readTime}</span>
                        <span className="group-hover:translate-x-1 transition-transform text-[#b45309] font-semibold flex items-center gap-1">
                            Read <ArrowRight className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default function PerspectiveTunnelHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const reduce = useReducedMotion();

    const [stage, setStage] = useState<StageDimensions>({
        width: 1440,
        height: 900,
        isMobile: false,
    });

    useEffect(() => {
        const updateDimensions = () => {
            setStage({
                width: window.innerWidth,
                height: window.innerHeight,
                isMobile: window.innerWidth < 768,
            });
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    const tunnelCards: TunnelCardData[] = BLOG_EDITORIAL_CARDS.map((item, i) => {
        const goldenAngle = i * 137.5 * (Math.PI / 180);
        const radiusFactorX = 0.28 + (i % 3) * 0.08;
        const radiusFactorY = 0.26 + (i % 2) * 0.09;

        return {
            item,
            angleCos: Math.cos(goldenAngle),
            angleSin: Math.sin(goldenAngle),
            radiusFactorX,
            radiusFactorY,
            rotationZ: (i % 2 === 0 ? 1 : -1) * (2.5 + (i % 4) * 2),
            index: i,
        };
    });

    const rawProgress = useMotionValue(0);
    const smoothProgress = useSpring(rawProgress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.0001,
    });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const handleWheel = (e: WheelEvent) => {
            const current = rawProgress.get();
            if (window.scrollY > 20) {
                return;
            }
            if (current >= 0.95 && e.deltaY > 0) {
                return;
            }
            if (current <= 0.02 && e.deltaY < 0) {
                return;
            }
            e.preventDefault();
            const delta = e.deltaY * 0.0008;
            const next = Math.min(1, Math.max(0, current + delta));
            rawProgress.set(next);
        };

        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [rawProgress]);

    const pointer = useCameraParallax(!reduce);

    const titleScale = useTransform(smoothProgress, [0, 0.5, 1], [0.85, 1, 1.25]);
    const titleOpacity = useTransform(smoothProgress, [0, 0.15, 0.85, 1], [0.25, 1, 1, 0]);
    const promptOpacity = useTransform(smoothProgress, [0, 0.12], [1, 0]);
    const actionsOpacity = useTransform(smoothProgress, [0.35, 0.65, 0.95, 1], [0, 1, 1, 0.2]);

    return (
        <div
            ref={containerRef}
            className="relative h-[100svh] w-screen overflow-hidden bg-[#fbf8f2] text-[#1f1c19] select-none flex items-center justify-center font-sans"
            style={{
                perspective: stage.isMobile ? "900px" : "1200px",
                transformStyle: "preserve-3d",
            }}
        >
            {/* Top Navigation Bar: Warm Parchment & Linen */}
            <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#e8dfd3]/90 backdrop-blur-md bg-[#fbf8f2]/85">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-md bg-[#b45309] flex items-center justify-center text-white font-serif font-bold text-base shadow-sm">
                        ¶
                    </div>
                    <div>
                        <span className="font-serif font-medium text-base tracking-tight text-[#1f1c19]">The Small Web Reader</span>
                        <span className="ml-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#fde68a]/60 text-[#92400e] border border-[#f59e0b]/30">PECathon 2026</span>
                    </div>
                </div>

                <div className="flex items-center gap-5">
                    <div className="hidden md:flex items-center gap-5 text-xs font-mono text-[#786b59]">
                        <span className="flex items-center gap-1.5"><Coffee className="w-3.5 h-3.5 text-[#b45309]" /> Slow Reading</span>
                        <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-[#b45309]" /> Zero Tracking</span>
                    </div>
                    <Link
                        href="/reader"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1f1c19] text-[#fbf8f2] hover:bg-[#38332c] text-xs font-serif font-medium transition-all hover:scale-105 shadow-sm"
                    >
                        Enter Library <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </header>

            {/* Warm Paper Grid Texture & Honey Radial Glow */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e4dacb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_75%_75%_at_50%_50%,#000_65%,transparent_100%)] opacity-70" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.06)_0%,transparent_70%)]" />

            {/* Subtle Concentric Warm Guides */}
            <div className="pointer-events-none absolute h-[52vmin] w-[52vmin] rounded-full border border-[#b45309]/15" />
            <div className="pointer-events-none absolute h-[82vmin] w-[82vmin] rounded-full border border-dashed border-[#d8cca8]/60" />

            {/* Central Typography: Warm Editorial / Literary Book Style */}
            <motion.div
                style={{ scale: titleScale, opacity: titleOpacity }}
                className="pointer-events-none z-10 flex flex-col items-center text-center px-6 max-w-2xl"
            >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f3ecdf] border border-[#e2d6c3] text-[#92400e] text-xs font-mono tracking-widest uppercase mb-5 shadow-xs">
                    <Feather className="w-3.5 h-3.5 text-[#b45309]" />
                    <span>Independent Voices • Ad-Free</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight leading-[1.08] text-[#1f1c19]">
                    Read the Original Web.
                    <br />
                    <span className="italic font-light text-[#786b59]">Before Algorithms Took Over.</span>
                </h1>
                
                <p className="mt-5 max-w-[44ch] text-sm sm:text-base font-serif text-[#574e44] leading-relaxed">
                    A calm, offline-first sanctuary for longform thinkers, digital gardens, and indie blogs. Discovered through human reader overlap, never corporate tracking.
                </p>

                {/* Action Buttons that reveal during scroll travel */}
                <motion.div
                    style={{ opacity: actionsOpacity }}
                    className="pointer-events-auto mt-8 flex flex-wrap items-center justify-center gap-3.5"
                >
                    <Link
                        href="/reader"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-serif font-medium text-sm transition-all shadow-md shadow-[#b45309]/20 hover:scale-105"
                    >
                        <BookOpen className="w-4 h-4 text-white" /> Open Personal Timeline
                    </Link>
                    <Link
                        href="/discover"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#d6caba] text-[#1f1c19] font-serif font-medium text-sm hover:border-[#b45309]/60 hover:bg-[#faf5eb] transition-all"
                    >
                        <Compass className="w-4 h-4 text-[#b45309]" /> Anonymous Discovery
                    </Link>
                </motion.div>
            </motion.div>

            {/* Warm Quill Scroll Prompt */}
            <motion.div
                style={{ opacity: promptOpacity }}
                className="pointer-events-none absolute bottom-12 z-20 flex flex-col items-center gap-2 text-xs font-mono uppercase tracking-[0.25em] text-[#8c7e6c]"
            >
                <span>Scroll to explore the library</span>
                <div className="h-7 w-px bg-gradient-to-b from-[#b45309] to-transparent animate-pulse" />
            </motion.div>

            {/* Quick Explore Anchor */}
            <a
                href="#features"
                className="pointer-events-auto absolute bottom-3.5 z-30 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f3ecdf]/90 border border-[#e2d6c3] text-[11px] font-mono text-[#786b59] hover:text-[#b45309] hover:bg-[#fffdfa] transition-all shadow-xs backdrop-blur-sm cursor-pointer"
            >
                <span>Explore Architecture & Seed Library</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#b45309] animate-bounce" />
            </a>

            {/* 3D Z-Space Blog Tunnel Cards */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ transformStyle: "preserve-3d" }}
            >
                {tunnelCards.map((card, i) => (
                    <TunnelCard
                        key={i}
                        card={card}
                        progress={smoothProgress}
                        pointer={pointer}
                        total={tunnelCards.length}
                        stage={stage}
                    />
                ))}
            </div>
        </div>
    );
}
