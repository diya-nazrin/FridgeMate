"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { AnimatedFridge, FridgePal } from "@/components/AnimatedFridge";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";
import { AddPalModal } from "@/components/AddPalModal";
import { sound } from "@/lib/sound";
import {
  Sparkles,
  Thermometer,
  Layers,
  Search,
  Filter,
  Plus,
  RotateCcw,
  Palette,
  Snowflake,
} from "lucide-react";

export default function FridgePage() {
  const [items, setItems] = useState<FridgePal[]>([]);
  const [selectedItem, setSelectedItem] = useState<FridgePal | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetShelf, setTargetShelf] = useState("mid_shelf");
  const [fridgeColor, setFridgeColor] = useState("pink");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/fridge");
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleEatItem = async (id: number) => {
    await fetch(`/api/fridge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "eat" }),
    });
    fetchItems();
  };

  const handleDeleteItem = async (id: number) => {
    await fetch(`/api/fridge/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleUpdateItem = async (id: number, updates: Partial<FridgePal>) => {
    await fetch(`/api/fridge/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    fetchItems();
  };

  const handleAddPal = async (palData: any) => {
    await fetch("/api/fridge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(palData),
    });
    fetchItems();
  };

  const handleAddToGrocery = async (name: string, emoji: string, category: string) => {
    await fetch("/api/groceries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji, category, quantity: 1, unit: "pcs" }),
    });
  };

  const categories = [
    { id: "all", label: "All Pals ✨" },
    { id: "produce", label: "Produce 🥦" },
    { id: "dairy", label: "Dairy 🥛" },
    { id: "protein", label: "Protein 🥚" },
    { id: "drinks", label: "Drinks 🥤" },
    { id: "leftovers", label: "Leftovers 🥡" },
    { id: "frozen", label: "Freezer 🍨" },
    { id: "condiments", label: "Condiments 🥫" },
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === "all" || item.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar
        onOpenAddModal={() => {
          setTargetShelf("mid_shelf");
          setIsAddModalOpen(true);
        }}
        onResetData={async () => {
          await fetch("/api/fridge/seed", { method: "POST" });
          fetchItems();
        }}
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-28">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-baloo text-3xl sm:text-[40px] font-bold text-[#5A3D4D]">
              interactive 3D fridge 🧊
            </h1>
            <p className="text-sm text-[#5A3D4D]/80 font-medium">
              click the door or chrome handle to open your fridge and explore every shelf!
            </p>
          </div>

          {/* Search & Add */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#5A3D4D]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fridge pals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-full border-2 border-[#FFD1E3] bg-white text-xs font-semibold focus:outline-none focus:border-[#FF8FB3] w-48 sm:w-56"
              />
            </div>

            <button
              onClick={() => {
                sound.playPop();
                setTargetShelf("mid_shelf");
                setIsAddModalOpen(true);
              }}
              className="bg-[#FF8FB3] hover:bg-[#FF7BA3] text-white px-4 py-2 rounded-full text-xs font-bold font-baloo flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Pal</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                sound.playPop();
                setFilterCategory(c.id);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                filterCategory === c.id
                  ? "bg-[#FF8FB3] text-white shadow-xs scale-105"
                  : "bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* 3D Animated Fridge Component */}
        <div className="flex justify-center">
          <AnimatedFridge
            items={filteredItems}
            onSelectItem={(item) => setSelectedItem(item)}
            onAddItemToShelf={(shelf) => {
              setTargetShelf(shelf);
              setIsAddModalOpen(true);
            }}
            fridgeColor={fridgeColor}
            onChangeColor={(c) => setFridgeColor(c)}
          />
        </div>

        {/* Shelf breakdown guide */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-[#FFD1E3] rounded-2xl p-4 text-center">
            <span className="text-2xl mb-1 block">🍨</span>
            <div className="font-baloo text-sm font-bold text-[#5A3D4D]">Freezer Zone</div>
            <div className="text-[11px] text-[#5A3D4D]/60 mt-0.5">-18°C Frost Kept</div>
          </div>
          <div className="bg-white border-2 border-[#FFD1E3] rounded-2xl p-4 text-center">
            <span className="text-2xl mb-1 block">🥛</span>
            <div className="font-baloo text-sm font-bold text-[#5A3D4D]">Top Shelf</div>
            <div className="text-[11px] text-[#5A3D4D]/60 mt-0.5">Dairy & Breakfast</div>
          </div>
          <div className="bg-white border-2 border-[#FFD1E3] rounded-2xl p-4 text-center">
            <span className="text-2xl mb-1 block">🥦</span>
            <div className="font-baloo text-sm font-bold text-[#5A3D4D]">Crisper Drawers</div>
            <div className="text-[11px] text-[#5A3D4D]/60 mt-0.5">High Humidity Fresh</div>
          </div>
          <div className="bg-white border-2 border-[#FFD1E3] rounded-2xl p-4 text-center">
            <span className="text-2xl mb-1 block">🚪</span>
            <div className="font-baloo text-sm font-bold text-[#5A3D4D]">Door Racks</div>
            <div className="text-[11px] text-[#5A3D4D]/60 mt-0.5">Eggs, Sauces & Drinks</div>
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
