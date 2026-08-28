"use client";

import { useEffect } from "react";
import { Planni } from "@/components/planni";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6 text-center">
      <Planni
        state="error"
        size={150}
        message="Ceva nu a mers cum trebuia. Încearcă din nou în câteva clipe."
      />
      <Button variant="outline" onClick={() => reset()}>
        Încearcă din nou
      </Button>
    </div>
  );
}
