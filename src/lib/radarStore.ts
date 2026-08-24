import fs from "fs";
import path from "path";
import { CampusActivity, RadarCategory } from "@/types/radar";

const DATA_FILE = path.join(process.cwd(), "src", "data", "radar.json");

let memoryActivities: CampusActivity[] | null = null;

function readActivities(): CampusActivity[] {
  if (memoryActivities !== null) {
    return memoryActivities;
  }
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as CampusActivity[];
    memoryActivities = parsed;
    return parsed;
  } catch (err) {
    console.error("Error reading radar.json:", err);
    return [];
  }
}

function writeActivities(activities: CampusActivity[]): void {
  memoryActivities = activities;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(activities, null, 2), "utf-8");
  } catch (err) {
    console.warn("Save radar.json failed, falling back to memory storage:", err);
  }
}

export function getActivities(category?: string, query?: string): CampusActivity[] {
  let activities = readActivities();

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

export function getActivityById(id: string): CampusActivity | null {
  const activities = readActivities();
  return activities.find((a) => a.id === id) || null;
}

export function addActivity(params: {
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
}): CampusActivity {
  const activities = readActivities();

  // Use exact coordinates provided from interactive map picker or GPS
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
  writeActivities(activities);

  // Sync to Meetups Hub so every Radar activity has a Meetup Squad Hub
  try {
    const { getDiskMeetups, saveDiskMeetups } = require("./meetupsStore");
    const meetups = getDiskMeetups();
    if (!meetups.some((m: any) => m.id === newActivity.id)) {
      meetups.unshift({
        id: newActivity.id,
        title: newActivity.title,
        description: newActivity.description,
        category: newActivity.category,
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
      saveDiskMeetups(meetups);
    }
  } catch { /* ignore */ }

  return newActivity;
}

export function toggleJoinActivity(activityId: string, userId: string): { activity: CampusActivity; joined: boolean } | null {
  const activities = readActivities();
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
  writeActivities(activities);
  return { activity, joined };
}

export function deleteActivity(activityId: string): boolean {
  const activities = readActivities();
  const filtered = activities.filter((a) => a.id !== activityId);
  if (filtered.length !== activities.length) {
    writeActivities(filtered);
    return true;
  }
  return false;
}
