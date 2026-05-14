"use client";

import { useEffect, useReducer, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Lock, Loader2, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

type SubmitState =
  | { status: "idle"; error: string }
  | { status: "submitting"; error: "" }
  | { status: "error"; error: string }
  | { status: "success"; error: "" };

type SubmitAction = { type: "submit" } | { type: "error"; message: string } | { type: "success" };

function submitReducer(_state: SubmitState, action: SubmitAction): SubmitState {
  switch (action.type) {
    case "submit":
      return { status: "submitting", error: "" };
    case "error":
      return { status: "error", error: action.message };
    case "success":
      return { status: "success", error: "" };
  }
}

function ResetPasswordForm() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submit, dispatch] = useReducer(submitReducer, { status: "idle", error: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirm) {
      dispatch({ type: "error", message: "Passwords do not match." });
      return;
    }
    if (password.length < 6) {
      dispatch({ type: "error", message: "Password must be at least 6 characters." });
      return;
    }

    dispatch({ type: "submit" });
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });

      if (result.error) {
        dispatch({ type: "error", message: result.error.message ?? "Failed to reset password." });
        return;
      }

      dispatch({ type: "success" });
    } catch {
      dispatch({ type: "error", message: "Something went wrong. Please try again." });
    }
  };

  useEffect(() => {
    if (submit.status !== "success") return;
    const timeoutId = window.setTimeout(() => push("/auth"), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [push, submit.status]);

  if (submit.status === "success") {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 text-center">
        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="size-8 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold text-stone-800 mb-2">Password reset!</h2>
        <p className="text-stone-500 text-sm">Redirecting you to sign in…</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50">
      <div className="size-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6">
        <Lock className="size-7 text-white" />
      </div>

      <h1 className="text-2xl font-semibold text-stone-800 text-center mb-1">New Password</h1>
      <p className="text-stone-400 text-sm text-center mb-6">
        Enter and confirm your new password.
      </p>

      {submit.error && (
        <p className="text-rose-500 text-sm bg-rose-50 rounded-2xl p-3 mb-4">{submit.error}</p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition"
          />
        </div>

        <button
          type="submit"
          disabled={submit.status === "submitting" || !token}
          className="gradient-bg-vibrant text-white font-bold py-3.5 rounded-[1.75rem] flex items-center justify-center gap-2 mt-1 disabled:opacity-70 transition"
        >
          {submit.status === "submitting" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-[3rem] p-10 text-center text-stone-400">Loading…</div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
