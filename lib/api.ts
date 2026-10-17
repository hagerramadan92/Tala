export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://dashboard.talaaljazeera.com/api/v1").replace(/\/+$/, "");

// In-memory cache: url -> { data: any, expiresAt: number }
const cache = new Map<string, { data: any; expiresAt: number }>();
// In-flight request deduplication: url -> Promise<any>
const inFlight = new Map<string, Promise<any>>();

const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function fetchWithCache(
  url: string,
  { ttl = CACHE_TTL_MS, skipCache = false }: { ttl?: number; skipCache?: boolean } = {}
) {
  const now = Date.now();
  if (!skipCache && cache.has(url)) {
    const cached = cache.get(url)!;
    if (cached.expiresAt > now) {
      return cached.data;
    }
    cache.delete(url);
  }

  if (inFlight.has(url)) {
    return inFlight.get(url);
  }

  const promise = (async () => {
    let retries = 2;
    while (retries >= 0) {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          mode: "cors",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        // Check for rate limit / throttle
        if (
          res.status === 429 ||
          data?.error_code === "ThrottleRequestsException" ||
          (typeof data?.message === "string" && data.message.includes("Too Many Attempts"))
        ) {
          if (retries > 0) {
            retries--;
            await new Promise((r) => setTimeout(r, 1500));
            continue;
          }
          throw new Error("يرجى الانتظار قليلاً (تم تجاوز الحد المسموح للطلبات)");
        }

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        if (data && data.status === false) {
          throw new Error(data.message || "فشل جلب البيانات");
        }

        const result = data?.data !== undefined ? data.data : data;

        if (!skipCache && result) {
          cache.set(url, { data: result, expiresAt: Date.now() + ttl });
        }

        return result;
      } catch (err: any) {
        if (retries > 0 && err.message?.includes("fetch")) {
          retries--;
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        }
        console.error(`Error fetching ${url}:`, err);
        throw err;
      }
    }
  })().finally(() => {
    inFlight.delete(url);
  });

  inFlight.set(url, promise);
  return promise;
}

export async function fetchApi(endpoint: string, options: { ttl?: number; skipCache?: boolean } = {}) {
  const cleanEndpoint = endpoint.replace(/^\/+/, "");
  const fullUrl = `${API_URL}/${cleanEndpoint}`;
  return fetchWithCache(fullUrl, options);
}

export async function fetchApi2(endpoint: string, options: { ttl?: number; skipCache?: boolean } = {}) {
  return fetchWithCache(endpoint, options);
}

export async function fetchHomeData() {
  try {
    const data = await fetchApi("home");
    return data;
  } catch (err) {
    console.error("Error fetching home data:", err);
    throw err;
  }
}
