import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFollowedUsers, getFollowedUserTimeline } from "@/actions/social";
import { FollowedTimelineClient } from "@/components/social/followed-timeline-client";

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ babyId?: string }>;
}

export default async function FollowedUserPage({ params, searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth");

  const { userId } = await params;
  const { babyId } = await searchParams;

  // Get the target user info from followed users
  const followedUsers = await getFollowedUsers();
  const targetUser = followedUsers.find((u) => u.id === userId);

  if (!targetUser || targetUser.babies.length === 0) {
    redirect("/following");
  }

  const selectedBabyId = babyId ?? targetUser.babies[0].id;

  let timeline;
  try {
    timeline = await getFollowedUserTimeline(userId, selectedBabyId);
  } catch {
    redirect("/following");
  }

  return (
    <FollowedTimelineClient
      targetUser={{
        id: targetUser.id,
        name: targetUser.name,
        image: targetUser.image,
      }}
      baby={timeline.baby}
      steps={timeline.steps}
      descriptions={timeline.descriptions}
      babies={targetUser.babies}
    />
  );
}
