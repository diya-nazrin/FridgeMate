"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sound } from "@/lib/sound";

export function BottomTabs() {
  const pathname = usePathname();

  const tabs = [
    { href: "/", label: "home", emoji: "🏠" },
    { href: "/fridge", label: "fridge", emoji: "🧊" },
    { href: "/upload", label: "scan", emoji: "🧾" },
    { href: "/cook", label: "cook", emoji: "🍳" },
    { href: "/grocery", label: "list", emoji: "🛒" },
    { href: "/dashboard", label: "stats", emoji: "✨" },
  ];

  return (
    <nav className="lg:hidden fixed left-0 right-0 bottom-0 z-40 bg-white border-t-3 border-[#FFD1E3] py-2 px-1 flex justify-between shadow-[0_-4px_16px_rgba(255,143,179,0.15)]">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => sound.playPop()}
            className={`flex-1 flex flex-col items-center gap-0.5 text-[10px] font-bold transition-all ${
              isActive
                ? "text-[#FF8FB3] scale-110"
                : "text-[#5A3D4D]/60 hover:text-[#5A3D4D]"
            }`}
          >
            <span className="text-xl leading-none">{tab.emoji}</span>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
