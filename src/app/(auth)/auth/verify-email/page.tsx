"use client";

import { useState } from "react";
import { MailCheck, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setResending(true);
    setError("");

    try {
      await authClient.sendVerificationEmail({
        email: "", // user needs to be signed in or provide email
        callbackURL: "/timeline",
      });
      setResent(true);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 text-center">
      <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6">
        <MailCheck className="w-8 h-8 text-rose-500" />
      </div>

      <h1 className="text-2xl font-bold text-stone-800 mb-2">Check your inbox</h1>
      <p className="text-stone-500 text-sm leading-relaxed mb-8">
        We sent a verification link to your email address. Click the link to verify your account and
        get started.
      </p>

      {error && <p className="text-rose-500 text-sm mb-4">{error}</p>}

      {resent ? (
        <p className="text-green-600 text-sm font-medium">Email resent successfully!</p>
      ) : (
        <button
          onClick={handleResend}
          disabled={resending}
          className="text-sm text-stone-500 hover:text-rose-500 transition-colors flex items-center gap-2 mx-auto"
        >
          {resending && <Loader2 className="w-4 h-4 animate-spin" />}
          Resend verification email
        </button>
      )}

      <a
        href="/auth"
        className="block mt-4 text-xs text-stone-400 hover:text-stone-600 transition-colors"
      >
        Back to sign in
      </a>
    </div>
  );
}
