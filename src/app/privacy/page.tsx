import { PageShell } from "../ui";

export default function PrivacyPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-12 py-4 sm:py-8">
        <header className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-sm text-[color:var(--color-foreground)]/58">Last updated: February 2026</p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We wrote this to be readable. If something is unclear, email us at{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>{" "}
            and we will explain it plainly.
          </p>
        </header>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            The short version
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We collect as little as possible.
            <br />
            We never sell your data.
            <br />
            We never show ads.
            <br />
            Kids under 13 can use the app without creating an account.
            <br />
            If you create an account, we store only what we need to make the app work.
            <br />
            You can ask us to delete your data at any time.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Who we are
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses is operated by Quiet Branches Labs, a small product studio based in New
            York. You can reach us at{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>
            .
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            What we collect
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Without an account:
            <br />
            You can take tiny pauses without signing in. We do not collect any personal
            information. Session data stays on your device.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            With an account:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-base leading-8 text-[color:var(--color-foreground)]/88">
            <li>Your email address (for sign in)</li>
            <li>Your display name or your child&apos;s name (if you provide one)</li>
            <li>The moments you complete -- category, prompt, and mood</li>
            <li>The anchor moment you set during onboarding (if you set one)</li>
          </ul>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We do not collect your location, device information, or behavioral data beyond what is
            listed above.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            How we use it
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Only to make the app work:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-base leading-8 text-[color:var(--color-foreground)]/88">
            <li>To save your tiny pauses and show them in your dashboard</li>
            <li>To personalize your greeting</li>
            <li>To send sign-in emails when you request them</li>
          </ul>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We do not use your information for advertising. We do not build profiles. We do not
            share your data with third parties for marketing purposes.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Kids and COPPA
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses is designed for kids 9-12 and their families.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Kids can use the full session experience without an account. No personal information is
            collected from anonymous users.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            If a parent creates an account on behalf of their child, the parent is the account
            holder.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We do not knowingly collect personal information from children under 13 without
            verifiable parental consent. If you believe we have inadvertently collected information
            from a child under 13 without consent, contact us at{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>{" "}
            and we will delete it promptly.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Data storage
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Your data is stored securely using Supabase. Data is encrypted in transit and at rest.
            We do not store payment information -- Tiny Pauses is currently free.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Your rights
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            You can ask us to tell you what data we have, correct inaccurate data, or delete your
            account and all associated data. Email{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>
            . We will respond within 7 days.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Cookies and tracking
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We use a minimal session cookie to keep you signed in. We do not use advertising
            cookies, tracking pixels, or third-party analytics that identify individual users.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Changes to this policy
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            If we make meaningful changes we will update the date at the top and note what
            changed. We will not quietly expand what we collect or how we use it.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Contact
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Questions about privacy? Email{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>
            . We read everything.
          </p>
        </section>
      </article>
    </PageShell>
  );
}
