import { PageShell } from "../ui";

export default function AboutPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-12 py-4 sm:py-8">
        <section className="space-y-5">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            About Tiny Pauses
          </h1>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Why we built this
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We kept looking for something that would help kids actually slow down.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Not a full meditation practice. Not journaling. Not a daily commitment. Just a genuine
            moment to pause and reset -- something short enough to actually do, simple enough to
            not feel like homework.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Everything we found was either too much, or designed for a completely different age
            group. Kids 9-12 are in a funny in-between zone -- too old for little-kid apps, not
            quite ready for adult wellness tools. Nobody was really building for them.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            So we did.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses is two minutes. One prompt. One small action. No writing, no talking, no
            streaks, no guilt. Just a tiny pause -- and then back to your day.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Brain Break
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Brain Break mode came from watching what actually helps kids regulate when things feel
            like too much -- movement and pressure before breath work. It turns out this closely
            mirrors what occupational therapists have known for years about somatic regulation.
            Kids helped design it. The product is better for it.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Who it&apos;s for
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses is designed for kids 9-12. It&apos;s also genuinely useful for adults --
            parents, teachers, anyone who needs permission to take two minutes for themselves
            without it being a whole thing.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We built two paths through the app on purpose. Kids get a warm, simple experience
            designed around their world. Adults get the same core experience with framing that
            respects that they&apos;re not a child.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            What we believe
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We believe the best thing a mindfulness tool can do is get out of your way.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            No streaks. No shame. No next video autoplay. No algorithm deciding what you need. You
            take a tiny pause, you notice how you feel, and you go back to your life. The app is
            designed to end.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            We will never show ads. We will never sell data. We will never use engagement
            mechanics that exploit anxiety or guilt. That&apos;s not a policy -- it&apos;s just the
            only version of this product that makes sense to build.
          </p>
        </section>

        <section className="space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[color:var(--color-primary)]">
            Who made it
          </h2>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Tiny Pauses is built and maintained by Dave Masters at{" "}
            <a
              href="https://quietbrancheslabs.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              Quiet Branches Labs
            </a>
            , a small product studio based in New York.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Questions, feedback, or just want to say hi --{" "}
            <a
              href="mailto:hello@tinypauses.com"
              className="font-medium text-[color:var(--color-primary)] hover:text-[color:var(--color-accent)]"
            >
              hello@tinypauses.com
            </a>
          </p>
        </section>

        <p className="pt-2 text-sm leading-7 text-[color:var(--color-foreground)]/58">
          Tiny Pauses is not medical advice. It is a small, kind tool to help kids and adults
          pause and notice how they feel. If you or your child are experiencing mental health
          challenges, please reach out to a qualified professional.
        </p>
      </article>
    </PageShell>
  );
}
