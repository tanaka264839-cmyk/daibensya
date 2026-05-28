"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Message = {
  role: "user" | "ai" | "system" | "safety";
  content: string;
  delay?: number;
};

type Phase = "interviewing" | "summarizing" | "answering" | "done" | "safety";

type AnswerResult = {
  situation: string;
  desire: string;
  avoid: string;
  suggestion: string;
  prompt: string;
};

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

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const startInterview = async (userInput: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: userInput, history: [] }),
      });
      const data = await res.json();

      if (data.safety) {
        setPhase("safety");
        addMessage({ role: "safety", content: data.message });
        return;
      }

      addMessage({ role: "ai", content: data.question });
      setAnswers([userInput]);
    } catch {
      addMessage({ role: "system", content: "エラーが起きました。もう一度試してみてね。" });
    } finally {
      setLoading(false);
    }
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

      if (data.safety) {
        setPhase("safety");
        addMessage({ role: "safety", content: data.message });
        return;
      }

      if (data.done) {
        setPhase("summarizing");
        addMessage({ role: "system", content: "だいぶ見えてきました。整理しています…" });
        await generateAnswer(newAnswers, messages.concat({ role: "user", content: userMsg }));
      } else {
        addMessage({ role: "ai", content: data.question });
      }
    } catch {
      addMessage({ role: "system", content: "エラーが起きました。もう一度試してみてね。" });
    } finally {
      setLoading(false);
    }
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

      if (data.safety) {
        setPhase("safety");
        addMessage({ role: "safety", content: data.message });
        return;
      }

      setAnswerResult(data.result);
      setPhase("done");
    } catch {
      addMessage({ role: "system", content: "回答の生成中にエラーが起きました。" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(160deg, #FDFCF7 0%, #FEF9EC 50%, #EFF8FF 100%)" }}>
      {/* Header */}
      <header className="sticky top-0 z-10 px-4 py-3 flex items-center gap-3"
        style={{ background: "rgba(253,252,247,0.9)", backdropFilter: "blur(8px)", borderBottom: "1px solid #F3F4F6" }}>
        <button onClick={() => router.push("/")} className="text-sm" style={{ color: "#9CA3AF" }}>← もどる</button>
        <div className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="38" fill="#F5C842" />
            <ellipse cx="52" cy="32" rx="14" ry="10" fill="#4AABE8" transform="rotate(-30 52 32)" />
            <circle cx="48" cy="38" r="8" fill="white" />
            <circle cx="50" cy="37" r="4" fill="#2D2D2D" />
            <circle cx="51" cy="36" r="1.5" fill="white" />
          </svg>
          <span className="font-bold text-base">だいべんしゃ</span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 px-4 py-6 space-y-4 max-w-lg mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "safety" ? (
              <div className="rounded-2xl p-4 max-w-sm text-sm"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}>
                <p className="font-bold mb-1">⚠️ ちょっと待って</p>
                <p>{msg.content}</p>
              </div>
            ) : msg.role === "system" ? (
              <div className="bubble-system px-4 py-2 text-sm max-w-xs text-center mx-auto">
                {msg.content}
              </div>
            ) : (
              <div className={`px-4 py-3 text-sm max-w-xs leading-relaxed ${msg.role === "user" ? "bubble-user" : "bubble-ai"}`}>
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bubble-ai px-4 py-3 text-sm">
              <span className="animate-pulse-soft">考えてるよ…</span>
            </div>
          </div>
        )}

        {/* Answer card */}
        {phase === "done" && answerResult && (
          <div className="animate-fade-in-up space-y-3 mt-4">
            <AnswerCard label="📋 今の状況" content={answerResult.situation} color="#EFF8FF" border="#BAE6FD" />
            <AnswerCard label="💛 本当はどうしたい？" content={answerResult.desire} color="#FEFCE8" border="#FDE68A" />
            <AnswerCard label="⚠️ 今すぐしない方がいいこと" content={answerResult.avoid} color="#FFF7ED" border="#FED7AA" />
            <AnswerCard label="✨ こんな言い方・行動はどう？" content={answerResult.suggestion} color="#F0FDF4" border="#BBF7D0" />

            <div className="mt-2">
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-xs px-4 py-2 rounded-full border transition-all"
                style={{ borderColor: "#E5E7EB", color: "#6B7280", background: "white" }}
              >
                {showPrompt ? "▲ プロンプトを隠す" : "📋 ChatGPT用プロンプトを見る"}
              </button>
              {showPrompt && (
                <div className="mt-2 p-4 rounded-2xl text-xs leading-relaxed" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#374151" }}>
                  <p className="font-bold mb-1 text-xs" style={{ color: "#6B7280" }}>このままChatGPTにコピペできます</p>
                  <p style={{ whiteSpace: "pre-wrap" }}>{answerResult.prompt}</p>
                  <button
                    onClick={() => navigator.clipboard.writeText(answerResult.prompt)}
                    className="mt-2 text-xs px-3 py-1 rounded-full"
                    style={{ background: "#F5C842", color: "white" }}
                  >
                    コピーする
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-2xl text-sm font-bold mt-2"
              style={{ background: "linear-gradient(135deg, #F5C842, #4AABE8)", color: "white" }}
            >
              もう一度つかう
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {(phase === "interviewing") && (
        <div className="sticky bottom-0 px-4 py-3"
          style={{ background: "rgba(253,252,247,0.95)", backdropFilter: "blur(8px)", borderTop: "1px solid #F3F4F6" }}>
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
              placeholder="返事をしてね…"
              className="flex-1 rounded-2xl border-2 px-4 py-2 text-sm focus:outline-none transition-all"
              style={{
                borderColor: input ? "#F5C842" : "#E5E7EB",
                fontFamily: "'M PLUS Rounded 1c', sans-serif",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="px-4 py-2 rounded-2xl text-sm font-bold transition-all"
              style={{
                background: input.trim() ? "linear-gradient(135deg, #F5C842, #4AABE8)" : "#E5E7EB",
                color: input.trim() ? "white" : "#9CA3AF",
              }}
            >
              送る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AnswerCard({ label, content, color, border }: { label: string; content: string; color: string; border: string }) {
  return (
    <div className="rounded-2xl p-4 text-sm leading-relaxed" style={{ background: color, border: `1px solid ${border}` }}>
      <p className="font-bold text-xs mb-1" style={{ color: "#6B7280" }}>{label}</p>
      <p style={{ whiteSpace: "pre-wrap" }}>{content}</p>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">読み込み中…</div>}>
      <ChatContent />
    </Suspense>
  );
}
