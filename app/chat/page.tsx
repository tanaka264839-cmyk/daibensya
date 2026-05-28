"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Message = {
  role: "user" | "ai" | "system" | "safety";
  content: string;
};

type Phase = "interviewing" | "summarizing" | "done" | "safety";

type AnswerResult = {
  situation: string;
  desire: string;
  avoid: string;
  suggestion: string;
  prompt: string;
};

function FishLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="38" fill="#F5C842" />
      <ellipse cx="52" cy="32" rx="14" ry="10" fill="#4AABE8" transform="rotate(-30 52 32)" />
      <circle cx="48" cy="38" r="8" fill="white" />
      <circle cx="50" cy="37" r="4" fill="#2D2D2D" />
      <circle cx="51" cy="36" r="1.5" fill="white" />
    </svg>
  );
}

function ChatContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") || "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>("interviewing");
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQ) {
      setMessages([{ role: "user", content: initialQ }]);
      startInterview(initialQ);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const addMessage = (msg: Message) => setMessages((prev) => [...prev, msg]);

  const startInterview = async (userInput: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput, history: [] }),
      });
      const data = await res.json();
      if (data.safety) { setPhase("safety"); addMessage({ role: "safety", content: data.message }); return; }
      addMessage({ role: "ai", content: data.question });
      setAnswers([userInput]);
    } catch {
      addMessage({ role: "system", content: "エラーが起きました。もう一度試してみてね。" });
    } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    addMessage({ role: "user", content: userMsg });
    const newAnswers = [...answers, userMsg];
    setAnswers(newAnswers);
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: initialQ,
          history: messages.concat({ role: "user", content: userMsg }),
          answers: newAnswers,
        }),
      });
      const data = await res.json();
      if (data.safety) { setPhase("safety"); addMessage({ role: "safety", content: data.message }); return; }
      if (data.done) {
        setPhase("summarizing");
        addMessage({ role: "system", content: "だいぶ見えてきました。整理しています…" });
        await generateAnswer(newAnswers, messages.concat({ role: "user", content: userMsg }));
      } else {
        addMessage({ role: "ai", content: data.question });
      }
    } catch {
      addMessage({ role: "system", content: "エラーが起きました。もう一度試してみてね。" });
    } finally { setLoading(false); }
  };

  const generateAnswer = async (allAnswers: string[], history: Message[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: initialQ, answers: allAnswers, history }),
      });
      const data = await res.json();
      if (data.safety) { setPhase("safety"); addMessage({ role: "safety", content: data.message }); return; }
      setAnswerResult(data.result);
      setPhase("done");
    } catch {
      addMessage({ role: "system", content: "回答の生成中にエラーが起きました。" });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(170deg, #FDFCF7 0%, #FEF9EC 60%, #F0F7FF 100%)" }}>

      {/* Header */}
      <header className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between"
        style={{ background: "rgba(253,252,247,0.85)", backdropFilter: "blur(12px)" }}>
        <button onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-60"
          style={{ color: "#9CA3AF" }}>
          <span>←</span><span>もどる</span>
        </button>
        <div className="flex items-center gap-2">
          <FishLogo size={26} />
          <span className="font-bold text-sm tracking-wide">だいべんしゃ</span>
        </div>
        <div style={{ width: 60 }} />
      </header>

      {/* Chat area */}
      <div className="flex-1 py-8 px-4">
        <div className="max-w-xl mx-auto space-y-5">
          {messages.map((msg, i) => (
            <div key={i} className={`flex animate-fade-in-up ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
              {msg.role === "safety" ? (
                <div className="max-w-sm rounded-3xl px-5 py-4 text-sm leading-relaxed"
                  style={{ background: "#FEF2F2", color: "#B91C1C" }}>
                  <p className="font-bold mb-2">⚠️ ちょっと待って</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
                </div>
              ) : msg.role === "system" ? (
                <div className="text-xs px-4 py-1.5 rounded-full"
                  style={{ background: "rgba(0,0,0,0.05)", color: "#9CA3AF" }}>
                  {msg.content}
                </div>
              ) : msg.role === "user" ? (
                <div className="max-w-xs px-5 py-3 text-sm leading-relaxed"
                  style={{ background: "#4AABE8", color: "white", borderRadius: "20px 20px 4px 20px" }}>
                  {msg.content}
                </div>
              ) : (
                <div className="flex items-end gap-2 max-w-xs">
                  <div style={{ flexShrink: 0 }}><FishLogo size={22} /></div>
                  <div className="px-5 py-3 text-sm leading-relaxed"
                    style={{ background: "#FFF8D6", color: "#2D2D2D", borderRadius: "20px 20px 20px 4px", boxShadow: "0 2px 12px rgba(245,200,66,0.15)" }}>
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex items-end gap-2 justify-start animate-fade-in-up">
              <FishLogo size={22} />
              <div className="px-5 py-3 text-sm"
                style={{ background: "#FFF8D6", borderRadius: "20px 20px 20px 4px" }}>
                <span className="animate-pulse-soft" style={{ color: "#9CA3AF" }}>…</span>
              </div>
            </div>
          )}

          {/* Answer */}
          {phase === "done" && answerResult && (
            <div className="animate-fade-in-up mt-6 space-y-1">

              {/* Section: 状況 */}
              <AnswerSection
                icon="📋"
                label="今の状況"
                content={answerResult.situation}
                accent="#4AABE8"
              />
              {/* Section: 望み */}
              <AnswerSection
                icon="💛"
                label="本当はどうしたい？"
                content={answerResult.desire}
                accent="#F5C842"
              />
              {/* Section: 避けること */}
              <AnswerSection
                icon="🌿"
                label="今すぐしない方がいいこと"
                content={answerResult.avoid}
                accent="#86EFAC"
              />
              {/* Section: 提案 */}
              <AnswerSection
                icon="✨"
                label="こんな言い方・行動はどう？"
                content={answerResult.suggestion}
                accent="#F5C842"
                highlight
              />

              {/* Prompt toggle */}
              <div className="pt-2">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ color: "#9CA3AF" }}>
                  {showPrompt ? "▲ プロンプトを隠す" : "ChatGPT用プロンプトを見る →"}
                </button>
                {showPrompt && (
                  <div className="mt-3 p-4 rounded-2xl text-xs leading-relaxed"
                    style={{ background: "#F9FAFB", color: "#6B7280" }}>
                    <p className="font-medium mb-2">このままChatGPTにコピペできます</p>
                    <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.8" }}>{answerResult.prompt}</p>
                    <button
                      onClick={() => navigator.clipboard.writeText(answerResult.prompt)}
                      className="mt-3 text-xs px-4 py-1.5 rounded-full font-medium transition-opacity hover:opacity-80"
                      style={{ background: "#F5C842", color: "white" }}>
                      コピーする
                    </button>
                  </div>
                )}
              </div>

              {/* Restart */}
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => router.push("/")}
                  className="px-8 py-3 rounded-full text-sm font-bold transition-all hover:opacity-90"
                  style={{
                    background: "linear-gradient(135deg, #F5C842 0%, #4AABE8 100%)",
                    color: "white",
                    boxShadow: "0 4px 20px rgba(245,200,66,0.3)"
                  }}>
                  もう一度つかう
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar */}
      {phase === "interviewing" && (
        <div className="sticky bottom-0 px-4 pb-6 pt-3"
          style={{ background: "rgba(253,252,247,0.9)", backdropFilter: "blur(12px)" }}>
          <div className="max-w-xl mx-auto flex gap-2 items-center">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="返事をしてね…"
              className="flex-1 px-5 py-3 text-sm focus:outline-none transition-all"
              style={{
                background: "white",
                borderRadius: "24px",
                border: `2px solid ${input ? "#F5C842" : "#E5E7EB"}`,
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
                boxShadow: input ? "0 0 0 3px rgba(245,200,66,0.1)" : "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all"
              style={{
                background: input.trim() ? "linear-gradient(135deg, #F5C842, #4AABE8)" : "#E5E7EB",
                color: input.trim() ? "white" : "#9CA3AF",
                flexShrink: 0,
                boxShadow: input.trim() ? "0 4px 12px rgba(245,200,66,0.3)" : "none",
              }}>
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnswerSection({
  icon, label, content, accent, highlight = false
}: {
  icon: string;
  label: string;
  content: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div className="py-5 px-1" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs font-bold tracking-wide" style={{ color: accent }}>{label}</span>
      </div>
      <p className="text-sm leading-relaxed pl-6"
        style={{
          color: highlight ? "#1a1a1a" : "#374151",
          fontWeight: highlight ? 500 : 400,
          whiteSpace: "pre-wrap",
        }}>
        {content}
      </p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <span style={{ color: "#9CA3AF", fontSize: 14 }}>読み込み中…</span>
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
