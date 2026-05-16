"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  babyName: string;
  createEmailInvite: (email: string) => Promise<void>;
  createLinkInvite: () => Promise<string>;
  onCreated: () => Promise<void> | void;
}

type Mode = "email" | "link";

export function InviteCoParentDialog({
  open,
  onOpenChange,
  babyName,
  createEmailInvite,
  createLinkInvite,
  onCreated,
}: Props) {
  const [mode, setMode] = useState<Mode>("email");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && mode === "email") {
      const t = setTimeout(() => emailInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, mode]);

  const reset = () => {
    setMode("email");
    setEmail("");
    setSubmitting(false);
    setLinkUrl(null);
    setCopied(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await createEmailInvite(email.trim());
      toast.success(`Invite sent to ${email.trim()}`);
      await onCreated();
      handleOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send invite");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLink = async () => {
    setSubmitting(true);
    try {
      const url = await createLinkInvite();
      setLinkUrl(url);
      await onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create link");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Invite a co-parent</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-stone-500">
          They&apos;ll be able to upload, edit and organise memories on{" "}
          <span className="font-medium text-stone-700">{babyName}</span>.
        </p>

        <div className="flex gap-2 p-1 bg-stone-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode("email")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors",
              mode === "email" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"
            )}
          >
            <Mail className="size-3.5" />
            Email
          </button>
          <button
            type="button"
            onClick={() => setMode("link")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-colors",
              mode === "link" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500"
            )}
          >
            <Link2 className="size-3.5" />
            Link
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={handleEmail} className="flex flex-col gap-3">
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="co-parent@example.com"
              required
              className="w-full px-4 h-11 rounded-xl bg-stone-50 border border-stone-200 text-sm placeholder:text-stone-400 outline-none transition focus:bg-white focus:border-rose-300"
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className={cn(
                  "px-5 h-9 rounded-md text-sm font-semibold text-white shadow transition flex items-center gap-1.5",
                  submitting || !email.trim()
                    ? "bg-stone-300 cursor-not-allowed"
                    : "gradient-bg-vibrant hover:opacity-90"
                )}
              >
                {submitting && <Loader2 className="size-3.5 animate-spin" />}
                Send invite
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-3">
            {linkUrl ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <Link2 className="size-4 text-stone-400 shrink-0" />
                  <code className="flex-1 text-xs text-stone-700 truncate">{linkUrl}</code>
                  <button
                    onClick={copy}
                    className="size-7 rounded-full flex items-center justify-center text-stone-500 hover:bg-white"
                    aria-label="Copy link"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-green-500" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-stone-400">
                  Anyone with this link can join as a co-parent. Revoke it from the invites list if
                  you change your mind.
                </p>
                <div className="flex justify-end">
                  <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-stone-500">
                  Generate a shareable link that&apos;s valid for 24 hours.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleOpenChange(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={handleLink}
                    disabled={submitting}
                    className={cn(
                      "px-5 h-9 rounded-md text-sm font-semibold text-white shadow transition flex items-center gap-1.5",
                      submitting
                        ? "bg-stone-300 cursor-not-allowed"
                        : "gradient-bg-vibrant hover:opacity-90"
                    )}
                  >
                    {submitting && <Loader2 className="size-3.5 animate-spin" />}
                    Generate link
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
