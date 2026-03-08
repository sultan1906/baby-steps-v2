"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Search, Users, UserCheck, Bell, UserX, UserMinus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserSearch } from "@/components/social/user-search";
import { FollowedUserCard } from "@/components/social/followed-user-card";
import { FollowRequestCard } from "@/components/social/follow-request-card";
import { UserAvatar } from "@/components/social/user-avatar";
import { removeFollower } from "@/actions/social";
import { toast } from "sonner";
import type { FollowedUser, FollowRequestItem } from "@/types";

type Tab = "search" | "following" | "followers" | "requests";

type Follower = { id: string; followerId: string; name: string; image: string | null };

interface FollowingClientProps {
  followedUsers: FollowedUser[];
  followRequests: FollowRequestItem[];
  followers: Follower[];
}

export function FollowingClient({
  followedUsers,
  followRequests: initialRequests,
  followers: initialFollowers,
}: FollowingClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>(
    initialRequests.length > 0 ? "requests" : "following"
  );
  const [requests, setRequests] = useState(initialRequests);
  const [followed, setFollowed] = useState(() => followedUsers);
  const [followers, setFollowers] = useState(initialFollowers);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => setRequests(initialRequests), [initialRequests]);
  useEffect(() => setFollowed(followedUsers), [followedUsers]);
  useEffect(() => setFollowers(initialFollowers), [initialFollowers]);

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

  const tabs: { id: Tab; label: string; icon: typeof Search; badge?: number }[] = [
    { id: "search", label: "Search", icon: Search },
    { id: "following", label: "Following", icon: Users },
    { id: "followers", label: "Followers", icon: UserCheck },
    {
      id: "requests",
      label: "Requests",
      icon: Bell,
      badge: requests.length > 0 ? requests.length : undefined,
    },
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
                {tab.badge && (
                  <span className="absolute -top-0.5 right-2 w-5 h-5 gradient-bg-vibrant rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pb-28 pt-4">
        {/* Search tab */}
        {activeTab === "search" && <UserSearch onFollowChange={() => router.refresh()} />}

        {/* Following tab */}
        {activeTab === "following" && (
          <div>
            {followed.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-stone-400">
                <Users className="w-12 h-12 mb-3" />
                <p className="font-medium text-stone-500">Not following anyone yet</p>
                <p className="text-sm mt-1">Search for people to follow</p>
                <button
                  onClick={() => handleTabChange("search")}
                  className="mt-4 px-6 py-2.5 gradient-bg-vibrant text-white rounded-xl font-medium text-sm transition-transform active:scale-95"
                >
                  Find People
                </button>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {followed.map((user) => (
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

        {/* Followers tab */}
        {activeTab === "followers" && (
          <div>
            {followers.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-stone-400">
                <UserCheck className="w-12 h-12 mb-3" />
                <p className="font-medium text-stone-500">No followers yet</p>
                <p className="text-sm mt-1">When someone follows you, they&apos;ll appear here</p>
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

        {/* Requests tab */}
        {activeTab === "requests" && (
          <div>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-stone-400">
                <UserX className="w-12 h-12 mb-3" />
                <p className="font-medium text-stone-500">No pending requests</p>
                <p className="text-sm mt-1">
                  When someone requests to follow you, it&apos;ll show up here
                </p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {requests.map((request) => (
                  <FollowRequestCard
                    key={request.id}
                    request={request}
                    onHandled={() => setRequests((prev) => prev.filter((r) => r.id !== request.id))}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
