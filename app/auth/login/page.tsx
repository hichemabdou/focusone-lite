import LoginForm from "@/components/auth/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 w-full items-center justify-center">
          <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
