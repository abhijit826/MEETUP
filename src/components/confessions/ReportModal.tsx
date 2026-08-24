"use client";

import React, { useState } from "react";
import { X, Flag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  confessionId?: string | null;
  onReportSubmitted?: () => void;
}

const REPORT_REASONS = [
  "Spam or misleading content",
  "Harassment or personal attack",
  "Hate speech or discrimination",
  "Inappropriate or explicit content",
  "Privacy violation / revealing personal info",
  "Other campus policy violation",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  title = "Report Content",
  onReportSubmitted,
}) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;
    setSubmitted(true);
    if (onReportSubmitted) onReportSubmitted();
    setTimeout(() => {
      setSubmitted(false);
      setSelectedReason(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-[400px] rounded-3xl p-6 bg-white shadow-2xl border border-gray-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-red-600">
            <Flag size={18} />
            <h3 className="text-base font-black text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center flex flex-col items-center gap-3 animate-fade-in">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="font-bold text-sm text-gray-900">Report Submitted</p>
            <p className="text-xs text-gray-500 max-w-[240px]">
              Thank you for keeping our campus community safe. Our moderation team will review this promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <p className="text-xs text-gray-500">
              Please select the reason for reporting this post or message:
            </p>

            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`p-3 rounded-2xl text-left text-xs font-semibold border transition-all ${
                    selectedReason === reason
                      ? "bg-red-50 text-red-700 border-red-200 ring-2 ring-red-500/20"
                      : "bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={!selectedReason}
              className="mt-2 font-bold rounded-2xl"
            >
              Submit Report
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
