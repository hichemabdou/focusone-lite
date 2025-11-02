// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { GoalsProvider } from "@/components/GoalsContext";

export const metadata: Metadata = {
  title: "Focus.One",
  description: "Personal roadmap & goals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <GoalsProvider>{children}</GoalsProvider>
      </body>
    </html>
  );
}
