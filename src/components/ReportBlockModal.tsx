"use client";

import React, { useState } from "react";
import { ShieldAlert, Ban, Flag, X, CheckCircle2 } from "lucide-react";

interface ReportBlockModalProps {
  currentUserId: string;
  targetUserId: string;
  targetUserName?: string;
  targetId?: string;
  targetType?: "user" | "activity" | "meetup" | "confession" | "message";
  onClose: () => void;
  onSuccess?: (action: "blocked" | "reported") => void;
}

const REPORT_REASONS = [
  "Harassment or Bullying 🚫",
  "Offensive or Explicit Content ⚠️",
  "Fake Account or Impersonation 👤",
  "Spam, Scam, or Fraud 💬",
  "Safety Concern / Misbehavior 🚨",
  "Other Reason 📝",
];

export default function ReportBlockModal({
  currentUserId,
  targetUserId,
  targetUserName = "this user",
  targetId,
  targetType = "user",
  onClose,
  onSuccess,
}: ReportBlockModalProps) {
  const [activeMode, setActiveMode] = useState<"choose" | "report" | "block">("choose");
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block",
          blockerId: currentUserId,
          blockedId: targetUserId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess("blocked");
        setTimeout(onClose, 1500);
      } else {
        alert(data.error || "Failed to block user");
      }
    } catch {
      alert("Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "report",
          reporterId: currentUserId,
          reportedUserId: targetUserId,
          reportedUserName: targetUserName,
          targetId,
          targetType,
          reason,
          details: details.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess("reported");
        setTimeout(onClose, 1500);
      } else {
        alert(data.error || "Failed to submit report");
      }
    } catch {
      alert("Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="font-black text-sm text-gray-900">Safety &amp; Moderation</h3>
              <p className="text-[10px] text-gray-400 font-medium">Protecting student community</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500 animate-bounce" />
            <h4 className="font-extrabold text-sm text-gray-900">
              {activeMode === "block" ? "User Blocked" : "Report Submitted"}
            </h4>
            <p className="text-xs text-gray-500">
              {activeMode === "block"
                ? `You will no longer see posts or messages from ${targetUserName}.`
                : "Thank you for keeping Campus Meetup safe. Our moderation team will review this."}
            </p>
          </div>
        ) : activeMode === "choose" ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-600 font-medium">
              What action would you like to take regarding <span className="font-bold text-gray-900">{targetUserName}</span>?
            </p>

            <button
              onClick={() => setActiveMode("block")}
              className="w-full p-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center gap-3 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                <Ban size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-red-900">Block {targetUserName}</h4>
                <p className="text-[10px] text-red-700">
                  Hide all their messages, meetups, and confessions from your feed.
                </p>
              </div>
            </button>

            <button
              onClick={() => setActiveMode("report")}
              className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center gap-3 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-all">
                <Flag size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-amber-900">Report Inappropriate Behavior</h4>
                <p className="text-[10px] text-amber-700">
                  Flag harassment, fake profiles, or offensive content to AI Safety admins.
                </p>
              </div>
            </button>
          </div>
        ) : activeMode === "block" ? (
          <div className="space-y-4">
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-center space-y-1">
              <Ban size={24} className="mx-auto text-red-600" />
              <h4 className="font-extrabold text-xs text-red-900">Confirm Block</h4>
              <p className="text-[11px] text-red-700">
                Are you sure you want to block <span className="font-bold">{targetUserName}</span>?
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveMode("choose")}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleBlock}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {loading ? "Blocking..." : "Yes, Block User"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Reason for Report</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs bg-white font-medium outline-none focus:border-purple-500"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">Additional Details (Optional)</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Provide context or specify what happened..."
                className="w-full py-2 px-3 rounded-xl border border-gray-200 text-xs outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveMode("choose")}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-md disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
