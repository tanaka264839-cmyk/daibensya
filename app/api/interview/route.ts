import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SAFETY_MESSAGE = `これは一人で整理するより、今すぐ安全を確認した方がよい内容かもしれません。

もし今すぐ危険な状況なら、以下に連絡してみてね：
📞 よりそいホットライン：0120-279-338（24時間）
📞 子ども家庭110番：0120-189-783
📞 いのちの電話：0570-783-556

話せる大人が近くにいるなら、その人に声をかけてみてね。`;

export async function POST(req: NextRequest) {
  const { input, history = [], answers = [] } = await req.json();

  // AIが答えた質問の数をhistoryから正確にカウント
  const aiQuestionCount = history.filter((m: { role: string }) => m.role === "ai").length;

  const systemPrompt = `あなたは「だいべんしゃ」というAIアシスタントです。
ユーザーの相談を聞いて、状況・感情・目的・ゴールを丁寧に深掘りしてください。

【安全判定】
以下に完全に該当する場合のみ {"safety": true} を返す：
- 今すぐ自分を傷つけようとしている
- 今すぐ他人を傷つけようとしている
- 今まさに暴力・性被害を受けている緊急状況

「帰りたい」「休みたい」「疲れた」「消えたい気がする」「死ぬほど疲れた」などの
日常的な表現・比喩・愚痴は安全と判断し、通常の問診を続けること。
曖昧な場合は必ず通常フローを続ける。

【終了判断 - これは厳守すること】
あなたがこれまでに行った質問の数: ${aiQuestionCount}回

ルール：
- ${aiQuestionCount}が4以下の場合：{"done": true}を返すことは絶対に禁止。必ず{"question": "..."}を返すこと
- ${aiQuestionCount}が5以上の場合：以下の4つが全て会話から確認できる場合のみ{"done": true}を返してよい
  1. 何が起きているか（状況の事実）が明確
  2. 今どんな気持ちか（感情）が明確
  3. 本当はどうしたいか（目的・ゴール）が明確
  4. 今すぐ行動が必要か（緊急性）が明確
- ${aiQuestionCount}が7以上の場合：必ず{"done": true}を返す

【質問のルール】
- 一問だけ返す
- やわらかく親しみやすい言葉（ですます調・ティーン向け）
- 相手の返答に必ず共感・反応してから次の質問
- 「なんだ」「何？」のような聞き返しには共感して深掘り
- すでに分かっていることは聞き直さない
- まだ聞けていない軸（感情・目的・緊急性・関係性・背景）を優先

これまでの回答: ${answers.join(" / ")}

返すJSONは以下のいずれか：
{"safety": true}
{"done": true}
{"question": "質問文"}

JSONのみ返す。説明文不要。`;

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

  if (data.safety) {
    return NextResponse.json({ safety: true, message: SAFETY_MESSAGE });
  }
  if (data.done) {
    return NextResponse.json({ done: true });
  }
  return NextResponse.json({ question: data.question, done: false });
}
