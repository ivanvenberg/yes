"use client";
import { useStorage } from "@/lib/liveblocks.config";
import { getHeroById, getHeroImageUrl } from "@/lib/heroes";

export default function Results({ playerId }: { playerId: string }) {
  // useStorage: root.game is plain object — dot access only
  const playersRaw = useStorage((root) => {
    const a: any[] = [];
    root.players.forEach((v) => a.push(v));
    return a.sort((a, b) => b.score - a.score);
  });
  const players: any[] = playersRaw ?? [];
  const winnerIds: string[] = useStorage((root) => root.game.winnerIds) ?? [];
  const MEDALS = ["🥇", "🥈", "🥉"];

  function getRec(player: any): string {
    const total = player.answeredCorrectly + player.answeredWrong;
    const acc = total > 0 ? Math.round((player.answeredCorrectly / total) * 100) : 0;
    if (acc >= 80) return "Absolutely cracked. Play ranked more.";
    if (acc >= 60) return "Solid! Re-watch some replays on counterpicking.";
    if (acc >= 40) return "Room to grow. Focus on itemization basics.";
    if (acc >= 20) return "Touch grass. Read the wiki. Touch grass again.";
    return "Buddy... please watch pro replays before next session. 💀";
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          {winnerIds.includes(playerId) ? (
            <><div className="text-6xl mb-3 animate-bounce">🏆</div><h1 className="text-4xl font-black text-yellow-400 mb-2">GG WP!</h1><p className="text-gray-300">You&apos;re the Dota 2 Knowledge Champion!</p></>
          ) : (
            <><div className="text-6xl mb-3">⚔️</div><h1 className="text-4xl font-black text-gray-300 mb-2">Game Over!</h1></>
          )}
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">📊 Final Standings</h2>
          <div className="flex flex-col gap-3">
            {players.map((player: any, idx: number) => {
              const total = player.answeredCorrectly + player.answeredWrong;
              const acc = total > 0 ? Math.round((player.answeredCorrectly / total) * 100) : 0;
              return (
                <div key={player.id} className={`p-4 rounded-xl border-2 ${winnerIds.includes(player.id) ? "border-yellow-500 bg-yellow-950/30" : player.id === playerId ? "border-gray-500 bg-gray-800" : "border-gray-800 bg-gray-900"}`}>
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{MEDALS[idx] ?? `${idx + 1}.`}</span>
                    <img src={getHeroImageUrl(player.heroId)} alt="" className="w-12 h-12 rounded-xl object-cover border-2 border-gray-600" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/48x48/1f2937/6b7280?text=${player.name[0]}`; }} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-white text-lg">
                          {player.funnyName ? <><span className="text-orange-400">{player.funnyName}</span><span className="text-gray-500 text-sm ml-1">({player.name})</span></> : player.name}
                        </span>
                        {winnerIds.includes(player.id) && <span className="text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded-full">👑 WINNER</span>}
                        {player.id === playerId && <span className="text-xs text-yellow-400">(you)</span>}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs">
                        <span className="text-green-400">✅ {player.answeredCorrectly}</span>
                        <span className="text-red-400">❌ {player.answeredWrong}</span>
                        <span className="text-gray-500">{acc}% accuracy</span>
                      </div>
                    </div>
                    <div className="text-right"><div className="text-yellow-400 font-black text-2xl">{player.score}</div><div className="text-gray-500 text-xs">pts</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-300 mb-4">🎯 Post-Game Roast</h2>
          <div className="flex flex-col gap-4">
            {players.map((player: any) => {
              const hero = getHeroById(player.heroId);
              const total = player.answeredCorrectly + player.answeredWrong;
              const acc = total > 0 ? Math.round((player.answeredCorrectly / total) * 100) : 0;
              return (
                <div key={player.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={getHeroImageUrl(player.heroId)} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/1f2937/6b7280?text=${player.name[0]}`; }} />
                    <div className="flex-1">
                      <p className="font-bold text-white">{player.funnyName || player.name}</p>
                      <div className="w-32 h-2 bg-gray-700 rounded-full mt-1"><div className="h-2 rounded-full" style={{ width: `${acc}%`, backgroundColor: acc >= 70 ? "#22c55e" : acc >= 40 ? "#f59e0b" : "#ef4444" }} /></div>
                    </div>
                    <span className="font-bold" style={{ color: acc >= 70 ? "#22c55e" : acc >= 40 ? "#f59e0b" : "#ef4444" }}>{acc}%</span>
                  </div>
                  <p className="text-gray-400 text-sm italic">💬 {getRec(player)}</p>
                  {hero && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <p className="text-xs text-gray-500 w-full">Study counters for {hero.name}:</p>
                      {hero.counters.slice(0, 3).map((c) => <span key={c} className="text-xs bg-red-950 border border-red-900 text-red-400 px-2 py-0.5 rounded-lg">⚔️ {c}</span>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <button onClick={() => { window.location.href = "/"; }} className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black py-4 px-10 rounded-xl text-xl transition-all hover:scale-105">🎮 Play Again</button>
          <p className="text-gray-600 text-xs mt-3">GG EZ. See you next match.</p>
        </div>
      </div>
    </div>
  );
}
