"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthState = {
  email: string | null;
  signedIn: boolean;
};

export function AppNav() {
  const [authState, setAuthState] = useState<AuthState>({
    email: null,
    signedIn: false,
  });

  useEffect(() => {
    let isMounted = true;

    if (!supabase) return;
    const client = supabase;

    async function loadUser() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!isMounted) return;
      setAuthState({
        email: user?.email ?? null,
        signedIn: Boolean(user),
      });
    }

    loadUser();

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setAuthState({
          email: session?.user?.email ?? null,
          signedIn: Boolean(session?.user),
        });
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAuthState({ email: null, signedIn: false });
    window.location.href = "/";
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-primary)]">
        <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" />
        Practice
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Link
          href="/"
          className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
        >
          Home
        </Link>
        <Link
          href="/session"
          className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
        >
          Session
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
        >
          Dashboard
        </Link>
        {authState.signedIn ? (
          <>
            <span className="rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-[color:var(--color-ink-on-accent-soft)]">
              Signed in{authState.email ? `: ${authState.email}` : ""}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-[color:var(--color-accent)] px-3 py-1.5 font-semibold text-slate-900 hover:bg-orange-500"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
