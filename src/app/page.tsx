"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { AnimatedFridge, FridgePal } from "@/components/AnimatedFridge";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";
import { AddPalModal } from "@/components/AddPalModal";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/components/AuthProvider";
import { sound } from "@/lib/sound";
import { personalisedTip, allergenConflicts } from "@/lib/nutrition";
import { Sparkles, Flame, AlertTriangle, ShieldAlert, Grid, Box } from "lucide-react";

export default function HomePage() {
  return (
    <RequireAuth>
      <HomeContent />
    </RequireAuth>
  );
}

function HomeContent() {
  const { user, today, refresh } = useAuth();
  const [items, setItems] = useState<FridgePal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FridgePal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetShelf, setTargetShelf] = useState("mid_shelf");
  const [viewMode, setViewMode] = useState<"3d" | "grid">("3d");
  const [fridgeColor, setFridgeColor] = useState("pink");
  const [recipes, setRecipes] = useState<any[]>([]);

  const fetchFridgeData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/fridge");
      const data = await res.json();
      if (data.items) setItems(data.items);

      const rRes = await fetch("/api/recipes");
      const rData = await rRes.json();
      if (rData.recipes) setRecipes(rData.recipes.slice(0, 3));
    } catch (err) {
      console.error("Failed to load fridge data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFridgeData();
  }, []);

  const handleEatItem = async (id: number) => {
    await fetch(`/api/fridge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "eat" }),
    });
    await fetchFridgeData();
    await refresh();
  };

  
const handleDeleteItem = async (id: number) => {
  try {
    const res = await fetch(`/api/fridge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "discard" }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Failed to discard item:", result.error);
      alert(result.error || "Could not discard item.");
      return;
    }

    await fetchFridgeData();
    await refresh();
  } catch (error) {
    console.error("Error discarding item:", error);
    alert("Something went wrong while discarding the item.");
  }
};


  const handleUpdateItem = async (id: number, updates: Partial<FridgePal>) => {
    await fetch(`/api/fridge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    await fetchFridgeData();
  };

  const handleAddPal = async (palData: any) => {
    await fetch("/api/fridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(palData),
    });
    await fetchFridgeData();
    await refresh();
  };

  const handleAddToGrocery = async (name: string, emoji: string, category: string) => {
    await fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, category, quantity: 1, unit: "pcs" }),
    });
  };

  const handleResetData = async () => {
    if (confirm("Restock the sample fridge pals and reset your fridge?")) {
      await fetch("/api/fridge/seed", { method: "POST" });
      await fetchFridgeData();
      await refresh();
    }
  };

  const soonItems = items
    .filter((i) => i.freshness === "soon" || i.freshness === "expired")
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const freshItems = items.filter((i) => i.freshness === "fresh").sort((a, b) => a.daysLeft - b.daysLeft);

  // ---- Personalisation derived from the onboarding profile ----
  const profile = user?.profile;
  const userAllergies = profile?.allergies ?? [];
  const calorieTarget = today?.calorieTarget ?? profile?.dailyCalorieTarget ?? 1800;
  const consumed = today?.consumedCalories ?? 0;
  const remaining = today?.remainingCalories ?? calorieTarget;
  const pct = Math.min(100, Math.round((consumed / Math.max(1, calorieTarget)) * 100));

  const riskyItems = items.filter((i) =>
    allergenConflicts((i as FridgePal & { allergens?: string[] }).allergens ?? [], userAllergies).length > 0
  );

  const firstName = user?.name?.split(" ")[0] ?? "friend";
  const goalLabel =
    profile?.goal === "deficit" ? "calorie deficit" : profile?.goal === "surplus" ? "calorie surplus" : "maintenance";

  // Sort "eat me soon" by what best fits the user's goal when cutting.
  const sortedSoon =
    profile?.goal === "deficit"
      ? [...soonItems].sort((a, b) => a.daysLeft - b.daysLeft || (a.calories || 0) - (b.calories || 0))
      : soonItems;

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar
        onOpenAddModal={() => {
          setTargetShelf("mid_shelf");
          setIsAddModalOpen(true);
        }}
        onResetData={handleResetData}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
        {/* ---------- Personalised greeting + live calorie ring ---------- */}
        <section className="mb-8 bg-white border-3 border-[#FFD1E3] rounded-[28px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(255,143,179,0.1)] flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-[#FFF0F5] border border-[#FFD1E3] rounded-full px-3 py-1 mb-2.5">
              <Sparkles className="w-3 h-3 text-[#FF8FB3]" />
              <span className="text-[10px] font-bold tracking-[0.4px] text-[#C2456F] uppercase">
                personalised for {profile?.dietType ?? "veg"} · {goalLabel}
              </span>
            </div>

            <h1 className="font-baloo text-3xl sm:text-[38px] font-bold leading-tight">
              hey {firstName}, your fridge pals are chilling 🧸
            </h1>
            <p className="text-[13px] text-[#5A3D4D]/75 mt-1 font-medium">
              {profile
                ? `${profile.age} yrs · ${profile.heightCm} cm · ${profile.weightKg} kg · BMI ${profile.bmi} (${profile.bmiLabel})`
                : "freshest first, always."}
            </p>

            {/* Diet + allergy chips */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {userAllergies.length > 0 ? (
                userAllergies.map((a) => (
                  <span
                    key={a}
                    className="text-[10.5px] font-bold bg-[#FFE1EC] text-[#C2456F] border border-[#FFB3CA] px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>no {a}</span>
                  </span>
                ))
              ) : (
                <span className="text-[10.5px] font-bold bg-[#E4F7F1] text-[#1F5F4C] border border-[#8FD9C4] px-2.5 py-1 rounded-full">
                  ✓ no allergies on file
                </span>
              )}
              {profile?.dietPlans.map((p) => (
                <span
                  key={p}
                  className="text-[10.5px] font-bold bg-[#FFF0D6] text-[#B87F17] border border-[#FFD166] px-2.5 py-1 rounded-full capitalize"
                >
                  {p.replace("_", " ")}
                </span>
              ))}
            </div>

            {/* Smart tip */}
            {profile && (
              <div className="mt-3.5 bg-[#FFF9EE] border-2 border-dashed border-[#FFD166] rounded-2xl px-3.5 py-2.5 text-[11.5px] font-semibold text-[#5A3D4D]/85 flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">💡</span>
                <span>{personalisedTip(profile.goal, profile.dietPlans, remaining)}</span>
              </div>
            )}
          </div>

          {/* Calorie ring */}
          <div className="flex items-center gap-5 self-center lg:self-auto">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="#FFE1EC" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={remaining < 0 ? "#FF6B6B" : "#FF8FB3"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * pct) / 100}
                  style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.22,1,0.36,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Flame className="w-3.5 h-3.5 text-[#FF8FB3]" />
                <span className="font-baloo text-xl font-bold leading-none mt-0.5">{pct}%</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Stat label="eaten today" value={`${consumed}`} unit="kcal" tone="pink" />
              <Stat label="remaining" value={`${Math.max(0, remaining)}`} unit="kcal" tone={remaining < 0 ? "red" : "green"} />
              <Stat label="daily target" value={`${calorieTarget}`} unit="kcal" tone="yellow" />
            </div>
          </div>
        </section>

        {/* ---------- Allergy alert ---------- */}
        {riskyItems.length > 0 && (
          <section className="mb-8 bg-[#FFE1EC]/70 border-3 border-[#FF6B6B]/40 rounded-[24px] p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF6B6B] shrink-0 mt-0.5" />
            <div>
              <h3 className="font-baloo text-base font-bold text-[#5A3D4D]">
                {riskyItems.length} item{riskyItems.length > 1 ? "s" : ""} in your fridge match your allergies
              </h3>
              <p className="text-[11.5px] text-[#5A3D4D]/75 font-medium mt-0.5">
                {riskyItems
                  .slice(0, 4)
                  .map((i) => i.name)
                  .join(", ")}
                {riskyItems.length > 4 ? ` +${riskyItems.length - 4} more` : ""} — we&apos;ve flagged these so they never sneak into a recipe.
              </p>
            </div>
          </section>
        )}

        {/* ---------- View toggle ---------- */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <h2 className="font-baloo text-2xl sm:text-[26px] font-bold">my fridge 🧊</h2>
          <div className="flex items-center gap-2 bg-white p-1 rounded-full border-2 border-[#FFD1E3] shadow-xs">
            <button
              onClick={() => {
                sound.playPop();
                setViewMode("3d");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-baloo flex items-center gap-1.5 transition-all ${
                viewMode === "3d" ? "bg-[#FF8FB3] text-white" : "text-[#5A3D4D]/70 hover:text-[#5A3D4D]"
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D fridge</span>
            </button>
            <button
              onClick={() => {
                sound.playPop();
                setViewMode("grid");
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold font-baloo flex items-center gap-1.5 transition-all ${
                viewMode === "grid" ? "bg-[#FF8FB3] text-white" : "text-[#5A3D4D]/70 hover:text-[#5A3D4D]"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>cards</span>
            </button>
          </div>
        </div>

        {viewMode === "3d" && (
          <div className="mb-12">
            <AnimatedFridge
              items={items}
              onSelectItem={(item) => setSelectedItem(item)}
              onAddItemToShelf={(shelf) => {
                setTargetShelf(shelf);
                setIsAddModalOpen(true);
              }}
              fridgeColor={fridgeColor}
              onChangeColor={setFridgeColor}
            />
          </div>
        )}

        {/* ---------- Eat me soon ---------- */}
        <div className="space-y-8 mb-12">
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-baloo text-2xl sm:text-[26px] font-bold">eat me soon! ⚠️</h2>
              <span className="text-[13px] font-semibold text-[#5A3D4D]/70 bg-[#FFF0D6] border border-[#FFD166] px-3 py-0.5 rounded-full">
                {sortedSoon.length} pals
              </span>
            </div>

            <div className="relative bg-[#FFF0F5] border-3 border-[#FFC2DA] rounded-[28px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(255,143,179,0.1)]">
              <div className="absolute top-4 right-4 w-1.5 h-10 bg-[#FF8FB3] rounded-full" />
              <div className="font-baloo text-xs font-semibold text-[#5A3D4D]/70 lowercase mb-4">
                these ones need love first
                {profile?.goal === "deficit" && " · lowest calorie first for your deficit"}
              </div>

              {sortedSoon.length === 0 ? (
                <div className="py-6 text-left text-sm text-[#5A3D4D]/70 flex items-center gap-3">
                  <span className="text-3xl">🎀</span>
                  <span>nothing urgent right now! everything is chilling fresh.</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {sortedSoon.map((item) => (
                    <ItemPill key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="font-baloo text-2xl sm:text-[26px] font-bold">fresh! 🎀</h2>
              <span className="text-[13px] font-semibold text-[#5A3D4D]/70 bg-[#E4F7F1] border border-[#8FD9C4] px-3 py-0.5 rounded-full">
                {freshItems.length} pals
              </span>
            </div>

            <div className="relative bg-[#FFF0F5] border-3 border-[#FFC2DA] rounded-[28px] p-5 sm:p-6 shadow-[0_4px_16px_rgba(255,143,179,0.1)]">
              <div className="absolute top-4 right-4 w-1.5 h-10 bg-[#FF8FB3] rounded-full" />
              <div className="font-baloo text-xs font-semibold text-[#5A3D4D]/70 lowercase mb-4">all good, no rush</div>

              {freshItems.length === 0 ? (
                <div className="py-6 text-left text-sm text-[#5A3D4D]/70 flex items-center gap-3">
                  <span className="text-3xl">🧊</span>
                  <span>no fresh pals yet — go scan a bill or add some groceries!</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {freshItems.map((item) => (
                    <ItemPill key={item.id} item={item} onClick={() => setSelectedItem(item)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Recipes ---------- */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-baloo text-2xl sm:text-[26px] font-bold">what to cook with these pals? 🍳</h2>
            <Link
              href="/cook"
              onClick={() => sound.playPop()}
              className="text-xs font-bold text-[#FF8FB3] hover:underline"
            >
              view all recipes →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recipes.map((r) => (
              <Link
                key={r.id}
                href="/cook"
                onClick={() => sound.playPop()}
                className={`rounded-[22px] p-4 flex items-center gap-3.5 hover:scale-[1.02] transition-all group shadow-xs border-3 ${
                  r.dietSafe === false || r.allergenConflicts?.length
                    ? "bg-[#FFF0F5] border-dashed border-[#FFB3CA] opacity-70"
                    : "bg-[#FFFAF0] border-dashed border-[#FFD166]"
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center text-2xl shrink-0 group-hover:rotate-6 transition-transform">
                  {r.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-baloo text-sm font-bold truncate">{r.title}</h4>
                  <p className="text-[11px] text-[#5A3D4D]/60 mt-0.5 truncate">
                    {r.calories} kcal · {r.proteinG}g protein · {r.prepTime}
                  </p>
                </div>
                <div className="font-baloo text-xs font-bold bg-white/90 px-2 py-1 rounded-full shrink-0">
                  {r.matchScore}%
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      <BottomTabs />

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onEatItem={handleEatItem}
          onDeleteItem={handleDeleteItem}
          onUpdateItem={handleUpdateItem}
          onAddToGrocery={handleAddToGrocery}
          onCookWithItem={() => {}}
        />
      )}

      {isAddModalOpen && (
        <AddPalModal
          initialShelf={targetShelf}
          onClose={() => setIsAddModalOpen(false)}
          onAddPal={handleAddPal}
        />
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: "pink" | "green" | "red" | "yellow";
}) {
  const tones: Record<string, string> = {
    pink: "bg-[#FFF0F5] border-[#FFD1E3] text-[#C2456F]",
    green: "bg-[#E4F7F1] border-[#8FD9C4] text-[#1F5F4C]",
    red: "bg-[#FFE1EC] border-[#FFB3CA] text-[#FF6B6B]",
    yellow: "bg-[#FFF9EE] border-[#FFD166] text-[#B87F17]",
  };
  return (
    <div className={`border-2 rounded-xl px-3 py-1.5 min-w-[128px] ${tones[tone]}`}>
      <div className="font-baloo text-base font-bold leading-none">
        {value}
        <span className="text-[10px] font-semibold opacity-70 ml-1">{unit}</span>
      </div>
      <div className="text-[9.5px] font-bold uppercase tracking-wide opacity-70">{label}</div>
    </div>
  );
}

function ItemPill({ item, onClick }: { item: FridgePal; onClick: () => void }) {
  const dotClass =
    item.freshness === "expired" ? "bg-[#FF6B6B]" : item.freshness === "soon" ? "bg-[#FFA94D]" : "bg-[#51CF66]";

  return (
    <button
      onClick={() => {
        sound.playPop();
        onClick();
      }}
      className="relative bg-white border-2 border-[#FFE1EC] hover:border-[#FFD1E3] rounded-[14px] px-2.5 py-1.5 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 text-left cursor-pointer group"
    >
      <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${dotClass} border border-white`} />
      <span className="text-lg">{item.emoji}</span>
      <div className="flex flex-col">
        <span className="text-[11px] font-bold leading-tight">{item.name}</span>
        <span className="text-[9px] text-[#5A3D4D]/60 font-medium">
          {(item as FridgePal & { calories?: number }).calories
            ? `${(item as FridgePal & { calories?: number }).calories} kcal · `
            : ""}
          {item.daysLeft <= 0 ? "expired" : item.daysLeft === 1 ? "1 day left" : `${item.daysLeft} days`}
        </span>
      </div>
    </button>
  );
}
