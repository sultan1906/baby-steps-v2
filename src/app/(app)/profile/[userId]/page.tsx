import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getUserProfile } from "@/actions/social";
import { ProfileClient } from "./profile-client";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  // If viewing own profile, redirect to settings
  if (userId === session.user.id) redirect("/settings");

  const profile = await getUserProfile(userId);
  if (!profile) redirect("/following");

  return <ProfileClient profile={profile} />;
}
