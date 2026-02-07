/**
 * Skill Approval Modal Component
 * Shows generated skill for user review and approval
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, XCircle, AlertTriangle, Code2, FileCode, Sparkles } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { SkillDefinition } from '@/types/skills';
import { analyzeCodeWithRecommendation, getSecurityLevel } from '@/lib/skills/code-analysis';

interface SkillApprovalModalProps {
    skill: SkillDefinition | null;
    isOpen: boolean;
    onClose: () => void;
    onApprove: (skillId: string) => Promise<void>;
    onReject: (skillId: string) => Promise<void>;
}

export function SkillApprovalModal({
    skill,
    isOpen,
    onClose,
    onApprove,
    onReject
}: SkillApprovalModalProps) {
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

    if (!skill) return null;

    // Analyze code
    const analysis = analyzeCodeWithRecommendation(skill.code);
    const securityLevel = getSecurityLevel(analysis);

    const handleApprove = async () => {
        setIsApproving(true);
        try {
            await onApprove(skill.id);
            onClose();
        } catch (error) {
            console.error('Approval error:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = async () => {
        setIsRejecting(true);
        try {
            await onReject(skill.id);
            onClose();
        } catch (error) {
            console.error('Rejection error:', error);
        } finally {
            setIsRejecting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-purple-500" />
                                {skill.skillName}
                            </DialogTitle>
                            <DialogDescription className="mt-2">
                                {skill.description}
                            </DialogDescription>
                        </div>
                        <Badge variant={skill.category === 'calculation' ? 'default' : 'secondary'}>
                            {skill.category}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="h-[60vh] pr-4">
                    <Tabs defaultValue="code" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="code">
                                <Code2 className="w-4 h-4 mr-2" />
                                Code
                            </TabsTrigger>
                            <TabsTrigger value="security">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Security
                            </TabsTrigger>
                            <TabsTrigger value="schema">
                                <FileCode className="w-4 h-4 mr-2" />
                                Schema
                            </TabsTrigger>
                            <TabsTrigger value="examples">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Examples
                            </TabsTrigger>
                        </TabsList>

                        {/* Code Tab */}
                        <TabsContent value="code" className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Function Code</h3>
                                <SyntaxHighlighter
                                    language="javascript"
                                    style={vscDarkPlus}
                                    customStyle={{
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        maxHeight: '400px'
                                    }}
                                >
                                    {skill.code}
                                </SyntaxHighlighter>
                            </div>

                            {skill.mentalModel && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2">Mental Model</h3>
                                    <p className="text-sm text-muted-foreground">{skill.mentalModel}</p>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-semibold mb-2">Use Cases</h3>
                                <ul className="list-disc list-inside space-y-1">
                                    {skill.useCases.map((useCase, i) => (
                                        <li key={i} className="text-sm text-muted-foreground">{useCase}</li>
                                    ))}
                                </ul>
                            </div>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-4">
                            <Alert variant={securityLevel === 'danger' ? 'destructive' : securityLevel === 'caution' ? 'default' : 'default'}>
                                <AlertDescription>
                                    <div className="flex items-center gap-2 mb-2">
                                        {securityLevel === 'safe' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                                        {securityLevel === 'caution' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                                        {securityLevel === 'danger' && <XCircle className="w-5 h-5 text-red-500" />}
                                        <span className="font-semibold">
                                            {securityLevel === 'safe' && 'Safe to Execute'}
                                            {securityLevel === 'caution' && 'Review Recommended'}
                                            {securityLevel === 'danger' && 'Security Risk Detected'}
                                        </span>
                                    </div>
                                    <p className="text-sm">{analysis.message}</p>
                                </AlertDescription>
                            </Alert>

                            {analysis.risks.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-red-500">Critical Risks</h3>
                                    <ul className="space-y-1">
                                        {analysis.risks.map((risk, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                                                <span>{risk}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {analysis.warnings.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold mb-2 text-yellow-500">Warnings</h3>
                                    <ul className="space-y-1">
                                        {analysis.warnings.map((warning, i) => (
                                            <li key={i} className="text-sm flex items-start gap-2">
                                                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                                <span>{warning}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-semibold mb-2">Code Complexity</h3>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-secondary rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${analysis.complexity < 10 ? 'bg-green-500' :
                                                    analysis.complexity < 20 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                }`}
                                            style={{ width: `${Math.min(analysis.complexity * 2, 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-mono">{analysis.complexity}</span>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Schema Tab */}
                        <TabsContent value="schema" className="space-y-4">
                            <div>
                                <h3 className="text-sm font-semibold mb-2">Input Schema</h3>
                                <SyntaxHighlighter
                                    language="json"
                                    style={vscDarkPlus}
                                    customStyle={{
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {JSON.stringify(skill.inputSchema, null, 2)}
                                </SyntaxHighlighter>
                            </div>

                            <div>
                                <h3 className="text-sm font-semibold mb-2">Output Schema</h3>
                                <SyntaxHighlighter
                                    language="json"
                                    style={vscDarkPlus}
                                    customStyle={{
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {JSON.stringify(skill.outputSchema, null, 2)}
                                </SyntaxHighlighter>
                            </div>
                        </TabsContent>

                        {/* Examples Tab */}
                        <TabsContent value="examples" className="space-y-4">
                            {skill.examples.map((example, i) => (
                                <div key={i} className="border rounded-lg p-4 space-y-2">
                                    <h3 className="text-sm font-semibold">Example {i + 1}</h3>
                                    <p className="text-sm text-muted-foreground">{example.explanation}</p>

                                    <div>
                                        <h4 className="text-xs font-semibold mb-1">Input:</h4>
                                        <SyntaxHighlighter
                                            language="json"
                                            style={vscDarkPlus}
                                            customStyle={{
                                                borderRadius: '0.5rem',
                                                fontSize: '0.75rem',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            {JSON.stringify(example.input, null, 2)}
                                        </SyntaxHighlighter>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-semibold mb-1">Output:</h4>
                                        <SyntaxHighlighter
                                            language="json"
                                            style={vscDarkPlus}
                                            customStyle={{
                                                borderRadius: '0.5rem',
                                                fontSize: '0.75rem',
                                                padding: '0.5rem'
                                            }}
                                        >
                                            {JSON.stringify(example.output, null, 2)}
                                        </SyntaxHighlighter>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>
                    </Tabs>
                </ScrollArea>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isApproving || isRejecting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleReject}
                        disabled={isApproving || isRejecting}
                        loading={isRejecting}
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={!analysis.safe || isApproving || isRejecting}
                        loading={isApproving}
                    >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Approve & Use
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
