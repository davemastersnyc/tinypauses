type Testimonial = {
  quote: string;
  // Who said it, e.g. "Parent of a 10-year-old" or "5th-grade teacher".
  attribution: string;
};

// Drop real, permission-cleared quotes here. The whole section stays hidden
// while this array is empty, so it is safe to ship now and fill in later.
// Do not invent quotes. Example shape:
//   {
//     quote: "My daughter asks for her tiny pause before homework now.",
//     attribution: "Parent of a 10-year-old",
//   },
const testimonials: Testimonial[] = [];

export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section aria-labelledby="testimonials-heading" className="mt-4 space-y-5">
      <h2
        id="testimonials-heading"
        className="text-center text-sm font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/70"
      >
        What families are saying
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <figure
            key={index}
            className="rounded-[var(--radius-card)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-soft)]"
          >
            <blockquote className="text-sm leading-relaxed text-[color:var(--color-foreground)]/85">
              {`"${testimonial.quote}"`}
            </blockquote>
            <figcaption className="mt-3 text-xs font-medium text-[color:var(--color-foreground)]/60">
              {testimonial.attribution}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
