
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_RECIPES } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function ingredientMatches(
  stockName: string,
  requiredIngredient: string
): boolean {
  const required = normalize(requiredIngredient);
  const stock = normalize(stockName);

  if (stock === required) return true;

  const aliases: Record<string, string[]> = {
    "fresh juicy lemons": ["lemon", "lemons"],
    "fresh watermelon wedge": ["watermelon", "watermelons"],
    "crisp green apples": ["apple", "apples", "green apple"],
  };

  const acceptedNames = [
    required,
    ...(aliases[required] ?? []),
  ].map(normalize);

  return acceptedNames.includes(stock);
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

  let body: { recipeId?: number | string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const recipeId = Number(body.recipeId);

  if (
    !Number.isInteger(recipeId) ||
    recipeId < 1 ||
    recipeId > SAMPLE_RECIPES.length
  ) {
    return NextResponse.json(
      { error: "Invalid recipe ID" },
      { status: 400 }
    );
  }

  const recipe = SAMPLE_RECIPES[recipeId - 1];

  const { data: items, error: itemsError } = await supabase
    .from("fridge_items")
    .select("id, name, quantity, status")
    .eq("user_id", user.id)
    .eq("status", "IN_STOCK");

  if (itemsError) {
    return NextResponse.json(
      { error: itemsError.message },
      { status: 500 }
    );
  }

  const availableItems = (items ?? []).filter(
    (item) => Number(item.quantity ?? 0) > 0
  );

  const deductions: { id: string | number; quantity: number }[] = [];
  const usedItemIds = new Set<string>();

  for (const ingredient of recipe.requiredIngredients) {
    const match = availableItems.find(
      (item) =>
        !usedItemIds.has(String(item.id)) &&
        ingredientMatches(String(item.name), ingredient)
    );

    if (!match) {
      return NextResponse.json(
        {
          error: `Missing ingredient: ${ingredient}. No ingredients were changed.`,
        },
        { status: 400 }
      );
    }

    if (Number(match.quantity) < 1) {
      return NextResponse.json(
        {
          error: `Not enough quantity for ${match.name}.`,
        },
        { status: 400 }
      );
    }

    deductions.push({
      id: match.id,
      quantity: 1,
    });

    usedItemIds.add(String(match.id));
  }

  // Update each matched item in Supabase.
  for (const deduction of deductions) {
    const item = availableItems.find(
      (entry) => String(entry.id) === String(deduction.id)
    );

    if (!item) {
      return NextResponse.json(
        { error: "An ingredient could not be found. Refresh your fridge." },
        { status: 409 }
      );
    }

    const newQuantity = Number(item.quantity) - deduction.quantity;

    const update: Record<string, unknown> = {
      quantity: newQuantity,
    };

    if (newQuantity <= 0) {
      update.status = "CONSUMED";
      update.consumed_at = new Date().toISOString();
    }

    const { data: updated, error: updateError } = await supabase
      .from("fridge_items")
      .update(update)
      .eq("id", item.id)
      .eq("user_id", user.id)
      .eq("status", "IN_STOCK")
      .eq("quantity", item.quantity)
      .select("id");

    if (updateError) {
      console.error("Fridge deduction failed:", updateError.message);

      return NextResponse.json(
        { error: `Could not update ${item.name}: ${updateError.message}` },
        { status: 500 }
      );
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        {
          error: `Could not update ${item.name}. Refresh your fridge and try again.`,
        },
        { status: 409 }
      );
    }
  }

  const points = Math.max(30, deductions.length * 25);

  const { error: activityError } = await supabase
    .from("fridge_activity")
    .insert({
      user_id: user.id,
      action_type: "COOKED_MEAL",
      pal_name: recipe.title,
      pal_emoji: recipe.emoji,
      points_earned: points,
    });

  if (activityError) {
    console.error(
      "Failed to log cooking activity:",
      activityError.message
    );
  }

  return NextResponse.json({
    success: true,
    message: `Cooked ${recipe.title}!`,
    recipe: recipe.title,
    consumedCount: deductions.length,
    calories: recipe.calories,
    proteinG: recipe.proteinG,
    points,
  });
}
