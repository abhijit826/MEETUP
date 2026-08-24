import fs from "fs";
import path from "path";
import { SystemNotification, NotificationType } from "@/types/notifications";
import { fetchDbData, saveDbData } from "@/lib/supabaseStore";

const DATA_FILE = path.join(process.cwd(), "src", "data", "notifications.json");

let memoryNotifications: SystemNotification[] | null = null;
let isFetchingFromDb = false;

function readNotifications(): SystemNotification[] {
  if (memoryNotifications !== null) {
    return memoryNotifications;
  }
  
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      memoryNotifications = JSON.parse(raw) as SystemNotification[];
    } else {
      memoryNotifications = [];
    }
  } catch (err) {
    console.error("Error reading notifications.json:", err);
    memoryNotifications = [];
  }

  if (!isFetchingFromDb) {
    isFetchingFromDb = true;
    fetchDbData<SystemNotification[]>("notifications", memoryNotifications)
      .then((data) => {
        if (data) {
          memoryNotifications = data;
        }
      })
      .catch((err) => {
        console.error("Failed to load notifications from Supabase:", err);
      })
      .finally(() => {
        isFetchingFromDb = false;
      });
  }

  return memoryNotifications;
}

function writeNotifications(notifications: SystemNotification[]): void {
  memoryNotifications = notifications;
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(notifications, null, 2), "utf-8");
  } catch (err) {
    // EROFS safety
  }

  saveDbData<SystemNotification[]>("notifications", notifications).catch((err) => {
    console.error("Failed to save notifications to Supabase:", err);
  });
}

export function getNotificationsForUser(userEmail?: string): SystemNotification[] {
  const all = readNotifications();
  if (!userEmail) return all;
  const normalized = userEmail.trim().toLowerCase();
  return all.filter(
    (n) =>
      !n.targetUserEmail ||
      n.targetUserEmail === "all" ||
      n.targetUserEmail.toLowerCase() === normalized
  );
}

export function addNotification(params: {
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  targetUserEmail?: string;
  actorName?: string;
}): SystemNotification {
  const notifications = readNotifications();
  const newNotif: SystemNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type: params.type,
    title: params.title.trim(),
    message: params.message.trim(),
    link: params.link,
    isRead: false,
    createdAt: new Date().toISOString(),
    targetUserEmail: params.targetUserEmail || "all",
    actorName: params.actorName,
  };

  notifications.unshift(newNotif);
  writeNotifications(notifications);
  return newNotif;
}

export function markAsRead(id: string): boolean {
  const notifications = readNotifications();
  const idx = notifications.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notifications[idx].isRead = true;
    writeNotifications(notifications);
    return true;
  }
  return false;
}

export function markAllAsRead(userEmail?: string): boolean {
  const notifications = readNotifications();
  const normalized = userEmail?.trim().toLowerCase();
  let updated = false;

  notifications.forEach((n) => {
    if (
      !userEmail ||
      !n.targetUserEmail ||
      n.targetUserEmail === "all" ||
      n.targetUserEmail.toLowerCase() === normalized
    ) {
      if (!n.isRead) {
        n.isRead = true;
        updated = true;
      }
    }
  });

  if (updated) {
    writeNotifications(notifications);
  }
  return updated;
}
