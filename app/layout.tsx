// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { GoalsProvider } from "@/components/GoalsContext";
import { CustomizationProvider } from "@/components/CustomizationContext";
import { ThemeProvider } from "@/components/ThemeContext";
import SessionProvider from "@/components/SessionProvider";

export const metadata: Metadata = {
  title: "Focus.One",
  description: "Personal roadmap & goals",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-neutral-950 text-neutral-100">
        <SessionProvider>
          <ThemeProvider>
            <CustomizationProvider>
              <GoalsProvider>{children}</GoalsProvider>
            </CustomizationProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
