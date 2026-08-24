import fs from "fs";
import path from "path";
import { MeetupItem, MeetupCategory, MeetupChatMessage, MeetupExpense, MeetupPoll } from "@/types/meetups";

const MEETUPS_FILE = path.join(process.cwd(), "src", "data", "meetups.json");

function ensureFile() {
  try {
    const dir = path.dirname(MEETUPS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(MEETUPS_FILE)) {
      fs.writeFileSync(MEETUPS_FILE, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error creating meetups.json:", err);
  }
}

let memoryMeetups: MeetupItem[] | null = null;

export function getDiskMeetups(): MeetupItem[] {
  if (memoryMeetups !== null) {
    return memoryMeetups;
  }
  ensureFile();
  try {
    const data = fs.readFileSync(MEETUPS_FILE, "utf-8");
    if (!data.trim()) return [];
    const parsed = JSON.parse(data) as MeetupItem[];
    memoryMeetups = parsed;
    return parsed;
  } catch (err) {
    console.error("Error reading meetups.json:", err);
    return [];
  }
}

export function saveDiskMeetups(meetups: MeetupItem[]): void {
  memoryMeetups = meetups;
  ensureFile();
  try {
    fs.writeFileSync(MEETUPS_FILE, JSON.stringify(meetups, null, 2), "utf-8");
  } catch (err) {
    console.warn("Save meetups.json failed, falling back to memory storage:", err);
  }
}

export function getMeetups(category?: string, query?: string): MeetupItem[] {
  let list = getDiskMeetups();

  if (category && category !== "All") {
    list = list.filter((m) => m.category === category);
  }

  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.locationName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createMeetup(params: {
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
}): MeetupItem {
  const meetups = getDiskMeetups();

  const newMeetup: MeetupItem = {
    id: `meetup-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: params.title.trim(),
    description: params.description.trim(),
    category: params.category,
    locationName: params.locationName.trim(),
    latitude: params.latitude,
    longitude: params.longitude,
    time: params.time.trim(),
    hostId: params.hostId,
    hostName: params.hostName,
    maxParticipants: params.maxParticipants,
    participantIds: [params.hostId],
    participantNames: [params.hostName],
    chatMessages: [],
    checkIns: [
      {
        userId: params.hostId,
        userName: params.hostName,
        checkedInAt: new Date().toISOString(),
      },
    ],
    expenses: [],
    polls: [],
    createdAt: new Date().toISOString(),
  };

  meetups.unshift(newMeetup);
  saveDiskMeetups(meetups);

  // Sync to Radar Store so every Meetup shows on Campus Radar Map
  try {
    const { getActivities, writeActivities } = require("./radarStore");
    const activities = getActivities();
    if (!activities.some((a: any) => a.id === newMeetup.id)) {
      activities.unshift({
        id: newMeetup.id,
        title: newMeetup.title,
        description: newMeetup.description,
        category: newMeetup.category,
        locationName: newMeetup.locationName,
        approxDistance: "~150m away",
        latitude: newMeetup.latitude,
        longitude: newMeetup.longitude,
        time: newMeetup.time,
        hostId: newMeetup.hostId,
        hostName: newMeetup.hostName,
        isAnonymousHost: false,
        maxParticipants: newMeetup.maxParticipants,
        participantIds: [newMeetup.hostId],
        participantCount: 1,
        createdAt: newMeetup.createdAt,
        tags: [],
      });
      const fs = require("fs");
      const path = require("path");
      fs.writeFileSync(
        path.join(process.cwd(), "src", "data", "radar.json"),
        JSON.stringify(activities, null, 2),
        "utf-8"
      );
    }
  } catch { /* ignore */ }

  return newMeetup;
}

export function toggleJoinMeetup(meetupId: string, userId: string, userName: string) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);

  if (index === -1) return null;

  const meetup = meetups[index];
  const isJoined = meetup.participantIds.includes(userId);

  if (isJoined) {
    meetup.participantIds = meetup.participantIds.filter((id) => id !== userId);
    meetup.participantNames = meetup.participantNames.filter((name) => name !== userName);
  } else {
    if (meetup.maxParticipants && meetup.participantIds.length >= meetup.maxParticipants) {
      return { meetup, joined: false, error: "Meetup capacity full" };
    }
    meetup.participantIds.push(userId);
    if (!meetup.participantNames.includes(userName)) {
      meetup.participantNames.push(userName);
    }
  }

  saveDiskMeetups(meetups);
  return { meetup, joined: !isJoined };
}

export function sendMeetupChatMessage(meetupId: string, senderId: string, senderName: string, text: string) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  const msg: MeetupChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    senderId,
    senderName,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  meetup.chatMessages.push(msg);
  saveDiskMeetups(meetups);
  return { meetup, msg };
}

export function addMeetupCheckIn(meetupId: string, userId: string, userName: string, userLat?: number, userLng?: number) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  const alreadyCheckedIn = meetup.checkIns.some((c) => c.userId === userId);

  if (!alreadyCheckedIn) {
    meetup.checkIns.push({
      userId,
      userName,
      checkedInAt: new Date().toISOString(),
      lat: userLat,
      lng: userLng,
    });
    saveDiskMeetups(meetups);
  }

  return meetup;
}

export function addMeetupExpense(meetupId: string, title: string, totalAmount: number, paidBy: string, paidByName: string) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  const count = Math.max(1, meetup.participantIds.length);
  const perPerson = Math.round(totalAmount / count);

  const expense: MeetupExpense = {
    id: `exp-${Date.now()}`,
    title: title.trim(),
    totalAmount,
    paidBy,
    paidByName,
    perPerson,
    createdAt: new Date().toISOString(),
  };

  meetup.expenses.push(expense);
  saveDiskMeetups(meetups);
  return { meetup, expense };
}

export function addMeetupPoll(meetupId: string, question: string, options: string[]) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  const poll: MeetupPoll = {
    id: `poll-${Date.now()}`,
    question: question.trim(),
    options: options.map((opt, idx) => ({
      id: `opt-${idx}`,
      text: opt.trim(),
      voterIds: [],
    })),
    createdAt: new Date().toISOString(),
  };

  meetup.polls.push(poll);
  saveDiskMeetups(meetups);
  return { meetup, poll };
}

export function voteMeetupPoll(meetupId: string, pollId: string, optionId: string, userId: string) {
  const meetups = getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  const poll = meetup.polls.find((p) => p.id === pollId);
  if (!poll) return null;

  poll.options.forEach((opt) => {
    opt.voterIds = opt.voterIds.filter((id) => id !== userId);
    if (opt.id === optionId) {
      opt.voterIds.push(userId);
    }
  });

  saveDiskMeetups(meetups);
  return meetup;
}
