"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandCard, BrandPill, PageShell } from "../../ui";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Finishing sign-in...");

  useEffect(() => {
    async function completeLogin() {
      if (!supabase) {
        setStatus("Sign-in is unavailable right now.");
        return;
      }

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "signup" | "magiclink" | "recovery",
          });
          if (error) throw error;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setStatus("Sign-in link expired. Please request a new one.");
          router.replace("/login");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          await supabase.from("profiles").upsert(
            {
              id: user.id,
            },
            { onConflict: "id" },
          );
        }

        const shouldSkipOnboarding = Boolean(
          profile?.onboarding_complete || profile?.adult_mode || profile?.nickname,
        );

        setStatus("Signed in. Redirecting...");
        router.replace(shouldSkipOnboarding ? "/dashboard" : "/onboarding");
      } catch (error) {
        console.error("Auth callback error", error);
        setStatus("Could not complete sign-in. Please try again.");
        router.replace("/login");
      }
    }

    completeLogin();
  }, [router, searchParams]);

  return (
    <PageShell maxWidth="sm">
      <header className="text-center">
        <BrandPill>Signing you in</BrandPill>
      </header>
      <BrandCard>
        <p className="text-sm text-[color:var(--color-primary)]">{status}</p>
      </BrandCard>
    </PageShell>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <PageShell maxWidth="sm">
          <header className="text-center">
            <BrandPill>Signing you in</BrandPill>
          </header>
          <BrandCard>
            <p className="text-sm text-[color:var(--color-primary)]">
              Finishing sign-in...
            </p>
          </BrandCard>
        </PageShell>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
