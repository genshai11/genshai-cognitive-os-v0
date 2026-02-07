import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { Theme, getThemeById, themes } from "@/lib/themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ThemeContextValue {
  theme: Theme;
  themeId: string;
  setThemeId: (id: string) => void;
  themes: Theme[];
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const c = theme.colors;

  const vars: Record<string, string> = {
    "--background": c.background,
    "--foreground": c.foreground,
    "--card": c.card,
    "--card-foreground": c.cardForeground,
    "--popover": c.popover,
    "--popover-foreground": c.popoverForeground,
    "--primary": c.primary,
    "--primary-foreground": c.primaryForeground,
    "--secondary": c.secondary,
    "--secondary-foreground": c.secondaryForeground,
    "--accent": c.accent,
    "--accent-foreground": c.accentForeground,
    "--muted": c.muted,
    "--muted-foreground": c.mutedForeground,
    "--destructive": c.destructive,
    "--destructive-foreground": c.destructiveForeground,
    "--border": c.border,
    "--input": c.input,
    "--ring": c.ring,
    "--sidebar-background": c.sidebarBackground,
    "--sidebar-foreground": c.sidebarForeground,
    "--sidebar-primary": c.sidebarPrimary,
    "--sidebar-primary-foreground": c.sidebarPrimaryForeground,
    "--sidebar-accent": c.sidebarAccent,
    "--sidebar-accent-foreground": c.sidebarAccentForeground,
    "--sidebar-border": c.sidebarBorder,
    "--sidebar-ring": c.sidebarRing,
    "--glow-primary": c.glowPrimary,
    "--radius": theme.effects.borderRadius,
  };

  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));

  // Typography
  const body = document.body;
  body.style.fontFamily = `'${theme.typography.sans}', sans-serif`;

  // Heading family - update via a data attribute for CSS to pick up
  root.dataset.headingFamily = theme.typography.headingFamily;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [themeId, setThemeIdState] = useState(() => {
    return localStorage.getItem("preferred_theme") || "classic";
  });

  const theme = getThemeById(themeId);

  // Apply theme to DOM whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Load from DB on login
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_profiles")
      .select("preferred_theme")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.preferred_theme) {
          setThemeIdState(data.preferred_theme);
          localStorage.setItem("preferred_theme", data.preferred_theme);
        }
      });
  }, [user]);

  const setThemeId = useCallback(
    (id: string) => {
      setThemeIdState(id);
      localStorage.setItem("preferred_theme", id);
      if (user) {
        supabase
          .from("user_profiles")
          .update({ preferred_theme: id } as any)
          .eq("user_id", user.id)
          .then(() => {});
      }
    },
    [user]
  );

  return (
    <ThemeContext.Provider value={{ theme, themeId, setThemeId, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
}
