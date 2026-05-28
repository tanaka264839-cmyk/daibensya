import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SAFETY_KEYWORDS = [
  "死にたい", "死ぬ", "殺す", "自殺", "自傷", "血が出", "包丁", "薬を飲んだ",
  "今から死", "消えたい", "暴力を受けて", "殴られた", "性被害", "家に帰れない",
  "助けて", "逃げられない"
];

const SAFETY_MESSAGE = `これは一人で整理するより、今すぐ安全を確認した方がよい内容かもしれません。

もし今すぐ危険な状況なら、以下に連絡してみてね：
📞 よりそいホットライン：0120-279-338（24時間）
📞 子ども家庭110番：0120-189-783
📞 いのちの電話：0570-783-556

話せる大人が近くにいるなら、その人に声をかけてみてね。`;

export async function POST(req: NextRequest) {
  const { input, history = [], answers = [] } = await req.json();

  // Safety check
  const allText = [input, ...answers].join(" ");
  const isSafety = SAFETY_KEYWORDS.some((kw) => allText.includes(kw));
  if (isSafety) {
    return NextResponse.json({ safety: true, message: SAFETY_MESSAGE });
  }

  const questionCount = history.filter((m: { role: string }) => m.role === "ai").length;

  // After 4-5 questions, signal done
  if (questionCount >= 4) {
    return NextResponse.json({ done: true });
  }

  const systemPrompt = `あなたは「だいべんしゃ」というAIアシスタントです。
ユーザーの相談を聞いて、5W2H（いつ・どこ・誰・何・なぜ・どうやって・いくら）と
感情(Emotion)・目的(Purpose)・リスク(Risk)・ゴール(Goal)の軸で、
まだ聞けていない情報を一問だけ質問してください。

ルール：
- 必ず一問だけ聞く
- やわらかく、親しみやすい言葉で（ですます調・ティーン向け）
- 尋問にならないよう、自然な会話のように
- 答えやすい質問にする
- すでに聞いた情報は聞き直さない

これまでの回答: ${answers.join(" / ")}`;

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: input },
    ...history.map((m: { role: string; content: string }) => ({
      role: m.role === "ai" ? "assistant" as const : "user" as const,
      content: m.content,
    })),
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    max_tokens: 150,
    temperature: 0.7,
  });

  const question = response.choices[0].message.content || "もう少し教えてもらえる？";
  return NextResponse.json({ question, done: false });
}
