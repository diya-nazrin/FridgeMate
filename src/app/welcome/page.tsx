"use client";

import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { WelcomeScene } from "@/components/WelcomeScene";
import { useAuth } from "@/components/AuthProvider";
import { sound } from "@/lib/sound";
import { LogIn, UserPlus, Sparkles, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

export default function WelcomePage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const supabase = createClient();

  // Already signed in? Straight back to the fridge.
  React.useEffect(() => {
    if (!loading && user) {
      router.replace(user.profile?.onboardingComplete ? "/" : "/onboarding");
    }
  }, [loading, user, router]);

  
async function handleSubmit(e: FormEvent) {
  e.preventDefault();
  setError(null);
  setBusy(true);

  try {
    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
        },
      });

      if (signUpError) throw signUpError;

      // Supabase may require email confirmation before signing in.
      if (!data.session) {
        setError(
          "Account created! Check your email to confirm your account, then log in."
        );
        setMode("login");
        return;
      }
    } else {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (loginError) throw loginError;
    }

    sound.playSuccess();
    await refresh();

    setRedirecting(true);
    router.replace("/onboarding");
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Something went wrong. Please try again."
    );
  } finally {
    setBusy(false);
  }
}


  return (
    <main className="relative min-h-screen w-full overflow-hidden font-poppins text-[#5A3D4D]">
      <WelcomeScene />

      {/* Hand-off overlay so the redirect is visibly intentional */}
      {redirecting && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#FFF6F9]/85 backdrop-blur-sm animate-fadeIn">
          <div className="text-5xl animate-bob">🧊</div>
          <p className="font-baloo text-lg font-bold text-[#5A3D4D]">opening your fridge...</p>
          <div className="w-44 h-2 rounded-full bg-[#FFE1EC] overflow-hidden">
            <div className="h-full w-1/2 bg-[#FF8FB3] rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
          </div>
        </div>
      )}

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-10">
        {/* ---------- Brand + animated headline ---------- */}
        <div className="text-center mb-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border-2 border-white rounded-full px-4 py-1.5 mb-5 shadow-sm animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-[#FF8FB3]" />
            <span className="text-[11px] font-bold tracking-[0.6px] text-[#C2456F] uppercase">
              your fridge, but make it cute
            </span>
          </div>

          <h1 className="font-baloo font-extrabold leading-[0.95] tracking-tight">
            <span className="block text-[15vw] sm:text-[86px] animate-letter-pop">
              <span className="inline-block animate-wave">🧊</span> fridgemate
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#5A3D4D]/85 font-medium max-w-md mx-auto animate-fade-up [animation-delay:220ms]">
            open the door, meet your little fridge pals, and let us plan every meal around
            your body, your goals and your allergies.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 animate-fade-up [animation-delay:340ms]">
            {["🍓 freshness tracking", "🍳 zero-waste recipes", "📉 calorie goals"].map((t) => (
              <span
                key={t}
                className="text-[11px] font-bold bg-white/75 backdrop-blur-sm border border-white px-3 py-1.5 rounded-full shadow-xs"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ---------- Auth card ---------- */}
        <div className="w-full max-w-md animate-fade-up [animation-delay:420ms]">
          <div className="bg-white/85 backdrop-blur-md border-4 border-white rounded-[32px] p-6 sm:p-7 shadow-[0_20px_60px_rgba(194,69,111,0.22)]">
            {/* Mode switch */}
            <div className="flex gap-1.5 bg-[#FFF0F5] p-1.5 rounded-full mb-6">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-full text-xs font-bold font-baloo transition-all flex items-center justify-center gap-1.5 ${
                    mode === m
                      ? "bg-[#FF8FB3] text-white shadow-[0_3px_10px_rgba(255,143,179,0.45)]"
                      : "text-[#C2456F] hover:bg-white/70"
                  }`}
                >
                  {m === "login" ? <LogIn className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                  {m === "login" ? "welcome back" : "create account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === "signup" && (
                <Field
                  label="your name"
                  value={name}
                  onChange={setName}
                  placeholder="e.g. Priya"
                  autoComplete="name"
                  icon="🧸"
                />
              )}

              <Field
                label="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                icon="📮"
              />

              <div>
                <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔑</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="at least 6 characters"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="w-full pl-9 pr-10 py-2.5 rounded-2xl border-2 border-[#FFD1E3] bg-white text-sm font-semibold focus:outline-none focus:border-[#FF8FB3] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#C2456F]/60 hover:text-[#C2456F]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <label className="flex items-center gap-2 cursor-pointer select-none pt-0.5">
                  <span
                    onClick={() => {
                      sound.playPop();
                      setRemember(!remember);
                    }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      remember ? "bg-[#FF8FB3] border-[#FF8FB3]" : "bg-white border-[#FFD1E3]"
                    }`}
                  >
                    {remember && <span className="text-white text-[11px] font-bold">✓</span>}
                  </span>
                  <span className="text-[11px] font-semibold text-[#5A3D4D]/75">
                    keep me signed in for 30 days
                  </span>
                </label>
              )}

              {error && (
                <div className="text-[11.5px] font-semibold text-[#FF6B6B] bg-[#FFE1EC]/60 border border-[#FFB3CA] rounded-xl px-3 py-2 animate-shake">
                  <div className="flex items-start gap-2">
                    <span>⚠️</span>
                    <div>
                      <div>{error}</div>
                      {mode === "login" && /no account found/i.test(error) && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playPop();
                            setMode("signup");
                            setError(null);
                          }}
                          className="mt-1.5 underline font-bold text-[#C2456F] hover:text-[#FF8FB3]"
                        >
                          first time here? create an account instead →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full mt-1 bg-[#FF8FB3] hover:bg-[#FF7BA3] disabled:opacity-60 text-white font-baloo text-base font-bold py-3.5 rounded-full flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(255,143,179,0.45)] hover:scale-[1.01] active:scale-95 transition-all"
              >
                {busy ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "login" ? (
                  <LogIn className="w-5 h-5" />
                ) : (
                  <UserPlus className="w-5 h-5" />
                )}
                <span>
                  {busy
                    ? "one sec..."
                    : mode === "login"
                    ? "open my fridge"
                    : "start my fridge journey"}
                </span>
                {!busy && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {mode === "signup" && (
              <p className="text-[10.5px] text-center text-[#5A3D4D]/55 mt-4 leading-relaxed">
                we&apos;ll ask a few quick questions about your age, allergies, diet and goals so
                fridgemate can personalise everything for you 🎀
              </p>
            )}
          </div>

          <p className="text-center text-[10.5px] text-[#5A3D4D]/55 mt-5 font-medium max-w-sm mx-auto leading-relaxed">
            🔒 Your account is securely managed by Supabase. Your fridge data is linked to your account.
          </p>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  icon: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-[#5A3D4D]/70 block mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
        <input
          type={type}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full pl-9 pr-3 py-2.5 rounded-2xl border-2 border-[#FFD1E3] bg-white text-sm font-semibold focus:outline-none focus:border-[#FF8FB3] transition-colors"
        />
      </div>
    </div>
  );
}
