/**
 * Skill Execution Block Component
 * Displays skill execution in chat with loading states and results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Sparkles, Play, Clock } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { executeSkill } from '@/lib/skills/skill-discovery';

interface SkillExecutionBlockProps {
    skillId: string;
    skillName: string;
    input: any;
    conversationId?: string;
    autoExecute?: boolean;
}

export function SkillExecutionBlock({
    skillId,
    skillName,
    input,
    conversationId,
    autoExecute = false
}: SkillExecutionBlockProps) {
    const [isExecuting, setIsExecuting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [executionTime, setExecutionTime] = useState<number | null>(null);
    const [cached, setCached] = useState(false);

    useEffect(() => {
        if (autoExecute) {
            handleExecute();
        }
    }, [autoExecute]);

    const handleExecute = async () => {
        setIsExecuting(true);
        setError(null);
        setResult(null);

        try {
            const response = await executeSkill(skillId, input, conversationId);
            setResult(response.output);
            setExecutionTime(response.executionTimeMs);
            setCached(response.cached || false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Execution failed');
        } finally {
            setIsExecuting(false);
        }
    };

    return (
        <Card className="my-4 border-purple-500/20 bg-purple-500/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        {skillName}
                    </CardTitle>
                    {executionTime !== null && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{executionTime}ms</span>
                            {cached && <Badge variant="secondary">Cached</Badge>}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Input */}
                <div>
                    <h4 className="text-sm font-semibold mb-2">Input:</h4>
                    <SyntaxHighlighter
                        language="json"
                        style={vscDarkPlus}
                        customStyle={{
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                            padding: '0.75rem'
                        }}
                    >
                        {JSON.stringify(input, null, 2)}
                    </SyntaxHighlighter>
                </div>

                {/* Execute Button */}
                {!isExecuting && !result && !error && (
                    <Button onClick={handleExecute} className="w-full">
                        <Play className="w-4 h-4 mr-2" />
                        Execute Skill
                    </Button>
                )}

                {/* Loading State */}
                {isExecuting && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                        <span className="ml-3 text-muted-foreground">Executing skill...</span>
                    </div>
                )}

                {/* Success Result */}
                {result && !error && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                            <h4 className="text-sm font-semibold">Result:</h4>
                        </div>
                        <SyntaxHighlighter
                            language="json"
                            style={vscDarkPlus}
                            customStyle={{
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                padding: '0.75rem'
                            }}
                        >
                            {JSON.stringify(result, null, 2)}
                        </SyntaxHighlighter>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Alert variant="destructive">
                        <XCircle className="w-4 h-4" />
                        <AlertDescription>
                            <strong>Execution Error:</strong> {error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Retry Button */}
                {(result || error) && (
                    <Button
                        onClick={handleExecute}
                        variant="outline"
                        size="sm"
                        disabled={isExecuting}
                    >
                        {isExecuting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Executing...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Run Again
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
