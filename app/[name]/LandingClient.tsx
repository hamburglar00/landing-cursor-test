"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LandingPublicConfig } from "../../lib/types";

function normEmail(v: string | null) {
  return (v || "").trim().toLowerCase();
}

function normPhone(v: string | null) {
  let p = (v || "").replace(/\D+/g, "");
  if (p && p.length === 10) p = "54" + p;
  return p;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function safeUUID() {
  // @ts-ignore
  return globalThis.crypto?.randomUUID?.() || generateUUID();
}

function getOrCreateExternalId() {
  try {
    const k = "external_id";
    const ex = localStorage.getItem(k);
    if (ex) return ex;
    const id = safeUUID();
    localStorage.setItem(k, id);
    return id;
  } catch {
    return safeUUID();
  }
}

function normalizePhoneDigits(raw: any) {
  return String(raw || "").replace(/\D+/g, "").trim();
}

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return "mobile";
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  return "desktop";
}

async function fetchWithTimeout(url: string, ms = 2000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(t);
  }
}

export default function LandingClient({ config }: { config: LandingPublicConfig }) {
  const [overlay, setOverlay] = useState(false);
  const pickedRef = useRef<Promise<{ number: string; name?: string; meta?: any }> | null>(null);

  const qs = useMemo(() => new URLSearchParams(location.search), []);
  const userEmail = useMemo(() => normEmail(qs.get("email")), [qs]);
  const userPhone = useMemo(() => normPhone(qs.get("phone")), [qs]);

  // Pixel init + PageView
  useEffect(() => {
    const externalId = getOrCreateExternalId();

    (function (f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    // @ts-ignore
    window.fbq = window.fbq || function () {};

    try {
      // @ts-ignore
      fbq("init", config.tracking.pixelId, {
        external_id: externalId,
        em: userEmail || void 0,
        ph: userPhone || void 0,
        country: "AR",
      });
      // @ts-ignore
      fbq("track", "PageView");
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.tracking.pixelId]);

  // Prewarm phone (usa env pública de Vercel)
  useEffect(() => {
    if (!pickedRef.current) {
      pickedRef.current = (async () => {
        const base = process.env.NEXT_PUBLIC_SUPABASE_EDGE_BASE;
        if (!base) throw new Error("Missing NEXT_PUBLIC_SUPABASE_EDGE_BASE");

        const url = `${base}/functions/v1/landing-phone?name=${encodeURIComponent(config.name)}`;

        const res = await fetchWithTimeout(url, 2000);
        if (!res.ok) throw new Error("phone HTTP " + res.status);

        const data = await res.json();

        // tu landing-phone devuelve { phone: "..." } (según tu screenshot),
        // pero soportamos también { number: "..." } por compatibilidad.
        const number = normalizePhoneDigits(data?.phone ?? data?.number);
        if (!/^\d{8,17}$/.test(number)) throw new Error("invalid phone");

        return { number, name: data?.landingName || data?.name, meta: data };
      })();
    }
  }, [config.name]);

  function buildMensaje(promo: string) {
    const variantes = [
      `Hola! Vi este anuncio, me pasás info?`,
      `Hola! Vi el anuncio, podrías darme más info?`,
      `Buenas! Me contás un poco más del anuncio?`,
      `Hola! Quisiera saber más sobre lo que ofrecen.`,
      `Buenas! Me das más detalles por favor?`,
      `Hola! Estoy interesado, me contás cómo funciona?`,
      `Hola! Vi tu publicación, podrías ampliarme la info?`,
      `Holaaa! Me llamó la atención el anuncio, me contás más?`,
      `Hola! Vi tu publicidad, cómo es para registrarse?`,
      `Buenas! Me das información sobre cómo empezar?`,
    ];
    const base = variantes[Math.floor(Math.random() * variantes.length)];
    return promo ? `${base} ${promo}` : base;
  }

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    if (overlay) return;

    setOverlay(true);

    // 1) phone
    let picked: { number: string; name?: string; meta?: any };
    try {
      picked = await (pickedRef.current || Promise.reject("no prewarm"));
    } catch {
      setOverlay(false);
      return;
    }

    const cleanPhone = normalizePhoneDigits(picked.number);
    if (!/^\d{8,17}$/.test(cleanPhone)) {
      setOverlay(false);
      return;
    }

    // 2) promo + pixel contact
    const uuidSeg = generateUUID().replace(/-/g, "").slice(0, 12);
    const promo_code = `${config.tracking.landingTag}-${uuidSeg}`;
    const event_id = generateUUID();

    try {
      // @ts-ignore
      if (window.fbq)
        fbq(
          "track",
          "Contact",
          {
            content_name: "Botón WhatsApp",
            content_category: "LeadGen",
            event_source: "LandingPage",
            source: "main_button",
          },
          { eventID: event_id }
        );
    } catch {}

    // 3) track (no bloquea) -> server proxy a Sheets
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          postUrl: config.tracking.postUrl,
          payload: {
            event_name: "Contact",
            event_id,
            external_id: getOrCreateExternalId(),
            event_source_url: location.href,
            email: qs.get("email") || "",
            phone: qs.get("phone") || "",
            utm_campaign: qs.get("utm_campaign") || "",
            telefono_asignado: cleanPhone,
            device_type: getDeviceType(),
            promo_code,
            landing: config.name,
            tag: config.tracking.landingTag,
          },
        }),
      });
    } catch {}

    // 4) redirect
    const msg = buildMensaje(promo_code);
    window.location.assign(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
  }

  const ctaStyle: React.CSSProperties = {
    background: config.colors.ctaBackground,
    color: config.colors.ctaText,
    fontSize: config.typography.cta.sizePx,
    fontWeight: config.typography.cta.weight,
    // @ts-ignore - CSS variable
    ["--cta-glow"]: config.colors.ctaGlow,
  };

  return (
    <>
      <a
        className="whatsapp-button"
        href="#"
        onClick={onClick}
        aria-label="Crear usuario por WhatsApp"
        style={ctaStyle}
      >
        <span>{config.content.ctaText}</span>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="whatsapp"
          className="whatsapp-icon"
          width={24}
          height={24}
          decoding="async"
          loading="lazy"
        />
      </a>

      <div className="wa-redirect-overlay" hidden={!overlay}>
        <div className="wa-redirect-box">
          <div className="wa-redirect-spinner"></div>
          <div className="wa-redirect-text">Abriendo WhatsApp...</div>
        </div>
      </div>
    </>
  );
}
