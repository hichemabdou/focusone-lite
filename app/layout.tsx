// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { GoalsProvider } from "@/components/GoalsContext";
import { CustomizationProvider } from "@/components/CustomizationContext";
import { PreferencesProvider } from "@/components/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeContext";
import SessionProvider from "@/components/SessionProvider";
import ToastContainer from "@/components/Toast";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import LifeOpsNav from "@/components/LifeOpsNav";

export const metadata: Metadata = {
  title: "Life Ops Center - Focus.One",
  description: "Your comprehensive life management platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-neutral-950 text-neutral-100">
        <SessionProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <CustomizationProvider>
                <GoalsProvider>
                  <LifeOpsNav />
                  {children}
                  <ToastContainer />
                  <KeyboardShortcuts />
                </GoalsProvider>
              </CustomizationProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
