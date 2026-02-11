import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Loader2, BookOpen, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImportBookDialogProps {
  onImported?: () => void;
}

interface BookResult {
  title: string;
  author: string;
  description: string;
  key_concepts: string[];
  tags: string[];
}

export const ImportBookDialog = ({ onImported }: ImportBookDialogProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<BookResult[]>([]);
  const [importing, setImporting] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Enter a search query');
      return;
    }

    setSearching(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('goodreads-import', {
        body: { action: 'search', query: query.trim() },
      });

      if (error) throw error;
      setResults(data?.books || []);
      if (!data?.books?.length) toast.info('No books found. Try a different query.');
    } catch (e: any) {
      toast.error(`Search failed: ${e.message}`);
    } finally {
      setSearching(false);
    }
  };

  const handleImport = async (book: BookResult) => {
    setImporting(book.title);
    try {
      // Generate blueprint for the book
      const { data: genData, error: genError } = await supabase.functions.invoke('generate-advisor', {
        body: { name: book.title, description: `${book.description} by ${book.author}`, type: 'book' },
      });

      if (genError) throw genError;

      const { error: insertError } = await supabase.from('custom_books').insert({
        id: crypto.randomUUID(),
        title: book.title,
        author: book.author,
        description: book.description,
        key_concepts: book.key_concepts,
        color: genData?.color || 'bg-secondary text-secondary-foreground',
        cognitive_blueprint: genData?.blueprint || null,
        system_prompt: genData?.systemPrompt || `You are an advisor based on the book "${book.title}" by ${book.author}.`,
      });

      if (insertError) throw insertError;

      toast.success(`"${book.title}" imported!`);
      onImported?.();
    } catch (e: any) {
      toast.error(`Import failed: ${e.message}`);
    } finally {
      setImporting(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-sans">
          <Plus className="w-4 h-4" />
          Import Book
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Import Book Advisor
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="font-sans text-sm">Search for a book or topic</Label>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Thinking Fast and Slow, stoicism, investing..."
                className="font-sans"
              />
              <Button onClick={handleSearch} disabled={searching || !query.trim()} size="icon" className="shrink-0">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground font-sans">{results.length} books found — click to import</p>
              {results.map((book, i) => (
                <motion.div
                  key={`${book.title}-${i}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl border border-border bg-card hover:shadow-warm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-serif font-semibold text-sm">{book.title}</h4>
                      <p className="text-xs text-muted-foreground font-sans mb-1">by {book.author}</p>
                      <p className="text-xs text-muted-foreground font-sans line-clamp-2">{book.description}</p>
                      {book.key_concepts?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {book.key_concepts.slice(0, 3).map((c) => (
                            <span key={c} className="px-2 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground font-sans">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 font-sans text-xs"
                      disabled={importing === book.title}
                      onClick={() => handleImport(book)}
                    >
                      {importing === book.title ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Import'}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
