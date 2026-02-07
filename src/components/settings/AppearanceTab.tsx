import { useThemeContext } from "@/hooks/useTheme";
import { Check } from "lucide-react";

export function AppearanceTab() {
  const { themeId, setThemeId, themes } = useThemeContext();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Theme</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose a visual theme that suits your mood and workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((t) => {
          const isActive = themeId === t.id;
          // Build mini swatch colors from the theme definition
          const bg = `hsl(${t.colors.background})`;
          const fg = `hsl(${t.colors.foreground})`;
          const primary = `hsl(${t.colors.primary})`;
          const card = `hsl(${t.colors.card})`;
          const muted = `hsl(${t.colors.muted})`;

          return (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              className={`relative rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                isActive
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              {isActive && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-3 h-3 text-primary-foreground" />
                </div>
              )}

              {/* Mini preview */}
              <div
                className="rounded-md overflow-hidden mb-3 h-20 flex items-end p-2 gap-1.5"
                style={{ background: bg }}
              >
                <div className="flex-1 rounded-sm h-10" style={{ background: card }} />
                <div className="flex-1 rounded-sm h-12" style={{ background: card }}>
                  <div className="h-2 w-3/4 rounded-full mt-2 mx-auto" style={{ background: primary }} />
                  <div className="h-1.5 w-1/2 rounded-full mt-1 mx-auto" style={{ background: muted }} />
                </div>
                <div className="flex-1 rounded-sm h-8" style={{ background: card }} />
              </div>

              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{t.emoji}</span>
                <span className="font-medium text-sm" style={{ color: fg }}>
                  {t.name}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{t.description}</p>

              {/* Color dots */}
              <div className="flex gap-1.5 mt-2">
                {[t.colors.primary, t.colors.accent, t.colors.secondary, t.colors.muted].map(
                  (c, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ background: `hsl(${c})` }}
                    />
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
