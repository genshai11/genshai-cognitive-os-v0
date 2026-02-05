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
import { ArrowLeft, Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Persona {
  id: string;
  name: string;
  title: string;
  description: string | null;
  avatar: string | null;
  color: string | null;
  system_prompt: string;
  response_style: string | null;
  tags: string[] | null;
  wiki_url: string | null;
  source_type: string | null;
  is_active: boolean | null;
}

const emptyPersona: Omit<Persona, 'id'> = {
  name: '',
  title: '',
  description: '',
  avatar: '🧠',
  color: 'from-purple-500 to-indigo-700',
  system_prompt: '',
  response_style: 'balanced',
  tags: [],
  wiki_url: '',
  source_type: 'persona',
  is_active: true,
};

const PersonaManager = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<Persona, 'id'>>(emptyPersona);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_personas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonas(data || []);
    } catch (error) {
      console.error('Error fetching personas:', error);
      toast({ title: 'Error', description: 'Failed to load personas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingPersona(null);
    setFormData(emptyPersona);
    setDialogOpen(true);
  };

  const handleEdit = (persona: Persona) => {
    setIsCreating(false);
    setEditingPersona(persona);
    setFormData({
      name: persona.name,
      title: persona.title,
      description: persona.description,
      avatar: persona.avatar,
      color: persona.color,
      system_prompt: persona.system_prompt,
      response_style: persona.response_style,
      tags: persona.tags,
      wiki_url: persona.wiki_url,
      source_type: persona.source_type,
      is_active: persona.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const id = isCreating
        ? formData.name.toLowerCase().replace(/\s+/g, '-')
        : editingPersona?.id;

      if (!id) return;

      const dataToSave = {
        id,
        name: formData.name,
        title: formData.title,
        description: formData.description,
        avatar: formData.avatar,
        color: formData.color,
        system_prompt: formData.system_prompt,
        response_style: formData.response_style,
        tags: formData.tags,
        wiki_url: formData.wiki_url,
        source_type: formData.source_type,
        is_active: formData.is_active,
      };

      if (isCreating) {
        const { error } = await supabase.from('custom_personas').insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Success', description: 'Persona created successfully' });
      } else {
        const { error } = await supabase
          .from('custom_personas')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Persona updated successfully' });
      }

      setDialogOpen(false);
      fetchPersonas();
    } catch (error: any) {
      console.error('Error saving persona:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save persona', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;

    try {
      const { error } = await supabase.from('custom_personas').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Persona deleted successfully' });
      fetchPersonas();
    } catch (error: any) {
      console.error('Error deleting persona:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete persona', variant: 'destructive' });
    }
  };

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
              <h1 className="text-3xl font-bold">Persona Manager</h1>
              <p className="text-muted-foreground">Create and manage AI personas</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Persona
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : personas.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No personas yet. Create your first one!</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Persona
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <Card key={persona.id} className={!persona.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{persona.avatar}</span>
                      <div>
                        <CardTitle className="text-lg">{persona.name}</CardTitle>
                        <CardDescription>{persona.title}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(persona)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(persona.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {persona.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {persona.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-muted px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Create Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isCreating ? 'Create New Persona' : 'Edit Persona'}</DialogTitle>
              <DialogDescription>
                {isCreating
                  ? 'Define a new AI persona with custom personality and knowledge'
                  : 'Modify the persona settings and behavior'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Steve Jobs"
                  />
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Visionary Entrepreneur"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="avatar">Avatar (emoji)</Label>
                  <Input
                    id="avatar"
                    value={formData.avatar || ''}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    placeholder="🧠"
                  />
                </div>
                <div>
                  <Label htmlFor="source_type">Source Type</Label>
                  <Select
                    value={formData.source_type || 'persona'}
                    onValueChange={(value) => setFormData({ ...formData, source_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persona">Persona (Historical Figure)</SelectItem>
                      <SelectItem value="book">Book (Author's Wisdom)</SelectItem>
                      <SelectItem value="framework">Framework (Mental Model)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this persona"
                />
              </div>

              <div>
                <Label htmlFor="wiki_url">Wikipedia/Source URL</Label>
                <Input
                  id="wiki_url"
                  value={formData.wiki_url || ''}
                  onChange={(e) => setFormData({ ...formData, wiki_url: e.target.value })}
                  placeholder="https://en.wikipedia.org/wiki/..."
                />
              </div>

              <div>
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You ARE [persona name]. Speak in first person..."
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="response_style">Response Style</Label>
                <Select
                  value={formData.response_style || 'balanced'}
                  onValueChange={(value) => setFormData({ ...formData, response_style: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise - Short, punchy responses</SelectItem>
                    <SelectItem value="balanced">Balanced - Moderate detail</SelectItem>
                    <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                    <SelectItem value="socratic">Socratic - Questions to guide thinking</SelectItem>
                    <SelectItem value="storytelling">Storytelling - Uses anecdotes and stories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="business, innovation, leadership"
                />
              </div>

              <div>
                <Label htmlFor="color">Gradient Color</Label>
                <Input
                  id="color"
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="from-purple-500 to-indigo-700"
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
                  {isCreating ? 'Create Persona' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PersonaManager;
