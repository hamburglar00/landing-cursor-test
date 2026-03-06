import type { LandingPhoneResponse, LandingPublicConfig } from "./types";

function ensureHttps(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function fetchLandingConfig(name: string): Promise<LandingPublicConfig> {
  const base = process.env.SUPABASE_EDGE_BASE;
  if (!base) throw new Error("SUPABASE_EDGE_BASE is not set (check Vercel Environment Variables)");
  const url = `${base}/functions/v1/builder-config?name=${encodeURIComponent(name)}`;

  const res = await fetch(url, {
    // Cache server-side (ISR). Ajustá si querés:
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error(`builder-config HTTP ${res.status}`);
  const json = await res.json();

  // Si tu edge devuelve otra estructura, acá adaptás.
  // Asumo que ya devuelve el "LandingPublicConfig" unificado (como querías).
  const cfg = json as LandingPublicConfig;

  // Normalizaciones básicas:
  cfg.tracking.postUrl = ensureHttps(cfg.tracking.postUrl);

  return cfg;
}

// OJO: el phone lo fetcharemos desde el cliente al click (no cache)
export async function fetchLandingPhone(name: string): Promise<LandingPhoneResponse> {
  const base = process.env.SUPABASE_EDGE_BASE;
  if (!base) throw new Error("SUPABASE_EDGE_BASE is not set (check Vercel Environment Variables)");
  const url = `${base}/functions/v1/landing-phone?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`landing-phone HTTP ${res.status}`);
  return res.json();
}
