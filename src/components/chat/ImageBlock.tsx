import { useEffect, useState } from 'react';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ImageBlockProps {
    prompt: string;
    caption?: string;
}

export const ImageBlock = ({ prompt, caption }: ImageBlockProps) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        generateImage();
    }, [prompt]);

    const generateImage = async () => {
        try {
            setLoading(true);
            setError(false);

            const { data, error: functionError } = await supabase.functions.invoke('generate-image', {
                body: { prompt },
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
        <div className="my-5 rounded-xl border border-border bg-secondary/20 overflow-hidden">
            <img
                src={imageUrl}
                alt={caption || prompt}
                className="w-full h-auto"
                loading="lazy"
            />
            {caption && (
                <div className="p-3 bg-secondary/40 border-t border-border">
                    <div className="flex items-start gap-2">
                        <ImageIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground italic">{caption}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
