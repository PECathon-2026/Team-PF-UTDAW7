"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Headphones,
  FastForward,
  Check
} from "lucide-react";

interface ListenModePlayerProps {
  paragraphs: string[];
  activeParagraphIndex: number;
  onParagraphChange: (index: number) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  onClose?: () => void;
}

const SPEED_OPTIONS = [1.0, 1.25, 1.5, 2.0];

export default function ListenModePlayer({
  paragraphs,
  activeParagraphIndex,
  onParagraphChange,
  onPlayingChange,
  onClose
}: ListenModePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(activeParagraphIndex);

  // Sync refs
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (onPlayingChange) onPlayingChange(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    currentIdxRef.current = activeParagraphIndex;
  }, [activeParagraphIndex]);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail.length > 0) {
        setVoices(avail);
        // Prefer natural English voices (e.g. Samantha, Daniel, Google, or first English)
        const bestVoice =
          avail.find(v => v.name.includes("Samantha") || v.name.includes("Daniel")) ||
          avail.find(v => v.lang.startsWith("en") && v.localService) ||
          avail.find(v => v.lang.startsWith("en")) ||
          avail[0];
        setSelectedVoice(bestVoice || null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speak specific paragraph
  const speakParagraph = (index: number, currentSpeed = speed) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (index >= paragraphs.length) {
      setIsPlaying(false);
      onParagraphChange(0);
      return;
    }

    const text = paragraphs[index];
    if (!text || text.trim().length === 0) {
      // Skip empty paragraph
      if (index + 1 < paragraphs.length) {
        onParagraphChange(index + 1);
        speakParagraph(index + 1, currentSpeed);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = currentSpeed;
    utterance.pitch = 1.0;
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      const nextIdx = index + 1;
      if (nextIdx < paragraphs.length) {
        onParagraphChange(nextIdx);
        speakParagraph(nextIdx, currentSpeed);
      } else {
        setIsPlaying(false);
        onParagraphChange(0);
      }
    };

    utterance.onerror = e => {
      if (e.error !== "canceled" && e.error !== "interrupted") {
        setIsPlaying(false);
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakParagraph(activeParagraphIndex, speed);
    }
  };

  // Restart from beginning
  const handleRestart = () => {
    onParagraphChange(0);
    if (isPlaying) {
      speakParagraph(0, speed);
    }
  };

  // Change Speed
  const cycleSpeed = () => {
    const curIdx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (curIdx + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIdx];
    setSpeed(nextSpeed);

    if (isPlaying) {
      speakParagraph(activeParagraphIndex, nextSpeed);
    }
  };

  const progressPercent =
    paragraphs.length > 0
      ? Math.round(((activeParagraphIndex + 1) / paragraphs.length) * 100)
      : 0;

  return (
    <div className="bg-[#fdfaf5] border-b border-[#e8dfd1] px-6 py-3 select-none flex flex-wrap items-center justify-between gap-4 font-serif text-[#1f1c19] shadow-2xs">
      
      {/* Left: Playback Controls & Equalizer */}
      <div className="flex items-center gap-3">
        {/* Play / Pause Primary Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[#b45309] hover:bg-[#92400e] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
          title={isPlaying ? "Pause audio (Space)" : "Listen to essay"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-white" />
          ) : (
            <Play className="w-4 h-4 fill-current text-white ml-0.5" />
          )}
        </button>

        {/* Restart / Rewind */}
        <button
          onClick={handleRestart}
          className="p-1.5 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] transition-colors"
          title="Restart from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Animated Equalizer Sound Waves */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#f4ece1] border border-[#e2d6c3]">
          <Headphones className="w-3.5 h-3.5 text-[#b45309]" />
          <div className="flex items-end gap-0.5 h-3.5 w-4 mx-1">
            <span
              className={`w-1 bg-[#b45309] rounded-full transition-all duration-300 ${
                isPlaying ? "h-3 animate-pulse" : "h-1"
              }`}
            />
            <span
              className={`w-1 bg-[#b45309] rounded-full transition-all duration-200 ${
                isPlaying ? "h-3.5 animate-bounce" : "h-1.5"
              }`}
            />
            <span
              className={`w-1 bg-[#b45309] rounded-full transition-all duration-300 ${
                isPlaying ? "h-2 animate-pulse" : "h-1"
              }`}
            />
          </div>
          <span className="text-[11px] font-mono text-[#78350f] font-medium hidden sm:inline">
            {isPlaying ? "Reading Aloud" : "Listen Mode"}
          </span>
        </div>
      </div>

      {/* Center: Reading Progress Scrubber */}
      <div className="flex-1 max-w-xs hidden md:flex items-center gap-3">
        <span className="text-[10px] font-mono text-[#8c7e6c] flex-shrink-0">
          Section {activeParagraphIndex + 1}/{paragraphs.length}
        </span>
        <div className="flex-1 h-1.5 bg-[#ebdcc8] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#b45309] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-[#8c7e6c] flex-shrink-0">
          {progressPercent}%
        </span>
      </div>

      {/* Right: Speed Toggle & Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-xs font-mono font-bold text-[#574e44] transition-colors"
          title="Change playback speed"
        >
          {speed.toFixed(2).replace(/\.00$/, "")}x
        </button>

        {onClose && (
          <button
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              setIsPlaying(false);
              onClose();
            }}
            className="text-[11px] font-mono text-[#8c7e6c] hover:text-[#b45309] px-2 py-1 rounded-md transition-colors"
          >
            Hide
          </button>
        )}
      </div>

    </div>
  );
}
