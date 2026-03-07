"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Globe, Lock, Loader2, Users, UserMinus, UserX } from "lucide-react";
import { UserAvatar } from "@/components/social/user-avatar";
import {
  toggleProfilePrivacy,
  getProfilePrivacy,
  getFollowers,
  getFollowedUsers,
  removeFollower,
  unfollowUser,
} from "@/actions/social";
import type { FollowedUser } from "@/types";

export default function PrivacyPage() {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [followers, setFollowers] = useState<
    { id: string; followerId: string; name: string; image: string | null }[]
  >([]);
  const [following, setFollowing] = useState<FollowedUser[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [privacy, followersList, followingList] = await Promise.all([
          getProfilePrivacy(),
          getFollowers(),
          getFollowedUsers(),
        ]);
        setIsPublic(privacy);
        setFollowers(followersList);
        setFollowing(followingList);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    const newValue = !isPublic;
    try {
      await toggleProfilePrivacy(newValue);
      setIsPublic(newValue);
    } finally {
      setToggling(false);
    }
  };

  const handleRemoveFollower = async (followId: string) => {
    try {
      await removeFollower(followId);
      setFollowers((prev) => prev.filter((f) => f.id !== followId));
    } catch {
      // Silently fail — user can retry
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId);
      setFollowing((prev) => prev.filter((f) => f.id !== userId));
    } catch {
      // Silently fail — user can retry
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            aria-label="Back to settings"
            onClick={() => router.push("/settings")}
            className="w-8 h-8 rounded-xl bg-stone-100 flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Shield className="w-5 h-5 text-blue-500" />
          <h1 className="font-bold text-stone-800 text-lg">Privacy & Security</h1>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 space-y-4">
        {/* Profile Visibility Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            {isPublic ? (
              <Globe className="w-5 h-5 text-emerald-500" />
            ) : (
              <Lock className="w-5 h-5 text-amber-500" />
            )}
            <h2 className="font-bold text-stone-800">Profile Visibility</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-sm font-medium text-stone-700">
                {isPublic ? "Public Profile" : "Private Profile"}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {isPublic
                  ? "Anyone can follow you without approval"
                  : "You'll need to approve new follow requests"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isPublic}
              aria-label="Profile visibility"
              onClick={handleToggle}
              disabled={toggling}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isPublic ? "bg-emerald-400" : "bg-amber-400"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isPublic ? "left-5" : "left-0.5"
                }`}
              />
              {toggling && (
                <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Followers Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-stone-800">
              Followers{" "}
              <span className="text-stone-400 font-normal text-sm">({followers.length})</span>
            </h2>
          </div>

          {followers.length === 0 ? (
            <p className="text-sm text-stone-400 py-2">No followers yet</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {followers.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={f.name} image={f.image} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate text-sm">{f.name}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFollower(f.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 bg-stone-50 hover:bg-red-50 hover:text-red-500 border border-stone-200 hover:border-red-200 transition-colors"
                  >
                    <UserMinus className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Following Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            <h2 className="font-bold text-stone-800">
              Following{" "}
              <span className="text-stone-400 font-normal text-sm">({following.length})</span>
            </h2>
          </div>

          {following.length === 0 ? (
            <p className="text-sm text-stone-400 py-2">Not following anyone yet</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {following.map((f) => (
                <div key={f.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={f.name} image={f.image} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 truncate text-sm">{f.name}</p>
                    <p className="text-xs text-stone-400">
                      {f.babies.length} {f.babies.length === 1 ? "baby" : "babies"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleUnfollow(f.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 bg-stone-50 hover:bg-red-50 hover:text-red-500 border border-stone-200 hover:border-red-200 transition-colors"
                  >
                    <UserX className="w-3 h-3" />
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
