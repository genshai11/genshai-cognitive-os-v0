import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { advisors } from '@/lib/advisors';

const Advisors = () => {
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
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4">
              Choose Your Advisor
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each advisor brings unique mental models and perspectives. 
              Select one to start a conversation.
            </p>
          </motion.div>

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
        </div>
      </main>
    </div>
  );
};

export default Advisors;
