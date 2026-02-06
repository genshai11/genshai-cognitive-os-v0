import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Plus, Sparkles, Loader2, User, Brain, BookOpen, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useGenerateAdvisor } from '@/hooks/useGenerateAdvisor';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { GoodreadsImport } from './GoodreadsImport';

interface AdvisorSwitcherProps {
  currentId: string;
  currentType: 'persona' | 'framework' | 'book';
}

export const AdvisorSwitcher = ({ currentId, currentType }: AdvisorSwitcherProps) => {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [goodreadsOpen, setGoodreadsOpen] = useState(false);
  const [createType, setCreateType] = useState<'persona' | 'book' | 'framework'>('persona');
  const [createName, setCreateName] = useState('');
  const { generate, generating } = useGenerateAdvisor();
  const { toast } = useToast();

  const { data: books = [] } = useQuery({
    queryKey: ['switcher-books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_books').select('id, title, author, cover_emoji, color').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ['switcher-frameworks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_frameworks').select('id, name, icon, color').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: personas = [] } = useQuery({
    queryKey: ['switcher-personas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('custom_personas').select('id, name, avatar, color').eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  const navigateToAdvisor = (type: string, id: string) => {
    if (type === 'persona') navigate(`/persona/${id}`);
    else if (type === 'framework') navigate(`/chat/${id}`);
    else if (type === 'book') navigate(`/book/${id}`);
  };

  const handleQuickCreate = async () => {
    if (!createName.trim()) {
      toast({ title: 'Enter a name', description: 'Please enter a name to create an advisor', variant: 'destructive' });
      return;
    }

    const result = await generate(createType, { name: createName });
    if (!result) return;

    try {
      const id = createName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (createType === 'persona') {
        const { error } = await supabase.from('custom_personas').insert({
          id, name: result.name || createName, title: result.title || '', description: result.description || '',
          avatar: result.avatar || '🧠', color: result.color || 'from-blue-500 to-cyan-600',
          system_prompt: result.system_prompt || '', tags: result.tags || [], wiki_url: result.wiki_url || null,
        });
        if (error) throw error;
        toast({ title: '✨ Persona created!', description: `${result.name || createName} is ready` });
        setCreateOpen(false);
        navigateToAdvisor('persona', id);
      } else if (createType === 'book') {
        const { error } = await supabase.from('custom_books').insert({
          id, title: result.title || createName, author: result.author || 'Unknown', description: result.description || '',
          cover_emoji: result.cover_emoji || '📚', color: result.color || 'from-amber-500 to-orange-700',
          system_prompt: result.system_prompt || '', key_concepts: result.key_concepts || [], genres: result.genres || [],
        });
        if (error) throw error;
        toast({ title: '✨ Book created!', description: `${result.title || createName} is ready` });
        setCreateOpen(false);
        navigateToAdvisor('book', id);
      } else {
        const { error } = await supabase.from('custom_frameworks').insert({
          id, name: result.name || createName, title: result.title || '', description: result.description || '',
          icon: result.icon || '🎯', color: result.color || 'from-blue-500 to-cyan-700',
          system_prompt: result.system_prompt || '', mental_models: result.mental_models || [], example_questions: result.example_questions || [],
        });
        if (error) throw error;
        toast({ title: '✨ Framework created!', description: `${result.name || createName} is ready` });
        setCreateOpen(false);
        navigateToAdvisor('framework', id);
      }
    } catch (error: any) {
      console.error('Create error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to create advisor', variant: 'destructive' });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Switch Advisor">
            <ArrowLeftRight className="w-5 h-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 max-h-80 overflow-y-auto">
          <DropdownMenuLabel className="flex items-center gap-2"><User className="w-3 h-3" /> Personas</DropdownMenuLabel>
          <DropdownMenuGroup>
            {personas.map(p => (
              <DropdownMenuItem key={p.id} onClick={() => navigateToAdvisor('persona', p.id)} disabled={currentType === 'persona' && currentId === p.id} className="gap-2">
                <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${p.color || ''} flex items-center justify-center text-xs`}>{p.avatar || '🧠'}</span>
                <span className="truncate">{p.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2"><Brain className="w-3 h-3" /> Frameworks</DropdownMenuLabel>
          <DropdownMenuGroup>
            {frameworks.map(f => (
              <DropdownMenuItem key={f.id} onClick={() => navigateToAdvisor('framework', f.id)} disabled={currentType === 'framework' && currentId === f.id} className="gap-2">
                <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${f.color || ''} flex items-center justify-center text-xs`}>{f.icon || '🎯'}</span>
                <span className="truncate">{f.name}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-2"><BookOpen className="w-3 h-3" /> Books</DropdownMenuLabel>
          <DropdownMenuGroup>
            {books.map(b => (
              <DropdownMenuItem key={b.id} onClick={() => navigateToAdvisor('book', b.id)} disabled={currentType === 'book' && currentId === b.id} className="gap-2">
                <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${b.color || 'from-amber-500 to-orange-700'} flex items-center justify-center text-xs`}>{b.cover_emoji || '📚'}</span>
                <span className="truncate">{b.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setCreateOpen(true)} className="gap-2 text-primary">
            <Plus className="w-4 h-4" /><span>Create with AI ✨</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setGoodreadsOpen(true)} className="gap-2 text-primary">
            <Globe className="w-4 h-4" /><span>Import from Goodreads 📚</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" /> AI Auto-Generate Advisor</DialogTitle>
            <DialogDescription>Enter a name and AI will auto-generate the full advisor profile.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={createType} onValueChange={(v) => setCreateType(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="persona">🧑 Persona</SelectItem>
                  <SelectItem value="book">📚 Book</SelectItem>
                  <SelectItem value="framework">🧠 Framework</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{createType === 'persona' ? 'Name' : createType === 'book' ? 'Book title' : 'Framework name'}</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder={createType === 'persona' ? 'e.g. Naval Ravikant' : createType === 'book' ? 'e.g. Thinking Fast and Slow' : 'e.g. First Principles'}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
              />
            </div>
            <Button onClick={handleQuickCreate} disabled={generating || !createName.trim()} className="w-full">
              {generating ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>) : (<><Sparkles className="w-4 h-4 mr-2" />Generate with AI</>)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <GoodreadsImport open={goodreadsOpen} onOpenChange={setGoodreadsOpen} />
    </>
  );
};
