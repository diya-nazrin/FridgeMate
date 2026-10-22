"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { sound } from "@/lib/sound";
import {
  TrendingUp,
  Sparkles,
  DollarSign,
  Flame,
  Award,
  Clock,
  Layers,
  Heart,
  Utensils,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface DashboardData {
  totalInStock: number;
  soonCount: number;
  freshCount: number;
  expiredCount: number;
  consumedCount: number;
  discardedCount: number;
  wasteSaveRate: number;
  moneySaved: string;
  totalPoints: number;
  categoryMap: Record<string, number>;
  shelfMap: Record<string, number>;
  activities: Array<{
    id: number;
    actionType: string;
    palName: string;
    palEmoji: string;
    pointsEarned: number;
    createdAt: string;
  }>;
  streakDays: number;
  nutrition?: {
    caloriesToday: number;
    proteinToday: number;
    calorieTarget: number;
    proteinTarget: number;
    remainingCalories: number;
    remainingProtein: number;
    fridgeCalorieBank: number;
    bmi: number | null;
    bmiLabel: string | null;
    bmr: number | null;
    tdee: number | null;
    goal: string;
    dietType: string;
    allergies: string[];
    dietPlans: string[];
    waterTargetMl: number;
    heightCm: number | null;
    weightKg: number | null;
    age: number | null;
  };
  userName?: string;
}

function NutriTile({
  icon,
  label,
  value,
  sub,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-[#FFF6F9] border-2 border-[#FFE1EC] rounded-2xl p-3">
      <div className="text-lg leading-none">{icon}</div>
      <div className="font-baloo text-xl font-bold leading-tight mt-1.5">{value}</div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#5A3D4D]/55">{label}</div>
      <div className="text-[10px] text-[#5A3D4D]/60 font-medium mt-0.5">{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (!data && loading) {
    return (
      <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
        <Navbar />
        <div className="max-w-4xl mx-auto p-12 text-center">
          <Sparkles className="w-8 h-8 text-[#FF8FB3] mx-auto animate-spin mb-3" />
          <h2 className="font-baloo text-xl">Chilling your fridge stats...</h2>
        </div>
      </div>
    );
  }

  const d = data || {
    totalInStock: 24,
    soonCount: 4,
    freshCount: 20,
    expiredCount: 0,
    consumedCount: 18,
    discardedCount: 1,
    wasteSaveRate: 96,
    moneySaved: "142.50",
    totalPoints: 340,
    categoryMap: { produce: 8, dairy: 5, drinks: 4, protein: 3, leftovers: 2, frozen: 2 },
    shelfMap: {},
    activities: [],
    streakDays: 14,
  };

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-28">
        <div className="mb-6">
          <h1 className="font-baloo text-3xl sm:text-[40px] font-bold text-[#5A3D4D]">
            fridge insights & stats ✨
          </h1>
          <p className="text-sm text-[#5A3D4D]/80 font-medium">
            track your food waste savings, active fridge pals, and kitchen sustainability score!
          </p>
        </div>

        {/* Top 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Stat 1: Total Pals */}
          <div className="bg-white border-3 border-[#FFD1E3] rounded-[22px] p-5 shadow-xs">
            <span className="text-2xl">🧊</span>
            <div className="font-baloo text-3xl font-bold text-[#5A3D4D] mt-2">
              {d.totalInStock}
            </div>
            <div className="text-xs font-semibold text-[#5A3D4D]/65 mt-0.5">
              Active Fridge Pals
            </div>
          </div>

          {/* Stat 2: Waste Saved Rate */}
          <div className="bg-white border-3 border-[#8FD9C4] rounded-[22px] p-5 shadow-xs">
            <span className="text-2xl">🌱</span>
            <div className="font-baloo text-3xl font-bold text-[#1F5F4C] mt-2">
              {d.wasteSaveRate}%
            </div>
            <div className="text-xs font-semibold text-[#1F5F4C]/80 mt-0.5">
              Food Waste Saved
            </div>
          </div>

          {/* Stat 3: Money Saved */}
          <div className="bg-white border-3 border-[#FFD166] rounded-[22px] p-5 shadow-xs">
            <span className="text-2xl">💰</span>
            <div className="font-baloo text-3xl font-bold text-[#B87F17] mt-2">
              ${d.moneySaved}
            </div>
            <div className="text-xs font-semibold text-[#B87F17]/80 mt-0.5">
              Estimated Money Saved
            </div>
          </div>

          {/* Stat 4: Zero Waste Streak */}
          <div className="bg-white border-3 border-[#FF8FB3] rounded-[22px] p-5 shadow-xs">
            <span className="text-2xl">🔥</span>
            <div className="font-baloo text-3xl font-bold text-[#C2456F] mt-2">
              {d.streakDays} Days
            </div>
            <div className="text-xs font-semibold text-[#C2456F]/80 mt-0.5">
              Zero Waste Streak
            </div>
          </div>
        </div>

        {/* ---- Personalised nutrition panel (from onboarding answers) ---- */}
        <div className="mb-8 bg-white border-3 border-[#FFD1E3] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="font-baloo text-xl font-bold flex items-center gap-2">
              <span>your nutrition plan</span>
              <span className="text-[10px] font-bold bg-[#FFE1EC] text-[#C2456F] px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {d.nutrition?.dietType ?? "veg"}
                {d.nutrition?.goal ? ` · ${d.nutrition.goal}` : ""}
              </span>
            </h3>
            <p className="text-[11px] text-[#5A3D4D]/60 font-medium">
              derived from your age, height, weight, activity and goal
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <NutriTile icon="🔥" label="calories today" value={`${d.nutrition?.caloriesToday ?? 0}`} sub={`of ${d.nutrition?.calorieTarget ?? 1800} kcal`} />
            <NutriTile icon="💪" label="protein today" value={`${d.nutrition?.proteinToday ?? 0}g`} sub={`target ${d.nutrition?.proteinTarget ?? 90}g`} />
            <NutriTile icon="📏" label="BMI" value={`${d.nutrition?.bmi ?? "—"}`} sub={d.nutrition?.bmiLabel ?? ""} />
            <NutriTile icon="⚡" label="TDEE" value={`${d.nutrition?.tdee ?? "—"}`} sub={`BMR ${d.nutrition?.bmr ?? "—"} kcal`} />
          </div>

          {/* Calorie budget bar */}
          <div className="bg-[#FFF6F9] rounded-2xl p-4 border-2 border-[#FFE1EC]">
            <div className="flex justify-between text-[11px] font-bold mb-1.5">
              <span className="text-[#C2456F]">daily calorie budget</span>
              <span>
                {Math.max(0, d.nutrition?.remainingCalories ?? 0)} kcal remaining
              </span>
            </div>
            <div className="w-full h-3.5 bg-[#FFE1EC] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.round(((d.nutrition?.caloriesToday ?? 0) / Math.max(1, d.nutrition?.calorieTarget ?? 1800)) * 100))}%`,
                  background:
                    (d.nutrition?.remainingCalories ?? 0) < 0
                      ? "#FF6B6B"
                      : "linear-gradient(90deg,#FF8FB3,#FFD166)",
                }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(d.nutrition?.allergies ?? []).length > 0 ? (
                (d.nutrition?.allergies ?? []).map((a: string) => (
                  <span key={a} className="text-[10px] font-bold bg-[#FFE1EC] text-[#C2456F] border border-[#FFB3CA] px-2 py-0.5 rounded-full capitalize">
                    🚫 no {a}
                  </span>
                ))
              ) : (
                <span className="text-[10px] font-bold bg-[#E4F7F1] text-[#1F5F4C] border border-[#8FD9C4] px-2 py-0.5 rounded-full">
                  ✓ no allergies on file
                </span>
              )}
              {(d.nutrition?.dietPlans ?? []).map((p: string) => (
                <span key={p} className="text-[10px] font-bold bg-[#FFF0D6] text-[#B87F17] border border-[#FFD166] px-2 py-0.5 rounded-full capitalize">
                  {p.replace("_", " ")}
                </span>
              ))}
              <span className="text-[10px] font-bold bg-[#E4EFFF] text-[#3B6EA8] border border-[#A3C9FF] px-2 py-0.5 rounded-full">
                💧 {(d.nutrition?.waterTargetMl ?? 2000) / 1000}L water / day
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Freshness Breakdown */}
          <div className="bg-white border-3 border-[#FFD1E3] rounded-3xl p-6 shadow-xs">
            <h3 className="font-baloo text-xl font-bold text-[#5A3D4D] mb-4 flex items-center gap-2">
              <span>Freshness Status</span>
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#51CF66] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#51CF66]" />
                    Fresh & Chilled (&gt;3 days)
                  </span>
                  <span>{d.freshCount} pals</span>
                </div>
                <div className="w-full h-3 bg-[#E4F7F1] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#51CF66] rounded-full transition-all duration-500"
                    style={{
                      width: `${d.totalInStock > 0 ? (d.freshCount / d.totalInStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#FFA94D] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFA94D]" />
                    Eat Me Soon (≤3 days)
                  </span>
                  <span>{d.soonCount} pals</span>
                </div>
                <div className="w-full h-3 bg-[#FFF0D6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFA94D] rounded-full transition-all duration-500"
                    style={{
                      width: `${d.totalInStock > 0 ? (d.soonCount / d.totalInStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-[#FF6B6B] flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B6B]" />
                    Expired / Needs Attention
                  </span>
                  <span>{d.expiredCount} pals</span>
                </div>
                <div className="w-full h-3 bg-[#FFE1EC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FF6B6B] rounded-full transition-all duration-500"
                    style={{
                      width: `${d.totalInStock > 0 ? (d.expiredCount / d.totalInStock) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Sustainability Badge */}
            <div className="mt-6 bg-[#FFF0F5] rounded-2xl p-4 border border-[#FFD1E3] flex items-center gap-3">
              <span className="text-3xl">🏅</span>
              <div>
                <div className="font-baloo text-sm font-bold text-[#5A3D4D]">
                  Eco Master Chef Rank
                </div>
                <p className="text-[11px] text-[#5A3D4D]/70">
                  You’ve prevented over {d.consumedCount} meals from ending up in landfills!
                </p>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white border-3 border-[#FFD1E3] rounded-3xl p-6 shadow-xs">
            <h3 className="font-baloo text-xl font-bold text-[#5A3D4D] mb-4">
              Category Distribution
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(d.categoryMap || {}).map(([cat, count]) => (
                <div
                  key={cat}
                  className="bg-[#FFF6F9] border-2 border-[#FFE1EC] rounded-2xl p-3 flex items-center justify-between"
                >
                  <span className="font-baloo text-sm font-bold text-[#5A3D4D] capitalize">
                    {cat}
                  </span>
                  <span className="text-xs font-bold bg-white text-[#FF8FB3] border border-[#FFD1E3] px-2.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white border-3 border-[#FFD1E3] rounded-3xl p-6 shadow-xs">
          <h3 className="font-baloo text-xl font-bold text-[#5A3D4D] mb-4 flex items-center gap-2">
            <span>Recent Fridge Activity</span>
            <span className="text-xs font-semibold bg-[#FFE1EC] text-[#C2456F] px-2.5 py-0.5 rounded-full">
              live log
            </span>
          </h3>

          <div className="space-y-2.5">
            {d.activities.length === 0 ? (
              <div className="text-xs text-[#5A3D4D]/50 italic py-4">
                No recent activity logged yet. Eat a portion or cook a meal to earn points!
              </div>
            ) : (
              d.activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-[#FFF6F9] border border-[#FFE1EC]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{act.palEmoji || "✨"}</span>
                    <div>
                      <div className="font-baloo text-sm font-bold text-[#5A3D4D]">
                        {act.actionType === "EATEN" && "Ate a portion of "}
                        {act.actionType === "RESTOCKED" && "Restocked "}
                        {act.actionType === "COOKED_MEAL" && "Cooked delicious "}
                        {act.palName}
                      </div>
                      <div className="text-[10px] text-[#5A3D4D]/50">
                        {new Date(act.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[#51CF66] bg-[#E4F7F1] px-2.5 py-1 rounded-full border border-[#8FD9C4]">
                    +{act.pointsEarned} pts
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <BottomTabs />
    </div>
  );
}
