import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { Loader2, MessageSquare, Trash2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';

interface Conversation {
  id: string;
  advisor_id: string;
  advisor_type: string;
  updated_at: string;
  last_message?: string;
}

const HistoryContent = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch all advisor names for display
  const { data: allAdvisors = {} } = useQuery({
    queryKey: ['all-advisor-names'],
    queryFn: async () => {
      const map: Record<string, { name: string; icon: string; color: string; path: string }> = {};
      
      const [{ data: personas }, { data: frameworks }, { data: books }] = await Promise.all([
        supabase.from('custom_personas').select('id, name, avatar, color'),
        supabase.from('custom_frameworks').select('id, name, icon, color'),
        supabase.from('custom_books').select('id, title, cover_emoji, color'),
      ]);

      personas?.forEach(p => { map[p.id] = { name: p.name, icon: p.avatar || '🧠', color: p.color || 'from-purple-500 to-indigo-700', path: `/persona/${p.id}` }; });
      frameworks?.forEach(f => { map[f.id] = { name: f.name, icon: f.icon || '🎯', color: f.color || 'from-blue-500 to-cyan-700', path: `/chat/${f.id}` }; });
      books?.forEach(b => { map[b.id] = { name: b.title, icon: b.cover_emoji || '📚', color: b.color || 'from-amber-500 to-orange-700', path: `/book/${b.id}` }; });

      return map;
    },
  });

  const fetchConversations = async () => {
    if (!user) return;
    try {
      const { data: convs, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;

      const enrichedConvs = await Promise.all((convs || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        return { ...conv, last_message: lastMsg?.content || 'No messages yet' };
      }));

      setConversations(enrichedConvs as Conversation[]);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: "Error", description: "Failed to load chat history", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConversations(); }, [user]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
      setConversations(prev => prev.filter(c => c.id !== id));
      toast({ title: "Success", description: "Conversation deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete conversation", variant: "destructive" });
    }
  };

  const getAdvisorDetails = (id: string, type: string) => {
    const found = allAdvisors[id];
    if (found) return found;
    // Fallback for unknown advisors
    const path = type === 'persona' ? `/persona/${id}` : type === 'book' ? `/book/${id}` : `/chat/${id}`;
    return { name: id, icon: '💬', color: 'from-gray-500 to-gray-700', path };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold mb-2 tracking-tight">Chat History</h1>
          <p className="text-muted-foreground">Continue your previous discussions with advisors.</p>
        </div>
        <Button asChild variant="outline"><Link to="/advisors">New Chat</Link></Button>
      </div>

      {conversations.length === 0 ? (
        <Card className="bg-card/50 border-dashed border-2 py-12 text-center">
          <CardContent>
            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground mb-6">You haven't started any conversations yet.</p>
            <Button asChild><Link to="/advisors">Explore Advisors</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {conversations.map((conv) => {
            const details = getAdvisorDetails(conv.advisor_id, conv.advisor_type);
            return (
              <Link key={conv.id} to={details.path}>
                <Card className="group hover:border-primary/50 transition-all duration-300 bg-card/50 backdrop-blur-sm overflow-hidden border-border/50">
                  <div className="flex items-center p-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${details.color} flex items-center justify-center text-xl shrink-0 mr-4 shadow-sm group-hover:scale-110 transition-transform`}>
                      {details.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-lg truncate pr-4">{details.name}</h3>
                        <span className="text-xs text-muted-foreground flex items-center shrink-0">
                          <Calendar className="w-3 h-3 mr-1" />
                          {format(new Date(conv.updated_at), 'MMM d, p')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">"{conv.last_message}"</p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(conv.id, e)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

const History = () => (
  <ProtectedRoute>
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HistoryContent />
    </div>
  </ProtectedRoute>
);

export default History;
