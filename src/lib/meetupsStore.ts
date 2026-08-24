import { MeetupItem, MeetupCategory, MeetupChatMessage, MeetupExpense, MeetupPoll } from "@/types/meetups";
import { fetchDbData, saveDbData } from "@/lib/supabaseStore";
import { CampusActivity } from "@/types/radar";

let memoryMeetups: MeetupItem[] | null = null;

export async function getDiskMeetups(): Promise<MeetupItem[]> {
  if (memoryMeetups !== null) {
    // Return cache immediately, sync in background
    fetchDbData<MeetupItem[]>("meetups", []).then(res => {
      memoryMeetups = res;
    }).catch(() => {});
    return memoryMeetups;
  }
  const meetups = await fetchDbData<MeetupItem[]>("meetups", []);
  memoryMeetups = meetups;
  return meetups;
}

export async function saveDiskMeetups(meetups: MeetupItem[]): Promise<void> {
  memoryMeetups = meetups;
  await saveDbData<MeetupItem[]>("meetups", meetups);
}

export async function getMeetups(category?: string, query?: string): Promise<MeetupItem[]> {
  let list = await getDiskMeetups();

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

export async function createMeetup(params: {
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
}): Promise<MeetupItem> {
  const meetups = await getDiskMeetups();

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
  await saveDiskMeetups(meetups);

  // Sync to Radar Store so every Meetup shows on Campus Radar Map
  try {
    const activities = await fetchDbData<CampusActivity[]>("radar", []);
    if (!activities.some((a: any) => a.id === newMeetup.id)) {
      activities.unshift({
        id: newMeetup.id,
        title: newMeetup.title,
        description: newMeetup.description,
        category: newMeetup.category as any,
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
      await saveDbData<CampusActivity[]>("radar", activities);
    }
  } catch (err) {
    console.error("Failed to sync meetup to radar in Supabase:", err);
  }

  return newMeetup;
}

export async function toggleJoinMeetup(meetupId: string, userId: string, userName: string) {
  const meetups = await getDiskMeetups();
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

  await saveDiskMeetups(meetups);
  return { meetup, joined: !isJoined };
}

export async function sendMeetupChatMessage(meetupId: string, senderId: string, senderName: string, text: string) {
  const meetups = await getDiskMeetups();
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
  await saveDiskMeetups(meetups);
  return { meetup, msg };
}

export async function deleteMeetupChatMessage(meetupId: string, messageId: string) {
  const meetups = await getDiskMeetups();
  const index = meetups.findIndex((m) => m.id === meetupId);
  if (index === -1) return null;

  const meetup = meetups[index];
  meetup.chatMessages = meetup.chatMessages.filter((msg) => msg.id !== messageId);
  await saveDiskMeetups(meetups);
  return meetup;
}

export async function addMeetupCheckIn(meetupId: string, userId: string, userName: string, userLat?: number, userLng?: number) {
  const meetups = await getDiskMeetups();
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
    await saveDiskMeetups(meetups);
  }

  return meetup;
}

export async function addMeetupExpense(meetupId: string, title: string, totalAmount: number, paidBy: string, paidByName: string) {
  const meetups = await getDiskMeetups();
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
  await saveDiskMeetups(meetups);
  return { meetup, expense };
}

export async function addMeetupPoll(meetupId: string, question: string, options: string[]) {
  const meetups = await getDiskMeetups();
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
  await saveDiskMeetups(meetups);
  return { meetup, poll };
}

export async function voteMeetupPoll(meetupId: string, pollId: string, optionId: string, userId: string) {
  const meetups = await getDiskMeetups();
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

  await saveDiskMeetups(meetups);
  return meetup;
}
