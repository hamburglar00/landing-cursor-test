const SUPABASE_URL = "https://fdkjkzpjqfbaavylapun.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka2prenBqcWZiYWF2eWxhcHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTUxMzIsImV4cCI6MjA4Nzc5MTEzMn0.pz-xgTvS9odcbHPUMyPlHCzNUTwQIfdZj_rIMy3IKkY";

function getLandingNameFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "default";
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`${url} -> ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function fetchLandingConfig(name) {
  const url = `${SUPABASE_URL}/functions/v1/builder-config?name=${encodeURIComponent(
    name,
  )}`;
  return fetchJson(url);
}

async function fetchLandingPhone(name) {
  const url = `${SUPABASE_URL}/functions/v1/landing-phone?name=${encodeURIComponent(
    name,
  )}`;
  try {
    const data = await fetchJson(url);
    if (data && typeof data.phone === "string") {
      return data.phone;
    }
  } catch (e) {
    console.error("Error obteniendo teléfono de landing-phone:", e);
  }
  return null;
}

function applyBackground(background) {
  const container = document.getElementById("background");
  if (!container || !background) return;

  const images = Array.isArray(background.images) ? background.images : [];
  const first = images[0];
  if (first) {
    container.style.backgroundImage = `url("${first}")`;
  }
}

function applyContent(content) {
  if (!content) return;
  const logoEl = document.getElementById("logo");
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const badgeEl = document.getElementById("badge");

  if (logoEl && content.logoUrl) {
    logoEl.src = content.logoUrl;
    logoEl.alt = content.title?.[0] || "Logo";
  }

  if (titleEl) {
    const lines = (content.title || []).filter(Boolean);
    titleEl.innerHTML = lines.join("<br />") || "Landing";
  }

  if (subtitleEl) {
    const lines = (content.subtitle || []).filter(Boolean);
    subtitleEl.innerHTML = lines.join("<br />");
  }

  if (badgeEl) {
    badgeEl.textContent = content.footerBadgeText || "";
  }

  const ctaTextEl = document.getElementById("ctaText");
  if (ctaTextEl) {
    ctaTextEl.textContent = content.ctaText || "Contactar";
  }
}

function mapFontFamily(token) {
  switch (token) {
    case "pp_mori":
      return '"PP Mori", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "roboto":
      return '"Roboto", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "poppins":
      return '"Poppins", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "montserrat":
      return '"Montserrat", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "bebas":
      return '"Bebas Neue", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "alpha":
      return '"Alpha", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "anton":
      return '"Anton", system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
    case "system":
    default:
      return 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Roboto", sans-serif';
  }
}

function applyTypography(typography) {
  if (!typography) return;
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const badgeEl = document.getElementById("badge");
  const ctaBtn = document.getElementById("whatsappButton");

  document.body.style.fontFamily = mapFontFamily(typography.fontFamily);

  if (titleEl && typography.title) {
    titleEl.style.fontSize = `${typography.title.sizePx || 22}px`;
    titleEl.style.fontWeight = `${typography.title.weight || 700}`;
  }
  if (subtitleEl && typography.subtitle) {
    subtitleEl.style.fontSize = `${typography.subtitle.sizePx || 18}px`;
    subtitleEl.style.fontWeight = `${typography.subtitle.weight || 400}`;
  }
  if (badgeEl && typography.badge) {
    badgeEl.style.fontSize = `${typography.badge.sizePx || 12}px`;
    badgeEl.style.fontWeight = `${typography.badge.weight || 700}`;
  }
  if (ctaBtn && typography.cta) {
    ctaBtn.style.fontSize = `${typography.cta.sizePx || 18}px`;
    ctaBtn.style.fontWeight = `${typography.cta.weight || 700}`;
  }
}

function applyColors(colors) {
  if (!colors) return;
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const badgeEl = document.getElementById("badge");
  const ctaBtn = document.getElementById("whatsappButton");
  const ctaTextEl = document.getElementById("ctaText");

  if (titleEl && colors.title) titleEl.style.color = colors.title;
  if (subtitleEl && colors.subtitle) subtitleEl.style.color = colors.subtitle;
  if (badgeEl && colors.badge) badgeEl.style.color = colors.badge;

  if (ctaBtn) {
    if (colors.ctaBackground) {
      ctaBtn.style.backgroundColor = colors.ctaBackground;
      ctaBtn.style.backgroundImage = "none";
    }
    if (colors.ctaGlow) {
      ctaBtn.style.boxShadow = `0 0 30px 8px ${colors.ctaGlow}, 0 10px 22px rgba(0,0,0,.45)`;
    }
  }
  if (ctaTextEl && colors.ctaText) {
    ctaTextEl.style.color = colors.ctaText;
  }
}

function configureWhatsappButton(phone, landingConfig) {
  const btn = document.getElementById("whatsappButton");
  if (!btn || !phone) return;

  const digits = String(phone).replace(/\D+/g, "");
  if (!digits) {
    console.warn("Teléfono inválido en landing-phone:", phone);
    btn.style.display = "none";
    return;
  }

  const url = new URL(`https://wa.me/${digits}`);
  const baseMessage = "Hola! Vi la landing, me pasás más info?";
  const suffix = landingConfig?.tracking?.landingTag
    ? ` (Landing: ${landingConfig.tracking.landingTag})`
    : "";

  url.searchParams.set("text", `${baseMessage}${suffix}`);
  btn.href = url.toString();
}

async function init() {
  const name = getLandingNameFromPath();
  try {
    const config = await fetchLandingConfig(name);

    applyBackground(config.background);
    applyContent(config.content);
    applyTypography(config.typography);
    applyColors(config.colors);

    const phone = await fetchLandingPhone(name);
    configureWhatsappButton(phone, config);
  } catch (e) {
    console.error("Error inicializando landing:", e);
    const titleEl = document.getElementById("title");
    if (titleEl) {
      titleEl.textContent = "No se pudo cargar la landing.";
    }
  }
}

init();

