"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";

interface VapourTextEffectProps {
  text?: string;
  subtext?: string;
  onComplete?: () => void;
  inline?: boolean;
}

export const VapourTextEffect: React.FC<VapourTextEffectProps> = ({
  text = "MEETUP",
  subtext = "Entering Social Ecosystem...",
  onComplete,
  inline = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle system for rising smoke / vapour
    interface Particle {
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      alpha: number;
      decay: number;
      color: string;
    }

    const particles: Particle[] = [];
    const colors = [
      "rgba(168, 85, 247, ", // Purple
      "rgba(236, 72, 153, ", // Pink
      "rgba(99, 102, 241, ", // Indigo
      "rgba(59, 130, 246, ", // Blue
    ];

    const createParticle = () => {
      const x = Math.random() * width;
      const y = height + Math.random() * 20;
      particles.push({
        x,
        y,
        radius: Math.random() * 24 + 12,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(Math.random() * 1.5 + 0.5),
        alpha: Math.random() * 0.35 + 0.15,
        decay: Math.random() * 0.003 + 0.001,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    };

    // Pre-populate particles
    for (let i = 0; i < 40; i++) {
      createParticle();
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Create rising vapour mist particles
      if (particles.length < 70 && Math.random() < 0.6) {
        createParticle();
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.radius += 0.15;

        if (p.alpha <= 0 || p.y < -50) {
          particles.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          p.radius
        );
        gradient.addColorStop(0, `${p.color}${p.alpha})`);
        gradient.addColorStop(1, `${p.color}0)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (inline) {
    return (
      <div className="relative w-full overflow-hidden rounded-3xl bg-slate-950 py-12 px-6 flex flex-col items-center justify-center text-center shadow-2xl border border-purple-900/40">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-48 bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-indigo-600/30 blur-3xl rounded-full pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="relative z-10 space-y-3"
        >
          <span className="text-[11px] font-black tracking-widest text-pink-400 uppercase bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/30">
            💨 Vapour Motion Intro
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-300 tracking-tight drop-shadow-[0_0_35px_rgba(217,70,239,0.5)]">
            {text}
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-purple-200/80 max-w-md mx-auto">
            {subtext}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Radial Vapour Ambient Blobs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/25 to-pink-600/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 space-y-6 max-w-lg"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-pink-300 text-xs font-black shadow-lg">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping" />
          VAPOUR INTRO ENGINE
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_0_40px_rgba(168,85,247,0.7)]">
          <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-200 bg-clip-text text-transparent">
            {text}
          </span>
        </h1>

        <p className="text-sm font-medium text-slate-300/90 leading-relaxed">
          {subtext}
        </p>

        {onComplete && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onComplete}
            className="mt-4 px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white font-extrabold text-xs tracking-wider shadow-[0_0_30px_rgba(236,72,153,0.5)] cursor-pointer"
          >
            CONTINUE TO CAMPUS 🚀
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
};
