import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "だいべんしゃ | うまく言えない気持ちを、いっしょに整えるAI",
  description: "AIに聞く前に、あなたの問いを整えるアプリです。まとまっていない言葉でも大丈夫。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
