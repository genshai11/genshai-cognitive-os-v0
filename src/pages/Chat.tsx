import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Loader2 } from 'lucide-react';

const Chat = () => {
  const { advisorId } = useParams<{ advisorId: string }>();

  const { data: advisor, isLoading } = useQuery({
    queryKey: ['framework', advisorId],
    queryFn: async () => {
      if (!advisorId) return null;
      const { data, error } = await supabase
        .from('custom_frameworks')
        .select('id, name, title, description, icon, color, mental_models')
        .eq('id', advisorId)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        name: data.name,
        title: data.title,
        description: data.description,
        icon: data.icon,
        color: data.color,
        mentalModels: data.mental_models || [],
      };
    },
    enabled: !!advisorId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!advisor) {
    return <Navigate to="/advisors" replace />;
  }

  return <ChatInterface advisor={advisor} />;
};

export default Chat;
