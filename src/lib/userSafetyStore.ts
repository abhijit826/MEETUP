import fs from "fs";
import path from "path";

export interface BlockRecord {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName?: string;
  targetId?: string;
  targetType: "user" | "activity" | "meetup" | "confession" | "message";
  reason: string;
  details?: string;
  createdAt: string;
}

interface SafetyData {
  blockedUsers: BlockRecord[];
  reports: ReportRecord[];
}

const DATA_FILE = path.join(process.cwd(), "src", "data", "user_safety.json");

function readSafetyData(): SafetyData {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { blockedUsers: [], reports: [] };
    }
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { blockedUsers: [], reports: [] };
  }
}

function writeSafetyData(data: SafetyData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing user_safety.json:", err);
  }
}

export function blockUser(blockerId: string, blockedId: string): boolean {
  if (!blockerId || !blockedId || blockerId === blockedId) return false;
  const data = readSafetyData();
  const exists = data.blockedUsers.some(
    (b) => b.blockerId === blockerId && b.blockedId === blockedId
  );

  if (!exists) {
    data.blockedUsers.push({
      blockerId,
      blockedId,
      createdAt: new Date().toISOString(),
    });
    writeSafetyData(data);
  }
  return true;
}

export function unblockUser(blockerId: string, blockedId: string): boolean {
  const data = readSafetyData();
  const initialLen = data.blockedUsers.length;
  data.blockedUsers = data.blockedUsers.filter(
    (b) => !(b.blockerId === blockerId && b.blockedId === blockedId)
  );

  if (data.blockedUsers.length !== initialLen) {
    writeSafetyData(data);
    return true;
  }
  return false;
}

export function getBlockedUserIds(blockerId: string): string[] {
  const data = readSafetyData();
  return data.blockedUsers
    .filter((b) => b.blockerId === blockerId)
    .map((b) => b.blockedId);
}

export function reportUserOrContent(params: {
  reporterId: string;
  reportedUserId: string;
  reportedUserName?: string;
  targetId?: string;
  targetType: "user" | "activity" | "meetup" | "confession" | "message";
  reason: string;
  details?: string;
}): ReportRecord {
  const data = readSafetyData();
  const newReport: ReportRecord = {
    id: `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    reporterId: params.reporterId,
    reportedUserId: params.reportedUserId,
    reportedUserName: params.reportedUserName,
    targetId: params.targetId,
    targetType: params.targetType,
    reason: params.reason,
    details: params.details || "",
    createdAt: new Date().toISOString(),
  };

  data.reports.unshift(newReport);
  writeSafetyData(data);
  return newReport;
}

export function getReports(): ReportRecord[] {
  return readSafetyData().reports;
}
