import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Users, Brain, MessageSquare, TrendingUp, Settings, BookOpen } from 'lucide-react';

interface Stats {
  totalPersonas: number;
  totalFrameworks: number;
  totalBooks: number;
  totalConversations: number;
  totalInteractions: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalPersonas: 0,
    totalFrameworks: 0,
    totalBooks: 0,
    totalConversations: 0,
    totalInteractions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [personasRes, frameworksRes, booksRes, conversationsRes, interactionsRes] = await Promise.all([
          supabase.from('custom_personas').select('id', { count: 'exact', head: true }),
          supabase.from('custom_frameworks').select('id', { count: 'exact', head: true }),
          supabase.from('custom_books').select('id', { count: 'exact', head: true }),
          supabase.from('conversations').select('id', { count: 'exact', head: true }),
          supabase.from('user_interests').select('interaction_count'),
        ]);

        const totalInteractions = interactionsRes.data?.reduce(
          (sum, item) => sum + (item.interaction_count || 0),
          0
        ) || 0;

        setStats({
          totalPersonas: personasRes.count || 0,
          totalFrameworks: frameworksRes.count || 0,
          totalBooks: booksRes.count || 0,
          totalConversations: conversationsRes.count || 0,
          totalInteractions,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Personas', value: stats.totalPersonas, icon: Users, color: 'text-purple-500' },
    { title: 'Frameworks', value: stats.totalFrameworks, icon: Brain, color: 'text-blue-500' },
    { title: 'Books', value: stats.totalBooks, icon: BookOpen, color: 'text-amber-500' },
    { title: 'Conversations', value: stats.totalConversations, icon: MessageSquare, color: 'text-green-500' },
    { title: 'Total Interactions', value: stats.totalInteractions, icon: TrendingUp, color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage personas, frameworks, and track user engagement</p>
          </div>
          <Link to="/">
            <Button variant="outline">Back to App</Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? '...' : stat.value}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Persona Manager
              </CardTitle>
              <CardDescription>
                Create and manage AI personas - customize their style, personality, and knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/personas">
                <Button className="w-full">Manage Personas</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-500" />
                Framework Manager
              </CardTitle>
              <CardDescription>
                Create and edit mental models and thinking frameworks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/frameworks">
                <Button className="w-full">Manage Frameworks</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-500" />
                Book Library
              </CardTitle>
              <CardDescription>
                Add books and learn from their wisdom by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/books">
                <Button className="w-full">Manage Books</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-cyan-500" />
                AI Provider
              </CardTitle>
              <CardDescription>
                Configure AI provider settings (Lovable/CLIProxyAPI/Direct)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/ai-provider">
                <Button className="w-full">Configure AI</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Analytics
              </CardTitle>
              <CardDescription>
                View user engagement, popular topics, and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/admin/analytics">
                <Button className="w-full">View Analytics</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
