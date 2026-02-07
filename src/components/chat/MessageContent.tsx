import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Lightbulb, Quote, BookOpen, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { MermaidBlock } from './MermaidBlock';
import { ImageBlock } from './ImageBlock';
import { SkillExecutionBlock } from '../skills/SkillExecutionBlock';
import { SkillGenerationBlock } from '../skills/SkillGenerationBlock';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

interface MessageContentProps {
  content: string;
}

// ─── Chart Parser ───────────────────────────────────────────────
// Parses ```chart blocks with JSON data
interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'radar';
  title?: string;
  data: Array<Record<string, any>>;
  dataKey?: string;
  nameKey?: string;
}

const CHART_COLORS = [
  'hsl(38, 85%, 55%)',    // primary amber
  'hsl(200, 70%, 55%)',   // blue
  'hsl(150, 60%, 45%)',   // green
  'hsl(340, 65%, 55%)',   // rose
  'hsl(270, 60%, 55%)',   // purple
  'hsl(25, 80%, 50%)',    // orange
];

const ChartBlock = ({ config }: { config: ChartData }) => {
  const { type, title, data, dataKey = 'value', nameKey = 'name' } = config;

  return (
    <div className="my-5 p-4 rounded-xl border border-border bg-secondary/20">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-primary" />
          <h4 className="font-serif font-semibold text-sm text-foreground">{title}</h4>
        </div>
      )}
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" />
              <XAxis dataKey={nameKey} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 14%, 13%)', border: '1px solid hsl(220, 12%, 20%)', borderRadius: 8, color: 'hsl(40, 15%, 95%)' }} />
              <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220, 14%, 13%)', border: '1px solid hsl(220, 12%, 20%)', borderRadius: 8, color: 'hsl(40, 15%, 95%)' }} />
            </PieChart>
          ) : type === 'radar' ? (
            <RadarChart data={data} cx="50%" cy="50%" outerRadius={80}>
              <PolarGrid stroke="hsl(220, 12%, 20%)" />
              <PolarAngleAxis dataKey={nameKey} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 10 }} />
              <Radar dataKey={dataKey} stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
            </RadarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 12%, 20%)" />
              <XAxis dataKey={nameKey} tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 14%, 13%)', border: '1px solid hsl(220, 12%, 20%)', borderRadius: 8, color: 'hsl(40, 15%, 95%)' }} />
              <Line type="monotone" dataKey={dataKey} stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Code Block ─────────────────────────────────────────────────
const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 bg-background/80 hover:bg-background"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
          padding: '1rem',
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

// ─── Callout detection from blockquotes ─────────────────────────
const CALLOUT_PATTERNS: Record<string, { icon: typeof Lightbulb; label: string; className: string }> = {
  '💡': { icon: Lightbulb, label: 'Insight', className: 'border-primary/40 bg-primary/5' },
  '⚠️': { icon: AlertTriangle, label: 'Warning', className: 'border-destructive/40 bg-destructive/5' },
  '✅': { icon: CheckCircle2, label: 'Key Point', className: 'border-emerald-500/40 bg-emerald-500/5' },
  'ℹ️': { icon: Info, label: 'Note', className: 'border-blue-400/40 bg-blue-400/5' },
  '📖': { icon: BookOpen, label: 'Reference', className: 'border-purple-400/40 bg-purple-400/5' },
};

// ─── Main Component ─────────────────────────────────────────────
export const MessageContent = ({ content }: MessageContentProps) => {
  // Extract chart, mermaid, image, and skill-execute blocks from content before markdown rendering
  const { processedContent, charts, mermaidDiagrams, images, skillExecutions, skillGenerations } = useMemo(() => {
    const chartBlocks: ChartData[] = [];
    const mermaidBlocks: { chart: string; title?: string }[] = [];
    const imageBlocks: { prompt: string; caption?: string }[] = [];
    const skillBlocks: { skillId: string; skillName: string; input: any }[] = [];
    const skillGenBlocks: { skillDescription: string; advisorId: string; context?: string }[] = [];

    let processed = content
      // Extract chart blocks
      .replace(/```chart\n([\s\S]*?)```/g, (_, json) => {
        try {
          const parsed = JSON.parse(json.trim());
          chartBlocks.push(parsed);
          return `\n<!--chart-${chartBlocks.length - 1}-->\n`;
        } catch {
          return `\`\`\`\n${json}\`\`\``;
        }
      })
      // Extract mermaid blocks
      .replace(/```mermaid\n([\s\S]*?)```/g, (_, diagram) => {
        mermaidBlocks.push({ chart: diagram.trim() });
        return `\n<!--mermaid-${mermaidBlocks.length - 1}-->\n`;
      })
      // Extract image blocks
      .replace(/```image\n([\s\S]*?)```/g, (_, json) => {
        try {
          const parsed = JSON.parse(json.trim());
          imageBlocks.push(parsed);
          return `\n<!--image-${imageBlocks.length - 1}-->\n`;
        } catch {
          return `\`\`\`\n${json}\`\`\``;
        }
      })
      // Extract skill-execute blocks
      .replace(/```skill-execute\n([\s\S]*?)```/g, (_, json) => {
        try {
          const parsed = JSON.parse(json.trim());
          skillBlocks.push(parsed);
          return `\n<!--skill-${skillBlocks.length - 1}-->\n`;
        } catch {
          return `\`\`\`\n${json}\`\`\``;
        }
      })
      // Extract skill-generate blocks
      .replace(/```skill-generate\n([\s\S]*?)```/g, (_, json) => {
        try {
          const parsed = JSON.parse(json.trim());
          skillGenBlocks.push(parsed);
          return `\n<!--skillgen-${skillGenBlocks.length - 1}-->\n`;
        } catch {
          return `\`\`\`\n${json}\`\`\``;
        }
      });

    return {
      processedContent: processed,
      charts: chartBlocks,
      mermaidDiagrams: mermaidBlocks,
      images: imageBlocks,
      skillExecutions: skillBlocks,
      skillGenerations: skillGenBlocks,
    };
  }, [content]);

  // Split content by chart, mermaid, image, and skill placeholders and render
  const segments = useMemo(() => {
    const parts = processedContent.split(/<!--(chart|mermaid|image|skill|skillgen)-(\d+)-->/);
    const result: Array<{ type: 'chart' | 'mermaid' | 'image' | 'skill' | 'skillgen' | 'markdown'; index?: number; content?: string }> = [];

    for (let i = 0; i < parts.length; i++) {
      if (i % 3 === 0 && parts[i].trim()) {
        result.push({ type: 'markdown', content: parts[i] });
      } else if (i % 3 === 1) {
        const blockType = parts[i] as 'chart' | 'mermaid' | 'image' | 'skill' | 'skillgen';
        const index = parseInt(parts[i + 1]);
        result.push({ type: blockType, index });
      }
    }

    return result;
  }, [processedContent]);

  return (
    <div className="space-y-1">
      {segments.map((segment, i) => {
        if (segment.type === 'chart' && segment.index !== undefined && charts[segment.index]) {
          return <ChartBlock key={`chart-${i}`} config={charts[segment.index]} />;
        }
        if (segment.type === 'mermaid' && segment.index !== undefined && mermaidDiagrams[segment.index]) {
          return <MermaidBlock key={`mermaid-${i}`} {...mermaidDiagrams[segment.index]} />;
        }
        if (segment.type === 'image' && segment.index !== undefined && images[segment.index]) {
          return <ImageBlock key={`image-${i}`} {...images[segment.index]} />;
        }
        if (segment.type === 'skill' && segment.index !== undefined && skillExecutions[segment.index]) {
          return <SkillExecutionBlock key={`skill-${i}`} {...skillExecutions[segment.index]} autoExecute={true} />;
        }
        if (segment.type === 'skillgen' && segment.index !== undefined && skillGenerations[segment.index]) {
          return <SkillGenerationBlock key={`skillgen-${i}`} {...skillGenerations[segment.index]} />;
        }
        if (segment.type === 'markdown' && segment.content?.trim()) {
          return (
            <div
              key={`md-${i}`}
              className="prose prose-sm prose-invert max-w-none
                prose-headings:font-serif prose-headings:text-foreground prose-headings:tracking-tight
                prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6 prose-h1:flex prose-h1:items-center prose-h1:gap-2
                prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-5 prose-h2:flex prose-h2:items-center prose-h2:gap-2 prose-h2:text-primary
                prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2 prose-h3:mt-4 prose-h3:text-foreground/90
                prose-p:text-secondary-foreground prose-p:leading-[1.8] prose-p:mb-3
                prose-strong:text-foreground prose-strong:font-semibold
                prose-em:text-primary/80 prose-em:font-medium
                prose-ul:my-3 prose-ul:pl-1 prose-ul:space-y-1.5
                prose-ol:my-3 prose-ol:pl-1 prose-ol:space-y-1.5 prose-ol:text-base prose-ol:font-semibold
                prose-li:text-secondary-foreground prose-li:leading-relaxed
                prose-blockquote:border-l-2 prose-blockquote:border-l-primary/50 prose-blockquote:bg-secondary/20
                prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
                prose-blockquote:text-muted-foreground prose-blockquote:italic prose-blockquote:my-4
                prose-a:text-primary prose-a:underline prose-a:underline-offset-2 prose-a:decoration-primary/30
                prose-hr:border-border prose-hr:my-5
                prose-table:border-collapse prose-table:w-full
                prose-th:border prose-th:border-border prose-th:bg-secondary/50 prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:font-semibold
                prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1({ children }) {
                    return (
                      <h1>
                        <span className="inline-block w-1 h-6 rounded-full bg-primary mr-2" />
                        {children}
                      </h1>
                    );
                  },
                  h2({ children }) {
                    return (
                      <h2>
                        <span className="text-primary">✦</span>
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }) {
                    return (
                      <h3 className="text-foreground/90 border-b border-border/30 pb-1">
                        {children}
                      </h3>
                    );
                  },
                  blockquote({ children }) {
                    // Detect callout type from content
                    const text = String(children);
                    let calloutMatch: { icon: typeof Lightbulb; label: string; className: string } | null = null;

                    for (const [emoji, config] of Object.entries(CALLOUT_PATTERNS)) {
                      if (text.includes(emoji)) {
                        calloutMatch = config;
                        break;
                      }
                    }

                    if (calloutMatch) {
                      const Icon = calloutMatch.icon;
                      return (
                        <div className={`my-3 p-3 rounded-lg border-l-2 ${calloutMatch.className}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <Icon className="w-4 h-4 text-primary shrink-0" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {calloutMatch.label}
                            </span>
                          </div>
                          <div className="text-sm text-secondary-foreground [&>p]:mb-0">{children}</div>
                        </div>
                      );
                    }

                    return (
                      <blockquote className="flex gap-2">
                        <Quote className="w-4 h-4 text-primary/50 shrink-0 mt-1" />
                        <div>{children}</div>
                      </blockquote>
                    );
                  },
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !className;

                    if (isInline) {
                      return (
                        <code
                          className="bg-secondary/80 px-1.5 py-0.5 rounded text-sm font-mono text-primary border border-border/30"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock language={match ? match[1] : ''}>
                        {String(children).replace(/\n$/, '')}
                      </CodeBlock>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-4 rounded-lg border border-border">
                        <table className="w-full">{children}</table>
                      </div>
                    );
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-outside ml-4 space-y-0.5">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-outside ml-4 space-y-0.5">{children}</ol>;
                  },
                  li({ children }) {
                    return <li className="text-secondary-foreground">{children}</li>;
                  },
                  hr() {
                    return (
                      <div className="my-4 flex items-center gap-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-primary/40 text-xs">✦</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    );
                  },
                }}
              >
                {segment.content}
              </ReactMarkdown>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
