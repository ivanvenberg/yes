"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { RoomProvider, useStorage, useMutation } from "@/lib/liveblocks.config";
import { SQUARE_TYPES } from "@/lib/heroes";
import Lobby from "@/components/Lobby";
import GameBoard from "@/components/GameBoard";
import Results from "@/components/Results";

const INITIAL_GAME = {
  phase: "lobby" as const,
  currentPlayerIndex: 0,
  playerOrder: [] as string[],
  round: 1,
  maxRounds: 6,
  diceRoll: null as number | null,
  currentQuestion: null as null | {
    type: "counterpick" | "combat" | "ability" | "trivia" | "duel";
    question: string; options: string[]; correctIndex: number;
    explanation: string; hero1?: string; hero2?: string;
    difficulty: "easy" | "medium" | "hard";
  },
  currentDuel: null as null | {
    player1Id: string; player2Id: string; question: string;
    options: string[]; correctIndex: number;
    p1Answer: number | null; p2Answer: number | null; winnerId: string | null;
  },
  expertChallenge: null as null | {
    challengerId: string; challengerName: string; correction: string;
    resolved: boolean; upheld: boolean | null;
  },
  squareTypes: SQUARE_TYPES,
  lastEvent: "Waiting for host to start...",
  winnerIds: [] as string[],
};

function GameRoom({ playerId, playerName, isHost }: { playerId: string; playerName: string; isHost: boolean }) {
  // useStorage: root.game is a plain readonly object — use dot access
  const phase = useStorage((root) => root.game.phase);

  const joinGame = useMutation(({ storage }) => {
    const players = storage.get("players");
    if (!players.has(playerId)) {
      players.set(playerId, {
        id: playerId, name: playerName, heroId: "", heroName: "",
        position: 0, score: 0, isBanned: false, banRoundsLeft: 0,
        isExpert: false, isHost, answeredCorrectly: 0, answeredWrong: 0, mistakes: [],
      });
    }
  }, [playerId, playerName, isHost]);

  useEffect(() => { joinGame(); }, [joinGame]);

  if (phase === "lobby" || phase === "hero-select") return <Lobby playerId={playerId} isHost={isHost} />;
  if (phase === "results") return <Results playerId={playerId} />;
  return <GameBoard playerId={playerId} isHost={isHost} />;
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [ready, setReady] = useState(false);
  const [playerId, setPlayerId] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("dota_player_id") || uuidv4();
    const name = localStorage.getItem("dota_player_name");
    const host = localStorage.getItem("dota_is_host") === "true";
    if (!name) { router.push("/"); return; }
    localStorage.setItem("dota_player_id", id);
    setPlayerId(id); setPlayerName(name); setIsHost(host); setReady(true);
  }, [router]);

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-center"><div className="text-5xl mb-4 animate-spin">⚔️</div><p className="text-gray-400">Loading...</p></div>
    </div>
  );

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ playerId, cursor: null }}
      initialStorage={{
        players: new LiveMap(),
        game: new LiveObject(INITIAL_GAME),
        chat: new LiveList([]),
      }}
    >
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-950 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-sm">
        <span className="text-gray-500">Dota 2 Knowledge Game</span>
        <div className="flex items-center gap-3">
          <span className="text-gray-400">Room:</span>
          <span className="font-mono font-bold text-yellow-400 tracking-widest bg-gray-900 px-3 py-1 rounded-lg border border-gray-700">{roomId}</span>
          <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="text-xs text-gray-500 hover:text-gray-300">📋 Copy</button>
        </div>
        <div className="flex items-center gap-2">
          {isHost && <span className="text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">👑 HOST</span>}
          <span className="text-gray-400 text-xs">{playerName}</span>
        </div>
      </div>
      <div className="pt-12">
        <GameRoom playerId={playerId} playerName={playerName} isHost={isHost} />
      </div>
    </RoomProvider>
  );
}
