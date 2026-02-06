import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const GENERATE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-advisor`;

export function useGenerateAdvisor() {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const generate = async (type: 'persona' | 'book' | 'framework', input: Record<string, string>) => {
    setGenerating(true);
    try {
      const resp = await fetch(GENERATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type, input }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Failed to generate');
      }

      const { generated } = await resp.json();
      toast({ title: '✨ AI Generated!', description: 'Fields have been auto-filled. Review and save.' });
      return generated;
    } catch (error: any) {
      console.error('Generate error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to generate advisor', variant: 'destructive' });
      return null;
    } finally {
      setGenerating(false);
    }
  };

  return { generate, generating };
}
