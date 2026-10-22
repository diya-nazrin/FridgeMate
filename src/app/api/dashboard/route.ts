
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function daysUntil(dateValue: string | null): number | null {
  if (!dateValue) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${dateValue.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(expiry.getTime())) return null;

  return Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
}

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

  // Load this user's fridge items.
  const { data: fridgeItems, error: fridgeError } = await supabase
    .from("fridge_items")
    .select("*")
    .eq("user_id", user.id);

  if (fridgeError) {
    return NextResponse.json(
      { error: fridgeError.message },
      { status: 500 }
    );
  }

  // Load this user's profile.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: profileError.message },
      { status: 500 }
    );
  }

  // Load recent activity.
  const { data: activities, error: activityError } = await supabase
    .from("fridge_activity")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (activityError) {
    return NextResponse.json(
      { error: activityError.message },
      { status: 500 }
    );
  }

  const allItems = fridgeItems ?? [];
  const inStock = allItems.filter(
    (item) => item.status === "IN_STOCK" && Number(item.quantity) > 0
  );
  const consumed = allItems.filter((item) => item.status === "CONSUMED");
  const discarded = allItems.filter((item) => item.status === "DISCARDED");

  let freshCount = 0;
  let soonCount = 0;
  let expiredCount = 0;
  let fridgeCalorieBank = 0;

  const categoryMap: Record<string, number> = {};
  const shelfMap: Record<string, number> = {};

  for (const item of inStock) {
    const days = daysUntil(item.expiry_date);

    if (days === null || days > 3) {
      freshCount++;
    } else if (days >= 0) {
      soonCount++;
    } else {
      expiredCount++;
    }

    const category = item.category || "other";
    categoryMap[category] = (categoryMap[category] || 0) + 1;

    const shelf = item.shelf_location || "unspecified";
    shelfMap[shelf] = (shelfMap[shelf] || 0) + 1;

    fridgeCalorieBank +=
      Number(item.calories || 0) * Number(item.quantity || 0);
  }

  // Estimate nutrition from consumed items recorded today.
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let caloriesToday = 0;
  let proteinToday = 0;

  for (const item of consumed) {
    const consumedAt = item.consumed_at
      ? new Date(item.consumed_at)
      : null;

    if (consumedAt && consumedAt >= todayStart) {
      caloriesToday +=
        Number(item.calories || 0) * Math.max(1, Number(item.quantity || 1));
      proteinToday +=
        Number(item.protein_g || 0) * Math.max(1, Number(item.quantity || 1));
    }
  }

  const calorieTarget = Number(profile?.daily_calorie_target || 1800);
  const proteinTarget = Number(profile?.daily_protein_target || 90);
  const heightCm = profile?.height_cm ? Number(profile.height_cm) : null;
  const weightKg = profile?.weight_kg ? Number(profile.weight_kg) : null;
  const age = profile?.age ? Number(profile.age) : null;

  const bmi =
    heightCm && weightKg
      ? Math.round((weightKg / (heightCm / 100) ** 2) * 10) / 10
      : null;

  let bmiLabel: string | null = null;
  if (bmi !== null) {
    bmiLabel =
      bmi < 18.5
        ? "Underweight"
        : bmi < 25
          ? "Normal range"
          : bmi < 30
            ? "Overweight"
            : "Obesity range";
  }

  const gender = String(profile?.gender || "").toLowerCase();
  const bmr =
    heightCm && weightKg && age
      ? Math.round(
          10 * weightKg +
            6.25 * heightCm -
            5 * age +
            (gender === "male" ? 5 : gender === "female" ? -161 : -78)
        )
      : null;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  };

  const tdee = bmr
    ? Math.round(
        bmr *
          (activityMultipliers[profile?.activity_level] || 1.2)
      )
    : null;

  const totalResolved = consumed.length + discarded.length;
  const wasteSaveRate =
    totalResolved > 0
      ? Math.round((consumed.length / totalResolved) * 100)
      : 0;

  const activityRows = activities ?? [];
  const totalPoints = activityRows.reduce(
    (sum, activity) => sum + Number(activity.points_earned || 0),
    0
  );

  return NextResponse.json({
    totalInStock: inStock.length,
    soonCount,
    freshCount,
    expiredCount,
    consumedCount: consumed.length,
    discardedCount: discarded.length,
    wasteSaveRate,
    moneySaved: (consumed.length * 4.25).toFixed(2),
    totalPoints,
    categoryMap,
    shelfMap,
    activities: activityRows.map((activity) => ({
      id: activity.id,
      actionType: activity.action_type,
      palName: activity.pal_name,
      palEmoji: activity.pal_emoji,
      pointsEarned: Number(activity.points_earned || 0),
      createdAt: activity.created_at,
    })),
    streakDays: 0,
    userName: profile?.name || user.user_metadata?.name || "",
    nutrition: {
      caloriesToday,
      proteinToday,
      calorieTarget,
      proteinTarget,
      remainingCalories: calorieTarget - caloriesToday,
      remainingProtein: proteinTarget - proteinToday,
      fridgeCalorieBank,
      bmi,
      bmiLabel,
      bmr,
      tdee,
      goal: profile?.goal || "maintenance",
      dietType: profile?.diet_type || "veg",
      allergies: Array.isArray(profile?.allergies)
        ? profile.allergies
        : [],
      dietPlans: Array.isArray(profile?.diet_plans)
        ? profile.diet_plans
        : [],
      waterTargetMl: Number(profile?.water_target_ml || 2000),
      heightCm,
      weightKg,
      age,
    },
  });
}
