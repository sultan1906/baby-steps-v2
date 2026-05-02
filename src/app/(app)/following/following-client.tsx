"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Mail, Users, UserCheck, UserMinus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { InviteTab } from "@/components/social/invite-tab";
import { FollowedUserCard } from "@/components/social/followed-user-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { removeFollower } from "@/actions/social";
import { toast } from "sonner";
import type { FollowedUser, PendingInviteItem } from "@/types";

type Tab = "invite" | "following" | "followers";

type Follower = { id: string; followerId: string; name: string; image: string | null };

interface FollowingClientProps {
  followedUsers: FollowedUser[];
  followers: Follower[];
  pendingInvites: PendingInviteItem[];
}

export function FollowingClient({
  followedUsers,
  followers: initialFollowers,
  pendingInvites,
}: FollowingClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("following");
  const [followed, setFollowed] = useState(() => followedUsers);
  const [followers, setFollowers] = useState(initialFollowers);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [followingFilter, setFollowingFilter] = useState("");

  useEffect(() => setFollowed(followedUsers), [followedUsers]);
  useEffect(() => setFollowers(initialFollowers), [initialFollowers]);

  const filteredFollowed = useMemo(() => {
    const q = followingFilter.trim().toLowerCase();
    if (!q) return followed;
    return followed.filter((u) => u.name.toLowerCase().includes(q));
  }, [followed, followingFilter]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "following" || tab === "followers") {
      router.refresh();
    }
  };

  const handleRemoveFollower = async (followId: string) => {
    setRemovingId(followId);
    try {
      await removeFollower(followId);
      setFollowers((prev) => prev.filter((f) => f.id !== followId));
    } catch {
      toast.error("Failed to remove follower. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Mail }[] = [
    { id: "invite", label: "Invite", icon: Mail },
    { id: "following", label: "Following", icon: Users },
    { id: "followers", label: "Followers", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.push("/timeline")}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-bold text-stone-800 text-lg">People</h1>
        </div>

        {/* Tab bar */}
        <div className="flex px-4 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium border-b-2 transition-colors relative",
                  activeTab === tab.id
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-28 pt-4">
        {/* Invite tab */}
        {activeTab === "invite" && <InviteTab initialInvites={pendingInvites} />}

        {/* Following tab */}
        {activeTab === "following" && (
          <div>
            {followed.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-stone-400">
                <Users className="w-12 h-12 mb-3" />
                <p className="font-medium text-stone-500">Not following anyone yet</p>
                <p className="text-sm mt-1">Send an invite to connect</p>
                <button
                  onClick={() => handleTabChange("invite")}
                  className="mt-4 px-6 py-2.5 gradient-bg-vibrant text-white rounded-xl font-medium text-sm transition-transform active:scale-95"
                >
                  Invite people
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={followingFilter}
                    onChange={(e) => setFollowingFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
                  />
                </div>
                {filteredFollowed.length === 0 ? (
                  <div className="text-center py-8 text-stone-400 text-sm">No matches</div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {filteredFollowed.map((user) => (
                      <FollowedUserCard
                        key={user.id}
                        user={user}
                        onUnfollow={(id) => setFollowed((prev) => prev.filter((u) => u.id !== id))}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Followers tab */}
        {activeTab === "followers" && (
          <div>
            {followers.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-stone-400">
                <UserCheck className="w-12 h-12 mb-3" />
                <p className="font-medium text-stone-500">No followers yet</p>
                <p className="text-sm mt-1">
                  When someone accepts your invite, they&apos;ll appear here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {followers.map((follower) => (
                  <div key={follower.id} className="flex items-center gap-3 py-3">
                    <UserAvatar name={follower.name} image={follower.image} size={44} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 truncate">{follower.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveFollower(follower.id)}
                      disabled={removingId === follower.id}
                      aria-label={`Remove ${follower.name}`}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
