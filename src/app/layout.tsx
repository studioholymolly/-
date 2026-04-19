import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사진 스튜디오",
  description: "스튜디오 클라이언트 협업 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-[#0f0f17] text-white flex flex-col">
        {children}
      </body>
    </html>
  );
}
