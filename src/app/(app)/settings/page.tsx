"use client";

import { useState, useRef, useEffect } from "react";
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
  Baby as BabyIcon,
  Check,
  Plus,
  Globe,
  Lock,
  MapPin,
} from "lucide-react";
import Image from "next/image";
import { BackButton } from "@/components/shared/back-button";
import { BabyAvatar } from "@/components/baby/baby-avatar";
import { useBabyOptional } from "@/components/baby/baby-provider";
import { updateBaby, deleteBaby, switchBaby } from "@/actions/baby";
import {
  toggleProfilePrivacy,
  getProfilePrivacy,
  getParentProfile,
  updateParentProfile,
} from "@/actions/social";
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
  const ctx = useBabyOptional();
  const baby = ctx?.baby ?? null;
  const babies = ctx?.babies ?? [];

  const [name, setName] = useState(baby?.name ?? "");
  const [birthdate, setBirthdate] = useState(baby?.birthdate ?? "");
  const [photoPreview, setPhotoPreview] = useState<string | null>(baby?.photoUrl ?? null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [togglingPrivacy, setTogglingPrivacy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Parent profile state
  const [parentName, setParentName] = useState("");
  const [parentImage, setParentImage] = useState<string | null>(null);
  const [parentBio, setParentBio] = useState("");
  const [parentLocation, setParentLocation] = useState("");
  const [parentPhotoFile, setParentPhotoFile] = useState<File | null>(null);
  const [parentPhotoPreview, setParentPhotoPreview] = useState<string | null>(null);
  const [parentSaving, setParentSaving] = useState(false);
  const [parentSaved, setParentSaved] = useState(false);
  const [parentLoaded, setParentLoaded] = useState(false);
  const parentFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setBirthdate(baby.birthdate);
      setPhotoPreview(baby.photoUrl ?? null);
      setPhotoFile(null);
    }
  }, [baby]);

  useEffect(() => {
    getProfilePrivacy().then(setIsPublic);
  }, []);

  useEffect(() => {
    getParentProfile().then((p) => {
      setParentName(p.name);
      setParentImage(p.image ?? null);
      setParentPhotoPreview(p.image ?? null);
      setParentBio(p.bio ?? "");
      setParentLocation(p.location ?? "");
      setParentLoaded(true);
    });
  }, []);

  const hasChanges = baby
    ? name !== baby.name || birthdate !== baby.birthdate || photoFile !== null
    : false;

  const handleSwitchBaby = async (babyId: string) => {
    await switchBaby(babyId);
    router.refresh();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!baby) return;
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
    if (!baby) return;
    setDeleting(true);
    try {
      await deleteBaby(baby.id);
      router.push("/following");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePrivacy = async () => {
    setTogglingPrivacy(true);
    const newValue = !isPublic;
    try {
      await toggleProfilePrivacy(newValue);
      setIsPublic(newValue);
    } finally {
      setTogglingPrivacy(false);
    }
  };

  const handleParentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParentPhotoFile(file);
    setParentPhotoPreview(URL.createObjectURL(file));
  };

  const handleParentSave = async () => {
    if (!parentName.trim()) return;
    setParentSaving(true);
    try {
      let imageUrl = parentImage ?? undefined;

      if (parentPhotoFile) {
        const fd = new FormData();
        fd.append("file", parentPhotoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          imageUrl = data.url;
        }
      }

      await updateParentProfile({
        name: parentName.trim(),
        image: imageUrl ?? "",
        bio: parentBio,
        location: parentLocation,
      });

      setParentImage(imageUrl ?? null);
      setParentPhotoFile(null);
      setParentSaved(true);
      setTimeout(() => setParentSaved(false), 2000);
      router.refresh();
    } finally {
      setParentSaving(false);
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
        {/* My Profile Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-stone-800">My Profile</h2>
          </div>

          {/* Avatar editor */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-stone-50 shadow-lg">
                {parentPhotoPreview ? (
                  <Image
                    src={parentPhotoPreview}
                    alt={parentName || "Profile"}
                    width={112}
                    height={112}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-3xl">
                    {parentName?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => parentFileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 gradient-bg-vibrant rounded-full flex items-center justify-center border-2 border-white shadow-md"
              >
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input
                ref={parentFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleParentPhotoChange}
              />
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label
                htmlFor="settings-parent-name"
                className="text-xs text-stone-500 font-medium block mb-1"
              >
                Display Name
              </label>
              <input
                id="settings-parent-name"
                type="text"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                maxLength={100}
                placeholder="Your name"
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
            <div>
              <label
                htmlFor="settings-parent-bio"
                className="text-xs text-stone-500 font-medium block mb-1"
              >
                Bio
              </label>
              <textarea
                id="settings-parent-bio"
                value={parentBio}
                onChange={(e) => setParentBio(e.target.value)}
                maxLength={160}
                rows={2}
                placeholder="A few words about yourself..."
                className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none text-sm"
              />
              <p className="text-xs text-stone-400 text-right mt-1">{parentBio.length}/160</p>
            </div>
            <div>
              <label
                htmlFor="settings-parent-location"
                className="text-xs text-stone-500 font-medium block mb-1"
              >
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  id="settings-parent-location"
                  type="text"
                  value={parentLocation}
                  onChange={(e) => setParentLocation(e.target.value)}
                  maxLength={100}
                  placeholder="City, Country"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            onClick={handleParentSave}
            disabled={!parentLoaded || parentSaving || !parentName.trim()}
            className="w-full mt-5 gradient-bg-vibrant text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition"
          >
            {parentSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : parentSaved ? (
              "Saved ✓"
            ) : (
              "Save Profile"
            )}
          </button>
        </div>

        {/* Baby Profile Card — only shown when user has a baby */}
        {baby && (
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
                  role="button"
                  tabIndex={0}
                  className="absolute bottom-0 right-0 w-9 h-9 gradient-bg-vibrant rounded-2xl flex items-center justify-center border-2 border-white shadow-md"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
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
                <label
                  htmlFor="settings-baby-name"
                  className="text-xs text-stone-500 font-medium block mb-1"
                >
                  Baby&apos;s Name
                </label>
                <input
                  id="settings-baby-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
                />
              </div>
              <div>
                <label
                  htmlFor="settings-birth-date"
                  className="text-xs text-stone-500 font-medium block mb-1"
                >
                  Birth Date
                </label>
                <input
                  id="settings-birth-date"
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
        )}

        {/* Your Babies Card */}
        <div className="premium-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BabyIcon className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-stone-800">Your Babies</h2>
          </div>

          {babies.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {babies.map((b) => (
                <button
                  key={b.id}
                  onClick={() => baby && b.id !== baby.id && handleSwitchBaby(b.id)}
                  className="flex items-center w-full py-3 hover:bg-stone-50 rounded-xl px-2 -mx-2 transition-colors"
                >
                  <BabyAvatar name={b.name} photoUrl={b.photoUrl} size={32} />
                  <span className="flex-1 text-left text-stone-700 font-medium ml-3">{b.name}</span>
                  {baby && b.id === baby.id && <Check className="w-4 h-4 text-rose-500" />}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 mb-2">
              You haven&apos;t added any babies yet. Add one to start capturing memories!
            </p>
          )}

          <button
            onClick={() => router.push("/onboarding")}
            className="w-full mt-3 flex items-center gap-3 py-3 px-2 -mx-2 rounded-xl hover:bg-stone-50 transition-colors text-rose-500 font-medium"
          >
            <div className="w-8 h-8 rounded-xl border-2 border-dashed border-rose-200 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            {babies.length > 0 ? "Add another baby" : "Add a baby"}
          </button>
        </div>

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
                  : "New followers need your approval"}
              </p>
            </div>
            <button
              role="switch"
              aria-checked={isPublic ?? false}
              aria-label="Profile visibility"
              onClick={handleTogglePrivacy}
              disabled={isPublic === null || togglingPrivacy}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isPublic ? "bg-emerald-400" : "bg-amber-400"
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                  isPublic ? "left-5" : "left-0.5"
                }`}
              />
              {togglingPrivacy && (
                <Loader2 className="absolute inset-0 m-auto w-3 h-3 animate-spin text-white" />
              )}
            </button>
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
            <button
              onClick={() => router.push("/settings/privacy")}
              className="flex items-center w-full py-3 cursor-pointer hover:bg-stone-50 rounded-xl px-2 -mx-2 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 text-blue-500" />
              </div>
              <span className="flex-1 text-left text-stone-700 font-medium">
                Privacy & Security
              </span>
              <ChevronRight className="w-4 h-4 text-stone-400" />
            </button>
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
