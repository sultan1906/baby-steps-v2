import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCoParentInvitePreview } from "@/actions/baby-invites";
import { CoParentAcceptClient } from "./coparent-accept-client";
import { InviteErrorView } from "@/app/invite/[token]/invite-error-view";

export const metadata: Metadata = {
  title: "Co-parent invite — Baby Steps",
  description: "Accept your invite to co-parent on Baby Steps.",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
}

export default async function CoParentInvitePage({ params }: Props) {
  const { token } = await params;
  const preview = await getCoParentInvitePreview(token);

  if (preview.status !== "valid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <InviteErrorView status={preview.status} />
      </div>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <CoParentAcceptClient token={token} preview={preview} isSignedIn={!!session} />
    </div>
  );
}
