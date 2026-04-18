"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [error, setError] = useState("");

  function handleCreate() {
    if (!name.trim()) return setError("Enter your name first.");
    const roomId = generateRoomCode();
    const playerId = uuidv4();
    localStorage.setItem("dota_player_id", playerId);
    localStorage.setItem("dota_player_name", name.trim());
    localStorage.setItem("dota_is_host", "true");
    router.push(`/room/${roomId}`);
  }

  function handleJoin() {
    if (!name.trim()) return setError("Enter your name first.");
    if (!joinCode.trim()) return setError("Enter a room code.");
    const playerId = uuidv4();
    localStorage.setItem("dota_player_id", playerId);
    localStorage.setItem("dota_player_name", name.trim());
    localStorage.setItem("dota_is_host", "false");
    router.push(`/room/${joinCode.trim().toUpperCase()}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center mb-10">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-red-500 mb-2">DOTA 2</h1>
        <h2 className="text-2xl font-bold text-gray-300 tracking-widest uppercase">Knowledge Battleground</h2>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            placeholder="e.g. Miracle-, N0tail..."
            maxLength={20}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
          />
        </div>

        {mode === "choose" && (
          <div className="flex flex-col gap-3">
            <button onClick={() => setMode("create")} className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-105">⚔️ Create Room (Host)</button>
            <button onClick={() => setMode("join")} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-105">🚪 Join Room</button>
          </div>
        )}

        {mode === "create" && (
          <div className="flex flex-col gap-4">
            <p className="text-gray-400 text-sm text-center">You&apos;ll be the <span className="text-yellow-400 font-bold">HOST</span></p>
            <button onClick={handleCreate} className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-105">🏁 Create Game Room</button>
            <button onClick={() => setMode("choose")} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col gap-4">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(""); }}
              placeholder="ROOM CODE"
              maxLength={5}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white font-mono text-xl text-center tracking-widest uppercase focus:outline-none focus:border-blue-500"
            />
            <button onClick={handleJoin} className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold py-4 rounded-xl text-lg transition-all hover:scale-105">🚪 Join Game</button>
            <button onClick={() => setMode("choose")} className="text-gray-500 hover:text-gray-300 text-sm">← Back</button>
          </div>
        )}

        {error && <p className="mt-4 text-red-400 text-sm text-center font-semibold">{error}</p>}
      </div>
    </main>
  );
}
