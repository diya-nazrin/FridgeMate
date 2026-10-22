  // ============================================================
// fridgemate — pure client-side data layer
// ------------------------------------------------------------
// The whole app runs in the browser. There is no server, no
// database, and no network calls. Everything below persists to
// localStorage and is served through a tiny in-memory router that
// intercepts the app's own `/api/*` requests.
//
// SECURITY NOTE: passwords here are salted + SHA-256 hashed purely
// so that plaintext never sits in storage. This is *obfuscation, not
// security* — anyone with access to the browser can read or reset
// this data. Fine for a personal/demo tool; never for real accounts.
// ============================================================

import { SAMPLE_ITEMS, SAMPLE_GROCERIES, SAMPLE_RECIPES, deriveItemMeta } from "./seed-data";
import {
  detectAllergens,
  containsMeat,
  allergenConflicts,
  isRecipeSafeForDiet,
  summariseNutrition,
} from "./nutrition";
import { formatDaysUntil } from "./date-utils";

const NS = "fridgemate.v1";
const nativeFetch = typeof window !== "undefined" ? window.fetch.bind(window) : undefined;

// ----------------------------- types -----------------------------

interface StoredUser {
  id: number;
  name: string;
  email: string;
  salt: string;
  hash: string;
  createdAt: string;
}

interface StoredProfile {
  age: number;
  gender: string;
  heightCm: number;
  weightKg: number;
  activityLevel: string;
  allergies: string[];
  dietType: string;
  dietPlans: string[];
  goal: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  waterTargetMl: number;
  onboardingComplete: boolean;
}

interface StoredItem {
  id: number;
  userId: number;
  name: string;
  emoji: string;
  category: string;
  shelfLocation: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  status: "IN_STOCK" | "CONSUMED" | "DISCARDED";
  calories: number;
  proteinG: number;
  allergens: string[];
  isVeg: boolean;
  notes: string | null;
  addedAt: string;
  consumedAt: string | null;
}

interface StoredGrocery {
  id: number;
  userId: number;
  name: string;
  emoji: string;
  category: string;
  quantity: number;
  unit: string;
  isBought: boolean;
  createdAt: string;
}

interface StoredActivity {
  id: number;
  userId: number;
  actionType: string;
  palName: string;
  palEmoji: string;
  pointsEarned: number;
  createdAt: string;
}

interface Db {
  users: StoredUser[];
  profiles: Record<number, StoredProfile>;
  items: StoredItem[];
  groceries: StoredGrocery[];
  recipes: ReturnType<typeof buildRecipes>;
  activity: StoredActivity[];
  seq: number;
}

// --------------------------- storage I/O ---------------------------

function emptyDb(): Db {
  return {
    users: [],
    profiles: {},
    items: [],
    groceries: [],
    recipes: buildRecipes(),
    activity: [],
    seq: 1,
  };
}

function load(): Db {
  if (typeof window === "undefined") return emptyDb();
  try {
    const raw = window.localStorage.getItem(NS);
    if (!raw) return emptyDb();
    const parsed = JSON.parse(raw) as Partial<Db>;
    const base = emptyDb();
    return {
      ...base,
      ...parsed,
      // Recipes are code, not user data — always take the latest definitions
      // so nutrition values stay correct after an app update.
      recipes: base.recipes,
    };
  } catch {
    return emptyDb();
  }
}

function save(db: Db): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(NS, JSON.stringify(db));
  } catch {
    // Storage full or blocked (private mode) — app still works in-memory.
  }
}

function nextId(db: Db): number {
  db.seq += 1;
  return db.seq;
}

// --------------------------- session ---------------------------
// "Keep me signed in" ticked  -> localStorage, survives a browser restart.
// Unticked                     -> sessionStorage, cleared when the tab closes.

const SESSION_KEY = `${NS}.session`;

function getSessionId(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
    const id = raw ? Number(raw) : null;
    return id && Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

function setSession(userId: number | null, remember: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_KEY);
    window.sessionStorage.removeItem(SESSION_KEY);
    if (userId === null) return;
    const store = remember ? window.localStorage : window.sessionStorage;
    store.setItem(SESSION_KEY, String(userId));
  } catch {
    // Ignore storage failures; the session simply won't persist.
  }
}

// ----------------------------- seeding -----------------------------

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function buildRecipes() {
  return SAMPLE_RECIPES.map((r, i) => ({
    id: i + 1,
    title: r.title,
    emoji: r.emoji,
    description: r.description,
    prepTime: r.prepTime,
    difficulty: r.difficulty,
    tags: r.tags,
    requiredIngredients: r.requiredIngredients,
    instructions: r.instructions,
    calories: r.calories,
    proteinG: r.proteinG,
    carbsG: r.carbsG,
    fatG: r.fatG,
    allergens: detectAllergens([...r.requiredIngredients, r.title].join(" ")),
    isVeg: containsMeat([...r.requiredIngredients, r.title].join(" ")) === "none",
  }));
}

/** Gives a brand-new account a lively, full fridge to explore. */
function seedUserFridge(db: Db, userId: number): void {
  const now = new Date().toISOString();
  for (const i of SAMPLE_ITEMS) {
    const meta = deriveItemMeta(i.name);
    db.items.push({
      id: nextId(db),
      userId,
      name: i.name,
      emoji: i.emoji,
      category: i.category,
      shelfLocation: i.shelfLocation,
      quantity: i.quantity,
      unit: i.unit,
      expiryDate: daysFromNow(i.expiryDays),
      status: "IN_STOCK",
      calories: i.calories,
      proteinG: i.proteinG,
      allergens: meta.allergens,
      isVeg: meta.isVeg,
      notes: i.notes,
      addedAt: now,
      consumedAt: null,
    });
  }
  for (const g of SAMPLE_GROCERIES) {
    db.groceries.push({
      id: nextId(db),
      userId,
      name: g.name,
      emoji: g.emoji,
      category: g.category,
      quantity: g.quantity,
      unit: g.unit,
      isBought: g.isBought,
      createdAt: now,
    });
  }
  db.activity.push({
    id: nextId(db),
    userId,
    actionType: "RESTOCKED",
    palName: "Welcome starter fridge",
    palEmoji: "🧊",
    pointsEarned: 60,
    createdAt: now,
  });
}

// ------------------------------ auth ------------------------------

function randomSalt(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Salted SHA-256 via Web Crypto, with a synchronous fallback for
 * environments where `crypto.subtle` is unavailable (non-secure origins).
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const input = `${salt}:${password}`;
  const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;
  if (subtle) {
    const buf = await subtle.digest("SHA-256", new TextEncoder().encode(input));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Non-cryptographic fallback — keeps the app usable, clearly not secure.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv${h.toString(16)}`;
}

function defaultProfile(): StoredProfile {
  return {
    age: 24,
    gender: "female",
    heightCm: 165,
    weightKg: 60,
    activityLevel: "light",
    allergies: [],
    dietType: "veg",
    dietPlans: [],
    goal: "deficit",
    dailyCalorieTarget: 1800,
    dailyProteinTarget: 90,
    waterTargetMl: 2000,
    onboardingComplete: false,
  };
}

// ---------------------------- utilities ----------------------------

function deriveTargets(p: StoredProfile) {
  return summariseNutrition({
    weightKg: p.weightKg,
    heightCm: p.heightCm,
    age: p.age,
    gender: p.gender,
    activityLevel: p.activityLevel,
    goal: p.goal,
    dietPlans: p.dietPlans,
  });
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function publicUser(db: Db, u: StoredUser) {
  const p = db.profiles[u.id];
  if (!p) {
    return { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt, profile: null };
  }
  const s = deriveTargets(p);
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    createdAt: u.createdAt,
    profile: { ...p, bmi: s.bmi, bmiLabel: s.bmiLabel, bmr: s.bmr, tdee: s.tdee },
  };
}

// ---------------------------- responses ----------------------------

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(status: number, message: string): Response {
  return json({ error: message }, status);
}

// ----------------------------- router -----------------------------

type Handler = (ctx: { db: Db; body: any; params: string[]; userId: number | null }) => Response | Promise<Response>;

function requireUser(userId: number | null): number {
  if (userId === null) throw new HttpError(401, "Please sign in");
  return userId;
}

const routes: Array<{ method: string; pattern: RegExp; handler: Handler }> = [];

function route(method: string, path: string, handler: Handler) {
  const pattern = new RegExp(
    "^" + path.replace(/:[^/]+/g, "([^/]+)").replace(/\//g, "\\/") + "$"
  );
  routes.push({ method, pattern, handler });
}

// ---------- auth ----------

route("POST", "/api/auth/signup", async ({ db, body }) => {
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");

  if (name.length < 2) throw new HttpError(400, "Please enter your name (at least 2 characters).");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, "That email address doesn't look right.");
  if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
  if (db.users.some((u) => u.email === email))
    throw new HttpError(409, "An account with that email already exists. Try logging in instead.");

  const salt = randomSalt();
  const user: StoredUser = {
    id: nextId(db),
    name,
    email,
    salt,
    hash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  db.profiles[user.id] = defaultProfile();
  seedUserFridge(db, user.id);
  setSession(user.id, true);

  return json({
    success: true,
    user: { id: user.id, name: user.name, email: user.email, onboardingComplete: false },
  });
});

route("POST", "/api/auth/login", async ({ db, body }) => {
  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const user = db.users.find((u) => u.email === email);
  if (!user) throw new HttpError(401, "No account found for that email.");
  if ((await hashPassword(password, user.salt)) !== user.hash)
    throw new HttpError(401, "Incorrect password — give it another go.");

  // Remember unticked -> session-only, cleared when the tab closes.
  setSession(user.id, body?.remember !== false);
  return json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      onboardingComplete: db.profiles[user.id]?.onboardingComplete ?? false,
    },
  });
});

route("POST", "/api/auth/logout", () => {
  setSession(null, true);
  return json({ success: true });
});

route("GET", "/api/auth/me", ({ db, userId }) => {
  if (userId === null) return json({ user: null });
  const u = db.users.find((x) => x.id === userId);
  if (!u) return json({ user: null });

  const p = db.profiles[u.id];
  let consumedCalories = 0;
  let consumedProtein = 0;
  const since = startOfToday();

  for (const it of db.items) {
    if (it.userId !== u.id || it.status !== "CONSUMED" || !it.consumedAt) continue;
    if (new Date(it.consumedAt).getTime() >= since) {
      consumedCalories += (it.calories || 0) * Math.max(1, it.quantity || 1);
      consumedProtein += (it.proteinG || 0) * Math.max(1, it.quantity || 1);
    }
  }

  const target = p?.dailyCalorieTarget ?? 1800;
  return json({
    user: publicUser(db, u),
    today: {
      consumedCalories,
      consumedProtein,
      remainingCalories: target - consumedCalories,
      calorieTarget: target,
      proteinTarget: p?.dailyProteinTarget ?? 90,
    },
  });
});

route("POST", "/api/auth/onboarding", ({ db, body, userId }) => {
  const id = requireUser(userId);
  const prev = db.profiles[id] ?? defaultProfile();

  const p: StoredProfile = {
    age: clampInt(body?.age, prev.age, 10, 100),
    gender: pick(body?.gender, ["female", "male", "other"], prev.gender),
    heightCm: clampInt(body?.heightCm, prev.heightCm, 90, 250),
    weightKg: clampInt(body?.weightKg, prev.weightKg, 25, 400),
    activityLevel: pick(
      body?.activityLevel,
      ["sedentary", "light", "moderate", "active", "athlete"],
      prev.activityLevel
    ),
    allergies: Array.isArray(body?.allergies) ? body.allergies.map(String) : prev.allergies,
    dietType: pick(
      body?.dietType,
      ["veg", "nonveg", "eggetarian", "pescatarian", "vegan"],
      prev.dietType
    ),
    dietPlans: Array.isArray(body?.dietPlans) ? body.dietPlans.map(String) : prev.dietPlans,
    goal: pick(body?.goal, ["deficit", "maintenance", "surplus"], prev.goal),
    dailyCalorieTarget: prev.dailyCalorieTarget,
    dailyProteinTarget: prev.dailyProteinTarget,
    waterTargetMl: prev.waterTargetMl,
    onboardingComplete: true,
  };

  const s = deriveTargets(p);
  p.dailyCalorieTarget = s.dailyCalorieTarget;
  p.dailyProteinTarget = s.dailyProteinTarget;
  p.waterTargetMl = s.waterTargetMl;
  db.profiles[id] = p;

  const name = String(body?.name || "").trim();
  if (name.length >= 2) {
    const u = db.users.find((x) => x.id === id);
    if (u) u.name = name;
  }

  return json({ success: true, summary: s, profile: p });
});

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function pick(v: unknown, allowed: string[], fallback: string): string {
  const s = String(v ?? "");
  return allowed.includes(s) ? s : fallback;
}

// ---------- profile ----------

route("GET", "/api/profile", ({ db, userId }) => {
  const id = requireUser(userId);
  const u = db.users.find((x) => x.id === id);
  if (!u) throw new HttpError(404, "Not found");
  return json({ user: publicUser(db, u) });
});

route("PATCH", "/api/profile", ({ db, body, userId }) => {
  const id = requireUser(userId);
  const prev = db.profiles[id] ?? defaultProfile();
  const p: StoredProfile = { ...prev };

  if (typeof body?.age === "number") p.age = clampInt(body.age, p.age, 10, 100);
  if (typeof body?.heightCm === "number") p.heightCm = clampInt(body.heightCm, p.heightCm, 90, 250);
  if (typeof body?.weightKg === "number") p.weightKg = clampInt(body.weightKg, p.weightKg, 25, 400);
  if (typeof body?.gender === "string") p.gender = body.gender;
  if (typeof body?.activityLevel === "string") p.activityLevel = body.activityLevel;
  if (typeof body?.dietType === "string") p.dietType = body.dietType;
  if (typeof body?.goal === "string") p.goal = body.goal;
  if (Array.isArray(body?.allergies)) p.allergies = body.allergies.map(String);
  if (Array.isArray(body?.dietPlans)) p.dietPlans = body.dietPlans.map(String);

  const s = deriveTargets(p);
  p.dailyCalorieTarget = s.dailyCalorieTarget;
  p.dailyProteinTarget = s.dailyProteinTarget;
  p.waterTargetMl = s.waterTargetMl;
  db.profiles[id] = p;

  if (typeof body?.name === "string" && body.name.trim().length >= 2) {
    const u = db.users.find((x) => x.id === id);
    if (u) u.name = body.name.trim();
  }

  return json({ success: true, summary: s });
});

// ---------- fridge ----------

function enrich(it: StoredItem) {
  const daysLeft = formatDaysUntil(it.expiryDate);
  const freshness: "fresh" | "soon" | "expired" = daysLeft < 0 ? "expired" : daysLeft <= 3 ? "soon" : "fresh";
  return {
    ...it,
    daysLeft,
    freshness,
    totalCalories: (it.calories || 0) * Math.max(1, it.quantity || 1),
  };
}

route("GET", "/api/fridge", ({ db, userId }) => {
  const id = requireUser(userId);
  const items = db.items
    .filter((i) => i.userId === id && i.status === "IN_STOCK")
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .map(enrich);
  return json({ items });
});

route("POST", "/api/fridge", ({ db, body, userId }) => {
  const id = requireUser(userId);
  const list = Array.isArray(body) ? body : [body];
  const now = new Date().toISOString();
  const inserted: StoredItem[] = [];

  for (const d of list) {
    if (!d?.name) continue;
    const meta = deriveItemMeta(String(d.name));
    const item: StoredItem = {
      id: nextId(db),
      userId: id,
      name: d.name,
      emoji: d.emoji || "🥑",
      category: d.category || "produce",
      shelfLocation: d.shelfLocation || "mid_shelf",
      quantity: Number(d.quantity) || 1,
      unit: d.unit || "pcs",
      expiryDate: d.expiryDate || daysFromNow(7),
      status: "IN_STOCK",
      calories: Number(d.calories) || 0,
      proteinG: Number(d.proteinG) || 0,
      allergens: Array.isArray(d.allergens) ? d.allergens.map(String) : meta.allergens,
      isVeg: d.isVeg !== undefined ? Boolean(d.isVeg) : meta.isVeg,
      notes: d.notes || null,
      addedAt: now,
      consumedAt: null,
    };
    db.items.push(item);
    inserted.push(item);
    logActivity(db, id, "RESTOCKED", item.name, item.emoji, 10);
  }
  return json({ success: true, items: inserted });
});

function logActivity(
  db: Db,
  userId: number,
  actionType: string,
  palName: string,
  palEmoji: string,
  pointsEarned: number
) {
  db.activity.push({
    id: nextId(db),
    userId,
    actionType,
    palName,
    palEmoji,
    pointsEarned,
    createdAt: new Date().toISOString(),
  });
}

route("PATCH", "/api/fridge/:id", ({ db, body, params, userId }) => {
  const id = requireUser(userId);
  const itemId = Number(params[0]);
  const item = db.items.find((i) => i.id === itemId && i.userId === id);
  if (!item) throw new HttpError(404, "Item not found");

  if (body?.action === "eat") {
    const next = (item.quantity || 1) - 1;
    if (next <= 0) {
      item.status = "CONSUMED";
      item.quantity = 0;
      item.consumedAt = new Date().toISOString();
    } else {
      item.quantity = next;
    }
    logActivity(db, id, "EATEN", item.name, item.emoji, 20);
    return json({
      success: true,
      message: "Ate 1 delicious portion!",
      caloriesConsumed: item.calories || 0,
      proteinConsumed: item.proteinG || 0,
    });
  }

  if (body?.action === "discard") {
    item.status = "DISCARDED";
    logActivity(db, id, "DISCARDED", item.name, item.emoji, 0);
    return json({ success: true, message: "Pal removed" });
  }

  if (body?.name !== undefined) item.name = body.name;
  if (body?.emoji !== undefined) item.emoji = body.emoji;
  if (body?.category !== undefined) item.category = body.category;
  if (body?.shelfLocation !== undefined) item.shelfLocation = body.shelfLocation;
  if (body?.quantity !== undefined) item.quantity = Number(body.quantity);
  if (body?.unit !== undefined) item.unit = body.unit;
  if (body?.expiryDate !== undefined) item.expiryDate = body.expiryDate;
  if (body?.notes !== undefined) item.notes = body.notes;
  if (body?.calories !== undefined) item.calories = Number(body.calories) || 0;
  if (body?.proteinG !== undefined) item.proteinG = Number(body.proteinG) || 0;
  if (body?.name !== undefined) {
    const meta = deriveItemMeta(String(body.name));
    item.allergens = meta.allergens;
    item.isVeg = meta.isVeg;
  }

  return json({ success: true, item });
});

route("DELETE", "/api/fridge/:id", ({ db, params, userId }) => {
  const id = requireUser(userId);
  const itemId = Number(params[0]);
  db.items = db.items.filter((i) => !(i.id === itemId && i.userId === id));
  return json({ success: true });
});

route("POST", "/api/fridge/seed", ({ db, userId }) => {
  const id = requireUser(userId);
  db.items = db.items.filter((i) => i.userId !== id);
  db.groceries = db.groceries.filter((g) => g.userId !== id);
  seedUserFridge(db, id);
  logActivity(db, id, "RESTOCKED", "Restocked all fridge pals", "✨", 50);
  return json({ success: true, message: "Fresh fridge restocked!" });
});

// ---------- groceries ----------

route("GET", "/api/groceries", ({ db, userId }) => {
  const id = requireUser(userId);
  const items = db.groceries
    .filter((g) => g.userId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return json({ items });
});

route("POST", "/api/groceries", ({ db, body, userId }) => {
  const id = requireUser(userId);
  if (!body?.name) throw new HttpError(400, "Item name is required");
  const item: StoredGrocery = {
    id: nextId(db),
    userId: id,
    name: body.name,
    emoji: body.emoji || "🛒",
    category: body.category || "produce",
    quantity: Number(body.quantity) || 1,
    unit: body.unit || "pcs",
    isBought: Boolean(body.isBought),
    createdAt: new Date().toISOString(),
  };
  db.groceries.push(item);
  return json({ success: true, item });
});

route("PATCH", "/api/groceries/:id", ({ db, body, params, userId }) => {
  const id = requireUser(userId);
  const item = db.groceries.find((g) => g.id === Number(params[0]) && g.userId === id);
  if (!item) throw new HttpError(404, "Item not found");
  if (body?.isBought !== undefined) item.isBought = Boolean(body.isBought);
  if (body?.name !== undefined) item.name = body.name;
  if (body?.quantity !== undefined) item.quantity = Number(body.quantity);
  return json({ success: true, item });
});

route("DELETE", "/api/groceries/:id", ({ db, params, userId }) => {
  const id = requireUser(userId);
  const gid = Number(params[0]);
  db.groceries = db.groceries.filter((g) => !(g.id === gid && g.userId === id));
  return json({ success: true });
});

route("POST", "/api/groceries/restock", ({ db, userId }) => {
  const id = requireUser(userId);
  const bought = db.groceries.filter((g) => g.userId === id && g.isBought);
  if (bought.length === 0) return json({ message: "No bought items to restock", count: 0 });

  const now = new Date().toISOString();
  for (const g of bought) {
    const meta = deriveItemMeta(g.name);
    db.items.push({
      id: nextId(db),
      userId: id,
      name: g.name,
      emoji: g.emoji || "🥑",
      category: g.category || "produce",
      shelfLocation: shelfForCategory(g.category),
      quantity: g.quantity || 1,
      unit: g.unit || "pcs",
      expiryDate: daysFromNow(expiryForCategory(g.category)),
      status: "IN_STOCK",
      calories: 0,
      proteinG: 0,
      allergens: meta.allergens,
      isVeg: meta.isVeg,
      notes: "Stocked from your grocery list",
      addedAt: now,
      consumedAt: null,
    });
  }
  db.groceries = db.groceries.filter((g) => !(g.userId === id && g.isBought));
  logActivity(db, id, "RESTOCKED", `${bought.length} items from your grocery list`, "🛒", bought.length * 15);

  return json({ success: true, count: bought.length, message: `Restocked ${bought.length} pals into your fridge! 🧊✨` });
});

function shelfForCategory(c: string): string {
  switch (c) {
    case "dairy": return "top_shelf";
    case "produce": return "crisper_veggie";
    case "drinks": return "bottom_shelf";
    case "frozen": return "freezer";
    case "condiments": return "door_shelf_top";
    case "protein": return "mid_shelf";
    default: return "mid_shelf";
  }
}

function expiryForCategory(c: string): number {
  switch (c) {
    case "produce": return 6;
    case "dairy": return 10;
    case "protein": return 5;
    case "drinks": return 30;
    case "frozen": return 90;
    case "condiments": return 60;
    default: return 7;
  }
}

// ---------- recipes ----------

const PLAN_TAG_MAP: Record<string, string> = {
  high_protein: "High Protein",
  low_carb: "Low Carb",
  keto: "Keto",
  mediterranean: "Mediterranean",
};

route("GET", "/api/recipes", ({ db, userId }) => {
  const id = requireUser(userId);
  const p = db.profiles[id];
  const userAllergies = p?.allergies ?? [];
  const dietType = p?.dietType ?? "veg";
  const dietPlans = p?.dietPlans ?? [];
  const calorieTarget = p?.dailyCalorieTarget ?? 1800;

  const stockNames = db.items
    .filter((i) => i.userId === id && i.status === "IN_STOCK")
    .map((i) => i.name.toLowerCase());

  const list = db.recipes.map((r) => {
    const matched: string[] = [];
    const missing: string[] = [];

    for (const req of r.requiredIngredients) {
      const rl = req.toLowerCase();
      const found = stockNames.some(
        (f) =>
          f.includes(rl) ||
          rl.includes(f) ||
          f.split(" ").some((w) => w.length > 3 && rl.includes(w))
      );
      (found ? matched : missing).push(req);
    }

    const matchScore = Math.round((matched.length / Math.max(1, r.requiredIngredients.length)) * 100);
    const dietCheck = isRecipeSafeForDiet([...r.requiredIngredients, r.title].join(" "), dietType);
    const conflicts = allergenConflicts(r.allergens, userAllergies);
    const fitsCalories = r.calories <= Math.max(300, calorieTarget * 0.45);
    const highProtein = dietPlans.includes("high_protein") && r.proteinG >= 25;
    const lowCarb = (dietPlans.includes("low_carb") || dietPlans.includes("keto")) && r.carbsG <= 25;
    const planBonus = dietPlans.some((pl) => {
      const mapped = PLAN_TAG_MAP[pl];
      return mapped ? r.tags.includes(mapped) : false;
    });

    const reasons: string[] = [];
    if (!dietCheck.ok) reasons.push(dietCheck.reason || "not diet friendly");
    if (conflicts.length > 0) reasons.push(`contains ${conflicts.join(", ")}`);

    const personalScore =
      (dietCheck.ok ? 60 : -200) +
      (conflicts.length === 0 ? 20 : -150) +
      matchScore * 0.6 +
      (fitsCalories ? 10 : 0) +
      (highProtein || lowCarb ? 15 : 0) +
      (planBonus ? 5 : 0);

    return {
      ...r,
      recipeAllergens: r.allergens,
      matchedIngredients: matched,
      missingIngredients: missing,
      matchScore,
      fitsCalories,
      highProtein,
      lowCarb,
      dietSafe: dietCheck.ok,
      allergenConflicts: conflicts,
      blockReasons: reasons,
      personalScore: Math.round(personalScore),
    };
  });

  list.sort((a, b) => b.personalScore - a.personalScore);

  return json({
    recipes: list,
    personalisation: { allergies: userAllergies, dietType, dietPlans, calorieTarget },
  });
});

route("POST", "/api/recipes/cook", ({ db, body, userId }) => {
  const id = requireUser(userId);
  const recipe = db.recipes.find((r) => r.id === Number(body?.recipeId));
  if (!recipe) throw new HttpError(404, "Recipe not found");

  const stock = db.items.filter((i) => i.userId === id && i.status === "IN_STOCK");
  let consumedCount = 0;
  let consumedCalories = 0;
  let consumedProtein = 0;

  for (const req of recipe.requiredIngredients) {
    const rl = req.toLowerCase();
    const match = stock.find(
      (f) =>
        f.name.toLowerCase().includes(rl) ||
        rl.includes(f.name.toLowerCase()) ||
        f.name.toLowerCase().split(" ").some((w) => w.length > 3 && rl.includes(w))
    );
    if (!match) continue;

    consumedCount++;
    consumedCalories += match.calories || 0;
    consumedProtein += match.proteinG || 0;

    const next = (match.quantity || 1) - 1;
    if (next <= 0) {
      match.status = "CONSUMED";
      match.quantity = 0;
      match.consumedAt = new Date().toISOString();
    } else {
      match.quantity = next;
    }
  }

  const points = Math.max(30, consumedCount * 25);
  logActivity(db, id, "COOKED_MEAL", recipe.title, recipe.emoji, points);

  return json({
    success: true,
    recipeTitle: recipe.title,
    consumedCount,
    consumedCalories,
    consumedProtein,
    recipeCalories: recipe.calories,
    recipeProtein: recipe.proteinG,
    pointsEarned: points,
    message: `Delicious! You cooked ${recipe.title} (${recipe.calories} kcal, ${recipe.proteinG}g protein) and used ${consumedCount} fridge pals. 🎉`,
  });
});

// ---------- dashboard ----------

route("GET", "/api/dashboard", ({ db, userId }) => {
  const id = requireUser(userId);
  const p = db.profiles[id];
  const u = db.users.find((x) => x.id === id);

  const inStock = db.items.filter((i) => i.userId === id && i.status === "IN_STOCK");
  const consumed = db.items.filter((i) => i.userId === id && i.status === "CONSUMED");
  const discarded = db.items.filter((i) => i.userId === id && i.status === "DISCARDED");

  let soonCount = 0;
  let freshCount = 0;
  let expiredCount = 0;
  const categoryMap: Record<string, number> = {};
  const shelfMap: Record<string, number> = {};
  let fridgeCalorieBank = 0;

  for (const i of inStock) {
    const d = formatDaysUntil(i.expiryDate);
    if (d < 0) expiredCount++;
    else if (d <= 3) soonCount++;
    else freshCount++;
    categoryMap[i.category] = (categoryMap[i.category] || 0) + 1;
    shelfMap[i.shelfLocation] = (shelfMap[i.shelfLocation] || 0) + 1;
    fridgeCalorieBank += (i.calories || 0) * Math.max(1, i.quantity || 1);
  }

  const since = startOfToday();
  let caloriesToday = 0;
  let proteinToday = 0;
  for (const i of consumed) {
    if (i.consumedAt && new Date(i.consumedAt).getTime() >= since) {
      caloriesToday += (i.calories || 0) * Math.max(1, i.quantity || 1);
      proteinToday += (i.proteinG || 0) * Math.max(1, i.quantity || 1);
    }
  }

  const totalResolved = consumed.length + discarded.length;
  const activities = db.activity
    .filter((a) => a.userId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);

  const s = p ? deriveTargets(p) : null;

  return json({
    totalInStock: inStock.length,
    soonCount,
    freshCount,
    expiredCount,
    consumedCount: consumed.length,
    discardedCount: discarded.length,
    wasteSaveRate: totalResolved > 0 ? Math.round((consumed.length / totalResolved) * 100) : 96,
    moneySaved: (consumed.length * 4.25 + 68.5).toFixed(2),
    totalPoints: activities.reduce((a, x) => a + (x.pointsEarned || 0), 180),
    categoryMap,
    shelfMap,
    activities,
    streakDays: 14,
    userName: u?.name ?? "fridge pal",
    nutrition: {
      caloriesToday,
      proteinToday,
      calorieTarget: p?.dailyCalorieTarget ?? 1800,
      proteinTarget: p?.dailyProteinTarget ?? 90,
      remainingCalories: (p?.dailyCalorieTarget ?? 1800) - caloriesToday,
      remainingProtein: (p?.dailyProteinTarget ?? 90) - proteinToday,
      fridgeCalorieBank,
      bmi: s?.bmi ?? null,
      bmiLabel: s?.bmiLabel ?? null,
      bmr: s?.bmr ?? null,
      tdee: s?.tdee ?? null,
      goal: p?.goal ?? "maintenance",
      dietType: p?.dietType ?? "veg",
      allergies: p?.allergies ?? [],
      dietPlans: p?.dietPlans ?? [],
      waterTargetMl: p?.waterTargetMl ?? 2000,
      heightCm: p?.heightCm ?? null,
      weightKg: p?.weightKg ?? null,
      age: p?.age ?? null,
    },
  });
});

// --------------------------- fetch shim ---------------------------

async function handle(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const path = new URL(url, window.location.origin).pathname;
  const method = (init?.method || (typeof input !== "string" && !(input instanceof URL) ? input.method : "GET") || "GET").toUpperCase();

  let body: any = null;
  if (init?.body) {
    try {
      body = JSON.parse(String(init.body));
    } catch {
      body = null;
    }
  }

  for (const r of routes) {
    if (r.method !== method) continue;
    const m = path.match(r.pattern);
    if (!m) continue;

    const db = load();
    try {
      const res = await r.handler({ db, body, params: m.slice(1), userId: getSessionId() });
      save(db);
      return res;
    } catch (e) {
      save(db);
      if (e instanceof HttpError) return err(e.status, e.message);
      console.error("[fridgemate] local api error:", e);
      return err(500, "Something went wrong inside your browser storage.");
    }
  }

  return err(404, `No local handler for ${method} ${path}`);
}

let installed = false;

/**
 * Routes the app's own `/api/*` calls to the in-browser store.
 * Anything else (and `/api/health`) falls through to the real network.
 */

export function installLocalApi(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.fetch = ((
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    let path = "";

    try {
      path = new URL(url, window.location.origin).pathname;
    } catch {
      path = "";
    }

    
const isLocalApi =
  path.startsWith("/api/") &&
  path !== "/api/recipes" &&
  path !== "/api/recipes/cook" &&
  path !== "/api/health" &&
  path !== "/api/fridge" &&
  !/^\/api\/fridge\/\d+$/.test(path) &&
  path !== "/api/groceries" &&
  path !== "/api/groceries/restock" &&
  !/^\/api\/groceries\/\d+$/.test(path) &&
  path !== "/api/dashboard";

    // Let Supabase, Next.js and all non-local requests use normal fetch.
    if (!isLocalApi && nativeFetch) {
      return nativeFetch(input, init);
    }

    // Keep the existing local API handlers for routes not yet migrated.
    return handle(input, init);
  }) as typeof window.fetch;
}
/** Wipes every account, pal and setting stored in this browser. */
export function resetLocalData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(NS);
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

// Install on import so it is active before any component effect runs.
installLocalApi();
