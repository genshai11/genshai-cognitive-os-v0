import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { BookOpen, Lightbulb, Target, TrendingUp, Shield, Compass, Brain } from 'lucide-react';

const mentalModels = [
  {
    name: 'Inversion',
    category: 'Decision-Making',
    icon: Target,
    description: 'Instead of asking "How do I achieve X?", ask "What would guarantee I fail at X?" By identifying what to avoid, you systematically reduce costly mistakes.',
    attribution: 'Charlie Munger',
  },
  {
    name: 'First Principles Thinking',
    category: 'Problem-Solving',
    icon: Brain,
    description: 'Break down complex problems into their fundamental truths, then reason up from there. Don\'t rely on analogies or conventions.',
    attribution: 'Elon Musk / Aristotle',
  },
  {
    name: 'Circle of Competence',
    category: 'Self-Awareness',
    icon: Compass,
    description: 'Know the boundaries of your expertise. The size of your circle matters less than knowing where it ends.',
    attribution: 'Warren Buffett',
  },
  {
    name: 'Second-Order Thinking',
    category: 'Decision-Making',
    icon: TrendingUp,
    description: 'Don\'t just think about the immediate consequences. Ask "And then what?" to anticipate downstream effects.',
    attribution: 'Howard Marks',
  },
  {
    name: 'Margin of Safety',
    category: 'Risk Management',
    icon: Shield,
    description: 'Build buffers into your plans. The difference between what you can handle and what you actually face is your margin of safety.',
    attribution: 'Benjamin Graham',
  },
  {
    name: 'Dichotomy of Control',
    category: 'Philosophy',
    icon: Lightbulb,
    description: 'Focus only on what you can control. External events are not up to you, but your response to them is.',
    attribution: 'Epictetus',
  },
];

const Library = () => {
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentalModels.map((model, index) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <model.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{model.category}</span>
                    <h3 className="text-lg font-serif font-semibold">{model.name}</h3>
                  </div>
                </div>
                <p className="text-secondary-foreground/80 text-sm leading-relaxed mb-4">
                  {model.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  — {model.attribution}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-16 p-8 glass-card rounded-2xl"
          >
            <h3 className="text-2xl font-serif font-bold mb-2">More Models Coming Soon</h3>
            <p className="text-muted-foreground">
              We're continuously adding new mental models. Chat with an advisor to learn how to apply these frameworks.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Library;
