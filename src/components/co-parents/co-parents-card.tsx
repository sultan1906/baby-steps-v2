"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, UserPlus, Link2, Loader2, X, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/social/user-avatar";
import { listCoParentsForBaby, removeCoParent } from "@/actions/baby";
import {
  createCoParentEmailInvite,
  createCoParentLinkInvite,
  listCoParentInvites,
  revokeCoParentInvite,
} from "@/actions/baby-invites";
import { InviteCoParentDialog } from "./invite-coparent-dialog";
import type { CoParent } from "@/lib/baby-access";
import type { PendingCoParentInviteItem } from "@/types";

interface Props {
  babyId: string;
  babyName: string;
}

interface OwnerInfo {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function CoParentsCard({ babyId, babyName }: Props) {
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [owner, setOwner] = useState<OwnerInfo | null>(null);
  const [coParents, setCoParents] = useState<CoParent[]>([]);
  const [invites, setInvites] = useState<PendingCoParentInviteItem[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listCoParentsForBaby(babyId);
      setIsOwner(data.isOwner);
      setOwner(data.owner ?? null);
      setCoParents(data.coParents);
      if (data.isOwner) {
        const list = await listCoParentInvites(babyId);
        setInvites(list);
      } else {
        setInvites([]);
      }
    } catch (err) {
      console.error("Failed to load co-parents", err);
    } finally {
      setLoading(false);
    }
  }, [babyId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} as a co-parent?`)) return;
    setRemovingId(userId);
    try {
      await removeCoParent(babyId, userId);
      toast.success(`${name} removed`);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove co-parent");
    } finally {
      setRemovingId(null);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      await revokeCoParentInvite(inviteId);
      toast.success("Invite revoked");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't revoke invite");
    } finally {
      setRevokingId(null);
    }
  };

  const copyLink = async (inviteId: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedInviteId(inviteId);
      setTimeout(() => setCopiedInviteId(null), 1800);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  return (
    <div className="premium-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-rose-500" />
          <h2 className="font-semibold text-stone-800">Co-parents</h2>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl gradient-bg-vibrant text-white text-xs font-semibold transition-transform active:scale-95"
          >
            <UserPlus className="size-3.5" />
            Invite
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="size-5 animate-spin text-stone-400" />
        </div>
      ) : (
        <div className="space-y-2">
          {owner && (
            <div className="flex items-center gap-3 py-2">
              <UserAvatar name={owner.name} image={owner.image} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{owner.name}</p>
                <p className="text-xs text-stone-500 truncate">{owner.email}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                Owner
              </span>
            </div>
          )}

          {coParents.map((cp) => (
            <div key={cp.accessId} className="flex items-center gap-3 py-2">
              <UserAvatar name={cp.name} image={cp.image} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-800 truncate">{cp.name}</p>
                <p className="text-xs text-stone-500 truncate">{cp.email}</p>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                Co-parent
              </span>
              {isOwner && (
                <button
                  onClick={() => handleRemove(cp.userId, cp.name)}
                  disabled={removingId === cp.userId}
                  className="size-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-rose-500 transition-colors disabled:opacity-50"
                  aria-label={`Remove ${cp.name}`}
                >
                  {removingId === cp.userId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                </button>
              )}
            </div>
          ))}

          {isOwner && invites.length > 0 && (
            <div className="pt-3 mt-2 border-t border-stone-100 space-y-2">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Pending invites
              </p>
              {invites.map((inv) => (
                <div key={inv.id} className="flex items-center gap-3 py-1.5">
                  <div className="size-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                    {inv.kind === "email" ? (
                      <UserPlus className="size-3.5" />
                    ) : (
                      <Link2 className="size-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700 truncate">
                      {inv.kind === "email" ? inv.email : "Shareable link"}
                    </p>
                    <p className="text-xs text-stone-400">
                      {inv.isExpired ? "Expired" : "Pending"}
                    </p>
                  </div>
                  {inv.kind === "link" && (
                    <button
                      onClick={() => copyLink(inv.id, inv.url)}
                      className="size-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                      aria-label="Copy invite link"
                    >
                      {copiedInviteId === inv.id ? (
                        <Check className="size-3.5 text-green-500" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleRevoke(inv.id)}
                    disabled={revokingId === inv.id}
                    className="size-7 rounded-full flex items-center justify-center text-stone-400 hover:bg-stone-50 hover:text-rose-500 transition-colors disabled:opacity-50"
                    aria-label="Revoke invite"
                  >
                    {revokingId === inv.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!isOwner && coParents.length === 0 && (
            <p className="text-sm text-stone-400 py-2">
              Only the owner can manage co-parents on this baby.
            </p>
          )}
        </div>
      )}

      <InviteCoParentDialog
        open={showInvite}
        onOpenChange={setShowInvite}
        babyId={babyId}
        babyName={babyName}
        createEmailInvite={async (email) => {
          await createCoParentEmailInvite(babyId, email);
        }}
        createLinkInvite={async () => {
          const { url } = await createCoParentLinkInvite(babyId);
          return url;
        }}
        onCreated={reload}
      />
    </div>
  );
}
