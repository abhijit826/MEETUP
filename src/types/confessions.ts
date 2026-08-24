export type CategoryType =
  | "Love"
  | "Campus"
  | "Events"
  | "Trips"
  | "Careers"
  | "Friendships"
  | "General";

export type ReactionType = "heart" | "relatable" | "mindblown" | "support";

export interface PublicComment {
  id: string;
  confessionId: string;
  authorName: string;
  authorCollege: string;
  isAnonymous: boolean;
  content: string;
  createdAt: string;
  likes: number;
  userLiked?: boolean;
}

export interface ConfessionItem {
  id: string;
  content: string;
  imageUrl?: string;
  category: CategoryType;
  isAnonymous: boolean;
  authorId: string;
  authorName: string; // e.g. "Alex Morgan" or "Anonymous Student"
  authorCollege: string; // e.g. "SRM ✓"
  authorAvatar?: string;
  createdAt: string;
  reactions: {
    heart: number;
    relatable: number;
    mindblown: number;
    support: number;
  };
  userReactions: {
    heart?: boolean;
    relatable?: boolean;
    mindblown?: boolean;
    support?: boolean;
  };
  commentsCount: number;
  comments: PublicComment[];
  moderationStatus?: "approved" | "flagged";
  moderationReason?: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  isAnonymousSender: boolean;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  confessionId?: string;
  confessionSnippet?: string;
  participant1Id: string;
  participant1Name: string;
  participant1College: string;
  participant1IsAnonymous: boolean;
  participant1Avatar?: string;
  participant2Id: string;
  participant2Name: string;
  participant2College: string;
  participant2IsAnonymous: boolean;
  participant2Avatar?: string;
  isIdentityRevealed?: boolean;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCount: number;
  isBlocked?: boolean;
}
