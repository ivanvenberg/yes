"use client";
import { useState } from "react";
import { useMutation } from "@/lib/liveblocks.config";
import { getHeroImageUrl } from "@/lib/heroes";
import { getRandomFunnyNickname } from "@/lib/gameLogic";

type DuelState = { player1Id: string; player2Id: string; question: string; options: string[]; correctIndex: number; p1Answer: number | null; p2Answer: number | null; winnerId: string | null };
type PlayerData = { id: string; name: string; funnyName?: string; heroId: string; score: number; isBanned: boolean; banRoundsLeft: number; isExpert: boolean; isHost: boolean; answeredCorrectly: number; answeredWrong: number; mistakes: string[]; position: number; heroName: string };

export default function DuelModal({ duel, playerId, players, advanceTurn }: { duel: DuelState; playerId: string; players: PlayerData[]; advanceTurn: () => void }) {
  const [myAnswered, setMyAnswered] = useState(false);
  const isInDuel = duel.player1Id === playerId || duel.player2Id === playerId;
  const player1 = players.find((p) => p.id === duel.player1Id);
  const player2 = players.find((p) => p.id === duel.player2Id);

  const submitAnswer = useMutation(({ storage }, answerIndex: number) => {
    const game = storage.get("game");
    const cur = game.get("currentDuel");
    if (!cur) return;
    const updated = { ...cur };
    if (playerId === cur.player1Id) updated.p1Answer = answerIndex;
    else if (playerId === cur.player2Id) updated.p2Answer = answerIndex;
    const p1Done = updated.p1Answer !== null;
    const p2Done = updated.p2Answer !== null;
    if (p1Done && p2Done) {
      const p1c = updated.p1Answer === cur.correctIndex;
      const p2c = updated.p2Answer === cur.correctIndex;
      let winnerId: string | null = null;
      if (p1c && !p2c) winnerId = cur.player1Id;
      else if (p2c && !p1c) winnerId = cur.player2Id;
      else if (p1c && p2c) winnerId = "tie";
      updated.winnerId = winnerId;
      const ap = storage.get("players");
      if (winnerId && winnerId !== "tie") {
        const winner = ap.get(winnerId);
        if (winner) ap.set(winnerId, { ...winner, score: winner.score + 400, answeredCorrectly: winner.answeredCorrectly + 1 });
        const loserId = winnerId === cur.player1Id ? cur.player2Id : cur.player1Id;
        const loser = ap.get(loserId);
        if (loser && !loser.funnyName) {
          const existing = Array.from(ap.values()).map((p) => p.funnyName).filter((n): n is string => !!n);
          ap.set(loserId, { ...loser, funnyName: getRandomFunnyNickname(existing), answeredWrong: loser.answeredWrong + 1 });
        }
      }
      const winnerName = winnerId && winnerId !== "tie" ? ap.get(winnerId)?.name ?? "?" : null;
      const msg = winnerId === "tie" ? "🤝 DUEL TIE!" : winnerId ? `🏆 ${winnerName} WINS THE DUEL! +400 pts!` : "🤝 Nobody answered";
      game.set("lastEvent", msg);
      storage.get("chat").push({ id: Date.now().toString(), playerId: "system", playerName: "System", message: msg, type: "game-event", timestamp: Date.now() });
    }
    game.set("currentDuel", updated);
  }, [playerId]);

  function handleAnswer(idx: number) {
    if (!isInDuel || myAnswered) return;
    setMyAnswered(true);
    submitAnswer(idx);
    const otherDone = playerId === duel.player1Id ? duel.p2Answer !== null : duel.p1Answer !== null;
    if (otherDone) setTimeout(() => advanceTurn(), 4000);
  }

  const myAnswer = playerId === duel.player1Id ? duel.p1Answer : duel.p2Answer;
  const isDone = duel.winnerId !== null;
  const isWinner = duel.winnerId === playerId;
  const isTie = duel.winnerId === "tie";

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-orange-950 to-gray-950 border-2 border-orange-700 rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
        <div className="text-center mb-6"><h2 className="text-3xl font-black text-orange-400 mb-1">⚔️ DUEL!</h2><p className="text-gray-400 text-sm">Correct answer wins 400 points!</p></div>
        <div className="flex items-center justify-center gap-8 mb-6">
          {[player1, player2].map((p, i) => (
            <div key={i} className={`flex flex-col items-center gap-2 ${p?.id === playerId ? "scale-110" : ""}`}>
              <img src={getHeroImageUrl(p?.heroId ?? "")} alt="" className={`w-16 h-16 rounded-xl object-cover border-2 ${isDone && duel.winnerId === p?.id ? "border-yellow-400" : p?.id === playerId ? "border-orange-400" : "border-gray-600"}`} onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/1f2937/6b7280?text=${p?.name?.[0] ?? "?"}`; }} />
              <p className="text-white font-bold text-sm text-center max-w-[80px] truncate">{p?.funnyName ?? p?.name}</p>
              {p?.id === playerId && <span className="text-xs text-orange-400">(you)</span>}
              <span className="text-xs">{i === 0 ? (duel.p1Answer !== null ? <span className="text-green-400">✅</span> : <span className="text-gray-500">⏳</span>) : (duel.p2Answer !== null ? <span className="text-green-400">✅</span> : <span className="text-gray-500">⏳</span>)}</span>
            </div>
          ))}
        </div>
        {isDone && <div className={`text-center py-3 rounded-xl mb-4 font-black text-xl ${isTie ? "bg-gray-800 text-gray-300" : isWinner ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>{isTie ? "🤝 TIE!" : isWinner ? "🏆 YOU WIN! +400 pts!" : "💀 You lost..."}</div>}
        <div className="bg-black/40 rounded-xl p-4 mb-4"><p className="text-white text-lg font-semibold">{duel.question}</p></div>
        <div className="flex flex-col gap-2">
          {duel.options.map((opt, idx) => {
            let cls = "bg-gray-800 border-gray-700 text-white hover:bg-gray-700";
            if (myAnswer !== null || isDone) {
              if (idx === duel.correctIndex) cls = "bg-green-900 border-green-500 text-green-200";
              else if (idx === myAnswer && idx !== duel.correctIndex) cls = "bg-red-900 border-red-500 text-red-200";
              else cls = "bg-gray-900 border-gray-800 text-gray-500";
            }
            return <button key={idx} onClick={() => handleAnswer(idx)} disabled={!isInDuel || myAnswer !== null || isDone} className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all disabled:cursor-default ${cls}`}><span className="text-gray-500 mr-2">{["A","B","C","D"][idx]}.</span>{opt}</button>;
          })}
        </div>
        {!isInDuel && <p className="text-center text-gray-500 text-sm mt-4">Spectating 👀</p>}
        {isDone && !isInDuel && <button onClick={advanceTurn} className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-xl text-sm">Continue →</button>}
      </div>
    </div>
  );
}
