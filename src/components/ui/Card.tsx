"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "purple" | "glass";
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { variant = "default", hoverable = false, className, children, ...props },
    ref
  ) => {
    const variants: Record<string, string> = {
      default:
        "bg-white border border-[var(--color-border)] shadow-[var(--shadow-sm)]",
      purple:
        "bg-[var(--color-card-purple)] border-0",
      glass:
        "bg-white/70 backdrop-blur-md border border-white/50 shadow-[var(--shadow-md)]",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[20px] overflow-hidden",
          variants[variant],
          hoverable &&
            "transition-all duration-300 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:scale-[0.98]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
