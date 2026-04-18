import { NextRequest, NextResponse } from "next/server";

function buildPrompt(type: string, heroes: string[]): string {
  const heroList = heroes.length ? `Heroes in this game: ${heroes.join(", ")}.` : "";
  const prompts: Record<string, string> = {
    counterpick: `${heroList} Generate a Dota 2 counterpick question. Example: "Who hard counters Anti-Mage in lane?" Give 4 options.`,
    combat: `${heroList} Generate a Dota 2 combat scenario. Example: "Juggernaut with BKB and Battlefury vs Crystal Maiden with Aghs at 30 min — who wins 1v1?" Give 4 options.`,
    ability: `Generate a Dota 2 ability/mechanic question. Give 4 options.`,
    trivia: `Generate a fun Dota 2 trivia question. Give 4 options.`,
    duel: `Generate a quick Dota 2 knowledge question for a head-to-head duel. Give 4 options.`,
  };
  return prompts[type] ?? prompts["trivia"];
}

export async function POST(request: NextRequest) {
  const { type, heroes } = await request.json();
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: `You are a Dota 2 expert. Return ONLY valid JSON, no markdown:
{"question":"string","options":["A","B","C","D"],"correctIndex":0,"explanation":"string","difficulty":"easy","hero1":null,"hero2":null}`,
        messages: [{ role: "user", content: buildPrompt(type, heroes || []) }],
      }),
    });
    const data = await response.json();
    const text = (data.content?.[0]?.text ?? "").replace(/```json|```/g, "").trim();
    const question = JSON.parse(text);
    return NextResponse.json({ question });
  } catch {
    return NextResponse.json({
      question: {
        question: "Which hero uses Mana Break to counter intelligence heroes?",
        options: ["Silencer", "Anti-Mage", "Outworld Devourer", "Skywrath Mage"],
        correctIndex: 1,
        explanation: "Anti-Mage's Mana Break burns mana on each attack.",
        difficulty: "easy",
        hero1: "antimage",
        hero2: null,
      },
    });
  }
}
