"use client";

import React, { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import {
  Sparkles,
  Thermometer,
  Snowflake,
  Plus,
  Info,
  Layers,
  ChevronRight,
  Maximize2,
  Minimize2,
  Settings2,
  RefreshCw,
  Search,
} from "lucide-react";

export interface FridgePal {
  id: number;
  name: string;
  emoji: string;
  category: string;
  shelfLocation: string; // 'freezer', 'top_shelf', 'mid_shelf', 'bottom_shelf', 'crisper_veggie', 'crisper_fruit', 'door_shelf_top', 'door_shelf_bottom'
  quantity: number;
  unit: string;
  expiryDate: string;
  status: string;
  notes?: string | null;
  calories?: number;
  proteinG?: number;
  allergens?: string[];
  isVeg?: boolean;
  daysLeft: number;
  freshness: "fresh" | "soon" | "expired";
}

interface AnimatedFridgeProps {
  items: FridgePal[];
  onSelectItem: (item: FridgePal) => void;
  onAddItemToShelf: (shelf: string) => void;
  fridgeColor?: string;
  onChangeColor?: (color: string) => void;
}

const COLOR_THEMES: Record<
  string,
  {
    name: string;
    bg: string;
    doorBg: string;
    border: string;
    trim: string;
    handle: string;
    accent: string;
    label: string;
  }
> = {
  pink: {
    name: "Bubblegum Pink",
    bg: "#FFE8F0",
    doorBg: "linear-gradient(135deg, #FFB3CA 0%, #FF8FB3 60%, #F5739E 100%)",
    border: "#FF8FB3",
    trim: "#FFD1E3",
    handle: "#FFFFFF",
    accent: "#C2456F",
    label: "🎀 Pink",
  },
  mint: {
    name: "Mint Frost",
    bg: "#E8F8F4",
    doorBg: "linear-gradient(135deg, #A8E8D8 0%, #8FD9C4 60%, #68C4AB 100%)",
    border: "#8FD9C4",
    trim: "#D1F2EA",
    handle: "#FFFFFF",
    accent: "#388B77",
    label: "🌿 Mint",
  },
  cream: {
    name: "Butter Cream",
    bg: "#FFF9EE",
    doorBg: "linear-gradient(135deg, #FFE8B8 0%, #FFD166 60%, #FABE3B 100%)",
    border: "#FFD166",
    trim: "#FFF0D6",
    handle: "#FFFFFF",
    accent: "#B87F17",
    label: "🧈 Butter",
  },
  blue: {
    name: "Ice Blue",
    bg: "#EEF5FF",
    doorBg: "linear-gradient(135deg, #C2DCFF 0%, #A3C9FF 60%, #7EAFF5 100%)",
    border: "#A3C9FF",
    trim: "#E0EDFF",
    handle: "#FFFFFF",
    accent: "#4378C7",
    label: "🧊 Blue",
  },
  lavender: {
    name: "Lilac Dream",
    bg: "#F7EEFF",
    doorBg: "linear-gradient(135deg, #E2C7FF 0%, #D0A5FF 60%, #B77EF7 100%)",
    border: "#D0A5FF",
    trim: "#F0E0FF",
    handle: "#FFFFFF",
    accent: "#7C45BF",
    label: "💜 Lilac",
  },
};

export function AnimatedFridge({
  items,
  onSelectItem,
  onAddItemToShelf,
  fridgeColor = "pink",
  onChangeColor,
}: AnimatedFridgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState(fridgeColor);
  const [activeVeggieDrawer, setActiveVeggieDrawer] = useState(false);
  const [activeFruitDrawer, setActiveFruitDrawer] = useState(false);
  const [temp, setTemp] = useState(3);
  const [filterText, setFilterText] = useState("");
  const [stickyNote, setStickyNote] = useState("remember: eat the berries first! 🍓✨");
  const [isEditingNote, setIsEditingNote] = useState(false);

  useEffect(() => {
    if (fridgeColor && COLOR_THEMES[fridgeColor]) {
      setSelectedColor(fridgeColor);
    }
  }, [fridgeColor]);

  const toggleDoor = () => {
    if (!isOpen) {
      sound.playDoorOpen();
    } else {
      sound.playDoorClose();
    }
    setIsOpen(!isOpen);
  };

  const handleColorChange = (cKey: string) => {
    sound.playPop();
    setSelectedColor(cKey);
    if (onChangeColor) onChangeColor(cKey);
  };

  const theme = COLOR_THEMES[selectedColor] || COLOR_THEMES.pink;

  // Filter items by shelf
  const filterItems = (shelf: string) => {
    return items
      .filter((i) => i.shelfLocation === shelf)
      .filter(
        (i) =>
          !filterText ||
          i.name.toLowerCase().includes(filterText.toLowerCase()) ||
          i.category.toLowerCase().includes(filterText.toLowerCase())
      );
  };

  const freezerItems = filterItems("freezer");
  const topShelfItems = filterItems("top_shelf");
  const midShelfItems = filterItems("mid_shelf");
  const bottomShelfItems = filterItems("bottom_shelf");
  const veggieItems = filterItems("crisper_veggie");
  const fruitItems = filterItems("crisper_fruit");
  const doorTopItems = filterItems("door_shelf_top");
  const doorBottomItems = filterItems("door_shelf_bottom");

  // Summary counts
  const soonCount = items.filter((i) => i.freshness === "soon").length;
  const freshCount = items.filter((i) => i.freshness === "fresh").length;

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Top Interactive Toolbar */}
      <div className="w-full max-w-4xl mb-6 bg-white border-3 border-[#FFD1E3] rounded-2xl p-4 shadow-[0_4px_12px_rgba(255,143,179,0.12)] flex flex-wrap items-center justify-between gap-4">
        {/* Door Toggle & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDoor}
            className={`px-5 py-2.5 rounded-full font-baloo text-base font-bold transition-all transform active:scale-95 flex items-center gap-2 shadow-md ${
              isOpen
                ? "bg-[#FFE1EC] text-[#C2456F] border-2 border-[#FF8FB3] hover:bg-[#FFD1E3]"
                : "bg-[#FF8FB3] text-white hover:bg-[#FF7BA3] shadow-[0_4px_12px_rgba(255,143,179,0.4)]"
            }`}
          >
            <span>{isOpen ? "🚪 Close Door" : "✨ Open Fridge"}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
              {isOpen ? "inside view" : "closed"}
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-[#5A3D4D]/80 bg-[#FFF0F5] px-3 py-1.5 rounded-full border border-[#FFD1E3]">
            <Thermometer className="w-3.5 h-3.5 text-[#FF8FB3]" />
            <span>{temp}°C Chilled</span>
            <span className="text-[#5A3D4D]/30">•</span>
            <span className="text-[#FFA94D] font-bold">{soonCount} soon</span>
            <span className="text-[#5A3D4D]/30">•</span>
            <span className="text-[#51CF66] font-bold">{freshCount} fresh</span>
          </div>
        </div>

        {/* Color Palette Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#5A3D4D]/70 hidden md:inline">Fridge Color:</span>
          <div className="flex gap-1.5">
            {Object.entries(COLOR_THEMES).map(([cKey, cVal]) => (
              <button
                key={cKey}
                onClick={() => handleColorChange(cKey)}
                title={cVal.name}
                className={`w-7 h-7 rounded-full transition-transform border-2 flex items-center justify-center ${
                  selectedColor === cKey
                    ? "scale-110 border-[#5A3D4D] shadow-sm ring-2 ring-[#FF8FB3]"
                    : "border-white/80 hover:scale-105"
                }`}
                style={{
                  background: cVal.border,
                }}
              >
                {selectedColor === cKey && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3D Fridge Stage */}
      <div className="perspective-fridge relative w-full max-w-3xl flex justify-center py-4">
        {/* Main Fridge Cabinet */}
        <div
          className="relative w-full max-w-[620px] rounded-[38px] border-[5px] shadow-[0_20px_50px_rgba(90,61,77,0.18)] transition-all duration-300 overflow-visible"
          style={{
            borderColor: theme.border,
            background: "#FFFBFD",
          }}
        >
          {/* Top Fridge Crown / Retro SMEG Curves */}
          <div
            className="w-full h-10 rounded-t-[32px] flex items-center justify-between px-6 border-b-2"
            style={{
              background: theme.doorBg,
              borderColor: "rgba(255,255,255,0.4)",
            }}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-white/40" />
              <span className="text-white/90 font-baloo font-bold text-xs tracking-wider uppercase drop-shadow-sm">
                Fridgemate Retro-Cool 3000
              </span>
            </div>

            {/* Chilled Temperature Gauge */}
            <div className="flex items-center gap-1.5 bg-white/25 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-white text-[11px] font-bold">
              <Snowflake className="w-3 h-3 animate-spin" style={{ animationDuration: "12s" }} />
              <span>{temp}°C</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* INTERIOR FRIDGE COMPARTMENT (VISIBLE WHEN OPEN) */}
          {/* ======================================================== */}
          <div
            className="p-4 sm:p-6 bg-gradient-to-b from-[#FFF5F8] via-[#FFFFFF] to-[#FFF0F6] min-h-[640px] flex flex-col justify-between relative overflow-hidden rounded-b-[32px]"
          >
            {/* Interior LED Light Glow Beam when Open */}
            {isOpen && (
              <>
                <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-white/90 via-white/40 to-transparent pointer-events-none z-10" />
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-yellow-100/50 rounded-full blur-2xl pointer-events-none" />

                {/* Cold Frost Vapor Particles wafting out */}
                <div className="absolute top-8 left-12 w-16 h-16 rounded-full bg-white/40 blur-xl animate-vapor pointer-events-none" />
                <div
                  className="absolute top-20 right-16 w-20 h-20 rounded-full bg-blue-100/40 blur-xl animate-vapor pointer-events-none"
                  style={{ animationDelay: "1.2s" }}
                />
                <div
                  className="absolute top-36 left-1/3 w-24 h-24 rounded-full bg-white/30 blur-2xl animate-vapor pointer-events-none"
                  style={{ animationDelay: "2.1s" }}
                />
              </>
            )}

            {/* 1. FREEZER COMPARTMENT (Upper Chilled Zone) */}
            <div className="mb-4 bg-gradient-to-b from-[#EBF5FF] to-[#DBEEFF] border-2 border-[#A3C9FF] rounded-2xl p-3 shadow-inner relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-baloo text-xs font-bold text-[#3B6EA8]">
                  <Snowflake className="w-3.5 h-3.5 text-[#63A3FF]" />
                  <span>Freezer Zone (-18°C)</span>
                  <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded-full">
                    {freezerItems.length} pals
                  </span>
                </div>
                <button
                  onClick={() => {
                    sound.playPop();
                    onAddItemToShelf("freezer");
                  }}
                  className="text-[11px] bg-white text-[#3B6EA8] hover:bg-[#C8E4FF] font-bold px-2 py-0.5 rounded-full border border-[#A3C9FF] flex items-center gap-1 transition-all"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* Freezer items row */}
              <div className="min-h-[52px] flex items-center gap-2 overflow-x-auto pb-1">
                {freezerItems.length === 0 ? (
                  <div className="text-[11px] text-[#3B6EA8]/60 italic py-2 pl-2">
                    Ice cubes chilling... Add ice cream or frozen dumplings! 🍨
                  </div>
                ) : (
                  freezerItems.map((item) => (
                    <ProductPill
                      key={item.id}
                      item={item}
                      onClick={() => onSelectItem(item)}
                    />
                  ))
                )}
              </div>

              {/* Frosted ice shelf bottom bar */}
              <div className="w-full h-1.5 rounded-full bg-[#A3C9FF]/60 mt-1 shadow-sm" />
            </div>

            {/* 2. TOP MAIN SHELF (Dairy, Breakfast, Drinks) */}
            <div className="mb-4 relative">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="font-baloo text-xs font-bold text-[#5A3D4D]/75 flex items-center gap-1.5">
                  <span>🥛 Top Shelf</span>
                  <span className="text-[10px] font-poppins font-semibold text-[#5A3D4D]/50">
                    (dairy & breakfast)
                  </span>
                </span>
                <button
                  onClick={() => {
                    sound.playPop();
                    onAddItemToShelf("top_shelf");
                  }}
                  className="text-[11px] bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              {/* Shelf Items */}
              <div className="min-h-[64px] flex items-center gap-2.5 overflow-x-auto py-1 px-1">
                {topShelfItems.length === 0 ? (
                  <div className="text-xs text-[#5A3D4D]/40 italic py-3 pl-2">
                    Empty shelf — perfect spot for milk, yogurt, and butter! 🥛
                  </div>
                ) : (
                  topShelfItems.map((item) => (
                    <ProductPill
                      key={item.id}
                      item={item}
                      onClick={() => onSelectItem(item)}
                    />
                  ))
                )}
              </div>

              {/* Glass Shelf Lip with chrome edge */}
              <div className="w-full h-2 rounded-full shelf-glass" />
            </div>

            {/* 3. MIDDLE MAIN SHELF (Leftovers, Proteins, Bakery) */}
            <div className="mb-4 relative">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="font-baloo text-xs font-bold text-[#5A3D4D]/75 flex items-center gap-1.5">
                  <span>🥡 Middle Shelf</span>
                  <span className="text-[10px] font-poppins font-semibold text-[#5A3D4D]/50">
                    (leftovers & proteins)
                  </span>
                </span>
                <button
                  onClick={() => {
                    sound.playPop();
                    onAddItemToShelf("mid_shelf");
                  }}
                  className="text-[11px] bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              <div className="min-h-[64px] flex items-center gap-2.5 overflow-x-auto py-1 px-1">
                {midShelfItems.length === 0 ? (
                  <div className="text-xs text-[#5A3D4D]/40 italic py-3 pl-2">
                    Middle shelf ready for yummy leftovers and treats 🍰
                  </div>
                ) : (
                  midShelfItems.map((item) => (
                    <ProductPill
                      key={item.id}
                      item={item}
                      onClick={() => onSelectItem(item)}
                    />
                  ))
                )}
              </div>

              {/* Glass Shelf Lip */}
              <div className="w-full h-2 rounded-full shelf-glass" />
            </div>

            {/* 4. BOTTOM MAIN SHELF (Tall Bottles, Large Produce) */}
            <div className="mb-4 relative">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <span className="font-baloo text-xs font-bold text-[#5A3D4D]/75 flex items-center gap-1.5">
                  <span>🍉 Bottom Shelf</span>
                  <span className="text-[10px] font-poppins font-semibold text-[#5A3D4D]/50">
                    (drinks & heavy goods)
                  </span>
                </span>
                <button
                  onClick={() => {
                    sound.playPop();
                    onAddItemToShelf("bottom_shelf");
                  }}
                  className="text-[11px] bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3] font-bold px-2 py-0.5 rounded-full transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add</span>
                </button>
              </div>

              <div className="min-h-[64px] flex items-center gap-2.5 overflow-x-auto py-1 px-1">
                {bottomShelfItems.length === 0 ? (
                  <div className="text-xs text-[#5A3D4D]/40 italic py-3 pl-2">
                    Room for big watermelon wedges and drink bottles! 🍑
                  </div>
                ) : (
                  bottomShelfItems.map((item) => (
                    <ProductPill
                      key={item.id}
                      item={item}
                      onClick={() => onSelectItem(item)}
                    />
                  ))
                )}
              </div>

              {/* Glass Shelf Lip */}
              <div className="w-full h-2 rounded-full shelf-glass" />
            </div>

            {/* 5. CRISPER DRAWERS (Vegetables & Fruits) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {/* Veggie Crisper Drawer */}
              <div
                className={`crisper-glass rounded-2xl p-3 border-2 border-[#8FD9C4] transition-all cursor-pointer shadow-sm relative group ${
                  activeVeggieDrawer ? "ring-2 ring-[#8FD9C4] scale-[1.02] bg-[#E4F7F1]" : "hover:border-[#51CF66]"
                }`}
                onClick={() => {
                  sound.playDrawerSlide();
                  setActiveVeggieDrawer(!activeVeggieDrawer);
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-baloo text-xs font-bold text-[#2B735D] flex items-center gap-1">
                    <span>🥦 Veggie Drawer</span>
                  </span>
                  <span className="text-[10px] font-bold bg-[#8FD9C4]/40 text-[#1F5F4C] px-2 py-0.5 rounded-full">
                    {veggieItems.length}
                  </span>
                </div>

                <div className="min-h-[50px] flex items-center gap-1.5 overflow-x-auto">
                  {veggieItems.length === 0 ? (
                    <span className="text-[11px] text-[#2B735D]/60 italic">tap to fill veggies</span>
                  ) : (
                    veggieItems.map((item) => (
                      <ProductPill
                        key={item.id}
                        item={item}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Handle lip */}
                <div className="w-12 h-1 bg-[#8FD9C4] rounded-full mx-auto mt-1" />
              </div>

              {/* Fruit Crisper Drawer */}
              <div
                className={`crisper-glass rounded-2xl p-3 border-2 border-[#FFB3CA] transition-all cursor-pointer shadow-sm relative group ${
                  activeFruitDrawer ? "ring-2 ring-[#FF8FB3] scale-[1.02] bg-[#FFE1EC]" : "hover:border-[#FF8FB3]"
                }`}
                onClick={() => {
                  sound.playDrawerSlide();
                  setActiveFruitDrawer(!activeFruitDrawer);
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-baloo text-xs font-bold text-[#C2456F] flex items-center gap-1">
                    <span>🍓 Fruit Drawer</span>
                  </span>
                  <span className="text-[10px] font-bold bg-[#FFB3CA]/40 text-[#C2456F] px-2 py-0.5 rounded-full">
                    {fruitItems.length}
                  </span>
                </div>

                <div className="min-h-[50px] flex items-center gap-1.5 overflow-x-auto">
                  {fruitItems.length === 0 ? (
                    <span className="text-[11px] text-[#C2456F]/60 italic">tap to fill berries</span>
                  ) : (
                    fruitItems.map((item) => (
                      <ProductPill
                        key={item.id}
                        item={item}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                      />
                    ))
                  )}
                </div>

                {/* Handle lip */}
                <div className="w-12 h-1 bg-[#FFB3CA] rounded-full mx-auto mt-1" />
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3D SWINGING FRIDGE DOOR (OVERLAY) */}
          {/* ======================================================== */}
          <div
            onClick={(e) => {
              // Click anywhere on closed door to open
              if (!isOpen) {
                toggleDoor();
              }
            }}
            className={`door-swing-left absolute inset-0 rounded-[34px] border-4 border-white/60 cursor-pointer fridge-preserve-3d ${
              isOpen ? "is-open pointer-events-none" : "is-closed pointer-events-auto"
            }`}
            style={{
              background: theme.doorBg,
              zIndex: 25,
            }}
          >
            {/* Glossy Curved Light Reflection */}
            <div className="absolute top-2 left-6 right-6 h-28 bg-gradient-to-b from-white/35 to-transparent rounded-t-[28px] pointer-events-none" />
            <div className="absolute inset-y-8 left-4 w-6 bg-gradient-to-r from-white/20 to-transparent rounded-l-full pointer-events-none" />

            {/* Embossed Fridge Brand Badge */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-white/90 border-2 border-[#FFD1E3] shadow-md px-5 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-xl">🧊</span>
              <span className="font-baloo font-extrabold text-sm sm:text-base text-[#5A3D4D] tracking-wider uppercase">
                FRIDGEMATE
              </span>
            </div>

            {/* Digital LED Chilled Gauge on Door */}
            <div className="absolute top-28 left-1/2 -translate-x-1/2 bg-[#5A3D4D] text-white px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-inner border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#51CF66] animate-pulse" />
              <span>3°C CHILLED</span>
            </div>

            {/* ============================================== */}
            {/* CUTE INTERACTIVE MAGNETS ON DOOR */}
            {/* ============================================== */}
            {/* 1. Strawberry Magnet */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playMagnetSnap();
              }}
              style={{ "--rot": "-6deg" } as React.CSSProperties}
              className="absolute top-44 left-10 w-14 h-14 bg-white/90 rounded-2xl shadow-lg border-2 border-[#FFD1E3] flex flex-col items-center justify-center p-1 cursor-grab active:scale-95 magnet-wiggle"
              title="Cute Strawberry Magnet"
            >
              <span className="text-2xl">🍓</span>
              <span className="text-[8px] font-bold text-[#C2456F]">sweet</span>
            </div>

            {/* 2. Avocado Magnet */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playMagnetSnap();
              }}
              style={{ "--rot": "8deg" } as React.CSSProperties}
              className="absolute top-48 right-24 w-12 h-12 bg-white/90 rounded-full shadow-lg border-2 border-[#8FD9C4] flex items-center justify-center cursor-grab active:scale-95 magnet-wiggle"
              title="Avocado Magnet"
            >
              <span className="text-2xl">🥑</span>
            </div>

            {/* 3. Cat Magnet */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playMagnetSnap();
              }}
              style={{ "--rot": "4deg" } as React.CSSProperties}
              className="absolute top-68 left-14 w-13 h-13 bg-white/90 rounded-2xl shadow-lg border-2 border-[#FFD166] flex flex-col items-center justify-center p-1 cursor-grab active:scale-95 magnet-wiggle"
              title="Kitty Magnet"
            >
              <span className="text-2xl">🐱</span>
              <span className="text-[8px] font-bold text-[#B87F17]">meow</span>
            </div>

            {/* 4. Polaroid Photo Sticker */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playMagnetSnap();
              }}
              style={{ "--rot": "-3deg" } as React.CSSProperties}
              className="absolute top-64 right-16 w-24 bg-white shadow-xl rounded-md p-1.5 border border-slate-200 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer"
            >
              <div className="w-full h-16 bg-[#FFE1EC] rounded flex items-center justify-center text-2xl">
                🧸🍱
              </div>
              <div className="text-[9px] font-baloo font-bold text-center text-[#5A3D4D] mt-1">
                market haul! ✨
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-400 border border-white shadow-sm" />
            </div>

            {/* 5. Sticky Note Reminder */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                sound.playPop();
                setIsEditingNote(!isEditingNote);
              }}
              style={{ "--rot": "2deg" } as React.CSSProperties}
              className="absolute top-96 left-12 w-48 bg-[#FFF9C4] text-[#5A3D4D] shadow-lg rounded-md p-3 border border-yellow-200 transform rotate-2 hover:rotate-0 transition-transform cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full bg-red-500 mx-auto -mt-4 shadow-sm mb-1" />
              <div className="text-[10px] font-bold text-[#B87F17] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>📝 Note to Self</span>
                <span className="text-[8px] underline">edit</span>
              </div>
              {isEditingNote ? (
                <input
                  type="text"
                  value={stickyNote}
                  onChange={(e) => setStickyNote(e.target.value)}
                  onBlur={() => setIsEditingNote(false)}
                  autoFocus
                  className="w-full text-xs bg-transparent border-b border-yellow-400 font-poppins focus:outline-none"
                />
              ) : (
                <p className="text-xs font-poppins font-medium leading-tight">
                  {stickyNote}
                </p>
              )}
            </div>

            {/* 6. Click Hint Pulsing Bubble */}
            {!isOpen && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-white/95 text-[#5A3D4D] px-4 py-2 rounded-full font-baloo font-bold text-sm shadow-xl border-2 border-[#FF8FB3] animate-bounce flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF8FB3]" />
                <span>Tap door to open fridge! 🧊</span>
              </div>
            )}

            {/* Retro Chrome Handle on the Right */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleDoor();
              }}
              className="absolute top-1/2 -translate-y-1/2 right-4 w-7 h-48 rounded-full shadow-[2px_6px_16px_rgba(0,0,0,0.25)] flex items-center justify-center cursor-pointer group hover:scale-105 active:scale-95 transition-transform"
              style={{
                background:
                  "linear-gradient(90deg, #D4D4D8 0%, #FFFFFF 40%, #A1A1AA 80%, #71717A 100%)",
                border: "2px solid rgba(255,255,255,0.8)",
              }}
              title="Pull Handle to Open/Close"
            >
              {/* Inner grip groove */}
              <div className="w-2.5 h-36 rounded-full bg-slate-300 shadow-inner" />
            </div>
          </div>

          {/* ======================================================== */}
          {/* SWUNG DOOR INNER RACKS / BINS (VISIBLE WHEN OPEN) */}
          {/* ======================================================== */}
          {isOpen && (
            <div
              className="hidden md:block absolute top-0 -left-[270px] w-[260px] h-full rounded-l-[32px] bg-gradient-to-r from-[#FFF0F6] to-[#FFE1EC] border-4 border-r-0 border-[#FFB3CA] shadow-2xl p-3.5 z-20 animate-pill"
            >
              {/* Door Rack Title */}
              <div className="font-baloo text-xs font-bold text-[#C2456F] flex items-center justify-between pb-2 border-b border-[#FFD1E3]">
                <span>🚪 Door Shelves</span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-[#5A3D4D]">
                  {doorTopItems.length + doorBottomItems.length} pals
                </span>
              </div>

              {/* Upper Door Rack: Eggs & Condiments */}
              <div className="my-3 bg-white/70 rounded-xl p-2.5 border border-[#FFD1E3]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#5A3D4D]">🥚 Eggs & Sauces</span>
                  <button
                    onClick={() => {
                      sound.playPop();
                      onAddItemToShelf("door_shelf_top");
                    }}
                    className="text-[10px] text-[#C2456F] font-bold"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[44px]">
                  {doorTopItems.map((item) => (
                    <ProductPill key={item.id} item={item} onClick={() => onSelectItem(item)} compact />
                  ))}
                  {doorTopItems.length === 0 && (
                    <span className="text-[10px] text-gray-400 italic">empty rack</span>
                  )}
                </div>
                {/* Rack Rail */}
                <div className="w-full h-1 bg-[#FF8FB3]/50 rounded-full mt-1" />
              </div>

              {/* Lower Door Rack: Drinks & Juices */}
              <div className="my-3 bg-white/70 rounded-xl p-2.5 border border-[#FFD1E3]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-[#5A3D4D]">🥤 Beverages</span>
                  <button
                    onClick={() => {
                      sound.playPop();
                      onAddItemToShelf("door_shelf_bottom");
                    }}
                    className="text-[10px] text-[#C2456F] font-bold"
                  >
                    + Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[44px]">
                  {doorBottomItems.map((item) => (
                    <ProductPill key={item.id} item={item} onClick={() => onSelectItem(item)} compact />
                  ))}
                  {doorBottomItems.length === 0 && (
                    <span className="text-[10px] text-gray-400 italic">empty rack</span>
                  )}
                </div>
                {/* Rack Rail */}
                <div className="w-full h-1 bg-[#FF8FB3]/50 rounded-full mt-1" />
              </div>

              {/* Close Door Quick Button */}
              <button
                onClick={toggleDoor}
                className="w-full mt-4 py-1.5 bg-[#FF8FB3] hover:bg-[#FF7BA3] text-white text-xs font-bold font-baloo rounded-full transition-all flex items-center justify-center gap-1 shadow-sm"
              >
                <span>🚪 Shut Door</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Interactive Product Pill inside Fridge
// -------------------------------------------------------------
interface ProductPillProps {
  item: FridgePal;
  onClick: (e: React.MouseEvent) => void;
  compact?: boolean;
}

function ProductPill({ item, onClick, compact = false }: ProductPillProps) {
  const dotColor =
    item.freshness === "expired"
      ? "bg-[#FF6B6B]"
      : item.freshness === "soon"
      ? "bg-[#FFA94D]"
      : "bg-[#51CF66]";

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        sound.playPop();
        onClick(e);
      }}
      className={`group relative bg-white border-2 border-[#FFE1EC] hover:border-[#FF8FB3] rounded-[14px] shadow-sm hover:shadow-md transition-all duration-150 transform hover:-translate-y-1 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 animate-pill ${
        compact ? "px-2 py-1" : "px-2.5 py-1.5"
      }`}
      title={`${item.name} (${item.quantity} ${item.unit}) — ${
        item.daysLeft <= 0
          ? "Expired!"
          : item.daysLeft === 1
          ? "1 day left!"
          : `${item.daysLeft} days left`
      }`}
    >
      {/* Freshness Status Dot */}
      <span
        className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full ${dotColor} border-2 border-white shadow-xs`}
      />

      {/* Item Emoji */}
      <span className={compact ? "text-base" : "text-xl sm:text-2xl"}>
        {item.emoji}
      </span>

      {/* Item Label & Qty */}
      <div className="flex flex-col text-left">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#5A3D4D] leading-tight whitespace-nowrap max-w-[90px] truncate">
          {item.name}
        </span>
        <span className="text-[8.5px] font-medium text-[#5A3D4D]/60 leading-none">
          {item.daysLeft <= 0
            ? "⚠️ Expired"
            : item.daysLeft <= 3
            ? `⚠️ ${item.daysLeft}d left`
            : `🎀 ${item.daysLeft}d left`}
        </span>
      </div>
    </div>
  );
}
