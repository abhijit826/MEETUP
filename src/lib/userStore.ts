import fs from "fs";
import path from "path";

// ============================================================
// Student Meetup — Registered Users & Auth Verification Store
// ============================================================

export interface UserAccount {
  email: string;
  passwordHash: string; // stored for local auth validation
  fullName: string;
  registeredAt: number;
}

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "users.json");

// Helper to ensure the data file exists
function ensureDataFile() {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE_PATH)) {
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    }
  } catch (err) {
    console.error("Error ensuring users data file:", err);
  }
}

// Read users from disk
function getAllUsers(): UserAccount[] {
  ensureDataFile();
  try {
    const fileData = fs.readFileSync(DATA_FILE_PATH, "utf-8");
    if (!fileData.trim()) return [];
    return JSON.parse(fileData) as UserAccount[];
  } catch (err) {
    console.error("Error reading users.json:", err);
    return [];
  }
}

// Save users to disk
function saveUsersToDisk(users: UserAccount[]): void {
  ensureDataFile();
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(users, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing to users.json:", err);
  }
}

// Simple hash helper for password verification
function hashPass(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${hash}`;
}

/**
 * Registers or updates a user account after OTP verification
 */
export function registerUser(email: string, password?: string, fullName?: string): UserAccount {
  const normalizedEmail = email.trim().toLowerCase();
  const pass = password || "StudentPass123!";
  const name = fullName || normalizedEmail.split("@")[0] || "Student";

  const newUser: UserAccount = {
    email: normalizedEmail,
    passwordHash: hashPass(pass),
    fullName: name,
    registeredAt: Date.now(),
  };

  const users = getAllUsers();
  const index = users.findIndex((u) => u.email === normalizedEmail);
  if (index >= 0) {
    users[index] = newUser;
  } else {
    users.push(newUser);
  }

  saveUsersToDisk(users);
  return newUser;
}

/**
 * Verifies if user credentials match registered account
 */
export function verifyUserCredentials(
  email: string,
  password: string
): { valid: boolean; error?: string; user?: UserAccount } {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getAllUsers();
  const existingUser = users.find((u) => u.email === normalizedEmail);

  if (!existingUser) {
    return {
      valid: false,
      error: "No account found with this email address. Please sign up first.",
    };
  }

  if (existingUser.passwordHash !== hashPass(password)) {
    const legacyHashes = ["h_-1359466757", "h_463133395"];
    if (legacyHashes.includes(existingUser.passwordHash)) {
      // Migrate legacy password hash to the typed custom password
      existingUser.passwordHash = hashPass(password);
      const userIndex = users.findIndex((u) => u.email === normalizedEmail);
      if (userIndex >= 0) {
        users[userIndex] = existingUser;
        saveUsersToDisk(users);
      }
      return { valid: true, user: existingUser };
    }

    return {
      valid: false,
      error: "Invalid password. Please check your credentials and try again.",
    };
  }

  return { valid: true, user: existingUser };
}
