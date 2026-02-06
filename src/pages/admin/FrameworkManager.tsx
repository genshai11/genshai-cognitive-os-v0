import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Save, Sparkles, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGenerateAdvisor } from '@/hooks/useGenerateAdvisor';

interface Framework {
  id: string;
  name: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  system_prompt: string;
  mental_models: string[] | null;
  example_questions: string[] | null;
  is_active: boolean | null;
}

const emptyFramework: Omit<Framework, 'id'> = {
  name: '',
  title: '',
  description: '',
  icon: '🎯',
  color: 'from-blue-500 to-cyan-700',
  system_prompt: '',
  mental_models: [],
  example_questions: [],
  is_active: true,
};

const FrameworkManager = () => {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<Framework, 'id'>>(emptyFramework);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { generate, generating } = useGenerateAdvisor();

  const handleAutoGenerate = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Enter a name first', description: 'Type a framework name then click Auto Generate', variant: 'destructive' });
      return;
    }
    const result = await generate('framework', { name: formData.name });
    if (result) {
      setFormData({
        ...formData,
        name: result.name || formData.name,
        title: result.title || formData.title,
        description: result.description || formData.description,
        icon: result.icon || formData.icon,
        color: result.color || formData.color,
        system_prompt: result.system_prompt || formData.system_prompt,
        mental_models: result.mental_models || formData.mental_models,
        example_questions: result.example_questions || formData.example_questions,
      });
    }
  };

  const fetchFrameworks = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_frameworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrameworks(data || []);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
      toast({ title: 'Error', description: 'Failed to load frameworks', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const handleCreate = () => {
    setIsCreating(true);
    setEditingFramework(null);
    setFormData(emptyFramework);
    setDialogOpen(true);
  };

  const handleEdit = (framework: Framework) => {
    setIsCreating(false);
    setEditingFramework(framework);
    setFormData({
      name: framework.name,
      title: framework.title,
      description: framework.description,
      icon: framework.icon,
      color: framework.color,
      system_prompt: framework.system_prompt,
      mental_models: framework.mental_models,
      example_questions: framework.example_questions,
      is_active: framework.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const id = isCreating
        ? formData.name.toLowerCase().replace(/\s+/g, '-')
        : editingFramework?.id;

      if (!id) return;

      const dataToSave = {
        id,
        name: formData.name,
        title: formData.title,
        description: formData.description,
        icon: formData.icon,
        color: formData.color,
        system_prompt: formData.system_prompt,
        mental_models: formData.mental_models,
        example_questions: formData.example_questions,
        is_active: formData.is_active,
      };

      if (isCreating) {
        const { error } = await supabase.from('custom_frameworks').insert(dataToSave);
        if (error) throw error;
        toast({ title: 'Success', description: 'Framework created successfully' });
      } else {
        const { error } = await supabase
          .from('custom_frameworks')
          .update(dataToSave)
          .eq('id', id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Framework updated successfully' });
      }

      setDialogOpen(false);
      fetchFrameworks();
    } catch (error: any) {
      console.error('Error saving framework:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save framework', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this framework?')) return;

    try {
      const { error } = await supabase.from('custom_frameworks').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Framework deleted successfully' });
      fetchFrameworks();
    } catch (error: any) {
      console.error('Error deleting framework:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete framework', variant: 'destructive' });
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
              <h1 className="text-3xl font-bold">Framework Manager</h1>
              <p className="text-muted-foreground">Create and manage mental models</p>
            </div>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Framework
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : frameworks.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">No frameworks yet. Create your first one!</p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Framework
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {frameworks.map((framework) => (
              <Card key={framework.id} className={!framework.is_active ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{framework.icon}</span>
                      <div>
                        <CardTitle className="text-lg">{framework.name}</CardTitle>
                        <CardDescription>{framework.title}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(framework)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(framework.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {framework.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {framework.mental_models?.slice(0, 3).map((model) => (
                      <span key={model} className="text-xs bg-muted px-2 py-1 rounded">
                        {model}
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
              <DialogTitle>{isCreating ? 'Create New Framework' : 'Edit Framework'}</DialogTitle>
              <DialogDescription>
                {isCreating
                  ? 'Define a new mental model or thinking framework'
                  : 'Modify the framework settings'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., First Principles"
                    />
                    <Button type="button" variant="secondary" size="sm" onClick={handleAutoGenerate} disabled={generating} className="shrink-0">
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Break down to fundamentals"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="🎯"
                  />
                </div>
                <div>
                  <Label htmlFor="color">Gradient Color</Label>
                  <Input
                    id="color"
                    value={formData.color || ''}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="from-blue-500 to-cyan-700"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this framework"
                />
              </div>

              <div>
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="You are an expert in [framework]. Help users apply this thinking model..."
                  rows={8}
                />
              </div>

              <div>
                <Label htmlFor="mental_models">Mental Models (comma-separated)</Label>
                <Input
                  id="mental_models"
                  value={formData.mental_models?.join(', ') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      mental_models: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Decomposition, Root cause analysis, First principles"
                />
              </div>

              <div>
                <Label htmlFor="example_questions">Example Questions (comma-separated)</Label>
                <Textarea
                  id="example_questions"
                  value={formData.example_questions?.join('\n') || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      example_questions: e.target.value.split('\n').map((t) => t.trim()).filter(Boolean),
                    })
                  }
                  placeholder="One question per line"
                  rows={3}
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
                  {isCreating ? 'Create Framework' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FrameworkManager;
