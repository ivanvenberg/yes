"use client";
import { useState, useEffect } from "react";
import { Question } from "@/lib/liveblocks.config";
import { getHeroImageUrl } from "@/lib/heroes";

type Props = {
  question: Question;
  playerId: string;
  isMyTurn: boolean;
  myPlayer: { isExpert: boolean; name: string } | null;
  onAnswer: (index: number, correct: boolean) => void;
  onExpertChallenge: (correction: string) => void;
  expertChallenge: { challengerId: string; challengerName: string; correction: string; resolved: boolean; upheld: boolean | null } | null;
  isHost: boolean;
  onResolveChallenge: (upheld: boolean) => void;
};

const TYPE_COLORS: Record<string, string> = {
  counterpick: "from-blue-900 to-blue-950 border-blue-700",
  combat: "from-red-900 to-red-950 border-red-700",
  ability: "from-purple-900 to-purple-950 border-purple-700",
  trivia: "from-amber-900 to-amber-950 border-amber-700",
};
const TYPE_ICONS: Record<string, string> = { counterpick: "⚔️", combat: "🛡️", ability: "✨", trivia: "📚" };
const DIFF_COLORS: Record<string, string> = { easy: "text-green-400", medium: "text-yellow-400", hard: "text-red-400" };

export default function QuestionCard({ question, isMyTurn, myPlayer, onAnswer, onExpertChallenge, expertChallenge, isHost, onResolveChallenge }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [expertInput, setExpertInput] = useState("");
  const [showExpertInput, setShowExpertInput] = useState(false);

  useEffect(() => { setSelected(null); setRevealed(false); setTimeLeft(30); setExpertInput(""); setShowExpertInput(false); }, [question]);

  useEffect(() => {
    if (revealed || !isMyTurn) return;
    const t = setInterval(() => setTimeLeft((v) => {
      if (v <= 1) { clearInterval(t); setRevealed(true); onAnswer(-1, false); return 0; }
      return v - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [revealed, isMyTurn, onAnswer]);

  function pick(idx: number) {
    if (!isMyTurn || selected !== null || revealed) return;
    setSelected(idx); setRevealed(true);
    onAnswer(idx, idx === question.correctIndex);
  }

  const bg = TYPE_COLORS[question.type] ?? "from-gray-900 to-gray-950 border-gray-700";

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-b ${bg} border-2 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TYPE_ICONS[question.type] ?? "❓"}</span>
            <span className="text-white font-bold capitalize">{question.type}</span>
            <span className={`text-xs font-bold uppercase ${DIFF_COLORS[question.difficulty] ?? ""}`}>[{question.difficulty}]</span>
          </div>
          {isMyTurn && !revealed && <div className={`text-2xl font-black ${timeLeft <= 10 ? "text-red-400 animate-pulse" : "text-white"}`}>⏱️ {timeLeft}s</div>}
          {!isMyTurn && <span className="text-gray-400 text-sm">👀 Spectating</span>}
        </div>

        {(question.hero1 || question.hero2) && (
          <div className="flex items-center justify-center gap-4 mb-4">
            {question.hero1 && <div className="text-center"><img src={getHeroImageUrl(question.hero1)} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-600 mx-auto" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/1f2937/6b7280?text=?"; }} /><p className="text-xs text-gray-400 mt-1 capitalize">{question.hero1.replace(/_/g, " ")}</p></div>}
            {question.hero1 && question.hero2 && <span className="text-3xl font-black text-gray-500">VS</span>}
            {question.hero2 && <div className="text-center"><img src={getHeroImageUrl(question.hero2)} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-600 mx-auto" onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/64x64/1f2937/6b7280?text=?"; }} /><p className="text-xs text-gray-400 mt-1 capitalize">{question.hero2.replace(/_/g, " ")}</p></div>}
          </div>
        )}

        <div className="bg-black/30 rounded-xl p-4 mb-4"><p className="text-white text-lg font-semibold leading-relaxed">{question.question}</p></div>

        <div className="flex flex-col gap-2 mb-4">
          {question.options.map((opt, idx) => {
            let cls = "bg-gray-800 border-gray-700 text-white hover:bg-gray-700";
            if (revealed) {
              if (idx === question.correctIndex) cls = "bg-green-900 border-green-500 text-green-200";
              else if (idx === selected) cls = "bg-red-900 border-red-500 text-red-200";
              else cls = "bg-gray-900 border-gray-800 text-gray-500";
            }
            return (
              <button key={idx} onClick={() => pick(idx)} disabled={!isMyTurn || revealed} className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all disabled:cursor-default ${cls}`}>
                <span className="text-gray-500 mr-2">{["A","B","C","D"][idx]}.</span>{opt}
                {revealed && idx === question.correctIndex && <span className="ml-2">✅</span>}
                {revealed && idx === selected && idx !== question.correctIndex && <span className="ml-2">❌</span>}
              </button>
            );
          })}
        </div>

        {revealed && <div className="bg-black/40 rounded-xl p-3 mb-4 border border-gray-700"><p className="text-sm text-gray-300"><span className="text-yellow-400 font-bold">📖 </span>{question.explanation}</p></div>}

        {myPlayer?.isExpert && !expertChallenge && (
          <div className="border-t border-gray-700 pt-4">
            {!showExpertInput ? (
              <button onClick={() => setShowExpertInput(true)} className="text-sm bg-cyan-900 hover:bg-cyan-800 border border-cyan-700 text-cyan-300 px-4 py-2 rounded-lg">🎓 Challenge this answer as Expert</button>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-cyan-400 text-sm font-bold">🎓 Your correction:</p>
                <textarea value={expertInput} onChange={(e) => setExpertInput(e.target.value)} placeholder="What's wrong and what's correct..." className="w-full bg-gray-800 border border-cyan-700 rounded-lg p-3 text-white text-sm resize-none h-20 focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => { onExpertChallenge(expertInput); setShowExpertInput(false); }} disabled={!expertInput.trim()} className="flex-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 text-white font-bold py-2 rounded-lg text-sm">Submit Challenge</button>
                  <button onClick={() => setShowExpertInput(false)} className="text-gray-500 px-3 text-sm">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {expertChallenge && !expertChallenge.resolved && (
          <div className="mt-4 bg-cyan-950/60 border border-cyan-700 rounded-xl p-4">
            <p className="text-cyan-400 font-bold mb-1">🎓 EXPERT CHALLENGE by {expertChallenge.challengerName}!</p>
            <p className="text-gray-300 text-sm italic mb-3">&quot;{expertChallenge.correction}&quot;</p>
            {isHost ? (
              <div className="flex gap-3">
                <button onClick={() => onResolveChallenge(true)} className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm">✅ Expert right (+200 pts)</button>
                <button onClick={() => onResolveChallenge(false)} className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg text-sm">🚫 Expert wrong (banned lol)</button>
              </div>
            ) : <p className="text-gray-500 text-sm text-center">Host is deciding... 👀</p>}
          </div>
        )}

        {expertChallenge?.resolved && (
          <div className={`mt-4 rounded-xl p-3 text-center font-bold ${expertChallenge.upheld ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"}`}>
            {expertChallenge.upheld ? "✅ Expert upheld!" : "🚫 Expert REJECTED! Banned lmaooo"}
          </div>
        )}
      </div>
    </div>
  );
}
