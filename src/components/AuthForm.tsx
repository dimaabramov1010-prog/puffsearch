import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import puffer from "@/assets/puffer.png";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      navigate({ to: "/" });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      if (data.session) navigate({ to: "/" });
      else setMsg("Check your email to confirm your account, then log in.");
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return setMsg("Google sign-in failed. Try again.");
    if (r.redirected) return;
    navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ocean px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_8px_40px_oklch(0_0_0/0.35)]">
        <img src={puffer} alt="" width={80} height={80} className="animate-bob mx-auto h-20 w-20" />
        <h1 className="font-display mt-3 text-center text-3xl font-bold text-foreground">
          {isLogin ? "Welcome back" : "Join PuffSearch"}
        </h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" aria-label="Email"
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-foreground outline-none focus:border-ring" />
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" aria-label="Password"
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-foreground outline-none focus:border-ring" />
          <button type="submit" disabled={busy}
            className="w-full rounded-md bg-primary py-2 font-display font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {busy ? "One moment…" : isLogin ? "Log in" : "Sign up"}
          </button>
        </form>
        <button onClick={google} className="mt-3 w-full rounded-md border border-border py-2 text-sm text-foreground hover:bg-secondary">
          Continue with Google
        </button>
        {msg && <p className="mt-4 text-center text-sm text-muted-foreground" role="alert">{msg}</p>}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "No account? " : "Already have one? "}
          <Link to={isLogin ? "/signup" : "/login"} className="text-primary hover:underline">
            {isLogin ? "Sign up" : "Log in"}
          </Link>
        </p>
        <p className="mt-2 text-center text-sm"><Link to="/" className="text-muted-foreground hover:text-foreground">← Back to search</Link></p>
      </div>
    </div>
  );
}
