import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BookChatInterface } from '@/components/chat/BookChatInterface';
import { Loader2 } from 'lucide-react';

const BookChat = () => {
  const { bookId } = useParams<{ bookId: string }>();

  const { data: book, isLoading } = useQuery({
    queryKey: ['book', bookId],
    queryFn: async () => {
      if (!bookId) return null;
      const { data, error } = await supabase
        .from('custom_books')
        .select('*')
        .eq('id', bookId)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!book) {
    return <Navigate to="/advisors" replace />;
  }

  return <BookChatInterface book={book} />;
};

export default BookChat;
