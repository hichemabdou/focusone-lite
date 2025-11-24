"use client";

import CleanBackground from "@/components/ui/CleanBackground";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">

      <div className="relative w-full max-w-md" style={{ zIndex: 1 }}>
        {/* Logo Section */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-2">
              {/* Simple Logo */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">1</span>
              </div>
              <h1 className="text-2xl font-bold text-white">
                Focus One
              </h1>
            </div>
          </Link>
          <p className="text-sm text-slate-400">Life Operations Center</p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-500">
          © 2025 Focus One. All rights reserved.
        </div>
      </div>
    </div>
  );
}
