"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function AppNav() {
  const [signedIn, setSignedIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(!supabase);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) return;
    const client = supabase;

    async function loadUser() {
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!isMounted) return;
      setSignedIn(Boolean(user));
      setAuthResolved(true);
    }

    loadUser();

    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setSignedIn(Boolean(session?.user));
        setAuthResolved(true);
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
    setSignedIn(false);
    window.location.href = "/";
  }

  return (
    <nav className="w-full border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)]/72 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand/LogoText.png"
              alt="Tiny Pauses"
              width={400}
              height={100}
              priority
              className="h-6 w-auto"
            />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
          <Link
            href="/for-classrooms"
            className="px-2 py-1.5 text-[color:var(--color-primary)]/80 hover:text-[color:var(--color-primary)]"
          >
            For classrooms
          </Link>
          <Link
            href="/session"
            className="rounded-full border border-[color:var(--color-border-subtle)] px-3 py-1.5 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
          >
            {authResolved && signedIn ? "Take a pause" : "Try now"}
          </Link>
          {!authResolved ? (
            <span className="inline-flex h-[30px] w-[128px] animate-pulse rounded-full bg-[color:var(--color-surface-soft)]" />
          ) : signedIn ? (
            <>
              <Link
                href="/dashboard"
                title="Go to your dashboard"
                className="rounded-full bg-[color:var(--color-accent-soft)] px-3 py-1.5 text-[color:var(--color-ink-on-accent-soft)] transition hover:bg-[color:var(--color-accent-soft)]/70"
              >
                Your pauses
              </Link>
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
