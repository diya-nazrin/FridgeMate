"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

/**
 * Client-side gate for every app page.
 * - No session  -> /welcome
 * - Session but onboarding unfinished -> /onboarding
 *
 * The API layer enforces the same rules, so this is a UX redirect, not the only
 * line of defence. Before bouncing anyone back to /welcome we re-check the
 * session once — that absorbs any race where the context hasn't caught up with
 * a cookie that was just set by a successful login.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [rechecking, setRechecking] = useState(false);
  const rechecked = useRef(false);

  // 1. Resolve state / re-check once when the context thinks we're signed out.
  useEffect(() => {
    if (loading) return;

    if (user) {
      if (!user.profile?.onboardingComplete && pathname !== "/onboarding") {
        router.replace("/onboarding");
      }
      return;
    }

    if (rechecked.current) return;
    rechecked.current = true;
    setRechecking(true);
    void refresh().finally(() => setRechecking(false));
  }, [user, loading, refresh, router, pathname]);

  // 2. Only redirect to /welcome once the re-check has genuinely failed.
  useEffect(() => {
    if (loading || rechecking || user) return;
    if (!rechecked.current) return;

    const t = window.setTimeout(() => router.replace("/welcome"), 500);
    return () => window.clearTimeout(t);
  }, [loading, rechecking, user, router]);

  if (loading || rechecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFF6F9] gap-4">
        <div className="text-5xl animate-bob">🧊</div>
        <p className="font-baloo text-lg text-[#5A3D4D]">warming up your fridge...</p>
        <div className="w-44 h-2 rounded-full bg-[#FFE1EC] overflow-hidden">
          <div className="h-full w-1/2 bg-[#FF8FB3] rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (!user.profile?.onboardingComplete && pathname !== "/onboarding") return null;

  return <>{children}</>;
}
