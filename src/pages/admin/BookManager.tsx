import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Save, BookOpen, Sparkles, Loader2, Brain } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGenerateAdvisor } from '@/hooks/useGenerateAdvisor';

interface Book {
  id: string;
  title: string;
  author: string;
  description: string | null;
  cover_emoji: string | null;
  color: string | null;
  system_prompt: string;
  cognitive_blueprint: Record<string, any> | null;
  key_concepts: string[] | null;
  genres: string[] | null;
  language: string | null;
  wiki_url: string | null;
  is_active: boolean | null;
}

const emptyBook: Omit<Book, 'id'> = {
  title: '',
  author: '',
  description: '',
  cover_emoji: '📚',
  color: 'from-amber-500 to-orange-700',
  system_prompt: '',
  cognitive_blueprint: null,
  key_concepts: [],
  genres: [],
  language: 'en',
  wiki_url: '',
  is_active: true,
};

const genreOptions = [
  'Self-Help',
  'Philosophy',
  'Psychology',
  'Business',
  'Spirituality',
  'Science',
  'Biography',
  'Fiction',
  'History',
  'Economics',
  'Leadership',
  'Productivity',
];

const BookManager = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<Book, 'id'>>(emptyBook);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { generate, generating } = useGenerateAdvisor();

  const handleAutoGenerate = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Enter a title first', description: 'Type a book title then click Auto Generate', variant: 'destructive' });
      return;
    }
    const result = await generate('book', { title: formData.title, author: formData.author, language: formData.language || 'en' });
    if (result) {
      setFormData({
        ...formData,
        title: result.title || formData.title,
        author: result.author || formData.author,
        description: result.description || formData.description,
        cover_emoji: result.cover_emoji || formData.cover_emoji,
        color: result.color || formData.color,
        system_prompt: result.system_prompt || formData.system_prompt,
        cognitive_blueprint: result.cognitive_blueprint || formData.cognitive_blueprint,
        key_concepts: result.key_concepts || formData.key_concepts,
        genres: result.genres || formData.genres,
        language: result.language || formData.language,
        wiki_url: result.wiki_url || formData.wiki_url,
      });
    }
  };

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_books')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
      toast({ title: 'Error', description: 'Failed to load books', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingBook(null);
    setFormData(emptyBook);
    setDialogOpen(true);
  };

  const handleEdit = (book: Book) => {
    setIsCreating(false);
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description,
      cover_emoji: book.cover_emoji,
      color: book.color,
      system_prompt: book.system_prompt,
      cognitive_blueprint: book.cognitive_blueprint,
      key_concepts: book.key_concepts,
      genres: book.genres,
      language: book.language,
      wiki_url: book.wiki_url,
      is_active: book.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const id = isCreating
        ? formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : editingBook?.id;

      if (!id) return;

      const dataToSave = {
        id,
        title: formData.title,
        author: formData.author,
        description: formData.description,
        cover_emoji: formData.cover_emoji,
        color: formData.color,
        system_prompt: formData.system_prompt,
        cognitive_blueprint: formData.cognitive_blueprint,
        key_concepts: formData.key_concepts,
        genres: formData.genres,
        language: formData.language,
        wiki_url: formData.wiki_url,
        is_active: formData.is_active,
      };

      if (isCreating) {
        const { error } = await supabase.from('custom_books').insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Success', description: 'Book created successfully' });
      } else {
        const { error } = await supabase
          .from('custom_books')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Book updated successfully' });
      }

      setDialogOpen(false);
      fetchBooks();
    } catch (error: any) {
      console.error('Error saving book:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save book', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const { error } = await supabase.from('custom_books').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Book deleted successfully' });
      fetchBooks();
    } catch (error: any) {
      console.error('Error deleting book:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete book', variant: 'destructive' });
    }
  };

  // Group books by genre
  const booksByGenre = books.reduce((acc, book) => {
    const primaryGenre = book.genres?.[0] || 'Uncategorized';
    if (!acc[primaryGenre]) acc[primaryGenre] = [];
    acc[primaryGenre].push(book);
    return acc;
  }, {} as Record<string, Book[]>);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Book Library Manager</h1>
              <p className="text-muted-foreground">Add books and learn from their wisdom</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : books.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No books yet. Add your first one!</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Book
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(booksByGenre).map(([genre, genreBooks]) => (
              <div key={genre}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 rounded-full text-sm">{genre}</span>
                  <span className="text-muted-foreground text-sm">({genreBooks.length} books)</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {genreBooks.map((book) => (
                    <Card key={book.id} className={!book.is_active ? 'opacity-60' : ''}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${book.color} flex items-center justify-center text-2xl`}>
                              {book.cover_emoji}
                            </div>
                            <div>
                              <CardTitle className="text-lg line-clamp-1">{book.title}</CardTitle>
                              <CardDescription>{book.author}</CardDescription>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(book)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(book.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {book.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {book.cognitive_blueprint && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                              <Brain className="h-3 w-3" /> Blueprint
                            </span>
                          )}
                          {book.key_concepts?.slice(0, 3).map((concept) => (
                            <span key={concept} className="text-xs bg-muted px-2 py-1 rounded">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? 'Add New Book' : 'Edit Book'}</DialogTitle>
              <DialogDescription>
                {isCreating
                  ? 'Add a book to learn from its wisdom and teachings'
                  : 'Modify the book details and AI behavior'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Book Title</Label>
                  <div className="flex gap-2">
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., The Celestine Prophecy"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleAutoGenerate} disabled={generating} className="shrink-0">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g., James Redfield"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cover_emoji">Cover Emoji</Label>
                  <Input
                    id="cover_emoji"
                    value={formData.cover_emoji || ''}
                    onChange={(e) => setFormData({ ...formData, cover_emoji: e.target.value })}
                    placeholder="📚"
                  />
                </div>
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={formData.language || 'en'}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="vi">Tiếng Việt</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color">Gradient Color</Label>
                  <Input
                    id="color"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="from-amber-500 to-orange-700"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this book"
                />
              </div>

              <div>
                <Label htmlFor="genres">Genres (comma-separated)</Label>
                <Input
                  id="genres"
                  value={formData.genres?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      genres: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Spirituality, Self-Help, Philosophy"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Suggested: {genreOptions.slice(0, 6).join(', ')}
                </p>
              </div>

              <div>
                <Label htmlFor="wiki_url">Wikipedia/Goodreads URL</Label>
                <Input
                  id="wiki_url"
                  value={formData.wiki_url || ''}
                  onChange={(e) => setFormData({ ...formData, wiki_url: e.target.value })}
                  placeholder="https://en.wikipedia.org/wiki/..."
                />
              </div>

              <div>
                <Label htmlFor="system_prompt">System Prompt (How should AI embody this book?)</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You embody the wisdom from [Book Title]. Guide users through the key teachings..."
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="cognitive_blueprint" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Cognitive Blueprint
                </Label>
                {formData.cognitive_blueprint ? (
                  <Textarea
                    id="cognitive_blueprint"
                    value={JSON.stringify(formData.cognitive_blueprint, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData({ ...formData, cognitive_blueprint: parsed });
                      } catch {
                        // Allow typing invalid JSON temporarily
                      }
                    }}
                    rows={12}
                    className="font-mono text-xs"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground py-3 px-3 border border-dashed rounded-md">
                    No blueprint yet. Click the auto-generate button above to create one.
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  The cognitive blueprint captures this book's thinking methodology — its worldview, how it teaches you to see problems, and its reasoning framework.
                </p>
              </div>

              <div>
                <Label htmlFor="key_concepts">Key Concepts (comma-separated)</Label>
                <Input
                  id="key_concepts"
                  value={formData.key_concepts?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      key_concepts: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Synchronicity, Nine Insights, Energy awareness"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active ?? true}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active (visible to users)</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  {isCreating ? 'Add Book' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BookManager;
