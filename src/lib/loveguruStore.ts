import fs from "fs";
import path from "path";
import {
  DilemmaPost,
  GuruResponse,
  SwipeScenario,
  AdviceBattle,
  GuruProfile,
  DailyChallenge,
  DilemmaCategory,
  VoteReasonTag,
} from "@/types/loveguru";

const DATA_FILE = path.join(process.cwd(), "src", "data", "loveguru.json");

interface LoveGuruStore {
  dilemmas: DilemmaPost[];
  swipeScenarios: SwipeScenario[];
  battles: AdviceBattle[];
  leaderboard: GuruProfile[];
  dailyChallenge: DailyChallenge | null;
  customScenarios?: SwipeScenario[];
  swipeDate?: string;
  battleDate?: string;
}

// Pool of daily challenges that automatically rotate every day
const DAILY_CHALLENGE_POOL: Omit<DailyChallenge, "date" | "votes" | "participantCount">[] = [
  {
    id: "dc-1",
    title: "The Study Date Dilemma",
    description: "Your crush asked you to study together for finals. You said yes but realized your ex will be at the same library spot.",
    type: "wwyd",
    content: "What would you do?",
    options: [
      "Go anyway — your ex doesn't control your life",
      "Suggest a different study spot softly",
      "Bring a friend along as moral support",
      "Reschedule for another day"
    ]
  },
  {
    id: "dc-2",
    title: "The Group Chat Slip-Up",
    description: "You accidentally sent a vent message about your roommate TO the group chat with your roommate in it. It was seen immediately.",
    type: "wwyd",
    content: "How do you recover?",
    options: [
      "Apologize immediately & talk face-to-face",
      "Unsend & play dumb ('Glitch in app!')",
      "Own it completely and start the hard conversation",
      "Leave campus for the weekend"
    ]
  },
  {
    id: "dc-3",
    title: "The Fest Companion Conflict",
    description: "Your partner wants to go to the college fest with their ex as 'just friends', but didn't invite you because you're busy until evening.",
    type: "wwyd",
    content: "What's your reaction?",
    options: [
      "Express your boundary calmly — 'I am not comfortable with this'",
      "Let them go — trust is everything",
      "Cancel your other plans and show up",
      "Re-evaluate the whole relationship"
    ]
  },
  {
    id: "dc-4",
    title: "The Unsent Confession",
    description: "It's final year graduation week. You have had a crush on your lab partner for 2 years. They are moving to another city next month.",
    type: "wwyd",
    content: "Do you confess?",
    options: [
      "Confess now! Life is too short for regrets",
      "Keep quiet & cherish the memories as friends",
      "Write a heartfelt goodbye card with a subtle hint",
      "Ask them out for coffee first to test the waters"
    ]
  },
  {
    id: "dc-5",
    title: "The Social Media Trap",
    description: "You noticed your partner consistently hides their Instagram stories from you, but a mutual friend showed you what they post.",
    type: "wwyd",
    content: "What do you do?",
    options: [
      "Confront them directly about why you were hidden",
      "Ask the mutual friend more details first",
      "Hide your stories from them too",
      "Break up — secrecy is a major red flag"
    ]
  }
];

function ensureFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    const init: LoveGuruStore = { dilemmas: [], swipeScenarios: [], battles: [], leaderboard: [], dailyChallenge: null };
    fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2), "utf-8");
  }
}

let memoryLoveGuru: LoveGuruStore | null = null;

function read(): LoveGuruStore {
  if (memoryLoveGuru !== null) {
    return memoryLoveGuru;
  }
  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw) as LoveGuruStore;
    memoryLoveGuru = parsed;
    return parsed;
  } catch {
    return { dilemmas: [], swipeScenarios: [], battles: [], leaderboard: [], dailyChallenge: null };
  }
}

function write(data: LoveGuruStore) {
  memoryLoveGuru = data;
  ensureFile();
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Save loveguru.json failed, falling back to memory storage:", err);
  }
}

// ====== GEMINI API HELPER ======

async function callGemini(prompt: string): Promise<string | null> {
  const env = process.env as Record<string, string | undefined>;
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });
    const data = await res.json();
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }
  } catch (err) {
    console.error("Gemini API call failed:", err);
  }
  return null;
}

// ====== ROTATING DAILY CHALLENGE ENGINE ======

// ====== ROTATING DAILY CHALLENGE ENGINE (POWERED BY GOOGLE GEMINI AI) ======

export async function getDailyChallengeAsync(): Promise<DailyChallenge> {
  const store = read();
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Check if current challenge matches today's date
  if (store.dailyChallenge && store.dailyChallenge.date === today) {
    return store.dailyChallenge;
  }

  // Try generating a brand-new daily challenge using Google Gemini AI
  const prompt = `You are generating a daily interactive relationship scenario for a Gen-Z college app.
Date: ${today}
Generate a relatable college situation (crushes, friendships, breakups, group chats, library dates, campus drama) with 4 realistic options for "What Would You Do?".

Return raw valid JSON only in this exact structure:
{
  "title": "Short Catchy Title (3-6 words)",
  "description": "2-sentence relatable college situation description",
  "content": "What would you do?",
  "options": [
    "Option 1",
    "Option 2",
    "Option 3",
    "Option 4"
  ]
}`;

  const geminiRes = await callGemini(prompt);
  if (geminiRes) {
    try {
      const cleaned = geminiRes.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.title && parsed.description && Array.isArray(parsed.options) && parsed.options.length >= 2) {
        const newDaily: DailyChallenge = {
          id: `dc-${today}`,
          title: parsed.title,
          description: parsed.description,
          type: "wwyd",
          content: parsed.content || "What would you do?",
          options: parsed.options,
          date: today,
          votes: Object.fromEntries(parsed.options.map((o: string) => [o, 0])),
          participantCount: 0,
        };
        store.dailyChallenge = newDaily;
        write(store);
        return newDaily;
      }
    } catch { /* fallback below */ }
  }

  // Fallback to rotating pool if Gemini API is offline
  const dateHash = today.split("-").reduce((acc, part) => acc + parseInt(part, 10), 0);
  const challengeTemplate = DAILY_CHALLENGE_POOL[dateHash % DAILY_CHALLENGE_POOL.length];

  const fallbackDaily: DailyChallenge = {
    ...challengeTemplate,
    date: today,
    votes: Object.fromEntries(challengeTemplate.options?.map((o) => [o, 0]) || []),
    participantCount: 0,
  };

  store.dailyChallenge = fallbackDaily;
  write(store);
  return fallbackDaily;
}

export function getDailyChallenge(): DailyChallenge {
  const store = read();
  const today = new Date().toISOString().split("T")[0];
  if (store.dailyChallenge && store.dailyChallenge.date === today) {
    return store.dailyChallenge;
  }
  const dateHash = today.split("-").reduce((acc, part) => acc + parseInt(part, 10), 0);
  const challengeTemplate = DAILY_CHALLENGE_POOL[dateHash % DAILY_CHALLENGE_POOL.length];
  return {
    ...challengeTemplate,
    date: today,
    votes: Object.fromEntries(challengeTemplate.options?.map((o) => [o, 0]) || []),
    participantCount: 0,
  };
}

export async function voteDailyChallengeAsync(option: string): Promise<DailyChallenge> {
  const store = read();
  const challenge = await getDailyChallengeAsync(); // ensures date is current

  if (!challenge.votes) challenge.votes = {};
  challenge.votes[option] = (challenge.votes[option] || 0) + 1;
  challenge.participantCount += 1;

  store.dailyChallenge = challenge;
  write(store);
  return challenge;
}

export function voteDailyChallenge(option: string): DailyChallenge {
  const store = read();
  const challenge = getDailyChallenge();
  if (!challenge.votes) challenge.votes = {};
  challenge.votes[option] = (challenge.votes[option] || 0) + 1;
  challenge.participantCount += 1;
  store.dailyChallenge = challenge;
  write(store);
  return challenge;
}

// ====== DILEMMAS ======

export function getDilemmas(category?: string): DilemmaPost[] {
  const store = read();
  if (category && category !== "All") {
    return store.dilemmas.filter((d) => d.category === category);
  }
  return store.dilemmas;
}

export function getDilemmaById(id: string): DilemmaPost | null {
  const store = read();
  return store.dilemmas.find((d) => d.id === id) || null;
}

export function deleteDilemma(id: string): boolean {
  const store = read();
  const initialLength = store.dilemmas.length;
  store.dilemmas = store.dilemmas.filter((d) => d.id !== id);
  if (store.dilemmas.length !== initialLength) {
    write(store);
    return true;
  }
  return false;
}

export function addDilemma(
  title: string,
  content: string,
  category: DilemmaCategory,
  authorId: string,
  authorName: string,
  isAnonymous: boolean,
  predictionQuestion?: string,
  predictionOptions?: string[]
): DilemmaPost {
  const store = read();
  const post: DilemmaPost = {
    id: `dlm-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    title: title.trim(),
    content: content.trim(),
    category,
    authorId,
    authorName: isAnonymous ? "Anonymous" : authorName,
    isAnonymous,
    createdAt: new Date().toISOString(),
    responses: [],
    responseCount: 0,
    viewCount: 0,
    predictionQuestion,
    predictionOptions,
    predictionVotes: predictionOptions ? Object.fromEntries(predictionOptions.map((o) => [o, 0])) : undefined,
    status: "open",
  };
  store.dilemmas = [post, ...store.dilemmas];

  updateGuruPoints(store, authorId, authorName, isAnonymous, 5);
  write(store);
  return post;
}

// AI Toxicity Filter Helper
export function checkToxicity(text: string): { isToxic: boolean; reason?: string } {
  const lower = text.toLowerCase();
  const toxicKeywords = ["kill yourself", "ugly", "loser", "die", "hate you", "stupid idiot", "bitch"];
  for (const kw of toxicKeywords) {
    if (lower.includes(kw)) {
      return { isToxic: true, reason: `Response contained unsupportive language: "${kw}"` };
    }
  }
  return { isToxic: false };
}

export async function addResponse(
  dilemmaId: string,
  content: string,
  authorId: string,
  authorName: string,
  isAnonymous: boolean
): Promise<{ response?: GuruResponse; error?: string }> {
  const toxicity = checkToxicity(content);
  if (toxicity.isToxic) {
    return { error: toxicity.reason || "Response flagged by AI toxicity filter" };
  }

  const store = read();
  const idx = store.dilemmas.findIndex((d) => d.id === dilemmaId);
  if (idx === -1) return { error: "Dilemma not found" };

  const resp: GuruResponse = {
    id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    dilemmaId,
    content: content.trim(),
    authorId,
    authorName: isAnonymous ? "Anonymous" : authorName,
    isAnonymous,
    createdAt: new Date().toISOString(),
    upvotes: 0,
    downvotes: 0,
    reasonTags: {} as Record<VoteReasonTag, number>,
  };

  store.dilemmas[idx].responses.push(resp);
  store.dilemmas[idx].responseCount += 1;

  // Auto-generate or update AI Third Friend summary via Gemini API if responses reach 2+
  if (store.dilemmas[idx].responses.length >= 2) {
    try {
      const aiRes = await generateAIThirdFriendSummaryAsync(store.dilemmas[idx]);
      store.dilemmas[idx].aiSummary = aiRes.summary;
      store.dilemmas[idx].aiDevilAdvocate = aiRes.devilAdvocate;
    } catch { /* ignore fallback */ }
  }

  updateGuruPoints(store, authorId, authorName, isAnonymous, 10);
  write(store);
  return { response: resp };
}

// AI "Third Friend" Viewpoint Synthesizer (Powered by Google Gemini API)
export async function generateAIThirdFriendSummaryAsync(dilemma: DilemmaPost): Promise<{ summary: string; devilAdvocate: string }> {
  const count = dilemma.responses.length;
  if (count === 0) {
    return {
      summary: "No student advice yet! Be the first Third Friend to weigh in.",
      devilAdvocate: "Waiting for community perspectives...",
    };
  }

  const responsesText = dilemma.responses.map((r, i) => `Response ${i + 1}: "${r.content}"`).join("\n");
  const prompt = `You are "AI Third Friend", a supportive, modern Gen-Z college relationship advice counselor.
Analyze this student dilemma and the responses given by peers.

Dilemma Title: "${dilemma.title || "College Situation"}"
Dilemma Situation: "${dilemma.content}"

Student Responses:
${responsesText}

Provide a JSON object with exactly two string fields:
1. "summary": A balanced 2-3 sentence synthesis of what the community thinks and the main consensus advice. (Start with "🤖 AI Third Friend Take: ")
2. "devilAdvocate": A 1-2 sentence minority perspective or alternative angle to consider. (Start with "😈 Devil's Advocate Angle: ")

Return ONLY raw valid JSON, no markdown formatting or backticks.`;

  const geminiText = await callGemini(prompt);
  if (geminiText) {
    try {
      const cleaned = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.summary && parsed.devilAdvocate) {
        return { summary: parsed.summary, devilAdvocate: parsed.devilAdvocate };
      }
    } catch { /* fallback below */ }
  }

  // Local fallback if API fails
  const firstResp = dilemma.responses[0].content;
  const secondResp = dilemma.responses[1]?.content || "";
  return {
    summary: `🤖 AI Third Friend Take: Based on ${count} student responses, the general consensus recommends: "${firstResp.slice(0, 120)}...". Communication and self-respect are key.`,
    devilAdvocate: secondResp
      ? `😈 Devil's Advocate Angle: Alternatively: "${secondResp.slice(0, 120)}...". Sometimes giving space protects your peace.`
      : `😈 Devil's Advocate Angle: Consider whether taking immediate action might escalate emotions. Waiting 24h might give clarity!`,
  };
}

// AI Pre-Post Refiner (Powered by Google Gemini API)
export async function refinePostWithAIAsync(rawTitle: string, rawContent: string): Promise<{ title: string; content: string }> {
  const prompt = `You are a helpful Gen-Z advice assistant for a college app.
Rewrite the following raw user draft into a catchy title and a clear, engaging post suitable for an anonymous student advice board. Keep the user's authentic voice, tone, and details.

Raw Title: "${rawTitle}"
Raw Content: "${rawContent}"

Respond ONLY with raw JSON in this exact structure:
{"title": "Catchy 3-7 word Title", "content": "Polished, well-formatted 2-4 sentence dilemma content"}
No markdown wrappers.`;

  const geminiText = await callGemini(prompt);
  if (geminiText) {
    try {
      const cleaned = geminiText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.title && parsed.content) {
        return { title: parsed.title, content: parsed.content };
      }
    } catch { /* fallback */ }
  }

  // Fallback
  const trimmed = rawContent.trim();
  let refinedTitle = rawTitle.trim();
  if (!refinedTitle) {
    const words = trimmed.split(" ").slice(0, 5).join(" ");
    refinedTitle = words ? `${words}...` : "Campus Dilemma";
  }
  let refinedContent = trimmed;
  if (!refinedContent.endsWith(".")) refinedContent += ".";
  return { title: refinedTitle, content: `${refinedContent}\n\n(Seeking honest student perspectives!)` };
}

export function voteResponse(
  dilemmaId: string,
  responseId: string,
  vote: "up" | "down",
  reasonTag?: VoteReasonTag
): DilemmaPost | null {
  const store = read();
  const dIdx = store.dilemmas.findIndex((d) => d.id === dilemmaId);
  if (dIdx === -1) return null;

  const rIdx = store.dilemmas[dIdx].responses.findIndex((r) => r.id === responseId);
  if (rIdx === -1) return null;

  if (vote === "up") {
    store.dilemmas[dIdx].responses[rIdx].upvotes += 1;
    const respAuthor = store.dilemmas[dIdx].responses[rIdx];
    updateGuruPoints(store, respAuthor.authorId, respAuthor.authorName, respAuthor.isAnonymous, 2);
  } else {
    store.dilemmas[dIdx].responses[rIdx].downvotes += 1;
  }

  if (reasonTag) {
    const tags = store.dilemmas[dIdx].responses[rIdx].reasonTags;
    tags[reasonTag] = (tags[reasonTag] || 0) + 1;
  }

  write(store);
  return store.dilemmas[dIdx];
}

export function updateDilemmaStatus(
  dilemmaId: string,
  status: "resolved" | "updated",
  updateContent?: string,
  actualOutcome?: string
): DilemmaPost | null {
  const store = read();
  const idx = store.dilemmas.findIndex((d) => d.id === dilemmaId);
  if (idx === -1) return null;

  store.dilemmas[idx].status = status;
  if (updateContent) store.dilemmas[idx].updateContent = updateContent;
  if (actualOutcome) store.dilemmas[idx].actualOutcome = actualOutcome;
  store.dilemmas[idx].updatedAt = new Date().toISOString();

  write(store);
  return store.dilemmas[idx];
}

export function votePrediction(dilemmaId: string, option: string): DilemmaPost | null {
  const store = read();
  const idx = store.dilemmas.findIndex((d) => d.id === dilemmaId);
  if (idx === -1) return null;

  if (store.dilemmas[idx].predictionVotes && option in store.dilemmas[idx].predictionVotes!) {
    store.dilemmas[idx].predictionVotes![option] += 1;
  }

  write(store);
  return store.dilemmas[idx];
}

// ====== SWIPE GAME (24H GOOGLE GEMINI AI ROTATION) ======

export async function getSwipeScenariosAsync(): Promise<SwipeScenario[]> {
  const store = read();
  const today = new Date().toISOString().split("T")[0];

  if (store.swipeDate === today && store.swipeScenarios && store.swipeScenarios.length > 0) {
    return store.swipeScenarios;
  }

  // Generate 5 fresh daily Red Flag / Green Flag swipe scenario cards using Gemini AI
  const prompt = `You are generating 5 daily "Red Flag or Green Flag" swipe game scenario cards for a Gen-Z college relationship app.
Date: ${today}

Return raw valid JSON array of 5 objects:
[
  {
    "title": "Short Catchy Title (3-6 words)",
    "description": "Relatable college situation description",
    "category": "Red Flag",
    "correctAnswer": "red",
    "explanation": "Why this is red/green flag"
  }
]
Note: Category must be "Red Flag" or "Green Flag" or "Mixed Signal". correctAnswer must be "red" or "green".`;

  const geminiRes = await callGemini(prompt);
  if (geminiRes) {
    try {
      const cleaned = geminiRes.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length >= 3) {
        const scenarios: SwipeScenario[] = parsed.map((item: any, idx: number) => ({
          id: `swp-${today}-${idx}`,
          scenario: item.description || item.scenario || item.title || "Campus Situation",
          category: (item.category as any) || "Relationships",
          correctAnswer: item.correctAnswer === "green" ? "green" : "red",
          explanation: item.explanation || "",
          redVotes: 0,
          greenVotes: 0,
        }));
        store.swipeScenarios = scenarios;
        store.swipeDate = today;
        write(store);
        return scenarios;
      }
    } catch { /* fallback below */ }
  }

  return store.swipeScenarios;
}

export function getSwipeScenarios(): SwipeScenario[] {
  const store = read();
  return store.swipeScenarios;
}

export function voteSwipe(scenarioId: string, vote: "red" | "green"): SwipeScenario | null {
  const store = read();
  const idx = store.swipeScenarios.findIndex((s) => s.id === scenarioId);
  if (idx === -1) return null;

  if (vote === "red") store.swipeScenarios[idx].redVotes += 1;
  else store.swipeScenarios[idx].greenVotes += 1;

  write(store);
  return store.swipeScenarios[idx];
}

// ====== ADVICE BATTLES (24H GOOGLE GEMINI AI ROTATION) ======

export async function getBattlesAsync(): Promise<AdviceBattle[]> {
  const store = read();
  const today = new Date().toISOString().split("T")[0];

  if (store.battleDate === today && store.battles && store.battles.length > 0) {
    return store.battles;
  }

  // Generate 2 fresh daily Advice Battles using Gemini AI
  const prompt = `You are generating 2 daily "Advice Battles" for a Gen-Z college relationship app where 2 contrasting advice approaches face off.
Date: ${today}

Return raw valid JSON array of 2 objects:
[
  {
    "title": "Short Dilemma Title",
    "description": "Dilemma context situation",
    "category": "Relationships",
    "response1Author": "Approach 1 Name",
    "response1Text": "First advice perspective",
    "response2Author": "Approach 2 Name",
    "response2Text": "Second contrasting advice perspective"
  }
]`;

  const geminiRes = await callGemini(prompt);
  if (geminiRes) {
    try {
      const cleaned = geminiRes.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        const battles: AdviceBattle[] = parsed.map((item: any, idx: number) => ({
          id: `btl-${today}-${idx}`,
          dilemmaId: `dlm-btl-${today}-${idx}`,
          dilemmaSnippet: item.description || item.title || "College Advice Face-Off",
          category: (item.category as any) || "Relationships",
          response1: {
            id: `r1-${today}-${idx}`,
            dilemmaId: `dlm-btl-${today}-${idx}`,
            content: item.response1Text || "",
            authorId: "ai-guru-1",
            authorName: item.response1Author || "Direct Advice",
            isAnonymous: false,
            createdAt: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            reasonTags: {} as Record<VoteReasonTag, number>,
          },
          response2: {
            id: `r2-${today}-${idx}`,
            dilemmaId: `dlm-btl-${today}-${idx}`,
            content: item.response2Text || "",
            authorId: "ai-guru-2",
            authorName: item.response2Author || "Gentle Advice",
            isAnonymous: false,
            createdAt: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            reasonTags: {} as Record<VoteReasonTag, number>,
          },
          response1Votes: 0,
          response2Votes: 0,
          status: "active",
          expiresAt: `${today}T23:59:59.000Z`,
        }));
        store.battles = battles;
        store.battleDate = today;
        write(store);
        return battles;
      }
    } catch { /* fallback below */ }
  }

  return store.battles;
}

export function getBattles(): AdviceBattle[] {
  return read().battles;
}

export function voteBattle(battleId: string, side: 1 | 2): AdviceBattle | null {
  const store = read();
  const idx = store.battles.findIndex((b) => b.id === battleId);
  if (idx === -1) return null;

  if (side === 1) store.battles[idx].response1Votes += 1;
  else store.battles[idx].response2Votes += 1;

  write(store);
  return store.battles[idx];
}

// ====== LEADERBOARD ======

export function getLeaderboard(): GuruProfile[] {
  const store = read();
  return store.leaderboard.sort((a, b) => b.guruPoints - a.guruPoints).slice(0, 50);
}

function updateGuruPoints(
  store: LoveGuruStore,
  userId: string,
  userName: string,
  isAnonymous: boolean,
  points: number
) {
  let profile = store.leaderboard.find((p) => p.id === userId);
  if (!profile) {
    profile = {
      id: userId,
      name: isAnonymous ? "Anonymous Guru" : userName,
      isAnonymous,
      guruPoints: 0,
      responsesGiven: 0,
      adviceWins: 0,
      streak: 1,
      badges: [],
    };
    store.leaderboard.push(profile);
  }
  profile.guruPoints += points;
  if (points >= 10) profile.responsesGiven += 1;

  if (profile.guruPoints >= 50 && !profile.badges.includes("Rising Star")) {
    profile.badges.push("Rising Star");
  }
  if (profile.guruPoints >= 200 && !profile.badges.includes("Advice Pro")) {
    profile.badges.push("Advice Pro");
  }
  if (profile.guruPoints >= 500 && !profile.badges.includes("Love Guru")) {
    profile.badges.push("Love Guru");
  }
  if (profile.responsesGiven >= 10 && !profile.badges.includes("Helping Hand")) {
    profile.badges.push("Helping Hand");
  }
}
