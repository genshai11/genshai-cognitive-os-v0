/**
 * Skill Generation Block Component
 * Renders in chat when AI suggests creating a new skill.
 * Calls the skill-generator edge function and shows result.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Wand2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SkillGenerationBlockProps {
  skillDescription: string;
  advisorId: string;
  context?: string;
}

export function SkillGenerationBlock({ skillDescription, advisorId, context }: SkillGenerationBlockProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skillName, setSkillName] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Please sign in to generate skills.');
        return;
      }

      const { data, error: fnError } = await supabase.functions.invoke('skill-generator', {
        body: { skillDescription, advisorId, context },
      });

      if (fnError) throw fnError;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      setSuccess(true);
      setSkillName(data.skill?.skill_name || 'New Skill');
      toast({ title: '✨ Skill Created!', description: 'Review it in your Skills Library.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate skill');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="my-4 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-primary" />
          Skill Suggestion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-secondary-foreground">{skillDescription}</p>

        {!isGenerating && !success && !error && (
          <Button onClick={handleGenerate} className="w-full">
            <Wand2 className="w-4 h-4 mr-2" />
            Generate & Save Skill
          </Button>
        )}

        {isGenerating && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Generating skill...</span>
          </div>
        )}

        {success && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span><strong>{skillName}</strong> created and pending review.</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/skills')}>
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Skills Library
            </Button>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
