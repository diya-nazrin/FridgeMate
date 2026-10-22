
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Please sign in" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("fridge_items")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const items = (data ?? [])
    .map((item) => ({
      ...item,
      userId: item.user_id,
      shelfLocation: item.shelf_location,
      expiryDate: item.expiry_date,
      addedAt: item.added_at,
      consumedAt: item.consumed_at,
      proteinG: item.protein_g,
      daysLeft: item.expiry_date
        ? Math.ceil(
            (new Date(`${item.expiry_date}T00:00:00`).getTime() -
              new Date(new Date().toDateString()).getTime()) /
              86400000
          )
        : null,
    }))
    .filter((item) => item.status === "IN_STOCK");

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Please sign in" },
      { status: 401 }
    );
  }

  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const inputs = Array.isArray(body) ? body : [body];

  const rows = inputs
    .filter(
      (item) =>
        typeof item?.name === "string" &&
        item.name.trim().length > 0
    )
    .map((item) => ({
      user_id: user.id,
      name: item.name.trim(),
      emoji: item.emoji || "🥑",
      category: item.category || "produce",
      shelf_location: item.shelfLocation || "mid_shelf",
      quantity: Number(item.quantity) || 1,
      unit: item.unit || "pcs",
      expiry_date: item.expiryDate || null,
      status: "IN_STOCK",
      calories: Number(item.calories) || 0,
      protein_g: Number(item.proteinG) || 0,
      allergens: Array.isArray(item.allergens)
        ? item.allergens
        : [],
      is_veg: item.isVeg ?? true,
      notes: item.notes || null,
    }));

  if (!rows.length) {
    return NextResponse.json(
      { error: "Item name is required" },
      { status: 400 }
    );
  }

  // Insert fridge items into Supabase.
  const { data, error } = await supabase
    .from("fridge_items")
    .insert(rows)
    .select("*");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Record an activity for each successfully inserted item.
  if (data?.length) {
    const activities = data.map((item) => ({
      user_id: user.id,
      action_type: "ADDED",
      pal_name: item.name,
      pal_emoji: item.emoji || "🥑",
      points_earned: 5,
    }));

    const { error: activityError } = await supabase
      .from("fridge_activity")
      .insert(activities);

    if (activityError) {
      // Keep the successful fridge insertion successful.
      console.error(
        "Failed to log fridge activity:",
        activityError.message
      );
    }
  }

  return NextResponse.json(
    { success: true, items: data },
    { status: 201 }
  );
}
