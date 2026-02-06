import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/pages/Settings";

interface Props {
  profile: UserProfile;
  updateField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
}

interface OptionCard {
  id: string;
  icon: string;
  label: string;
  description: string;
}

const FORMALITY_OPTIONS: OptionCard[] = [
  { id: "very_casual", icon: "😊", label: "Very Casual", description: "Like texting a friend" },
  { id: "casual", icon: "👋", label: "Casual", description: "Friendly but clear" },
  { id: "professional", icon: "💼", label: "Professional", description: "Balanced and clear" },
  { id: "formal", icon: "🎩", label: "Formal", description: "Business-like tone" },
];

const COMPLEXITY_OPTIONS: OptionCard[] = [
  { id: "simple", icon: "🌱", label: "Simple", description: "Explain like I'm 5" },
  { id: "moderate", icon: "📘", label: "Moderate", description: "Standard explanations" },
  { id: "advanced", icon: "🧬", label: "Advanced", description: "Technical terms OK" },
];

const EMOJI_OPTIONS: OptionCard[] = [
  { id: "none", icon: "🚫", label: "None", description: "Text only responses" },
  { id: "minimal", icon: "👌", label: "Minimal", description: "Occasional emphasis" },
  { id: "moderate", icon: "✨", label: "Moderate", description: "Natural, expressive" },
  { id: "frequent", icon: "🎉", label: "Frequent", description: "Emoji-rich responses" },
];

const OptionGroup = ({
  title,
  description,
  options,
  value,
  onChange,
}: {
  title: string;
  description: string;
  options: OptionCard[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <section>
    <h3 className="text-base font-semibold mb-0.5">{title}</h3>
    <p className="text-sm text-muted-foreground mb-3">{description}</p>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {options.map((opt) => {
        const isSelected = value === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={cn(
              "relative text-center p-4 rounded-xl border transition-all duration-200",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:border-primary/40"
            )}
          >
            <span className="text-2xl block mb-1">{opt.icon}</span>
            <span className="text-sm font-medium text-foreground block">{opt.label}</span>
            <span className="text-xs text-muted-foreground block mt-0.5">{opt.description}</span>
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  </section>
);

export const CommunicationTab = ({ profile, updateField }: Props) => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold font-serif mb-1">Communication Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Fine-tune the tone and style of advisor responses beyond the base response style.
        </p>
      </div>

      <OptionGroup
        title="Formality Level"
        description="How formal should responses feel?"
        options={FORMALITY_OPTIONS}
        value={profile.formality_level}
        onChange={(v) => updateField("formality_level", v)}
      />

      <OptionGroup
        title="Language Complexity"
        description="How technical or simple should explanations be?"
        options={COMPLEXITY_OPTIONS}
        value={profile.language_complexity}
        onChange={(v) => updateField("language_complexity", v)}
      />

      <OptionGroup
        title="Emoji Usage"
        description="How much should advisors use emoji?"
        options={EMOJI_OPTIONS}
        value={profile.emoji_usage}
        onChange={(v) => updateField("emoji_usage", v)}
      />
    </div>
  );
};
