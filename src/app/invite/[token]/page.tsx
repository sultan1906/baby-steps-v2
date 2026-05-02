import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getInvitePreview } from "@/actions/invites";
import { InviteAcceptClient } from "./invite-accept-client";
import { InviteErrorView } from "./invite-error-view";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const preview = await getInvitePreview(token);

  if (preview.status !== "valid") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <InviteErrorView status={preview.status} />
      </div>
    );
  }

  // The pending_invite_token cookie for unauthenticated viewers is set by the
  // middleware (src/proxy.ts), since cookie writes from server-component
  // render are unreliable in Next.js 15+.
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <InviteAcceptClient token={token} preview={preview} isSignedIn={!!session} />
    </div>
  );
}
