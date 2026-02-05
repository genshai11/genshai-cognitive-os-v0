import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, MessageSquare, TrendingUp, Clock } from 'lucide-react';

interface AdvisorStats {
  advisor_id: string;
  advisor_type: string;
  total_interactions: number;
  unique_users: number;
}

interface TopicStats {
  topic: string;
  count: number;
}

const AnalyticsDashboard = () => {
  const [advisorStats, setAdvisorStats] = useState<AdvisorStats[]>([]);
  const [topTopics, setTopTopics] = useState<TopicStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Get advisor interaction stats
        const { data: interestData } = await supabase
          .from('user_interests')
          .select('advisor_id, advisor_type, interaction_count, topics');

        if (interestData) {
          // Aggregate by advisor
          const advisorMap = new Map<string, AdvisorStats>();
          const topicMap = new Map<string, number>();

          interestData.forEach((item) => {
            const key = `${item.advisor_type}:${item.advisor_id}`;
            const existing = advisorMap.get(key);
            
            if (existing) {
              existing.total_interactions += item.interaction_count || 0;
              existing.unique_users += 1;
            } else {
              advisorMap.set(key, {
                advisor_id: item.advisor_id,
                advisor_type: item.advisor_type,
                total_interactions: item.interaction_count || 0,
                unique_users: 1,
              });
            }

            // Count topics
            item.topics?.forEach((topic: string) => {
              topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
            });
          });

          setAdvisorStats(
            Array.from(advisorMap.values()).sort(
              (a, b) => b.total_interactions - a.total_interactions
            )
          );

          setTopTopics(
            Array.from(topicMap.entries())
              .map(([topic, count]) => ({ topic, count }))
              .sort((a, b) => b.count - a.count)
              .slice(0, 10)
          );
        }

        // Get recent conversations
        const { data: conversationData } = await supabase
          .from('conversations')
          .select('id, advisor_id, advisor_type, title, created_at, updated_at')
          .order('updated_at', { ascending: false })
          .limit(10);

        setRecentActivity(conversationData || []);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Track user engagement and popular topics</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading analytics...</div>
        ) : (
          <div className="space-y-8">
            {/* Popular Advisors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Popular Advisors
                </CardTitle>
                <CardDescription>Most engaged advisors by interaction count</CardDescription>
              </CardHeader>
              <CardContent>
                {advisorStats.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No interaction data yet</p>
                ) : (
                  <div className="space-y-4">
                    {advisorStats.slice(0, 5).map((stat, index) => (
                      <div key={`${stat.advisor_type}-${stat.advisor_id}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                          <div>
                            <p className="font-medium capitalize">{stat.advisor_id.replace(/-/g, ' ')}</p>
                            <p className="text-sm text-muted-foreground">{stat.advisor_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{stat.total_interactions} interactions</p>
                          <p className="text-sm text-muted-foreground">{stat.unique_users} users</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trending Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    Trending Topics
                  </CardTitle>
                  <CardDescription>Most discussed topics across all advisors</CardDescription>
                </CardHeader>
                <CardContent>
                  {topTopics.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No topics tracked yet</p>
                  ) : (
                    <div className="space-y-2">
                      {topTopics.map((topic) => (
                        <div key={topic.topic} className="flex items-center justify-between">
                          <span className="capitalize">{topic.topic}</span>
                          <span className="text-sm font-medium bg-muted px-2 py-1 rounded">
                            {topic.count}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>Latest conversations across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div>
                            <p className="font-medium text-sm">
                              {activity.title || 'Untitled conversation'}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {activity.advisor_type}: {activity.advisor_id.replace(/-/g, ' ')}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
