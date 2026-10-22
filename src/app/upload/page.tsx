
"use client";

import { createWorker } from "tesseract.js";
import React, { useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BottomTabs } from "@/components/BottomTabs";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  UploadCloud,
  Sparkles,
  Check,
  Trash2,
  ArrowRight,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getDatePlusDays } from "@/lib/date-utils";

interface ScannedItem {
  id: string;
  name: string;
  emoji: string;
  category: string;
  shelfLocation: string;
  quantity: number;
  unit: string;
  expiryDate: string;
}

const DEMO_RECEIPTS = [
  {
    title: "Trader Joe's Cute Haul 🛍️",
    store: "Trader Joe's #412",
    items: [
      { name: "Organic Honeycrisp Apples", emoji: "🍏", category: "produce", shelfLocation: "crisper_fruit", quantity: 4, unit: "pcs", expiryDays: 14 },
      { name: "Oat Milk Barista Blend", emoji: "🌾", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "carton", expiryDays: 10 },
      { name: "Everything Bagels", emoji: "🥯", category: "bakery", shelfLocation: "mid_shelf", quantity: 1, unit: "bag", expiryDays: 6 },
      { name: "Greek Whole Milk Yogurt", emoji: "🥣", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "tub", expiryDays: 8 },
      { name: "Sweet Mini Peppers", emoji: "🫑", category: "produce", shelfLocation: "crisper_veggie", quantity: 1, unit: "bag", expiryDays: 7 },
      { name: "Strawberry Mochi Bites", emoji: "🍨", category: "frozen", shelfLocation: "freezer", quantity: 1, unit: "box", expiryDays: 90 },
    ],
  },
  {
    title: "Farmer's Market Sunday 🧺",
    store: "Downtown Farmers Market",
    items: [
      { name: "Farm Fresh Strawberries", emoji: "🍓", category: "produce", shelfLocation: "crisper_fruit", quantity: 2, unit: "punnets", expiryDays: 3 },
      { name: "Wild Organic Blueberries", emoji: "🫐", category: "produce", shelfLocation: "crisper_fruit", quantity: 1, unit: "pack", expiryDays: 4 },
      { name: "Heirloom Spinach", emoji: "🥬", category: "produce", shelfLocation: "crisper_veggie", quantity: 1, unit: "bunch", expiryDays: 3 },
      { name: "Pasture Eggs", emoji: "🥚", category: "protein", shelfLocation: "door_shelf_top", quantity: 12, unit: "eggs", expiryDays: 18 },
      { name: "Artisanal Goat Cheese", emoji: "🧀", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "wheel", expiryDays: 15 },
    ],
  },
];

const RECEIPT_NOISE =
  /\b(subtotal|grand total|total|tax|vat|gst|discount|savings|change|cash|credit|debit|visa|mastercard|amex|balance|payment|tender|refund|thank you|receipt|invoice|cashier|register|transaction|approval|auth|card number|loyalty|rewards|points|store number|phone|www\.|http|date|time|terminal|item count|items sold|amount due|tip|rounding|coupon|return policy)\b/i;

const GROCERY_WORDS =
  /\b(milk|bread|egg|eggs|apple|apples|banana|bananas|orange|oranges|berry|berries|strawberr|blueberr|grape|grapes|spinach|lettuce|tomato|tomatoes|potato|potatoes|onion|onions|carrot|carrots|pepper|peppers|cucumber|broccoli|cheese|yogurt|yoghurt|butter|cream|juice|water|rice|pasta|noodle|noodles|flour|sugar|salt|oil|coffee|tea|chicken|beef|fish|salmon|tofu|beans|lentil|cereal|oats|oatmeal|cracker|crackers|biscuit|biscuits|cookie|cookies|chips|snack|snacks|frozen|pizza|bagel|bagels|tortilla|wraps|lemon|lime|avocado|mango|pineapple|melon|garlic|ginger|mushroom|mushrooms|corn|peas|herbs|cilantro|parsley|basil|cabbage|cauliflower|zucchini|milk alternative|almond|soy|oat milk|coconut|sparkling|soda|sauce|soup|broth|hummus|jam|honey|nuts|almonds|walnuts|peanut|chocolate|ice cream|mochi|dairy|produce|organic)\b/i;

function classifyItem(name: string) {
  const value = name.toLowerCase();

  if (/ice cream|mochi|frozen|pizza|frozen food/.test(value)) {
    return { category: "frozen", emoji: "🧊", shelfLocation: "freezer" };
  }

  if (/apple|banana|orange|berry|grape|lemon|lime|mango|pineapple|melon|avocado|pear|peach|fruit/.test(value)) {
    return { category: "produce", emoji: "🍎", shelfLocation: "crisper_fruit" };
  }

  if (/spinach|lettuce|tomato|potato|onion|carrot|pepper|cucumber|broccoli|zucchini|cabbage|cauliflower|garlic|ginger|mushroom|corn|peas|herb|cilantro|parsley|basil|vegetable/.test(value)) {
    return { category: "produce", emoji: "🥬", shelfLocation: "crisper_veggie" };
  }

  if (/milk|cheese|yogurt|yoghurt|butter|cream/.test(value)) {
    return { category: "dairy", emoji: "🥛", shelfLocation: "top_shelf" };
  }

  if (/egg|chicken|beef|fish|salmon|tofu|meat|sausage|bacon/.test(value)) {
    return { category: "protein", emoji: "🥚", shelfLocation: "top_shelf" };
  }

  if (/bread|bagel|bun|roll|pastry|croissant|muffin|cake|tortilla|wrap/.test(value)) {
    return { category: "bakery", emoji: "🍞", shelfLocation: "mid_shelf" };
  }

  if (/juice|water|soda|drink|beverage|sparkling|cola/.test(value)) {
    return { category: "drinks", emoji: "🥤", shelfLocation: "bottom_shelf" };
  }

  if (/almond milk|oat milk|soy milk|coconut milk/.test(value)) {
    return { category: "dairy", emoji: "🥛", shelfLocation: "top_shelf" };
  }

  return { category: "other", emoji: "🛒", shelfLocation: "mid_shelf" };
}

function parseReceiptText(text: string): ScannedItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/[|]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const items: ScannedItem[] = [];
  const seen = new Set<string>();

  for (const originalLine of lines) {
    if (originalLine.length < 3 || originalLine.length > 100) continue;
    if (RECEIPT_NOISE.test(originalLine)) continue;

    // Most receipts print a price at the end of each item line.
    // Prices are removed because this page stocks food, not purchases.
    let name = originalLine
      .replace(/\s+\$?\s*\d{1,5}[.,]\d{2}\s*$/, "")
      .replace(/\s+\$?\d{1,5}\s*$/, "")
      .replace(/^\s*\d{1,3}\s*[xX]\s+/, "")
      .replace(/^\s*\d{1,3}\s+/, "")
      .replace(/\s+(?:ea|each|lb|lbs|oz|kg|g|ml|l)\s*$/i, "")
      .replace(/^[^a-zA-Z]+/, "")
      .replace(/[^a-zA-Z0-9&'()./% -]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (name.length < 3 || !/[a-zA-Z]{2,}/.test(name)) continue;

    // Avoid interpreting store names, addresses and arbitrary text as food.
    // Price-bearing lines are more likely to be actual purchased items.
    const hadPrice = /\$?\d{1,5}[.,]\d{2}\s*$/.test(originalLine);
    if (!hadPrice && !GROCERY_WORDS.test(name)) continue;

    if (RECEIPT_NOISE.test(name)) continue;

    const normalized = name.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const classified = classifyItem(name);

    items.push({
      id: `scan-${Date.now()}-${items.length}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      emoji: classified.emoji,
      category: classified.category,
      shelfLocation: classified.shelfLocation,
      quantity: 1,
      unit: "pcs",
      // Receipt dates are not food expiry dates.
      expiryDate: "",
    });
  }

  return items;
}

export default function UploadScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsedItems, setParsedItems] = useState<ScannedItem[]>([]);
  const [rawText, setRawText] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const parseAndSetDemo = (demo: (typeof DEMO_RECEIPTS)[number]) => {
    sound.playPop();
    setScanning(true);
    setErrorMessage("");
    setSuccessMessage("");
    setRawText("");
    setReceiptImage(null);

    window.setTimeout(() => {
      const generated: ScannedItem[] = demo.items.map((item, index) => ({
        id: `demo-${Date.now()}-${index}`,
        name: item.name,
        emoji: item.emoji,
        category: item.category,
        shelfLocation: item.shelfLocation,
        quantity: item.quantity,
        unit: item.unit,
        expiryDate: getDatePlusDays(item.expiryDays),
      }));

      setParsedItems(generated);
      setScanning(false);
      sound.playSuccess();
    }, 500);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Let the same file be selected again later.
    event.target.value = "";

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image of your receipt.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("This image is larger than 15 MB. Please choose a smaller image.");
      return;
    }

    setScanning(true);
    setErrorMessage("");
    setSuccessMessage("");
    setParsedItems([]);
    setRawText("");
    sound.playPop();

    let worker: Awaited<ReturnType<typeof createWorker>> | null = null;

    try {
      const imageUrl = URL.createObjectURL(file);
      setReceiptImage(imageUrl);

      worker = await createWorker("eng");
      const result = await worker.recognize(file);
      const extractedText = result.data.text.trim();

      setRawText(extractedText);

      if (!extractedText) {
        setErrorMessage(
          "No text could be read. Try a sharper, brighter photo with the whole receipt visible."
        );
        return;
      }

      const items = parseReceiptText(extractedText);
      setParsedItems(items);

      if (items.length === 0) {
        setErrorMessage(
          "Text was detected, but no likely grocery items were identified. Check the extracted text below and try a clearer image."
        );
      } else {
        setSuccessMessage(
          `Read the receipt and found ${items.length} possible item${items.length === 1 ? "" : "s"}. Please review them before stocking.`
        );
        sound.playSuccess();
      }
    } catch (error) {
      console.error("Receipt OCR failed:", error);
      setErrorMessage(
        "Receipt scanning failed. Please try another image or use a demo receipt."
      );
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch (error) {
          console.error("Could not terminate OCR worker:", error);
        }
      }
      setScanning(false);
    }
  };

  const updateItem = (
    id: string,
    updates: Partial<ScannedItem>
  ) => {
    setParsedItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, ...updates };

        if (updates.name !== undefined) {
          const classification = classifyItem(updated.name);
          updated.emoji = classification.emoji;
          updated.category = classification.category;
          updated.shelfLocation = classification.shelfLocation;
        }

        return updated;
      })
    );
  };

  const addManualItem = () => {
    const id = `manual-${Date.now()}`;

    setParsedItems((current) => [
      ...current,
      {
        id,
        name: "",
        emoji: "🛒",
        category: "other",
        shelfLocation: "mid_shelf",
        quantity: 1,
        unit: "pcs",
        expiryDate: "",
      },
    ]);
  };

  const removeItem = (id: string) => {
    sound.playPop();
    setParsedItems((current) => current.filter((item) => item.id !== id));
  };

  const handleStockAll = async () => {
    const validItems = parsedItems.filter((item) => item.name.trim());

    if (validItems.length === 0) {
      setErrorMessage("Add at least one item with a name before stocking your fridge.");
      return;
    }

    if (validItems.some((item) => !Number.isFinite(item.quantity) || item.quantity <= 0)) {
      setErrorMessage("Every item must have a quantity greater than zero.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          validItems.map(({ id: _id, ...item }) => ({
            ...item,
            name: item.name.trim(),
            expiryDate: item.expiryDate || "",
          }))
        ),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed (${response.status})`);
      }

      sound.playSuccess();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#FF8FB3", "#FFD166", "#8FD9C4"],
      });

      router.push("/fridge");
    } catch (error) {
      console.error("Failed to stock fridge:", error);
      setErrorMessage(
        "Could not save the items to your fridge. Please try again. If this continues, check that the /api/fridge endpoint is available."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6F9] text-[#5A3D4D] font-poppins">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-28">
        <div className="mb-6">
          <h1 className="font-baloo text-3xl sm:text-[40px] font-bold text-[#5A3D4D]">
            scan grocery bill 🧾
          </h1>
          <p className="text-sm text-[#5A3D4D]/80 font-medium">
            Upload a receipt to extract grocery text, review the detected items,
            and add them to your fridge.
          </p>
        </div>

        {/* Demo receipts */}
        <div className="mb-6 bg-white border-3 border-[#FFD1E3] rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-[#C2456F] uppercase tracking-wider block mb-2">
            Try Demo Receipts
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DEMO_RECEIPTS.map((demo) => (
              <button
                key={demo.title}
                type="button"
                disabled={scanning || saving}
                onClick={() => parseAndSetDemo(demo)}
                className="bg-[#FFF0F5] hover:bg-[#FFE1EC] disabled:opacity-50 border-2 border-[#FFC2DA] rounded-xl p-3.5 text-left transition-all hover:scale-[1.02] flex items-center justify-between"
              >
                <div>
                  <div className="font-baloo text-sm font-bold text-[#5A3D4D]">
                    {demo.title}
                  </div>
                  <div className="text-[11px] text-[#5A3D4D]/60 mt-0.5">
                    {demo.items.length} items • {demo.store}
                  </div>
                </div>
                <span className="text-xs font-bold text-[#FF8FB3] bg-white px-2.5 py-1 rounded-full border border-[#FFD1E3]">
                  Try Demo ✨
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload receipt */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className="mb-8 border-3 border-dashed border-[#FF8FB3] bg-[#FFF0F5] rounded-3xl p-8 text-center cursor-pointer hover:bg-[#FFE1EC]/60 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/bmp"
            onChange={handleFileUpload}
            disabled={scanning || saving}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-[#FFE1EC] border-2 border-[#FF8FB3] text-[#FF8FB3] flex items-center justify-center mx-auto mb-3 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="font-baloo text-xl font-bold text-[#5A3D4D] mb-1">
            Upload your grocery receipt
          </h3>
          <p className="text-xs text-[#5A3D4D]/70 max-w-sm mx-auto mb-4">
            Choose a clear PNG, JPG or WebP image. OCR runs in your browser.
          </p>

          <span className="inline-block bg-[#FF8FB3] text-white font-baloo text-xs font-bold px-4 py-2 rounded-full shadow-sm">
            Browse Receipt File 📸
          </span>
        </div>

        {receiptImage && (
          <div className="mb-6 bg-white border-2 border-[#FFD1E3] rounded-2xl p-3">
            <p className="font-baloo font-bold text-sm mb-2">Receipt preview</p>
            <img
              src={receiptImage}
              alt="Uploaded grocery receipt"
              className="max-h-72 max-w-full mx-auto object-contain rounded-xl"
            />
          </div>
        )}

        {/* Scanning status */}
        {scanning && (
          <div className="bg-white border-3 border-[#FFD1E3] rounded-2xl p-8 text-center mb-8">
            <Sparkles className="w-8 h-8 text-[#FF8FB3] mx-auto mb-2 animate-spin" />
            <h4 className="font-baloo text-lg font-bold text-[#5A3D4D]">
              Reading your receipt... 🪄
            </h4>
            <p className="text-xs text-[#5A3D4D]/60 mt-1">
              Tesseract is extracting printed text. Large or blurry images can
              take longer.
            </p>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2 rounded-2xl border-2 border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {successMessage && !scanning && (
          <div className="mb-5 rounded-2xl border-2 border-[#8FD9C4] bg-[#E4F7F1] p-4 text-sm text-[#1F5F4C]">
            {successMessage}
          </div>
        )}

        {/* Editable detected items */}
        {parsedItems.length > 0 && !scanning && (
          <div className="bg-white border-3 border-[#FFD1E3] rounded-3xl p-5 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b-2 border-[#FFE1EC]">
              <div>
                <h3 className="font-baloo text-xl font-bold text-[#5A3D4D]">
                  Detected Fridge Pals
                </h3>
                <p className="text-xs text-[#5A3D4D]/60">
                  Correct the names and quantities. Expiry dates are left blank
                  unless you know them.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStockAll}
                disabled={saving}
                className="bg-[#51CF66] hover:bg-[#43B856] disabled:opacity-50 text-white font-baloo text-sm font-bold px-5 py-2.5 rounded-full flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-4 h-4" />
                {saving ? "Saving..." : "Stock into Fridge 🧊"}
              </button>
            </div>

            <div className="space-y-3 mb-5">
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#FFF6F9] border-2 border-[#FFE1EC]"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-2">{item.emoji}</span>

                    <div className="flex-1 min-w-0 space-y-2">
                      <label className="block text-xs font-semibold">
                        Item name
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateItem(item.id, { name: event.target.value })
                          }
                          placeholder="Enter product name"
                          className="mt-1 w-full rounded-xl border border-[#FFC2DA] bg-white px-3 py-2 text-sm text-[#5A3D4D] outline-none focus:ring-2 focus:ring-[#FF8FB3]"
                        />
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <label className="text-xs font-semibold">
                          Quantity
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.quantity}
                            onChange={(event) =>
                              updateItem(item.id, {
                                quantity: Number(event.target.value),
                              })
                            }
                            className="mt-1 w-full rounded-xl border border-[#FFC2DA] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8FB3]"
                          />
                        </label>

                        <label className="text-xs font-semibold">
                          Unit
                          <input
                            value={item.unit}
                            onChange={(event) =>
                              updateItem(item.id, { unit: event.target.value })
                            }
                            placeholder="pcs, pack..."
                            className="mt-1 w-full rounded-xl border border-[#FFC2DA] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8FB3]"
                          />
                        </label>

                        <label className="text-xs font-semibold col-span-2 sm:col-span-1">
                          Expiry date (optional)
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(event) =>
                              updateItem(item.id, {
                                expiryDate: event.target.value,
                              })
                            }
                            className="mt-1 w-full min-w-0 rounded-xl border border-[#FFC2DA] bg-white px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FF8FB3]"
                          />
                        </label>
                      </div>

                      <p className="text-[11px] text-[#5A3D4D]/60">
                        {item.category} • {item.shelfLocation.replaceAll("_", " ")}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${item.name || "item"}`}
                      onClick={() => removeItem(item.id)}
                      className="p-2 rounded-full text-[#FF6B6B] hover:bg-[#FFE1EC]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addManualItem}
              className="w-full mb-3 border-2 border-dashed border-[#FFC2DA] text-[#C2456F] hover:bg-[#FFF0F5] font-baloo font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add an item manually
            </button>

            <button
              type="button"
              onClick={handleStockAll}
              disabled={saving}
              className="w-full bg-[#FF8FB3] hover:bg-[#FF7BA3] disabled:opacity-50 text-white font-baloo text-lg font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,143,179,0.4)]"
            >
              <span>
                {saving
                  ? "Saving items..."
                  : `Stock ${parsedItems.length} items into Fridge 🧊`}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Actual extracted OCR text */}
        {rawText && !scanning && (
          <details className="mt-6 bg-white border-2 border-[#FFD1E3] rounded-2xl p-4">
            <summary className="cursor-pointer font-baloo font-bold text-[#5A3D4D] flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View raw extracted receipt text
            </summary>
            <p className="text-xs text-[#5A3D4D]/60 mt-2 mb-2">
              This is the text Tesseract read before product parsing. OCR may
              misread letters or numbers.
            </p>
            <pre className="whitespace-pre-wrap break-words text-xs leading-5 bg-[#FFF6F9] rounded-xl p-3 mt-2 max-h-80 overflow-y-auto">
              {rawText}
            </pre>
          </details>
        )}
      </main>

      <BottomTabs />
    </div>
  );
}

