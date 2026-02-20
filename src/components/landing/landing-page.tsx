"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Award,
  MapPin,
  BarChart2,
  ChevronDown,
  Heart,
  UserPlus,
  Baby,
  Sparkles,
} from "lucide-react";
import { AppLogo } from "@/components/shared/app-logo";

/* ── shared animation variants ─────────────────────────────────────────── */

const spring = { type: "spring" as const, stiffness: 260, damping: 22 };

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: spring },
};

const fadeUpScale = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
};

const stagger = (delay = 0.1) => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.1 } },
});

/* ── data ──────────────────────────────────────────────────────────────── */

const features = [
  {
    icon: Camera,
    title: "Capture Memories",
    description:
      "Upload photos and add heartfelt descriptions to preserve every precious moment as it happens.",
    color: "bg-rose-100 text-rose-500",
  },
  {
    icon: Award,
    title: "Track Milestones",
    description: "Mark first words, first steps, and all the magical firsts along the way.",
    color: "bg-amber-100 text-amber-500",
  },
  {
    icon: BarChart2,
    title: "Watch Them Grow",
    description: "Beautiful dashboards and charts to visualize how far your little one has come.",
    color: "bg-rose-50 text-rose-400",
  },
  {
    icon: MapPin,
    title: "Remember Where",
    description: "Tag locations so you always remember exactly where special moments happened.",
    color: "bg-stone-100 text-stone-500",
  },
];

const steps = [
  {
    number: "1",
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in seconds — completely free.",
  },
  {
    number: "2",
    icon: Baby,
    title: "Add your little one",
    description: "Enter their name and birth date to begin.",
  },
  {
    number: "3",
    icon: Sparkles,
    title: "Start capturing",
    description: "Upload photos, mark milestones, and watch the memories grow.",
  },
];

const stats = [
  { value: "100%", label: "Free to start" },
  { value: "365", label: "Days of firsts" },
  { value: "\u221E", label: "Memories" },
];

/* ── sections ──────────────────────────────────────────────────────────── */

function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const blobY1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const blobY2 = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const blobScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  return (
    <section
      ref={ref}
      className="relative min-h-svh flex flex-col items-center justify-center overflow-hidden px-6"
    >
      {/* parallax gradient blobs */}
      <motion.div
        style={{ y: blobY1, scale: blobScale }}
        className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-rose-300/25 blur-[100px]"
      />
      <motion.div
        style={{ y: blobY2, scale: blobScale }}
        className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-amber-300/25 blur-[100px]"
      />
      {/* subtle center glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36rem] h-[36rem] rounded-full bg-rose-200/10 blur-[120px] pointer-events-none" />

      {/* content */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
        initial="hidden"
        animate="visible"
        variants={stagger(0.15)}
      >
        {/* logo card */}
        <motion.div
          variants={fadeUp}
          className="w-20 h-20 rounded-[1.5rem] bg-white shadow-lg shadow-rose-200/40 flex items-center justify-center mb-8"
        >
          <AppLogo size="lg" />
        </motion.div>

        {/* title */}
        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter mb-4"
        >
          <span className="gradient-text">Babysteps</span>
        </motion.h1>

        {/* tagline */}
        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-stone-500 font-light mb-12 max-w-xs sm:max-w-sm"
        >
          Every moment, beautifully remembered.
        </motion.p>

        {/* CTA */}
        <motion.div variants={fadeUp} className="w-full max-w-xs">
          <Link
            href="/auth"
            className="gradient-bg-vibrant w-full py-4 rounded-[3rem] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(240,98,146,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-stone-400 mt-5 tracking-wide">
            Free to get started &middot; No credit card required
          </p>
        </motion.div>
      </motion.div>

      {/* scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-stone-300" />
        </motion.div>
      </motion.div>
    </section>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-6">
      <motion.div
        className="max-w-2xl mx-auto"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger(0.1)}
      >
        {/* section header */}
        <motion.p
          variants={fadeUp}
          className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 text-center mb-3"
        >
          Features
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-stone-800 text-center mb-12 tracking-tight"
        >
          Everything you need to treasure
          <br className="hidden sm:block" /> the first year
        </motion.h2>

        {/* cards grid */}
        <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-5" variants={stagger(0.1)}>
          {features.map(({ icon: Icon, title, description, color }) => (
            <motion.div key={title} variants={fadeUpScale} className="premium-card p-8">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-stone-800 text-lg mt-5">{title}</h3>
              <p className="text-stone-500 text-sm leading-relaxed mt-2">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function HowItWorksSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-6 bg-white/40">
      <motion.div
        className="max-w-2xl mx-auto"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger(0.12)}
      >
        <motion.p
          variants={fadeUp}
          className="text-xs font-bold tracking-[0.2em] uppercase text-stone-400 text-center mb-3"
        >
          How it works
        </motion.p>
        <motion.h2
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-stone-800 text-center mb-14 tracking-tight"
        >
          Three simple steps
        </motion.h2>

        <motion.div
          className="flex flex-col md:flex-row items-start md:items-center justify-center gap-10 md:gap-16"
          variants={stagger(0.15)}
        >
          {steps.map(({ number, icon: Icon, title, description }, i) => (
            <motion.div
              key={number}
              variants={fadeUp}
              className="flex flex-col items-center text-center flex-1 max-w-[220px] mx-auto md:mx-0 relative"
            >
              {/* connector line (desktop only, not on last item) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+36px)] w-[calc(100%-24px)] h-px bg-stone-200" />
              )}

              {/* numbered circle */}
              <div className="w-12 h-12 rounded-full gradient-bg-vibrant text-white font-bold text-lg flex items-center justify-center shadow-[0_4px_16px_rgba(240,98,146,0.3)]">
                {number}
              </div>

              <Icon className="w-5 h-5 text-stone-400 mt-4" />
              <h3 className="font-bold text-stone-800 mt-3">{title}</h3>
              <p className="text-stone-500 text-sm mt-1.5 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function SocialProofSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-24 px-6">
      <motion.div
        className="max-w-md mx-auto text-center"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger(0.12)}
      >
        <motion.div variants={fadeUp}>
          <Heart className="w-8 h-8 mx-auto text-rose-400 mb-6" />
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-stone-600 font-light italic leading-relaxed mb-10"
        >
          &ldquo;Join parents everywhere who are preserving their baby&rsquo;s most precious
          moments.&rdquo;
        </motion.p>

        <motion.div className="flex justify-center gap-10 sm:gap-14" variants={stagger(0.1)}>
          {stats.map(({ value, label }) => (
            <motion.div key={label} variants={fadeUp}>
              <div className="text-2xl sm:text-3xl font-bold gradient-text">{value}</div>
              <div className="text-xs text-stone-400 mt-1 tracking-wide">{label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function FinalCTASection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="relative py-28 px-6 overflow-hidden">
      {/* background blobs */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-rose-300/15 blur-[80px]" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-amber-300/15 blur-[80px]" />

      <motion.div
        className="relative z-10 max-w-md mx-auto text-center"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={stagger(0.12)}
      >
        <motion.div variants={fadeUp}>
          <AppLogo size="lg" className="mx-auto mb-6" />
        </motion.div>

        <motion.h2
          variants={fadeUp}
          className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight mb-4"
        >
          Start preserving memories today
        </motion.h2>

        <motion.p variants={fadeUp} className="text-stone-500 font-light mb-10 max-w-xs mx-auto">
          Every smile, every giggle, every tiny milestone — they grow up so fast.
        </motion.p>

        <motion.div variants={fadeUp} className="max-w-xs mx-auto">
          <Link
            href="/auth"
            className="gradient-bg-vibrant w-full py-4 rounded-[3rem] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(240,98,146,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-transform"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-stone-400 mt-5 tracking-wide">
            Free to get started &middot; No credit card required
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-6 border-t border-stone-100/50">
      <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <AppLogo size="sm" />
          <span className="gradient-text text-sm font-bold tracking-tight">Babysteps</span>
        </div>

        <div className="flex gap-6">
          <span className="text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
            Privacy
          </span>
          <span className="text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
            Terms
          </span>
        </div>
      </div>

      <p className="text-xs text-stone-300 text-center mt-4">
        &copy; {new Date().getFullYear()} Babysteps. Made with love.
      </p>
    </footer>
  );
}

/* ── main export ───────────────────────────────────────────────────────── */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
