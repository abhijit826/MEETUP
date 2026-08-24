import { NextResponse } from "next/server";
import {
  getDilemmas,
  getDilemmaById,
  deleteDilemma,
  addDilemma,
  addResponse,
  voteResponse,
  updateDilemmaStatus,
  votePrediction,
  getSwipeScenarios,
  voteSwipe,
  getBattles,
  voteBattle,
  getLeaderboard,
  getDailyChallengeAsync,
  voteDailyChallengeAsync,
  getSwipeScenariosAsync,
  getBattlesAsync,
  refinePostWithAIAsync,
  generateAIThirdFriendSummaryAsync,
} from "@/lib/loveguruStore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource") || "dilemmas";
  const category = searchParams.get("category") || undefined;

  try {
    switch (resource) {
      case "dilemmas":
        return NextResponse.json({ success: true, dilemmas: getDilemmas(category) });
      case "swipe":
        return NextResponse.json({ success: true, scenarios: await getSwipeScenariosAsync() });
      case "battles":
        return NextResponse.json({ success: true, battles: await getBattlesAsync() });
      case "leaderboard":
        return NextResponse.json({ success: true, leaderboard: getLeaderboard() });
      case "daily":
        return NextResponse.json({ success: true, challenge: await getDailyChallengeAsync() });
      default:
        return NextResponse.json({ success: true, dilemmas: getDilemmas() });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "ai-refine": {
        const { title, content } = body;
        if (!content || !content.trim()) {
          return NextResponse.json({ error: "Content required to refine" }, { status: 400 });
        }
        const refined = await refinePostWithAIAsync(title || "", content);
        return NextResponse.json({ success: true, ...refined });
      }

      case "ai-third-friend": {
        const { dilemmaId } = body;
        const dilemma = getDilemmaById(dilemmaId);
        if (!dilemma) return NextResponse.json({ error: "Dilemma not found" }, { status: 404 });

        const aiRes = await generateAIThirdFriendSummaryAsync(dilemma);
        return NextResponse.json({ success: true, dilemmaId, ...aiRes });
      }

      case "post-dilemma": {
        const { title, content, category, authorId, authorName, isAnonymous, predictionQuestion, predictionOptions } = body;
        if (!content || !content.trim()) {
          return NextResponse.json({ error: "Content required" }, { status: 400 });
        }
        const dilemma = addDilemma(
          title || "",
          content,
          category || "General",
          authorId || "anon",
          authorName || "Student",
          !!isAnonymous,
          predictionQuestion,
          predictionOptions
        );
        return NextResponse.json({ success: true, dilemma, dilemmas: getDilemmas() });
      }

      case "respond": {
        const { dilemmaId, content, authorId, authorName, isAnonymous } = body;
        if (!dilemmaId || !content?.trim()) {
          return NextResponse.json({ error: "dilemmaId and content required" }, { status: 400 });
        }
        const result = await addResponse(dilemmaId, content, authorId || "anon", authorName || "Student", !!isAnonymous);
        if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
        return NextResponse.json({ success: true, response: result.response, dilemmas: getDilemmas() });
      }

      case "vote-response": {
        const { dilemmaId, responseId, vote, reasonTag } = body;
        const dilemma = voteResponse(dilemmaId, responseId, vote, reasonTag);
        if (!dilemma) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, dilemma, dilemmas: getDilemmas() });
      }

      case "update-status": {
        const { dilemmaId, status, updateContent, actualOutcome } = body;
        const result = updateDilemmaStatus(dilemmaId, status, updateContent, actualOutcome);
        if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, dilemma: result, dilemmas: getDilemmas() });
      }

      case "vote-prediction": {
        const { dilemmaId, option } = body;
        const result = votePrediction(dilemmaId, option);
        if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, dilemma: result });
      }

      case "swipe-vote": {
        const { scenarioId, vote } = body;
        const result = voteSwipe(scenarioId, vote);
        if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, scenario: result });
      }

      case "battle-vote": {
        const { battleId, side } = body;
        const result = voteBattle(battleId, side);
        if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, battle: result });
      }

      case "daily-vote": {
        const { option } = body;
        const result = await voteDailyChallengeAsync(option);
        if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, challenge: result });
      }

      case "delete-dilemma": {
        const { dilemmaId } = body;
        const deleted = deleteDilemma(dilemmaId);
        if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, dilemmas: getDilemmas() });
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const dilemmaId = searchParams.get("id");
  if (!dilemmaId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const deleted = deleteDilemma(dilemmaId);
  if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true, dilemmas: getDilemmas() });
}
