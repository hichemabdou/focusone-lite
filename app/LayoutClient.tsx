"use client";

import { usePathname } from "next/navigation";
import LifeOpsNav from "@/components/LifeOpsNav";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import ToastContainer from "@/components/Toast";
import CleanBackground from "@/components/ui/CleanBackground";

export default function LayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/auth");

  return (
    <>
      {!isAuthPage && <CleanBackground />}
      {!isAuthPage && <LifeOpsNav />}
      {children}
      <ToastContainer />
      {!isAuthPage && <KeyboardShortcuts />}
    </>
  );
}
