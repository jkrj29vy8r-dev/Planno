import { Planni } from "@/components/planni";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Planni state="loading" size={140} message="Se încarcă..." />
    </div>
  );
}
