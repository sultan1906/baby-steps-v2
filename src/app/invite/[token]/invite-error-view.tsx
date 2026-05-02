import Link from "next/link";
import { AlertCircle } from "lucide-react";
import type { InvitePreviewStatus } from "@/types";

const MESSAGES: Record<Exclude<InvitePreviewStatus, "valid">, { title: string; body: string }> = {
  not_found: {
    title: "Invite not found",
    body: "This invite link is invalid. Ask the person who sent it to share a new one.",
  },
  expired: {
    title: "Invite expired",
    body: "This invite has expired. Ask the person who sent it to share a new one.",
  },
  revoked: {
    title: "Invite no longer valid",
    body: "This invite was cancelled by the person who sent it.",
  },
  accepted: {
    title: "Invite already used",
    body: "This invite has already been accepted.",
  },
};

export function InviteErrorView({ status }: { status: Exclude<InvitePreviewStatus, "valid"> }) {
  const { title, body } = MESSAGES[status];
  return (
    <div className="w-full max-w-sm">
      <div className="premium-card p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-stone-400" />
        </div>
        <h1 className="text-lg font-bold text-stone-800 mb-2">{title}</h1>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">{body}</p>
        <Link
          href="/auth"
          className="inline-block px-6 py-2.5 rounded-xl gradient-bg-vibrant text-white text-sm font-bold transition-transform active:scale-95"
        >
          Open Baby Steps
        </Link>
      </div>
    </div>
  );
}
