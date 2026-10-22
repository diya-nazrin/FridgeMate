"use client";

import React, { useState } from "react";
import { FridgePal } from "./AnimatedFridge";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  X,
  Utensils,
  Trash2,
  Calendar,
  Layers,
  Edit2,
  Check,
  ShoppingCart,
  CookingPot,
  Sparkles,
} from "lucide-react";

interface ItemDetailsModalProps {
  item: FridgePal | null;
  onClose: () => void;
  onEatItem: (id: number) => Promise<void>;
  onDeleteItem: (id: number) => Promise<void>;
  onUpdateItem: (id: number, updates: Partial<FridgePal>) => Promise<void>;
  onAddToGrocery: (name: string, emoji: string, category: string) => Promise<void>;
  onCookWithItem?: (name: string) => void;
}

const SHELF_LABELS: Record<string, string> = {
  freezer: "Freezer Zone (-18°C) 🍨",
  top_shelf: "Top Shelf (Dairy & Breakfast) 🥛",
  mid_shelf: "Middle Shelf (Leftovers & Protein) 🥡",
  bottom_shelf: "Bottom Shelf (Drinks & Heavy Goods) 🍉",
  crisper_veggie: "Veggie Crisper Drawer 🥦",
  crisper_fruit: "Fruit Crisper Drawer 🍓",
  door_shelf_top: "Door Top Shelf (Eggs & Condiments) 🥚",
  door_shelf_bottom: "Door Bottom Shelf (Beverages) 🥤",
};

export function ItemDetailsModal({
  item,
  onClose,
  onEatItem,
  onDeleteItem,
  onUpdateItem,
  onAddToGrocery,
  onCookWithItem,
}: ItemDetailsModalProps) {
  if (!item) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [emoji, setEmoji] = useState(item.emoji);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit);
  const [shelfLocation, setShelfLocation] = useState(item.shelfLocation);
  const [expiryDate, setExpiryDate] = useState(item.expiryDate);
  const [notes, setNotes] = useState(item.notes || "");
  const [loading, setLoading] = useState(false);
  const [groceryAdded, setGroceryAdded] = useState(false);

  const handleEat = async () => {
    sound.playEatCrunch();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#FF8FB3", "#FFD166", "#8FD9C4"],
    });
    setLoading(true);
    await onEatItem(item.id);
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    sound.playPop();
    if (confirm(`Remove ${item.name} from your fridge?`)) {
      setLoading(true);
      await onDeleteItem(item.id);
      setLoading(false);
      onClose();
    }
  };

  const handleSaveEdit = async () => {
    sound.playPop();
    setLoading(true);
    await onUpdateItem(item.id, {
      name,
      emoji,
      quantity,
      unit,
      shelfLocation,
      expiryDate,
      notes,
    });
    setLoading(false);
    setIsEditing(false);
  };

  const handleAddGrocery = async () => {
    sound.playSuccess();
    setGroceryAdded(true);
    await onAddToGrocery(item.name, item.emoji, item.category);
    setTimeout(() => setGroceryAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border-4 border-[#FFD1E3] rounded-[28px] max-w-md w-full p-6 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto">
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

        {/* Header with Pal Emoji */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FFF0F5] border-3 border-[#FF8FB3] flex items-center justify-center text-4xl shadow-inner">
            {isEditing ? (
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-10 text-center text-3xl bg-transparent focus:outline-none"
              />
            ) : (
              item.emoji
            )}
          </div>

          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-baloo text-xl font-bold text-[#5A3D4D] border-b-2 border-[#FF8FB3] w-full focus:outline-none"
              />
            ) : (
              <h2 className="font-baloo text-2xl font-bold text-[#5A3D4D] leading-tight">
                {item.name}
              </h2>
            )}

            {/* Freshness Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white ${
                  item.freshness === "expired"
                    ? "bg-[#FF6B6B]"
                    : item.freshness === "soon"
                    ? "bg-[#FFA94D]"
                    : "bg-[#51CF66]"
                }`}
              >
                {item.daysLeft <= 0
                  ? "⚠️ Expired"
                  : item.daysLeft <= 3
                  ? `⚠️ Eat me soon! (${item.daysLeft} days left)`
                  : `🎀 Fresh (${item.daysLeft} days left)`}
              </span>
            </div>
          </div>
        </div>

        {/* Shelf Placement Info */}
        <div className="bg-[#FFF0F5] rounded-xl p-3 border border-[#FFD1E3] mb-4 text-xs">
          <div className="flex items-center justify-between mb-1 text-[#5A3D4D]/70 font-semibold">
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#FF8FB3]" />
              Shelf Location
            </span>
          </div>
          {isEditing ? (
            <select
              value={shelfLocation}
              onChange={(e) => setShelfLocation(e.target.value)}
              className="w-full bg-white border border-[#FF8FB3] rounded-lg p-1.5 text-xs font-semibold text-[#5A3D4D]"
            >
              {Object.entries(SHELF_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          ) : (
            <div className="font-bold text-[#5A3D4D]">
              {SHELF_LABELS[item.shelfLocation] || item.shelfLocation}
            </div>
          )}
        </div>

        {/* Quantity & Expiry Form */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#FFF9EE] border border-[#FFD166] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[#B87F17] uppercase block mb-1">
              Quantity
            </span>
            {isEditing ? (
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-14 bg-white border border-[#FFD166] rounded px-1.5 py-0.5 text-xs font-bold"
                />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-16 bg-white border border-[#FFD166] rounded px-1.5 py-0.5 text-xs font-bold"
                />
              </div>
            ) : (
              <div className="font-baloo text-lg font-bold text-[#5A3D4D]">
                {item.quantity} {item.unit}
              </div>
            )}
          </div>

          <div className="bg-[#EBF5FF] border border-[#A3C9FF] rounded-xl p-3">
            <span className="text-[10px] font-bold text-[#3B6EA8] uppercase block mb-1">
              Expiry Date
            </span>
            {isEditing ? (
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full bg-white border border-[#A3C9FF] rounded px-1.5 py-0.5 text-xs font-bold"
              />
            ) : (
              <div className="font-baloo text-base font-bold text-[#5A3D4D]">
                {item.expiryDate}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">
            Pal Notes & Storage Tips:
          </label>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add cute notes..."
              rows={2}
              className="w-full text-xs p-2 rounded-xl border-2 border-[#FFD1E3] font-poppins focus:outline-none focus:border-[#FF8FB3]"
            />
          ) : (
            <p className="text-xs bg-[#FFF6F9] p-2.5 rounded-xl border border-[#FFD1E3] text-[#5A3D4D]/80 italic">
              {item.notes || "No notes added yet."}
            </p>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className="w-full bg-[#51CF66] hover:bg-[#43B856] text-white font-baloo text-base font-bold py-2.5 rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          ) : (
            <button
              onClick={handleEat}
              disabled={loading}
              className="w-full bg-[#FF8FB3] hover:bg-[#FF7BA3] text-white font-baloo text-lg font-bold py-3 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,143,179,0.5)] transition-all active:scale-95"
            >
              <Utensils className="w-5 h-5" />
              <span>Eat / Use 1 Portion! 🍴</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {/* Cook with this pal */}
            {onCookWithItem && (
              <button
                onClick={() => {
                  sound.playPop();
                  onClose();
                  onCookWithItem(item.name);
                }}
                className="bg-[#FFF0D6] hover:bg-[#FFD166] text-[#B87F17] text-xs font-bold py-2 rounded-full border border-[#FFD166] flex items-center justify-center gap-1.5 transition-all"
              >
                <CookingPot className="w-3.5 h-3.5" />
                <span>Cook with Pal 🍳</span>
              </button>
            )}

            {/* Add to Grocery list */}
            <button
              onClick={handleAddGrocery}
              disabled={groceryAdded}
              className="bg-[#E4F7F1] hover:bg-[#8FD9C4] text-[#1F5F4C] text-xs font-bold py-2 rounded-full border border-[#8FD9C4] flex items-center justify-center gap-1.5 transition-all"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{groceryAdded ? "Added! 🎀" : "Add to List 🛒"}</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#FFD1E3]/60 mt-1">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs font-bold text-[#C2456F] hover:underline flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? "Cancel Edit" : "Edit Details"}</span>
            </button>

            <button
              onClick={handleDelete}
              className="text-xs font-bold text-[#FF6B6B] hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Toss Pal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
