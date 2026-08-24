export type RadarCategory =
  | "Sports"
  | "Study"
  | "Events"
  | "Food"
  | "Gaming"
  | "Trips"
  | "Clubs"
  | "Personal Meetups"
  | "Others";

export interface CampusActivity {
  id: string;
  title: string;
  description: string;
  category: RadarCategory;
  locationName: string;
  approxDistance: string;
  latitude: number;
  longitude: number;
  time: string;
  date?: string;
  hostId: string;
  hostName: string;
  isAnonymousHost: boolean;
  maxParticipants?: number;
  participantIds: string[];
  participantCount: number;
  createdAt: string;
  tags?: string[];
}
