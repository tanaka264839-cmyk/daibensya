import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SAFETY_KEYWORDS = [
  "死にたい", "死ぬ", "殺す", "自殺", "自傷", "血が出",
  "包丁", "薬を飲んだ", "今から死", "消えたい", "暴力を受けて",
  "殴られた", "性被害", "家に帰れない", "助けて", "逃げられない"
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

  const systemPrompt = `あなたは「だいべんしゃ」というAIアシスタントです。
ユーザーの相談を聞いて、5W2H（いつ・どこ・誰・何・なぜ・どうやって・いくら）と
感情(Emotion)・目的(Purpose)・リスク(Risk)・ゴール(Goal)の軸で、
まだ聞けていない重要な情報があれば一問だけ質問してください。

【終了判断ルール】
以下の条件が全て揃ったら {"done": true} だけを返す：
- 状況の基本事実（何が起きているか）が分かっている
- ユーザーが何を感じているかが分かっている  
- ユーザーが本当は何を望んでいるかが分かっている
- 今すぐ行動すべき緊急性があるかどうかが分かっている

まだ重要な情報が足りない場合は {"question": "質問文"} を返す。

【質問のルール】
- 必ず一問だけ
- やわらかく親しみやすい言葉（ですます調・ティーン向け）
- 自然な会話の流れを大切に
- 相手の返答の内容に必ず反応してから次の質問をする
- 「なんだ」「何？」のような聞き返しには、まず共感してから深掘りする
- すでに分かっていることは聞き直さない
- 最大7問まで。7問答えたら必ず {"done": true} を返す

これまでの回答数: ${answers.length - 1}問
これまでの回答: ${answers.join(" / ")}

必ずJSONのみ返す。説明文不要。`;

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
    max_tokens: 200,
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const data = JSON.parse(raw);

  if (data.done) {
    return NextResponse.json({ done: true });
  }

  return NextResponse.json({ question: data.question, done: false });
}
