import type { Metadata, Viewport } from "next";
import { Inter, Lora } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import AuthSync from "@/components/AuthSync";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MEETUP — Meet People. Share Stories. Find Your People.",
  description:
    "A verified social space for student life — friendships, advice, events and real meetups. Connect with your campus community.",
  keywords: ["student", "meetup", "campus", "social", "community", "college"],
  authors: [{ name: "MEETUP Team" }],
  openGraph: {
    title: "MEETUP",
    description: "A verified social space for student life.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FAF9F6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable} suppressHydrationWarning`}>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <AuthSync />
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
