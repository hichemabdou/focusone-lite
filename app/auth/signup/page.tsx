import SignupForm from "@/components/auth/SignupForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: 'flex', height: '64px', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-block',
            height: '32px',
            width: '32px',
            animation: 'spin 1s linear infinite',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTopColor: 'transparent'
          }} />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
