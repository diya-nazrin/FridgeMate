// ============================================================
// fridgemate Nutrition Engine
// Client-safe: pure math + helpers, no server/db imports.
// Uses the Mifflin-St Jeor equation (the clinical gold standard
// for BMR) and activity multipliers to derive a TDEE, then nudges
// it up or down depending on the user's chosen goal.
// ============================================================

export type DietType = "veg" | "nonveg" | "eggetarian" | "pescatarian" | "vegan";
export type Goal = "deficit" | "maintenance" | "surplus";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";

export const ALLERGY_OPTIONS = [
  { id: "dairy", label: "Dairy", emoji: "🥛" },
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "nuts", label: "Nuts", emoji: "🥜" },
  { id: "eggs", label: "Eggs", emoji: "🥚" },
  { id: "soy", label: "Soy", emoji: "🫘" },
  { id: "shellfish", label: "Shellfish", emoji: "🦐" },
  { id: "fish", label: "Fish", emoji: "🐟" },
  { id: "sesame", label: "Sesame", emoji: "🫓" },
];

export const DIET_TYPES: Array<{ id: DietType; label: string; emoji: string; blurb: string }> = [
  { id: "veg", label: "Vegetarian", emoji: "🥦", blurb: "no meat, dairy + eggs ok" },
  { id: "nonveg", label: "Non-Vegetarian", emoji: "🍗", blurb: "everything on the menu" },
  { id: "vegan", label: "Vegan", emoji: "🌱", blurb: "100% plant powered" },
  { id: "eggetarian", label: "Eggetarian", emoji: "🥚", blurb: "veg + eggs, no dairy/meat" },
  { id: "pescatarian", label: "Pescatarian", emoji: "🐟", blurb: "fish is fine, no other meat" },
];

export const DIET_PLAN_OPTIONS = [
  { id: "high_protein", label: "High Protein", emoji: "💪", blurb: "prioritise 30g+ protein meals" },
  { id: "low_carb", label: "Low Carb", emoji: "🥑", blurb: "keep carbs under 40% of intake" },
  { id: "keto", label: "Keto", emoji: "🥓", blurb: "very low carb, high fat" },
  { id: "mediterranean", label: "Mediterranean", emoji: "🫒", blurb: "olive oil, fish, whole grains" },
  { id: "intermittent_fasting", label: "Intermittent Fasting", emoji: "⏰", blurb: "16:8 eating window" },
  { id: "balanced", label: "Balanced", emoji: "⚖️", blurb: "no restrictions, just variety" },
];

export const ACTIVITY_LEVELS: Array<{ id: ActivityLevel; label: string; emoji: string; factor: number }> = [
  { id: "sedentary", label: "Mostly Sitting", emoji: "🛋️", factor: 1.2 },
  { id: "light", label: "Lightly Active", emoji: "🚶", factor: 1.375 },
  { id: "moderate", label: "Moderately Active", emoji: "🏃", factor: 1.55 },
  { id: "active", label: "Very Active", emoji: "🏋️", factor: 1.725 },
  { id: "athlete", label: "Athlete", emoji: "🥇", factor: 1.9 },
];

export const GOAL_OPTIONS: Array<{
  id: Goal;
  label: string;
  emoji: string;
  blurb: string;
  offset: number;
}> = [
  { id: "deficit", label: "Calorie Deficit", emoji: "📉", blurb: "lose ~0.5 kg / week", offset: -450 },
  { id: "maintenance", label: "Maintenance", emoji: "⚖️", blurb: "hold steady & stay nourished", offset: 0 },
  { id: "surplus", label: "Calorie Surplus", emoji: "📈", blurb: "build muscle, gain weight", offset: 350 },
];

const DEFAULT_ACTIVITY_FACTOR = 1.375;

/** Mifflin-St Jeor: BMR in kcal/day */
export function calcBMR(weightKg: number, heightCm: number, age: number, gender: string): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return Math.round(base + 5);
  if (gender === "female") return Math.round(base - 161);
  return Math.round(base - 78); // average of the two for 'other'
}

export function activityFactor(level: string): number {
  const found = ACTIVITY_LEVELS.find((a) => a.id === level);
  return found ? found.factor : DEFAULT_ACTIVITY_FACTOR;
}

export function calcTDEE(bmr: number, level: string): number {
  return Math.round(bmr * activityFactor(level));
}

export function calcCalorieTarget(tdee: number, goal: string): number {
  const found = GOAL_OPTIONS.find((g) => g.id === goal);
  const offset = found ? found.offset : 0;
  // Never prescribe below a safe floor.
  return Math.max(1200, tdee + offset);
}

/** Protein target in grams — higher when cutting or chasing gains. */
export function calcProteinTarget(weightKg: number, goal: string, plans: string[]): number {
  let perKg = 1.4;
  if (goal === "deficit") perKg = 1.8;
  if (goal === "surplus") perKg = 2.0;
  if (plans.includes("high_protein") || plans.includes("keto")) perKg += 0.4;
  return Math.round(weightKg * perKg);
}

/** Daily hydration suggestion scaled to body weight + activity. */
export function calcWaterTarget(weightKg: number, level: string): number {
  const base = weightKg * 33; // ml per kg baseline
  const extra = (activityFactor(level) - 1.2) * 900;
  return Math.round(Math.max(1600, base + extra) / 50) * 50;
}

export function calcBMI(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiLabel(bmi: number): string {
  if (bmi <= 0) return "unknown";
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy range";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function bmiColor(bmi: number): string {
  if (bmi <= 0) return "#8FD9C4";
  if (bmi < 18.5) return "#A3C9FF";
  if (bmi < 25) return "#51CF66";
  if (bmi < 30) return "#FFA94D";
  return "#FF6B6B";
}

export interface NutritionSummary {
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  waterTargetMl: number;
}

export function summariseNutrition(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: string;
  activityLevel: string;
  goal: string;
  dietPlans: string[];
}): NutritionSummary {
  const bmr = calcBMR(input.weightKg, input.heightCm, input.age, input.gender);
  const tdee = calcTDEE(bmr, input.activityLevel);
  const bmi = calcBMI(input.weightKg, input.heightCm);
  return {
    bmi,
    bmiLabel: bmiLabel(bmi),
    bmr,
    tdee,
    dailyCalorieTarget: calcCalorieTarget(tdee, input.goal),
    dailyProteinTarget: calcProteinTarget(input.weightKg, input.goal, input.dietPlans),
    waterTargetMl: calcWaterTarget(input.weightKg, input.activityLevel),
  };
}

/**
 * Detects allergens present in a free-text ingredient / item name.
 * Used to badge fridge pals and veto recipes for allergic users.
 */
export function detectAllergens(text: string): string[] {
  const t = ` ${text.toLowerCase()} `;
  const hits: string[] = [];

  if (/milk|yogurt|yoghurt|cheese|butter|cream|cheddar|mozzarella|paneer|ghee|kefir|latte/.test(t))
    hits.push("dairy");
  if (/bread|noodle|pasta|wheat|flour|bagel|cracker|bun|dough|cereal|soy sauce/.test(t))
    hits.push("gluten");
  if (/nut|peanut|almond|cashew|walnut|pistachio|hazelnut|pecan|macadamia/.test(t)) hits.push("nuts");
  if (/\begg|mayo|mayonnaise|kewpie/.test(t)) hits.push("eggs");
  if (/tofu|soy|edamame|tempeh|miso/.test(t)) hits.push("soy");
  if (/shrimp|prawn|crab|lobster|shellfish|scallop|clam|mussel/.test(t)) hits.push("shellfish");
  if (/\bfish|salmon|tuna|anchov|sardine|cod\b/.test(t)) hits.push("fish");
  if (/sesame|tahini/.test(t)) hits.push("sesame");

  return hits;
}

/** Meat detection so veg/vegan users never get recommended a chicken dish. */
export function containsMeat(text: string): "meat" | "fish" | "none" {
  const t = ` ${text.toLowerCase()} `;
  if (/chicken|beef|pork|mutton|lamb|bacon|ham|sausage|turkey|prosciutto|chorizo|gyoza/.test(t))
    return "meat";
  if (/shrimp|prawn|crab|lobster|salmon|tuna|\bfish|anchov|sardine|scallop/.test(t)) return "fish";
  return "none";
}

export function isRecipeSafeForDiet(
  ingredientText: string,
  dietType: string
): { ok: boolean; reason?: string } {
  const meat = containsMeat(ingredientText);
  if (dietType === "veg" || dietType === "vegan" || dietType === "eggetarian") {
    if (meat === "meat") return { ok: false, reason: "contains meat" };
    if (meat === "fish") return { ok: false, reason: "contains fish" };
  }
  if (dietType === "pescatarian" && meat === "meat") {
    return { ok: false, reason: "contains meat" };
  }
  if (dietType === "vegan" && /milk|cheese|butter|cream|yogurt|egg|ghee|paneer|mayo/.test(ingredientText.toLowerCase())) {
    return { ok: false, reason: "contains dairy or eggs" };
  }
  return { ok: true };
}

export function allergenConflicts(itemAllergens: string[], userAllergies: string[]): string[] {
  return itemAllergens.filter((a) => userAllergies.includes(a));
}

/** Turns a goal + plan set into an actionable nudge shown on the home page. */
export function personalisedTip(goal: string, plans: string[], remaining: number): string {
  const planSet = new Set(plans);
  if (goal === "deficit") {
    if (remaining < 0) return `You're ${Math.abs(remaining)} kcal over budget today — a light veggie dinner would balance it out 🌿`;
    if (remaining < 300) return `Only ${remaining} kcal left today. Try the spinach omelet — light and filling 🍳`;
    if (planSet.has("intermittent_fasting")) return `Fasting window tip: keep dinner under ${remaining} kcal and finish eating by 8pm ⏰`;
    return `You've still got ${remaining} kcal to enjoy today — protein-first plates keep you full longer 💪`;
  }
  if (goal === "surplus") {
    return `Add ${Math.max(0, remaining)} kcal today: nut butter, olive oil and full-fat dairy are easy wins 🥑`;
  }
  return `Aim for roughly ${Math.max(0, remaining)} more kcal today to stay nourished and energised ⚖️`;
}
