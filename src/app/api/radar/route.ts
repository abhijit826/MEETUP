import { NextResponse } from "next/server";
import {
  getActivities,
  addActivity,
  toggleJoinActivity,
  deleteActivity,
} from "@/lib/radarStore";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || undefined;
    const query = searchParams.get("query") || undefined;

    const activities = await getActivities(category, query);
    return NextResponse.json({ success: true, activities });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "create": {
        const {
          title,
          description,
          category,
          locationName,
          approxDistance,
          latitude,
          longitude,
          time,
          hostId,
          hostName,
          isAnonymousHost,
          maxParticipants,
          tags,
        } = body;

        if (!title || !description || !locationName || !time) {
          return NextResponse.json(
            { error: "Title, description, location, and time are required." },
            { status: 400 }
          );
        }

        const activity = await addActivity({
          title,
          description,
          category: category || "Others",
          locationName,
          approxDistance,
          latitude,
          longitude,
          time,
          hostId: hostId || "anon",
          hostName: hostName || "Student",
          isAnonymousHost: !!isAnonymousHost,
          maxParticipants,
          tags,
        });

        // Trigger notification
        try {
          const { addNotification } = await import("@/lib/notificationsStore");
          addNotification({
            type: "radar",
            title: "📡 New Campus Activity!",
            message: `${activity.hostName} hosted '${activity.title}' near ${activity.locationName}`,
            link: "/radar",
            actorName: activity.hostName,
          });
        } catch { /* ignore */ }

        return NextResponse.json({ success: true, activity, activities: await getActivities() });
      }

      case "join": {
        const { activityId, userId } = body;
        if (!activityId || !userId) {
          return NextResponse.json({ error: "activityId and userId required" }, { status: 400 });
        }

        const res = await toggleJoinActivity(activityId, userId);
        if (!res) {
          return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        if (res.joined) {
          try {
            const { addNotification } = await import("@/lib/notificationsStore");
            addNotification({
              type: "radar",
              title: "👥 Someone Joined Activity!",
              message: `A student joined '${res.activity.title}' (${res.activity.participantCount} interested)`,
              link: "/radar",
              targetUserEmail: res.activity.hostId,
            });
          } catch { /* ignore */ }
        }

        return NextResponse.json({
          success: true,
          activity: res.activity,
          joined: res.joined,
          activities: await getActivities(),
        });
      }

      case "delete": {
        const { activityId } = body;
        if (!activityId) {
          return NextResponse.json({ error: "activityId required" }, { status: 400 });
        }

        const deleted = await deleteActivity(activityId);
        if (!deleted) {
          return NextResponse.json({ error: "Activity not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, activities: await getActivities() });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process request" },
      { status: 500 }
    );
  }
}
