export type MeetupCategory = "Study" | "Chai & Snacks" | "Sports" | "Trips" | "Gaming" | "Other";

export interface MeetupChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
}

export interface MeetupCheckIn {
  userId: string;
  userName: string;
  checkedInAt: string;
  lat?: number;
  lng?: number;
}

export interface MeetupExpense {
  id: string;
  title: string;
  totalAmount: number;
  paidBy: string;
  paidByName: string;
  perPerson: number;
  createdAt: string;
}

export interface MeetupPollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface MeetupPoll {
  id: string;
  question: string;
  options: MeetupPollOption[];
  createdAt: string;
}

export interface MeetupItem {
  id: string;
  title: string;
  description: string;
  category: MeetupCategory;
  locationName: string;
  latitude: number;
  longitude: number;
  time: string;
  hostId: string;
  hostName: string;
  maxParticipants?: number;
  participantIds: string[];
  participantNames: string[];
  chatMessages: MeetupChatMessage[];
  checkIns: MeetupCheckIn[];
  expenses: MeetupExpense[];
  polls: MeetupPoll[];
  createdAt: string;
}
