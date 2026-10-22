"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  ShoppingCart,
  Check,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Box,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface GroceryItem {
  id: number;
  name: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  isBought: boolean;
}

export default function GroceryPage() {
  const router = useRouter();
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🛒");
  const [category, setCategory] = useState("produce");
  const [loading, setLoading] = useState(false);

  const fetchGroceries = async () => {
    try {
      const res = await fetch("/api/groceries");
      const data = await res.json();

if (!res.ok) {
  console.error("Failed to load groceries:", data);
  return;
}

if (Array.isArray(data)) {
  setItems(data);
} else if (Array.isArray(data.items)) {
  setItems(data.items);
}
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroceries();
  }, []);

  const handleToggleBought = async (item: GroceryItem) => {
    sound.playPop();
    const nextState = !item.isBought;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isBought: nextState } : i))
    );

    await fetch(`/api/groceries/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isBought: nextState }),
    });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sound.playSuccess();
    setLoading(true);

    try {
      const res = await fetch("/api/groceries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          emoji: emoji || "🛒",
          category,
          quantity: 1,
          unit: "pcs",
        }),
      });
      const data = await res.json();

if (!res.ok) {
  console.error("Failed to add grocery:", data);
  alert(data.error || "Could not add grocery item.");
  return;
}

const newItem = data.item ?? data;

if (newItem && newItem.id !== undefined) {
  setItems((prev) => [newItem, ...prev]);
  setName("");
}

if (Array.isArray(data)) {
  setItems(data);
} else if (Array.isArray(data.items)) {
  setItems(data.items);
}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    sound.playPop();
    setItems(items.filter((i) => i.id !== id));
    await fetch(`/api/groceries/${id}`, { method: "DELETE" });
  };

  const handleRestockToFridge = async () => {
    const boughtCount = items.filter((i) => i.isBought).length;
    if (boughtCount === 0) return;

    sound.playSuccess();
    confetti({
      particleCount: 75,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FF8FB3", "#FFD166", "#8FD9C4"],
    });

    try {
      await fetch("/api/groceries/restock", { method: "POST" });
      router.push("/fridge");
    } catch (err) {
      console.error(err);
    }
  };

  const boughtItems = items.filter((i) => i.isBought);
  const pendingItems = items.filter((i) => !i.isBought);

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-28">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-baloo text-3xl sm:text-[40px] font-bold text-[#5A3D4D]">
              grocery shopping list 🛒
            </h1>
            <p className="text-sm text-[#5A3D4D]/80 font-medium">
              check off bought items and restock them straight into your 3D fridge with 1 click!
            </p>
          </div>

          {boughtItems.length > 0 && (
            <button
              onClick={handleRestockToFridge}
              className="bg-[#51CF66] hover:bg-[#43B856] text-white font-baloo text-sm font-bold px-5 py-2.5 rounded-full flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition-all self-start sm:self-auto"
            >
              <Box className="w-4 h-4" />
              <span>Restock {boughtItems.length} into Fridge 🧊</span>
            </button>
          )}
        </div>

        {/* Quick Add Input Bar */}
        <form
          onSubmit={handleAddItem}
          className="mb-8 bg-white border-3 border-[#FFD1E3] rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2"
        >
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-12 text-center text-xl bg-[#FFF0F5] border-2 border-[#FFD1E3] rounded-xl py-1.5 focus:outline-none focus:border-[#FF8FB3]"
            maxLength={4}
          />
          <input
            type="text"
            required
            placeholder="Add grocery item (e.g. Oat Milk, Strawberries, Avocados)..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 min-w-[160px] text-sm font-semibold px-3 py-2 bg-transparent focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-[#FFF0F5] border border-[#FFD1E3] text-[#5A3D4D]"
          >
            <option value="produce">Produce 🥦</option>
            <option value="dairy">Dairy 🥛</option>
            <option value="protein">Protein 🥚</option>
            <option value="drinks">Drinks 🥤</option>
            <option value="frozen">Frozen 🍨</option>
            <option value="bakery">Bakery 🍞</option>
            <option value="snacks">Snacks 🍫</option>
          </select>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="bg-[#FF8FB3] hover:bg-[#FF7BA3] disabled:opacity-50 text-white font-baloo text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </form>

        {/* Pending Items List */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-baloo text-xl font-bold text-[#5A3D4D]">
                To Buy ({pendingItems.length})
              </h3>
            </div>

            {pendingItems.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#FFD1E3] rounded-2xl p-6 text-center text-xs text-[#5A3D4D]/60 italic">
                All done! No pending items to buy right now. 🎀
              </div>
            ) : (
              <div className="space-y-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleBought(item)}
                    className="bg-white hover:bg-[#FFF6F9] border-2 border-[#FFE1EC] hover:border-[#FF8FB3] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg border-2 border-[#FF8FB3] flex items-center justify-center group-hover:bg-[#FFE1EC] transition-colors">
                        {item.isBought && <Check className="w-4 h-4 text-[#FF8FB3]" />}
                      </div>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-baloo text-base font-bold text-[#5A3D4D]">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-[#C2456F] bg-[#FFE1EC] px-2.5 py-0.5 rounded-full capitalize">
                        {item.category}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1.5 text-[#5A3D4D]/40 hover:text-[#FF6B6B] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bought / Cart Items */}
          {boughtItems.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-baloo text-xl font-bold text-[#51CF66] flex items-center gap-2">
                  <span>Bought & Ready to Restock ({boughtItems.length})</span>
                </h3>

                <button
                  onClick={handleRestockToFridge}
                  className="text-xs font-bold text-[#51CF66] hover:underline flex items-center gap-1"
                >
                  <span>1-Click Restock All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {boughtItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleBought(item)}
                    className="bg-[#E4F7F1]/60 border-2 border-[#8FD9C4] rounded-2xl p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[#51CF66] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-4 h-4" />
                      </div>
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-baloo text-base font-bold text-[#1F5F4C] line-through opacity-80">
                        {item.name}
                      </span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item.id);
                      }}
                      className="p-1.5 text-[#1F5F4C]/50 hover:text-[#FF6B6B] transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <BottomTabs />
    </div>
  );
}
