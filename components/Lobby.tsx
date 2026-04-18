"use client";
import { useState } from "react";
import { useStorage, useMutation } from "@/lib/liveblocks.config";
import { HEROES, getHeroImageUrl } from "@/lib/heroes";

export default function Lobby({ playerId, isHost }: { playerId: string; isHost: boolean }) {
  const [showHeroSelect, setShowHeroSelect] = useState(false);
  const [search, setSearch] = useState("");

  // useStorage: root.game is plain object — dot access only
  const phase = useStorage((root) => root.game.phase) ?? "lobby";
  const playersRaw = useStorage((root) => {
    const arr: any[] = [];
    root.players.forEach((v) => arr.push(v));
    return arr;
  });
  const players: any[] = playersRaw ?? [];
  const myPlayer = players.find((p) => p.id === playerId);
  const allHaveHeroes = players.length > 1 && players.every((p: any) => p.heroId);

  const startHeroSelect = useMutation(({ storage }) => {
    // useMutation: storage.get("game") is LiveObject — use .set()
    storage.get("game").set("phase", "hero-select");
  }, []);

  const startGame = useMutation(({ storage }) => {
    const allPlayers = storage.get("players");
    const ids: string[] = [];
    allPlayers.forEach((_: any, id: string) => ids.push(id));
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    const game = storage.get("game");
    game.set("playerOrder", shuffled);
    game.set("phase", "playing");
    game.set("lastEvent", "🎮 Game started! Roll the dice!");
    storage.get("chat").push({
      id: Date.now().toString(), playerId: "system", playerName: "System",
      message: "⚔️ The battle begins!", type: "game-event", timestamp: Date.now(),
    });
  }, []);

  const setExpert = useMutation(({ storage }, targetId: string) => {
    const allPlayers = storage.get("players");
    allPlayers.forEach((p: any, id: string) => allPlayers.set(id, { ...p, isExpert: id === targetId }));
    const target = allPlayers.get(targetId);
    storage.get("chat").push({
      id: Date.now().toString(), playerId: "system", playerName: "System",
      message: `🎓 ${target?.name} is now the Expert!`, type: "game-event", timestamp: Date.now(),
    });
  }, []);

  const selectHero = useMutation(({ storage }, heroId: string) => {
    const hero = HEROES.find((h) => h.id === heroId);
    if (!hero) return;
    const allPlayers = storage.get("players");
    const me = allPlayers.get(playerId);
    if (me) allPlayers.set(playerId, { ...me, heroId, heroName: hero.name });
  }, [playerId]);

  const filtered = HEROES.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center py-8 px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-yellow-400 mb-1">
            {phase === "hero-select" ? "⚔️ Choose Your Hero" : "🏟️ Waiting Room"}
          </h1>
          <p className="text-gray-500">
            {phase === "hero-select" ? "Pick your hero avatar!" : isHost ? "Waiting for players. Start when ready." : "Waiting for host..."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-gray-300 mb-4">👥 Players ({players.length})</h2>
            <div className="flex flex-col gap-3">
              {players.map((player: any) => (
                <div key={player.id} className={`flex items-center gap-3 p-3 rounded-xl border ${player.id === playerId ? "border-yellow-600 bg-yellow-950/30" : "border-gray-700 bg-gray-800"}`}>
                  {player.heroId ? (
                    <img src={getHeroImageUrl(player.heroId)} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/40x40/1f2937/6b7280?text=${player.name[0]}`; }} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center text-gray-500">?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white truncate">{player.name}</span>
                      {player.isHost && <span className="text-xs bg-yellow-500 text-black font-bold px-1.5 py-0.5 rounded-full">👑</span>}
                      {player.isExpert && <span className="text-xs bg-cyan-500 text-black font-bold px-1.5 py-0.5 rounded-full">🎓</span>}
                      {player.id === playerId && <span className="text-xs text-yellow-400">(you)</span>}
                    </div>
                    {player.heroId && <p className="text-xs text-gray-400">{player.heroName}</p>}
                    {!player.heroId && phase === "hero-select" && <p className="text-xs text-orange-400 animate-pulse">Picking hero...</p>}
                  </div>
                  {isHost && player.id !== playerId && (
                    <button onClick={() => setExpert(player.id)} className="text-xs bg-cyan-800 hover:bg-cyan-700 text-cyan-200 px-2 py-1 rounded-lg transition-colors">
                      {player.isExpert ? "Remove Expert" : "Set Expert"}
                    </button>
                  )}
                </div>
              ))}
              {players.length < 2 && <p className="text-gray-600 text-sm text-center py-4">Share the room code to invite friends!</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {phase === "hero-select" && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-300 mb-4">🦸 Your Hero</h2>
                {myPlayer?.heroId ? (
                  <div className="flex items-center gap-4">
                    <img src={getHeroImageUrl(myPlayer.heroId)} alt="" className="w-20 h-20 rounded-xl object-cover border-2 border-yellow-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/80x80/1f2937/6b7280?text=Hero"; }} />
                    <div>
                      <p className="font-bold text-white text-xl">{myPlayer.heroName}</p>
                      <button onClick={() => setShowHeroSelect(true)} className="text-xs text-yellow-400 hover:text-yellow-300 mt-1">Change hero</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowHeroSelect(true)} className="w-full bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-4 rounded-xl transition-all hover:scale-105">
                    🎮 Pick Your Hero
                  </button>
                )}
              </div>
            )}

            {isHost && (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-gray-300 mb-4">👑 Host Controls</h2>
                {phase === "lobby" && (
                  <button onClick={startHeroSelect} disabled={players.length < 2}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all hover:scale-105 disabled:hover:scale-100">
                    {players.length < 2 ? "Need 2+ players" : "🗡️ Start Hero Selection"}
                  </button>
                )}
                {phase === "hero-select" && (
                  <button onClick={startGame} disabled={!allHaveHeroes}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all hover:scale-105 disabled:hover:scale-100">
                    {!allHaveHeroes ? "Waiting for all heroes..." : "⚔️ START THE BATTLE!"}
                  </button>
                )}
              </div>
            )}

            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-300 mb-3">📋 How to Play</h2>
              <ul className="text-gray-400 text-sm space-y-1.5">
                <li>🎲 Roll dice, move hero on the board</li>
                <li>⚔️ Blue = Counterpick questions</li>
                <li>🛡️ Red = Combat/Item scenarios</li>
                <li>✨ Purple = Ability knowledge</li>
                <li>📚 Orange = Dota 2 trivia</li>
                <li>🥊 Gold = Duel another player!</li>
                <li>🎓 Cyan = Expert challenge</li>
                <li>😂 Wrong 2x = funny nickname</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showHeroSelect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-yellow-400">⚔️ Choose Your Hero</h2>
              <button onClick={() => setShowHeroSelect(false)} className="text-gray-500 hover:text-white text-2xl">✕</button>
            </div>
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-yellow-500" />
            <div className="overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filtered.map((hero) => (
                <button key={hero.id} onClick={() => { selectHero(hero.id); setShowHeroSelect(false); }}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-700 hover:border-yellow-500 bg-gray-800 transition-all hover:scale-105 group">
                  <img src={getHeroImageUrl(hero.id)} alt={hero.name} className="w-16 h-16 rounded-lg object-cover border-2 border-gray-600 group-hover:border-yellow-500"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://placehold.co/64x64/1f2937/6b7280?text=${hero.emoji}`; }} />
                  <span className="text-xs font-bold text-white text-center">{hero.name}</span>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {hero.roles.slice(0, 2).map((r) => <span key={r} className="text-[10px] bg-gray-700 text-gray-400 px-1 rounded">{r}</span>)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
