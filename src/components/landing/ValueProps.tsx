import { motion } from 'framer-motion';
import { Brain, Users, Lightbulb, Zap } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Multiple Perspectives',
    description: 'See every problem through 5 different lenses. Each advisor brings unique mental models from their domain.'
  },
  {
    icon: Brain,
    title: 'Learn by Doing',
    description: 'Don\'t just read about mental models - practice applying them with guided coaching from each advisor.'
  },
  {
    icon: Lightbulb,
    title: 'Personalized Coaching',
    description: 'Advisors adapt to your specific context and goals. Get advice that\'s relevant to your situation.'
  },
  {
    icon: Zap,
    title: 'Available 24/7',
    description: 'Access world-class thinking frameworks whenever you need them. No scheduling, no waiting.'
  }
];

export const ValueProps = () => {
  return (
    <section className="py-24 px-6 bg-secondary/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            Why Mental Models Matter
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            The quality of your thinking determines the quality of your life. 
            Master the frameworks that the world's best thinkers use.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card rounded-2xl p-8"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-serif font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
