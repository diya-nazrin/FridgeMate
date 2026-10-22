"use client";

import React from "react";

/**
 * Pure-CSS/SVG scenic backdrop: a pastel dawn kitchen-hill landscape with a
 * glowing fridge cabin, drifting clouds, twinkling stars and floating fruit pals.
 * No images, no canvas — everything is vector + keyframes so it stays crisp
 * and lightweight at any viewport.
 */
export function WelcomeScene() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FFE9F3 0%, #FFF3E4 38%, #FFE1EC 62%, #FFD9EA 100%)",
        }}
      />

      {/* Soft sun glow */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full opacity-70 blur-3xl animate-sun-pulse"
        style={{ background: "radial-gradient(circle, #FFD166 0%, rgba(255,209,102,0) 70%)" }}
      />

      {/* Twinkling sparkle stars */}
      {[
        { top: "8%", left: "12%", delay: "0s", size: 10 },
        { top: "14%", left: "78%", delay: "1.1s", size: 8 },
        { top: "6%", left: "55%", delay: "2.2s", size: 12 },
        { top: "20%", left: "30%", delay: "0.6s", size: 7 },
        { top: "11%", left: "90%", delay: "1.7s", size: 9 },
        { top: "24%", left: "66%", delay: "2.8s", size: 6 },
      ].map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            animationDelay: s.delay,
            filter: "drop-shadow(0 0 6px rgba(255,255,255,0.9))",
          }}
        >
          ✦
        </span>
      ))}

      {/* Drifting clouds */}
      <div className="absolute top-[12%] left-0 w-full h-32">
        <Cloud className="animate-drift-slow" style={{ top: 0, left: "-10%", scale: "1.2" }} />
        <Cloud className="animate-drift-slower" style={{ top: 46, left: "-25%", scale: "0.8", opacity: 0.75 }} />
        <Cloud className="animate-drift-slow" style={{ top: 18, left: "-45%", scale: "1", opacity: 0.6, animationDelay: "9s" }} />
      </div>

      {/* Far hills */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: "46%" }}
      >
        <path
          fill="#FFC2DA"
          fillOpacity="0.55"
          d="M0,192L60,181.3C120,171,240,149,360,149.3C480,149,600,171,720,181.3C840,192,960,192,1080,176C1200,160,1320,128,1380,112L1440,96L1440,320L0,320Z"
        />
      </svg>

      {/* Mid hills */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: "34%" }}
      >
        <path
          fill="#FFB3CA"
          fillOpacity="0.75"
          d="M0,224L80,213.3C160,203,320,181,480,186.7C640,192,800,224,960,229.3C1120,235,1280,213,1360,202.7L1440,192L1440,320L0,320Z"
        />
      </svg>

      {/* Foreground meadow */}
      <svg
        className="absolute bottom-0 left-0 w-full"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        style={{ height: "22%" }}
      >
        <path fill="#8FD9C4" fillOpacity="0.95" d="M0,96L1440,64L1440,200L0,200Z" />
        <path fill="#7ACCB6" d="M0,120L1440,96L1440,200L0,200Z" />
      </svg>

      {/* Fridge cabin silhouette sitting on the meadow */}
      <div className="absolute bottom-[13%] right-[9%] animate-float-gentle">
        <div className="relative w-20 h-32 rounded-t-[16px] rounded-b-[10px] bg-white/95 border-4 border-[#FF8FB3] shadow-[0_12px_28px_rgba(194,69,111,0.28)]">
          <div className="absolute inset-x-1 top-1 h-12 rounded-t-[11px] bg-gradient-to-b from-[#FFE1EC] to-white" />
          <div className="absolute inset-x-1 top-[54px] h-[22px] rounded-[6px] bg-[#FFF0F5]" />
          <div className="absolute right-1 top-6 w-1.5 h-7 rounded-full bg-[#FF8FB3]" />
          <div className="absolute right-1 top-[60px] w-1.5 h-5 rounded-full bg-[#FF8FB3]" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-lg animate-twinkle">✨</div>
        </div>
      </div>

      {/* Little fruit pals bobbing in the meadow */}
      <div className="absolute bottom-[15%] left-[8%] text-3xl animate-bob">🍓</div>
      <div className="absolute bottom-[19%] left-[19%] text-2xl animate-bob" style={{ animationDelay: "0.7s" }}>
        🥑
      </div>
      <div className="absolute bottom-[14%] left-[31%] text-3xl animate-bob" style={{ animationDelay: "1.4s" }}>
        🥛
      </div>
      <div className="absolute bottom-[17%] right-[27%] text-2xl animate-bob" style={{ animationDelay: "0.4s" }}>
        🥦
      </div>
      <div className="absolute bottom-[13%] right-[38%] text-3xl animate-bob" style={{ animationDelay: "1.1s" }}>
        🧀
      </div>

      {/* Butterflies */}
      <div className="absolute top-[38%] left-[16%] text-xl animate-flutter">🦋</div>
      <div className="absolute top-[44%] right-[20%] text-lg animate-flutter" style={{ animationDelay: "1.8s" }}>
        🦋
      </div>
    </div>
  );
}

function Cloud({ className = "", style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <div className="relative w-32 h-10">
        <div className="absolute bottom-0 left-0 w-32 h-8 rounded-full bg-white/85" />
        <div className="absolute bottom-3 left-6 w-14 h-14 rounded-full bg-white/85" />
        <div className="absolute bottom-2 left-16 w-11 h-11 rounded-full bg-white/85" />
      </div>
    </div>
  );
}
