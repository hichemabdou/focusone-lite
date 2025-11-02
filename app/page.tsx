// app/page.tsx (Server Component)
import { redirect } from "next/navigation";

export default function Home() {
  // Send the root to the classic layout for now
  redirect("/classic");
}
