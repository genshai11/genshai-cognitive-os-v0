import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface UseConversationProps {
  advisorId: string;
  advisorType: 'framework' | 'persona' | 'book';
}

export const useConversation = ({ advisorId, advisorType }: UseConversationProps) => {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Load or create conversation
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadConversation = async () => {
      try {
        // Find existing conversation
        const { data: existing, error: findError } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id)
          .eq('advisor_id', advisorId)
          .eq('advisor_type', advisorType)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (findError) throw findError;

        if (existing) {
          setConversationId(existing.id);
          
          // Load messages
          const { data: msgs, error: msgError } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', existing.id)
            .order('created_at', { ascending: true });

          if (msgError) throw msgError;
          setMessages((msgs || []) as Message[]);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [user, advisorId, advisorType]);

  // Create conversation if needed
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    
    if (conversationId) return conversationId;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          advisor_id: advisorId,
          advisor_type: advisorType,
        })
        .select('id')
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, [user, conversationId, advisorId, advisorType]);

  // Save message
  const saveMessage = useCallback(async (message: Message) => {
    const convId = await ensureConversation();
    if (!convId) return;

    try {
      await supabase.from('messages').insert({
        conversation_id: convId,
        role: message.role,
        content: message.content,
      });

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [ensureConversation]);

  // Add message to local state and save
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.map((m, i) => 
          i === prev.length - 1 ? { ...m, content } : m
        );
      }
      return [...prev, { role: 'assistant', content }];
    });
  }, []);

  // Reset conversation
  const resetConversation = useCallback(async () => {
    if (!conversationId) return;
    
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      
      setConversationId(null);
      setMessages([]);
    } catch (error) {
      console.error('Error resetting conversation:', error);
    }
  }, [conversationId]);

  return {
    messages,
    loading,
    addMessage,
    updateLastAssistantMessage,
    saveMessage,
    setMessages,
    resetConversation,
  };
};
