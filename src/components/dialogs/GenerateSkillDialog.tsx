import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, Zap } from 'lucide-react';

interface GenerateSkillDialogProps {
  onCreated?: () => void;
}

export const GenerateSkillDialog = ({ onCreated }: GenerateSkillDialogProps) => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [advisorId, setAdvisorId] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error('Skill description is required');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('skill-generator', {
        body: {
          skillDescription: description.trim(),
          advisorId: advisorId.trim() || 'general',
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success(`Skill "${data.skill?.skill_name || 'New skill'}" created!`);
      setDescription('');
      setAdvisorId('');
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
          Generate Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Generate New Skill
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-sans text-sm">What should this skill do? *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Calculate compound interest with inflation adjustment" className="font-sans" />
          </div>
          <div className="space-y-2">
            <Label className="font-sans text-sm">Advisor ID (optional)</Label>
            <Input value={advisorId} onChange={(e) => setAdvisorId(e.target.value)} placeholder="general" className="font-sans" />
            <p className="text-xs text-muted-foreground font-sans">Associate this skill with a specific advisor.</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating || !description.trim()} className="w-full gap-2 font-sans">
            {generating ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : 'Generate Skill'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
