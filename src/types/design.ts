// Design token types for Student Meetup

export type ColorToken =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "error"
  | "muted";

export type SizeToken = "xs" | "sm" | "md" | "lg" | "xl";

export type RadiusToken = "sm" | "md" | "lg" | "xl" | "full";

export interface FeatureHighlight {
  icon: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}
