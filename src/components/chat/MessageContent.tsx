import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MessageContentProps {
  content: string;
}

const CodeBlock = ({ language, children }: { language: string; children: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
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

export const MessageContent = ({ content }: MessageContentProps) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none 
      prose-headings:font-serif prose-headings:text-foreground
      prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h1:mt-6
      prose-h2:text-lg prose-h2:font-semibold prose-h2:mb-3 prose-h2:mt-5
      prose-h3:text-base prose-h3:font-medium prose-h3:mb-2 prose-h3:mt-4
      prose-p:text-secondary-foreground prose-p:leading-relaxed prose-p:mb-3
      prose-strong:text-foreground prose-strong:font-semibold
      prose-em:text-primary/90
      prose-ul:my-3 prose-ul:pl-4
      prose-ol:my-3 prose-ol:pl-4
      prose-li:text-secondary-foreground prose-li:mb-1
      prose-blockquote:border-l-primary prose-blockquote:bg-secondary/30 
      prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
      prose-blockquote:text-muted-foreground prose-blockquote:italic
      prose-a:text-primary prose-a:underline prose-a:underline-offset-2
      prose-hr:border-border prose-hr:my-6
      prose-table:border-collapse prose-table:w-full
      prose-th:border prose-th:border-border prose-th:bg-secondary/50 prose-th:px-3 prose-th:py-2 prose-th:text-left
      prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;
            
            if (isInline) {
              return (
                <code 
                  className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-primary"
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
            return <ul className="list-disc list-outside ml-4">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-outside ml-4">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-1">{children}</li>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
