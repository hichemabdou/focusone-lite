// app/classic/page.tsx
import ClassicClient from "./ClassicClient";
import PageTransition from "@/components/PageTransition";

export default function ClassicPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-neutral-950 text-neutral-100">
        <ClassicClient />
      </main>
    </PageTransition>
  );
}
