"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Layers2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi, DEMO_MODE, errorMessage } from "@/lib/api";
export function AuthForm({ register = false }: { register?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [visible, setVisible] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password"));
    if (register && new TextEncoder().encode(password).length > 72) {
      setError("Password must be at most 72 UTF-8 bytes.");
      setBusy(false);
      return;
    }
    try {
      if (register)
        await authApi.register(
          String(data.get("name")).trim(),
          String(data.get("email")).trim(),
          password,
        );
      else await authApi.login(String(data.get("email")).trim(), password);
      router.replace("/");
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }
  return (
    <main className="auth-page">
      <section className="auth-story">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Layers2 size={21} />
          </span>
          dayflow<span className="brand-dot">.</span>
        </Link>
        <div>
          <span className="eyebrow">LESS NOISE. MORE FOCUS.</span>
          <h1>
            Big things start
            <br />
            with small steps<span>.</span>
          </h1>
          <p>
            A clear mind begins with a clear plan. Make a little space for what
            matters today.
          </p>
          <div className="sample-note">
            <span className="note-check">
              <Check size={16} />
            </span>
            <div>
              Take the first step<small>You’re already on your way.</small>
            </div>
            <span className="note-star">✳</span>
          </div>
        </div>
        <span className="story-footer">
          Your day, a little more intentional.
        </span>
      </section>
      <section className="auth-panel">
        <div className="auth-box">
          <span className="eyebrow">YOUR PERSONAL WORKSPACE</span>
          <h2>{register ? "A fresh start." : "Welcome back."}</h2>
          <p>
            {register
              ? "Make space for your ideas. Create your account."
              : "Your next small win is waiting for you."}
          </p>
          {DEMO_MODE && (
            <div className="demo-notice">
              Demo mode · Use any valid email and password. No real
              authentication; passwords are never saved.
            </div>
          )}
          <form onSubmit={submit}>
            {register && (
              <label>
                Full name
                <Input
                  name="name"
                  placeholder="Alex Morgan"
                  minLength={2}
                  maxLength={80}
                  required
                  autoComplete="name"
                />
              </label>
            )}
            <label>
              Email address
              <Input
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              Password
              <div className="password-wrap">
                <Input
                  name="password"
                  type={visible ? "text" : "password"}
                  placeholder={
                    register ? "At least 8 characters" : "Enter your password"
                  }
                  minLength={register ? 8 : 1}
                  required
                  autoComplete={register ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  aria-label={visible ? "Hide password" : "Show password"}
                >
                  {visible ? "Hide" : "Show"}
                </button>
              </div>
            </label>
            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}
            <Button type="submit" className="auth-submit" disabled={busy}>
              {busy ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <>
                  {register ? "Create account" : "Sign in"}
                  <ArrowRight size={17} />
                </>
              )}
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Dayflow?"}{" "}
            <Link href={register ? "/login" : "/register"}>
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          <div className="auth-footnote">
            <span />A little more organized. A little more you.
          </div>
        </div>
      </section>
    </main>
  );
}
