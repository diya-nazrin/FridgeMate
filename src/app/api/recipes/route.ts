
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SAMPLE_RECIPES } from "@/lib/seed-data";
import { isRecipeSafeForDiet, allergenConflicts } from "@/lib/nutrition";

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

  const [
    { data: items, error: itemsError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase
      .from("fridge_items")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "IN_STOCK"),
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (itemsError || profileError) {
    return NextResponse.json(
      { error: itemsError?.message ?? profileError?.message },
      { status: 500 }
    );
  }

  const stockNames = (items ?? [])
    .filter((item) => Number(item.quantity ?? 0) > 0)
    .map((item) => String(item.name).toLowerCase());

  const allergies = Array.isArray(profile?.allergies)
    ? profile.allergies
    : [];

  const dietType = profile?.diet_type ?? "veg";
  const dietPlans = Array.isArray(profile?.diet_plans)
    ? profile.diet_plans
    : [];
  const calorieTarget = Number(profile?.daily_calorie_target ?? 1800);

  const recipes = SAMPLE_RECIPES.map((recipe, index) => {
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];

    for (const ingredient of recipe.requiredIngredients) {
      const normalize = (value: string) =>
        value
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .replace(/\s+/g, " ")
          .trim();

      const requiredName = normalize(ingredient);

      const aliases: Record<string, string[]> = {
        "fresh juicy lemons": ["lemon", "lemons"],
        "fresh watermelon wedge": ["watermelon", "watermelons"],
        "crisp green apples": ["apple", "apples", "green apple"],
      };

      const acceptedNames = [
        requiredName,
        ...(aliases[requiredName] ?? []),
      ].map(normalize);

      const found = stockNames.some((stock) => {
        const stockName = normalize(stock);

        return acceptedNames.includes(stockName);
      });

      (found ? matchedIngredients : missingIngredients).push(ingredient);
    }

    const matchScore = Math.round(
      (matchedIngredients.length /
        Math.max(1, recipe.requiredIngredients.length)) *
        100
    );

    const dietCheck = isRecipeSafeForDiet(
      [...recipe.requiredIngredients, recipe.title].join(" "),
      dietType
    );

    const conflicts = allergenConflicts(
      [],
      allergies
    );

    const fitsCalories =
      recipe.calories <= Math.max(300, calorieTarget * 0.45);

    const highProtein =
      dietPlans.includes("high_protein") && recipe.proteinG >= 25;

    const lowCarb =
      (dietPlans.includes("low_carb") || dietPlans.includes("keto")) &&
      recipe.carbsG <= 25;

    const reasons: string[] = [];
    if (!dietCheck.ok) {
      reasons.push(dietCheck.reason || "not diet friendly");
    }
    if (conflicts.length > 0) {
      reasons.push(`contains ${conflicts.join(", ")}`);
    }

    return {
      ...recipe,
      id: index + 1,
      matchedIngredients,
      missingIngredients,
      matchScore,
      dietSafe: dietCheck.ok,
      allergenConflicts: conflicts,
      blockReasons: reasons,
      fitsCalories,
      highProtein,
      lowCarb,
    };
  });

  return NextResponse.json({
    debugStockNames: stockNames,
    recipes,
  });
}
