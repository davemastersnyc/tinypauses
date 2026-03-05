import { createClient } from "@supabase/supabase-js";

type PromptStatus = "active" | "inactive" | "draft";
type PromptKind = "pause" | "letting-go" | "reflect" | "kindness";

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

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;
}

export async function GET(request: Request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const token = getBearerToken(request);

    if (!adminEmail || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return Response.json(
        { ok: false, message: "Missing environment configuration." },
        { status: 500 },
      );
    }
    if (!token) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser(token);
    if (authError || !user?.email || user.email.trim().toLowerCase() !== adminEmail) {
      return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const [
      { data: promptsRows, error: promptsError },
      { data: momentsRows, error: momentsError },
      { count: usersCount, error: usersError },
    ] = await Promise.all([
      serviceClient.from("prompts").select("kind,title,status,is_active"),
      serviceClient.from("moments").select("prompt_name,category"),
      serviceClient.from("profiles").select("id", { count: "exact", head: true }),
    ]);

    if (promptsError || momentsError || usersError) {
      throw promptsError || momentsError || usersError;
    }

    const promptsNormalized = ((promptsRows ?? []) as Array<Record<string, unknown>>).map(
      (row) => {
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
      },
    );

    const activeByCategory = Object.entries(categoryLabels).map(([kind, label]) => ({
      label,
      count: promptsNormalized.filter(
        (prompt) => prompt.kind === kind && prompt.status === "active",
      ).length,
    }));

    const byStatus: Array<{ label: string; count: number }> = [
      {
        label: "Active",
        count: promptsNormalized.filter((prompt) => prompt.status === "active").length,
      },
      {
        label: "Inactive",
        count: promptsNormalized.filter((prompt) => prompt.status === "inactive").length,
      },
      {
        label: "Draft",
        count: promptsNormalized.filter((prompt) => prompt.status === "draft").length,
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

    const usageList = Array.from(usageMap.values()).sort((a, b) => b.count - a.count);
    const mostUsedPrompt = usageList[0] ?? null;

    const activePrompts = promptsNormalized.filter((prompt) => prompt.status === "active");
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

    const metrics: StatsModel = {
      activeByCategory,
      byStatus,
      totalMoments: moments.length,
      totalBrainBreaks,
      totalUsers: usersCount ?? 0,
      mostUsedPrompt,
      leastUsedActivePrompt,
    };

    return Response.json({ ok: true, metrics });
  } catch (error) {
    console.error("Admin stats summary error", error);
    return Response.json(
      { ok: false, message: "Could not load admin stats summary." },
      { status: 500 },
    );
  }
}
