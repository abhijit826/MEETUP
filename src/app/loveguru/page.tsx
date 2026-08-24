"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  Plus,
  MessageCircle,
  ChevronUp,
  ChevronDown,
  Trophy,
  Flame,
  Sparkles,
  Shield,
  Star,
  CheckCircle2,
  Eye,
  Send,
  Zap,
  TrendingUp,
  Target,
  X,
  Crown,
  Award,
  ThumbsUp,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Swords,
  Trash2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  DilemmaPost,
  SwipeScenario,
  AdviceBattle,
  GuruProfile,
  DailyChallenge,
  DilemmaCategory,
  VoteReasonTag,
} from "@/types/loveguru";
import { motion, AnimatePresence } from "motion/react";

// ============ CONSTANTS ============

const CATEGORIES: { label: string; value: DilemmaCategory | "All"; emoji: string }[] = [
  { label: "All", value: "All", emoji: "✨" },
  { label: "Crushes", value: "Crushes", emoji: "😍" },
  { label: "Relationships", value: "Relationships", emoji: "💕" },
  { label: "Breakups", value: "Breakups", emoji: "💔" },
  { label: "Friendships", value: "Friendships", emoji: "🤝" },
  { label: "Communication", value: "Communication", emoji: "💬" },
  { label: "Situationships", value: "Situationships", emoji: "🤷" },
  { label: "College Life", value: "College Life", emoji: "🎓" },
];

const REASON_TAGS: VoteReasonTag[] = [
  "protect yourself",
  "give another chance",
  "context matters",
  "red flag",
  "green flag",
  "trust your gut",
  "talk it out",
  "move on",
  "set boundaries",
  "it depends",
];

const TAG_COLORS: Record<string, string> = {
  "protect yourself": "bg-red-50 text-red-600 border-red-200",
  "give another chance": "bg-green-50 text-green-600 border-green-200",
  "context matters": "bg-amber-50 text-amber-600 border-amber-200",
  "red flag": "bg-red-100 text-red-700 border-red-300",
  "green flag": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "trust your gut": "bg-purple-50 text-purple-600 border-purple-200",
  "talk it out": "bg-blue-50 text-blue-600 border-blue-200",
  "move on": "bg-orange-50 text-orange-600 border-orange-200",
  "set boundaries": "bg-pink-50 text-pink-600 border-pink-200",
  "it depends": "bg-gray-50 text-gray-600 border-gray-200",
};

type TabType = "feed" | "swipe" | "battles" | "leaderboard";

// ============ MAIN COMPONENT ============

export default function LoveGuruPage() {
  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [dilemmas, setDilemmas] = useState<DilemmaPost[]>([]);
  const [scenarios, setScenarios] = useState<SwipeScenario[]>([]);
  const [leaderboard, setLeaderboard] = useState<GuruProfile[]>([]);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DilemmaCategory | "All">("All");
  const [userFullName, setUserFullName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  // Modals
  const [showPostModal, setShowPostModal] = useState(false);
  const [expandedDilemma, setExpandedDilemma] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  // Swipe state
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [swipeResult, setSwipeResult] = useState<{ answer: "red" | "green"; correct: boolean } | null>(null);
  const [swipeScore, setSwipeScore] = useState(0);

  // Owned post IDs
  const [myPostIds, setMyPostIds] = useState<string[]>([]);

  // Battles state
  const [battles, setBattles] = useState<AdviceBattle[]>([]);

  // Daily challenge
  const [selectedChallengeOption, setSelectedChallengeOption] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ====== DATA FETCHING ======
  const fetchDilemmas = useCallback(async () => {
    try {
      const url = selectedCategory === "All"
        ? "/api/loveguru?resource=dilemmas"
        : `/api/loveguru?resource=dilemmas&category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setDilemmas(data.dilemmas || []);
    } catch { /* ignore */ }
  }, [selectedCategory]);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch("/api/loveguru?resource=swipe");
      const data = await res.json();
      if (data.success) setScenarios(data.scenarios || []);
    } catch { /* ignore */ }
  }, []);

  const fetchBattles = useCallback(async () => {
    try {
      const res = await fetch("/api/loveguru?resource=battles");
      const data = await res.json();
      if (data.success) setBattles(data.battles || []);
    } catch { /* ignore */ }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/loveguru?resource=leaderboard");
      const data = await res.json();
      if (data.success) setLeaderboard(data.leaderboard || []);
    } catch { /* ignore */ }
  }, []);

  const fetchDaily = useCallback(async () => {
    try {
      const res = await fetch("/api/loveguru?resource=daily");
      const data = await res.json();
      if (data.success) setDailyChallenge(data.challenge);
    } catch { /* ignore */ }
  }, []);

  // Session + initial load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("my_loveguru_posts") || "[]");
        setMyPostIds(stored);
      } catch { /* ignore */ }

      const sessionStr = document.cookie
        .split("; ")
        .find((r) => r.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const p = JSON.parse(decodeURIComponent(sessionStr));
          if (p.fullName) setUserFullName(p.fullName);
          if (p.email) setUserEmail(p.email);
        } catch { /* */ }
      }
    }
    fetchDilemmas();
    fetchScenarios();
    fetchBattles();
    fetchLeaderboard();
    fetchDaily();

    const interval = setInterval(() => {
      fetchDilemmas();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchDilemmas, fetchScenarios, fetchBattles, fetchLeaderboard, fetchDaily]);

  // ====== HANDLERS ======

  const handlePostDilemma = async (formData: {
    title: string;
    content: string;
    category: DilemmaCategory;
    isAnonymous: boolean;
    predictionQuestion?: string;
    predictionOptions?: string[];
  }) => {
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "post-dilemma",
          ...formData,
          authorId: userEmail || "anon",
          authorName: userFullName,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDilemmas(data.dilemmas);
        setShowPostModal(false);
        if (data.dilemma && data.dilemma.id) {
          const updated = [...myPostIds, data.dilemma.id];
          localStorage.setItem("my_loveguru_posts", JSON.stringify(updated));
          setMyPostIds(updated);
        }
        triggerToast("✨ Dilemma posted! Advice incoming...");
      }
    } catch { triggerToast("❌ Failed to post"); }
  };

  const handleRespond = async (dilemmaId: string) => {
    if (!responseText.trim()) return;
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "respond",
          dilemmaId,
          content: responseText,
          authorId: userEmail || "anon",
          authorName: userFullName,
          isAnonymous: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDilemmas(data.dilemmas);
        setResponseText("");
        setRespondingTo(null);
        triggerToast("💡 Advice shared! +10 Guru Points");
      }
    } catch { triggerToast("❌ Failed to respond"); }
  };

  const handleVote = async (dilemmaId: string, responseId: string, vote: "up" | "down", tag?: VoteReasonTag) => {
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote-response", dilemmaId, responseId, vote, reasonTag: tag }),
      });
      const data = await res.json();
      if (data.success) setDilemmas(data.dilemmas);
    } catch { /* ignore */ }
  };

  const handleSwipe = async (vote: "red" | "green") => {
    if (!scenarios[swipeIndex]) return;
    const sc = scenarios[swipeIndex];
    const correct = vote === sc.correctAnswer;
    setSwipeResult({ answer: vote, correct });
    if (correct) setSwipeScore((p) => p + 1);

    try {
      await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "swipe-vote", scenarioId: sc.id, vote }),
      });
    } catch { /* ignore */ }

    setTimeout(() => {
      setSwipeResult(null);
      setSwipeIndex((p) => (p + 1) % scenarios.length);
    }, 2000);
  };

  const handleVoteBattle = async (battleId: string, side: 1 | 2) => {
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "battle-vote", battleId, side }),
      });
      const data = await res.json();
      if (data.success) {
        setBattles((prev) => prev.map((b) => (b.id === battleId ? data.battle : b)));
        triggerToast("⚡ Vote submitted! +5 Guru Points");
      }
    } catch { /* ignore */ }
  };

  const handleDeleteDilemma = async (dilemmaId: string) => {
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-dilemma", dilemmaId }),
      });
      const data = await res.json();
      if (data.success) {
        setDilemmas((prev) => prev.filter((d) => d.id !== dilemmaId));
        triggerToast("🗑️ Post deleted successfully");
      }
    } catch {
      triggerToast("❌ Failed to delete post");
    }
  };

  const handleDailyVote = async (option: string) => {
    if (selectedChallengeOption) return;
    setSelectedChallengeOption(option);
    try {
      const res = await fetch("/api/loveguru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "daily-vote", option }),
      });
      const data = await res.json();
      if (data.success && data.challenge) {
        setDailyChallenge(data.challenge);
        triggerToast("🔮 Your prediction is locked in!");
      }
    } catch { /* ignore */ }
  };

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/40 via-white to-purple-50/40 text-gray-900 flex flex-col pb-24">
      <Navbar userEmail={userEmail} userFullName={userFullName} />

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Main Responsive Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col space-y-6">

        {/* ====== HEADER CONTROL BAR ====== */}
        <header className="relative p-6 rounded-3xl overflow-hidden shadow-lg" style={{ background: "linear-gradient(135deg, #FF6B8A 0%, #C084FC 50%, #818CF8 100%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link
                href="/home"
                className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all text-white border border-white/20"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Guru Ji Hub
                  <Heart size={20} className="text-pink-200 fill-pink-200" />
                </h1>
                <p className="text-xs text-white/80 font-medium">Anonymous relationship advice • Student Community</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/20">
                <Flame size={15} className="text-orange-300" />
                <span>Guru Pts</span>
              </div>
            </div>
          </div>

          {/* Motion Tab navigation */}
          <div className="flex gap-1 bg-white/15 backdrop-blur-sm rounded-2xl p-1">
            {([
              { id: "feed" as TabType, label: "Feed", icon: <MessageCircle size={13} /> },
              { id: "swipe" as TabType, label: "Swipe", icon: <Zap size={13} /> },
              { id: "battles" as TabType, label: "Battles", icon: <Target size={13} /> },
              { id: "leaderboard" as TabType, label: "Ranks", icon: <Trophy size={13} /> },
            ]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-extrabold transition-colors z-10 cursor-pointer"
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="loveguru-active-tab"
                    className="absolute inset-0 bg-white rounded-xl shadow-md z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 flex items-center gap-1 ${activeTab === tab.id ? "text-gray-900" : "text-white/80 hover:text-white"}`}>
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </header>

        {/* ====== CONTENT AREA ====== */}
        <div className="flex-1 overflow-y-auto">

          {/* ============ FEED TAB ============ */}
          {activeTab === "feed" && (
            <div className="p-3 flex flex-col gap-3">

              {/* Daily Challenge Card */}
              {dailyChallenge && (
                <div className="p-4 rounded-2xl border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <Sparkles size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Daily Challenge</p>
                      <p className="text-xs font-extrabold text-gray-900">{dailyChallenge.title}</p>
                    </div>
                    {dailyChallenge.participantCount > 0 && (
                      <span className="ml-auto text-[10px] font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                        {dailyChallenge.participantCount} voted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{dailyChallenge.description}</p>
                  <div className="flex flex-col gap-1.5">
                    {dailyChallenge.options?.map((opt, i) => {
                      const totalVotes = Object.values(dailyChallenge.votes || {}).reduce((a, b) => a + b, 0);
                      const optVotes = dailyChallenge.votes?.[opt] || 0;
                      const pct = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                      const isSelected = selectedChallengeOption === opt;

                      return (
                        <button
                          key={i}
                          onClick={() => handleDailyVote(opt)}
                          disabled={!!selectedChallengeOption}
                          className={`relative overflow-hidden text-left py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? "border-purple-400 bg-purple-100 text-purple-900"
                              : selectedChallengeOption
                              ? "border-gray-200 bg-gray-50 text-gray-500"
                              : "border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50 active:scale-[0.98]"
                          }`}
                        >
                          {selectedChallengeOption && (
                            <div
                              className="absolute inset-y-0 left-0 bg-purple-200/40 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <span className="relative z-10 flex items-center justify-between">
                            <span>{opt}</span>
                            {selectedChallengeOption && (
                              <span className="text-[10px] font-bold text-purple-600">{pct}%</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`shrink-0 flex items-center gap-1 py-1.5 px-3 rounded-full text-[11px] font-bold border transition-all ${
                      selectedCategory === cat.value
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent shadow-md"
                        : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>

              {/* Dilemma Posts */}
              {dilemmas.length === 0 ? (
                <div className="py-16 text-center">
                  <Heart size={36} className="mx-auto text-pink-200 mb-2" />
                  <h3 className="font-bold text-sm text-gray-800">No dilemmas yet</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-[220px] mx-auto">
                    Be the first to share your situation and get anonymous advice!
                  </p>
                  <button
                    onClick={() => setShowPostModal(true)}
                    className="mt-4 py-2 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold inline-flex items-center gap-1 shadow-lg hover:shadow-xl transition-all"
                  >
                    <Plus size={14} /> Share Your Dilemma
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dilemmas.map((d) => {
                    const isMyPost = (userEmail && d.authorId === userEmail) || myPostIds.includes(d.id);
                    return (
                      <DilemmaCard
                        key={d.id}
                        dilemma={d}
                        isExpanded={expandedDilemma === d.id}
                        isResponding={respondingTo === d.id}
                        responseText={respondingTo === d.id ? responseText : ""}
                        onToggleExpand={() => setExpandedDilemma(expandedDilemma === d.id ? null : d.id)}
                        onStartRespond={() => { setRespondingTo(d.id); setResponseText(""); }}
                        onCancelRespond={() => setRespondingTo(null)}
                        onResponseTextChange={setResponseText}
                        onSubmitResponse={() => handleRespond(d.id)}
                        onVote={handleVote}
                        onDelete={isMyPost ? handleDeleteDilemma : undefined}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============ SWIPE TAB ============ */}
          {activeTab === "swipe" && (
            <SwipeGameTab
              scenarios={scenarios}
              currentIndex={swipeIndex}
              result={swipeResult}
              score={swipeScore}
              onSwipe={handleSwipe}
            />
          )}

          {/* ============ BATTLES TAB ============ */}
          {activeTab === "battles" && (
            <BattlesTab battles={battles} onVote={handleVoteBattle} />
          )}

          {/* ============ LEADERBOARD TAB ============ */}
          {activeTab === "leaderboard" && (
            <LeaderboardTab leaderboard={leaderboard} onRefresh={fetchLeaderboard} />
          )}
        </div>

        {/* ====== FLOATING POST BUTTON (Feed tab only) ====== */}
        {activeTab === "feed" && (
          <button
            onClick={() => setShowPostModal(true)}
            className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center z-20"
            style={{ boxShadow: "0 8px 32px rgba(236,72,153,0.4)" }}
          >
            <Plus size={24} />
          </button>
        )}

        {/* ====== POST DILEMMA MODAL ====== */}
        {showPostModal && (
          <PostDilemmaModal
            onClose={() => setShowPostModal(false)}
            onSubmit={handlePostDilemma}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

// ====== DILEMMA CARD ======
function DilemmaCard({
  dilemma,
  isExpanded,
  isResponding,
  responseText,
  onToggleExpand,
  onStartRespond,
  onCancelRespond,
  onResponseTextChange,
  onSubmitResponse,
  onVote,
  onDelete,
}: {
  dilemma: DilemmaPost;
  isExpanded: boolean;
  isResponding: boolean;
  responseText: string;
  onToggleExpand: () => void;
  onStartRespond: () => void;
  onCancelRespond: () => void;
  onResponseTextChange: (t: string) => void;
  onSubmitResponse: () => void;
  onVote: (dilemmaId: string, responseId: string, vote: "up" | "down", tag?: VoteReasonTag) => void;
  onDelete?: (dilemmaId: string) => void;
}) {
  const [showTagPicker, setShowTagPicker] = useState<string | null>(null);
  const [aiSummary, setAiSummary] = useState<string | undefined>(dilemma.aiSummary);
  const [aiDevilAdvocate, setAiDevilAdvocate] = useState<string | undefined>(dilemma.aiDevilAdvocate);
  const [loadingAI, setLoadingAI] = useState(false);

  // Sync state if dilemma props change
  useEffect(() => {
    if (dilemma.aiSummary) setAiSummary(dilemma.aiSummary);
    if (dilemma.aiDevilAdvocate) setAiDevilAdvocate(dilemma.aiDevilAdvocate);
  }, [dilemma.aiSummary, dilemma.aiDevilAdvocate]);

  const categoryConfig: Record<string, { bg: string; text: string; emoji: string }> = {
    Crushes: { bg: "bg-pink-100", text: "text-pink-700", emoji: "😍" },
    Relationships: { bg: "bg-rose-100", text: "text-rose-700", emoji: "💕" },
    Breakups: { bg: "bg-red-100", text: "text-red-700", emoji: "💔" },
    Friendships: { bg: "bg-amber-100", text: "text-amber-700", emoji: "🤝" },
    Communication: { bg: "bg-blue-100", text: "text-blue-700", emoji: "💬" },
    Situationships: { bg: "bg-purple-100", text: "text-purple-700", emoji: "🤷" },
    "College Life": { bg: "bg-indigo-100", text: "text-indigo-700", emoji: "🎓" },
    General: { bg: "bg-gray-100", text: "text-gray-700", emoji: "✨" },
  };

  const cat = categoryConfig[dilemma.category] || categoryConfig.General;

  return (
    <article className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Status Bar */}
      {dilemma.status !== "open" && (
        <div className={`px-4 py-1.5 text-[10px] font-bold flex items-center gap-1.5 ${
          dilemma.status === "resolved" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
        }`}>
          {dilemma.status === "resolved" ? <CheckCircle2 size={11} /> : <RefreshCw size={11} />}
          {dilemma.status === "resolved" ? "Resolved" : "Updated"} • {dilemma.updateContent?.slice(0, 60)}
        </div>
      )}

      <div className="p-4">
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-black">
              {dilemma.isAnonymous ? <Shield size={14} /> : dilemma.authorName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{dilemma.authorName}</p>
              <p className="text-[10px] text-gray-400">{new Date(dilemma.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.bg} ${cat.text}`}>
              {cat.emoji} {dilemma.category}
            </span>
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Are you sure you want to delete this dilemma post?")) {
                    onDelete(dilemma.id);
                  }
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Delete Post"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        {dilemma.title && (
          <h3 className="font-extrabold text-sm text-gray-900 mb-1.5 leading-snug">{dilemma.title}</h3>
        )}

        {/* Content */}
        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {isExpanded || dilemma.content.length <= 180
            ? dilemma.content
            : dilemma.content.slice(0, 180) + "..."}
          {dilemma.content.length > 180 && !isExpanded && (
            <button onClick={onToggleExpand} className="text-purple-600 font-bold ml-1">Read more</button>
          )}
        </p>

        {/* Prediction Section */}
        {dilemma.predictionQuestion && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/50">
            <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mb-1.5">
              <BarChart3 size={11} /> Community Prediction
            </p>
            <p className="text-xs font-semibold text-gray-800 mb-2">{dilemma.predictionQuestion}</p>
            <div className="flex flex-col gap-1">
              {dilemma.predictionOptions?.map((opt, i) => {
                const totalVotes = Object.values(dilemma.predictionVotes || {}).reduce((a, b) => a + b, 0);
                const votes = dilemma.predictionVotes?.[opt] || 0;
                const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                return (
                  <div key={i} className="relative overflow-hidden py-1.5 px-2.5 rounded-lg border border-amber-200 bg-white text-[11px] font-medium">
                    <div className="absolute inset-y-0 left-0 bg-amber-100/60 transition-all" style={{ width: `${pct}%` }} />
                    <span className="relative flex justify-between">
                      <span>{opt}</span>
                      {totalVotes > 0 && <span className="text-amber-600 font-bold">{pct}%</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Third Friend Viewpoint Card */}
        {aiSummary ? (
          <div className="mt-3 p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-purple-100/80 animate-fade-in">
            <div className="flex items-center gap-1.5 mb-1 text-purple-700">
              <Sparkles size={13} className="text-purple-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">AI Third Friend Synthesis</span>
            </div>
            <p className="text-[11px] text-gray-700 font-medium leading-relaxed">{aiSummary}</p>
            {aiDevilAdvocate && (
              <p className="text-[11px] text-purple-900 font-semibold mt-1.5 pt-1.5 border-t border-purple-100 leading-relaxed">
                {aiDevilAdvocate}
              </p>
            )}
          </div>
        ) : (
          <div className="mt-2 text-right">
            <button
              disabled={loadingAI}
              onClick={async (e) => {
                e.stopPropagation();
                setLoadingAI(true);
                try {
                  const res = await fetch("/api/loveguru", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "ai-third-friend", dilemmaId: dilemma.id }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    setAiSummary(data.summary);
                    setAiDevilAdvocate(data.devilAdvocate);
                  }
                } catch { /* ignore */ }
                finally {
                  setLoadingAI(false);
                }
              }}
              className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-all inline-flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 hover:bg-purple-100 disabled:opacity-50"
            >
              <Sparkles size={11} className={loadingAI ? "animate-spin text-purple-500" : "text-purple-600"} />
              {loadingAI ? "Consulting AI..." : "Ask AI Third Friend for Summary"}
            </button>
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-50">
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-purple-600 transition-all"
          >
            <MessageCircle size={13} />
            <span>{dilemma.responseCount} advices</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <Eye size={10} /> {dilemma.viewCount}
            </span>
            <button
              onClick={onStartRespond}
              className="py-1.5 px-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold flex items-center gap-1 hover:shadow-md transition-all active:scale-95"
            >
              <Send size={10} /> Give Advice
            </button>
          </div>
        </div>
      </div>

      {/* Response Input */}
      {isResponding && (
        <div className="p-3 border-t border-gray-100 bg-gray-50/50">
          <textarea
            value={responseText}
            onChange={(e) => onResponseTextChange(e.target.value)}
            placeholder="Share your honest, supportive advice..."
            className="w-full p-3 rounded-xl border border-gray-200 text-xs outline-none resize-none h-24 focus:border-purple-400 transition-all"
          />
          <div className="flex items-center justify-between mt-2">
            <button onClick={onCancelRespond} className="text-xs text-gray-400 font-semibold">Cancel</button>
            <button
              onClick={onSubmitResponse}
              disabled={!responseText.trim()}
              className="py-1.5 px-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1 transition-all hover:shadow-md"
            >
              <Send size={12} /> Post Advice
            </button>
          </div>
        </div>
      )}

      {/* Responses List */}
      {isExpanded && dilemma.responses.length > 0 && (
        <div className="border-t border-gray-50">
          {dilemma.responses.map((resp) => (
            <div key={resp.id} className="p-3.5 border-b border-gray-50 last:border-b-0">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5">
                  {resp.isAnonymous ? <Shield size={12} /> : resp.authorName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-bold text-gray-900">{resp.authorName}</span>
                    <span className="text-[10px] text-gray-400">•</span>
                    <span className="text-[10px] text-gray-400">{new Date(resp.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{resp.content}</p>

                  {/* Reason Tags */}
                  {Object.entries(resp.reasonTags).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(resp.reasonTags)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([tag, count]) => (
                          <span
                            key={tag}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || "bg-gray-50 text-gray-600 border-gray-200"}`}
                          >
                            {tag} {count > 1 ? `×${count}` : ""}
                          </span>
                        ))}
                    </div>
                  )}

                  {/* Vote buttons */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => onVote(dilemma.id, resp.id, "up")}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400 hover:text-green-600 transition-all"
                    >
                      <ChevronUp size={14} /> {resp.upvotes}
                    </button>
                    <button
                      onClick={() => onVote(dilemma.id, resp.id, "down")}
                      className="flex items-center gap-0.5 text-[10px] font-bold text-gray-400 hover:text-red-500 transition-all"
                    >
                      <ChevronDown size={14} /> {resp.downvotes}
                    </button>
                    <button
                      onClick={() => setShowTagPicker(showTagPicker === resp.id ? null : resp.id)}
                      className="text-[10px] font-bold text-purple-500 hover:text-purple-700 transition-all ml-1"
                    >
                      + Tag Reason
                    </button>
                  </div>

                  {/* Tag Picker */}
                  {showTagPicker === resp.id && (
                    <div className="mt-2 p-2 rounded-xl bg-gray-50 border border-gray-100 flex flex-wrap gap-1 animate-fade-in">
                      {REASON_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            onVote(dilemma.id, resp.id, "up", tag);
                            setShowTagPicker(null);
                          }}
                          className={`text-[9px] font-bold px-2 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${TAG_COLORS[tag]}`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

// ====== SWIPE GAME TAB ======
function SwipeGameTab({
  scenarios,
  currentIndex,
  result,
  score,
  onSwipe,
}: {
  scenarios: SwipeScenario[];
  currentIndex: number;
  result: { answer: "red" | "green"; correct: boolean } | null;
  score: number;
  onSwipe: (vote: "red" | "green") => void;
}) {
  const scenario = scenarios[currentIndex];
  if (!scenario) {
    return (
      <div className="p-8 text-center flex flex-col items-center gap-3 pt-20">
        <Zap size={36} className="text-gray-300" />
        <p className="font-bold text-sm text-gray-700">Loading scenarios...</p>
      </div>
    );
  }

  const total = scenario.redVotes + scenario.greenVotes;
  const redPct = total > 0 ? Math.round((scenario.redVotes / total) * 100) : 50;
  const greenPct = total > 0 ? Math.round((scenario.greenVotes / total) * 100) : 50;

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Score Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Flame size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">Your Score</p>
            <p className="text-lg font-black text-gray-900">{score}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 font-bold">{currentIndex + 1} / {scenarios.length}</p>
          <div className="w-24 h-1.5 rounded-full bg-gray-200 mt-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all"
              style={{ width: `${((currentIndex + 1) / scenarios.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Scenario Card */}
      <div className={`relative p-6 rounded-3xl border-2 transition-all duration-500 ${
        result
          ? result.correct
            ? "border-green-400 bg-green-50"
            : "border-red-400 bg-red-50"
          : "border-gray-200 bg-white"
      }`}
      style={{ minHeight: "280px" }}
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
            <AlertTriangle size={22} className="text-white" />
          </div>
        </div>

        <p className="text-center text-sm font-semibold text-gray-800 leading-relaxed px-2">
          &ldquo;{scenario.scenario}&rdquo;
        </p>

        <p className="text-center text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
          Is this a red flag or green flag?
        </p>

        {/* Result overlay */}
        {result && (
          <div className="mt-4 p-3 rounded-xl bg-white/80 border border-gray-100 animate-fade-in">
            <p className={`text-xs font-extrabold mb-1 ${result.correct ? "text-green-600" : "text-red-600"}`}>
              {result.correct ? "✅ Correct!" : "❌ Not quite!"}
            </p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{scenario.explanation}</p>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-[10px] font-bold text-red-500">
                🚩 {redPct}%
              </div>
              <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-red-400 to-red-500" style={{ width: `${redPct}%` }} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-500">
                🟢 {greenPct}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Swipe Buttons */}
      {!result && (
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => onSwipe("red")}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-red-400 to-red-600 text-white flex flex-col items-center justify-center shadow-xl hover:scale-110 hover:shadow-2xl transition-all active:scale-95"
            style={{ boxShadow: "0 8px 24px rgba(239,68,68,0.35)" }}
          >
            <span className="text-xl">🚩</span>
            <span className="text-[9px] font-black mt-0.5">RED FLAG</span>
          </button>
          <button
            onClick={() => onSwipe("green")}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 text-white flex flex-col items-center justify-center shadow-xl hover:scale-110 hover:shadow-2xl transition-all active:scale-95"
            style={{ boxShadow: "0 8px 24px rgba(34,197,94,0.35)" }}
          >
            <span className="text-xl">🟢</span>
            <span className="text-[9px] font-black mt-0.5">GREEN FLAG</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ====== LEADERBOARD TAB ======
function LeaderboardTab({
  leaderboard,
  onRefresh,
}: {
  leaderboard: GuruProfile[];
  onRefresh: () => void;
}) {
  const podiumColors = ["from-yellow-400 to-amber-500", "from-gray-300 to-gray-400", "from-amber-600 to-orange-700"];
  const podiumIcons = [<Crown key="1" size={18} className="text-white" />, <Award key="2" size={16} className="text-white" />, <Star key="3" size={16} className="text-white" />];

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-base text-gray-900 flex items-center gap-1.5">
          <Trophy size={18} className="text-amber-500" /> Guru Leaderboard
        </h3>
        <button onClick={onRefresh} className="text-[10px] font-bold text-purple-600 flex items-center gap-1 hover:underline">
          <RefreshCw size={10} /> Refresh
        </button>
      </div>

      {leaderboard.length === 0 ? (
        <div className="py-16 text-center">
          <Trophy size={36} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm font-bold text-gray-700">No gurus yet</p>
          <p className="text-xs text-gray-400 mt-1">Post dilemmas and give advice to earn Guru Points!</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {leaderboard.length >= 1 && (
            <div className="flex items-end justify-center gap-3 py-4">
              {[1, 0, 2].map((rIdx) => {
                const guru = leaderboard[rIdx];
                if (!guru) return <div key={rIdx} className="w-20" />;
                return (
                  <div key={rIdx} className={`flex flex-col items-center ${rIdx === 0 ? "order-2" : rIdx === 1 ? "order-1" : "order-3"}`}>
                    <div className={`w-${rIdx === 0 ? 14 : 11} h-${rIdx === 0 ? 14 : 11} rounded-full bg-gradient-to-br ${podiumColors[rIdx]} flex items-center justify-center shadow-lg mb-1`}
                      style={{ width: rIdx === 0 ? 56 : 44, height: rIdx === 0 ? 56 : 44 }}
                    >
                      {podiumIcons[rIdx]}
                    </div>
                    <p className="text-[11px] font-black text-gray-900 truncate max-w-[70px] text-center">{guru.name}</p>
                    <p className="text-[10px] font-bold text-purple-600">{guru.guruPoints} pts</p>
                    {guru.badges.length > 0 && (
                      <p className="text-[9px] text-amber-500">{guru.badges[guru.badges.length - 1]}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Full List */}
          <div className="flex flex-col gap-1.5">
            {leaderboard.map((guru, i) => (
              <div
                key={guru.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  i < 3 ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200" : "bg-white border-gray-100"
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                  i === 0 ? "bg-yellow-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-600 text-white" : "bg-gray-100 text-gray-600"
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{guru.name}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>{guru.responsesGiven} advices</span>
                    <span>•</span>
                    <span>🔥 {guru.streak} streak</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-purple-600">{guru.guruPoints}</p>
                  <p className="text-[9px] text-gray-400">pts</p>
                </div>
                {guru.badges.length > 0 && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                    {guru.badges[guru.badges.length - 1]}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ====== POST DILEMMA MODAL ======
function PostDilemmaModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    content: string;
    category: DilemmaCategory;
    isAnonymous: boolean;
    predictionQuestion?: string;
    predictionOptions?: string[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<DilemmaCategory>("Crushes");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [addPrediction, setAddPrediction] = useState(false);
  const [predictionQ, setPredictionQ] = useState("");
  const [predictionOpts, setPredictionOpts] = useState(["", ""]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    setLoading(true);
    onSubmit({
      title: title.trim(),
      content: content.trim(),
      category,
      isAnonymous,
      predictionQuestion: addPrediction ? predictionQ.trim() : undefined,
      predictionOptions: addPrediction ? predictionOpts.filter(Boolean) : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[440px] max-h-[85vh] bg-white rounded-t-3xl sm:rounded-3xl overflow-y-auto animate-fade-in-up shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10">
          <h2 className="font-black text-base text-gray-900 flex items-center gap-1.5">
            <Heart size={16} className="text-pink-500" /> Share Your Dilemma
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-all">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {/* Anonymous Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-100">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-800">Post Anonymously</span>
            </div>
            <button
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={`relative w-11 h-6 rounded-full transition-all ${isAnonymous ? "bg-purple-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${isAnonymous ? "left-5.5" : "left-0.5"}`}
                style={{ left: isAnonymous ? "22px" : "2px" }}
              />
            </button>
          </div>

          {/* Category */}
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.filter((c) => c.value !== "All").map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value as DilemmaCategory)}
                  className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full border transition-all ${
                    category === cat.value
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:border-pink-300"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Quick headline (optional)"
            className="w-full py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-400 transition-all"
          />

          {/* Content */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us what's happening. Be as detailed as you want — your identity is safe..."
              className="w-full p-3.5 rounded-xl border border-gray-200 text-xs outline-none resize-none h-32 focus:border-purple-400 transition-all leading-relaxed"
            />
            {content.trim() && (
              <div className="mt-1 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/loveguru", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "ai-refine", title, content }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setTitle(data.title);
                        setContent(data.content);
                      }
                    } catch { /* ignore */ }
                  }}
                  className="text-[10px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100 transition-all hover:bg-purple-100"
                >
                  <Sparkles size={11} className="text-purple-500" /> Refine with AI Assistant
                </button>
              </div>
            )}
          </div>

          {/* Prediction Toggle */}
          <div>
            <button
              onClick={() => setAddPrediction(!addPrediction)}
              className="text-xs font-bold text-purple-600 flex items-center gap-1 hover:underline"
            >
              <BarChart3 size={13} /> {addPrediction ? "Remove" : "Add"} Community Prediction
            </button>
            {addPrediction && (
              <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-2 animate-fade-in">
                <input
                  value={predictionQ}
                  onChange={(e) => setPredictionQ(e.target.value)}
                  placeholder="What will happen? (e.g. 'Will they get back together?')"
                  className="w-full py-2 px-3 rounded-lg border border-amber-200 text-xs outline-none focus:border-amber-400 bg-white"
                />
                {predictionOpts.map((opt, i) => (
                  <input
                    key={i}
                    value={opt}
                    onChange={(e) => {
                      const nOpts = [...predictionOpts];
                      nOpts[i] = e.target.value;
                      setPredictionOpts(nOpts);
                    }}
                    placeholder={`Option ${i + 1}`}
                    className="w-full py-2 px-3 rounded-lg border border-amber-200 text-xs outline-none focus:border-amber-400 bg-white"
                  />
                ))}
                {predictionOpts.length < 4 && (
                  <button
                    onClick={() => setPredictionOpts([...predictionOpts, ""])}
                    className="text-[10px] font-bold text-amber-600 hover:text-amber-800"
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} /> Post Dilemma
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== BATTLES TAB ======
function BattlesTab({
  battles,
  onVote,
}: {
  battles: AdviceBattle[];
  onVote: (battleId: string, side: 1 | 2) => void;
}) {
  const [votedBattles, setVotedBattles] = useState<Record<string, 1 | 2>>({});

  if (!battles || battles.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
        <Swords size={36} className="text-purple-400 mb-2 animate-bounce" />
        <h3 className="font-extrabold text-sm text-gray-900">No Active Advice Battles</h3>
        <p className="text-xs text-gray-500 max-w-[240px] mt-1">
          Check back soon! Daily advice battles rotate every 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 animate-fade-in">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Swords size={18} className="animate-pulse" />
          <h2 className="font-black text-sm uppercase tracking-wide">Daily Advice Battles</h2>
        </div>
        <p className="text-xs text-pink-100 leading-relaxed font-medium">
          Two contrasting student approaches face off — vote on which advice idea wins today!
        </p>
      </div>

      {/* Battle Cards List */}
      {battles.map((battle, idx) => {
        const userVote = votedBattles[battle.id];
        const v1 = battle.response1Votes + (userVote === 1 ? 1 : 0);
        const v2 = battle.response2Votes + (userVote === 2 ? 1 : 0);
        const total = v1 + v2;
        const pct1 = total > 0 ? Math.round((v1 / total) * 100) : 50;
        const pct2 = total > 0 ? 100 - pct1 : 50;

        return (
          <div
            key={battle.id}
            className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm space-y-3"
          >
            {/* Battle Tag & Snippet */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 uppercase tracking-wider flex items-center gap-1">
                <Flame size={10} /> Battle #{idx + 1}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">
                {total} community votes
              </span>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-bold text-gray-800 italic">
                "{battle.dilemmaSnippet}"
              </p>
            </div>

            {/* Face-off Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option 1 */}
              <div
                onClick={() => {
                  if (!userVote) {
                    setVotedBattles({ ...votedBattles, [battle.id]: 1 });
                    onVote(battle.id, 1);
                  }
                }}
                className={`relative overflow-hidden p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  userVote === 1
                    ? "border-pink-500 bg-pink-50/50 shadow-sm"
                    : userVote === 2
                    ? "border-gray-100 bg-gray-50/50 opacity-70"
                    : "border-pink-100 bg-gradient-to-br from-pink-50/40 to-white hover:border-pink-400 hover:shadow-md active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-pink-600 tracking-wider">
                    ⚡ {battle.response1.authorName}
                  </span>
                  {userVote === 1 && (
                    <span className="text-[10px] font-extrabold text-pink-600 bg-pink-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> Voted
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed mb-3">
                  "{battle.response1.content}"
                </p>

                {userVote ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-pink-700">
                      <span>{pct1}% Agree</span>
                      <span>{v1} votes</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-pink-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-700"
                        style={{ width: `${pct1}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button className="w-full py-1.5 text-center rounded-lg bg-pink-500 hover:bg-pink-600 text-white text-[11px] font-bold transition-all">
                    Vote Approach A
                  </button>
                )}
              </div>

              {/* Option 2 */}
              <div
                onClick={() => {
                  if (!userVote) {
                    setVotedBattles({ ...votedBattles, [battle.id]: 2 });
                    onVote(battle.id, 2);
                  }
                }}
                className={`relative overflow-hidden p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                  userVote === 2
                    ? "border-purple-500 bg-purple-50/50 shadow-sm"
                    : userVote === 1
                    ? "border-gray-100 bg-gray-50/50 opacity-70"
                    : "border-purple-100 bg-gradient-to-br from-purple-50/40 to-white hover:border-purple-400 hover:shadow-md active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider">
                    🔥 {battle.response2.authorName}
                  </span>
                  {userVote === 2 && (
                    <span className="text-[10px] font-extrabold text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 size={10} /> Voted
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed mb-3">
                  "{battle.response2.content}"
                </p>

                {userVote ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-purple-700">
                      <span>{pct2}% Agree</span>
                      <span>{v2} votes</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-purple-100 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${pct2}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button className="w-full py-1.5 text-center rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all">
                    Vote Approach B
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
