"use client";
import { useState, useCallback } from "react";
import { useStorage, useMutation } from "@/lib/liveblocks.config";
import { SQUARE_TYPES, SQUARE_LABELS, SQUARE_COLORS, getHeroImageUrl } from "@/lib/heroes";
import { rollDice, getNextPosition, getRandomFunnyNickname, getScoreForAnswer, getRandomPrize } from "@/lib/gameLogic";
import { Question } from "@/lib/liveblocks.config";
import QuestionCard from "./QuestionCard";
import DuelModal from "./DuelModal";

const DICE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
const BOARD_POSITIONS = [
  {r:4,c:0},{r:4,c:1},{r:4,c:2},{r:4,c:3},{r:4,c:4},
  {r:3,c:4},{r:2,c:4},{r:1,c:4},
  {r:0,c:4},{r:0,c:3},{r:0,c:2},{r:0,c:1},{r:0,c:0},
  {r:1,c:0},{r:2,c:0},{r:3,c:0},
  {r:4,c:1},{r:4,c:2},{r:4,c:3},{r:4,c:4},
];

export default function GameBoard({ playerId, isHost }: { playerId: string; isHost: boolean }) {
  const [loadingQ, setLoadingQ] = useState(false);
  const [diceAnim, setDiceAnim] = useState(false);

  // useStorage: root.game is a plain readonly object — dot access only, never .get()
  const phase             = useStorage((root) => root.game.phase) ?? "playing";
  const currentPlayerIndex = useStorage((root) => root.game.currentPlayerIndex) ?? 0;
  const playerOrder       = useStorage((root) => root.game.playerOrder) ?? [];
  const round             = useStorage((root) => root.game.round) ?? 1;
  const maxRounds         = useStorage((root) => root.game.maxRounds) ?? 6;
  const diceRoll          = useStorage((root) => root.game.diceRoll);
  const currentQuestion   = useStorage((root) => root.game.currentQuestion);
  const currentDuel       = useStorage((root) => root.game.currentDuel);
  const expertChallenge   = useStorage((root) => root.game.expertChallenge);
  const lastEvent         = useStorage((root) => root.game.lastEvent) ?? "";

  const chatRaw = useStorage((root) => {
    const a: any[] = [];
    root.chat.forEach((m) => a.push(m));
    return a.slice(-20);
  });
  const chat: any[] = chatRaw ?? [];

  const playersRaw = useStorage((root) => {
    const a: any[] = [];
    root.players.forEach((v) => a.push(v));
    return a;
  });
  const players: any[] = playersRaw ?? [];

  const currentPlayerId = playerOrder[currentPlayerIndex] ?? "";
  const isMyTurn = currentPlayerId === playerId;
  const currentPlayer = players.find((p: any) => p.id === currentPlayerId);
  const myPlayer = players.find((p: any) => p.id === playerId);

  // useMutation: storage.get("game") returns LiveObject — use .get() and .set()
  const advanceTurn = useMutation(({ storage }) => {
    const game = storage.get("game");
    const order = game.get("playerOrder");
    const curIdx = game.get("currentPlayerIndex");
    const curRound = game.get("round");
    const maxR = game.get("maxRounds");
    const nextIdx = (curIdx + 1) % order.length;
    const newRound = nextIdx === 0 ? curRound + 1 : curRound;

    if (newRound > maxR) {
      const allPlayers = storage.get("players");
      let top = -1; let winners: string[] = [];
      allPlayers.forEach((p) => {
        if (p.score > top) { top = p.score; winners = [p.id]; }
        else if (p.score === top) winners.push(p.id);
      });
      game.set("winnerIds", winners);
      game.set("phase", "results");
      return;
    }

    const pm = storage.get("players");
    let skip = nextIdx;
    for (let i = 0; i < order.length; i++) {
      const np = pm.get(order[skip]);
      if (np?.isBanned) {
        const left = np.banRoundsLeft - 1;
        pm.set(order[skip], { ...np, banRoundsLeft: left, isBanned: left > 0 });
        skip = (skip + 1) % order.length;
      } else break;
    }

    game.set("currentPlayerIndex", skip);
    game.set("round", newRound);
    game.set("phase", "playing");
    game.set("diceRoll", null);
    game.set("currentQuestion", null);
    game.set("currentDuel", null);
    game.set("expertChallenge", null);
    game.set("lastEvent", `🎲 It's ${pm.get(order[skip])?.name ?? "next player"}'s turn!`);
  }, []);

  const applyRoll = useMutation(({ storage }, roll: number, sqType: string, newPos: number) => {
    const ap = storage.get("players");
    const me = ap.get(playerId);
    if (!me) return;
    ap.set(playerId, { ...me, position: newPos });
    storage.get("game").set("diceRoll", roll);
    storage.get("game").set("lastEvent", `🎲 ${me.name} rolled ${roll} → ${SQUARE_LABELS[sqType] ?? sqType}`);
  }, [playerId]);

  const applyPrize = useMutation(({ storage }, name: string, emoji: string, desc: string) => {
    const me = storage.get("players").get(playerId);
    if (!me) return;
    storage.get("game").set("lastEvent", `🏆 ${me.name} hit Prize Zone! ${emoji} ${name} — ${desc}`);
    storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `🏆 ${me.name} got: ${emoji} ${name}!`, type: "game-event", timestamp: Date.now() });
  }, [playerId]);

  const applyQuestion = useMutation(({ storage }, question: Question) => {
    storage.get("game").set("currentQuestion", question);
    storage.get("game").set("phase", "question");
  }, []);

  const applyDuelSetup = useMutation(({ storage }, targetId: string, question: Question) => {
    const ap = storage.get("players");
    const me = ap.get(playerId);
    const target = ap.get(targetId);
    if (!me || !target) return;
    const game = storage.get("game");
    game.set("phase", "duel");
    game.set("currentDuel", { player1Id: playerId, player2Id: targetId, question: question.question, options: question.options, correctIndex: question.correctIndex, p1Answer: null, p2Answer: null, winnerId: null });
    game.set("lastEvent", `🥊 DUEL! ${me.name} vs ${target.name}!`);
    storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `🥊 DUEL! ${me.name} vs ${target.name}!`, type: "game-event", timestamp: Date.now() });
  }, [playerId]);

  const handleAnswer = useMutation(({ storage }, _idx: number, correct: boolean) => {
    const ap = storage.get("players");
    const me = ap.get(playerId);
    if (!me) return;
    const q = storage.get("game").get("currentQuestion");
    const pts = getScoreForAnswer(correct, q?.difficulty ?? "medium");
    if (correct) {
      ap.set(playerId, { ...me, score: me.score + pts, answeredCorrectly: me.answeredCorrectly + 1 });
      storage.get("game").set("lastEvent", `✅ Correct! ${me.name} +${pts} pts!`);
      storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `✅ ${me.name} +${pts} pts! 🎉`, type: "game-event", timestamp: Date.now() });
    } else {
      const newWrong = me.answeredWrong + 1;
      const existingNames = Array.from(ap.values()).map((p) => p.funnyName).filter((n): n is string => !!n);
      const funny = newWrong >= 2 && !me.funnyName ? getRandomFunnyNickname(existingNames) : me.funnyName;
      ap.set(playerId, { ...me, answeredWrong: newWrong, funnyName: funny ?? me.funnyName });
      if (funny && !me.funnyName) {
        storage.get("game").set("lastEvent", `😂 WRONG! ${me.name} is now "${funny}" LMAO`);
        storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `😂 ${me.name} → "${funny}" 💀`, type: "funny", timestamp: Date.now() });
      } else {
        storage.get("game").set("lastEvent", `❌ Wrong! ${me.name} loses this round.`);
        storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `❌ ${me.name} got it wrong`, type: "game-event", timestamp: Date.now() });
      }
    }
  }, [playerId]);

  const handleExpertChallenge = useMutation(({ storage }, correction: string) => {
    const me = storage.get("players").get(playerId);
    if (!me?.isExpert) return;
    storage.get("game").set("expertChallenge", { challengerId: playerId, challengerName: me.name, correction, resolved: false, upheld: null });
    storage.get("game").set("lastEvent", `🎓 Expert Challenge by ${me.name}!`);
    storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `🎓 ${me.name} challenges this answer!`, type: "expert", timestamp: Date.now() });
  }, [playerId]);

  const resolveExpertChallenge = useMutation(({ storage }, upheld: boolean) => {
    if (!isHost) return;
    const game = storage.get("game");
    const ch = game.get("expertChallenge");
    if (!ch) return;
    const ap = storage.get("players");
    const expert = ap.get(ch.challengerId);
    if (upheld) {
      if (expert) ap.set(ch.challengerId, { ...expert, score: expert.score + 200 });
      game.set("lastEvent", `✅ Expert upheld! ${ch.challengerName} +200 pts!`);
      storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `🎓 Expert was right! +200 pts`, type: "expert", timestamp: Date.now() });
    } else {
      if (expert) ap.set(ch.challengerId, { ...expert, isBanned: true, banRoundsLeft: 1 });
      game.set("lastEvent", `🚫 Expert WRONG! ${ch.challengerName} banned 1 round lmaooo`);
      storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: `🚫 Expert was WRONG! Banned 💀`, type: "funny", timestamp: Date.now() });
    }
    game.set("expertChallenge", { ...ch, resolved: true, upheld });
  }, [isHost]);

  // Async handlers live OUTSIDE useMutation
  const handleRoll = useCallback(async () => {
    if (!isMyTurn || loadingQ) return;
    setDiceAnim(true);
    setTimeout(() => setDiceAnim(false), 700);
    const roll = rollDice();
    const me = players.find((p: any) => p.id === playerId);
    if (!me) return;
    const newPos = getNextPosition(me.position, roll);
    const sqType = SQUARE_TYPES[newPos] ?? "trivia";
    applyRoll(roll, sqType, newPos);

    if (sqType === "prize") {
      const prize = getRandomPrize();
      applyPrize(prize.name, prize.emoji, prize.description);
      setTimeout(() => advanceTurn(), 3500);
      return;
    }
    if (sqType === "duel") {
      const others = players.filter((p: any) => p.id !== playerId && !p.isBanned);
      if (others.length > 0) {
        const target = others[Math.floor(Math.random() * others.length)];
        setLoadingQ(true);
        try {
          const res = await fetch("/api/question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "duel", heroes: players.map((p: any) => p.heroId) }) });
          const { question } = await res.json() as { question: Question };
          applyDuelSetup(target.id, question);
        } finally { setLoadingQ(false); }
        return;
      }
    }
    setLoadingQ(true);
    try {
      const res = await fetch("/api/question", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: sqType, heroes: players.map((p: any) => p.heroId) }) });
      const { question } = await res.json() as { question: Question };
      applyQuestion(question);
    } finally { setLoadingQ(false); }
  }, [isMyTurn, loadingQ, players, playerId, applyRoll, applyPrize, applyQuestion, applyDuelSetup, advanceTurn]);

  const handleAnswerAndAdvance = useCallback((idx: number, correct: boolean) => {
    handleAnswer(idx, correct);
    setTimeout(() => advanceTurn(), 3500);
  }, [handleAnswer, advanceTurn]);

  const handleResolveAndAdvance = useCallback((upheld: boolean) => {
    resolveExpertChallenge(upheld);
    setTimeout(() => advanceTurn(), 3000);
  }, [resolveExpertChallenge, advanceTurn]);

  return (
    <div className="min-h-screen bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4 justify-between">
          <div><span className="text-gray-500 text-sm">Round </span><span className="text-yellow-400 font-black text-2xl">{round}</span><span className="text-gray-600 text-sm">/{maxRounds}</span></div>
          <p className="flex-1 text-center text-white font-semibold text-sm px-4">{lastEvent}</p>
          {diceRoll != null && <div className={`text-4xl select-none ${diceAnim ? "dice-roll" : ""}`}>{DICE_FACES[diceRoll - 1]}</div>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-gray-900 border border-gray-700 rounded-2xl p-4">
            <div className="grid grid-cols-5 gap-1.5" style={{ aspectRatio: "1" }}>
              {Array.from({ length: 25 }, (_, idx) => {
                const row = Math.floor(idx / 5);
                const col = idx % 5;
                const isPerimeter = row === 0 || row === 4 || col === 0 || col === 4;
                if (!isPerimeter) {
                  if (idx === 12) return <div key={idx} className="flex items-center justify-center text-3xl">⚔️</div>;
                  return <div key={idx} className="bg-gray-800/20 rounded" />;
                }
                const posIdx = BOARD_POSITIONS.findIndex((p) => p.r === row && p.c === col);
                const sqType = posIdx >= 0 ? (SQUARE_TYPES[posIdx] ?? "trivia") : "trivia";
                const sqColor = SQUARE_COLORS[sqType] ?? "#6b7280";
                const playersHere = players.filter((p: any) => p.position === posIdx);
                return (
                  <div key={idx} className="board-square p-1 min-h-[3rem]" style={{ backgroundColor: sqColor + "22", borderColor: sqColor + "66" }}>
                    <div className="text-[9px] font-bold" style={{ color: sqColor }}>
                      {posIdx === 0 ? "🏁" : posIdx === 5 ? "🥊" : posIdx === 10 ? "🎓" : posIdx === 15 ? "🏆" : (SQUARE_LABELS[sqType] ?? "").split(" ")[0]}
                    </div>
                    <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                      {playersHere.map((p: any) => (
                        <div key={p.id} className={`w-5 h-5 rounded-full overflow-hidden border ${p.id === playerId ? "border-yellow-400 pulse-token" : "border-gray-500"}`} title={p.funnyName ? `${p.funnyName} (${p.name})` : p.name}>
                          <img src={getHeroImageUrl(p.heroId)} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/20x20/1f2937/ffffff?text=${p.name[0]}`; }} />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {isMyTurn && phase === "playing" && !loadingQ && (
              <button onClick={handleRoll} className="mt-4 w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-xl text-xl transition-all hover:scale-105 active:scale-95">🎲 ROLL THE DICE!</button>
            )}
            {!isMyTurn && phase === "playing" && (
              <div className="mt-4 text-center text-gray-500 py-2 text-sm">Waiting for <span className="text-yellow-400 font-bold">{currentPlayer?.funnyName ?? currentPlayer?.name ?? "..."}</span>...</div>
            )}
            {loadingQ && (
              <div className="mt-4 text-center text-gray-400 py-2 flex items-center justify-center gap-2"><div className="animate-spin">⚔️</div> Summoning a question...</div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4">
              <h3 className="font-bold text-gray-400 mb-3 text-xs uppercase tracking-wider">📊 Scoreboard</h3>
              <div className="flex flex-col gap-2">
                {[...players].sort((a: any, b: any) => b.score - a.score).map((player: any, idx: number) => (
                  <div key={player.id} className={`flex items-center gap-2 p-2 rounded-lg ${player.id === currentPlayerId ? "bg-yellow-950/40 border border-yellow-800" : "bg-gray-800"}`}>
                    <span className="text-gray-500 text-xs w-4">{idx + 1}.</span>
                    <img src={getHeroImageUrl(player.heroId)} className="w-7 h-7 rounded-full object-cover border border-gray-600" alt="" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/28x28/1f2937/6b7280?text=${player.name[0]}`; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{player.funnyName ? <span className="text-orange-400">{player.funnyName}</span> : player.name}</p>
                      <div className="flex gap-1">{player.isExpert && <span className="text-[9px] text-cyan-400">🎓</span>}{player.isBanned && <span className="text-[9px] text-red-400">🚫</span>}</div>
                    </div>
                    <span className="text-yellow-400 font-black text-sm">{player.score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 flex-1">
              <h3 className="font-bold text-gray-400 mb-3 text-xs uppercase tracking-wider">💬 Battle Log</h3>
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-52">
                {chat.map((msg: any) => (
                  <p key={msg.id} className={`text-xs leading-relaxed ${msg.type === "funny" ? "text-orange-400 font-bold" : msg.type === "expert" ? "text-cyan-300" : "text-gray-400"}`}>{msg.message}</p>
                ))}
                {chat.length === 0 && <p className="text-gray-700 text-xs">Events will appear here...</p>}
              </div>
            </div>
          </div>
        </div>

        {phase === "question" && currentQuestion != null && (
          <QuestionCard question={currentQuestion} playerId={playerId} isMyTurn={isMyTurn} myPlayer={myPlayer ?? null} onAnswer={handleAnswerAndAdvance} onExpertChallenge={handleExpertChallenge} expertChallenge={expertChallenge ?? null} isHost={isHost} onResolveChallenge={handleResolveAndAdvance} />
        )}
        {phase === "duel" && currentDuel != null && (
          <DuelModal duel={currentDuel} playerId={playerId} players={players} advanceTurn={advanceTurn} />
        )}
      </div>
    </div>
  );
}
