"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Plus, RefreshCw, LogOut, Settings2, User } from "lucide-react";
import { sound } from "@/lib/sound";
import { useAuth } from "./AuthProvider";

interface NavbarProps {
  onOpenAddModal?: () => void;
  onResetData?: () => void;
}

export function Navbar({ onOpenAddModal, onResetData }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout, refresh } = useAuth();
  const [muted, setMuted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMuted(sound.getMuted());
  }, []);

  // App-wide guard: the navbar renders on every protected page, so this single
  // effect keeps unauthenticated visitors out and nudges new users through
  // onboarding before they reach the fridge. It re-checks the session once
  // before bouncing, so a just-set cookie is never mistaken for "signed out".
  const rechecked = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      if (!user.profile?.onboardingComplete) router.replace("/onboarding");
      return;
    }
    // Re-verify once before bouncing — a cookie set moments ago by a successful
    // login must not be mistaken for a signed-out visitor.
    if (rechecked.current) {
      router.replace("/welcome");
      return;
    }
    rechecked.current = true;
    void refresh();
  }, [loading, user, router, refresh]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sound.setMuted(next);
    if (!next) sound.playPop();
  };

  const navLinks = [
    { href: "/", label: "home", emoji: "🏠" },
    { href: "/fridge", label: "my fridge", emoji: "🧊" },
    { href: "/upload", label: "scan bill", emoji: "🧾" },
    { href: "/cook", label: "what to cook?", emoji: "🍳" },
    { href: "/grocery", label: "grocery list", emoji: "🛒" },
    { href: "/dashboard", label: "dashboard", emoji: "✨" },
  ];

  const firstName = user?.name?.split(" ")[0] ?? "friend";

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b-3 border-[#FFD1E3] shadow-[0_12px_0_#FFD1E3] mb-8 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
        <Link
          href="/"
          onClick={() => sound.playPop()}
          className="flex items-center gap-2 font-baloo text-xl sm:text-[24px] font-bold text-[#5A3D4D] hover:opacity-90 transition-opacity shrink-0"
        >
          <span className="text-2xl sm:text-[26px] animate-bounce">🧊</span>
          <span>fridgemate</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => sound.playPop()}
                className={`font-poppins text-[12.5px] font-bold tracking-[0.3px] px-3.5 py-2 rounded-full transition-all duration-150 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#FF8FB3] text-white shadow-[0_2px_8px_rgba(255,143,179,0.5)] scale-105"
                    : "bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3]"
                }`}
              >
                <span>{link.emoji}</span>
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            title={muted ? "Sound muted — click to enable" : "Sound on — click to mute"}
            className={`p-2 rounded-full border-2 transition-all ${
              muted
                ? "bg-[#FFF0F5] border-[#FFD1E3] text-[#5A3D4D]/50 hover:text-[#5A3D4D]"
                : "bg-[#FFE1EC] border-[#FF8FB3] text-[#C2456F] hover:scale-105"
            }`}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {onOpenAddModal && (
            <button
              onClick={() => {
                sound.playPop();
                onOpenAddModal();
              }}
              className="bg-[#FF8FB3] hover:bg-[#FF7BA3] active:scale-95 text-white font-poppins text-xs sm:text-[13px] font-bold tracking-[0.3px] px-3.5 sm:px-4 py-2 rounded-full transition-all flex items-center gap-1.5 shadow-[0_3px_10px_rgba(255,143,179,0.4)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Pal</span>
            </button>
          )}

          {onResetData && (
            <button
              onClick={() => {
                sound.playPop();
                onResetData();
              }}
              title="Restock the sample fridge pals"
              className="hidden md:flex p-2 rounded-full bg-[#FFF0D6] border-2 border-[#FFD166] text-[#5A3D4D] hover:bg-[#FFD166]/40 transition-all items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User chip + menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => {
                sound.playPop();
                setMenuOpen(!menuOpen);
              }}
              className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-full bg-[#FFF0F5] border-2 border-[#FFD1E3] hover:border-[#FF8FB3] transition-all active:scale-95"
              title={`Signed in as ${user?.email ?? ""}`}
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF8FB3] to-[#FFD166] flex items-center justify-center text-white font-baloo font-bold text-xs shadow-xs">
                {firstName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden sm:inline text-[12px] font-bold text-[#5A3D4D] max-w-[90px] truncate">
                {firstName}
              </span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border-3 border-[#FFD1E3] rounded-2xl shadow-[0_12px_32px_rgba(255,143,179,0.25)] p-3 animate-fade-up z-50">
                <div className="flex items-center gap-3 pb-3 border-b border-[#FFE1EC] mb-2">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF8FB3] to-[#FFD166] flex items-center justify-center text-white font-baloo font-bold">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="font-baloo text-sm font-bold truncate">{user?.name}</div>
                    <div className="text-[10.5px] text-[#5A3D4D]/60 truncate">{user?.email}</div>
                  </div>
                </div>

                {user?.profile && (
                  <div className="grid grid-cols-3 gap-1.5 mb-3">
                    <div className="bg-[#FFF0F5] rounded-lg py-1.5 text-center">
                      <div className="font-baloo text-[13px] font-bold leading-none">
                        {user.profile.dailyCalorieTarget}
                      </div>
                      <div className="text-[8.5px] font-semibold text-[#5A3D4D]/55 uppercase">kcal</div>
                    </div>
                    <div className="bg-[#FFF0F5] rounded-lg py-1.5 text-center">
                      <div className="font-baloo text-[13px] font-bold leading-none">
                        {user.profile.dailyProteinTarget}g
                      </div>
                      <div className="text-[8.5px] font-semibold text-[#5A3D4D]/55 uppercase">protein</div>
                    </div>
                    <div className="bg-[#FFF0F5] rounded-lg py-1.5 text-center">
                      <div className="font-baloo text-[13px] font-bold leading-none">{user.profile.bmi}</div>
                      <div className="text-[8.5px] font-semibold text-[#5A3D4D]/55 uppercase">bmi</div>
                    </div>
                  </div>
                )}

                <Link
                  href="/onboarding"
                  onClick={() => {
                    sound.playPop();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#C2456F] hover:bg-[#FFE1EC] transition-all"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Edit profile & goals</span>
                </Link>

                <button
                  onClick={() => {
                    sound.playPop();
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-[#FF6B6B] hover:bg-[#FFE1EC] transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
