const BASE_URL = "https://api.watchmode.com";

export async function watchmodeFetch(path, params = {}) {
  const apiKey = process.env.WATCHMODE_API_KEY;

  if (!apiKey) {
    const error = new Error("WATCHMODE_API_KEY is missing.");
    error.status = 503;
    throw error;
  }

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: {
      "X-API-Key": apiKey,
      Accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    const error = new Error("Watchmode request failed: " + response.status);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export function isSafeProviderUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local")
    ) return false;

    if (/^\\d{1,3}(\\.\\d{1,3}){3}$/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}
