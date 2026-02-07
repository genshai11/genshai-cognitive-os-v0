import { Header } from '@/components/layout/Header';
import { SkillsLibrary } from '@/components/skills/SkillsLibrary';

const Skills = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <SkillsLibrary />
      </main>
    </div>
  );
};

export default Skills;
