// ================================================
// Love Guru — Types & Interfaces
// ================================================

export type DilemmaCategory =
  | "Crushes"
  | "Relationships"
  | "Breakups"
  | "Friendships"
  | "Communication"
  | "Situationships"
  | "College Life"
  | "General";

export type VoteReasonTag =
  | "protect yourself"
  | "give another chance"
  | "context matters"
  | "red flag"
  | "green flag"
  | "trust your gut"
  | "talk it out"
  | "move on"
  | "set boundaries"
  | "it depends";

export interface GuruResponse {
  id: string;
  dilemmaId: string;
  content: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  reasonTags: Record<VoteReasonTag, number>;
  userVote?: "up" | "down" | null;
}

export interface DilemmaPost {
  id: string;
  title: string;
  content: string;
  category: DilemmaCategory;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: string;
  responses: GuruResponse[];
  responseCount: number;
  viewCount: number;
  // Prediction feature
  predictionQuestion?: string;
  predictionOptions?: string[];
  predictionVotes?: Record<string, number>;
  actualOutcome?: string;
  // AI summary
  aiSummary?: string;
  aiDevilAdvocate?: string;
  // Status
  status: "open" | "resolved" | "updated";
  updateContent?: string;
  updatedAt?: string;
}

export interface SwipeScenario {
  id: string;
  scenario: string;
  category: DilemmaCategory;
  correctAnswer: "red" | "green";
  explanation: string;
  redVotes: number;
  greenVotes: number;
}

export interface AdviceBattle {
  id: string;
  dilemmaId: string;
  dilemmaSnippet: string;
  response1: GuruResponse;
  response2: GuruResponse;
  response1Votes: number;
  response2Votes: number;
  status: "active" | "completed";
  expiresAt: string;
}

export interface GuruProfile {
  id: string;
  name: string;
  isAnonymous: boolean;
  guruPoints: number;
  responsesGiven: number;
  adviceWins: number;
  topReasonTag?: VoteReasonTag;
  streak: number;
  rank?: number;
  badges: string[];
}

export interface DailyChallenge {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "scenario" | "wwyd" | "confession" | "poll";
  content: string;
  options?: string[];
  votes?: Record<string, number>;
  participantCount: number;
}
