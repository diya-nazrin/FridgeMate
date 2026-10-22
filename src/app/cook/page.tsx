"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  CookingPot,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Check,
  X,
  Plus,
  ShoppingCart,
} from "lucide-react";

interface RecipeItem {
  id: number;
  title: string;
  emoji: string;
  description: string;
  prepTime: string;
  difficulty: string;
  tags: string[];
  requiredIngredients: string[];
  instructions: string[];
  matchedIngredients: string[];
  missingIngredients: string[];
  matchScore: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  dietSafe: boolean;
  allergenConflicts: string[];
  blockReasons: string[];
  fitsCalories: boolean;
  highProtein: boolean;
  lowCarb: boolean;
}

export default function CookPage() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [filterTag, setFilterTag] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [cookedSuccess, setCookedSuccess] = useState<string | null>(null);

  const fetchRecipes = async () => {
    try {
      const res = await fetch("/api/recipes");
      const data = await res.json();
      if (data.recipes) {
        setRecipes(data.recipes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleCookMeal = async (recipe: RecipeItem) => {
    sound.playSuccess();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ["#FF8FB3", "#FFD166", "#8FD9C4"],
    });

    setLoading(true);
    try {
      const res = await fetch("/api/recipes/cook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id }),
      });
      const data = await res.json();

      setCookedSuccess(data.message || `Cooked ${recipe.title}!`);
      setTimeout(() => {
        setSelectedRecipe(null);
        setCookedSuccess(null);
        fetchRecipes();
      }, 2400);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMissingToGrocery = async (ingredientName: string) => {
    sound.playPop();
    try {
      await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: ingredientName, category: "produce", quantity: 1, unit: "pcs" }),
      });
      sound.playSuccess();
      alert(`Added "${ingredientName}" to your grocery list! 🛒`);
    } catch (err) {
      console.error(err);
    }
  };

  const tags = ["all", "Breakfast", "Dinner", "Eat Me Soon ⚠️", "High Protein", "Snack", "Sweet"];

  const filteredRecipes = recipes.filter((r) => {
    if (filterTag === "all") return true;
    return r.tags.includes(filterTag);
  });

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-28">
        <div className="mb-6">
          <h1 className="font-baloo text-3xl sm:text-[40px] font-bold text-[#5A3D4D]">
            what to cook? 🍳
          </h1>
          <p className="text-sm text-[#5A3D4D]/80 font-medium">
            zero-waste recipes crafted dynamically around what is chilling inside your fridge!
          </p>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => {
                sound.playPop();
                setFilterTag(t);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filterTag === t
                  ? "bg-[#FF8FB3] text-white shadow-xs scale-105"
                  : "bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3]"
              }`}
            >
              {t === "all" ? "All Recipes 🌟" : t}
            </button>
          ))}
        </div>

        {/* Recipe Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {filteredRecipes.map((r) => (
            <div
              key={r.id}
              onClick={() => {
                sound.playPop();
                setSelectedRecipe(r);
              }}
              className={`rounded-[24px] p-5 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all flex flex-col justify-between border-3 border-dashed ${
                !r.dietSafe || r.allergenConflicts.length > 0
                  ? "bg-[#FFF0F5] border-[#FFB3CA] opacity-75"
                  : "bg-[#FFFAF0] border-[#FFD166]"
              }`}
            >
              {/* Personalised fit badges */}
              {(!r.dietSafe || r.allergenConflicts.length > 0) && (
                <div className="mb-2 text-[10.5px] font-bold text-[#FF6B6B] bg-[#FFE1EC] border border-[#FFB3CA] rounded-full px-2.5 py-1 inline-flex items-center gap-1 self-start">
                  <span>⚠️</span>
                  <span>{r.blockReasons.join(" · ")}</span>
                </div>
              )}
              {r.dietSafe && r.allergenConflicts.length === 0 && (r.highProtein || r.lowCarb) && (
                <div className="mb-2 text-[10.5px] font-bold text-[#1F5F4C] bg-[#E4F7F1] border border-[#8FD9C4] rounded-full px-2.5 py-1 inline-flex items-center gap-1 self-start">
                  <span>✨</span>
                  <span>matches your {r.highProtein ? "high protein" : "low carb"} plan</span>
                </div>
              )}
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#FFF0D6] flex items-center justify-center text-3xl shadow-inner">
                      {r.emoji}
                    </div>
                    <div>
                      <h3 className="font-baloo text-lg font-bold text-[#5A3D4D] leading-tight">
                        {r.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-[#5A3D4D]/60 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#FF8FB3]" />
                          {r.prepTime}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-[#C2456F]">{r.calories} kcal</span>
                        <span>•</span>
                        <span className="font-semibold text-[#1F5F4C]">{r.proteinG}g protein</span>
                      </div>
                    </div>
                  </div>

                  {/* Match Score Badge */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-baloo text-xs font-bold px-2.5 py-1 rounded-full ${
                        r.matchScore === 100
                          ? "bg-[#51CF66] text-white"
                          : r.matchScore >= 60
                          ? "bg-[#FFD166] text-[#5A3D4D]"
                          : "bg-[#FFE1EC] text-[#C2456F]"
                      }`}
                    >
                      {r.matchScore}% fridge match
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#5A3D4D]/80 leading-relaxed mb-4 line-clamp-2">
                  {r.description}
                </p>
              </div>

              {/* Ingredient Matching Chips */}
              <div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {r.matchedIngredients.map((m) => (
                    <span
                      key={m}
                      className="text-[10.5px] font-bold bg-[#E4F7F1] text-[#1F5F4C] border border-[#8FD9C4] px-2 py-0.5 rounded-full flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-[#51CF66]" />
                      <span>{m}</span>
                    </span>
                  ))}
                  {r.missingIngredients.map((m) => (
                    <span
                      key={m}
                      className="text-[10.5px] font-bold bg-[#FFF0F5] text-[#FF6B6B] border border-[#FFD1E3] px-2 py-0.5 rounded-full"
                    >
                      need: {m}
                    </span>
                  ))}
                </div>

                <button className="w-full bg-[#FF8FB3] hover:bg-[#FF7BA3] text-white font-baloo text-xs font-bold py-2 rounded-full transition-all">
                  Cook Recipe 🍳
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <BottomTabs />

      {/* Recipe Cooking Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-4 border-[#FFD166] rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                sound.playPop();
                setSelectedRecipe(null);
              }}
              className="absolute top-4 right-4 p-2 rounded-full bg-[#FFF0D6] text-[#B87F17] hover:bg-[#FFD166]/40 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {cookedSuccess ? (
              <div className="py-8 text-center animate-bounce">
                <span className="text-5xl mb-3 block">🍽️✨</span>
                <h3 className="font-baloo text-2xl font-bold text-[#5A3D4D] mb-2">
                  Meal Cooked Successfully!
                </h3>
                <p className="text-sm text-[#51CF66] font-bold">{cookedSuccess}</p>
                <p className="text-xs text-[#5A3D4D]/60 mt-2">
                  Used ingredients deducted from fridge stock & waste-prevention points awarded!
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF0D6] flex items-center justify-center text-3xl shadow-inner">
                    {selectedRecipe.emoji}
                  </div>
                  <div>
                    <h2 className="font-baloo text-2xl font-bold text-[#5A3D4D] leading-tight">
                      {selectedRecipe.title}
                    </h2>
                    <p className="text-xs text-[#5A3D4D]/60">
                      {selectedRecipe.prepTime} • {selectedRecipe.difficulty}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[#5A3D4D]/80 leading-relaxed mb-4 bg-[#FFF9EE] p-3 rounded-xl border border-[#FFD166]">
                  {selectedRecipe.description}
                </p>

                {/* Ingredients Checklist */}
                <div className="mb-4">
                  <h4 className="font-baloo text-sm font-bold text-[#5A3D4D] mb-2 flex items-center justify-between">
                    <span>Ingredients from Fridge:</span>
                    <span className="text-xs font-semibold text-[#51CF66]">
                      {selectedRecipe.matchedIngredients.length}/{selectedRecipe.requiredIngredients.length} In Stock
                    </span>
                  </h4>

                  <div className="space-y-1.5">
                    {selectedRecipe.requiredIngredients.map((ing) => {
                      const isStocked = selectedRecipe.matchedIngredients.includes(ing);
                      return (
                        <div
                          key={ing}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold ${
                            isStocked
                              ? "bg-[#E4F7F1] text-[#1F5F4C] border border-[#8FD9C4]"
                              : "bg-[#FFF0F5] text-[#FF6B6B] border border-[#FFD1E3]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {isStocked ? (
                              <Check className="w-3.5 h-3.5 text-[#51CF66]" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#FF6B6B]" />
                            )}
                            <span>{ing}</span>
                          </span>

                          {!isStocked && (
                            <button
                              type="button"
                              onClick={() => handleAddMissingToGrocery(ing)}
                              className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-[#FFD1E3] text-[#C2456F] hover:bg-[#FFE1EC] font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add to Grocery</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Step by Step Instructions */}
                <div className="mb-6">
                  <h4 className="font-baloo text-sm font-bold text-[#5A3D4D] mb-2">
                    Cooking Steps:
                  </h4>
                  <ol className="space-y-2 text-xs text-[#5A3D4D]/80 list-decimal list-inside bg-[#FFF6F9] p-3 rounded-2xl border border-[#FFD1E3]">
                    {selectedRecipe.instructions.map((step, idx) => (
                      <li key={idx} className="leading-relaxed">
                        <span className="font-medium">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Primary Button */}
                <button
                  onClick={() => handleCookMeal(selectedRecipe)}
                  disabled={loading}
                  className="w-full bg-[#FF8FB3] hover:bg-[#FF7BA3] text-white font-baloo text-base font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,143,179,0.4)] hover:scale-[1.01] active:scale-95 transition-all"
                >
                  <CookingPot className="w-5 h-5" />
                  <span>I Cooked This Meal! 🍽️ (Deduct from Fridge)</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
