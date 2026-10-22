"use client";

import React, { useState } from "react";
import { sound } from "@/lib/sound";
import { X, Plus, Sparkles, Calendar, Layers } from "lucide-react";
import { getDatePlusDays } from "@/lib/date-utils";

interface AddPalModalProps {
  initialShelf?: string;
  onClose: () => void;
  onAddPal: (data: {
    name: string;
    emoji: string;
    category: string;
    shelfLocation: string;
    quantity: number;
    unit: string;
    expiryDate: string;
    calories: number;
    proteinG: number;
    notes?: string;
  }) => Promise<void>;
}

const PRESETS = [
  { name: "Fresh Whole Milk", emoji: "🥛", category: "dairy", shelfLocation: "top_shelf", expiryDays: 5, unit: "bottle" },
  { name: "Sweet Strawberries", emoji: "🍓", category: "produce", shelfLocation: "crisper_fruit", expiryDays: 3, unit: "punnet" },
  { name: "Farm Fresh Eggs", emoji: "🥚", category: "protein", shelfLocation: "door_shelf_top", expiryDays: 16, unit: "eggs" },
  { name: "Aged Cheddar Cheese", emoji: "🧀", category: "dairy", shelfLocation: "top_shelf", expiryDays: 14, unit: "block" },
  { name: "Crisp Broccoli", emoji: "🥦", category: "produce", shelfLocation: "crisper_veggie", expiryDays: 4, unit: "head" },
  { name: "Leftover Pad Thai", emoji: "🥡", category: "leftovers", shelfLocation: "mid_shelf", expiryDays: 2, unit: "box" },
  { name: "Matcha Ice Cream", emoji: "🍨", category: "frozen", shelfLocation: "freezer", expiryDays: 60, unit: "tub" },
  { name: "Sparkling Peach Soda", emoji: "🍑", category: "drinks", shelfLocation: "bottom_shelf", expiryDays: 45, unit: "can" },
];

const SHELVES = [
  { value: "top_shelf", label: "Top Shelf (Dairy & Breakfast) 🥛" },
  { value: "mid_shelf", label: "Middle Shelf (Leftovers & Protein) 🥡" },
  { value: "bottom_shelf", label: "Bottom Shelf (Drinks & Big Items) 🍉" },
  { value: "crisper_veggie", label: "Veggie Crisper Drawer 🥦" },
  { value: "crisper_fruit", label: "Fruit Crisper Drawer 🍓" },
  { value: "door_shelf_top", label: "Door Top Shelf (Eggs & Condiments) 🥚" },
  { value: "door_shelf_bottom", label: "Door Bottom Shelf (Beverages) 🥤" },
  { value: "freezer", label: "Freezer Zone (-18°C) 🍨" },
];

export function AddPalModal({ initialShelf = "mid_shelf", onClose, onAddPal }: AddPalModalProps) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🥑");
  const [category, setCategory] = useState("produce");
  const [shelfLocation, setShelfLocation] = useState(initialShelf);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pcs");
  const [expiryDate, setExpiryDate] = useState(getDatePlusDays(7));
  const [calories, setCalories] = useState(0);
  const [proteinG, setProteinG] = useState(0);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const applyPreset = (p: typeof PRESETS[0]) => {
    sound.playPop();
    setName(p.name);
    setEmoji(p.emoji);
    setCategory(p.category);
    setShelfLocation(p.shelfLocation);
    setUnit(p.unit);
    setExpiryDate(getDatePlusDays(p.expiryDays));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playSuccess();
    setLoading(true);
    await onAddPal({
      name,
      emoji: emoji || "🥑",
      category,
      shelfLocation,
      quantity,
      unit,
      expiryDate,
      calories,
      proteinG,
      notes: notes.trim() || undefined,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-4 border-[#FFD1E3] rounded-[28px] max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-full bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">✨</span>
          <h2 className="font-baloo text-2xl font-bold text-[#5A3D4D]">Add a Fridge Pal</h2>
        </div>
        <p className="text-xs text-[#5A3D4D]/70 mb-4">
          Pick a cute preset below or fill out custom details to store it in your animated fridge!
        </p>

        {/* Quick Presets Carousel */}
        <div className="mb-5">
          <span className="text-[11px] font-bold text-[#C2456F] uppercase tracking-wider block mb-2">
            Quick 1-Click Presets:
          </span>
          <div className="grid grid-cols-4 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className="p-2 rounded-xl bg-[#FFF6F9] border-2 border-[#FFE1EC] hover:border-[#FF8FB3] hover:scale-105 transition-all text-center flex flex-col items-center"
              >
                <span className="text-2xl mb-1">{p.emoji}</span>
                <span className="text-[9.5px] font-bold text-[#5A3D4D] truncate w-full">
                  {p.name.split(" ")[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name & Emoji */}
          <div className="flex gap-2">
            <div className="w-16">
              <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Emoji</label>
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-full text-center text-2xl p-1.5 rounded-xl border-2 border-[#FFD1E3] bg-[#FFF0F5] focus:outline-none focus:border-[#FF8FB3]"
                maxLength={4}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Pal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Almond Milk"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm font-semibold p-2.5 rounded-xl border-2 border-[#FFD1E3] focus:outline-none focus:border-[#FF8FB3]"
              />
            </div>
          </div>

          {/* Shelf Location */}
          <div>
            <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">
              Fridge Shelf Location
            </label>
            <select
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-[#FFD1E3] bg-white focus:outline-none focus:border-[#FF8FB3]"
            >
              {SHELVES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category & Quantity */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs font-semibold p-2 rounded-xl border-2 border-[#FFD1E3] bg-white focus:outline-none focus:border-[#FF8FB3]"
              >
                <option value="produce">Produce 🥦</option>
                <option value="dairy">Dairy 🥛</option>
                <option value="protein">Protein 🥚</option>
                <option value="drinks">Drinks 🥤</option>
                <option value="leftovers">Leftovers 🥡</option>
                <option value="condiments">Condiments 🥫</option>
                <option value="frozen">Frozen 🍨</option>
                <option value="bakery">Bakery 🍰</option>
                <option value="snacks">Snacks 🍫</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full text-xs font-semibold p-2 rounded-xl border-2 border-[#FFD1E3] focus:outline-none focus:border-[#FF8FB3]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs / pack"
                className="w-full text-xs font-semibold p-2 rounded-xl border-2 border-[#FFD1E3] focus:outline-none focus:border-[#FF8FB3]"
              />
            </div>
          </div>

          {/* Nutrition (per single unit) */}
          <div>
            <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1.5">
              Nutrition per 1 {unit || "unit"} <span className="text-[#5A3D4D]/45">(feeds your daily targets)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-[#FFF0F5] border-2 border-[#FFD1E3] rounded-xl px-2.5 py-1.5">
                <span className="text-sm">🔥</span>
                <input
                  type="number"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-bold focus:outline-none"
                  placeholder="0"
                />
                <span className="text-[10px] font-semibold text-[#5A3D4D]/50">kcal</span>
              </div>
              <div className="flex items-center gap-2 bg-[#E4F7F1] border-2 border-[#8FD9C4] rounded-xl px-2.5 py-1.5">
                <span className="text-sm">💪</span>
                <input
                  type="number"
                  min="0"
                  value={proteinG}
                  onChange={(e) => setProteinG(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-bold focus:outline-none"
                  placeholder="0"
                />
                <span className="text-[10px] font-semibold text-[#1F5F4C]/60">g protein</span>
              </div>
            </div>
            <p className="text-[10px] text-[#5A3D4D]/50 mt-1 font-medium">
              tip: leave at 0 for produce — we still track freshness and waste savings.
            </p>
          </div>

          {/* Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-[#5A3D4D]/70">Best Before / Expiry Date</label>
              <div className="flex gap-1">
                {[
                  { label: "+3d", days: 3 },
                  { label: "+7d", days: 7 },
                  { label: "+14d", days: 14 },
                  { label: "+1mo", days: 30 },
                ].map((d) => (
                  <button
                    key={d.label}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setExpiryDate(getDatePlusDays(d.days));
                    }}
                    className="text-[10px] font-bold bg-[#FFE1EC] text-[#C2456F] px-1.5 py-0.5 rounded-full hover:bg-[#FFD1E3]"
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border-2 border-[#FFD1E3] focus:outline-none focus:border-[#FF8FB3]"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">Notes (Optional)</label>
            <input
              type="text"
              placeholder="e.g. For breakfast pancakes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border-2 border-[#FFD1E3] focus:outline-none focus:border-[#FF8FB3]"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-[#FF8FB3] hover:bg-[#FF7BA3] disabled:opacity-50 text-white font-baloo text-base font-bold py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,143,179,0.4)] transition-all active:scale-95 mt-4"
          >
            <Plus className="w-5 h-5" />
            <span>{loading ? "Placing in fridge..." : "Store Pal in Fridge 🧊"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
