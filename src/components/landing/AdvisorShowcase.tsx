import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, User, Brain, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const AdvisorShowcase = () => {
  const { data: personas = [], isLoading: lp } = useQuery({
    queryKey: ['showcase-personas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_personas').select('id, name, title, description, avatar, color, tags').eq('is_active', true).limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: frameworks = [], isLoading: lf } = useQuery({
    queryKey: ['showcase-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_frameworks').select('id, name, title, description, icon, color, mental_models').eq('is_active', true).limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: books = [], isLoading: lb } = useQuery({
    queryKey: ['showcase-books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_books').select('id, title, author, description, cover_emoji, color, genres').eq('is_active', true).limit(6);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = lp || lf || lb;

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Your Board of Advisors</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Chat with legendary thinkers, mental frameworks, or timeless books.</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <Tabs defaultValue="personas" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-10">
              <TabsTrigger value="personas" className="gap-2"><User className="w-4 h-4" /> Personas</TabsTrigger>
              <TabsTrigger value="frameworks" className="gap-2"><Brain className="w-4 h-4" /> Frameworks</TabsTrigger>
              <TabsTrigger value="books" className="gap-2"><BookOpen className="w-4 h-4" /> Books</TabsTrigger>
            </TabsList>

            <TabsContent value="personas">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personas.map((persona, index) => (
                  <motion.div key={persona.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
                    <Link to={`/persona/${persona.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${persona.color || 'from-purple-500 to-indigo-700'} flex items-center justify-center text-2xl shadow-soft`}>{persona.avatar || '🧠'}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-serif font-semibold group-hover:text-primary transition-colors">{persona.name}</h3>
                            <p className="text-sm text-muted-foreground">{persona.title}</p>
                          </div>
                        </div>
                        <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed line-clamp-2">{persona.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {persona.tags?.slice(0, 3).map((tag: string) => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{tag}</span>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Start Chat <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="frameworks">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {frameworks.map((advisor, index) => (
                  <motion.div key={advisor.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Link to={`/chat/${advisor.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${advisor.color || 'from-blue-500 to-cyan-700'} flex items-center justify-center text-2xl shadow-soft`}>{advisor.icon || '🎯'}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-serif font-semibold group-hover:text-primary transition-colors">{advisor.name}</h3>
                            <p className="text-sm text-muted-foreground">{advisor.title}</p>
                          </div>
                        </div>
                        <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed">{advisor.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {advisor.mental_models?.slice(0, 3).map((model: string) => (
                            <span key={model} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{model}</span>
                          ))}
                          {(advisor.mental_models?.length || 0) > 3 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">+{(advisor.mental_models?.length || 0) - 3} more</span>
                          )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Start Conversation <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="books">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book, index) => (
                  <motion.div key={book.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.08 }}>
                    <Link to={`/book/${book.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${book.color || 'from-amber-500 to-orange-700'} flex items-center justify-center text-2xl shadow-soft`}>{book.cover_emoji || '📚'}</div>
                          <div className="flex-1">
                            <h3 className="text-lg font-serif font-semibold group-hover:text-primary transition-colors line-clamp-1">{book.title}</h3>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                          </div>
                        </div>
                        <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed line-clamp-2">{book.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {book.genres?.slice(0, 2).map((genre: string) => (
                            <span key={genre} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">{genre}</span>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                          Chat with Book <ArrowRight className="ml-2 w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-center mt-12">
          <Button asChild size="lg" variant="outline">
            <Link to="/advisors">View All Advisors <ArrowRight className="ml-2 w-4 h-4" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
