"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "primary" | "secondary" | "success" | "warning";
  size?: "sm" | "md";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "default",
  size = "md",
  icon,
  className,
  children,
  ...props
}) => {
  const variants: Record<string, string> = {
    default:
      "bg-white text-[#111827] shadow-[var(--shadow-sm)] border border-[var(--color-border-light)]",
    primary:
      "bg-[var(--color-primary-light)] text-[var(--color-primary)]",
    secondary:
      "bg-[var(--color-secondary-light)] text-[var(--color-secondary)]",
    success:
      "bg-[#DCFCE7] text-[#15803D]",
    warning:
      "bg-[#FEF9C3] text-[#A16207]",
  };

  const sizes: Record<string, string> = {
    sm: "text-xs px-2.5 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
