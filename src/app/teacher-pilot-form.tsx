"use client";

import { useId, useState } from "react";
import { BrandButton } from "./ui";
import {
  formatTeacherPilotMessage,
  isLikelyEmail,
  type TeacherPilotInput,
} from "@/lib/teacherPilot";

type PilotStatus = "idle" | "sending" | "success" | "error";

const EMPTY: TeacherPilotInput = {
  email: "",
  name: "",
  grade: "",
  classSize: "",
  setting: "",
  useCase: "",
  notes: "",
};

const inputClass =
  "w-full rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-primary)] shadow-sm outline-none placeholder:text-[color:var(--color-foreground)]/40 focus:border-[color:var(--color-accent)] focus:ring-2 focus:ring-[color:var(--color-accent-soft)]";

const labelClass =
  "mb-1 block text-xs font-medium text-[color:var(--color-foreground)]/70";

export function TeacherPilotForm({
  label = "Join the teacher pilot",
}: {
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TeacherPilotInput>(EMPTY);
  const [status, setStatus] = useState<PilotStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fieldId = useId();

  const emailValid = isLikelyEmail(form.email);

  function set<K extends keyof TeacherPilotInput>(
    key: K,
    value: TeacherPilotInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function closeModal() {
    setOpen(false);
    setForm(EMPTY);
    setStatus("idle");
    setErrorMsg("");
  }

  async function submit() {
    if (!emailValid) {
      setErrorMsg("Please add an email so we can bring you in.");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Tiny Pauses teacher pilot",
          replyTo: (form.email ?? "").trim(),
          message: formatTeacherPilotMessage(form),
        }),
      });
      if (!response.ok) throw new Error("Failed to submit");
      setStatus("success");
      window.setTimeout(closeModal, 1800);
    } catch (error) {
      console.error("Teacher pilot submit failed", error);
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <BrandButton variant="primary" onClick={() => setOpen(true)}>
        {label}
      </BrandButton>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/45 px-4 py-8">
          <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
            <p className="text-base font-semibold text-[color:var(--color-primary)]">
              Join the teacher pilot
            </p>
            <p className="mt-1 mb-4 text-sm leading-relaxed text-[color:var(--color-foreground)]/72">
              Tell us a little about your room. Only email is required; the rest
              helps us build the right thing.
            </p>

            <div className="space-y-3">
              <div>
                <label htmlFor={`${fieldId}-email`} className={labelClass}>
                  Your email
                </label>
                <input
                  id={`${fieldId}-email`}
                  type="email"
                  required
                  value={form.email}
                  onChange={(event) => set("email", event.target.value)}
                  className={inputClass}
                  placeholder="you@school.org"
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-name`} className={labelClass}>
                  Your name <span className="font-normal">(optional)</span>
                </label>
                <input
                  id={`${fieldId}-name`}
                  type="text"
                  value={form.name}
                  onChange={(event) => set("name", event.target.value)}
                  className={inputClass}
                  placeholder="What should we call you?"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${fieldId}-grade`} className={labelClass}>
                    Grade(s) you teach
                  </label>
                  <input
                    id={`${fieldId}-grade`}
                    type="text"
                    value={form.grade}
                    onChange={(event) => set("grade", event.target.value)}
                    className={inputClass}
                    placeholder="e.g. 5th"
                  />
                </div>
                <div>
                  <label htmlFor={`${fieldId}-size`} className={labelClass}>
                    Class size
                  </label>
                  <input
                    id={`${fieldId}-size`}
                    type="text"
                    inputMode="numeric"
                    value={form.classSize}
                    onChange={(event) => set("classSize", event.target.value)}
                    className={inputClass}
                    placeholder="e.g. 26"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${fieldId}-setting`} className={labelClass}>
                  School or setting
                </label>
                <input
                  id={`${fieldId}-setting`}
                  type="text"
                  value={form.setting}
                  onChange={(event) => set("setting", event.target.value)}
                  className={inputClass}
                  placeholder="Public, private, homeschool co-op..."
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-use`} className={labelClass}>
                  When would you use it?
                </label>
                <textarea
                  id={`${fieldId}-use`}
                  rows={2}
                  value={form.useCase}
                  onChange={(event) => set("useCase", event.target.value)}
                  className={inputClass}
                  placeholder="After recess, before tests, noisy transitions..."
                />
              </div>

              <div>
                <label htmlFor={`${fieldId}-notes`} className={labelClass}>
                  Anything else <span className="font-normal">(optional)</span>
                </label>
                <textarea
                  id={`${fieldId}-notes`}
                  rows={2}
                  value={form.notes}
                  onChange={(event) => set("notes", event.target.value)}
                  className={inputClass}
                  placeholder="A question, a constraint, anything."
                />
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-[color:var(--color-foreground)]/55">
              Please do not include student names or private student
              information. We only need classroom-level detail.
            </p>

            {status === "success" && (
              <p className="mt-3 text-xs text-[color:var(--color-primary)]/75">
                Thanks. We will email you about the classroom pilot. We only ask
                about classroom-level needs, never student information.
              </p>
            )}
            {status === "error" && errorMsg && (
              <p className="mt-3 text-xs text-red-600">{errorMsg}</p>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-[var(--radius-pill)] border border-[color:var(--color-border-subtle)] px-4 py-2 text-xs font-medium text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={status === "sending" || status === "success"}
                className="rounded-[var(--radius-pill)] bg-[color:var(--color-accent)] px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[color:var(--color-accent)]/90 disabled:cursor-not-allowed disabled:bg-[color:var(--color-accent)]/45"
              >
                {status === "sending" ? "Sending..." : "Send it"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
