"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!input.trim()) return;
    const encoded = encodeURIComponent(input.trim());
    router.push(`/chat?q=${encoded}`);
  };

  const examples = [
    "お腹空いた。何食べよう",
    "友達になんて返せばいい？",
    "これ買うか迷ってる",
    "今日どうしよう、暇",
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: "linear-gradient(160deg, #FDFCF7 0%, #FEF9EC 50%, #EFF8FF 100%)" }}>

      {/* Logo area */}
      <div className="flex flex-col items-center mb-10 animate-fade-in-up">
        <div className="relative mb-4">
          <svg width="80" height="80" viewBox="0 0 80 80" className="fish-logo">
            <circle cx="40" cy="40" r="38" fill="#F5C842" />
            <ellipse cx="52" cy="32" rx="14" ry="10" fill="#4AABE8" transform="rotate(-30 52 32)" />
            <circle cx="48" cy="38" r="8" fill="white" />
            <circle cx="50" cy="37" r="4" fill="#2D2D2D" />
            <circle cx="51" cy="36" r="1.5" fill="white" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-wide mb-1" style={{ color: "#2D2D2D" }}>
          だいべんしゃ
        </h1>
        <p className="text-sm font-light" style={{ color: "#6B7280" }}>
          うまく言えない気持ちを、いっしょに整えるAI
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-lg animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
        <div className="bg-white rounded-3xl shadow-lg p-6" style={{ boxShadow: "0 8px 40px rgba(245,200,66,0.15)" }}>
          <p className="text-sm font-medium mb-3" style={{ color: "#6B7280" }}>
            まとまっていなくて大丈夫。今、気になっていることをそのまま書いてね。
          </p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStart(); } }}
            placeholder="例：お腹空いた。何食べよう"
            rows={3}
            className="w-full rounded-2xl border-2 p-4 text-base resize-none focus:outline-none transition-all"
            style={{
              borderColor: input ? "#F5C842" : "#E5E7EB",
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
            }}
          />
          <button
            onClick={handleStart}
            disabled={!input.trim()}
            className="mt-3 w-full py-3 rounded-2xl text-base font-bold transition-all duration-200"
            style={{
              background: input.trim() ? "linear-gradient(135deg, #F5C842, #4AABE8)" : "#E5E7EB",
              color: input.trim() ? "white" : "#9CA3AF",
              cursor: input.trim() ? "pointer" : "not-allowed",
              boxShadow: input.trim() ? "0 4px 20px rgba(245,200,66,0.3)" : "none",
            }}
          >
            整理をはじめる →
          </button>
        </div>

        {/* Examples */}
        <div className="mt-4">
          <p className="text-xs text-center mb-2" style={{ color: "#9CA3AF" }}>こんなことでも使えます</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-3 py-2 rounded-full border transition-all hover:shadow-sm"
                style={{
                  borderColor: "#E5E7EB",
                  background: "white",
                  color: "#6B7280",
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs" style={{ color: "#D1D5DB" }}>
        無料で1日3回まで使えます
      </p>
    </main>
  );
}
