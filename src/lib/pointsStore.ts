import { fetchDbData } from "./supabaseStore";
import { MeetupItem } from "@/types/meetups";
import { CampusActivity } from "@/types/radar";

export async function calculateUserPoints(email: string): Promise<number> {
  if (!email || !email.trim()) return 50; // Welcome points
  const normalized = email.trim().toLowerCase();

  let points = 50; // Every user gets 50 welcome points

  try {
    // 1. Radar activities joined or hosted
    const activities = await fetchDbData<CampusActivity[]>("radar", []);
    if (Array.isArray(activities)) {
      for (const act of activities) {
        if (act.hostId && act.hostId.trim().toLowerCase() === normalized) {
          points += 10; // Hosting +10 pts
        } else if (
          Array.isArray(act.participantIds) &&
          act.participantIds.some((p: string) => p && p.trim().toLowerCase() === normalized)
        ) {
          points += 5; // Joining +5 pts
        }
      }
    }
  } catch (err) {
    console.error("Points: failed to read radar store:", err);
  }

  try {
    // 2. Meetup squads joined or hosted
    const meetups = await fetchDbData<MeetupItem[]>("meetups", []);
    if (Array.isArray(meetups)) {
      for (const m of meetups) {
        if (m.hostId && m.hostId.trim().toLowerCase() === normalized) {
          points += 10; // Hosting +10 pts
        } else if (
          Array.isArray(m.participantIds) &&
          m.participantIds.some((p: string) => p && p.trim().toLowerCase() === normalized)
        ) {
          points += 5; // Joining +5 pts
        }

        // Check Ins: +15 pts
        if (
          Array.isArray(m.checkIns) &&
          m.checkIns.some((c) => c && c.userId && c.userId.trim().toLowerCase() === normalized)
        ) {
          points += 15;
        }
      }
    }
  } catch (err) {
    console.error("Points: failed to read meetups store:", err);
  }

  try {
    // 3. Loveguru leaderboard points
    const lgStore = await fetchDbData<any>("loveguru", { leaderboard: [] });
    if (lgStore && Array.isArray(lgStore.leaderboard)) {
      const profile = lgStore.leaderboard.find(
        (p: any) => p && p.id && p.id.trim().toLowerCase() === normalized
      );
      if (profile && typeof profile.guruPoints === "number") {
        points += profile.guruPoints;
      }
    }
  } catch (err) {
    console.error("Points: failed to read loveguru store:", err);
  }

  return points;
}
