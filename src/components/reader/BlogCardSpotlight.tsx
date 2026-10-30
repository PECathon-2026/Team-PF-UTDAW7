"use client";

import React, { useEffect, useRef } from "react";

interface BlogCardSpotlightProps {
  isDark?: boolean;
  className?: string;
  size?: number;
  variant?: "orange" | "yellow";
}

/**
 * A warm, subtle circular glow that tracks the cursor strictly inside enclosed boxes or buttons.
 * Blends with the parchment / dark aesthetic and is clipped to the box boundaries (never shows outside).
 */
export default function BlogCardSpotlight({
  isDark = false,
  className = "",
  size = 96,
  variant = "orange",
}: BlogCardSpotlightProps) {
  const glowRef = useRef<HTMLDivElement>(null);
  const half = Math.round(size / 2);

  useEffect(() => {
    const glowEl = glowRef.current;
    if (!glowEl) return;

    const parent = glowEl.parentElement;
    if (!parent) return;

    let isInside = false;

    const updatePosition = (e: MouseEvent) => {
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure glow updates position without React re-renders for 60/120fps smoothness
      glowEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!isInside) {
        isInside = true;
        glowEl.style.opacity = "1";
      }
    };

    const handleMouseEnter = (e: MouseEvent) => {
      isInside = true;
      const rect = parent.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glowEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      glowEl.style.opacity = "1";
    };

    const handleMouseLeave = () => {
      isInside = false;
      glowEl.style.opacity = "0";
    };

    parent.addEventListener("mousemove", updatePosition, { passive: true });
    parent.addEventListener("mouseenter", handleMouseEnter, { passive: true });
    parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      parent.removeEventListener("mousemove", updatePosition);
      parent.removeEventListener("mouseenter", handleMouseEnter);
      parent.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const getBackground = () => {
    if (variant === "yellow") {
      return isDark
        ? "radial-gradient(circle, rgba(250, 204, 21, 0.42) 0%, rgba(234, 179, 8, 0.24) 35%, rgba(161, 98, 7, 0.08) 65%, transparent 80%)"
        : "radial-gradient(circle, rgba(234, 179, 8, 0.48) 0%, rgba(250, 204, 21, 0.28) 35%, rgba(245, 158, 11, 0.10) 65%, transparent 80%)";
    }

    // Default warm orange
    return isDark
      ? "radial-gradient(circle, rgba(251, 146, 60, 0.32) 0%, rgba(245, 158, 11, 0.18) 32%, rgba(180, 83, 9, 0.05) 62%, transparent 80%)"
      : "radial-gradient(circle, rgba(249, 115, 22, 0.36) 0%, rgba(245, 158, 11, 0.20) 32%, rgba(217, 119, 6, 0.06) 62%, transparent 80%)";
  };

  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full transition-opacity duration-200 ease-out z-0 ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        marginLeft: `-${half}px`,
        marginTop: `-${half}px`,
        left: 0,
        top: 0,
        opacity: 0,
        background: getBackground(),
        willChange: "transform, opacity",
      }}
    />
  );
}
