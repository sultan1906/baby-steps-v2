"use client";

import { useState, useTransition } from "react";
import { Mail, Send, Loader2, Link2, Copy, Check, Trash2, Inbox } from "lucide-react";
import { toast } from "sonner";
import { createEmailInvite, createLinkInvite, revokeInvite } from "@/actions/invites";
import { useRouter } from "next/navigation";
import type { PendingInviteItem } from "@/types";

interface Props {
  initialInvites: PendingInviteItem[];
}

export function InviteTab({ initialInvites }: Props) {
  const router = useRouter();
  const [invites, setInvites] = useState(initialInvites);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const activeLinkInvite = invites.find((i) => i.kind === "link" && !i.isExpired);

  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Enter an email address");
      return;
    }
    setSending(true);
    try {
      const { status } = await createEmailInvite(trimmed);
      toast.success(
        status === "resent" ? `Invite resent to ${trimmed}` : `Invite sent to ${trimmed}`
      );
      setEmail("");
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send invite";
      setEmailError(msg);
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success("Invite link copied");
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy manually.");
    }
  };

  const handleCopyLink = async () => {
    if (activeLinkInvite) {
      await copyToClipboard(activeLinkInvite.url);
      return;
    }
    setGeneratingLink(true);
    try {
      const { url } = await createLinkInvite();
      await copyToClipboard(url);
      refresh();
    } catch {
      toast.error("Couldn't generate invite link. Try again.");
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setInvites((prev) => prev.filter((i) => i.id !== id));
    try {
      await revokeInvite(id);
      toast.success("Invite revoked");
      refresh();
    } catch {
      toast.error("Couldn't revoke invite. Refresh and try again.");
      refresh();
    }
  };

  const formatExpiry = (expiresAt: Date, isExpired: boolean) => {
    if (isExpired) return "Expired";
    const ms = new Date(expiresAt).getTime() - Date.now();
    const hours = Math.max(0, Math.floor(ms / (1000 * 60 * 60)));
    if (hours <= 0) {
      const mins = Math.max(0, Math.floor(ms / (1000 * 60)));
      return `Expires in ${mins}m`;
    }
    return `Expires in ${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Email invite form */}
      <div>
        <h2 className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-1.5">
          <Mail className="w-4 h-4" />
          Invite by email
        </h2>
        <form onSubmit={handleSendEmail} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              placeholder="friend@example.com"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="flex-1 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
            />
            <button
              type="submit"
              disabled={sending || !email.trim()}
              className="px-4 py-2.5 rounded-xl gradient-bg-vibrant text-white font-bold text-sm flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send
                </>
              )}
            </button>
          </div>
          {emailError && <p className="text-xs text-red-500 px-1">{emailError}</p>}
          <p className="text-xs text-stone-400 px-1">
            We&apos;ll email a link that expires in 24 hours.
          </p>
        </form>
      </div>

      {/* Link invite */}
      <div>
        <h2 className="text-sm font-bold text-stone-700 mb-2 flex items-center gap-1.5">
          <Link2 className="w-4 h-4" />
          Or share a link
        </h2>
        <button
          onClick={handleCopyLink}
          disabled={generatingLink}
          className="w-full px-4 py-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-800 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-stone-100 disabled:opacity-50"
        >
          {generatingLink ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              {activeLinkInvite ? "Copy invite link" : "Generate & copy invite link"}
            </>
          )}
        </button>
        <p className="text-xs text-stone-400 px-1 mt-2">
          A reusable link — share over WhatsApp, iMessage, or anywhere. Each person who opens it
          becomes connected to you. Expires in 24 hours.
        </p>
      </div>

      {/* Pending invites */}
      <div>
        <h2 className="text-sm font-bold text-stone-700 mb-2">Pending invites</h2>
        {invites.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-stone-400 border border-dashed border-stone-200 rounded-xl">
            <Inbox className="w-8 h-8 mb-2" />
            <p className="text-sm">No pending invites</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl overflow-hidden">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-3 py-3 bg-white">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                  {inv.kind === "email" ? (
                    <Mail className="w-4 h-4 text-stone-500" />
                  ) : (
                    <Link2 className="w-4 h-4 text-stone-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    {inv.kind === "email" ? inv.email : "Shareable link"}
                  </p>
                  <p className={`text-xs ${inv.isExpired ? "text-red-400" : "text-stone-400"}`}>
                    {formatExpiry(inv.expiresAt, inv.isExpired)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(inv.id)}
                  aria-label="Revoke invite"
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
