"use client";

// Root-layout failures cannot rely on the root layout, styles or UI providers.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Arial, sans-serif", margin: 0 }}>
        <main
          role="alert"
          style={{ maxWidth: 520, margin: "15vh auto", padding: 24 }}
        >
          <h1>Something went wrong.</h1>
          <p>The application could not load. Please try again.</p>
          {error.digest && <p>Reference: {error.digest}</p>}
          <button
            onClick={retry}
            style={{ padding: "12px 20px", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
