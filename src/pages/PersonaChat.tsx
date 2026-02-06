import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PersonaChatInterface } from '@/components/chat/PersonaChatInterface';
import { Loader2 } from 'lucide-react';

const PersonaChat = () => {
  const { personaId } = useParams<{ personaId: string }>();

  const { data: persona, isLoading } = useQuery({
    queryKey: ['persona', personaId],
    queryFn: async () => {
      if (!personaId) return null;
      const { data, error } = await supabase
        .from('custom_personas')
        .select('id, name, title, description, avatar, color, tags, wiki_url')
        .eq('id', personaId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        title: data.title,
        description: data.description,
        avatar: data.avatar,
        color: data.color,
        tags: data.tags || [],
        wikiUrl: data.wiki_url,
      };
    },
    enabled: !!personaId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!persona) {
    return <Navigate to="/advisors" replace />;
  }

  return <PersonaChatInterface persona={persona} />;
};

export default PersonaChat;
