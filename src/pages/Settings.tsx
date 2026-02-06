import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { RESPONSE_STYLES, STYLE_IDS, type ResponseStyleId } from "@/lib/response-styles";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Settings = () => {
  const { user } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<ResponseStyleId>("balanced");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("preferred_response_style")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.preferred_response_style) {
        setSelectedStyle(data.preferred_response_style as ResponseStyleId);
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const savePreference = async (styleId: ResponseStyleId) => {
    if (!user) return;
    setSelectedStyle(styleId);
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("user_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("user_profiles")
          .update({ preferred_response_style: styleId })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_profiles")
          .insert({ user_id: user.id, preferred_response_style: styleId });
      }
      toast.success("Response style updated!");
    } catch {
      toast.error("Failed to save preference");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">
          Customize how AI advisors respond to you.
        </p>

        <section>
          <h2 className="text-xl font-semibold mb-1">Response Style</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Choose your preferred communication style. This applies to all advisors, personas, and books.
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-3">
              {STYLE_IDS.map((id) => {
                const style = RESPONSE_STYLES[id];
                const isSelected = selectedStyle === id;
                return (
                  <button
                    key={id}
                    onClick={() => savePreference(id)}
                    disabled={saving}
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
          )}
        </section>
      </main>
    </div>
  );
};

export default Settings;
