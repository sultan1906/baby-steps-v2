import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFollowedUsers, getFollowers } from "@/actions/social";
import { listMyInvites } from "@/actions/invites";
import { FollowingClient } from "./following-client";

export default async function FollowingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const [followedUsers, followers, pendingInvites] = await Promise.all([
    getFollowedUsers(),
    getFollowers(),
    listMyInvites(),
  ]);

  return (
    <FollowingClient
      followedUsers={followedUsers}
      followers={followers}
      pendingInvites={pendingInvites}
    />
  );
}
