import { motion } from 'framer-motion';
import { ArrowRight, MessageSquare, User, Brain, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const chatOptions = [
  {
    icon: User,
    label: 'Personas',
    description: 'Chat with legendary thinkers',
    tab: 'personas',
  },
  {
    icon: Brain,
    label: 'Frameworks',
    description: 'Apply mental models',
    tab: 'frameworks',
  },
  {
    icon: BookOpen,
    label: 'Books',
    description: 'Converse with timeless books',
    tab: 'books',
  },
];

export const ChatCTA = () => {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <MessageSquare className="w-4 h-4" />
            Start Now
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Who do you want to <span className="text-gradient">ask</span> today?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Pick an advisor and start a conversation to get fresh perspectives on your challenges.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {chatOptions.map((option, index) => (
            <motion.div
              key={option.tab}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to="/advisors" className="block group">
                <div className="glass-card rounded-2xl p-6 text-center transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <option.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-serif font-semibold mb-1">{option.label}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{option.description}</p>
                  <span className="inline-flex items-center text-primary text-sm font-medium">
                    Start Chat
                    <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button asChild size="lg" className="text-lg px-10 py-6 glow-ring">
            <Link to="/advisors">
              View All Advisors
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
