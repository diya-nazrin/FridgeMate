
import {
  pgTable,
  serial,
  uuid,
  varchar,
  boolean,
  timestamp,
  date,
  real,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  age: integer("age").default(24).notNull(),
  gender: varchar("gender", { length: 20 }).default("female").notNull(),
  heightCm: real("height_cm").default(165).notNull(),
  weightKg: real("weight_kg").default(60).notNull(),
  activityLevel: varchar("activity_level", { length: 30 })
    .default("light").notNull(),
  allergies: jsonb("allergies").$type<string[]>().default([]).notNull(),
  dietType: varchar("diet_type", { length: 30 }).default("veg").notNull(),
  dietPlans: jsonb("diet_plans").$type<string[]>().default([]).notNull(),
  goal: varchar("goal", { length: 30 }).default("deficit").notNull(),
  dailyCalorieTarget: integer("daily_calorie_target").default(1800).notNull(),
  dailyProteinTarget: integer("daily_protein_target").default(90).notNull(),
  waterTargetMl: integer("water_target_ml").default(2000).notNull(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow().notNull(),
});

export const fridgeItems = pgTable("fridge_items", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 80 }),
  quantity: real("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 30 }),
  expiryDate: date("expiry_date"),
  status: varchar("status", { length: 20 })
    .default("IN_STOCK").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow().notNull(),
});

export const groceries = pgTable("groceries", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 150 }).notNull(),
  quantity: real("quantity").default(1).notNull(),
  unit: varchar("unit", { length: 30 }),
  isBought: boolean("is_bought").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow().notNull(),
});
