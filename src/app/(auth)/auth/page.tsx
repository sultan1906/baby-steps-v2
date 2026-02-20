"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  MailCheck,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { listBabies } from "@/actions/baby";

type AuthState = "signin" | "signup" | "baby-picker";
type Baby = { id: string; name: string; birthdate: string; photoUrl?: string | null };

export default function AuthPage() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [babies, setBabies] = useState<Baby[]>([]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        if (result.error.code === "EMAIL_NOT_VERIFIED") {
          setError("Please verify your email before signing in.");
        } else {
          setError(result.error.message ?? "Sign in failed");
        }
        return;
      }

      // Check if user has babies → picker or onboarding
      const userBabies = await listBabies();
      if (userBabies.length > 1) {
        setBabies(userBabies as Baby[]);
        setState("baby-picker");
      } else {
        router.push(userBabies.length === 1 ? "/timeline" : "/onboarding");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
        return;
      }

      setEmailSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/timeline",
    });
  };

  const handleBabySelect = (babyId: string) => {
    // Cookie is set by switchBaby action — just navigate
    document.cookie = `babysteps_current_baby=${babyId}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    router.push("/timeline");
  };

  // ── Baby Picker State ──────────────────────────────────────────────────────
  if (state === "baby-picker") {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50">
        <h1 className="text-2xl font-bold text-stone-800 mb-2">Select Baby</h1>
        <p className="text-stone-400 text-sm mb-6">Choose who to view</p>
        <div className="flex flex-col gap-3">
          {babies.map((b) => (
            <button
              key={b.id}
              onClick={() => handleBabySelect(b.id)}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-stone-100 hover:border-rose-200 transition-colors text-left"
            >
              <div className="w-12 h-12 rounded-2xl gradient-bg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {b.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-stone-800">{b.name}</div>
                <div className="text-xs text-stone-400">Born {b.birthdate}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
          ))}
          <button
            onClick={() => router.push("/onboarding")}
            className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-stone-200 text-stone-400 hover:border-rose-300 hover:text-rose-400 transition-colors text-sm"
          >
            Add another baby
          </button>
        </div>
      </div>
    );
  }

  // ── Email Sent Banner ──────────────────────────────────────────────────────
  if (emailSent) {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Check your inbox</h2>
        <p className="text-stone-500 text-sm">
          We sent a verification link to <span className="font-medium text-stone-700">{email}</span>
        </p>
        <button
          onClick={() => {
            setEmailSent(false);
            setState("signin");
          }}
          className="mt-6 text-sm text-stone-400 hover:text-stone-600"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  const isSignUp = state === "signup";

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50">
      {/* Heading */}
      <h1 className="text-2xl font-bold text-stone-800 mb-1">
        {isSignUp ? "Create Account" : "Welcome Back"}
      </h1>
      <p className="text-xs text-stone-400 uppercase tracking-widest font-medium mb-6">
        {isSignUp ? "Start your journey" : "Sign in to continue"}
      </p>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-4 text-sm text-rose-600"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="flex flex-col gap-3">
        {/* Name (sign up only) */}
        {isSignUp && (
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
            />
          </div>
        )}

        {/* Email */}
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
        </div>

        {/* Forgot password */}
        {!isSignUp && (
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="gradient-bg-vibrant text-white font-bold py-3.5 rounded-[1.75rem] flex items-center justify-center gap-2 mt-1 disabled:opacity-70 transition"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isSignUp ? "Create Account" : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-stone-100" />
        <span className="text-xs text-stone-400">Or continue with</span>
        <div className="flex-1 h-px bg-stone-100" />
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-stone-50 hover:bg-stone-100 border border-stone-200 py-3 rounded-2xl text-stone-700 font-medium text-sm transition"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Toggle */}
      <p className="text-center text-sm text-stone-500 mt-5">
        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
        <button
          onClick={() => {
            setState(isSignUp ? "signin" : "signup");
            setError("");
          }}
          className="text-rose-500 font-semibold hover:underline"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </p>
    </div>
  );
}
