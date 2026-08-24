import { CampusActivity, RadarCategory } from "@/types/radar";
import { fetchDbData, saveDbData } from "@/lib/supabaseStore";
import { MeetupItem } from "@/types/meetups";

let memoryActivities: CampusActivity[] | null = null;

async function readActivities(): Promise<CampusActivity[]> {
  if (memoryActivities !== null) {
    // Return cache immediately, sync in background
    fetchDbData<CampusActivity[]>("radar", []).then(res => {
      memoryActivities = res;
    }).catch(() => {});
    return memoryActivities;
  }
  const activities = await fetchDbData<CampusActivity[]>("radar", []);
  memoryActivities = activities;
  return activities;
}

async function writeActivities(activities: CampusActivity[]): Promise<void> {
  memoryActivities = activities;
  await saveDbData<CampusActivity[]>("radar", activities);
}

export async function getActivities(category?: string, query?: string): Promise<CampusActivity[]> {
  let activities = await readActivities();

  if (category && category !== "All") {
    activities = activities.filter((a) => a.category === category);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    activities = activities.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.locationName.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }

  return activities;
}

export async function getActivityById(id: string): Promise<CampusActivity | null> {
  const activities = await readActivities();
  return activities.find((a) => a.id === id) || null;
}

export async function addActivity(params: {
  title: string;
  description: string;
  category: RadarCategory;
  locationName: string;
  approxDistance?: string;
  latitude?: number;
  longitude?: number;
  time: string;
  hostId: string;
  hostName: string;
  isAnonymousHost: boolean;
  maxParticipants?: number;
  tags?: string[];
}): Promise<CampusActivity> {
  const activities = await readActivities();

  const baseLat = params.latitude !== undefined ? params.latitude : 12.82247;
  const baseLng = params.longitude !== undefined ? params.longitude : 80.02622;
  const distance = params.approxDistance || "~150m away";

  const newActivity: CampusActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category,
    locationName: params.locationName.trim(),
    approxDistance: distance,
    latitude: parseFloat(baseLat.toFixed(5)),
    longitude: parseFloat(baseLng.toFixed(5)),
    time: params.time.trim(),
    hostId: params.hostId,
    hostName: params.isAnonymousHost ? "Anonymous Student" : params.hostName,
    isAnonymousHost: params.isAnonymousHost,
    maxParticipants: params.maxParticipants ? Number(params.maxParticipants) : undefined,
    participantIds: [params.hostId],
    participantCount: 1,
    createdAt: new Date().toISOString(),
    tags: params.tags || [],
  };

  activities.unshift(newActivity);
  await writeActivities(activities);

  // Sync to Meetups Hub so every Radar activity has a Meetup Squad Hub
  try {
    const meetups = await fetchDbData<MeetupItem[]>("meetups", []);
    if (!meetups.some((m: any) => m.id === newActivity.id)) {
      meetups.unshift({
        id: newActivity.id,
        title: newActivity.title,
        description: newActivity.description,
        category: newActivity.category as any,
        locationName: newActivity.locationName,
        latitude: newActivity.latitude,
        longitude: newActivity.longitude,
        time: newActivity.time,
        hostId: newActivity.hostId,
        hostName: newActivity.hostName,
        maxParticipants: newActivity.maxParticipants,
        participantIds: [newActivity.hostId],
        participantNames: [newActivity.hostName],
        chatMessages: [],
        checkIns: [
          {
            userId: newActivity.hostId,
            userName: newActivity.hostName,
            checkedInAt: newActivity.createdAt,
          },
        ],
        expenses: [],
        polls: [],
        createdAt: newActivity.createdAt,
      });
      await saveDbData<MeetupItem[]>("meetups", meetups);
    }
  } catch (err) {
    console.error("Failed to sync radar pin to meetup in Supabase:", err);
  }

  return newActivity;
}

export async function toggleJoinActivity(activityId: string, userId: string): Promise<{ activity: CampusActivity; joined: boolean } | null> {
  const activities = await readActivities();
  const idx = activities.findIndex((a) => a.id === activityId);
  if (idx === -1) return null;

  const activity = activities[idx];
  const joinedIndex = activity.participantIds.indexOf(userId);
  let joined = false;

  if (joinedIndex >= 0) {
    // Leave activity
    activity.participantIds.splice(joinedIndex, 1);
    activity.participantCount = Math.max(0, activity.participantCount - 1);
    joined = false;
  } else {
    // Join activity
    if (activity.maxParticipants && activity.participantCount >= activity.maxParticipants) {
      throw new Error("Activity capacity reached!");
    }
    activity.participantIds.push(userId);
    activity.participantCount += 1;
    joined = true;
  }

  activities[idx] = activity;
  await writeActivities(activities);
  return { activity, joined };
}

export async function deleteActivity(activityId: string): Promise<boolean> {
  const activities = await readActivities();
  const filtered = activities.filter((a) => a.id !== activityId);
  if (filtered.length !== activities.length) {
    await writeActivities(filtered);
    return true;
  }
  return false;
}
