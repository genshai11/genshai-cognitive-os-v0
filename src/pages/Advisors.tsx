import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, User, Brain, BookOpen } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { advisors } from '@/lib/advisors';
import { personaAdvisors } from '@/lib/persona-advisors';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_emoji: string | null;
  color: string | null;
  genres: string[] | null;
  key_concepts: string[] | null;
}

const Advisors = () => {
  const { data: books = [] } = useQuery({
    queryKey: ['all-books'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custom_books')
        .select('id, title, author, description, cover_emoji, color, genres, key_concepts')
        .eq('is_active', true);
      if (error) throw error;
      return data as Book[];
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
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
              Choose Your Advisor
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Chat with legendary thinkers, mental frameworks, or timeless books.
            </p>
          </motion.div>

          <Tabs defaultValue="personas" className="w-full">
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-10">
              <TabsTrigger value="personas" className="gap-2">
                <User className="w-4 h-4" />
                Personas
              </TabsTrigger>
              <TabsTrigger value="frameworks" className="gap-2">
                <Brain className="w-4 h-4" />
                Frameworks
              </TabsTrigger>
              <TabsTrigger value="books" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Books
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personas">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground mb-8"
              >
                Chat with AI versions of legendary thinkers, grounded in their real philosophies and writings.
              </motion.p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {personaAdvisors.map((persona, index) => (
                  <motion.div
                    key={persona.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <Link to={`/persona/${persona.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${persona.color} flex items-center justify-center text-2xl shadow-soft`}>
                            {persona.avatar}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-serif font-semibold group-hover:text-primary transition-colors">
                              {persona.name}
                            </h2>
                            <p className="text-sm text-muted-foreground">{persona.title}</p>
                          </div>
                        </div>
                        
                        <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed line-clamp-2">
                          {persona.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {persona.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center text-primary text-sm font-medium">
                          Start Chat
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="frameworks">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground mb-8"
              >
                Choose a thinking framework that applies specific mental models to your problems.
              </motion.p>
              <div className="grid md:grid-cols-2 gap-6">
                {advisors.map((advisor, index) => (
                  <motion.div
                    key={advisor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/chat/${advisor.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-8 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-5 mb-6">
                          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${advisor.color} flex items-center justify-center text-3xl shadow-soft`}>
                            {advisor.icon}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-2xl font-serif font-semibold group-hover:text-primary transition-colors">
                              {advisor.name}
                            </h2>
                            <p className="text-muted-foreground">{advisor.title}</p>
                          </div>
                        </div>
                        
                        <p className="text-secondary-foreground/80 mb-6 leading-relaxed">
                          {advisor.description}
                        </p>

                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-2">Mental Models:</p>
                          <div className="flex flex-wrap gap-2">
                            {advisor.mentalModels.map((model) => (
                              <span
                                key={model}
                                className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground"
                              >
                                {model}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center text-primary font-medium">
                          Start Conversation
                          <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="books">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-muted-foreground mb-8"
              >
                Explore wisdom from timeless books across philosophy, psychology, and self-development.
              </motion.p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book, index) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <Link to={`/book/${book.id}`} className="block group">
                      <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                        <div className="flex items-start gap-4 mb-4">
                          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${book.color || 'from-amber-500 to-orange-700'} flex items-center justify-center text-2xl shadow-soft`}>
                            {book.cover_emoji || '📚'}
                          </div>
                          <div className="flex-1">
                            <h2 className="text-xl font-serif font-semibold group-hover:text-primary transition-colors line-clamp-1">
                              {book.title}
                            </h2>
                            <p className="text-sm text-muted-foreground">{book.author}</p>
                          </div>
                        </div>
                        
                        <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed line-clamp-2">
                          {book.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {book.genres?.slice(0, 2).map((genre) => (
                            <span
                              key={genre}
                              className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center text-primary text-sm font-medium">
                          Chat with Book
                          <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Advisors;
