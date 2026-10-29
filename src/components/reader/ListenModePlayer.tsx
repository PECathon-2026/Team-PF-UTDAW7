"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Headphones,
  ChevronDown,
  X
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
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");

  const isPlayingRef = useRef(false);
  const currentIdxRef = useRef(activeParagraphIndex);
  const speedRef = useRef(speed);
  const voiceNameRef = useRef(selectedVoiceName);
  const voicesListRef = useRef<SpeechSynthesisVoice[]>([]);

  // Keep refs synchronized
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (onPlayingChange) onPlayingChange(isPlaying);
  }, [isPlaying, onPlayingChange]);

  useEffect(() => {
    currentIdxRef.current = activeParagraphIndex;
  }, [activeParagraphIndex]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    voiceNameRef.current = selectedVoiceName;
  }, [selectedVoiceName]);

  // Load available browser voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const avail = window.speechSynthesis.getVoices();
      if (avail.length > 0) {
        setVoices(avail);
        voicesListRef.current = avail;

        // Default to a good natural English voice if not selected
        if (!voiceNameRef.current) {
          const naturalVoice =
            avail.find(v => v.name.includes("Samantha") || v.name.includes("Daniel")) ||
            avail.find(v => v.lang.startsWith("en") && v.localService) ||
            avail.find(v => v.lang.startsWith("en")) ||
            avail[0];

          if (naturalVoice) {
            setSelectedVoiceName(naturalVoice.name);
            voiceNameRef.current = naturalVoice.name;
          }
        }
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

  // Stop speech when player unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Helper to get active voice object
  const getSelectedVoice = (vName = selectedVoiceName) => {
    return voicesListRef.current.find(v => v.name === vName) || null;
  };

  // Speak specific paragraph
  const speakParagraph = (
    index: number,
    currentSpeed = speedRef.current,
    vName = voiceNameRef.current
  ) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (index >= paragraphs.length) {
      setIsPlaying(false);
      onParagraphChange(0);
      return;
    }

    const text = paragraphs[index];
    if (!text || text.trim().length === 0) {
      // Auto-advance if empty
      const nextIdx = index + 1;
      if (nextIdx < paragraphs.length) {
        onParagraphChange(nextIdx);
        speakParagraph(nextIdx, currentSpeed, vName);
      } else {
        setIsPlaying(false);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = currentSpeed;
    utterance.pitch = 1.0;

    const voice = getSelectedVoice(vName);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      if (!isPlayingRef.current) return;
      const nextIdx = index + 1;
      if (nextIdx < paragraphs.length) {
        onParagraphChange(nextIdx);
        speakParagraph(nextIdx, currentSpeed, vName);
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

  // Watch external activeParagraphIndex changes (e.g. clicking paragraph or dragging scrubber)
  const lastActiveIndex = useRef(activeParagraphIndex);
  useEffect(() => {
    if (lastActiveIndex.current !== activeParagraphIndex) {
      lastActiveIndex.current = activeParagraphIndex;
      // If currently playing, immediately speak from this newly selected paragraph!
      if (isPlayingRef.current) {
        speakParagraph(activeParagraphIndex, speed, selectedVoiceName);
      }
    }
  }, [activeParagraphIndex, speed, selectedVoiceName]);

  // Play / Pause toggle
  const togglePlay = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakParagraph(activeParagraphIndex, speed, selectedVoiceName);
    }
  };

  // Restart from beginning
  const handleRestart = () => {
    onParagraphChange(0);
    if (isPlaying) {
      speakParagraph(0, speed, selectedVoiceName);
    }
  };

  // Change Speed
  const cycleSpeed = () => {
    const curIdx = SPEED_OPTIONS.indexOf(speed);
    const nextIdx = (curIdx + 1) % SPEED_OPTIONS.length;
    const nextSpeed = SPEED_OPTIONS[nextIdx];
    setSpeed(nextSpeed);

    if (isPlaying) {
      speakParagraph(activeParagraphIndex, nextSpeed, selectedVoiceName);
    }
  };

  // Handle Voice Change
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoiceName = e.target.value;
    setSelectedVoiceName(newVoiceName);
    voiceNameRef.current = newVoiceName;

    if (isPlaying) {
      speakParagraph(activeParagraphIndex, speed, newVoiceName);
    }
  };

  // Handle Draggable Scrubber Change
  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    onParagraphChange(newIndex);
    // If playing, immediately switch playback to this scrubbed point
    if (isPlaying) {
      speakParagraph(newIndex, speed, selectedVoiceName);
    }
  };

  const progressPercent =
    paragraphs.length > 1
      ? Math.round((activeParagraphIndex / (paragraphs.length - 1)) * 100)
      : 100;

  // Filter natural English voices first, fallback to all
  const englishVoices = voices.filter(v => v.lang.startsWith("en"));
  const availableVoices = englishVoices.length > 0 ? englishVoices : voices;

  return (
    <div className="bg-[#fdfaf5] border-b border-[#e8dfd1] px-6 py-3 select-none flex flex-wrap items-center justify-between gap-4 font-serif text-[#1f1c19] shadow-2xs">
      
      {/* 1. Left Controls: Play/Pause, Restart, Equalizer */}
      <div className="flex items-center gap-2.5">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className="w-9 h-9 rounded-full bg-[#b45309] hover:bg-[#92400e] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
          title={isPlaying ? "Pause audio" : "Listen to essay"}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current text-white" />
          ) : (
            <Play className="w-4 h-4 fill-current text-white ml-0.5" />
          )}
        </button>

        {/* Restart / Rewind to Start */}
        <button
          onClick={handleRestart}
          className="p-1.5 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] transition-colors"
          title="Restart from beginning"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Animated Equalizer Waves Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#f4ece1] border border-[#e2d6c3]">
          <Headphones className="w-3.5 h-3.5 text-[#b45309]" />
          <div className="flex items-end gap-0.5 h-3.5 w-4 mx-0.5">
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

      {/* 2. Center: Draggable / Interactive Progress Scrubber */}
      <div className="flex-1 max-w-sm flex items-center gap-2.5 min-w-[180px]">
        <span className="text-[10px] font-mono text-[#8c7e6c] flex-shrink-0 w-12 text-right">
          {activeParagraphIndex + 1}/{paragraphs.length}
        </span>

        {/* Interactive Slider Input */}
        <div className="flex-1 relative flex items-center group py-2">
          <input
            type="range"
            min={0}
            max={Math.max(0, paragraphs.length - 1)}
            step={1}
            value={activeParagraphIndex}
            onChange={handleScrubberChange}
            className="w-full h-1.5 bg-[#ebdcc8] rounded-full appearance-none cursor-pointer accent-[#b45309] focus:outline-none transition-all group-hover:h-2"
            style={{
              background: `linear-gradient(to right, #b45309 ${progressPercent}%, #ebdcc8 ${progressPercent}%)`
            }}
            title={`Drag to scrub section (currently section ${activeParagraphIndex + 1})`}
          />
        </div>

        <span className="text-[10px] font-mono text-[#8c7e6c] flex-shrink-0 w-8">
          {progressPercent}%
        </span>
      </div>

      {/* 3. Right: Voice Selector & Speed */}
      <div className="flex items-center gap-2">
        {/* Voice Selector Dropdown */}
        {availableVoices.length > 0 && (
          <div className="relative flex items-center">
            <Volume2 className="w-3.5 h-3.5 absolute left-2 text-[#b45309] pointer-events-none" />
            <select
              value={selectedVoiceName}
              onChange={handleVoiceChange}
              className="text-[11px] font-mono bg-white border border-[#e2d6c3] rounded-lg pl-6 pr-6 py-1 text-[#574e44] hover:border-[#b45309] focus:outline-none focus:ring-1 focus:ring-[#b45309] cursor-pointer max-w-[135px] truncate appearance-none"
              title="Select Narrator Voice"
            >
              {availableVoices.map(v => (
                <option key={v.name} value={v.name}>
                  {v.name.replace(/^(Google|Microsoft|Apple|Natural)\s+/i, "").split(" ")[0]} ({v.lang.split("-")[0].toUpperCase()})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 absolute right-1.5 text-[#8c7e6c] pointer-events-none" />
          </div>
        )}

        {/* Speed Toggle (1.0x, 1.25x, 1.5x, 2.0x) */}
        <button
          onClick={cycleSpeed}
          className="px-2.5 py-1 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] hover:border-[#b45309] text-xs font-mono font-bold text-[#574e44] transition-colors"
          title="Change playback speed"
        >
          {speed.toFixed(2).replace(/\.00$/, "")}x
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              setIsPlaying(false);
              onClose();
            }}
            className="p-1 rounded-md text-[#8c7e6c] hover:text-[#b45309] hover:bg-[#f4ece1] transition-colors"
            title="Hide listen bar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
