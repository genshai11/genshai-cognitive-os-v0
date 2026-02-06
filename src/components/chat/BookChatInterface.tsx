import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, ArrowLeft, Trash2, History as HistoryIcon, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useConversation } from '@/hooks/useConversation';
import { MessageContent } from './MessageContent';
import { AdvisorSwitcher } from './AdvisorSwitcher';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_emoji: string | null;
  color: string | null;
  system_prompt: string;
  key_concepts: string[] | null;
  genres: string[] | null;
}

interface BookChatInterfaceProps {
  book: Book;
}

const BOOK_CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-chat`;

export const BookChatInterface = ({ book }: BookChatInterfaceProps) => {
  const { messages, loading: conversationLoading, addMessage, updateLastAssistantMessage, saveMessage, resetConversation } = useConversation({
    advisorId: book.id,
    advisorType: 'book',
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input.trim() };
    addMessage(userMessage);
    saveMessage(userMessage);
    setInput('');
    setIsLoading(true);

    let assistantContent = '';

    try {
      const response = await fetch(BOOK_CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          bookId: book.id,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({ title: 'Rate limited', description: 'Please wait a moment and try again.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast({ title: 'Credits required', description: 'Please add funds to continue.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              updateLastAssistantMessage(assistantContent);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      if (assistantContent) {
        saveMessage({ role: 'assistant', content: assistantContent });
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({ 
        title: 'Something went wrong', 
        description: 'Failed to get a response. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (conversationLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link to="/advisors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${book.color || 'from-amber-500 to-orange-700'} flex items-center justify-center text-xl`}>
            {book.cover_emoji || '📚'}
          </div>
          <div className="flex-1">
            <h1 className="font-serif font-semibold line-clamp-1">{book.title}</h1>
            <p className="text-sm text-muted-foreground">{book.author}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <AdvisorSwitcher currentId={book.id} currentType="book" />

            <Button asChild variant="ghost" size="icon" title="History">
              <Link to="/history">
                <HistoryIcon className="w-5 h-5" />
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" title="Reset Chat" disabled={messages.length === 0}>
                  <Trash2 className="w-5 h-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Conversation?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete your entire chat history with "{book.title}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    resetConversation();
                    toast({ title: "Chat reset", description: "All messages have been deleted." });
                  }}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${book.color || 'from-amber-500 to-orange-700'} flex items-center justify-center text-4xl mb-6 shadow-glow`}>
                {book.cover_emoji || '📚'}
              </div>
              <h2 className="text-2xl font-serif font-bold mb-2">{book.title}</h2>
              <p className="text-muted-foreground mb-2">by {book.author}</p>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {book.description}
              </p>
              {book.key_concepts && book.key_concepts.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {book.key_concepts.slice(0, 5).map((concept) => (
                    <span key={concept} className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-sm">
                      {concept}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <BookOpen className="w-4 h-4" />
                Explore the wisdom within this book.
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <MessageContent content={message.content} />
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card/50 backdrop-blur-xl p-4">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about "${book.title}"...`}
            className="min-h-[52px] max-h-32 resize-none"
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-[52px] w-[52px]">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
