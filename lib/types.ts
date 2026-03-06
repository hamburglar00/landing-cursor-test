export type LandingPublicConfig = {
  schemaVersion: number;
  updatedAt: string;
  id: string;
  name: string;
  comment?: string;

  tracking: {
    pixelId: string;
    postUrl: string;     // Google Apps Script URL
    landingTag: string;  // ej TG1
  };

  background: {
    mode: "single" | "rotating";
    images: string[];
    rotateEveryHours: number;
  };

  content: {
    logoUrl: string;
    title: string[];      // 2 líneas
    subtitle: string[];   // 3 líneas
    footerBadgeText: string;
    ctaText: string;
  };

  typography: {
    fontFamily: "system" | string;
    title: { sizePx: number; weight: number };
    subtitle: { sizePx: number; weight: number };
    cta: { sizePx: number; weight: number };
    badge: { sizePx: number; weight: number };
  };

  colors: {
    title: string;
    subtitle: string;
    badge: string;
    ctaText: string;
    ctaBackground: string;
    ctaGlow: string;
  };

  layout: {
    ctaPosition: "between_title_and_info" | string;
  };
};

export type LandingPhoneResponse = {
  number: string; // digits only
  name?: string;
};
