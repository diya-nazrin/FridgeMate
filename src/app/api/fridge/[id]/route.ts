
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

type ActivityAction = "EATEN" | "DISCARDED";

async function logFridgeActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  actionType: ActivityAction,
  itemName: string,
  itemEmoji: string,
  pointsEarned: number
) {
  const { error } = await supabase.from("fridge_activity").insert({
    user_id: userId,
    action_type: actionType,
    pal_name: itemName,
    pal_emoji: itemEmoji,
    points_earned: pointsEarned,
  });

  // Activity logging should not undo a successful fridge update.
  if (error) {
    console.error("Failed to log fridge activity:", error.message);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Invalid item ID" },
      { status: 400 }
    );
  }

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

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (body.action === "eat" || body.action === "discard") {
    const { data: item, error: readError } = await supabase
      .from("fridge_items")
      .select("id, name, emoji, quantity, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (readError || !item) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      );
    }

    if (item.status !== "IN_STOCK") {
      return NextResponse.json(
        { error: "This item is no longer in stock" },
        { status: 400 }
      );
    }

    let update: Record<string, unknown>;
    let activityType: ActivityAction;
    let pointsEarned: number;

    if (body.action === "discard") {
      update = {
        status: "DISCARDED",
      };
      activityType = "DISCARDED";
      pointsEarned = 0;
    } else {
      const currentQuantity = Math.max(0, Number(item.quantity ?? 1));
      const nextQuantity = Math.max(0, currentQuantity - 1);

      update = {
        quantity: nextQuantity,
        ...(nextQuantity === 0
          ? {
              status: "CONSUMED",
              consumed_at: new Date().toISOString(),
            }
          : {}),
      };

      activityType = "EATEN";
      pointsEarned = 10;
    }

    const { data, error } = await supabase
      .from("fridge_items")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    await logFridgeActivity(
      supabase,
      user.id,
      activityType,
      item.name,
      item.emoji ?? "🧊",
      pointsEarned
    );

    return NextResponse.json({
      success: true,
      item: data,
    });
  }

  const fields: Record<string, string> = {
    name: "name",
    emoji: "emoji",
    category: "category",
    shelfLocation: "shelf_location",
    quantity: "quantity",
    unit: "unit",
    expiryDate: "expiry_date",
    notes: "notes",
    calories: "calories",
    proteinG: "protein_g",
    allergens: "allergens",
    isVeg: "is_veg",
  };

  const update: Record<string, unknown> = {};

  for (const [key, column] of Object.entries(fields)) {
    if (body[key] !== undefined) {
      update[column] = body[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "No changes provided" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("fridge_items")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    item: data,
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  const { id: rawId } = await params;
  const id = Number(rawId);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Invalid item ID" },
      { status: 400 }
    );
  }

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
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!data?.length) {
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
