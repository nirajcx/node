"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="full-state" role="alert">
      <h1>We couldn’t load this page.</h1>
      <p>Please try again. Your saved tasks have not been removed.</p>
      {error.digest && <small>Reference: {error.digest}</small>}
      <Button onClick={retry}>Try again</Button>
      <Link href="/">Return to workspace</Link>
    </main>
  );
}
