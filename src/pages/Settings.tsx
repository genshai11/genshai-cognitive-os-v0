import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, User, MessageSquare, Sliders, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileInfoTab } from "@/components/settings/ProfileInfoTab";
import { ResponseStyleTab } from "@/components/settings/ResponseStyleTab";
import { CommunicationTab } from "@/components/settings/CommunicationTab";
import { PrivacyTab } from "@/components/settings/PrivacyTab";
import { ProfileCompletion } from "@/components/settings/ProfileCompletion";

export interface UserProfile {
  display_name: string | null;
  career_stage: string | null;
  industry: string | null;
  goals: string[];
  challenges: string[];
  interests: string[];
  preferred_response_style: string;
  formality_level: string;
  language_complexity: string;
  emoji_usage: string;
  bio: string | null;
  learning_style: string | null;
  onboarding_completed: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  display_name: null,
  career_stage: null,
  industry: null,
  goals: [],
  challenges: [],
  interests: [],
  preferred_response_style: "balanced",
  formality_level: "professional",
  language_complexity: "moderate",
  emoji_usage: "minimal",
  bio: null,
  learning_style: null,
  onboarding_completed: false,
};

const Settings = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hasProfileRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from("user_profiles")
        .select("display_name, career_stage, industry, goals, challenges, interests, preferred_response_style, formality_level, language_complexity, emoji_usage, bio, learning_style, onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        hasProfileRef.current = true;
        setProfile({
          display_name: data.display_name,
          career_stage: data.career_stage,
          industry: data.industry,
          goals: data.goals || [],
          challenges: data.challenges || [],
          interests: data.interests || [],
          preferred_response_style: data.preferred_response_style || "balanced",
          formality_level: data.formality_level || "professional",
          language_complexity: data.language_complexity || "moderate",
          emoji_usage: data.emoji_usage || "minimal",
          bio: data.bio,
          learning_style: data.learning_style,
          onboarding_completed: data.onboarding_completed || false,
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const saveProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return;
    setSaveStatus("saving");

    // Clear any pending debounce
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

    saveTimerRef.current = setTimeout(async () => {
      try {
        if (hasProfileRef.current) {
          const { error } = await supabase
            .from("user_profiles")
            .update(updates as any)
            .eq("user_id", user.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("user_profiles")
            .insert({ user_id: user.id, ...updates } as any);
          if (error) throw error;
          hasProfileRef.current = true;
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        toast.error("Failed to save");
        setSaveStatus("idle");
      }
    }, 500);
  }, [user]);

  const updateField = useCallback(<K extends keyof UserProfile>(key: K, value: UserProfile[K]) => {
    setProfile(prev => ({ ...prev, [key]: value }));
    saveProfile({ [key]: value });
  }, [saveProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto px-6 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Customize your profile and how advisors respond to you.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-primary">✓ Saved</span>
            )}
          </div>
        </div>

        <ProfileCompletion profile={profile} />

        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm">
              <User className="w-4 h-4 hidden sm:block" /> Profile
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-1.5 text-xs sm:text-sm">
              <MessageSquare className="w-4 h-4 hidden sm:block" /> Style
            </TabsTrigger>
            <TabsTrigger value="communication" className="gap-1.5 text-xs sm:text-sm">
              <Sliders className="w-4 h-4 hidden sm:block" /> Communication
            </TabsTrigger>
            <TabsTrigger value="privacy" className="gap-1.5 text-xs sm:text-sm">
              <Shield className="w-4 h-4 hidden sm:block" /> Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileInfoTab profile={profile} updateField={updateField} />
          </TabsContent>
          <TabsContent value="style">
            <ResponseStyleTab profile={profile} updateField={updateField} />
          </TabsContent>
          <TabsContent value="communication">
            <CommunicationTab profile={profile} updateField={updateField} />
          </TabsContent>
          <TabsContent value="privacy">
            <PrivacyTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
