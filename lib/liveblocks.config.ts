import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

export const client = createClient({
  authEndpoint: async (room: string) => {
    const playerId =
      typeof window !== "undefined"
        ? localStorage.getItem("dota_player_id") ?? "unknown"
        : "unknown";
    const playerName =
      typeof window !== "undefined"
        ? localStorage.getItem("dota_player_name") ?? "Player"
        : "Player";
    const res = await fetch("/api/liveblocks-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, playerName, roomId: room }),
    });
    return res.json();
  },
});

export type Question = {
  type: "counterpick" | "combat" | "ability" | "trivia" | "duel";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hero1?: string | null;
  hero2?: string | null;
  difficulty: "easy" | "medium" | "hard";
};

export type Player = {
  id: string;
  name: string;
  funnyName?: string;
  heroId: string;
  heroName: string;
  position: number;
  score: number;
  isBanned: boolean;
  banRoundsLeft: number;
  isExpert: boolean;
  isHost: boolean;
  answeredCorrectly: number;
  answeredWrong: number;
  mistakes: string[];
};

export type DuelState = {
  player1Id: string;
  player2Id: string;
  question: string;
  options: string[];
  correctIndex: number;
  p1Answer: number | null;
  p2Answer: number | null;
  winnerId: string | null;
};

export type ExpertChallenge = {
  challengerId: string;
  challengerName: string;
  correction: string;
  resolved: boolean;
  upheld: boolean | null;
};

export type GameState = {
  phase:
    | "lobby"
    | "hero-select"
    | "playing"
    | "question"
    | "duel"
    | "expert-challenge"
    | "results";
  currentPlayerIndex: number;
  playerOrder: string[];
  round: number;
  maxRounds: number;
  diceRoll: number | null;
  currentQuestion: Question | null;
  currentDuel: DuelState | null;
  expertChallenge: ExpertChallenge | null;
  squareTypes: string[];
  lastEvent: string;
  winnerIds: string[];
};

export type ChatMessage = {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  type: string;
  timestamp: number;
};

export type Storage = {
  players: LiveMap<string, Player>;
  game: LiveObject<GameState>;
  chat: LiveList<ChatMessage>;
};

export type Presence = {
  playerId: string | null;
  cursor: { x: number; y: number } | null;
};

export type UserMeta = {
  id: string;
  info: { name: string };
};

export const { RoomProvider, useStorage, useMutation } =
  createRoomContext<Presence, Storage, UserMeta>(client);
