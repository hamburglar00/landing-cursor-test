import type { Metadata } from "next";
import { fetchLandingConfig } from "@/lib/config";
import LandingClient from "./LandingClient";

// Evita que Vercel intente pre-renderizar en build (y llame a Supabase sin env)
export const dynamic = "force-dynamic";

function pickBackground(cfg: Awaited<ReturnType<typeof fetchLandingConfig>>): string | null {
  const imgs = cfg.background?.images || [];
  if (!imgs.length) return null;

  if (cfg.background.mode === "single" || imgs.length === 1) return imgs[0];

  const hours = Math.max(1, Number(cfg.background.rotateEveryHours || 24));
  const slotMs = hours * 60 * 60 * 1000;
  const idx = Math.floor(Date.now() / slotMs) % imgs.length;
  return imgs[idx];
}

export async function generateMetadata({ params }: { params: { name: string } }): Promise<Metadata> {
  return { title: params.name };
}

export default async function LandingPage({ params }: { params: { name: string } }) {
  const cfg = await fetchLandingConfig(params.name);
  const bg = pickBackground(cfg);

  return (
    <>
      {/* preload del fondo elegido */}
      {bg ? (
        <link rel="preload" as="image" href={bg} fetchPriority="high" />
      ) : null}

      <div
        className="background-image"
        style={{ backgroundImage: bg ? `url("${bg}")` : undefined }}
      >
        <div className="overlay" />
        <div className="content">
          {cfg.content.logoUrl ? (
            <img
              src={cfg.content.logoUrl}
              className="logo"
              alt="Logo"
              decoding="async"
              fetchPriority="high"
            />
          ) : null}

          {/* Title */}
          <p
            className="title"
            style={{
              color: cfg.colors.title,
              fontSize: cfg.typography.title.sizePx,
              fontWeight: cfg.typography.title.weight,
              fontFamily: cfg.typography.fontFamily === "system" ? undefined : cfg.typography.fontFamily,
            }}
          >
            {(cfg.content.title?.[0] || "")}
            <br />
            {(cfg.content.title?.[1] || "")}
          </p>

          {/* Cliente: botón + pixel + phone + track */}
          <LandingClient config={cfg} />

          {/* Subtitle */}
          <p
            className="subtitle"
            style={{
              color: cfg.colors.subtitle,
              fontSize: cfg.typography.subtitle.sizePx,
              fontWeight: cfg.typography.subtitle.weight,
              fontFamily: cfg.typography.fontFamily === "system" ? undefined : cfg.typography.fontFamily,
            }}
          >
            {(cfg.content.subtitle?.[0] || "")}<br />
            {(cfg.content.subtitle?.[1] || "")}<br />
            {(cfg.content.subtitle?.[2] || "")}
          </p>

          <p
            className="description"
            style={{
              color: cfg.colors.badge,
              fontSize: cfg.typography.badge.sizePx,
              fontWeight: cfg.typography.badge.weight,
            }}
          >
            {cfg.content.footerBadgeText}
          </p>
        </div>
      </div>
    </>
  );
}
