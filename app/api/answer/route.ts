import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DANGER_CHECK_PROMPT = `以下の内容が、自傷・他害・違法行為・差別・いじめを助長する回答になっていないか確認してください。
問題があれば "UNSAFE" とだけ返してください。問題なければ "SAFE" とだけ返してください。`;

export async function POST(req: NextRequest) {
  const { input, answers = [] } = await req.json();

  const context = `最初の相談: ${input}\n収集した情報: ${answers.join(" / ")}`;

  // Safety pre-check
  const safetyCheck = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DANGER_CHECK_PROMPT },
      { role: "user", content: context },
    ],
    max_tokens: 10,
  });

  const safetyResult = safetyCheck.choices[0].message.content?.trim();
  if (safetyResult === "UNSAFE") {
    return NextResponse.json({
      safety: true,
      message: "この内容については、より適切な相談先をおすすめします。よりそいホットライン（0120-279-338）にご連絡ください。",
    });
  }

  // Generate answer with gpt-4o (using best available model)
  const systemPrompt = `あなたは「だいべんしゃ」です。ユーザーの相談内容と収集した情報をもとに、
以下の4つの視点で回答をJSON形式で返してください。

{
  "situation": "今の状況の整理（2〜3文）",
  "desire": "本当は何を望んでいるかの仮説（2〜3文）",
  "avoid": "今すぐしない方がよいこと（1〜2文）",
  "suggestion": "代わりの言い方・行動の提案（2〜3文）",
  "prompt": "この内容をChatGPTに聞くなら使える、整理されたプロンプト文（100〜150字）"
}

ルール：
- やわらかく、押しつけがましくない言葉で
- 断言しすぎない（〜かもしれません、〜はどうでしょう）
- 感情に寄り添う
- 危険・攻撃・他害を助長しない
- JSONのみ返す（説明文不要）`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: context },
    ],
    max_tokens: 600,
    temperature: 0.6,
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0].message.content || "{}";
  const result = JSON.parse(raw);

  return NextResponse.json({ result });
}
