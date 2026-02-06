import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { UserProfile } from "@/pages/Settings";

const CAREER_STAGES = [
  "Student", "Early Career", "Mid-Career", "Senior", "Executive", "Entrepreneur", "Career Changer", "Retired",
];

const INDUSTRY_SUGGESTIONS = [
  "Technology", "Finance", "Healthcare", "Education", "Marketing", "Design", "Engineering",
  "Consulting", "Real Estate", "Media", "Non-profit", "Government", "Legal", "Science",
];

interface Props {
  profile: UserProfile;
  updateField: <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => void;
}

const TagEditor = ({
  label,
  description,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  description: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) => {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  };

  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <p className="text-xs text-muted-foreground mt-0.5 mb-2">{description}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          placeholder={placeholder}
          className="text-sm"
        />
        <Button type="button" variant="outline" size="icon" onClick={addTag} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export const ProfileInfoTab = ({ profile, updateField }: Props) => {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold font-serif">Basic Information</h2>

        <div>
          <Label htmlFor="display_name">Display Name</Label>
          <Input
            id="display_name"
            value={profile.display_name || ""}
            onChange={(e) => updateField("display_name", e.target.value || null)}
            placeholder="How should advisors address you?"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profile.bio || ""}
            onChange={(e) => updateField("bio", e.target.value || null)}
            placeholder="Brief description about yourself..."
            className="mt-1.5 min-h-[80px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Career Stage</Label>
            <Select
              value={profile.career_stage || ""}
              onValueChange={(v) => updateField("career_stage", v)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {CAREER_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input
              id="industry"
              value={profile.industry || ""}
              onChange={(e) => updateField("industry", e.target.value || null)}
              placeholder="e.g. Technology"
              className="mt-1.5"
              list="industry-suggestions"
            />
            <datalist id="industry-suggestions">
              {INDUSTRY_SUGGESTIONS.map((i) => <option key={i} value={i} />)}
            </datalist>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h2 className="text-lg font-semibold font-serif">Goals & Interests</h2>

        <TagEditor
          label="Goals"
          description="What are you working toward?"
          tags={profile.goals}
          onChange={(v) => updateField("goals", v)}
          placeholder="e.g. Start a business"
        />

        <TagEditor
          label="Challenges"
          description="What obstacles are you facing?"
          tags={profile.challenges}
          onChange={(v) => updateField("challenges", v)}
          placeholder="e.g. Time management"
        />

        <TagEditor
          label="Interests"
          description="Topics you enjoy exploring"
          tags={profile.interests}
          onChange={(v) => updateField("interests", v)}
          placeholder="e.g. AI, Philosophy"
        />
      </section>
    </div>
  );
};
