import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export function AccountButton() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user.email ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (!email)
    return (
      <Link to="/login" className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90">
        Log in
      </Link>
    );
  return (
    <button onClick={() => supabase.auth.signOut()} title={`Signed in as ${email}`}
      className="shrink-0 rounded-md border border-border px-3 py-1.5 text-xs text-foreground hover:bg-secondary">
      Log out
    </button>
  );
}
