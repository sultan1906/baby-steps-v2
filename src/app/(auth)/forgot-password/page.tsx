"use client";

import { useState } from "react";
import { Mail, ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (authClient as any).forgetPassword({
        email,
        redirectTo: "/auth/reset-password",
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
          <MailCheck className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-stone-800 mb-2">Reset link sent</h2>
        <p className="text-stone-500 text-sm">
          Check your inbox at <span className="font-medium text-stone-700">{email}</span> for the
          reset link.
        </p>
        <a
          href="/auth"
          className="block mt-6 text-xs text-stone-400 hover:text-stone-600 transition-colors"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 relative">
      <a
        href="/auth"
        className="absolute top-6 left-6 w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400 hover:text-stone-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
      </a>

      <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center mx-auto mb-6 mt-4">
        <Mail className="w-7 h-7 text-white" />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 text-center mb-1">Forgot Password?</h1>
      <p className="text-stone-400 text-sm text-center mb-6 leading-relaxed">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      {error && <p className="text-rose-500 text-sm bg-rose-50 rounded-2xl p-3 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

        <button
          type="submit"
          disabled={loading}
          className="gradient-bg-vibrant text-white font-bold py-3.5 rounded-[1.75rem] flex items-center justify-center gap-2 mt-1 disabled:opacity-70 transition"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
