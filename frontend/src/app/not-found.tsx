import Link from "next/link";
export default function NotFound() {
  return (
    <main className="full-state">
      <h1>Page not found.</h1>
      <p>This page may have moved or no longer exists.</p>
      <Link href="/">Return to your workspace</Link>
    </main>
  );
}
