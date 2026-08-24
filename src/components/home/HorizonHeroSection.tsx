"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { Sparkles } from "lucide-react";

interface HorizonHeroSectionProps {
  userFullName?: string;
  onOpenRadar?: () => void;
}

export const HorizonHeroSection: React.FC<HorizonHeroSectionProps> = ({
  userFullName = "Student",
  onOpenRadar,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Parallax scroll tracking over a generous parent height (500vh) for cinematic pinning space
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Since the sticky child unpins at scrollTop = (total height - viewport height),
  // on a 500vh container this corresponds to progress path from 0.0 to 0.80.
  // We compress the entire active animation timeline into the [0.0, 0.80] range
  // so the visual zoom finishes completely BEFORE the section unpins and scrolls away.
  const bgOpacity = useTransform(scrollYProgress, [0.72, 0.80], [1, 0]);
  const smoothBgOpacity = useSpring(bgOpacity, { stiffness: 100, damping: 25 });

  // Intro message scroll animations:
  // 0% - 12%: Fully visible
  // 12% - 24%: Shrinks and dims
  // 24% - 32%: Nearly disappears -> gone
  // 32%+: Completely gone
  const introOpacity = useTransform(scrollYProgress, [0, 0.12, 0.24, 0.32, 1], [1, 1, 0.45, 0, 0]);
  const introScale = useTransform(scrollYProgress, [0, 0.12, 0.24, 0.32, 1], [1, 1, 0.82, 0.60, 0.60]);
  const smoothIntroOpacity = useSpring(introOpacity, { stiffness: 100, damping: 24 });
  const smoothIntroScale = useSpring(introScale, { stiffness: 100, damping: 24 });

  // Subtle connecting line opacity mapping
  const lineOpacity = useTransform(scrollYProgress, [0, 0.12, 0.24, 0.32, 1], [0.08, 0.16, 0.06, 0, 0]);
  const smoothLineOpacity = useSpring(lineOpacity, { stiffness: 95, damping: 22 });

  // 1. Character Positions: separated -> meet -> part & flank theme -> explode out
  // Girl path (Left side)
  const rawGirlX = useTransform(
    scrollYProgress,
    [0, 0.32, 0.56, 0.64, 0.69, 0.75, 1],
    ["-33vw", "-33vw", "-4vw", "-16vw", "-16vw", "-33vw", "-35vw"]
  );
  const girlX = useSpring(rawGirlX, { stiffness: 90, damping: 22 });

  // Boy path (Right side)
  const rawBoyX = useTransform(
    scrollYProgress,
    [0, 0.32, 0.56, 0.64, 0.69, 0.75, 1],
    ["33vw", "33vw", "4vw", "16vw", "16vw", "33vw", "35vw"]
  );
  const boyX = useSpring(rawBoyX, { stiffness: 90, damping: 22 });

  // Vertical wave-like floating offset during scroll
  const rawGirlY = useTransform(
    scrollYProgress,
    [0, 0.32, 0.56, 0.69, 0.75, 1],
    ["0vh", "1vh", "-2vh", "0vh", "10vh", "15vh"]
  );
  const girlY = useSpring(rawGirlY, { stiffness: 85, damping: 20 });

  const rawBoyY = useTransform(
    scrollYProgress,
    [0, 0.32, 0.56, 0.69, 0.75, 1],
    ["0vh", "-1vh", "2vh", "0vh", "10vh", "15vh"]
  );
  const boyY = useSpring(rawBoyY, { stiffness: 85, damping: 20 });

  // Rotate Z slightly during approach mapping
  const rawGirlRotateZ = useTransform(scrollYProgress, [0, 0.32, 0.56, 0.69, 1], [0, 0, -10, 15, 15]);
  const girlRotateZ = useSpring(rawGirlRotateZ, { stiffness: 90, damping: 22 });

  const rawBoyRotateZ = useTransform(scrollYProgress, [0, 0.32, 0.56, 0.69, 1], [0, 0, 10, -15, -15]);
  const boyRotateZ = useSpring(rawBoyRotateZ, { stiffness: 90, damping: 22 });

  // Character general scale and opacity mapping
  const rawCharScale = useTransform(scrollYProgress, [0, 0.32, 0.56, 0.69, 0.75, 1], [0.95, 0.95, 1.1, 1.1, 0.35, 0.35]);
  const charScale = useSpring(rawCharScale, { stiffness: 95, damping: 22 });

  const rawCharOpacity = useTransform(scrollYProgress, [0, 0.69, 0.75, 1], [1, 1, 0, 0]);
  const charOpacity = useSpring(rawCharOpacity, { stiffness: 100, damping: 24 });

  // 2. Central Brand Theme Reveal & Giant Scale Explosion
  const rawThemeScale = useTransform(
    scrollYProgress,
    [0, 0.56, 0.64, 0.69, 0.75, 0.82, 1],
    [0.1, 0.1, 1, 1.15, 30, 48, 55]
  );
  const themeScale = useSpring(rawThemeScale, { stiffness: 75, damping: 20 });

  const rawThemeOpacity = useTransform(scrollYProgress, [0, 0.56, 0.60, 0.75, 0.78, 1], [0, 0, 1, 1, 0, 0]);
  const themeOpacity = useSpring(rawThemeOpacity, { stiffness: 75, damping: 20 });

  const rawThemeY = useTransform(scrollYProgress, [0, 1], ["4vh", "-8vh"]);
  const themeY = useSpring(rawThemeY, { stiffness: 80, damping: 20 });

  // 3. Environmental Parallax Depth Layers (Background grid and star particles)
  const bgMeshY = useTransform(scrollYProgress, [0, 1], ["0vh", "12vh"]);
  const midGlowY = useTransform(scrollYProgress, [0, 1], ["0vh", "-10vh"]);
  
  // Ambient radial glow intensifies during meeting
  const lightsScale = useTransform(scrollYProgress, [0, 0.56, 0.64, 0.69, 1], [0.8, 0.8, 1.6, 1.8, 2]);

  // Pointer events control so links below are clickable at scroll completion
  const pointerEvents = useTransform(scrollYProgress, [0.72, 0.80], ["auto", "none"]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[500vh] -mt-6 sm:-mt-8 pointer-events-auto"
    >
      {/* Sticky Content Wrapper (Pinned Screen Viewport) */}
      <motion.div
        style={{
          opacity: smoothBgOpacity,
          pointerEvents,
        }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-transparent text-slate-900 flex flex-col items-center justify-center select-none"
      >
        {/* Layer 1: Atmosphere Grid */}

        {/* Perspective grid mesh */}
        <motion.div
          style={{ y: bgMeshY }}
          className="absolute inset-0 opacity-15 bg-[radial-gradient(#818cf8_1.2px,transparent_1.2px)] [background-size:32px_32px] [transform:perspective(500px)_rotateX(60deg)_translateY(-150px)] pointer-events-none"
        />

        {/* Dynamic glow aura that grows when meeting starts */}
        <motion.div
          style={{
            scale: lightsScale,
            y: midGlowY,
            opacity: useTransform(scrollYProgress, [0.56, 0.69, 0.90], [0.1, 0.5, 0.1]),
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-[130px] rounded-full pointer-events-none z-10"
        />

        {/* Subtle Visual Connection Line */}
        <motion.svg
          style={{
            opacity: smoothLineOpacity,
          }}
          className="absolute w-[60vw] h-1 pointer-events-none z-15"
          viewBox="0 0 100 2"
          preserveAspectRatio="none"
        >
          <line
            x1="10"
            y1="1"
            x2="90"
            y2="1"
            stroke="url(#lineGradient)"
            strokeWidth="0.8"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#0f172a" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.3" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Temporary Introductory Center Message */}
        <motion.div
          style={{
            opacity: smoothIntroOpacity,
            scale: smoothIntroScale,
            filter: "drop-shadow(0 8px 24px rgba(15, 23, 42, 0.10))",
          }}
          className="absolute left-1/2 top-[53%] sm:top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center text-center w-full px-2 max-w-[180px] sm:max-w-xl pointer-events-none"
        >
          <h2
            style={{
              backgroundImage: "linear-gradient(110deg, #0F172A, #172554, #1E3A8A)",
              WebkitBackgroundClip: "text",
            }}
            className="text-lg xs:text-xl sm:text-4xl md:text-5xl font-black bg-clip-text text-transparent leading-tight select-none tracking-tight"
          >
            <span className="sm:inline block whitespace-nowrap">Meet. Connect.</span>{" "}
            <span className="sm:inline block whitespace-nowrap">Belong.</span>
          </h2>
          <p className="mt-1.5 sm:mt-2 text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-semibold tracking-wide text-slate-500 uppercase select-none leading-tight max-w-[140px] sm:max-w-none">
            Where campus connections begin.
          </p>
          <div className="py-1 px-3.5 rounded-full bg-purple-50 border border-purple-200/60 text-purple-700 text-[9px] sm:text-xs font-black uppercase tracking-widest animate-pulse mt-4 shadow-sm select-none">
            slide to meet
          </div>
        </motion.div>

        {/* Layer 2: Main Central Brand Theme Reveal */}
        <motion.div
          style={{
            scale: themeScale,
            opacity: themeOpacity,
            y: themeY,
            transformStyle: "preserve-3d",
            perspective: 1200,
          }}
          className="absolute z-25 flex flex-col items-center justify-center text-center px-4"
        >
          {/* Header indicator */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-indigo-700 text-[10px] font-black uppercase tracking-wider mb-4">
            <Sparkles size={11} className="text-amber-500" />
            <span>Student Community</span>
          </div>
          <h1 className="font-lora text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-[#1e3a8a] uppercase drop-shadow-[0_10px_30px_rgba(0,0,0,0.06)] leading-none select-none">
            MEETUP
          </h1>
          
          <p className="mt-4 text-[10px] sm:text-xs md:text-sm font-extrabold uppercase tracking-[0.25em] text-indigo-600">
            Social Ecosystem
          </p>
        </motion.div>

        {/* Layer 3: Pinned Floating Characters */}
        <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible">
          
          {/* Floating Student Girl (Left to Center) */}
          <motion.div
            style={{
              x: girlX,
              y: girlY,
              scale: charScale,
              opacity: charOpacity,
              rotateZ: girlRotateZ,
              transformStyle: "preserve-3d",
            }}
            className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center overflow-visible"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center justify-center overflow-visible"
            >
              <img
                src="/girl.png"
                alt="Student Girl Cartoon"
                className="w-[26vw] min-w-[95px] max-w-[260px] md:w-[22vw] md:max-w-[420px] h-auto object-contain select-none pointer-events-none filter drop-shadow-[0_12px_36px_rgba(0,0,0,0.06)]"
              />
            </motion.div>
          </motion.div>

          {/* Floating Student Boy (Right to Center) */}
          <motion.div
            style={{
              x: boyX,
              y: boyY,
              scale: charScale,
              opacity: charOpacity,
              rotateZ: boyRotateZ,
              transformStyle: "preserve-3d",
            }}
            className="absolute left-1/2 top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center overflow-visible"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, delay: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex items-center justify-center overflow-visible"
            >
              <img
                src="/boy.png"
                alt="Student Boy Cartoon"
                className="w-[30vw] min-w-[110px] max-w-[300px] md:w-[25.5vw] md:max-w-[480px] h-auto object-contain select-none pointer-events-none filter drop-shadow-[0_12px_36px_rgba(0,0,0,0.06)]"
              />
            </motion.div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};
