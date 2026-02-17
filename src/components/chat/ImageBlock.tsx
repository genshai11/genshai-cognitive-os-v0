import { useEffect, useState } from 'react';
import { Loader2, Image as ImageIcon, AlertCircle, Maximize2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Lightbox } from '@/components/ui/Lightbox';

interface ImageBlockProps {
    prompt: string;
    caption?: string;
}

export const ImageBlock = ({ prompt, caption }: ImageBlockProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        generateImage();
    }, [prompt]);

    const generateImage = async () => {
        try {
            setLoading(true);
            setError(false);

            // Read user provider settings (9router/direct) from localStorage
            let providerSettings: Record<string, string> = {};
            try {
                const stored = localStorage.getItem('ai-provider-settings');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (parsed.providerType && parsed.providerType !== 'lovable') {
                        providerSettings = {
                            providerType: parsed.providerType,
                            endpoint: parsed.endpoint || '',
                            apiKey: parsed.apiKey || '',
                            model: parsed.model || '',
                        };
                    }
                }
            } catch { /* ignore parse errors */ }

            const { data, error: functionError } = await supabase.functions.invoke('generate-image', {
                body: { prompt, ...providerSettings },
            });

            if (functionError) {
                console.error('Image generation error:', functionError);
                setError(true);
                return;
            }

            if (data?.url) {
                setImageUrl(data.url);
            } else {
                setError(true);
            }
        } catch (err) {
            console.error('Failed to generate image:', err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="my-5 p-8 rounded-xl border border-border bg-secondary/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Generating image...</span>
            </div>
        );
    }

    if (error || !imageUrl) {
        return (
            <div className="my-5 p-4 rounded-xl border border-destructive/40 bg-destructive/5 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive">Failed to generate image</p>
            </div>
        );
    }

    return (
        <>
            <div className="my-5 rounded-xl border border-border bg-secondary/20 overflow-hidden group relative">
                <div
                    className="cursor-pointer relative hover:opacity-90 transition-opacity"
                    onClick={() => setIsLightboxOpen(true)}
                >
                    <img
                        src={imageUrl}
                        alt={caption || prompt}
                        className="w-full h-auto"
                        loading="lazy"
                    />
                    {/* Zoom hint */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background/90 border border-border text-xs text-muted-foreground">
                            <Maximize2 className="w-3 h-3" />
                            <span>Click to zoom</span>
                        </div>
                    </div>
                </div>
                {caption && (
                    <div className="p-3 bg-secondary/40 border-t border-border">
                        <div className="flex items-start gap-2">
                            <ImageIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs text-muted-foreground italic">{caption}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Lightbox */}
            <Lightbox
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                title={caption || 'AI Generated Image'}
            >
                <div className="flex flex-col items-center gap-4">
                    <img
                        src={imageUrl}
                        alt={caption || prompt}
                        className="max-w-full h-auto rounded-lg"
                    />
                    {caption && (
                        <p className="text-sm text-muted-foreground italic text-center max-w-2xl">
                            {caption}
                        </p>
                    )}
                </div>
            </Lightbox>
        </>
    );
};
