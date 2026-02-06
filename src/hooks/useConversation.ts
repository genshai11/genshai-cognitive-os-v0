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

const MEMORY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/memory-manager`;
const DETECT_STYLE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/detect-response-style`;

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
        .insert({ user_id: user.id, advisor_id: advisorId, advisor_type: advisorType })
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

      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', convId);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [ensureConversation]);

  // Extract profile from conversation (background, after assistant responds)
  const extractProfile = useCallback(async (allMessages: Message[]) => {
    if (!user || allMessages.length < 2) return;
    
    try {
      // Only extract every 5 messages to avoid excessive calls
      if (allMessages.length % 5 !== 0) return;

      fetch(MEMORY_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: 'extract_profile',
          userId: user.id,
          messages: allMessages.slice(-6),
        }),
      }).catch(e => console.error('Profile extraction error:', e));
    } catch (e) {
      console.error('Profile extraction error:', e);
    }
  }, [user]);

  // Detect response style every 10 messages (background, non-blocking)
  const detectStyle = useCallback(async (allMessages: Message[]) => {
    if (!user || allMessages.length < 10) return;
    
    // Only run every 10 messages
    if (allMessages.length % 10 !== 0) return;

    try {
      fetch(DETECT_STYLE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          userId: user.id,
          messages: allMessages.slice(-20),
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.updated) {
            console.log(`Style auto-updated to: ${data.detected_style}`);
          }
        })
        .catch(e => console.error('Style detection error:', e));
    } catch (e) {
      console.error('Style detection error:', e);
    }
  }, [user]);

  // Add message to local state
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
    extractProfile,
    detectStyle,
    setMessages,
    resetConversation,
    userId: user?.id,
  };
};
