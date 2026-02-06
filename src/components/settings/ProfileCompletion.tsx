import { useMemo } from "react";
import type { UserProfile } from "@/pages/Settings";

export const ProfileCompletion = ({ profile }: { profile: UserProfile }) => {
  const { percentage, completed, total } = useMemo(() => {
    const checks = [
      !!profile.display_name,
      !!profile.career_stage,
      !!profile.industry,
      profile.goals.length > 0,
      profile.challenges.length > 0,
      profile.interests.length > 0,
      !!profile.bio,
      profile.preferred_response_style !== "balanced",
      profile.formality_level !== "professional",
    ];
    const completed = checks.filter(Boolean).length;
    return { percentage: Math.round((completed / checks.length) * 100), completed, total: checks.length };
  }, [profile]);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">Profile Completion</span>
        <span className="text-sm text-muted-foreground">{completed}/{total} fields</span>
      </div>
      <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        {percentage === 100
          ? "🎉 Profile complete! Advisors will provide the most personalized experience."
          : `Complete your profile for more personalized advisor responses.`}
      </p>
    </div>
  );
};
