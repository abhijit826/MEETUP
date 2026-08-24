"use client";

import React, { useState } from "react";
import { X, Send, ShieldCheck, User, MessageCircle } from "lucide-react";
import { ConfessionItem } from "@/types/confessions";
import { Button } from "@/components/ui/Button";

interface CommentsModalProps {
  confession: ConfessionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (confessionId: string, text: string, isAnonymous: boolean) => void;
  userFullName: string;
}

export const CommentsModal: React.FC<CommentsModalProps> = ({
  confession,
  isOpen,
  onClose,
  onAddComment,
  userFullName,
}) => {
  const [text, setText] = useState("");
  const [isAnonComment, setIsAnonComment] = useState(false);

  if (!isOpen || !confession) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(confession.id, text.trim(), isAnonComment);
    setText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-[440px] rounded-3xl p-6 bg-white shadow-2xl border border-gray-100 animate-scale-up max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-[#4F46E5]" />
            <h3 className="text-base font-black text-gray-900">
              Comments ({confession.commentsCount || confession.comments?.length || 0})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Confession Snippet */}
        <div className="py-3 px-3.5 my-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-600 line-clamp-2 shrink-0">
          <span className="font-bold text-gray-900">{confession.authorName}: </span>
          &quot;{confession.content}&quot;
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto pr-1 my-2 flex flex-col gap-3">
          {(!confession.comments || confession.comments.length === 0) ? (
            <div className="text-center py-8 text-xs text-gray-400">
              No comments yet. Be the first to reply!
            </div>
          ) : (
            confession.comments.map((comment) => (
              <div
                key={comment.id}
                className="p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col gap-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-gray-900">
                    {comment.isAnonymous ? (
                      <>
                        <ShieldCheck size={13} className="text-[#4F46E5]" />
                        <span>Anonymous</span>
                      </>
                    ) : (
                      <>
                        <User size={13} className="text-[#EF4444]" />
                        <span>{comment.authorName}</span>
                      </>
                    )}
                    <span className="text-[10px] font-normal text-gray-400">
                      • {comment.authorCollege}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">{comment.createdAt}</span>
                </div>
                <p className="text-gray-700 font-medium leading-relaxed mt-0.5">
                  {comment.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Comment Input */}
        <form onSubmit={handleSubmit} className="pt-3 border-t border-gray-100 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>Comment identity:</span>
            <button
              type="button"
              onClick={() => setIsAnonComment((v) => !v)}
              className="font-bold flex items-center gap-1 text-[#4F46E5] hover:underline"
            >
              {isAnonComment ? (
                <>
                  <ShieldCheck size={12} />
                  Posting Anonymously
                </>
              ) : (
                <>
                  <User size={12} />
                  Posting as {userFullName || "Profile"}
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              required
              className="flex-1 h-11 px-4 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#4F46E5] transition-all"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!text.trim()}
              className="h-11 px-4 rounded-xl shrink-0"
            >
              <Send size={15} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
