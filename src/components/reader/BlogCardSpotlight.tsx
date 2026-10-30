"use client";

import React, { useEffect, useRef } from "react";

interface BlogCardSpotlightProps {
  isDark?: boolean;
  className?: string;
  size?: number;
}

/**
 * A warm, subtle orangish circular glow that tracks the cursor strictly inside enclosed boxes.
 * Blends with the parchment / dark aesthetic and is clipped to the box boundaries (never shows outside).
 */
export default function BlogCardSpotlight({
  isDark = false,
  className = "",
  size = 96,
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
        // Warm peach / amber-orange radial falloff matching the user's uploaded spec
        background: isDark
          ? "radial-gradient(circle, rgba(251, 146, 60, 0.28) 0%, rgba(245, 158, 11, 0.16) 32%, rgba(180, 83, 9, 0.05) 62%, transparent 80%)"
          : "radial-gradient(circle, rgba(249, 115, 22, 0.34) 0%, rgba(245, 158, 11, 0.18) 32%, rgba(217, 119, 6, 0.06) 62%, transparent 80%)",
        willChange: "transform, opacity",
      }}
    />
  );
}
