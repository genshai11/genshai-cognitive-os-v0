export interface PersonaAdvisor {
  id: string;
  name: string;
  title: string;
  description: string | null;
  avatar: string | null;
  color: string | null;
  tags: string[];
  wikiUrl?: string | null;
}
