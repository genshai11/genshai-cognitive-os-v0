import { useState } from 'react';
import { Search, BookOpen, Globe, Loader2, Plus, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const GOODREADS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/goodreads-import`;

interface BookResult {
  title: string;
  author: string;
  url: string;
  rating?: string;
}

interface Category {
  id: string;
  name: string;
  shelf: string;
}

const CATEGORIES: Category[] = [
  { id: "self-help", name: "Self-Help", shelf: "self-help" },
  { id: "philosophy", name: "Philosophy", shelf: "philosophy" },
  { id: "psychology", name: "Psychology", shelf: "psychology" },
  { id: "business", name: "Business", shelf: "business" },
  { id: "science", name: "Science", shelf: "science" },
  { id: "biography", name: "Biography", shelf: "biography" },
  { id: "history", name: "History", shelf: "history" },
  { id: "fiction", name: "Fiction", shelf: "fiction" },
  { id: "spirituality", name: "Spirituality", shelf: "spirituality" },
  { id: "economics", name: "Economics", shelf: "economics" },
  { id: "leadership", name: "Leadership", shelf: "leadership" },
  { id: "productivity", name: "Productivity", shelf: "productivity" },
];

interface GoodreadsImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GoodreadsImport = ({ open, onOpenChange }: GoodreadsImportProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [categoryResults, setCategoryResults] = useState<BookResult[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const callApi = async (body: Record<string, string>) => {
    const resp = await fetch(GOODREADS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.error || 'Request failed');
    }
    return resp.json();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await callApi({ action: 'search', query: searchQuery });
      setSearchResults(data.books || []);
      if (!data.books?.length) {
        toast({ title: 'Không tìm thấy', description: 'Thử từ khóa khác', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleBrowseCategory = async (category: Category) => {
    setSelectedCategory(category.id);
    setCategoryResults([]);
    setSearching(true);
    try {
      const data = await callApi({ action: 'browse', category: category.shelf });
      setCategoryResults(data.books || []);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSearching(false);
    }
  };

  const handleImportBook = async (bookUrl: string, bookTitle?: string) => {
    setImporting(bookUrl);
    try {
      const data = await callApi({ action: 'import', url: bookUrl });
      const book = data.book;

      if (!book) throw new Error('Failed to extract book data');

      const id = (book.title || bookTitle || 'book')
        .toLowerCase()
        .replace(/[^a-z0-9\u00C0-\u024F]+/gi, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60);

      const { error } = await supabase.from('custom_books').insert({
        id,
        title: book.title || bookTitle || 'Unknown',
        author: book.author || 'Unknown',
        description: book.description || '',
        cover_emoji: book.cover_emoji || '📚',
        color: book.color || 'from-amber-500 to-orange-700',
        system_prompt: book.system_prompt || `You are a wise guide who deeply understands "${book.title}".`,
        key_concepts: book.key_concepts || [],
        genres: book.genres || [],
        language: book.language || 'en',
        wiki_url: book.wiki_url || bookUrl,
      });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'Sách đã tồn tại', description: `"${book.title}" đã có trong thư viện`, variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: '✨ Import thành công!', description: `"${book.title}" đã được thêm vào thư viện` });
      onOpenChange(false);
      navigate(`/book/${id}`);
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ title: 'Import thất bại', description: error.message, variant: 'destructive' });
    } finally {
      setImporting(null);
    }
  };

  const handleImportFromUrl = async () => {
    if (!urlInput.trim()) return;
    await handleImportBook(urlInput.trim());
  };

  const BookResultItem = ({ book, isImporting }: { book: BookResult; isImporting: boolean }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{book.title}</p>
        <p className="text-xs text-muted-foreground truncate">{book.author}</p>
        {book.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-muted-foreground">{book.rating}</span>
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleImportBook(book.url, book.title)}
        disabled={isImporting}
        className="shrink-0"
      >
        {isImporting ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Import từ Goodreads
          </DialogTitle>
          <DialogDescription>
            Tìm sách, chọn category, hoặc paste URL từ Goodreads
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="search" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="gap-1 text-xs">
              <Search className="w-3 h-3" /> Tìm kiếm
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1 text-xs">
              <BookOpen className="w-3 h-3" /> Danh mục
            </TabsTrigger>
            <TabsTrigger value="url" className="gap-1 text-xs">
              <Globe className="w-3 h-3" /> URL
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="flex gap-2 mb-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tên sách hoặc tác giả..."
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} size="icon" className="shrink-0">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>
            <ScrollArea className="flex-1 max-h-[40vh]">
              <div className="space-y-2 pr-3">
                {searchResults.map((book, i) => (
                  <BookResultItem key={`${book.url}-${i}`} book={book} isImporting={importing === book.url} />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="flex-1 flex flex-col min-h-0 mt-4">
            {!selectedCategory ? (
              <ScrollArea className="flex-1 max-h-[45vh]">
                <div className="grid grid-cols-2 gap-2 pr-3">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat.id}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => handleBrowseCategory(cat)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setCategoryResults([]); }}>
                    ← Quay lại
                  </Button>
                  <span className="text-sm font-medium">
                    {CATEGORIES.find(c => c.id === selectedCategory)?.name}
                  </span>
                  {searching && <Loader2 className="w-4 h-4 animate-spin" />}
                </div>
                <ScrollArea className="flex-1 max-h-[40vh]">
                  <div className="space-y-2 pr-3">
                    {categoryResults.map((book, i) => (
                      <BookResultItem key={`${book.url}-${i}`} book={book} isImporting={importing === book.url} />
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          {/* URL Tab */}
          <TabsContent value="url" className="mt-4 space-y-4">
            <div>
              <Label>Goodreads URL</Label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.goodreads.com/book/show/..."
                onKeyDown={(e) => e.key === 'Enter' && handleImportFromUrl()}
              />
            </div>
            <Button
              onClick={handleImportFromUrl}
              disabled={!!importing || !urlInput.trim()}
              className="w-full"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Đang import...
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Import sách
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
