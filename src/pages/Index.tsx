import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/landing/Hero';
import { AdvisorShowcase } from '@/components/landing/AdvisorShowcase';
import { ValueProps } from '@/components/landing/ValueProps';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <Hero />
        <AdvisorShowcase />
        <ValueProps />
      </main>
      
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground">
          <p className="font-serif text-lg mb-2">MindBoard</p>
          <p className="text-sm">Your personal board of advisors. Think better, decide better.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
