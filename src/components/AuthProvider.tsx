
"use client";

import "@/lib/local-api";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UserProfileData {
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
  bmi: number;
  bmiLabel: string;
  bmr: number;
  tdee: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profile: UserProfileData | null;
}

export interface TodayStats {
  consumedCalories: number;
  consumedProtein: number;
  remainingCalories: number;
  calorieTarget: number;
  proteinTarget: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  today: TodayStats | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  today: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
});

const supabase = createClient();

function calculateBodyMetrics(
  heightCm: number,
  weightKg: number,
  age: number,
  gender: string
) {
  const heightM = heightCm / 100;
  const bmi =
    heightM > 0 ? Number((weightKg / (heightM * heightM)).toFixed(1)) : 0;

  const bmiLabel =
    bmi === 0
      ? "Unknown"
      : bmi < 18.5
        ? "Underweight"
        : bmi < 25
          ? "Normal"
          : bmi < 30
            ? "Overweight"
            : "Obese";

  const bmr =
    gender.toLowerCase() === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  return {
    bmi,
    bmiLabel,
    bmr: Math.round(bmr),
    tdee: Math.round(
      bmr * (activityMultipliers["light"] ?? 1.375)
    ),
  };
}

async function loadAuthUser(authUser: User): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    return {
      id: authUser.id,
      email: authUser.email ?? "",
      name:
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email ??
        "FridgeMate User",
      profile: null,
    };
  }

  const age = data.age ?? 24;
  const gender = data.gender ?? "female";
  const heightCm = data.height_cm ?? 165;
  const weightKg = data.weight_kg ?? 60;

  const metrics = calculateBodyMetrics(
    heightCm,
    weightKg,
    age,
    gender
  );

  return {
    id: authUser.id,
    email: authUser.email ?? "",
    name: data.name,
    profile: {
      age,
      gender,
      heightCm,
      weightKg,
      activityLevel: data.activity_level ?? "light",
      allergies: data.allergies ?? [],
      dietType: data.diet_type ?? "veg",
      dietPlans: data.diet_plans ?? [],
      goal: data.goal ?? "deficit",
      dailyCalorieTarget: data.daily_calorie_target ?? 1800,
      dailyProteinTarget: data.daily_protein_target ?? 90,
      waterTargetMl: data.water_target_ml ?? 2000,
      onboardingComplete: data.onboarding_complete ?? false,
      ...metrics,
    },
  };
}

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [today, setToday] = useState<TodayStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        setUser(null);
        setToday(null);
        return;
      }

      const authUser = await loadAuthUser(data.user);
      setUser(authUser);
      setToday(null);
    } catch (error) {
      console.error("Unable to load the Supabase user:", error);
      setUser(null);
      setToday(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer profile fetching so it doesn't run inside the auth callback.
      setTimeout(() => {
        if (!active) return;

        if (session?.user) {
          void loadAuthUser(session.user)
            .then((authUser) => {
              if (!active) return;
              setUser(authUser);
              setToday(null);
            })
            .catch((error) => {
             console.error(
  "Unable to load the profile:",
  JSON.stringify(error, null, 2)
);
              if (active) {
                setUser(null);
                setToday(null);
              }
            })
            .finally(() => {
              if (active) setLoading(false);
            });
        } else {
          setUser(null);
          setToday(null);
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setToday(null);
    window.location.href = "/welcome";
  }, []);

  const value = useMemo(
    () => ({ user, today, loading, refresh, logout }),
    [user, today, loading, refresh, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
