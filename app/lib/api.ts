const ALLOWED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "pasmthatfee.com",
  "albilaad-ksa.com",
  "albiladksa.com",
  "elbilad-backend.onrender.com",
];

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  if (hostname.endsWith(".onrender.com")) return true;
  return false;
}

const ALLOWED_PREFIXES = [
  "/api/admin",
  "/api/products",
  "/api/checkout",
];

function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  const raw = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
  try {
    const { hostname } = new URL(raw);
    if (!isAllowedHost(hostname)) {
      console.warn(`[apiFetch] Untrusted host blocked: ${hostname}`);
      return raw;
    }
    return raw;
  } catch {
    return raw;
  }
}

export const API = getApiBase();

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    throw new Error(`Blocked path: ${path}`);
  }
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
}
