import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, Brain } from 'lucide-react';

interface CreatePersonaDialogProps {
  onCreated?: () => void;
}

export const CreatePersonaDialog = ({ onCreated }: CreatePersonaDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [wikiUrl, setWikiUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setGenerating(true);
    try {
      // Step 1: Fetch context if wiki URL provided
      let wikiContext = '';
      if (wikiUrl.trim()) {
        const { data: ctxData } = await supabase.functions.invoke('fetch-persona-context', {
          body: { url: wikiUrl.trim(), query: name },
        });
        if (ctxData?.content) wikiContext = ctxData.content;
      }

      // Step 2: Generate cognitive blueprint
      const { data, error } = await supabase.functions.invoke('generate-advisor', {
        body: { name: name.trim(), description: description.trim(), type: 'persona', wikiContext },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      // Step 3: Save to database
      const { error: insertError } = await supabase.from('custom_personas').insert({
        id: crypto.randomUUID(),
        name: name.trim(),
        title: data.title || name.trim(),
        description: data.description,
        tags: data.tags,
        color: data.color,
        wiki_url: wikiUrl.trim() || null,
        cognitive_blueprint: data.blueprint,
        system_prompt: data.systemPrompt || `You are ${name.trim()}. Respond authentically from this persona's perspective.`,
      });

      if (insertError) throw insertError;

      toast.success(`${name} advisor created!`);
      setName('');
      setDescription('');
      setWikiUrl('');
      setOpen(false);
      onCreated?.();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-sans">
          <Plus className="w-4 h-4" />
          Create Persona
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Create AI Persona
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-sans text-sm">Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Naval Ravikant, Ada Lovelace..." className="font-sans" />
          </div>
          <div className="space-y-2">
            <Label className="font-sans text-sm">Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief context about this persona..." className="font-sans" rows={2} />
          </div>
          <div className="space-y-2">
            <Label className="font-sans text-sm">Wikipedia / Reference URL (optional)</Label>
            <Input value={wikiUrl} onChange={(e) => setWikiUrl(e.target.value)} placeholder="https://en.wikipedia.org/wiki/..." className="font-sans" />
            <p className="text-xs text-muted-foreground font-sans">Adds real-world context for more authentic responses.</p>
          </div>
          <Button onClick={handleCreate} disabled={generating || !name.trim()} className="w-full gap-2 font-sans">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Blueprint...</> : 'Create Persona'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
