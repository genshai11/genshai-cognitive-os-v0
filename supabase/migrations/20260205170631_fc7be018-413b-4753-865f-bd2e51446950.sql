-- Create custom_books table for book-based advisors
CREATE TABLE public.custom_books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_emoji TEXT DEFAULT '📚',
  color TEXT DEFAULT 'from-amber-500 to-orange-700',
  system_prompt TEXT NOT NULL,
  key_concepts TEXT[] DEFAULT '{}',
  genres TEXT[] DEFAULT '{}',
  language TEXT DEFAULT 'en',
  wiki_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_books ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage books"
  ON public.custom_books FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active books"
  ON public.custom_books FOR SELECT
  USING (is_active = true);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_books_updated_at
  BEFORE UPDATE ON public.custom_books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();