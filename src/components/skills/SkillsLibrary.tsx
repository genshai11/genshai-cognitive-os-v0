/**
 * Skills Library Component
 * Browse, search, and manage AI-generated skills
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Search,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getUserSkills, getSkillStats } from '@/lib/skills/skill-discovery';
import type { SkillDefinition, SkillCategory, SkillStatus } from '@/types/skills';

export function SkillsLibrary() {
    const [user, setUser] = useState<any>(null);
    const [skills, setSkills] = useState<SkillDefinition[]>([]);
    const [filteredSkills, setFilteredSkills] = useState<SkillDefinition[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<SkillCategory | 'all'>('all');
    const [selectedStatus, setSelectedStatus] = useState<SkillStatus | 'all'>('all');
    const [stats, setStats] = useState({
        totalSkills: 0,
        approvedSkills: 0,
        totalExecutions: 0,
        avgExecutionTimeMs: 0,
        successRate: 0
    });
    const [isLoading, setIsLoading] = useState(true);

    // Load user from Supabase
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
    }, []);

    // Load skills and stats
    useEffect(() => {
        if (!user) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const [skillsData, statsData] = await Promise.all([
                    getUserSkills(user.id),
                    getSkillStats(user.id)
                ]);
                setSkills(skillsData);
                setFilteredSkills(skillsData);
                setStats(statsData);
            } catch (error) {
                console.error('Error loading skills:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [user]);

    // Filter skills
    useEffect(() => {
        let filtered = skills;

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(s => s.category === selectedCategory);
        }

        // Filter by status
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(s => s.status === selectedStatus);
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(s =>
                s.skillName.toLowerCase().includes(query) ||
                s.description.toLowerCase().includes(query) ||
                s.useCases.some(uc => uc.toLowerCase().includes(query))
            );
        }

        setFilteredSkills(filtered);
    }, [skills, selectedCategory, selectedStatus, searchQuery]);

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Please sign in to view your skills</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="w-8 h-8 text-purple-500" />
                    Skills Library
                </h1>
                <p className="text-muted-foreground mt-2">
                    Manage your AI-generated skills and tools
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Skills
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSkills}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.approvedSkills} approved
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Executions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.successRate.toFixed(1)}% success rate
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Execution Time
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgExecutionTimeMs.toFixed(0)}ms
                        </div>
                        <p className="text-xs text-muted-foreground">Per execution</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Most Used
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {skills.length > 0 ? skills[0]?.skillName.slice(0, 15) : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {skills.length > 0 ? `${skills[0]?.timesUsed} uses` : ''}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search skills..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as any)}
                    className="px-4 py-2 border rounded-md bg-background"
                >
                    <option value="all">All Categories</option>
                    <option value="analysis">Analysis</option>
                    <option value="calculation">Calculation</option>
                    <option value="research">Research</option>
                    <option value="creative">Creative</option>
                    <option value="communication">Communication</option>
                </select>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-4 py-2 border rounded-md bg-background"
                >
                    <option value="all">All Status</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {/* Skills Grid */}
            <ScrollArea className="h-[600px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-muted-foreground">Loading skills...</p>
                    </div>
                ) : filteredSkills.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                        <Sparkles className="w-16 h-16 text-muted-foreground" />
                        <p className="text-muted-foreground">No skills found</p>
                        <p className="text-sm text-muted-foreground">
                            Start a conversation with an advisor to create your first skill!
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredSkills.map((skill) => (
                            <SkillCard key={skill.id} skill={skill} />
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}

/**
 * Individual Skill Card
 */
function SkillCard({ skill }: { skill: SkillDefinition }) {
    const getStatusIcon = () => {
        switch (skill.status) {
            case 'approved':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'pending':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            default:
                return null;
        }
    };

    const getStatusColor = () => {
        switch (skill.status) {
            case 'approved':
                return 'bg-green-500/10 text-green-500';
            case 'rejected':
                return 'bg-red-500/10 text-red-500';
            case 'pending':
                return 'bg-yellow-500/10 text-yellow-500';
            default:
                return 'bg-gray-500/10 text-gray-500';
        }
    };

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{skill.skillName}</CardTitle>
                        <CardDescription className="mt-1">
                            {skill.description}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusIcon()}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{skill.category}</Badge>
                    <Badge className={getStatusColor()}>{skill.status}</Badge>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{skill.timesUsed} uses</span>
                    </div>
                    {skill.lastUsedAt && (
                        <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(skill.lastUsedAt).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>

                {skill.mentalModel && (
                    <p className="text-xs text-muted-foreground italic">
                        {skill.mentalModel}
                    </p>
                )}

                <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full">
                        View Details
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
