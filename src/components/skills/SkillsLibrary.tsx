/**
 * Skills Library Component
 * Browse, search, and manage AI-generated skills
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
    Search,
    TrendingUp,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Sparkles,
    Loader2,
    Plus,
    Wand2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { getUserSkills, getSkillStats, approveSkill, rejectSkill } from '@/lib/skills/skill-discovery';
import { SkillApprovalModal } from '@/components/skills/SkillApprovalModal';
import type { SkillDefinition, SkillCategory, SkillStatus } from '@/types/skills';
import { useToast } from '@/hooks/use-toast';

export function SkillsLibrary() {
    const [user, setUser] = useState<any>(null);
    const [skills, setSkills] = useState<SkillDefinition[]>([]);
    const [filteredSkills, setFilteredSkills] = useState<SkillDefinition[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [stats, setStats] = useState({
        totalSkills: 0,
        approvedSkills: 0,
        totalExecutions: 0,
        avgExecutionTimeMs: 0,
        successRate: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedSkill, setSelectedSkill] = useState<SkillDefinition | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const { toast } = useToast();

    // Create Skill dialog state
    const [createOpen, setCreateOpen] = useState(false);
    const [newSkillDesc, setNewSkillDesc] = useState('');
    const [newSkillAdvisor, setNewSkillAdvisor] = useState('');
    const [advisors, setAdvisors] = useState<{ id: string; name: string }[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
        });
        // Load advisors for the Create Skill dialog
        supabase.from('custom_frameworks').select('id, name').eq('is_active', true).then(({ data }) => {
            if (data) setAdvisors(data.map(f => ({ id: f.id, name: f.name })));
        });
    }, []);

    const loadData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [skillsData, statsData] = await Promise.all([
                getUserSkills(user.id),
                getSkillStats(user.id)
            ]);
            setSkills(skillsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading skills:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => { loadData(); }, [loadData]);

    // Filter skills
    useEffect(() => {
        let filtered = skills;
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(s => s.category === selectedCategory);
        }
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(s => s.status === selectedStatus);
        }
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

    const handleApprove = async (skillId: string) => {
        await approveSkill(skillId);
        toast({ title: 'Skill approved', description: 'The skill is now available for use.' });
        loadData();
    };

    const handleReject = async (skillId: string) => {
        await rejectSkill(skillId);
        toast({ title: 'Skill rejected', description: 'The skill has been rejected.' });
        loadData();
    };

    const handleCreateSkill = async () => {
        if (!newSkillDesc.trim() || !newSkillAdvisor) return;
        setIsCreating(true);
        try {
            const { data, error } = await supabase.functions.invoke('skill-generator', {
                body: { skillDescription: newSkillDesc, advisorId: newSkillAdvisor },
            });
            if (error) throw error;
            if (!data?.success) throw new Error(data?.error || 'Generation failed');
            toast({ title: '✨ Skill Created!', description: `${data.skill?.skill_name || 'New skill'} is pending review.` });
            setCreateOpen(false);
            setNewSkillDesc('');
            setNewSkillAdvisor('');
            loadData();
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to create skill', variant: 'destructive' });
        } finally {
            setIsCreating(false);
        }
    };

    if (!user) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Please sign in to view your skills</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary" />
                        Skills Library
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your AI-generated skills and tools
                    </p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Skill
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-primary" />
                                Create New Skill
                            </DialogTitle>
                            <DialogDescription>
                                Describe what you want the skill to do and select an advisor to generate it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <Textarea
                                placeholder="e.g. A DCF calculator that takes cash flows and discount rate to compute intrinsic value..."
                                value={newSkillDesc}
                                onChange={(e) => setNewSkillDesc(e.target.value)}
                                rows={4}
                            />
                            <Select value={newSkillAdvisor} onValueChange={setNewSkillAdvisor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an advisor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {advisors.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={handleCreateSkill}
                                disabled={isCreating || !newSkillDesc.trim() || !newSkillAdvisor}
                            >
                                {isCreating ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
                                ) : (
                                    <><Wand2 className="w-4 h-4 mr-2" />Generate Skill</>
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Skills</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSkills}</div>
                        <p className="text-xs text-muted-foreground">{stats.approvedSkills} approved</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExecutions}</div>
                        <p className="text-xs text-muted-foreground">{stats.successRate.toFixed(1)}% success rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Execution Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgExecutionTimeMs.toFixed(0)}ms</div>
                        <p className="text-xs text-muted-foreground">Per execution</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Most Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">
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
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="calculation">Calculation</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="creative">Creative</SelectItem>
                        <SelectItem value="communication">Communication</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Skills Grid */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            onView={() => { setSelectedSkill(skill); setModalOpen(true); }}
                        />
                    ))}
                </div>
            )}

            {/* Approval Modal */}
            <SkillApprovalModal
                skill={selectedSkill}
                isOpen={modalOpen}
                onClose={() => { setModalOpen(false); setSelectedSkill(null); }}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
}

function SkillCard({ skill, onView }: { skill: SkillDefinition; onView: () => void }) {
    const statusConfig = {
        approved: { icon: <CheckCircle2 className="w-4 h-4" />, variant: 'default' as const },
        rejected: { icon: <XCircle className="w-4 h-4" />, variant: 'destructive' as const },
        pending: { icon: <AlertCircle className="w-4 h-4" />, variant: 'secondary' as const },
        archived: { icon: <Clock className="w-4 h-4" />, variant: 'outline' as const },
    };

    const config = statusConfig[skill.status] || statusConfig.pending;

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{skill.skillName}</CardTitle>
                        <CardDescription className="mt-1 line-clamp-2">{skill.description}</CardDescription>
                    </div>
                    <div className="ml-2">{config.icon}</div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{skill.category}</Badge>
                    <Badge variant={config.variant}>{skill.status}</Badge>
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
                    <p className="text-xs text-muted-foreground italic truncate">{skill.mentalModel}</p>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={onView}>
                    View Details
                </Button>
            </CardContent>
        </Card>
    );
}
