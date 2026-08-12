"use client";

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
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-gray-500">An unexpected error occurred while loading this page.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border px-4 py-2 text-sm font-medium"
      >
        Try again
      </button>
    </div>
  );
}
