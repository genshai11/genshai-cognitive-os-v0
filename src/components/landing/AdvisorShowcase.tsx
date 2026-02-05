import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { advisors } from '@/lib/advisors';
import { Button } from '@/components/ui/button';

export const AdvisorShowcase = () => {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Your Board of Advisors
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Each advisor brings a unique perspective shaped by their expertise and mental models.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advisors.map((advisor, index) => (
            <motion.div
              key={advisor.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/chat/${advisor.id}`} className="block group">
                <div className="glass-card rounded-2xl p-6 h-full transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${advisor.color} flex items-center justify-center text-2xl shadow-soft`}>
                      {advisor.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-serif font-semibold group-hover:text-primary transition-colors">
                        {advisor.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{advisor.title}</p>
                    </div>
                  </div>
                  
                  <p className="text-secondary-foreground/80 text-sm mb-4 leading-relaxed">
                    {advisor.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {advisor.mentalModels.slice(0, 3).map((model) => (
                      <span
                        key={model}
                        className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground"
                      >
                        {model}
                      </span>
                    ))}
                    {advisor.mentalModels.length > 3 && (
                      <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                        +{advisor.mentalModels.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Start Conversation
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-12"
        >
          <Button asChild size="lg" variant="outline">
            <Link to="/advisors">
              View All Advisors
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
