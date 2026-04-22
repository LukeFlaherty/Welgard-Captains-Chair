"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
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
    <main className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-6">
      <p className="text-7xl font-bold tracking-tighter text-destructive">!</p>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        {error.message ?? "An unexpected error occurred."}
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
