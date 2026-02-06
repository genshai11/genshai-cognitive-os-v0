import { RESPONSE_STYLES, STYLE_IDS, type ResponseStyleId } from "@/lib/response-styles";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/pages/Settings";

interface Props {
  profile: UserProfile;
  updateField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
}

export const ResponseStyleTab = ({ profile, updateField }: Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold font-serif mb-1">Response Style</h2>
        <p className="text-sm text-muted-foreground">
          Choose how AI advisors structure their responses. This applies globally and can be overridden per-advisor.
        </p>
      </div>

      <div className="grid gap-3">
        {STYLE_IDS.map((id) => {
          const style = RESPONSE_STYLES[id];
          const isSelected = profile.preferred_response_style === id;
          return (
            <button
              key={id}
              onClick={() => updateField("preferred_response_style", id)}
              className={cn(
                "relative w-full text-left p-5 rounded-xl border transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
              )}
            >
              <div className="flex items-start gap-4">
                <span className="text-2xl mt-0.5">{style.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{style.name}</span>
                    {id === "balanced" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{style.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1 italic">{style.example}</p>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
