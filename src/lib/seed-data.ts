import { detectAllergens, containsMeat } from "@/lib/nutrition";

// Client-safe sample catalogue. Every new account gets its own copy of these
// fridge pals so the 3D fridge is full the moment onboarding finishes.

export interface SampleItem {
  name: string;
  emoji: string;
  category: string;
  shelfLocation: string;
  quantity: number;
  unit: string;
  expiryDays: number;
  calories: number; // per single unit
  proteinG: number;
  notes: string;
}

export const SAMPLE_ITEMS: SampleItem[] = [
  // ---- Top shelf: dairy & breakfast ----
  { name: "Fresh Whole Milk", emoji: "🥛", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "bottle", expiryDays: 2, calories: 150, proteinG: 8, notes: "Organic 3.8% farm milk" },
  { name: "Greek Yogurt Tub", emoji: "🥣", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "tub", expiryDays: 5, calories: 130, proteinG: 17, notes: "Honey vanilla flavour" },
  { name: "Aged Cheddar Block", emoji: "🧀", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "block", expiryDays: 14, calories: 115, proteinG: 7, notes: "Sharp & creamy" },
  { name: "French Salted Butter", emoji: "🧈", category: "dairy", shelfLocation: "top_shelf", quantity: 1, unit: "block", expiryDays: 30, calories: 102, proteinG: 0, notes: "For morning toast" },

  // ---- Middle shelf: leftovers & protein ----
  { name: "Leftover Pad Thai", emoji: "🥡", category: "leftovers", shelfLocation: "mid_shelf", quantity: 1, unit: "box", expiryDays: 1, calories: 520, proteinG: 22, notes: "Extra lime & peanuts inside" },
  { name: "Organic Firm Tofu", emoji: "🍢", category: "protein", shelfLocation: "mid_shelf", quantity: 2, unit: "packs", expiryDays: 7, calories: 145, proteinG: 17, notes: "Great for a quick stir fry" },
  { name: "Strawberry Cream Cake", emoji: "🍰", category: "bakery", shelfLocation: "mid_shelf", quantity: 1, unit: "slice", expiryDays: 2, calories: 340, proteinG: 4, notes: "Sweet afternoon treat" },
  { name: "Hummus Dip Cup", emoji: "🫓", category: "snacks", shelfLocation: "mid_shelf", quantity: 1, unit: "tub", expiryDays: 6, calories: 70, proteinG: 2, notes: "Roasted garlic flavour" },
  { name: "Grilled Chicken Breast", emoji: "🍗", category: "protein", shelfLocation: "mid_shelf", quantity: 2, unit: "fillets", expiryDays: 3, calories: 165, proteinG: 31, notes: "Meal-prepped, high protein" },

  // ---- Bottom shelf: drinks & heavy goods ----
  { name: "Sparkling Peach Soda", emoji: "🍑", category: "drinks", shelfLocation: "bottom_shelf", quantity: 3, unit: "cans", expiryDays: 45, calories: 140, proteinG: 0, notes: "Chilled peach bubbles" },
  { name: "Barista Oat Milk", emoji: "🌾", category: "dairy", shelfLocation: "bottom_shelf", quantity: 1, unit: "carton", expiryDays: 8, calories: 120, proteinG: 3, notes: "Foams nicely for matcha lattes" },
  { name: "Fresh Watermelon Wedge", emoji: "🍉", category: "produce", shelfLocation: "bottom_shelf", quantity: 1, unit: "wedge", expiryDays: 3, calories: 86, proteinG: 2, notes: "Sweet and juicy" },

  // ---- Crisper: vegetables ----
  { name: "Crisp Broccoli Crown", emoji: "🥦", category: "produce", shelfLocation: "crisper_veggie", quantity: 1, unit: "head", expiryDays: 4, calories: 55, proteinG: 4, notes: "Steam with garlic & sesame" },
  { name: "Crunchy Baby Carrots", emoji: "🥕", category: "produce", shelfLocation: "crisper_veggie", quantity: 1, unit: "bag", expiryDays: 10, calories: 35, proteinG: 1, notes: "Sweet & snackable" },
  { name: "Tender Baby Spinach", emoji: "🥬", category: "produce", shelfLocation: "crisper_veggie", quantity: 1, unit: "box", expiryDays: 2, calories: 23, proteinG: 3, notes: "Wash before eating" },
  { name: "Japanese Cucumbers", emoji: "🥒", category: "produce", shelfLocation: "crisper_veggie", quantity: 3, unit: "pcs", expiryDays: 6, calories: 16, proteinG: 1, notes: "Super crunchy" },

  // ---- Crisper: fruit ----
  { name: "Sweet Strawberries", emoji: "🍓", category: "produce", shelfLocation: "crisper_fruit", quantity: 1, unit: "punnet", expiryDays: 2, calories: 49, proteinG: 1, notes: "Eat soon before they soften!" },
  { name: "Blueberry Basket", emoji: "🫐", category: "produce", shelfLocation: "crisper_fruit", quantity: 1, unit: "pack", expiryDays: 5, calories: 84, proteinG: 1, notes: "Sweet plump berries" },
  { name: "Crisp Green Apples", emoji: "🍏", category: "produce", shelfLocation: "crisper_fruit", quantity: 4, unit: "pcs", expiryDays: 18, calories: 95, proteinG: 0, notes: "Granny Smith, tart & crunchy" },
  { name: "Fresh Juicy Lemons", emoji: "🍋", category: "produce", shelfLocation: "crisper_fruit", quantity: 2, unit: "pcs", expiryDays: 12, calories: 17, proteinG: 1, notes: "For lemon water & dressings" },

  // ---- Door racks ----
  { name: "Farm Fresh Eggs (6-pack)", emoji: "🥚", category: "protein", shelfLocation: "door_shelf_top", quantity: 6, unit: "eggs", expiryDays: 16, calories: 78, proteinG: 6, notes: "Pasture raised happy hens" },
  { name: "Sriracha Hot Sauce", emoji: "🌶️", category: "condiments", shelfLocation: "door_shelf_top", quantity: 1, unit: "bottle", expiryDays: 120, calories: 5, proteinG: 0, notes: "Spicy kick" },
  { name: "Japanese Kewpie Mayo", emoji: "🥫", category: "condiments", shelfLocation: "door_shelf_top", quantity: 1, unit: "bottle", expiryDays: 90, calories: 100, proteinG: 0, notes: "Rich & tangy" },
  { name: "Iced Ceremonial Matcha", emoji: "🍵", category: "drinks", shelfLocation: "door_shelf_bottom", quantity: 1, unit: "bottle", expiryDays: 4, calories: 90, proteinG: 3, notes: "Freshly whisked cold matcha" },
  { name: "Fresh Squeezed Orange Juice", emoji: "🍊", category: "drinks", shelfLocation: "door_shelf_bottom", quantity: 1, unit: "bottle", expiryDays: 3, calories: 112, proteinG: 2, notes: "With bits of pulp" },

  // ---- Freezer ----
  { name: "Matcha Mochi Ice Cream", emoji: "🍨", category: "frozen", shelfLocation: "freezer", quantity: 1, unit: "box", expiryDays: 90, calories: 210, proteinG: 3, notes: "Chewy and creamy" },
  { name: "Pork & Chive Gyoza", emoji: "🥟", category: "frozen", shelfLocation: "freezer", quantity: 1, unit: "bag", expiryDays: 60, calories: 330, proteinG: 14, notes: "Pan-fry for 6 minutes" },
  { name: "Frozen Wild Berries", emoji: "🫐", category: "frozen", shelfLocation: "freezer", quantity: 1, unit: "bag", expiryDays: 180, calories: 80, proteinG: 1, notes: "For breakfast smoothies" },
];

export const SAMPLE_GROCERIES = [
  { name: "Avocados (3 pack)", emoji: "🥑", category: "produce", quantity: 3, unit: "pcs", isBought: false },
  { name: "Sourdough Bread", emoji: "🍞", category: "bakery", quantity: 1, unit: "loaf", isBought: false },
  { name: "Cold Brew Concentrate", emoji: "☕", category: "drinks", quantity: 1, unit: "bottle", isBought: true },
  { name: "Dark Chocolate 70%", emoji: "🍫", category: "snacks", quantity: 2, unit: "bars", isBought: false },
];

export interface SampleRecipe {
  title: string;
  emoji: string;
  description: string;
  prepTime: string;
  difficulty: string;
  tags: string[];
  requiredIngredients: string[];
  instructions: string[];
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const SAMPLE_RECIPES: SampleRecipe[] = [
  {
    title: "Fluffy Strawberry Pancakes",
    emoji: "🥞",
    description: "Golden fluffy pancakes crowned with fresh strawberries and a honey yogurt swirl.",
    prepTime: "15 mins",
    difficulty: "Easy",
    tags: ["Breakfast", "Eat Me Soon ⚠️", "Sweet"],
    requiredIngredients: ["Fresh Whole Milk", "Sweet Strawberries", "Farm Fresh Eggs (6-pack)", "French Salted Butter"],
    instructions: [
      "Whisk together eggs, milk and melted butter in a cute bowl.",
      "Fold in flour and a pinch of sugar until just combined.",
      "Cook in a buttered skillet until golden bubbles form, then flip.",
      "Top with sliced strawberries and a dollop of Greek yogurt.",
    ],
    calories: 430,
    proteinG: 16,
    carbsG: 58,
    fatG: 15,
  },
  {
    title: "Crispy Garlic Tofu & Broccoli Stir-Fry",
    emoji: "🥢",
    description: "Sizzling golden tofu tossed with crisp broccoli in a spicy sriracha glaze.",
    prepTime: "20 mins",
    difficulty: "Easy",
    tags: ["Dinner", "High Protein", "Quick", "Vegan"],
    requiredIngredients: ["Organic Firm Tofu", "Crisp Broccoli Crown", "Sriracha Hot Sauce", "Japanese Cucumbers"],
    instructions: [
      "Press and cube the tofu, then sear until every side is golden crisp.",
      "Toss in broccoli florets with a splash of water and cover for 2 minutes.",
      "Drizzle with sriracha, soy sauce and a squeeze of lemon.",
      "Serve warm with refreshing cucumber slices on the side.",
    ],
    calories: 320,
    proteinG: 26,
    carbsG: 22,
    fatG: 14,
  },
  {
    title: "Creamy Spinach Cheddar Omelet",
    emoji: "🍳",
    description: "Silky French-style folded eggs with wilted baby spinach and melting aged cheddar.",
    prepTime: "10 mins",
    difficulty: "Super Easy",
    tags: ["Breakfast", "Eat Me Soon ⚠️", "Low Carb", "High Protein"],
    requiredIngredients: ["Farm Fresh Eggs (6-pack)", "Tender Baby Spinach", "Aged Cheddar Block", "French Salted Butter"],
    instructions: [
      "Melt a pat of salted butter in a pan over low-medium heat.",
      "Wilt the baby spinach for 45 seconds and set aside.",
      "Beat 2-3 eggs until bubbly, pour in and gently swirl.",
      "Sprinkle with cheddar and spinach, fold gently and slide onto a plate.",
    ],
    calories: 290,
    proteinG: 24,
    carbsG: 5,
    fatG: 20,
  },
  {
    title: "Chilled Berry Smoothie Bowl",
    emoji: "🥣",
    description: "Thick frosty antioxidant bowl of blended wild berries, oat milk and yogurt.",
    prepTime: "5 mins",
    difficulty: "Super Easy",
    tags: ["Snack", "Vegan", "Refreshing", "Low Carb"],
    requiredIngredients: ["Frozen Wild Berries", "Greek Yogurt Tub", "Barista Oat Milk", "Blueberry Basket"],
    instructions: [
      "Add frozen berries, a big scoop of yogurt and a splash of oat milk to a blender.",
      "Blend on high until smooth and frosty like soft-serve.",
      "Scoop into a chilled bowl and garnish with fresh blueberries and apple slices.",
    ],
    calories: 260,
    proteinG: 14,
    carbsG: 42,
    fatG: 5,
  },
  {
    title: "High-Protein Chicken & Spinach Plate",
    emoji: "🍗",
    description: "Juicy seared chicken breast over wilted spinach with lemon and crunchy carrots.",
    prepTime: "25 mins",
    difficulty: "Easy",
    tags: ["Dinner", "High Protein", "Low Carb", "Meal Prep"],
    requiredIngredients: ["Grilled Chicken Breast", "Tender Baby Spinach", "Fresh Juicy Lemons", "Crunchy Baby Carrots"],
    instructions: [
      "Season the chicken and sear 5 minutes per side until golden.",
      "Rest for 3 minutes, then slice against the grain.",
      "Wilt the spinach in the same pan with lemon juice.",
      "Plate with raw carrot sticks for crunch.",
    ],
    calories: 340,
    proteinG: 46,
    carbsG: 12,
    fatG: 10,
  },
  {
    title: "Watermelon Feta Cooler Bowl",
    emoji: "🍉",
    description: "Chilled watermelon cubes with mint, lemon and a light sprinkle of cheese.",
    prepTime: "8 mins",
    difficulty: "Super Easy",
    tags: ["Snack", "Refreshing", "Low Carb", "Summer"],
    requiredIngredients: ["Fresh Watermelon Wedge", "Fresh Juicy Lemons", "Aged Cheddar Block"],
    instructions: [
      "Cube the watermelon and chill for 10 minutes.",
      "Squeeze fresh lemon over the top.",
      "Finish with crumbled cheese and a pinch of salt.",
    ],
    calories: 150,
    proteinG: 6,
    carbsG: 18,
    fatG: 6,
  },
];

/** Converts a raw item name into structured allergy + veg metadata. */
export function deriveItemMeta(name: string) {
  return {
    allergens: detectAllergens(name),
    isVeg: containsMeat(name) === "none",
  };
}
