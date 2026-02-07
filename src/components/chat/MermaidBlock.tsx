import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Network } from 'lucide-react';

interface MermaidBlockProps {
    chart: string;
    title?: string;
}

export const MermaidBlock = ({ chart, title }: MermaidBlockProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!ref.current) return;

            try {
                // Initialize mermaid with dark theme
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'dark',
                    themeVariables: {
                        primaryColor: 'hsl(38, 85%, 55%)',
                        primaryTextColor: '#fff',
                        primaryBorderColor: 'hsl(38, 85%, 45%)',
                        lineColor: 'hsl(220, 10%, 55%)',
                        secondaryColor: 'hsl(200, 70%, 55%)',
                        tertiaryColor: 'hsl(150, 60%, 45%)',
                        background: 'hsl(220, 14%, 13%)',
                        mainBkg: 'hsl(220, 14%, 18%)',
                        secondBkg: 'hsl(220, 14%, 22%)',
                        tertiaryBkg: 'hsl(220, 14%, 16%)',
                        textColor: 'hsl(40, 15%, 95%)',
                        border1: 'hsl(220, 12%, 30%)',
                        border2: 'hsl(220, 12%, 25%)',
                    },
                });

                // Generate unique ID for this diagram
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // Render the diagram
                const { svg } = await mermaid.render(id, chart);

                if (ref.current) {
                    ref.current.innerHTML = svg;
                }
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError(true);
            }
        };

        renderDiagram();
    }, [chart]);

    if (error) {
        return (
            <div className="my-5 p-4 rounded-xl border border-destructive/40 bg-destructive/5">
                <p className="text-sm text-destructive">Failed to render diagram</p>
            </div>
        );
    }

    return (
        <div className="my-5 p-4 rounded-xl border border-border bg-secondary/20">
            {title && (
                <div className="flex items-center gap-2 mb-3">
                    <Network className="w-4 h-4 text-primary" />
                    <h4 className="font-serif font-semibold text-sm text-foreground">{title}</h4>
                </div>
            )}
            <div
                ref={ref}
                className="flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto"
            />
        </div>
    );
};
