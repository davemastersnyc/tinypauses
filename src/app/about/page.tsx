import { PageShell } from "../ui";

export default function AboutPage() {
  return (
    <PageShell maxWidth="md">
      <article className="mx-auto w-full max-w-2xl space-y-12 py-4 sm:py-8">
        <section className="space-y-5">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--color-primary)] sm:text-4xl">
            Why we built this
          </h1>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            My son and I both needed to get better at pausing.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Not meditating. Not journaling. Not committing to a daily practice. Just stopping
            for a moment. Noticing how we felt. Taking a breath before moving on to the next
            thing.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            Everything we tried was either too much -- too long, too guided, too much to set up
            -- or designed for a completely different age group. My son is in that in-between
            zone where little-kid apps feel insulting and adult apps feel irrelevant.
          </p>
          <p className="text-base leading-8 text-[color:var(--color-foreground)]/88">
            So I built something for both of us.
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
            Brain Break mode came directly from my son. He described what he does at school when
            things feel like too much -- movement first, pressure, then breath. I built what he
            described. Turns out it closely mirrors what occupational therapists have known for
            years about somatic regulation. He is, genuinely, the best product collaborator I have
            ever worked with.
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
            Tiny Pauses is built and maintained by Dave Masters at Quiet Branches Labs, a small
            product studio based in New York.
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
