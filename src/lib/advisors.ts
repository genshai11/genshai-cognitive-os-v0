export interface Advisor {
  id: string;
  name: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  mentalModels: string[];
}
