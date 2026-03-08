import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFollowedUsers, getFollowRequests, getFollowers } from "@/actions/social";
import { FollowingClient } from "./following-client";

export default async function FollowingPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const [followedUsers, followRequests, followers] = await Promise.all([
    getFollowedUsers(),
    getFollowRequests(),
    getFollowers(),
  ]);

  return (
    <FollowingClient
      followedUsers={followedUsers}
      followRequests={followRequests}
      followers={followers}
    />
  );
}
