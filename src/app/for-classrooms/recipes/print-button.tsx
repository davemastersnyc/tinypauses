"use client";

export function PrintButton({ label = "Print these cards" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-[var(--radius-pill)] bg-[#0e8a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(14,138,138,0.24)] transition hover:bg-[#0b7575] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0e8a8a] focus-visible:ring-offset-2"
    >
      {label}
    </button>
  );
}
