"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { sound } from "@/lib/sound";
import confetti from "canvas-confetti";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Flame,
  Loader2,
  Target,
} from "lucide-react";
import {
  ALLERGY_OPTIONS,
  DIET_TYPES,
  DIET_PLAN_OPTIONS,
  ACTIVITY_LEVELS,
  GOAL_OPTIONS,
  summariseNutrition,
} from "@/lib/nutrition";

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState(24);
  const [gender, setGender] = useState("female");
  const [heightCm, setHeightCm] = useState(165);
  const [weightKg, setWeightKg] = useState(60);
  const [activityLevel, setActivityLevel] = useState("light");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dietType, setDietType] = useState("veg");
  const [dietPlans, setDietPlans] = useState<string[]>(["balanced"]);
  const [goal, setGoal] = useState("deficit");

  useEffect(() => {
    if (!loading && user) {
      setName(user.name || "");
      if (user.profile) {
        setAge(user.profile.age);
        setGender(user.profile.gender);
        setHeightCm(user.profile.heightCm);
        setWeightKg(user.profile.weightKg);
        setActivityLevel(user.profile.activityLevel);
        setAllergies(user.profile.allergies || []);
        setDietType(user.profile.dietType);
        setDietPlans(user.profile.dietPlans?.length ? user.profile.dietPlans : ["balanced"]);
        setGoal(user.profile.goal);
      }
    }
  }, [loading, user]);

  useEffect(() => {
    if (!loading && !user) router.replace("/welcome");
  }, [loading, user, router]);

  const preview = useMemo(
    () => summariseNutrition({ weightKg, heightCm, age, gender, activityLevel, goal, dietPlans }),
    [weightKg, heightCm, age, gender, activityLevel, goal, dietPlans]
  );

  function toggle(list: string[], setList: (v: string[]) => void, value: string, single = false) {
    sound.playPop();
    if (single) {
      setList([value]);
      return;
    }
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  
async function finish() {
  setBusy(true);
  setError(null);

  try {
    // Verify the actual Supabase session.
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    // Save the onboarding preferences to this user's profile.
    const { error: saveError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: authUser.id,
          name: name.trim() || "FridgeMate User",
          age,
          gender,
          height_cm: heightCm,
          weight_kg: weightKg,
          activity_level: activityLevel,
          allergies,
          diet_type: dietType,
          diet_plans: dietPlans,
          goal,
          daily_calorie_target: preview.dailyCalorieTarget,
          daily_protein_target: preview.dailyProteinTarget,
          water_target_ml: preview.waterTargetMl,
          onboarding_complete: true,
        },
        { onConflict: "id" }
      );

    if (saveError) {
      console.error("Profile save failed:", saveError);
      setError(`Could not save your profile: ${saveError.message}`);
      return;
    }

    sound.playSuccess();

    confetti({
      particleCount: 140,
      spread: 100,
      origin: { y: 0.6 },
      colors: ["#FF8FB3", "#FFD166", "#8FD9C4", "#A3C9FF"],
    });

    await refresh();
    router.replace("/");
  } catch (err) {
    console.error("Onboarding failed:", err);
    setError("Something went wrong while saving. Please try again.");
  } finally {
    setBusy(false);
  }
}

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF6F9]">
        <div className="text-4xl animate-bounce">🧊</div>
      </div>
    );
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <main className="min-h-screen bg-[#FFF6F9] font-poppins text-[#5A3D4D] relative overflow-hidden">
      {/* Soft decorative blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#FFE1EC] blur-3xl opacity-70" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E4F7F1] blur-3xl opacity-70" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white border-2 border-[#FFD1E3] rounded-full px-4 py-1.5 mb-3 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#FF8FB3]" />
            <span className="text-[11px] font-bold tracking-[0.5px] text-[#C2456F] uppercase">
              step {step + 1} of {TOTAL_STEPS}
            </span>
          </div>
          <h1 className="font-baloo text-3xl sm:text-[38px] font-bold leading-tight">
            let&apos;s set up your fridge, {name || "friend"} 🎀
          </h1>
          <p className="text-[13px] text-[#5A3D4D]/70 mt-1 font-medium">
            these answers shape every recipe, alert and calorie target you&apos;ll see.
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-[#FFE1EC] rounded-full overflow-hidden mb-8 border-2 border-white shadow-xs">
          <div
            className="h-full bg-gradient-to-r from-[#FF8FB3] to-[#FFD166] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step card */}
        <div className="bg-white border-4 border-[#FFD1E3] rounded-[32px] p-6 sm:p-8 shadow-[0_12px_40px_rgba(255,143,179,0.16)] min-h-[380px] flex flex-col">
          {/* ---- STEP 0: name + age + gender ---- */}
          {step === 0 && (
            <Section emoji="🧸" title="first things first" subtitle="what should fridgemate call you?">
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1.5">your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Priya"
                    className="w-full px-4 py-3 rounded-2xl border-2 border-[#FFD1E3] text-sm font-semibold focus:outline-none focus:border-[#FF8FB3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1.5">
                    age — <span className="text-[#FF8FB3] font-bold">{age} years</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-[#FF8FB3]"
                  />
                  <div className="flex justify-between text-[10px] text-[#5A3D4D]/45 font-semibold">
                    <span>10</span>
                    <span>90</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-2">gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "female", label: "Female", emoji: "👩" },
                      { id: "male", label: "Male", emoji: "👨" },
                      { id: "other", label: "Other", emoji: "🌈" },
                    ].map((g) => (
                      <Choice
                        key={g.id}
                        active={gender === g.id}
                        emoji={g.emoji}
                        label={g.label}
                        onClick={() => {
                          sound.playPop();
                          setGender(g.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ---- STEP 1: height + weight ---- */}
          {step === 1 && (
            <Section emoji="📏" title="your measurements" subtitle="used for BMI and daily energy needs">
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1.5">
                    height — <span className="text-[#FF8FB3] font-bold">{heightCm} cm</span>
                  </label>
                  <input
                    type="range"
                    min={120}
                    max={220}
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full accent-[#FF8FB3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1.5">
                    weight — <span className="text-[#FF8FB3] font-bold">{weightKg} kg</span>
                  </label>
                  <input
                    type="range"
                    min={30}
                    max={200}
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full accent-[#FF8FB3]"
                  />
                </div>

                <div className="bg-[#FFF6F9] border-2 border-[#FFE1EC] rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold text-[#5A3D4D]/60 uppercase tracking-wide">
                      your BMI
                    </div>
                    <div className="font-baloo text-2xl font-bold">{preview.bmi}</div>
                  </div>
                  <span className="text-[11px] font-bold bg-[#E4F7F1] text-[#1F5F4C] border border-[#8FD9C4] px-3 py-1.5 rounded-full">
                    {preview.bmiLabel}
                  </span>
                </div>
              </div>
            </Section>
          )}

          {/* ---- STEP 2: allergies ---- */}
          {step === 2 && (
            <Section
              emoji="🚫"
              title="any allergies?"
              subtitle="we'll flag anything risky in your fridge and hide unsafe recipes"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ALLERGY_OPTIONS.map((a) => (
                  <Choice
                    key={a.id}
                    active={allergies.includes(a.id)}
                    emoji={a.emoji}
                    label={a.label}
                    onClick={() => toggle(allergies, setAllergies, a.id)}
                  />
                ))}
              </div>
              <p className="text-[11px] text-[#5A3D4D]/60 mt-4 font-medium">
                {allergies.length === 0
                  ? "no allergies selected — everything is on the menu 🎉"
                  : `${allergies.length} allergen${allergies.length > 1 ? "s" : ""} will be auto-flagged across your fridge & recipes`}
              </p>
            </Section>
          )}

          {/* ---- STEP 3: diet type ---- */}
          {step === 3 && (
            <Section emoji="🥗" title="what do you eat?" subtitle="veg, non-veg or somewhere in between">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DIET_TYPES.map((d) => (
                  <Choice
                    key={d.id}
                    active={dietType === d.id}
                    emoji={d.emoji}
                    label={d.label}
                    blurb={d.blurb}
                    wide
                    onClick={() => {
                      sound.playPop();
                      setDietType(d.id);
                    }}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ---- STEP 4: diet plans ---- */}
          {step === 4 && (
            <Section
              emoji="📋"
              title="following any diet plan?"
              subtitle="pick as many as apply — recipes will be ranked around them"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DIET_PLAN_OPTIONS.map((p) => (
                  <Choice
                    key={p.id}
                    active={dietPlans.includes(p.id)}
                    emoji={p.emoji}
                    label={p.label}
                    blurb={p.blurb}
                    wide
                    onClick={() => toggle(dietPlans, setDietPlans, p.id)}
                  />
                ))}
              </div>
            </Section>
          )}

          {/* ---- STEP 5: activity + goal ---- */}
          {step === 5 && (
            <Section emoji="🎯" title="activity & goal" subtitle="this sets your daily calorie and protein targets">
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-2">
                    how active are you?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ACTIVITY_LEVELS.map((a) => (
                      <Choice
                        key={a.id}
                        active={activityLevel === a.id}
                        emoji={a.emoji}
                        label={a.label}
                        small
                        onClick={() => {
                          sound.playPop();
                          setActivityLevel(a.id);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-2">your goal</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {GOAL_OPTIONS.map((g) => (
                      <Choice
                        key={g.id}
                        active={goal === g.id}
                        emoji={g.emoji}
                        label={g.label}
                        blurb={g.blurb}
                        small
                        onClick={() => {
                          sound.playPop();
                          setGoal(g.id);
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Live computed plan */}
                <div className="bg-gradient-to-br from-[#FFF0F5] to-[#FFF9EE] border-2 border-[#FFD1E3] rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-[#FF8FB3]" />
                    <span className="font-baloo text-sm font-bold">your personalised daily plan</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <Metric icon="🔥" label="calories" value={`${preview.dailyCalorieTarget}`} unit="kcal" />
                    <Metric icon="💪" label="protein" value={`${preview.dailyProteinTarget}`} unit="g" />
                    <Metric icon="💧" label="water" value={`${(preview.waterTargetMl / 1000).toFixed(1)}`} unit="L" />
                  </div>
                  <p className="text-[10.5px] text-[#5A3D4D]/60 mt-3 text-center font-medium">
                    BMR {preview.bmr} kcal × activity → TDEE {preview.tdee} kcal
                    {goal === "deficit" ? " − 450 deficit" : goal === "surplus" ? " + 350 surplus" : " (maintenance)"}
                  </p>
                </div>
              </div>
            </Section>
          )}

          {/* Footer nav */}
          <div className="mt-auto pt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              disabled={step === 0 || busy}
              onClick={() => {
                sound.playPop();
                setStep(step - 1);
              }}
              className="px-4 py-2.5 rounded-full text-xs font-bold font-baloo bg-[#FFE1EC] text-[#C2456F] hover:bg-[#FFD1E3] disabled:opacity-40 flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>back</span>
            </button>

            {error && (
              <span className="text-[11px] font-semibold text-[#FF6B6B] animate-shake">{error}</span>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  setStep(step + 1);
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold font-baloo bg-[#FF8FB3] text-white hover:bg-[#FF7BA3] shadow-[0_4px_14px_rgba(255,143,179,0.4)] flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={finish}
                className="px-6 py-2.5 rounded-full text-xs font-bold font-baloo bg-[#51CF66] text-white hover:bg-[#43B856] shadow-[0_4px_14px_rgba(81,207,102,0.4)] flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{busy ? "saving..." : "finish & open my fridge"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-2xl bg-[#FFF0F5] border-2 border-[#FFD1E3] flex items-center justify-center text-xl">
          {emoji}
        </div>
        <div>
          <h2 className="font-baloo text-xl font-bold leading-tight">{title}</h2>
          <p className="text-[11.5px] text-[#5A3D4D]/65 font-medium">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Choice({
  active,
  emoji,
  label,
  blurb,
  onClick,
  wide = false,
  small = false,
}: {
  active: boolean;
  emoji: string;
  label: string;
  blurb?: string;
  onClick: () => void;
  wide?: boolean;
  small?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 p-3 text-left transition-all active:scale-95 ${
        wide ? "flex items-center gap-3" : "flex flex-col items-center justify-center text-center"
      } ${small ? "py-2.5" : "py-3.5"} ${
        active
          ? "bg-[#FFE1EC] border-[#FF8FB3] shadow-[0_4px_14px_rgba(255,143,179,0.25)] scale-[1.02]"
          : "bg-white border-[#FFE1EC] hover:border-[#FFD1E3]"
      }`}
    >
      {active && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#FF8FB3] text-white flex items-center justify-center">
          <Check className="w-3 h-3" />
        </span>
      )}
      <span className={small ? "text-lg" : "text-2xl"}>{emoji}</span>
      <span className={`font-baloo font-bold leading-tight mt-1 ${small ? "text-[11.5px]" : "text-[13px]"}`}>
        {label}
      </span>
      {blurb && <span className="text-[10px] text-[#5A3D4D]/60 font-medium leading-snug">{blurb}</span>}
    </button>
  );
}

function Metric({ icon, label, value, unit }: { icon: string; label: string; value: string; unit: string }) {
  return (
    <div className="bg-white rounded-xl border-2 border-[#FFE1EC] py-2.5 px-1">
      <div className="text-base">{icon}</div>
      <div className="font-baloo text-lg font-bold leading-none mt-1">
        {value}
        <span className="text-[10px] font-semibold text-[#5A3D4D]/50 ml-0.5">{unit}</span>
      </div>
      <div className="text-[9.5px] font-semibold text-[#5A3D4D]/55 uppercase tracking-wide mt-0.5">
        {label}
      </div>
    </div>
  );
}
