"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BrandButton, BrandCard, PageShell } from "../ui";

type AdminView = "prompts" | "seasonal" | "weekly" | "brain-break" | "stats";
type PromptStatus = "active" | "inactive" | "draft";
type PromptKind = "pause" | "letting-go" | "reflect" | "kindness";
type PromptFilter = "all" | PromptKind;

type PromptRow = {
  id: string;
  kind: PromptKind;
  title: string;
  body: string;
  step: string;
  status: PromptStatus;
  internal_notes: string | null;
  created_at: string;
};

type BrainBreakStepRow = {
  id: string;
  step_number: number;
  instruction: string;
  updated_at: string;
};

type SeasonalWindowRow = {
  id: string;
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  accent_color: string;
  badge_label: string;
  nudge_copy: string;
  active: boolean;
};

type SpecialPromptStatus = "active" | "inactive" | "draft";
type SpecialPromptRow = {
  id: string;
  special_type: "seasonal" | "weekly";
  special_key: string;
  seasonal_window_key: string | null;
  name: string;
  body: string;
  tiny_step: string;
  rotation_order: number | null;
  status: SpecialPromptStatus;
  internal_notes: string | null;
  created_at: string;
};

type StatsModel = {
  activeByCategory: Array<{ label: string; count: number }>;
  byStatus: Array<{ label: string; count: number }>;
  totalMoments: number;
  totalBrainBreaks: number;
  totalUsers: number;
  mostUsedPrompt: { name: string; category: string; count: number } | null;
  leastUsedActivePrompt: { name: string; category: string; count: number } | null;
};

const categoryLabels: Record<PromptKind, string> = {
  pause: "Just a pause",
  "letting-go": "Letting go",
  reflect: "Reflecting on today",
  kindness: "Kindness",
};

const navItems: Array<{ id: AdminView; label: string }> = [
  { id: "prompts", label: "Prompts" },
  { id: "seasonal", label: "Seasonal Prompts" },
  { id: "weekly", label: "Weekly Prompts" },
  { id: "brain-break", label: "Brain Break Steps" },
  { id: "stats", label: "Stats" },
];

const defaultPromptForm: Omit<PromptRow, "id" | "created_at"> = {
  kind: "pause",
  title: "",
  body: "",
  step: "",
  status: "draft",
  internal_notes: "",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusClass(status: PromptStatus | SpecialPromptStatus) {
  if (status === "active") return "bg-emerald-100 text-emerald-800";
  if (status === "inactive") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-800";
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [view, setView] = useState<AdminView>("prompts");

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [promptFilter, setPromptFilter] = useState<PromptFilter>("all");
  const [promptSortBy, setPromptSortBy] = useState<
    "category" | "name" | "created" | "status"
  >("created");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [promptForm, setPromptForm] = useState(defaultPromptForm);
  const [savingPrompt, setSavingPrompt] = useState(false);

  const [seasonalWindows, setSeasonalWindows] = useState<SeasonalWindowRow[]>([]);
  const [seasonalPrompts, setSeasonalPrompts] = useState<SpecialPromptRow[]>([]);
  const [weeklyPrompts, setWeeklyPrompts] = useState<SpecialPromptRow[]>([]);
  const [specialLoading, setSpecialLoading] = useState(false);
  const [specialError, setSpecialError] = useState<string | null>(null);

  const [brainBreakSteps, setBrainBreakSteps] = useState<BrainBreakStepRow[]>([]);
  const [editingBrainStepId, setEditingBrainStepId] = useState<string | null>(null);
  const [brainStepDraft, setBrainStepDraft] = useState("");
  const [brainStepsLoading, setBrainStepsLoading] = useState(false);
  const [brainStepsError, setBrainStepsError] = useState<string | null>(null);

  const [stats, setStats] = useState<StatsModel | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAccess() {
      if (!supabase) {
        router.replace("/");
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let token = session?.access_token ?? null;
      if (!token) {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();
        if (!refreshError) {
          token = refreshed.session?.access_token ?? null;
        }
      }
      const response = await fetch("/api/admin/authorize", {
        method: "POST",
        headers: token
          ? {
              authorization: `Bearer ${token}`,
              "content-type": "application/json",
            }
          : { "content-type": "application/json" },
        body: JSON.stringify({ email: user.email ?? null }),
      });
      const data = (await response.json().catch(() => ({ authorized: false }))) as {
        authorized?: boolean;
      };
      if (!response.ok || !data.authorized) {
        router.replace("/");
        return;
      }
      setAuthorized(true);
      setCheckingAccess(false);
    }
    checkAccess();
  }, [router]);

  async function loadPrompts() {
    if (!supabase) return;
    setPromptLoading(true);
    setPromptError(null);
    const { data, error } = await supabase
      .from("prompts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setPromptError(`Could not load prompts: ${error.message}`);
      setPromptLoading(false);
      return;
    }
    const normalized = ((data ?? []) as Array<Record<string, unknown>>).map(
      (row) => {
        const statusRaw = String(row.status ?? "").toLowerCase();
        const status: PromptStatus =
          statusRaw === "active" || statusRaw === "inactive" || statusRaw === "draft"
            ? (statusRaw as PromptStatus)
            : row.is_active === false
              ? "inactive"
              : "active";
        return {
          id: String(row.id),
          kind: String(row.kind) as PromptKind,
          title: String(row.title ?? ""),
          body: String(row.body ?? ""),
          step: String(row.step ?? ""),
          status,
          internal_notes:
            typeof row.internal_notes === "string" ? row.internal_notes : null,
          created_at: String(row.created_at ?? new Date().toISOString()),
        };
      },
    );
    setPrompts(normalized);
    setPromptLoading(false);
  }

  async function loadBrainBreakSteps() {
    if (!supabase) return;
    setBrainStepsLoading(true);
    setBrainStepsError(null);
    const { data, error } = await supabase
      .from("brain_break_steps")
      .select("*")
      .order("step_number", { ascending: true });
    if (error) {
      setBrainStepsError(`Could not load brain break steps: ${error.message}`);
      setBrainStepsLoading(false);
      return;
    }
    setBrainBreakSteps((data ?? []) as BrainBreakStepRow[]);
    setBrainStepsLoading(false);
  }

  async function loadSpecialPrompts() {
    if (!supabase) return;
    setSpecialLoading(true);
    setSpecialError(null);
    const [{ data: windowRows, error: windowError }, { data: promptRows, error: promptError }] =
      await Promise.all([
        supabase.from("seasonal_windows").select("*").order("name", { ascending: true }),
        supabase.from("special_prompts").select("*").order("rotation_order", { ascending: true }),
      ]);
    if (windowError) {
      setSpecialError(`Could not load seasonal windows: ${windowError.message}`);
      setSpecialLoading(false);
      return;
    }
    if (promptError) {
      setSpecialError(`Could not load special prompts: ${promptError.message}`);
      setSpecialLoading(false);
      return;
    }
    const windows = (windowRows ?? []) as SeasonalWindowRow[];
    const specials = (promptRows ?? []) as SpecialPromptRow[];
    setSeasonalWindows(windows);
    setSeasonalPrompts(specials.filter((row) => row.special_type === "seasonal"));
    setWeeklyPrompts(specials.filter((row) => row.special_type === "weekly"));
    setSpecialLoading(false);
  }

  async function toggleSeasonalWindow(windowRow: SeasonalWindowRow) {
    if (!supabase) return;
    const { error } = await supabase
      .from("seasonal_windows")
      .update({ active: !windowRow.active })
      .eq("id", windowRow.id);
    if (error) {
      setSpecialError(`Could not update window: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function toggleSpecialPromptStatus(row: SpecialPromptRow) {
    if (!supabase) return;
    const nextStatus: SpecialPromptStatus =
      row.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("special_prompts")
      .update({ status: nextStatus })
      .eq("id", row.id);
    if (error) {
      setSpecialError(`Could not update prompt status: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function shiftWeeklyRotation(row: SpecialPromptRow, delta: number) {
    if (!supabase) return;
    const currentOrder = row.rotation_order ?? 999;
    const { error } = await supabase
      .from("special_prompts")
      .update({ rotation_order: Math.max(1, currentOrder + delta) })
      .eq("id", row.id);
    if (error) {
      setSpecialError(`Could not update rotation: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function saveSeasonalWindowEdits(row: SeasonalWindowRow) {
    if (!supabase) return;
    const startDate = window.prompt("Start date (YYYY-MM-DD)", row.start_date);
    if (!startDate) return;
    const endDate = window.prompt("End date (YYYY-MM-DD)", row.end_date);
    if (!endDate) return;
    const badgeLabel = window.prompt("Badge label", row.badge_label);
    if (!badgeLabel) return;
    const accentColor = window.prompt("Accent color (hex)", row.accent_color);
    if (!accentColor) return;
    const nudgeCopy = window.prompt("Nudge copy", row.nudge_copy);
    if (!nudgeCopy) return;
    const { error } = await supabase
      .from("seasonal_windows")
      .update({
        start_date: startDate,
        end_date: endDate,
        badge_label: badgeLabel,
        accent_color: accentColor,
        nudge_copy: nudgeCopy,
      })
      .eq("id", row.id);
    if (error) {
      setSpecialError(`Could not save window edits: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function addSpecialPrompt(
    specialType: "seasonal" | "weekly",
    specialKey: string,
    seasonalWindowKey: string | null,
  ) {
    if (!supabase) return;
    const name = window.prompt("Prompt name");
    if (!name) return;
    const body = window.prompt("Prompt body");
    if (!body) return;
    const tinyStep = window.prompt("Tiny step");
    if (!tinyStep) return;
    const rotationRaw = window.prompt("Rotation order (number)", "1");
    const rotationOrder = Number(rotationRaw ?? "1");
    const statusRaw = window.prompt("Status (active, inactive, draft)", "active");
    const status =
      statusRaw === "inactive" || statusRaw === "draft" ? statusRaw : "active";
    const { error } = await supabase.from("special_prompts").insert({
      special_type: specialType,
      special_key: specialKey,
      seasonal_window_key: seasonalWindowKey,
      name: name.trim(),
      body: body.trim(),
      tiny_step: tinyStep.trim(),
      rotation_order: Number.isFinite(rotationOrder) ? rotationOrder : 1,
      status,
    });
    if (error) {
      setSpecialError(`Could not create prompt: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function quickEditSpecialPrompt(row: SpecialPromptRow) {
    if (!supabase) return;
    const name = window.prompt("Prompt name", row.name);
    if (!name) return;
    const body = window.prompt("Prompt body", row.body);
    if (!body) return;
    const tinyStep = window.prompt("Tiny step", row.tiny_step);
    if (!tinyStep) return;
    const { error } = await supabase
      .from("special_prompts")
      .update({
        name: name.trim(),
        body: body.trim(),
        tiny_step: tinyStep.trim(),
      })
      .eq("id", row.id);
    if (error) {
      setSpecialError(`Could not edit prompt: ${error.message}`);
      return;
    }
    await loadSpecialPrompts();
  }

  async function loadStats() {
    if (!supabase) return;
    setStatsLoading(true);
    setStatsError(null);
    try {
      const [{ data: promptsRows, error: promptsError }, { data: momentsRows, error: momentsError }, { count: usersCount, error: usersError }] =
        await Promise.all([
          supabase.from("prompts").select("kind,title,status,is_active"),
          supabase.from("moments").select("prompt_name,category"),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
        ]);

      if (promptsError) throw promptsError;
      if (momentsError) throw momentsError;
      if (usersError) throw usersError;

      const promptsNormalized = ((promptsRows ?? []) as Array<Record<string, unknown>>)
        .map((row) => {
          const statusRaw = String(row.status ?? "").toLowerCase();
          const status: PromptStatus =
            statusRaw === "active" || statusRaw === "inactive" || statusRaw === "draft"
              ? (statusRaw as PromptStatus)
              : row.is_active === false
                ? "inactive"
                : "active";
          return {
            kind: String(row.kind ?? ""),
            title: String(row.title ?? ""),
            status,
          };
        });

      const activeByCategory = Object.entries(categoryLabels).map(([kind, label]) => ({
        label,
        count: promptsNormalized.filter(
          (prompt) => prompt.kind === kind && prompt.status === "active",
        ).length,
      }));

      const byStatus: Array<{ label: string; count: number }> = [
        {
          label: "Active",
          count: promptsNormalized.filter((prompt) => prompt.status === "active")
            .length,
        },
        {
          label: "Inactive",
          count: promptsNormalized.filter((prompt) => prompt.status === "inactive")
            .length,
        },
        {
          label: "Draft",
          count: promptsNormalized.filter((prompt) => prompt.status === "draft")
            .length,
        },
      ];

      const usageMap = new Map<string, { name: string; category: string; count: number }>();
      const moments = (momentsRows ?? []) as Array<Record<string, unknown>>;
      let totalBrainBreaks = 0;
      for (const row of moments) {
        const category = String(row.category ?? "");
        const promptName = String(row.prompt_name ?? "Tiny pause");
        const lowerCategory = category.trim().toLowerCase();
        if (lowerCategory === "brain-break" || lowerCategory === "brain break") {
          totalBrainBreaks += 1;
          continue;
        }
        const key = `${category}::${promptName}`;
        const current = usageMap.get(key);
        if (current) {
          current.count += 1;
        } else {
          usageMap.set(key, { name: promptName, category, count: 1 });
        }
      }

      const usageList = Array.from(usageMap.values()).sort(
        (a, b) => b.count - a.count,
      );
      const mostUsedPrompt = usageList[0] ?? null;

      const activePrompts = promptsNormalized.filter(
        (prompt) => prompt.status === "active",
      );
      let leastUsedActivePrompt: {
        name: string;
        category: string;
        count: number;
      } | null = null;
      for (const prompt of activePrompts) {
        const key = `${categoryLabels[prompt.kind as PromptKind] ?? prompt.kind}::${prompt.title}`;
        const usage = usageMap.get(key)?.count ?? 0;
        if (!leastUsedActivePrompt || usage < leastUsedActivePrompt.count) {
          leastUsedActivePrompt = {
            name: prompt.title,
            category: categoryLabels[prompt.kind as PromptKind] ?? prompt.kind,
            count: usage,
          };
        }
      }

      setStats({
        activeByCategory,
        byStatus,
        totalMoments: moments.length,
        totalBrainBreaks,
        totalUsers: usersCount ?? 0,
        mostUsedPrompt,
        leastUsedActivePrompt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error loading stats.";
      setStatsError(`Could not load stats: ${message}`);
    } finally {
      setStatsLoading(false);
    }
  }

  useEffect(() => {
    if (!authorized) return;
    if (view === "prompts") void loadPrompts();
    if (view === "seasonal" || view === "weekly") void loadSpecialPrompts();
    if (view === "brain-break") void loadBrainBreakSteps();
    if (view === "stats") void loadStats();
  }, [authorized, view]);

  const filteredPrompts = useMemo(() => {
    let rows = [...prompts];
    if (promptFilter !== "all") {
      rows = rows.filter((prompt) => prompt.kind === promptFilter);
    }
    rows.sort((a, b) => {
      if (promptSortBy === "category") return a.kind.localeCompare(b.kind);
      if (promptSortBy === "name") return a.title.localeCompare(b.title);
      if (promptSortBy === "status") return a.status.localeCompare(b.status);
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
    return rows;
  }, [prompts, promptFilter, promptSortBy]);

  function openNewPromptForm() {
    setEditingPromptId(null);
    setPromptForm(defaultPromptForm);
    setFormOpen(true);
  }

  function openEditPromptForm(row: PromptRow) {
    setEditingPromptId(row.id);
    setPromptForm({
      kind: row.kind,
      title: row.title,
      body: row.body,
      step: row.step,
      status: row.status,
      internal_notes: row.internal_notes ?? "",
    });
    setFormOpen(true);
  }

  function closePromptForm() {
    setFormOpen(false);
    setEditingPromptId(null);
    setPromptForm(defaultPromptForm);
  }

  async function savePrompt() {
    if (!supabase) return;
    setSavingPrompt(true);
    setPromptError(null);
    const payload = {
      kind: promptForm.kind,
      title: promptForm.title.trim(),
      body: promptForm.body.trim(),
      step: promptForm.step.trim(),
      status: promptForm.status,
      internal_notes: promptForm.internal_notes?.trim() || null,
      is_active: promptForm.status === "active",
    };
    if (!payload.title || !payload.body || !payload.step) {
      setPromptError("Name, body text, and tiny step are required.");
      setSavingPrompt(false);
      return;
    }
    const query = editingPromptId
      ? supabase.from("prompts").update(payload).eq("id", editingPromptId)
      : supabase.from("prompts").insert(payload);
    const { error } = await query;
    if (error) {
      setPromptError(`Could not save prompt: ${error.message}`);
      setSavingPrompt(false);
      return;
    }
    await loadPrompts();
    closePromptForm();
    setSavingPrompt(false);
  }

  async function togglePromptStatus(row: PromptRow) {
    if (!supabase) return;
    const nextStatus: PromptStatus = row.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("prompts")
      .update({
        status: nextStatus,
        is_active: nextStatus === "active",
      })
      .eq("id", row.id);
    if (error) {
      setPromptError(`Could not update status: ${error.message}`);
      return;
    }
    await loadPrompts();
  }

  async function deletePrompt(row: PromptRow) {
    if (!supabase) return;
    const confirmed = window.confirm(`Delete prompt "${row.title}"?`);
    if (!confirmed) return;
    const { error } = await supabase.from("prompts").delete().eq("id", row.id);
    if (error) {
      setPromptError(`Could not delete prompt: ${error.message}`);
      return;
    }
    await loadPrompts();
  }

  function beginBrainStepEdit(stepRow: BrainBreakStepRow) {
    setEditingBrainStepId(stepRow.id);
    setBrainStepDraft(stepRow.instruction);
  }

  async function saveBrainStep(stepRow: BrainBreakStepRow) {
    if (!supabase) return;
    const nextInstruction = brainStepDraft.trim();
    if (!nextInstruction) {
      setBrainStepsError("Instruction cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from("brain_break_steps")
      .update({
        instruction: nextInstruction,
        updated_at: new Date().toISOString(),
      })
      .eq("id", stepRow.id);
    if (error) {
      setBrainStepsError(`Could not save step: ${error.message}`);
      return;
    }
    setEditingBrainStepId(null);
    setBrainStepDraft("");
    await loadBrainBreakSteps();
  }

  if (checkingAccess || !authorized) {
    return (
      <PageShell maxWidth="lg">
        <BrandCard tone="muted">
          <p className="text-sm text-[color:var(--color-foreground)]/80">
            Loading admin panel...
          </p>
        </BrandCard>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="lg">
      <div className="grid gap-4 md:grid-cols-[220px,1fr]">
        <aside className="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white p-3">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/70">
            Admin
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id)}
                className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                  view === item.id
                    ? "bg-[#eef8fb] font-semibold text-[#1f6f86]"
                    : "text-[color:var(--color-primary)]/80 hover:bg-[color:var(--color-surface-soft)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <section className="space-y-3">
          {view === "prompts" && (
            <BrandCard>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["all", "pause", "letting-go", "reflect", "kindness"] as const).map(
                    (filter) => {
                      const label =
                        filter === "all"
                          ? "All"
                          : categoryLabels[filter as PromptKind];
                      return (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setPromptFilter(filter as PromptFilter)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                            promptFilter === filter
                              ? "bg-[#e6f5f9] text-[#1f6f86]"
                              : "bg-[color:var(--color-surface-soft)] text-[color:var(--color-primary)]/75 hover:bg-[#eef8fb]"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    },
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[color:var(--color-foreground)]/72">
                    Sort by
                  </label>
                  <select
                    value={promptSortBy}
                    onChange={(event) =>
                      setPromptSortBy(
                        event.target.value as "category" | "name" | "created" | "status",
                      )
                    }
                    className="rounded-lg border border-[color:var(--color-border-subtle)] bg-white px-2 py-1 text-xs"
                  >
                    <option value="created">Created date</option>
                    <option value="category">Category</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                  <BrandButton type="button" onClick={openNewPromptForm}>
                    Add new prompt
                  </BrandButton>
                </div>
              </div>

              {promptError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {promptError}
                </p>
              )}

              <div className="mt-3 overflow-x-auto rounded-xl border border-[color:var(--color-border-subtle)]">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-[color:var(--color-surface-soft)] text-xs uppercase tracking-wide text-[color:var(--color-primary)]/70">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Created</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promptLoading ? (
                      <tr>
                        <td className="px-3 py-3 text-[color:var(--color-foreground)]/70" colSpan={5}>
                          Loading prompts...
                        </td>
                      </tr>
                    ) : filteredPrompts.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-[color:var(--color-foreground)]/70" colSpan={5}>
                          No prompts found.
                        </td>
                      </tr>
                    ) : (
                      filteredPrompts.map((row) => (
                        <tr
                          key={row.id}
                          className={`border-t border-[color:var(--color-border-subtle)] ${
                            row.status === "inactive" ? "opacity-60" : ""
                          }`}
                        >
                          <td className="px-3 py-2 font-medium text-[color:var(--color-primary)]">
                            {row.title}
                          </td>
                          <td className="px-3 py-2 text-[color:var(--color-foreground)]/80">
                            {categoryLabels[row.kind]}
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(
                                row.status,
                              )}`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[color:var(--color-foreground)]/75">
                            {formatDate(row.created_at)}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => openEditPromptForm(row)}
                                className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 hover:bg-[#eef8fb]"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePromptStatus(row)}
                                className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 hover:bg-[#eef8fb]"
                              >
                                {row.status === "active" ? "Set inactive" : "Set active"}
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePrompt(row)}
                                className="rounded-md bg-rose-50 px-2 py-1 text-rose-700 hover:bg-rose-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {formOpen && (
                <div className="mt-4 grid gap-4 rounded-2xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-soft)] p-4 lg:grid-cols-[1.1fr,0.9fr]">
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                      {editingPromptId ? "Edit prompt" : "Add new prompt"}
                    </p>

                    <label className="block text-xs text-[color:var(--color-primary)]/80">
                      Category
                      <select
                        value={promptForm.kind}
                        onChange={(event) =>
                          setPromptForm((prev) => ({
                            ...prev,
                            kind: event.target.value as PromptKind,
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-white px-3 py-2 text-sm"
                      >
                        <option value="pause">Just a pause</option>
                        <option value="letting-go">Letting go</option>
                        <option value="reflect">Reflecting on today</option>
                        <option value="kindness">Kindness</option>
                      </select>
                    </label>

                    <label className="block text-xs text-[color:var(--color-primary)]/80">
                      Prompt name
                      <input
                        value={promptForm.title}
                        onChange={(event) =>
                          setPromptForm((prev) => ({ ...prev, title: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <label className="block text-xs text-[color:var(--color-primary)]/80">
                      Body text
                      <textarea
                        value={promptForm.body}
                        maxLength={150}
                        onChange={(event) =>
                          setPromptForm((prev) => ({ ...prev, body: event.target.value }))
                        }
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-white px-3 py-2 text-sm"
                      />
                      <span className="mt-1 block text-right text-[11px] text-[color:var(--color-foreground)]/60">
                        {promptForm.body.length}/150
                      </span>
                    </label>

                    <label className="block text-xs text-[color:var(--color-primary)]/80">
                      Tiny step text
                      <textarea
                        value={promptForm.step}
                        maxLength={150}
                        onChange={(event) =>
                          setPromptForm((prev) => ({ ...prev, step: event.target.value }))
                        }
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-white px-3 py-2 text-sm"
                      />
                      <span className="mt-1 block text-right text-[11px] text-[color:var(--color-foreground)]/60">
                        {promptForm.step.length}/150
                      </span>
                    </label>

                    <fieldset className="text-xs text-[color:var(--color-primary)]/80">
                      <legend className="mb-1">Status</legend>
                      <div className="flex gap-3">
                        {(["draft", "active", "inactive"] as const).map((status) => (
                          <label key={status} className="inline-flex items-center gap-1.5">
                            <input
                              type="radio"
                              checked={promptForm.status === status}
                              onChange={() =>
                                setPromptForm((prev) => ({ ...prev, status }))
                              }
                            />
                            {status}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="block text-xs text-[color:var(--color-primary)]/80">
                      Internal notes
                      <textarea
                        value={promptForm.internal_notes ?? ""}
                        onChange={(event) =>
                          setPromptForm((prev) => ({
                            ...prev,
                            internal_notes: event.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-white px-3 py-2 text-sm"
                      />
                    </label>

                    <div className="flex gap-2">
                      <BrandButton
                        type="button"
                        onClick={savePrompt}
                        disabled={savingPrompt}
                      >
                        {savingPrompt ? "Saving..." : "Save"}
                      </BrandButton>
                      <BrandButton
                        type="button"
                        variant="secondary"
                        onClick={closePromptForm}
                      >
                        Cancel
                      </BrandButton>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/70">
                      Preview
                    </p>
                    <div className="mx-auto max-w-[320px] rounded-2xl border border-[color:var(--color-border-subtle)] bg-white p-4">
                      <p className="text-lg font-semibold text-[color:var(--color-primary)]">
                        {promptForm.title || "Prompt name"}
                      </p>
                      <p className="mt-2 text-sm text-[color:var(--color-foreground)]/85">
                        {promptForm.body || "Prompt body appears here."}
                      </p>
                      <div className="mt-3 rounded-xl bg-[color:var(--color-accent-soft)] p-3">
                        <p className="text-sm font-semibold text-[color:var(--color-ink-on-accent-soft)]">
                          Your tiny step
                        </p>
                        <p className="mt-1 text-sm text-[color:var(--color-ink-on-accent-soft)]/95">
                          {promptForm.step || "Tiny step appears here."}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-3 w-full rounded-full bg-[color:var(--color-accent)] px-4 py-2 text-sm font-semibold text-slate-900"
                      >
                        I did it
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </BrandCard>
          )}

          {view === "seasonal" && (
            <BrandCard>
              <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                Seasonal Prompts
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-foreground)]/72">
                Manage active windows, prompts, and nudge copy for seasonal moments.
              </p>
              {specialError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {specialError}
                </p>
              )}
              {specialLoading ? (
                <p className="mt-3 text-sm text-[color:var(--color-foreground)]/70">
                  Loading seasonal prompts...
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  {seasonalWindows.map((windowRow) => {
                    const rows = seasonalPrompts
                      .filter((prompt) => prompt.special_key === windowRow.key)
                      .sort((a, b) => (a.rotation_order ?? 999) - (b.rotation_order ?? 999));
                    return (
                      <div
                        key={windowRow.id}
                        className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                              {windowRow.name}
                            </p>
                            <p className="text-xs text-[color:var(--color-foreground)]/70">
                              {windowRow.start_date.slice(5)} to {windowRow.end_date.slice(5)} · {windowRow.badge_label}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => saveSeasonalWindowEdits(windowRow)}
                              className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                            >
                              Edit window
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                addSpecialPrompt(
                                  "seasonal",
                                  windowRow.key,
                                  windowRow.key,
                                )
                              }
                              className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                            >
                              Add prompt
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSeasonalWindow(windowRow)}
                              className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                            >
                              {windowRow.active ? "Set inactive" : "Set active"}
                            </button>
                          </div>
                        </div>
                        <p className="mt-2 rounded-lg px-2 py-1 text-xs" style={{ backgroundColor: `${windowRow.accent_color}26` }}>
                          Nudge: {windowRow.nudge_copy}
                        </p>
                        <div className="mt-2 space-y-1">
                          {rows.map((row) => (
                            <div key={row.id} className="flex items-start justify-between gap-2 rounded-lg border border-[color:var(--color-border-subtle)] p-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-[color:var(--color-primary)]">
                                  {row.name}
                                </p>
                                <p className="truncate text-xs text-[color:var(--color-foreground)]/72">
                                  {row.body}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleSpecialPromptStatus(row)}
                                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(row.status)}`}
                              >
                                {row.status}
                              </button>
                              <button
                                type="button"
                                onClick={() => quickEditSpecialPrompt(row)}
                                className="shrink-0 rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-[11px] hover:bg-[#eef8fb]"
                              >
                                Edit
                              </button>
                            </div>
                          ))}
                          {rows.length === 0 && (
                            <p className="text-xs text-[color:var(--color-foreground)]/68">
                              No seasonal prompts for this window.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </BrandCard>
          )}

          {view === "weekly" && (
            <BrandCard>
              <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                Weekly Prompts
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-foreground)]/72">
                Sunday evening and Monday morning prompts rotate each week by order.
              </p>
              {specialError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {specialError}
                </p>
              )}
              {specialLoading ? (
                <p className="mt-3 text-sm text-[color:var(--color-foreground)]/70">
                  Loading weekly prompts...
                </p>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {(["sunday-evening", "monday-morning"] as const).map((key) => {
                    const rows = weeklyPrompts
                      .filter((row) => row.special_key === key)
                      .sort((a, b) => (a.rotation_order ?? 999) - (b.rotation_order ?? 999));
                    return (
                      <div
                        key={key}
                        className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3"
                      >
                        <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                          {key === "sunday-evening" ? "Sunday evening" : "Monday morning"}
                        </p>
                        <button
                          type="button"
                          onClick={() => addSpecialPrompt("weekly", key, null)}
                          className="mt-1 rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                        >
                          Add prompt
                        </button>
                        <div className="mt-2 space-y-2">
                          {rows.map((row) => (
                            <div key={row.id} className="rounded-lg border border-[color:var(--color-border-subtle)] p-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-[color:var(--color-primary)]">
                                  #{row.rotation_order ?? "-"} {row.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => toggleSpecialPromptStatus(row)}
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(row.status)}`}
                                >
                                  {row.status}
                                </button>
                              </div>
                              <p className="mt-1 text-xs text-[color:var(--color-foreground)]/72">
                                {row.body}
                              </p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => quickEditSpecialPrompt(row)}
                                  className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => shiftWeeklyRotation(row, -1)}
                                  className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                                >
                                  Move up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => shiftWeeklyRotation(row, 1)}
                                  className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                                >
                                  Move down
                                </button>
                              </div>
                            </div>
                          ))}
                          {rows.length === 0 && (
                            <p className="text-xs text-[color:var(--color-foreground)]/68">
                              No prompts in this set yet.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </BrandCard>
          )}

          {view === "brain-break" && (
            <BrandCard>
              <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                Brain Break Steps
              </p>
              {brainStepsError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {brainStepsError}
                </p>
              )}
              <div className="mt-3 space-y-2">
                {brainStepsLoading ? (
                  <p className="text-sm text-[color:var(--color-foreground)]/70">
                    Loading steps...
                  </p>
                ) : (
                  brainBreakSteps.map((stepRow) => (
                    <div
                      key={stepRow.id}
                      className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                        Step {stepRow.step_number}
                      </p>
                      {editingBrainStepId === stepRow.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={brainStepDraft}
                            onChange={(event) =>
                              setBrainStepDraft(event.target.value)
                            }
                            rows={2}
                            className="w-full rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] px-3 py-2 text-sm"
                          />
                          <div className="flex gap-2">
                            <BrandButton
                              type="button"
                              onClick={() => saveBrainStep(stepRow)}
                            >
                              Save
                            </BrandButton>
                            <BrandButton
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setEditingBrainStepId(null);
                                setBrainStepDraft("");
                              }}
                            >
                              Cancel
                            </BrandButton>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-start justify-between gap-3">
                          <p className="text-sm text-[color:var(--color-foreground)]/85">
                            {stepRow.instruction}
                          </p>
                          <button
                            type="button"
                            onClick={() => beginBrainStepEdit(stepRow)}
                            className="rounded-md bg-[color:var(--color-surface-soft)] px-2 py-1 text-xs hover:bg-[#eef8fb]"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </BrandCard>
          )}

          {view === "stats" && (
            <BrandCard>
              <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                Stats
              </p>
              {statsError && (
                <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {statsError}
                </p>
              )}
              {statsLoading || !stats ? (
                <p className="mt-3 text-sm text-[color:var(--color-foreground)]/70">
                  Loading stats...
                </p>
              ) : (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Active prompts by category
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {stats.activeByCategory.map((item) => (
                        <li key={item.label} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Prompts by status
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {stats.byStatus.map((item) => (
                        <li key={item.label} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className="font-medium">{item.count}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Total moments completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{stats.totalMoments}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Total brain breaks completed
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{stats.totalBrainBreaks}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Total users
                    </p>
                    <p className="mt-2 text-2xl font-semibold">{stats.totalUsers}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Most used prompt
                    </p>
                    {stats.mostUsedPrompt ? (
                      <p className="mt-2 text-sm">
                        <span className="font-semibold">
                          {stats.mostUsedPrompt.name}
                        </span>{" "}
                        · {stats.mostUsedPrompt.category} ({stats.mostUsedPrompt.count})
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[color:var(--color-foreground)]/70">
                        No usage yet.
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-3 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-primary)]/65">
                      Least used active prompt
                    </p>
                    {stats.leastUsedActivePrompt ? (
                      <p className="mt-2 text-sm">
                        <span className="font-semibold">
                          {stats.leastUsedActivePrompt.name}
                        </span>{" "}
                        · {stats.leastUsedActivePrompt.category} (
                        {stats.leastUsedActivePrompt.count})
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-[color:var(--color-foreground)]/70">
                        No active prompts found.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </BrandCard>
          )}
        </section>
      </div>
    </PageShell>
  );
}
