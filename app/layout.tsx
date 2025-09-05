import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliCommit - AI-Powered Git Commit Messages",
  description: "Transform your git diffs into professional, conventional commit messages in seconds with the power of artificial intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
