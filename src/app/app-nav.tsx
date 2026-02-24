"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AuthState = {
  label: string | null;
  signedIn: boolean;
};

export function AppNav() {
  const [authState, setAuthState] = useState<AuthState>({
    label: null,
    signedIn: false,
  });

  useEffect(() => {
    let isMounted = true;

    if (!supabase) return;
    const client = supabase;

    async function getDisplayLabel(user: { id: string; email?: string | null }) {
      const { data: profile } = await client
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.nickname) return profile.nickname as string;
      return user.email ?? "Signed in";
    }

    async function loadUser() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!isMounted) return;

      const label = user ? await getDisplayLabel(user) : null;
      setAuthState({
        label,
        signedIn: Boolean(user),
      });
    }

    loadUser();

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        async function syncSessionState() {
          if (!isMounted) return;
          const user = session?.user ?? null;
          const label = user ? await getDisplayLabel(user) : null;
          setAuthState({
            label,
            signedIn: Boolean(user),
          });
        }

        syncSessionState();
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
    setAuthState({ label: null, signedIn: false });
    window.location.href = "/";
  }

  return (
    <nav className="w-full border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)]/72 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-primary)]/95">
          <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--color-accent)]" />
          <Link href="/" className="hover:text-[color:var(--color-accent)]">
            Tiny Pause
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
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
            className="hidden rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)] sm:inline-flex"
          >
            Dashboard
          </Link>
          {authState.signedIn ? (
            <>
              <span
                title={authState.label ?? undefined}
                className="max-w-[16rem] truncate rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-[color:var(--color-ink-on-accent-soft)]"
              >
                {authState.label ? `Signed in: ${authState.label}` : "Signed in"}
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
      </div>
    </nav>
  );
}
