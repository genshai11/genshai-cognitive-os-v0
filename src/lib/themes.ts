export interface Theme {
  id: string;
  name: string;
  description: string;
  emoji: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
    sidebarBackground: string;
    sidebarForeground: string;
    sidebarPrimary: string;
    sidebarPrimaryForeground: string;
    sidebarAccent: string;
    sidebarAccentForeground: string;
    sidebarBorder: string;
    sidebarRing: string;
    glowPrimary: string;
  };
  typography: {
    sans: string;
    serif: string;
    headingFamily: "sans" | "serif";
  };
  effects: {
    glassmorphism: boolean;
    blur: "none" | "sm" | "md" | "lg" | "xl";
    shadows: "none" | "subtle" | "normal" | "bold";
    borderRadius: string;
  };
}

// ── Classic (Current Default) ──
const classic: Theme = {
  id: "classic",
  name: "Classic",
  description: "Warm, sophisticated wisdom aesthetic",
  emoji: "📜",
  colors: {
    background: "220 15% 8%",
    foreground: "40 15% 95%",
    card: "220 14% 11%",
    cardForeground: "40 15% 95%",
    popover: "220 14% 13%",
    popoverForeground: "40 15% 95%",
    primary: "38 85% 55%",
    primaryForeground: "220 15% 8%",
    secondary: "220 12% 18%",
    secondaryForeground: "40 10% 85%",
    accent: "38 75% 45%",
    accentForeground: "220 15% 8%",
    muted: "220 12% 15%",
    mutedForeground: "220 10% 55%",
    destructive: "0 65% 50%",
    destructiveForeground: "40 15% 95%",
    border: "220 12% 20%",
    input: "220 12% 18%",
    ring: "38 85% 55%",
    sidebarBackground: "220 14% 10%",
    sidebarForeground: "40 10% 85%",
    sidebarPrimary: "38 85% 55%",
    sidebarPrimaryForeground: "220 15% 8%",
    sidebarAccent: "220 12% 15%",
    sidebarAccentForeground: "40 15% 95%",
    sidebarBorder: "220 12% 18%",
    sidebarRing: "38 85% 55%",
    glowPrimary: "38 85% 55%",
  },
  typography: { sans: "Inter", serif: "Playfair Display", headingFamily: "serif" },
  effects: { glassmorphism: true, blur: "xl", shadows: "normal", borderRadius: "0.75rem" },
};

// ── Modern Dark ──
const modernDark: Theme = {
  id: "modern-dark",
  name: "Modern Dark",
  description: "Deep blacks with electric blue accents",
  emoji: "🌑",
  colors: {
    background: "240 10% 4%",
    foreground: "210 20% 95%",
    card: "240 8% 7%",
    cardForeground: "210 20% 95%",
    popover: "240 8% 9%",
    popoverForeground: "210 20% 95%",
    primary: "210 100% 55%",
    primaryForeground: "0 0% 100%",
    secondary: "240 6% 12%",
    secondaryForeground: "210 15% 80%",
    accent: "210 90% 50%",
    accentForeground: "0 0% 100%",
    muted: "240 6% 10%",
    mutedForeground: "240 5% 50%",
    destructive: "0 70% 50%",
    destructiveForeground: "0 0% 100%",
    border: "240 6% 14%",
    input: "240 6% 12%",
    ring: "210 100% 55%",
    sidebarBackground: "240 8% 6%",
    sidebarForeground: "210 15% 80%",
    sidebarPrimary: "210 100% 55%",
    sidebarPrimaryForeground: "0 0% 100%",
    sidebarAccent: "240 6% 10%",
    sidebarAccentForeground: "210 20% 95%",
    sidebarBorder: "240 6% 14%",
    sidebarRing: "210 100% 55%",
    glowPrimary: "210 100% 55%",
  },
  typography: { sans: "Inter", serif: "Inter", headingFamily: "sans" },
  effects: { glassmorphism: false, blur: "sm", shadows: "subtle", borderRadius: "0.5rem" },
};

// ── Light & Airy ──
const lightAiry: Theme = {
  id: "light-airy",
  name: "Light & Airy",
  description: "Clean, bright, and easy on the eyes",
  emoji: "☁️",
  colors: {
    background: "0 0% 98%",
    foreground: "220 15% 15%",
    card: "0 0% 100%",
    cardForeground: "220 15% 15%",
    popover: "0 0% 100%",
    popoverForeground: "220 15% 15%",
    primary: "220 70% 50%",
    primaryForeground: "0 0% 100%",
    secondary: "220 15% 93%",
    secondaryForeground: "220 15% 30%",
    accent: "220 60% 55%",
    accentForeground: "0 0% 100%",
    muted: "220 10% 94%",
    mutedForeground: "220 10% 45%",
    destructive: "0 65% 50%",
    destructiveForeground: "0 0% 100%",
    border: "220 10% 88%",
    input: "220 10% 90%",
    ring: "220 70% 50%",
    sidebarBackground: "220 10% 96%",
    sidebarForeground: "220 15% 30%",
    sidebarPrimary: "220 70% 50%",
    sidebarPrimaryForeground: "0 0% 100%",
    sidebarAccent: "220 15% 93%",
    sidebarAccentForeground: "220 15% 15%",
    sidebarBorder: "220 10% 88%",
    sidebarRing: "220 70% 50%",
    glowPrimary: "220 70% 50%",
  },
  typography: { sans: "Inter", serif: "Playfair Display", headingFamily: "serif" },
  effects: { glassmorphism: false, blur: "none", shadows: "subtle", borderRadius: "0.75rem" },
};

// ── Nature / Zen ──
const natureZen: Theme = {
  id: "nature-zen",
  name: "Nature / Zen",
  description: "Earthy tones for mindful sessions",
  emoji: "🌿",
  colors: {
    background: "40 15% 8%",
    foreground: "40 10% 90%",
    card: "40 12% 11%",
    cardForeground: "40 10% 90%",
    popover: "40 12% 13%",
    popoverForeground: "40 10% 90%",
    primary: "140 35% 45%",
    primaryForeground: "40 15% 8%",
    secondary: "40 10% 17%",
    secondaryForeground: "40 8% 80%",
    accent: "140 30% 40%",
    accentForeground: "40 15% 8%",
    muted: "40 10% 14%",
    mutedForeground: "40 8% 50%",
    destructive: "0 55% 45%",
    destructiveForeground: "40 10% 90%",
    border: "40 10% 20%",
    input: "40 10% 17%",
    ring: "140 35% 45%",
    sidebarBackground: "40 12% 9%",
    sidebarForeground: "40 8% 80%",
    sidebarPrimary: "140 35% 45%",
    sidebarPrimaryForeground: "40 15% 8%",
    sidebarAccent: "40 10% 14%",
    sidebarAccentForeground: "40 10% 90%",
    sidebarBorder: "40 10% 20%",
    sidebarRing: "140 35% 45%",
    glowPrimary: "140 35% 45%",
  },
  typography: { sans: "Inter", serif: "Playfair Display", headingFamily: "serif" },
  effects: { glassmorphism: true, blur: "lg", shadows: "subtle", borderRadius: "1rem" },
};

// ── Vibrant / Creative ──
const vibrantCreative: Theme = {
  id: "vibrant-creative",
  name: "Vibrant / Creative",
  description: "Bold, saturated, and energizing",
  emoji: "🎨",
  colors: {
    background: "270 20% 8%",
    foreground: "0 0% 95%",
    card: "270 18% 12%",
    cardForeground: "0 0% 95%",
    popover: "270 18% 14%",
    popoverForeground: "0 0% 95%",
    primary: "330 85% 60%",
    primaryForeground: "0 0% 100%",
    secondary: "270 15% 18%",
    secondaryForeground: "0 0% 85%",
    accent: "280 70% 55%",
    accentForeground: "0 0% 100%",
    muted: "270 15% 15%",
    mutedForeground: "270 10% 55%",
    destructive: "0 70% 50%",
    destructiveForeground: "0 0% 100%",
    border: "270 12% 22%",
    input: "270 15% 18%",
    ring: "330 85% 60%",
    sidebarBackground: "270 18% 10%",
    sidebarForeground: "0 0% 85%",
    sidebarPrimary: "330 85% 60%",
    sidebarPrimaryForeground: "0 0% 100%",
    sidebarAccent: "270 15% 15%",
    sidebarAccentForeground: "0 0% 95%",
    sidebarBorder: "270 12% 22%",
    sidebarRing: "330 85% 60%",
    glowPrimary: "330 85% 60%",
  },
  typography: { sans: "Inter", serif: "Inter", headingFamily: "sans" },
  effects: { glassmorphism: true, blur: "lg", shadows: "bold", borderRadius: "0.75rem" },
};

// ── Minimalist / Focus ──
const minimalistFocus: Theme = {
  id: "minimalist-focus",
  name: "Minimalist / Focus",
  description: "Monochrome, distraction-free",
  emoji: "◻️",
  colors: {
    background: "0 0% 6%",
    foreground: "0 0% 90%",
    card: "0 0% 9%",
    cardForeground: "0 0% 90%",
    popover: "0 0% 11%",
    popoverForeground: "0 0% 90%",
    primary: "0 0% 85%",
    primaryForeground: "0 0% 6%",
    secondary: "0 0% 14%",
    secondaryForeground: "0 0% 75%",
    accent: "0 0% 70%",
    accentForeground: "0 0% 6%",
    muted: "0 0% 12%",
    mutedForeground: "0 0% 45%",
    destructive: "0 50% 45%",
    destructiveForeground: "0 0% 90%",
    border: "0 0% 18%",
    input: "0 0% 14%",
    ring: "0 0% 85%",
    sidebarBackground: "0 0% 7%",
    sidebarForeground: "0 0% 75%",
    sidebarPrimary: "0 0% 85%",
    sidebarPrimaryForeground: "0 0% 6%",
    sidebarAccent: "0 0% 12%",
    sidebarAccentForeground: "0 0% 90%",
    sidebarBorder: "0 0% 18%",
    sidebarRing: "0 0% 85%",
    glowPrimary: "0 0% 85%",
  },
  typography: { sans: "Inter", serif: "Inter", headingFamily: "sans" },
  effects: { glassmorphism: false, blur: "none", shadows: "none", borderRadius: "0.25rem" },
};

export const themes: Theme[] = [classic, modernDark, lightAiry, natureZen, vibrantCreative, minimalistFocus];

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || classic;
}
