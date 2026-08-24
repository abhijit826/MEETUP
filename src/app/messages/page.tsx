"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  User,
  Send,
  MoreVertical,
  Flag,
  Ban,
  Eye,
  CheckCircle2,
  Lock,
  MessageCircle,
} from "lucide-react";
import { Conversation, DirectMessage } from "@/types/confessions";
import { ReportModal } from "@/components/confessions/ReportModal";
import { Button } from "@/components/ui/Button";

function MessagesContent() {
  const searchParams = useSearchParams();
  const initialConvId = searchParams.get("convId");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConvId);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userFullName, setUserFullName] = useState("Student");
  const [userEmail, setUserEmail] = useState("");

  // Options & Report state
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch conversations from API
  const fetchConversations = useCallback(async (email?: string) => {
    try {
      const url = email ? `/api/messages?email=${encodeURIComponent(email)}` : "/api/messages";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Fetch messages for active conversation from API
  const fetchActiveMessages = useCallback(async (convId: string) => {
    if (!userEmail) return;
    try {
      const res = await fetch(
        `/api/messages?convId=${encodeURIComponent(convId)}&userId=${encodeURIComponent(userEmail)}`
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
      }
    } catch {
      // ignore
    }
  }, [userEmail]);

  useEffect(() => {
    let email = "";
    if (typeof window !== "undefined") {
      const sessionStr = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sm_user_session="))
        ?.split("=")[1];
      if (sessionStr) {
        try {
          const parsed = JSON.parse(decodeURIComponent(sessionStr));
          if (parsed.fullName) setUserFullName(parsed.fullName);
          if (parsed.email) {
            email = parsed.email;
            setUserEmail(parsed.email);
          }
        } catch {
          // default
        }
      }
    }

    fetchConversations(email);

    if (initialConvId) {
      setActiveConvId(initialConvId);
    }

    // Set up real-time polling for conversations list (every 3 seconds)
    const interval = setInterval(() => {
      fetchConversations(email);
    }, 3000);

    return () => clearInterval(interval);
  }, [initialConvId, fetchConversations]);

  // Load and poll active conversation messages (every 2 seconds for instant chat)
  useEffect(() => {
    if (!activeConvId) return;

    fetchActiveMessages(activeConvId);

    const interval = setInterval(() => {
      fetchActiveMessages(activeConvId);
    }, 2000);

    return () => clearInterval(interval);
  }, [activeConvId, fetchActiveMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const activeConversation = conversations.find((c) => c.id === activeConvId) || null;

  // Send Direct Message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConvId) return;

    const contentToSend = inputText.trim();
    setInputText("");

    // Optimistic message append
    const optimisticMsg: DirectMessage = {
      id: `temp-${Date.now()}`,
      conversationId: activeConvId,
      senderId: userEmail ? `user-${userEmail}` : "user-current",
      senderName: userFullName,
      isAnonymousSender: false,
      content: contentToSend,
      timestamp: "Just now",
      isRead: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          convId: activeConvId,
          content: contentToSend,
          senderId: userEmail ? `user-${userEmail}` : "user-current",
          senderName: userFullName,
          isAnonymousSender: false,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setMessages(data.messages);
        if (data.conversations) setConversations(data.conversations);
      }
    } catch {
      triggerToast("❌ Message failed to send.");
    }
  };

  const handleRevealIdentity = async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reveal",
          convId: activeConvId,
          realName: userFullName,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        triggerToast("🔓 Identity revealed! The other user can now see your profile.");
      }
    } catch {
      // ignore
    }
  };

  const handleToggleBlock = async () => {
    if (!activeConvId) return;
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "block",
          convId: activeConvId,
        }),
      });
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        setShowOptionsMenu(false);
        triggerToast(
          activeConversation?.isBlocked
            ? "User unblocked."
            : "User blocked from sending further messages."
        );
      }
    } catch {
      // ignore
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const isMeParticipant1 = userEmail && c.participant1Id.toLowerCase().includes(userEmail.toLowerCase());
    const otherName = isMeParticipant1 ? (c.participant2IsAnonymous ? "Anonymous" : c.participant2Name) : (c.participant1IsAnonymous ? "Anonymous" : c.participant1Name);
    return (
      otherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-0 sm:p-4"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 z-50 px-5 py-3 rounded-2xl bg-gray-900 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full max-w-[440px] h-screen sm:h-[880px] bg-white sm:rounded-3xl sm:border sm:border-gray-200 sm:shadow-2xl flex flex-col overflow-hidden">
        {/* VIEW 1: CONVERSATION LIST */}
        {!activeConvId ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header */}
            <header className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link
                  href="/confessions"
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-700"
                >
                  <ArrowLeft size={18} />
                </Link>
                <div>
                  <h1 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-1.5">
                    Messages
                    <span className="text-xs py-0.5 px-2 rounded-full bg-indigo-100 text-[#4F46E5] font-bold">
                      Private
                    </span>
                  </h1>
                  <p className="text-xs text-gray-500">Anonymous &amp; Direct Chat</p>
                </div>
              </div>
            </header>

            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl border border-gray-200 text-xs outline-none focus:border-[#4F46E5] bg-gray-50/50"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-16 px-4 flex flex-col items-center gap-3">
                  <MessageCircle size={36} className="text-gray-300" />
                  <p className="font-bold text-sm text-gray-800">No private messages yet</p>
                  <p className="text-xs text-gray-400 max-w-[240px]">
                    Tap &quot;Message privately&quot; on any confession in the feed to start an anonymous private chat!
                  </p>
                  <Link href="/confessions">
                    <Button variant="primary" size="sm" className="mt-2 font-bold text-xs">
                      Explore Confessions
                    </Button>
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isMeP1 = userEmail && conv.participant1Id.toLowerCase().includes(userEmail.toLowerCase());
                  const isAnon = isMeP1 ? conv.participant2IsAnonymous : conv.participant1IsAnonymous;
                  const displayName = isMeP1
                    ? (conv.participant2IsAnonymous ? "Anonymous" : conv.participant2Name)
                    : (conv.participant1IsAnonymous ? "Anonymous" : conv.participant1Name);
                  const college = isMeP1 ? conv.participant2College : conv.participant1College;
                  const avatar = isMeP1 ? conv.participant2Avatar : conv.participant1Avatar;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConvId(conv.id)}
                      className="p-4 hover:bg-gray-50/80 transition-all cursor-pointer flex items-center gap-3.5"
                    >
                      {/* Avatar */}
                      <div
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                          isAnon
                            ? "bg-indigo-50 text-[#4F46E5] border border-indigo-100"
                            : "bg-coral-50 text-[#EF4444] border border-coral-100"
                        }`}
                      >
                        {isAnon ? (
                          <ShieldCheck size={22} />
                        ) : (
                          avatar || <User size={22} />
                        )}

                        {conv.unreadCount > 0 && (
                          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm text-gray-900 truncate">
                              {displayName}
                            </span>
                            <span className="text-[10px] font-bold py-0.5 px-1.5 rounded-md bg-gray-100 text-gray-600 shrink-0">
                              {college}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {conv.lastMessageTimestamp}
                          </span>
                        </div>

                        {/* Confession Snippet Badge */}
                        {conv.confessionSnippet && (
                          <p className="text-[11px] text-[#4F46E5] font-semibold truncate mb-1 bg-indigo-50/60 px-2 py-0.5 rounded-md border border-indigo-100/50">
                            From Confession: &quot;{conv.confessionSnippet}&quot;
                          </p>
                        )}

                        <p className="text-xs text-gray-500 truncate font-medium">
                          {conv.lastMessage}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* VIEW 2: ACTIVE PRIVATE CHAT VIEW */
          <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* Header */}
            {activeConversation && (
              <header className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-white z-10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-all text-gray-700"
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {/* Participant Avatar & Name */}
                  {(() => {
                    const isMeP1 = userEmail && activeConversation.participant1Id.toLowerCase().includes(userEmail.toLowerCase());
                    const isAnon = isMeP1 ? activeConversation.participant2IsAnonymous : activeConversation.participant1IsAnonymous;
                    const displayName = isMeP1
                      ? (activeConversation.participant2IsAnonymous ? "Anonymous" : activeConversation.participant2Name)
                      : (activeConversation.participant1IsAnonymous ? "Anonymous" : activeConversation.participant1Name);
                    const college = isMeP1 ? activeConversation.participant2College : activeConversation.participant1College;
                    const avatar = isMeP1 ? activeConversation.participant2Avatar : activeConversation.participant1Avatar;

                    return (
                      <>
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            isAnon
                              ? "bg-indigo-50 text-[#4F46E5] border border-indigo-100"
                              : "bg-coral-50 text-[#EF4444] border border-coral-100"
                          }`}
                        >
                          {isAnon ? <ShieldCheck size={18} /> : avatar || <User size={18} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h2 className="font-extrabold text-sm text-gray-900 leading-tight">
                              {displayName}
                            </h2>
                            <span className="text-[10px] font-bold py-0.2 px-1.5 rounded bg-gray-100 text-gray-600">
                              {college}
                            </span>
                          </div>

                          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active Now • Real-Time Chat
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-1 relative">
                  {activeConversation.participant2IsAnonymous && (
                    <button
                      onClick={handleRevealIdentity}
                      className="py-1 px-2.5 rounded-full bg-indigo-50 text-[#4F46E5] hover:bg-[#4F46E5] hover:text-white transition-all text-[11px] font-bold flex items-center gap-1 border border-indigo-200"
                      title="Reveal your identity voluntarily to this user"
                    >
                      <Eye size={12} />
                      <span>Reveal Identity</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowOptionsMenu((v) => !v)}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {showOptionsMenu && (
                    <div className="absolute right-0 top-10 w-44 rounded-2xl bg-white border border-gray-100 shadow-xl p-1 z-30 animate-fade-in text-xs font-semibold text-gray-700">
                      <button
                        onClick={handleToggleBlock}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-gray-50 flex items-center gap-2 text-gray-800"
                      >
                        <Ban size={14} className="text-gray-500" />
                        <span>
                          {activeConversation.isBlocked ? "Unblock User" : "Block User"}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          setIsReportOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left rounded-xl hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <Flag size={14} />
                        <span>Report Chat</span>
                      </button>
                    </div>
                  )}
                </div>
              </header>
            )}

            {/* Confession Excerpt Context Banner */}
            {activeConversation?.confessionSnippet && (
              <div className="p-3 bg-indigo-50/70 border-b border-indigo-100/60 text-xs text-indigo-950 flex items-start gap-2 shrink-0">
                <Lock size={14} className="text-[#4F46E5] shrink-0 mt-0.5" />
                <p className="line-clamp-2">
                  <span className="font-bold text-[#4F46E5]">Confession Context: </span>
                  &quot;{activeConversation.confessionSnippet}&quot;
                </p>
              </div>
            )}

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-slate-50/50">
              {messages.map((msg) => {
                const isMe =
                  (userEmail && msg.senderId.toLowerCase().includes(userEmail.toLowerCase())) ||
                  msg.senderId === "user-current" ||
                  (!userEmail && msg.senderName === userFullName);

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      isMe ? "self-end items-end" : "self-start items-start"
                    }`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                        isMe
                          ? "bg-[#4F46E5] text-white rounded-br-none"
                          : "bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Blocked Alert or Input Bar */}
            {activeConversation?.isBlocked ? (
              <div className="p-4 bg-gray-100 text-center text-xs text-gray-500 font-semibold border-t border-gray-200">
                🚫 You have blocked this user. You cannot send or receive messages.
              </div>
            ) : (
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-gray-100 bg-white flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  required
                  className="flex-1 h-11 px-4 rounded-2xl border border-gray-200 text-xs outline-none focus:border-[#4F46E5] transition-all"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim()}
                  className="h-11 px-4 rounded-2xl shrink-0"
                >
                  <Send size={15} />
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        title="Report Conversation"
      />
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Messages...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
