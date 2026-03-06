import type { LandingPhoneResponse, LandingPublicConfig } from "./types";

function ensureHttps(url: string) {
  if (!url) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

export async function fetchLandingConfig(name: string): Promise<LandingPublicConfig> {
  const base = process.env.SUPABASE_EDGE_BASE!;
  if (!base) throw new Error("Missing SUPABASE_EDGE_BASE");

  const url = `${base}/functions/v1/builder-config?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { next: { revalidate: 60 } });

  if (!res.ok) throw new Error(`builder-config HTTP ${res.status}`);
  const json: any = await res.json();

  // ✅ Si ya viene con el esquema nuevo, lo usamos
  if (json?.tracking?.pixelId) {
    json.tracking.postUrl = ensureHttps(json.tracking.postUrl);
    return json as LandingPublicConfig;
  }

  // ✅ Si viene con el esquema viejo, lo adaptamos
  const cfg: LandingPublicConfig = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    id: json.id,
    name: json.name,
    comment: json.comment || "",
    tracking: {
      pixelId: String(json.pixelId || ""),
      postUrl: ensureHttps(String(json.postUrl || "")),
      landingTag: String(json.landingTag || ""),
    },
    background: {
      mode: json?.config?.backgroundMode || "single",
      images: json?.config?.backgroundImages || [],
      rotateEveryHours: Number(json?.config?.rotateEveryHours || 24),
    },
    content: {
      logoUrl: json?.config?.logoUrl || "",
      title: [json?.config?.titleLine1 || "", json?.config?.titleLine2 || ""],
      subtitle: [
        json?.config?.subtitleLine1 || "",
        json?.config?.subtitleLine2 || "",
        json?.config?.subtitleLine3 || "",
      ],
      footerBadgeText: json?.config?.footerBadgeText || "",
      ctaText: json?.config?.ctaText || "¡Contactar ya!",
    },
    typography: {
      fontFamily: "system",
      title: { sizePx: 28, weight: 700 },
      subtitle: { sizePx: 16, weight: 400 },
      cta: { sizePx: 18, weight: 700 },
      badge: { sizePx: 12, weight: 700 },
    },
    colors: {
      title: json?.config?.titleColor || "#FFFFFF",
      subtitle: json?.config?.subtitleColor || "#FFFFFF",
      badge: json?.config?.footerBadgeColor || "#FFD700",
      ctaText: json?.config?.ctaTextColor || "#000000",
      ctaBackground: json?.config?.ctaBackgroundColor || "#25D366",
      ctaGlow: json?.config?.ctaGlowColor || "#000000",
    },
    layout: {
      ctaPosition: "between_title_and_info",
    },
  };

  return cfg;
}

// OJO: el phone lo fetcharemos desde el cliente al click (no cache)
export async function fetchLandingPhone(name: string): Promise<LandingPhoneResponse> {
  const base = process.env.SUPABASE_EDGE_BASE!;
  const url = `${base}/functions/v1/landing-phone?name=${encodeURIComponent(name)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`landing-phone HTTP ${res.status}`);
  return res.json();
}
