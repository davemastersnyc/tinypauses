"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandCard, BrandPill, PageShell } from "../../ui";

const pendingMomentKey = "pending_moment";
const pendingMomentSavedKey = "tinyPauses.pendingMomentSaved";

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
      const client = supabase;

      try {
        const code = searchParams.get("code");
        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");

        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type) {
          const { error } = await client.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as "email" | "signup" | "magiclink" | "recovery",
          });
          if (error) throw error;
        }

        const {
          data: { user },
        } = await client.auth.getUser();

        if (!user) {
          setStatus("Sign-in link expired. Please request a new one.");
          router.replace("/login");
          return;
        }

        async function persistPendingMomentIfAny(userId: string) {
          if (typeof window === "undefined") return false;
          const raw = window.localStorage.getItem(pendingMomentKey);
          if (!raw) return false;
          const parsed = JSON.parse(raw) as {
            prompt_name?: string;
            category?: string;
            mood_value?: number | null;
            created_at?: string;
          };
          await client.from("moments").insert({
            user_id: userId,
            created_at: parsed.created_at ?? new Date().toISOString(),
            category: parsed.category ?? "Mindful moment",
            prompt_name: parsed.prompt_name ?? "Tiny pause",
            mood_value:
              typeof parsed.mood_value === "number" ? parsed.mood_value : null,
            card_type: "moment",
          });
          window.localStorage.removeItem(pendingMomentKey);
          window.sessionStorage.setItem(pendingMomentSavedKey, "1");
          return true;
        }

        const { data: profile } = await client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          await client.from("profiles").upsert(
            {
              id: user.id,
            },
            { onConflict: "id" },
          );
        }

        await persistPendingMomentIfAny(user.id);
        const onboardingComplete = Boolean(profile?.onboarding_complete);

        setStatus("Signed in. Redirecting...");
        router.replace(onboardingComplete ? "/dashboard" : "/onboarding");
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
