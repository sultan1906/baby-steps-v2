"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  Camera,
  Trash2,
  LogOut,
  Bell,
  Shield,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { BackButton } from "@/components/shared/back-button";
import { useBaby } from "@/components/baby/baby-provider";
import { updateBaby, deleteBaby } from "@/actions/baby";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { baby } = useBaby();

  const [name, setName] = useState(baby.name);
  const [birthdate, setBirthdate] = useState(baby.birthdate);
  const [photoPreview, setPhotoPreview] = useState<string | null>(baby.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const hasChanges = name !== baby.name || birthdate !== baby.birthdate || photoFile !== null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let photoUrl = baby.photoUrl ?? undefined;

      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          photoUrl = data.url;
        }
      }

      await updateBaby(baby.id, {
        name: name.trim(),
        birthdate,
        photoUrl,
      });

      setSaved(true);
      setPhotoFile(null);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteBaby(baby.id);
      router.push("/timeline");
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-stone-100/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <BackButton />
          <h1 className="font-bold text-stone-800 text-lg">Settings</h1>
        </div>
      </div>

      <div className="px-4 pb-28 pt-4 space-y-4">
        {/* Baby Profile Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Heart className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-stone-800">Baby Profile</h2>
          </div>

          {/* Avatar editor */}
          <div className="flex justify-center mb-6">
            <label className="relative cursor-pointer group">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden ring-4 ring-stone-50 shadow-lg">
                {photoPreview ? (
                  <Image
                    src={photoPreview}
                    alt={baby.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-4xl">
                    {baby.name[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div
                className="absolute bottom-0 right-0 w-9 h-9 gradient-bg-vibrant rounded-2xl flex items-center justify-center border-2 border-white shadow-md"
                onClick={() => fileRef.current?.click()}
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-stone-500 font-medium block mb-1">
                Baby&apos;s Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label className="text-xs text-stone-500 font-medium block mb-1">Birth Date</label>
              <input
                type="date"
                value={birthdate}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="flex-1 gradient-bg-vibrant text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                "Saved ✓"
              ) : (
                "Save Changes"
              )}
            </button>

            <AlertDialog>
              <AlertDialogTrigger className="flex items-center gap-2 px-4 py-3 bg-stone-50 text-stone-600 rounded-2xl border border-stone-200 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-colors text-sm font-medium">
                <Trash2 className="w-4 h-4" />
                Delete
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {baby.name}&apos;s Journey?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all memories and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <button className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                  </button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Account Card */}
        <div className="premium-card p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-stone-400" />
            <h2 className="font-bold text-stone-800">Account</h2>
          </div>

          {/* Menu rows */}
          <div className="divide-y divide-stone-100">
            <div className="flex items-center py-3 cursor-pointer hover:bg-stone-50 rounded-xl px-2 -mx-2 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center mr-3">
                <Bell className="w-4 h-4 text-amber-500" />
              </div>
              <span className="flex-1 text-stone-700 font-medium">Notifications</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
            <div className="flex items-center py-3 cursor-pointer hover:bg-stone-50 rounded-xl px-2 -mx-2 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <span className="flex-1 text-stone-700 font-medium">Privacy & Security</span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 py-4 border-2 border-dashed border-stone-200 rounded-2xl text-stone-600 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout from Babysteps
          </button>
        </div>
      </div>
    </div>
  );
}
