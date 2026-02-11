import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { OpenClawExportPanel } from '@/components/openclaw/OpenClawExportPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, BookOpen, Lightbulb, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Advisor {
  id: string;
  name?: string;
  title?: string;
  type: 'persona' | 'framework' | 'book';
  hasBluePrint: boolean;
}

const OpenClawDashboard = () => {
  const { user } = useAuth();
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdvisors = async () => {
    setLoading(true);
    try {
      const [personasRes, frameworksRes, booksRes] = await Promise.all([
        supabase.from('custom_personas').select('id, name, cognitive_blueprint'),
        supabase.from('custom_frameworks').select('id, name, cognitive_blueprint'),
        supabase.from('custom_books').select('id, title, cognitive_blueprint'),
      ]);

      const all: Advisor[] = [];

      (personasRes.data || []).forEach((p: any) =>
        all.push({ id: p.id, name: p.name, type: 'persona', hasBluePrint: !!p.cognitive_blueprint })
      );
      (frameworksRes.data || []).forEach((f: any) =>
        all.push({ id: f.id, name: f.name, type: 'framework', hasBluePrint: !!f.cognitive_blueprint })
      );
      (booksRes.data || []).forEach((b: any) =>
        all.push({ id: b.id, title: b.title, type: 'book', hasBluePrint: !!b.cognitive_blueprint })
      );

      setAdvisors(all);
    } catch (e) {
      console.error('Failed to fetch advisors:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvisors();
  }, []);

  const withBlueprint = advisors.filter((a) => a.hasBluePrint);
  const withoutBlueprint = advisors.filter((a) => !a.hasBluePrint);

  const typeIcon = (type: string) => {
    if (type === 'persona') return <Brain className="w-4 h-4 text-primary" />;
    if (type === 'book') return <BookOpen className="w-4 h-4 text-primary" />;
    return <Lightbulb className="w-4 h-4 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
          {/* Header */}
          <div>
            <h1 className="font-serif text-3xl font-bold">OpenClaw Export</h1>
            <p className="text-muted-foreground font-sans mt-1">
              Export your advisors as OpenClaw-compatible SOUL.md, AGENTS.md, and SKILL.md files.
            </p>
          </div>

          {/* Info card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ExternalLink className="w-4 h-4 text-primary" />
                </div>
                <div className="text-sm font-sans">
                  <p className="font-medium text-foreground mb-1">What is OpenClaw?</p>
                  <p className="text-muted-foreground">
                    OpenClaw is an open-source AI agent framework. Export your cognitive blueprints as
                    SOUL.md (identity), AGENTS.md (reasoning), and SKILL.md (tools) files to use with
                    any OpenClaw-compatible gateway or agent runtime.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export panel */}
          <OpenClawExportPanel advisors={advisors} loading={loading} onRefresh={fetchAdvisors} />

          {/* Advisor overview */}
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">Advisor Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Stats cards */}
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-green-600">{withBlueprint.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium font-sans">Ready to Export</p>
                    <p className="text-xs text-muted-foreground">Has cognitive blueprint</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-amber-600">{withoutBlueprint.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium font-sans">Needs Blueprint</p>
                    <p className="text-xs text-muted-foreground">Generate blueprint first</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary">{advisors.length}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium font-sans">Total Advisors</p>
                    <p className="text-xs text-muted-foreground">Across all types</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advisor list */}
            {withBlueprint.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground font-sans">Exportable Advisors</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {withBlueprint.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {typeIcon(a.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium font-sans truncate">{a.name || a.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" title="Blueprint ready" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {withoutBlueprint.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground font-sans">Needs Blueprint</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {withoutBlueprint.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card opacity-60"
                    >
                      {typeIcon(a.type)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium font-sans truncate">{a.name || a.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{a.type}</p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="No blueprint" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OpenClawDashboard;
