import { NextResponse } from "next/server";
import {
  getMeetups,
  createMeetup,
  toggleJoinMeetup,
  sendMeetupChatMessage,
  addMeetupCheckIn,
  addMeetupExpense,
  addMeetupPoll,
  voteMeetupPoll,
} from "@/lib/meetupsStore";
import { addNotification } from "@/lib/notificationsStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("query") || undefined;

    const meetups = getMeetups(category, query);
    return NextResponse.json({ success: true, meetups });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load meetups";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // 1. Create Meetup
    if (action === "create") {
      const { title, description, category, locationName, latitude, longitude, time, hostId, hostName, maxParticipants } = body;
      if (!title || !description || !locationName || !time) {
        return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
      }

      const meetup = createMeetup({
        title,
        description,
        category: category || "Chai & Snacks",
        locationName,
        latitude: latitude || 12.824,
        longitude: longitude || 80.0445,
        time,
        hostId: hostId || "anon",
        hostName: hostName || "Student",
        maxParticipants,
      });

      // Send global notification
      try {
        addNotification({
          type: "radar",
          title: "☕ New MEETUP Hosted!",
          message: `${meetup.hostName} created '${meetup.title}' at ${meetup.locationName}`,
          link: "/meetups",
          actorName: meetup.hostName,
        });
      } catch { /* ignore */ }

      return NextResponse.json({ success: true, meetup, meetups: getMeetups() });
    }

    // 2. Join / Leave Meetup
    if (action === "join") {
      const { meetupId, userId, userName } = body;
      if (!meetupId || !userId) {
        return NextResponse.json({ error: "meetupId & userId required" }, { status: 400 });
      }

      const res = toggleJoinMeetup(meetupId, userId, userName || "Student");
      if (!res) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });
      if (res.error) return NextResponse.json({ error: res.error }, { status: 400 });

      if (res.joined) {
        try {
          addNotification({
            type: "radar",
            title: "👥 Joined Meetup!",
            message: `${userName || "A student"} joined '${res.meetup.title}'`,
            link: "/meetups",
          });
        } catch { /* ignore */ }
      }

      return NextResponse.json({ success: true, meetup: res.meetup, joined: res.joined });
    }

    // 3. Post Group Chat Message
    if (action === "chat") {
      const { meetupId, senderId, senderName, text } = body;
      if (!meetupId || !text) {
        return NextResponse.json({ error: "meetupId & text required" }, { status: 400 });
      }

      const res = sendMeetupChatMessage(meetupId, senderId || "anon", senderName || "Student", text);
      if (!res) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });

      return NextResponse.json({ success: true, meetup: res.meetup, msg: res.msg });
    }

    // 4. Geofenced Live Check-In
    if (action === "checkin") {
      const { meetupId, userId, userName, userLat, userLng } = body;
      if (!meetupId || !userId) {
        return NextResponse.json({ error: "meetupId & userId required" }, { status: 400 });
      }

      const meetup = addMeetupCheckIn(meetupId, userId, userName || "Student", userLat, userLng);
      if (!meetup) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });

      return NextResponse.json({ success: true, meetup, checkedIn: true });
    }

    // 5. Add Expense (Split-Bill)
    if (action === "expense") {
      const { meetupId, title, totalAmount, paidBy, paidByName } = body;
      if (!meetupId || !title || !totalAmount) {
        return NextResponse.json({ error: "Missing expense details" }, { status: 400 });
      }

      const res = addMeetupExpense(meetupId, title, Number(totalAmount), paidBy || "anon", paidByName || "Student");
      if (!res) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });

      return NextResponse.json({ success: true, meetup: res.meetup, expense: res.expense });
    }

    // 6. Create Poll
    if (action === "poll_create") {
      const { meetupId, question, options } = body;
      if (!meetupId || !question || !Array.isArray(options)) {
        return NextResponse.json({ error: "Missing poll parameters" }, { status: 400 });
      }

      const res = addMeetupPoll(meetupId, question, options);
      if (!res) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });

      return NextResponse.json({ success: true, meetup: res.meetup, poll: res.poll });
    }

    // 7. Vote Poll
    if (action === "poll_vote") {
      const { meetupId, pollId, optionId, userId } = body;
      if (!meetupId || !pollId || !optionId || !userId) {
        return NextResponse.json({ error: "Missing vote parameters" }, { status: 400 });
      }

      const meetup = voteMeetupPoll(meetupId, pollId, optionId, userId);
      if (!meetup) return NextResponse.json({ error: "Meetup not found" }, { status: 404 });

      return NextResponse.json({ success: true, meetup });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to process meetup action";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
