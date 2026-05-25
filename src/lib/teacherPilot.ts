// Pure helpers for the teacher-pilot signup form. Kept framework-agnostic so
// they can be unit tested and shared by the client form and the API route.

export type TeacherPilotInput = {
  email?: string;
  name?: string;
  grade?: string;
  classSize?: string;
  setting?: string;
  useCase?: string;
  notes?: string;
};

// Deliberately simple and linear (no backtracking) to avoid catastrophic
// regex behavior. Good enough to catch obvious typos, not RFC-complete.
export function isLikelyEmail(value: string | undefined | null): boolean {
  const v = (value ?? "").trim();
  if (v.length === 0 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

// Turns the structured fields into a labeled plain-text block for the email
// body. Only non-empty fields are included, and email always leads.
export function formatTeacherPilotMessage(input: TeacherPilotInput): string {
  const rows: Array<[string, string | undefined]> = [
    ["Email", input.email],
    ["Name", input.name],
    ["Grade(s) taught", input.grade],
    ["Class size", input.classSize],
    ["School or setting", input.setting],
    ["When they would use it", input.useCase],
    ["Anything else", input.notes],
  ];

  const lines = rows
    .map(([label, value]) => [label, (value ?? "").trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`);

  return ["Teacher pilot signup", "", ...lines].join("\n");
}
