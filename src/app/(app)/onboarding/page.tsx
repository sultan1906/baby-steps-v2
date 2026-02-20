"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createBaby } from "@/actions/baby";
import { format } from "date-fns";
import Image from "next/image";
import confetti from "canvas-confetti";

type Step = 1 | 2;

const slideVariants = {
  enterFromRight: { opacity: 0, x: 40 },
  enterFromLeft: { opacity: 0, x: -40 },
  center: { opacity: 1, x: 0 },
  exitToLeft: { opacity: 0, x: -40 },
  exitToRight: { opacity: 0, x: 40 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = format(new Date(), "yyyy-MM-dd");
  const step1Valid = name.trim() && birthdate && termsAccepted;

  const goToStep2 = () => {
    setDirection("forward");
    setStep(2);
  };

  const goToStep1 = () => {
    setDirection("back");
    setStep(1);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    setLoading(true);
    setError("");

    try {
      let photoUrl: string | undefined;

      if (photoFile) {
        const fd = new FormData();
        fd.append("file", photoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          photoUrl = data.url;
        }
      }

      await createBaby({ name: name.trim(), birthdate, photoUrl });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#F06292", "#FFB74D", "#F8BBD0"],
      });

      router.push("/timeline");
    } catch {
      setError("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-sm border border-stone-100/50 relative overflow-hidden">
        {/* Progress pills */}
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-2 rounded-full gradient-bg" />
          <motion.div
            className="flex-1 h-2 rounded-full"
            animate={{
              background: step === 2 ? "linear-gradient(135deg, #E91E8C, #FF9800)" : "#e7e5e4",
            }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Back button (step 2 only) */}
        <AnimatePresence>
          {step === 2 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={goToStep1}
              className="absolute top-8 left-8 w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center text-stone-400"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Step content with slide animation */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 ? (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial={direction === "back" ? "enterFromLeft" : "enterFromRight"}
                animate="center"
                exit={direction === "back" ? "exitToRight" : "exitToLeft"}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h1 className="text-2xl font-bold mb-1">
                  <span className="gradient-text">Hello there!</span>
                </h1>
                <p className="text-stone-400 text-sm mb-6">Tell us about your little one</p>

                {error && (
                  <p className="text-rose-500 text-sm bg-rose-50 rounded-2xl p-3 mb-4">{error}</p>
                )}

                <div className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="baby-name" className="text-xs text-stone-500 font-medium block mb-1">
                      Baby&apos;s Name
                    </label>
                    <input
                      id="baby-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Emma, Noah..."
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>

                  <div>
                    <label htmlFor="birth-date" className="text-xs text-stone-500 font-medium block mb-1">
                      Birth Date
                    </label>
                    <input
                      id="birth-date"
                      type="date"
                      value={birthdate}
                      max={today}
                      onChange={(e) => setBirthdate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 accent-rose-500"
                    />
                    <span className="text-sm text-stone-500">
                      I agree to the{" "}
                      <Link href="/terms" className="text-rose-500 hover:underline">
                        Terms of Use
                      </Link>
                    </span>
                  </label>

                  <button
                    onClick={goToStep2}
                    disabled={!step1Valid}
                    className="gradient-bg-vibrant text-white font-bold py-3.5 rounded-[1.75rem] flex items-center justify-center gap-2 disabled:opacity-50 mt-2 transition"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial={direction === "back" ? "enterFromLeft" : "enterFromRight"}
                animate="center"
                exit={direction === "back" ? "exitToRight" : "exitToLeft"}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h1 className="text-2xl font-bold mb-1 text-stone-800 text-center mt-4">
                  Profile Photo
                </h1>
                <p className="text-stone-400 text-sm text-center mb-6">
                  A face to remember (optional)
                </p>

                {/* Avatar upload */}
                <div className="flex justify-center mb-6">
                  <label htmlFor="profile-photo" className="relative cursor-pointer group">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-stone-50 shadow-lg">
                      {photoPreview ? (
                        <Image
                          src={photoPreview}
                          alt="Preview"
                          width={160}
                          height={160}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full gradient-bg flex items-center justify-center text-white font-bold text-5xl">
                          {name[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                    {/* Camera overlay */}
                    <div className="absolute bottom-0 right-0 w-10 h-10 gradient-bg-vibrant rounded-2xl flex items-center justify-center shadow-md border-2 border-white">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                  </label>
                  <input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>

                {error && (
                  <p className="text-rose-500 text-sm bg-rose-50 rounded-2xl p-3 mb-4 text-center">
                    {error}
                  </p>
                )}

                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="gradient-bg-vibrant text-white font-bold py-3.5 rounded-[1.75rem] w-full flex items-center justify-center gap-2 disabled:opacity-70 transition"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Journey 🌱"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
