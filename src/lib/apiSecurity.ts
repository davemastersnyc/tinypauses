type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __tpRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

function getStore() {
  if (!globalThis.__tpRateLimitStore) {
    globalThis.__tpRateLimitStore = new Map<string, RateLimitBucket>();
  }
  return globalThis.__tpRateLimitStore;
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "unknown";
}

export function isTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host")?.trim() ||
    request.headers.get("host")?.trim();
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

export function applyRateLimit(
  key: string,
  options: { maxRequests: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  current.count += 1;
  store.set(key, current);

  const remaining = Math.max(0, options.maxRequests - current.count);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  return {
    allowed: current.count <= options.maxRequests,
    remaining,
    retryAfterSeconds,
  };
}
