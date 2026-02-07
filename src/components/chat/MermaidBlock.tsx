import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Network, Maximize2 } from 'lucide-react';
import { Lightbox } from '@/components/ui/Lightbox';

interface MermaidBlockProps {
    chart: string;
    title?: string;
}

export const MermaidBlock = ({ chart, title }: MermaidBlockProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [error, setError] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!ref.current) return;

            try {
                // Force re-initialize mermaid with vibrant theme (fixes caching)
                // Using 'base' theme instead of 'dark' to have better control over colors
                mermaid.initialize({
                    startOnLoad: false,
                    theme: 'base',
                    themeVariables: {
                        // Primary nodes: Vibrant Amber/Gold with DARK text
                        primaryColor: '#FCD34D',  // Bright amber
                        primaryTextColor: '#1F2937',  // Dark gray text
                        primaryBorderColor: '#F59E0B',  // Darker amber border

                        // Secondary nodes: Bright Cyan with DARK text
                        secondaryColor: '#22D3EE',  // Bright cyan
                        secondaryTextColor: '#1F2937',  // Dark gray text
                        secondaryBorderColor: '#0891B2',  // Darker cyan border

                        // Tertiary nodes: Vibrant Emerald with DARK text
                        tertiaryColor: '#34D399',  // Bright emerald
                        tertiaryTextColor: '#1F2937',  // Dark gray text
                        tertiaryBorderColor: '#059669',  // Darker emerald border

                        // Lines and connections - bright blue
                        lineColor: '#60A5FA',

                        // Backgrounds - dark theme
                        background: '#1F2937',
                        mainBkg: '#374151',
                        secondBkg: '#4B5563',
                        tertiaryBkg: '#374151',

                        // Default text - light for dark backgrounds
                        textColor: '#F3F4F6',

                        // Borders - visible
                        border1: '#6B7280',
                        border2: '#9CA3AF',

                        // Notes: Amber with dark text
                        noteBkgColor: '#FCD34D',
                        noteTextColor: '#1F2937',
                        noteBorderColor: '#F59E0B',

                        // Class diagrams
                        classText: '#1F2937',

                        // Labels
                        labelColor: '#F3F4F6',
                        labelTextColor: '#1F2937',
                        labelBoxBkgColor: '#FCD34D',
                        labelBoxBorderColor: '#F59E0B',

                        // Flowchart
                        edgeLabelBackground: '#374151',
                        clusterBkg: '#1F2937',
                        clusterBorder: '#6B7280',
                        defaultLinkColor: '#60A5FA',

                        // Actor colors (sequence diagrams)
                        actorBkg: '#FCD34D',
                        actorBorder: '#F59E0B',
                        actorTextColor: '#1F2937',
                        actorLineColor: '#9CA3AF',

                        // Signal colors
                        signalColor: '#F3F4F6',
                        signalTextColor: '#F3F4F6',

                        // Git graph - vibrant colors
                        git0: '#FCD34D',  // Amber
                        git1: '#22D3EE',  // Cyan
                        git2: '#34D399',  // Emerald
                        git3: '#A78BFA',  // Purple
                        git4: '#FB7185',  // Rose
                        git5: '#FB923C',  // Orange
                        git6: '#4ADE80',  // Green
                        git7: '#38BDF8',  // Sky blue

                        // Pie chart
                        pie1: '#FCD34D',
                        pie2: '#22D3EE',
                        pie3: '#34D399',
                        pie4: '#A78BFA',
                        pie5: '#FB7185',
                        pie6: '#FB923C',
                        pie7: '#4ADE80',
                        pie8: '#38BDF8',
                        pie9: '#F472B6',
                        pie10: '#FBBF24',
                        pie11: '#10B981',
                        pie12: '#3B82F6',
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
                <p className="text-sm text-destructive mb-2">Failed to render diagram</p>
                <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        View source
                    </summary>
                    <pre className="mt-2 p-2 bg-background rounded overflow-x-auto text-xs">
                        <code>{chart}</code>
                    </pre>
                </details>
            </div>
        );
    }

    return (
        <>
            <div className="my-5 p-4 rounded-xl border border-border bg-secondary/20 group relative">
                {title && (
                    <div className="flex items-center gap-2 mb-3">
                        <Network className="w-4 h-4 text-primary" />
                        <h4 className="font-serif font-semibold text-sm text-foreground">{title}</h4>
                    </div>
                )}
                <div
                    ref={ref}
                    className="flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsLightboxOpen(true)}
                />
                {/* Zoom hint */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border border-border text-xs text-muted-foreground">
                        <Maximize2 className="w-3 h-3" />
                        <span>Click to zoom</span>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <Lightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                title={title || 'Diagram'}
            >
                <div className="flex items-center justify-center">
                    <div dangerouslySetInnerHTML={{ __html: ref.current?.innerHTML || '' }} />
                </div>
            </Lightbox>
        </>
    );
};
