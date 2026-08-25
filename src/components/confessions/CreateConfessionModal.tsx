import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sparkles,
  User,
  ShieldCheck,
  Heart,
  GraduationCap,
  PartyPopper,
  Plane,
  Briefcase,
  Users,
  MessageSquare,
  Image as ImageIcon,
  AlertTriangle,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { CategoryType } from "@/types/confessions";
import { Button } from "@/components/ui/Button";

interface CreateConfessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    content: string,
    category: CategoryType,
    isAnonymous: boolean,
    imageUrl?: string
  ) => void;
  userFullName: string;
}

const CATEGORIES: { label: CategoryType; icon: React.ReactNode }[] = [
  { label: "Love", icon: <Heart size={14} /> },
  { label: "Campus", icon: <GraduationCap size={14} /> },
  { label: "Events", icon: <PartyPopper size={14} /> },
  { label: "Trips", icon: <Plane size={14} /> },
  { label: "Careers", icon: <Briefcase size={14} /> },
  { label: "Friendships", icon: <Users size={14} /> },
  { label: "General", icon: <MessageSquare size={14} /> },
];

export const CreateConfessionModal: React.FC<CreateConfessionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userFullName,
}) => {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<CategoryType>("Campus");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>("");

  // AI Moderation state
  const [isScanning, setIsScanning] = useState(false);
  const [moderationError, setModerationError] = useState<{
    category?: string;
    reason?: string;
  } | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setModerationError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageName("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;

    setModerationError(null);
    setIsScanning(true);

    try {
      // 1. Run real-time AI Safety Verification Engine
      const res = await fetch("/api/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: content.trim(),
          image: imageName || imagePreview || "",
        }),
      });

      const result = await res.json();

      if (!result.isSafe) {
        setModerationError({
          category: result.flaggedCategory,
          reason: result.reason,
        });
        setIsScanning(false);
        return;
      }

      // 2. Content approved by AI — submit post
      onSubmit(content.trim(), category, isAnonymous, imagePreview || undefined);
      setContent("");
      setImagePreview(null);
      setImageName("");
      setIsScanning(false);
      onClose();
    } catch {
      onSubmit(content.trim(), category, isAnonymous, imagePreview || undefined);
      setContent("");
      setImagePreview(null);
      setImageName("");
      setIsScanning(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative w-full max-w-[440px] rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EF4444]/10 flex items-center justify-center text-[#EF4444]">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                Post a Confession
              </h2>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={12} />
                AI Content Protection Active
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* AI Moderation Flag Alert if content violates safety policies */}
        {moderationError && (
          <div className="mt-4 p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-start gap-3 animate-fade-in">
            <ShieldAlert size={20} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="font-black text-red-900 dark:text-red-200 uppercase tracking-wider text-[11px]">
                ⚠️ AI Campus Safety Alert: {moderationError.category}
              </span>
              <p className="leading-relaxed">{moderationError.reason}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
          {/* Identity Switcher */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 block">
              Post as
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-gray-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setIsAnonymous(true)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${isAnonymous
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                  }`}
              >
                <ShieldCheck size={16} className={isAnonymous ? "text-[#4F46E5] dark:text-indigo-400" : ""} />
                <span>Anonymous</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAnonymous(false)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${!isAnonymous
                    ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
                  }`}
              >
                <User size={16} className={!isAnonymous ? "text-[#EF4444]" : ""} />
                <span className="truncate">{userFullName || "My Profile"}</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-1.5 px-1">
              {isAnonymous
                ? "🔒 Your real name will be hidden from other students."
                : "👤 Your profile name and badge will be visible."}
            </p>
          </div>

          {/* Category Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 block">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategory(cat.label)}
                  className={`py-1.5 px-3 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${category === cat.label
                      ? "bg-[#111827] dark:bg-white text-white dark:text-slate-900 border-[#111827] dark:border-white shadow-sm"
                      : "bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600"
                    }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 block">
              Your Story / Thought
            </label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (moderationError) setModerationError(null);
              }}
              placeholder="What's on your mind? Share campus stories, advice requests..."
              maxLength={500}
              required={!imagePreview}
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 outline-none transition-all focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 resize-none"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-gray-400 dark:text-slate-400 px-1">
              <span>Verified by AI Safety Scanner</span>
              <span>{content.length}/500</span>
            </div>
          </div>

          {/* Photo Attachment Section */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2 block">
              Attach Campus Photo (AI Vision Moderated)
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-slate-700 max-h-48 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Attachment preview"
                  className="w-full h-48 object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-[#4F46E5] dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-all cursor-pointer text-center">
                <ImageIcon size={24} className="text-[#4F46E5] dark:text-indigo-400 mb-1" />
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  Tap to upload campus photo
                </span>
                <span className="text-[10px] text-gray-400 dark:text-slate-400">
                  PNG, JPG or WebP (Scanned for explicit material)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit with AI Scanning State */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={(!content.trim() && !imagePreview) || isScanning}
            className="font-bold rounded-2xl py-3.5 flex items-center justify-center gap-2"
          >
            {isScanning ? (
              <>
                <Loader2 size={18} className="animate-spin text-white" />
                <span>🤖 AI Safety Scanner Verifying...</span>
              </>
            ) : (
              <span>Post Confession</span>
            )}
          </Button>
        </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
