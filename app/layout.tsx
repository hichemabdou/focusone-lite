import "./globals.css";
import type { Metadata } from "next";
import { GoalsProvider } from "@/components/GoalsContext";
import { CustomizationProvider } from "@/components/CustomizationContext";
import { PreferencesProvider } from "@/components/PreferencesContext";
import { ThemeProvider } from "@/components/ThemeContext";
import SessionProvider from "@/components/SessionProvider";
import LayoutClient from "./LayoutClient";

export const metadata: Metadata = {
  title: "Focus One Lite - Life Operations Center",
  description: "Premium life operations and goal management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-neutral-950 text-neutral-100">
        <SessionProvider>
          <ThemeProvider>
            <PreferencesProvider>
              <CustomizationProvider>
                <GoalsProvider>
                  <LayoutClient>{children}</LayoutClient>
                </GoalsProvider>
              </CustomizationProvider>
            </PreferencesProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
