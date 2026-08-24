"use client";

import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface Button3DProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "emerald" | "amber" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  className?: string;
  glow?: boolean;
}

const variantStyles = {
  primary: {
    top: "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white border-indigo-400/30",
    bottom: "bg-indigo-900 shadow-indigo-500/30",
    glow: "shadow-[0_0_25px_rgba(99,102,241,0.5)]",
  },
  secondary: {
    top: "bg-gradient-to-r from-slate-800 via-gray-800 to-slate-900 text-white border-slate-700/50",
    bottom: "bg-black shadow-slate-900/40",
    glow: "shadow-[0_0_20px_rgba(15,23,42,0.4)]",
  },
  emerald: {
    top: "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white border-emerald-300/30",
    bottom: "bg-emerald-900 shadow-emerald-500/30",
    glow: "shadow-[0_0_25px_rgba(16,185,129,0.5)]",
  },
  amber: {
    top: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white border-amber-300/30",
    bottom: "bg-amber-900 shadow-amber-500/30",
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.5)]",
  },
  danger: {
    top: "bg-gradient-to-r from-red-500 via-rose-500 to-pink-600 text-white border-red-300/30",
    bottom: "bg-red-950 shadow-red-500/30",
    glow: "shadow-[0_0_25px_rgba(239,68,68,0.5)]",
  },
  ghost: {
    top: "bg-white/90 backdrop-blur-md text-gray-800 border-gray-200 hover:bg-white",
    bottom: "bg-gray-300 shadow-gray-400/20",
    glow: "shadow-md",
  },
};

const sizeStyles = {
  sm: "px-3.5 py-1.5 text-xs rounded-xl font-bold gap-1.5",
  md: "px-5 py-2.5 text-xs sm:text-sm rounded-2xl font-extrabold gap-2",
  lg: "px-6 py-3.5 text-sm sm:text-base rounded-2xl font-black gap-2.5",
  xl: "px-8 py-4 text-base sm:text-lg rounded-3xl font-black gap-3",
};

export const Button3D: React.FC<Button3DProps> = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  glow = true,
  onClick,
  disabled,
  ...props
}) => {
  const currentVariant = variantStyles[variant];
  const currentSize = sizeStyles[size];

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ y: 3 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      onClick={onClick}
      disabled={disabled}
      className={`relative group inline-flex items-center justify-center select-none cursor-pointer outline-none ${
        fullWidth ? "w-full" : "w-auto"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      {...props}
    >
      {/* 3D Extruded Bottom Shadow/Depth Layer */}
      <span
        className={`absolute inset-0 rounded-[inherit] transform translate-y-1.5 transition-transform group-hover:translate-y-2 group-active:translate-y-0.5 ${currentVariant.bottom}`}
      />

      {/* Top Interactive Button Layer */}
      <span
        className={`relative z-10 w-full flex items-center justify-center border ${
          currentVariant.top
        } ${currentSize} ${glow ? currentVariant.glow : ""} transition-all duration-150 group-hover:brightness-110 overflow-hidden`}
      >
        {/* Shiny Light Sweep Highlight on Hover */}
        <span className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-700 ease-in-out pointer-events-none" />

        {children}
      </span>
    </motion.button>
  );
};
