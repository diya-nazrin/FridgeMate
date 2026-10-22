"use client";

import React, { useState } from "react";
import { sound } from "@/lib/sound";
import { Sparkles, Code2, Cpu, Database, Palette, Volume2, ChevronDown, ChevronUp } from "lucide-react";

export function TechStackGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full bg-[#FFF0F5] border-3 border-[#FFD1E3] rounded-3xl p-5 sm:p-6 mb-12 shadow-sm">
      <button
        onClick={() => {
          sound.playPop();
          setIsOpen(!isOpen);
        }}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF8FB3] text-white flex items-center justify-center text-xl shadow-sm">
            💡
          </div>
          <div>
            <h3 className="font-baloo text-lg sm:text-xl font-bold text-[#5A3D4D]">
              How this 3D Fridge Animation & Tech Stack Works
            </h3>
            <p className="text-xs text-[#C2456F] font-medium">
              Click to {isOpen ? "collapse" : "expand"} the full technical architecture breakdown
            </p>
          </div>
        </div>

        <div className="p-2 rounded-full bg-white text-[#C2456F] border border-[#FFD1E3]">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-6 pt-6 border-t-2 border-[#FFD1E3] grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-poppins animate-fadeIn">
          {/* 1. CSS 3D Transforms */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#FFE1EC]">
            <div className="flex items-center gap-2 mb-2 font-baloo text-sm font-bold text-[#5A3D4D]">
              <Palette className="w-4 h-4 text-[#FF8FB3]" />
              <span>1. 3D CSS Door Swing & Physics</span>
            </div>
            <p className="text-[#5A3D4D]/80 leading-relaxed">
              We create the realistic physical door open using <code className="bg-[#FFE1EC] px-1 py-0.5 rounded text-[#C2456F] font-mono">perspective: 1600px</code>, <code className="bg-[#FFE1EC] px-1 py-0.5 rounded text-[#C2456F] font-mono">transform-style: preserve-3d</code>, and anchor the hinge on the left edge with <code className="bg-[#FFE1EC] px-1 py-0.5 rounded text-[#C2456F] font-mono">transform-origin: left center</code>. When clicked, the door swings with <code className="bg-[#FFE1EC] px-1 py-0.5 rounded text-[#C2456F] font-mono">transform: rotateY(-112deg)</code> using custom cubic-bezier spring easing!
            </p>
          </div>

          {/* 2. Web Audio API */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#FFE1EC]">
            <div className="flex items-center gap-2 mb-2 font-baloo text-sm font-bold text-[#5A3D4D]">
              <Volume2 className="w-4 h-4 text-[#FF8FB3]" />
              <span>2. Zero-Asset Web Audio API Synthesizer</span>
            </div>
            <p className="text-[#5A3D4D]/80 leading-relaxed">
              Instead of bulky external mp3 audio files that fail to load, we use the browser&apos;s native <code className="bg-[#FFE1EC] px-1 py-0.5 rounded text-[#C2456F] font-mono">AudioContext</code>. We synthesize the vacuum seal suction pop, white noise cold air intake whoosh, rubber gasket latch thud, and delicious eating crunch in real-time.
            </p>
          </div>

          {/* 3. React 19 + Next.js App Router */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#FFE1EC]">
            <div className="flex items-center gap-2 mb-2 font-baloo text-sm font-bold text-[#5A3D4D]">
              <Cpu className="w-4 h-4 text-[#FF8FB3]" />
              <span>3. React 19 State & Particle System</span>
            </div>
            <p className="text-[#5A3D4D]/80 leading-relaxed">
              React manages the state transitions: interior LED illumination triggers instantly upon opening, cold frost mist particles float wafting out, crisper drawers slide open with tactile feedback, and door bins dynamically rotate with the door frame.
            </p>
          </div>

          {/* 4. PostgreSQL + Drizzle ORM */}
          <div className="bg-white rounded-2xl p-4 border-2 border-[#FFE1EC]">
            <div className="flex items-center gap-2 mb-2 font-baloo text-sm font-bold text-[#5A3D4D]">
              <Database className="w-4 h-4 text-[#FF8FB3]" />
              <span>4. PostgreSQL + Drizzle ORM Storage</span>
            </div>
            <p className="text-[#5A3D4D]/80 leading-relaxed">
              All fridge pals, their shelf positions (Freezer, Top Shelf, Crispers, Door Bins), quantities, freshness counters, custom notes, recipes, and waste reduction scoreboards are safely stored in PostgreSQL with full type safety via Drizzle ORM.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
