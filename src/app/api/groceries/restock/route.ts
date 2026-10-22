
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  }

  const { data: fridgeItems, error: fridgeError } = await supabase
    .from("fridge_items")
    .select("name, emoji, category, unit")
    .eq("user_id", user.id)
    .or("quantity.lte.0,status.eq.OUT_OF_STOCK");

  if (fridgeError) {
    return NextResponse.json(
      { error: fridgeError.message },
      { status: 500 }
    );
  }

  const { data: existingItems, error: groceriesError } = await supabase
    .from("groceries")
    .select("name")
    .eq("user_id", user.id);

  if (groceriesError) {
    return NextResponse.json(
      { error: groceriesError.message },
      { status: 500 }
    );
  }

  const existingNames = new Set(
    (existingItems ?? []).map((item) => item.name.trim().toLowerCase())
  );

  const newItems = (fridgeItems ?? [])
    .filter((item) => !existingNames.has(item.name.trim().toLowerCase()))
    .map((item) => ({
      user_id: user.id,
      name: item.name,
      emoji: item.emoji ?? "🛒",
      category: item.category ?? "Other",
      quantity: 1,
      unit: item.unit ?? "pcs",
      is_bought: false,
    }));

  if (newItems.length === 0) {
    return NextResponse.json({
      success: true,
      added: 0,
      message: "No new items to restock",
    });
  }

  const { data, error } = await supabase
    .from("groceries")
    .insert(newItems)
    .select("*");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    added: data.length,
    items: data.map((item) => ({ ...item, isBought: item.is_bought })),
  });
}
