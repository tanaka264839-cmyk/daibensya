"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [input, setInput] = useState("");
  const router = useRouter();

  const handleStart = () => {
    if (!input.trim()) return;
    router.push(`/chat?q=${encodeURIComponent(input.trim())}`);
  };

  const examples = [
    "お腹空いた。何食べよう",
    "友達になんて返せばいい？",
    "これ買うか迷ってる",
    "今日どうしよう、暇",
  ];

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(170deg, #FDFCF7 0%, #FEF9EC 60%, #F0F7FF 100%)" }}>

      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-12 animate-fade-in-up">
        <div className="mb-5" style={{ filter: "drop-shadow(0 8px 24px rgba(245,200,66,0.35))" }}>
          <svg width="72" height="72" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="38" fill="#F5C842" />
            <ellipse cx="52" cy="32" rx="14" ry="10" fill="#4AABE8" transform="rotate(-30 52 32)" />
            <circle cx="48" cy="38" r="8" fill="white" />
            <circle cx="50" cy="37" r="4" fill="#2D2D2D" />
            <circle cx="51" cy="36" r="1.5" fill="white" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-2 tracking-widest" style={{ color: "#1a1a1a" }}>
          だいべんしゃ
        </h1>
        <p className="text-sm" style={{ color: "#9CA3AF", letterSpacing: "0.03em" }}>
          うまく言えない気持ちを、いっしょに整えるAI
        </p>
      </div>

      {/* Input card */}
      <div className="w-full max-w-md animate-fade-in-up" style={{ animationDelay: "0.12s", opacity: 0 }}>
        <div className="rounded-3xl p-6"
          style={{ background: "white", boxShadow: "0 8px 48px rgba(0,0,0,0.07)" }}>

          <p className="text-xs mb-4" style={{ color: "#9CA3AF", lineHeight: "1.6" }}>
            まとまっていなくて大丈夫。<br />今、気になっていることをそのまま書いてね。
          </p>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleStart(); } }}
            placeholder="例：お腹空いた。何食べよう"
            rows={3}
            className="w-full px-4 py-3 text-sm resize-none focus:outline-none transition-all"
            style={{
              background: "#FAFAFA",
              borderRadius: "16px",
              border: `1.5px solid ${input ? "#F5C842" : "transparent"}`,
              fontFamily: "'M PLUS Rounded 1c', sans-serif",
              color: "#1a1a1a",
              lineHeight: "1.7",
              boxShadow: input ? "0 0 0 3px rgba(245,200,66,0.1)" : "none",
            }}
          />

          <button
            onClick={handleStart}
            disabled={!input.trim()}
            className="mt-4 w-full py-3.5 text-sm font-bold tracking-wide transition-all"
            style={{
              borderRadius: "16px",
              background: input.trim()
                ? "linear-gradient(135deg, #F5C842 0%, #4AABE8 100%)"
                : "#F3F4F6",
              color: input.trim() ? "white" : "#9CA3AF",
              cursor: input.trim() ? "pointer" : "not-allowed",
              boxShadow: input.trim() ? "0 4px 24px rgba(245,200,66,0.3)" : "none",
            }}>
            整理をはじめる →
          </button>
        </div>

        {/* Examples */}
        <div className="mt-5">
          <p className="text-center text-xs mb-3" style={{ color: "#C4C4C4" }}>
            こんなことでも使えます
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {examples.map((ex) => (
              <button
                key={ex}
                onClick={() => setInput(ex)}
                className="text-xs px-3.5 py-2 rounded-full transition-all hover:shadow-sm"
                style={{
                  background: "white",
                  border: "1.5px solid #F0F0F0",
                  color: "#6B7280",
                  fontFamily: "'M PLUS Rounded 1c', sans-serif",
                }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Free notice */}
      <p className="mt-10 text-xs" style={{ color: "#D1D5DB" }}>
        無料で1日3回まで使えます
      </p>
    </main>
  );
}
