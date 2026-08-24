"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed";

    const variants: Record<string, string> = {
      primary:
        "bg-[#111827] text-white hover:bg-[#1f2937] focus-visible:ring-[#111827] shadow-md hover:shadow-lg",
      secondary:
        "bg-[#4F46E5] text-white hover:bg-[#4338CA] focus-visible:ring-[#4F46E5] shadow-md hover:shadow-lg",
      outline:
        "border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white focus-visible:ring-[#111827]",
      ghost:
        "text-[#111827] hover:bg-[#F3F4F6] focus-visible:ring-[#9CA3AF]",
    };

    const sizes: Record<string, string> = {
      sm: "h-10 px-5 text-sm gap-1.5",
      md: "h-12 px-7 text-base gap-2",
      lg: "h-14 px-8 text-lg gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
