import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BookOpen, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Library = () => {
  const { data: frameworks = [], isLoading } = useQuery({
    queryKey: ['library-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_frameworks')
        .select('id, name, title, description, icon, color, mental_models')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" />
              Mental Model Library
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
              Thinking Frameworks
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Explore the mental models used by world-class thinkers. 
              Each framework is a lens for seeing problems differently.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">Chưa có framework nào. Hãy thêm từ trang admin.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {frameworks.map((fw, index) => (
                <motion.div
                  key={fw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${fw.color || 'from-blue-500 to-cyan-700'} flex items-center justify-center text-2xl shadow-soft`}>
                      {fw.icon || '🎯'}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">{fw.title}</span>
                      <h3 className="text-lg font-serif font-semibold">{fw.name}</h3>
                    </div>
                  </div>
                  <p className="text-secondary-foreground/80 text-sm leading-relaxed mb-4">
                    {fw.description}
                  </p>
                  {fw.mental_models && fw.mental_models.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {fw.mental_models.slice(0, 4).map((model) => (
                        <span
                          key={model}
                          className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                        >
                          {model}
                        </span>
                      ))}
                      {fw.mental_models.length > 4 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          +{fw.mental_models.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Library;
