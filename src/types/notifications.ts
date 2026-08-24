export type NotificationType = "radar" | "loveguru" | "message" | "confession";

export interface SystemNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
  targetUserEmail?: string;
  actorName?: string;
}
