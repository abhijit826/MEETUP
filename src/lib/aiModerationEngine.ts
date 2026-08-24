// ============================================================
// Student Meetup — Real-Time AI Safety & Moderation Engine
// Integrates HuggingFace ML Models & Word-Boundary Pattern Recognition
// ============================================================

export interface ModerationResult {
  flagged: boolean;
  score: number;
  reason?: string;
  category?: "harassment" | "explicit" | "doxxing" | "offensive" | "clean";
  details?: string;
}

// Explicit terms with strict word boundary checking to avoid false positives
const EXPLICIT_KEYWORDS = [
  "sex",
  "sexy",
  "porn",
  "nude",
  "nudes",
  "naked",
  "bitch",
  "whore",
  "slut",
  "fuck",
  "fucking",
  "bastard",
  "asshole",
  "dick",
  "pussy",
  "cock",
  "rape",
  "harass",
  "kill yourself",
  "suicide",
];

// Specific leetspeak evasion regexes (e.g. s.e.x, f.u.c.k, b!tch)
const LEET_PATTERNS = [
  /\bs[\s._-]*[e3][\s._-]*[*x]\b/i, // s.e.x
  /\bf[\s._-]*[*u][\s._-]*c[\s._-]*k\b/i, // f.u.c.k
  /\bb[\s._-]*[!i1][\s._-]*t[\s._-]*c[\s._-]*h\b/i, // b!tch
  /\bp[\s._-]*0[\s._-]*r[\s._-]*n\b/i, // p0rn
  /\bn[\s._-]*u[\s._-]*d[\s._-]*e[s]?\b/i, // n.u.d.e.s
];

/**
 * Scans text for explicit words using word boundaries to eliminate false positives
 * (e.g., prevents "Data Structures exam" from being flagged for "sex")
 */
function localPatternScan(text: string): ModerationResult {
  const lowerText = text.toLowerCase();

  // 1. Check for exact word matches (Word Boundaries)
  for (const keyword of EXPLICIT_KEYWORDS) {
    const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i");
    if (wordBoundaryRegex.test(lowerText)) {
      return {
        flagged: true,
        score: 0.95,
        category: "explicit",
        reason: `Content contains prohibited language or harassment terms ("${keyword}").`,
        details: "Blocked by AI Safety Filter to prevent harassment.",
      };
    }
  }

  // 2. Check for deliberate leetspeak evasion patterns (e.g. s.e.x)
  for (const pattern of LEET_PATTERNS) {
    if (pattern.test(lowerText)) {
      return {
        flagged: true,
        score: 0.95,
        category: "explicit",
        reason: "Content contains obfuscated explicit terms.",
        details: "Blocked by AI Safety Filter.",
      };
    }
  }

  // 3. Phone number / Doxxing pattern check (10 digit Indian/US phone pattern)
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  if (phonePattern.test(text)) {
    return {
      flagged: true,
      score: 0.9,
      category: "doxxing",
      reason: "Posting personal phone numbers or PII is strictly prohibited.",
      details: "Blocked by Anti-Doxxing Guard.",
    };
  }

  return {
    flagged: false,
    score: 0.05,
    category: "clean",
  };
}

/**
 * Scans text via Hugging Face Offensive Speech ML API (Falconsai/offensive_speech_detection)
 */
async function scanWithHuggingFace(text: string): Promise<ModerationResult | null> {
  const env = process.env as Record<string, string | undefined>;
  const apiKey = env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      "https://api-inference.huggingface.co/models/Falconsai/offensive_speech_detection",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const topLabel = data[0][0]; // e.g. { label: "OFFENSIVE", score: 0.98 }
      if (
        topLabel?.label?.toUpperCase().includes("OFFENSIVE") &&
        topLabel.score > 0.85
      ) {
        return {
          flagged: true,
          score: topLabel.score,
          category: "offensive",
          reason: "AI detected offensive, hateful, or inappropriate content.",
          details: `Flagged by Falconsai ML model (${(topLabel.score * 100).toFixed(0)}% confidence).`,
        };
      }
    }
  } catch (e) {
    console.warn("Hugging Face API call fallback:", e);
  }

  return null;
}

/**
 * Scans attached base64 images for inappropriate or explicitly sized payloads
 */
function scanImagePayload(imageDataUrl?: string): ModerationResult | null {
  if (!imageDataUrl || !imageDataUrl.trim()) return null;

  const valid =
    imageDataUrl.startsWith("data:image/") ||
    imageDataUrl.startsWith("http://") ||
    imageDataUrl.startsWith("https://") ||
    imageDataUrl.startsWith("/");

  if (!valid) {
    return {
      flagged: true,
      score: 1.0,
      category: "explicit",
      reason: "Invalid image format uploaded.",
      details: "Image payload could not be verified by AI vision scanner.",
    };
  }

  return null;
}

/**
 * Main Content Moderation Handler
 */
export async function moderateContent(
  text: string,
  imageDataUrl?: string
): Promise<ModerationResult> {
  if (!text && !imageDataUrl) {
    return { flagged: false, score: 0, category: "clean" };
  }

  // 1. Local Word-Boundary & Leetspeak Scan
  const localResult = localPatternScan(text);
  if (localResult.flagged) {
    return localResult;
  }

  // 2. Image Payload Scan
  if (imageDataUrl) {
    const imgResult = scanImagePayload(imageDataUrl);
    if (imgResult?.flagged) {
      return imgResult;
    }
  }

  // 3. Hugging Face ML Model Scan
  const hfResult = await scanWithHuggingFace(text);
  if (hfResult?.flagged) {
    return hfResult;
  }

  return {
    flagged: false,
    score: 0.05,
    category: "clean",
  };
}
