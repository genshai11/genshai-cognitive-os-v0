import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, ExternalLink, AlertTriangle, Eye, EyeOff } from 'lucide-react';

type ProviderType = 'lovable' | 'cliproxy' | 'direct';
type DirectProvider = 'openai' | 'anthropic' | 'google' | 'openrouter';

interface AISettings {
    provider_type: ProviderType;
    cliproxy_url: string;
    cliproxy_enabled: boolean;
    default_chat_model: string;
    direct_provider: DirectProvider | '';
    direct_api_key: string; // plaintext in UI, encrypted on save
    direct_api_url: string;
    model_overrides: Record<string, string>;
}

const DEFAULT_MODELS = [
    { id: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (FREE)' },
    { id: 'gpt-4o', label: 'GPT-4o (ChatGPT Plus)' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet (Claude Pro)' },
    { id: 'qwen-max', label: 'Qwen Max (FREE tier)' },
];

const DIRECT_PROVIDERS = [
    { id: 'openrouter', label: 'OpenRouter', desc: 'Many models, single API key', defaultModel: 'google/gemini-2.0-flash-exp:free' },
    { id: 'openai', label: 'OpenAI', desc: 'GPT-4o, GPT-4o-mini', defaultModel: 'gpt-4o-mini' },
    { id: 'google', label: 'Google AI', desc: 'Gemini models', defaultModel: 'gemini-2.0-flash' },
    { id: 'anthropic', label: 'Anthropic', desc: 'Claude models', defaultModel: 'claude-sonnet-4-5-20250929' },
];

const FUNCTION_NAMES = [
    { id: 'advisor-chat', label: 'Advisor Chat' },
    { id: 'persona-chat', label: 'Persona Chat' },
    { id: 'book-chat', label: 'Book Chat' },
    { id: 'generate-advisor', label: 'Generate Advisor' },
    { id: 'detect-response-style', label: 'Style Detection' },
    { id: 'memory-manager', label: 'Memory Extraction' },
    { id: 'goodreads-import', label: 'Book Import' },
    { id: 'skill-generator', label: 'Skill Generator' },
];

export default function AIProviderSettings() {
    const [settings, setSettings] = useState<AISettings>({
        provider_type: 'lovable',
        cliproxy_url: '',
        cliproxy_enabled: false,
        default_chat_model: 'gemini-2.0-flash-exp',
        direct_provider: '',
        direct_api_key: '',
        direct_api_url: '',
        model_overrides: {},
    });

    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [showApiKey, setShowApiKey] = useState(false);
    const [hasExistingKey, setHasExistingKey] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('admin_ai_settings')
                .select('*')
                .single();

            if (error) throw error;

            if (data) {
                setSettings({
                    provider_type: data.provider_type as ProviderType,
                    cliproxy_url: data.cliproxy_url || '',
                    cliproxy_enabled: data.cliproxy_enabled || false,
                    default_chat_model: data.default_chat_model || 'gemini-2.0-flash-exp',
                    direct_provider: (data.direct_provider as DirectProvider) || '',
                    direct_api_key: '', // never load encrypted key back
                    direct_api_url: data.direct_api_url || '',
                    model_overrides: (data.model_overrides as Record<string, string>) || {},
                });
                setHasExistingKey(!!data.direct_api_key_encrypted);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            toast.error('Failed to load AI provider settings');
        } finally {
            setLoading(false);
        }
    };

    const testConnection = async () => {
        if (!settings.cliproxy_url) {
            toast.error('Please enter CLIProxyAPI URL');
            return;
        }

        setTesting(true);
        setConnectionStatus('idle');
        setAvailableModels([]);

        try {
            const { data, error } = await supabase.functions.invoke('test-ai-connection', {
                body: { cliproxy_url: settings.cliproxy_url },
            });

            if (error) throw error;

            if (data?.success) {
                setConnectionStatus('success');
                if (data.models?.length > 0) {
                    setAvailableModels(data.models);
                    toast.success(`Connected! Found ${data.models.length} models.`);
                } else {
                    toast.success('CLIProxyAPI connection successful!');
                }
            } else {
                setConnectionStatus('error');
                toast.error(data?.error || 'Cannot connect to CLIProxyAPI');
            }
        } catch (error) {
            setConnectionStatus('error');
            toast.error('Connection test failed. Check the server URL.');
        } finally {
            setTesting(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);

        try {
            const updateData: Record<string, any> = {
                provider_type: settings.provider_type,
                cliproxy_url: settings.cliproxy_url,
                cliproxy_enabled: settings.provider_type === 'cliproxy',
                default_chat_model: settings.default_chat_model,
                direct_provider: settings.direct_provider || null,
                direct_api_url: settings.direct_api_url || null,
                model_overrides: settings.model_overrides,
            };

            // Only encrypt and save API key if a new one was entered
            if (settings.direct_api_key) {
                const { data: encrypted, error: encError } = await supabase.rpc('encrypt_api_key', {
                    raw_key: settings.direct_api_key,
                });
                if (encError) throw encError;
                updateData.direct_api_key_encrypted = encrypted;
            }

            const { error } = await supabase
                .from('admin_ai_settings')
                .update(updateData)
                .eq('id', '00000000-0000-0000-0000-000000000001');

            if (error) throw error;

            if (settings.direct_api_key) {
                setHasExistingKey(true);
                setSettings(prev => ({ ...prev, direct_api_key: '' }));
            }

            toast.success('AI provider settings saved!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const setModelOverride = (functionName: string, model: string) => {
        setSettings(prev => ({
            ...prev,
            model_overrides: model
                ? { ...prev.model_overrides, [functionName]: model }
                : Object.fromEntries(
                    Object.entries(prev.model_overrides).filter(([k]) => k !== functionName)
                ),
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }

    const modelOptions = availableModels.length > 0
        ? availableModels.map(id => ({ id, label: id }))
        : DEFAULT_MODELS;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">AI Provider Settings</h2>
                <p className="text-muted-foreground">
                    Configure how the platform connects to AI models
                </p>
            </div>

            {/* Provider Selection */}
            <Card>
                <CardHeader>
                    <CardTitle>Provider Selection</CardTitle>
                    <CardDescription>Choose your AI provider strategy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <RadioGroup
                        value={settings.provider_type}
                        onValueChange={(value) =>
                            setSettings({ ...settings, provider_type: value as ProviderType })
                        }
                    >
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="lovable" id="lovable" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="lovable" className="cursor-pointer">
                                    <strong>Lovable Cloud</strong>
                                    <span className="ml-2 text-xs text-muted-foreground">~$7/month</span>
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    No setup required, just works. Current default.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="cliproxy" id="cliproxy" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="cliproxy" className="cursor-pointer">
                                    <strong>CLIProxyAPI</strong>
                                    <span className="ml-2 text-xs text-green-600 font-semibold">FREE</span>
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Use Google/ChatGPT/Qwen OAuth accounts. Requires server setup.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                            <RadioGroupItem value="direct" id="direct" className="mt-1" />
                            <div className="flex-1">
                                <Label htmlFor="direct" className="cursor-pointer">
                                    <strong>Direct API Keys</strong>
                                    <span className="ml-2 text-xs text-muted-foreground">pay-per-token</span>
                                </Label>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Use your own OpenAI/Google/Anthropic/OpenRouter API key.
                                </p>
                            </div>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>

            {/* CLIProxyAPI Configuration */}
            {settings.provider_type === 'cliproxy' && (
                <Card>
                    <CardHeader>
                        <CardTitle>CLIProxyAPI Configuration</CardTitle>
                        <CardDescription>Set up your CLIProxyAPI server connection</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription className="text-sm">
                                <strong>Important:</strong> CLIProxyAPI must be deployed on a publicly accessible server
                                (e.g., Railway, Fly.io, Render, or a VPS). Supabase Edge Functions run in the cloud
                                and cannot reach localhost or private networks.
                            </AlertDescription>
                        </Alert>

                        <Alert>
                            <AlertDescription className="text-sm">
                                <strong>Setup Instructions:</strong>
                                <ol className="mt-2 space-y-1 list-decimal list-inside">
                                    <li>
                                        Download CLIProxyAPI from{' '}
                                        <a href="https://github.com/router-for-me/CLIProxyAPI/releases" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                            GitHub <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </li>
                                    <li>Deploy to a public server (Railway, Fly.io, Render, etc.)</li>
                                    <li>Login with Google/ChatGPT/Qwen accounts</li>
                                    <li>Enter the public server URL below and test the connection</li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <Label>CLIProxyAPI Server URL</Label>
                            <Input
                                value={settings.cliproxy_url}
                                onChange={(e) => setSettings({ ...settings, cliproxy_url: e.target.value })}
                                placeholder="https://cliproxy.yourdomain.com"
                            />
                            <p className="text-xs text-muted-foreground">Must be a publicly accessible URL (not localhost).</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Default Chat Model</Label>
                            <Select value={settings.default_chat_model} onValueChange={(value) => setSettings({ ...settings, default_chat_model: value })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {modelOptions.map((model) => (
                                        <SelectItem key={model.id} value={model.id}>{model.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {availableModels.length > 0 && (
                                <p className="text-xs text-green-600">Showing {availableModels.length} models from your CLIProxyAPI server.</p>
                            )}
                        </div>

                        <Button onClick={testConnection} disabled={testing || !settings.cliproxy_url} variant="outline" className="w-full">
                            {testing ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing Connection...</>) : 'Test Connection'}
                        </Button>

                        {connectionStatus === 'success' && (
                            <Alert><CheckCircle2 className="w-4 h-4 text-green-600" /><AlertDescription className="text-green-600">Connection successful! CLIProxyAPI is reachable.</AlertDescription></Alert>
                        )}
                        {connectionStatus === 'error' && (
                            <Alert variant="destructive"><XCircle className="w-4 h-4" /><AlertDescription>Cannot connect to CLIProxyAPI. Make sure it's running on a public URL.</AlertDescription></Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Direct API Keys Configuration */}
            {settings.provider_type === 'direct' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Direct API Configuration</CardTitle>
                        <CardDescription>Connect using your own API key</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>API Provider</Label>
                            <Select
                                value={settings.direct_provider}
                                onValueChange={(value) => {
                                    const provider = DIRECT_PROVIDERS.find(p => p.id === value);
                                    setSettings({
                                        ...settings,
                                        direct_provider: value as DirectProvider,
                                        default_chat_model: provider?.defaultModel || settings.default_chat_model,
                                    });
                                }}
                            >
                                <SelectTrigger><SelectValue placeholder="Select provider..." /></SelectTrigger>
                                <SelectContent>
                                    {DIRECT_PROVIDERS.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.label} - {p.desc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>API Key</Label>
                            <div className="relative">
                                <Input
                                    type={showApiKey ? 'text' : 'password'}
                                    value={settings.direct_api_key}
                                    onChange={(e) => setSettings({ ...settings, direct_api_key: e.target.value })}
                                    placeholder={hasExistingKey ? 'Key saved (enter new to replace)' : 'sk-...'}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowApiKey(!showApiKey)}
                                >
                                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Your API key is encrypted before storage. It is never exposed in the frontend.
                            </p>
                        </div>

                        {settings.direct_provider === 'openrouter' && (
                            <Alert>
                                <AlertDescription className="text-sm">
                                    <strong>OpenRouter</strong> provides access to 100+ models through a single API key.
                                    Many models have free tiers. Get your key at{' '}
                                    <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        openrouter.ai/keys
                                    </a>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label>Default Chat Model</Label>
                            <Input
                                value={settings.default_chat_model}
                                onChange={(e) => setSettings({ ...settings, default_chat_model: e.target.value })}
                                placeholder="e.g., gpt-4o-mini"
                            />
                            <p className="text-xs text-muted-foreground">
                                Model ID as expected by the API provider.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Custom API URL (optional)</Label>
                            <Input
                                value={settings.direct_api_url}
                                onChange={(e) => setSettings({ ...settings, direct_api_url: e.target.value })}
                                placeholder="Leave empty for default provider URL"
                            />
                            <p className="text-xs text-muted-foreground">
                                Override the API endpoint. Useful for proxies or self-hosted models.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lovable Cloud Info */}
            {settings.provider_type === 'lovable' && (
                <Alert>
                    <AlertDescription>
                        <strong>Lovable Cloud</strong> is currently active. No additional configuration needed.
                        The platform uses the existing LOVABLE_API_KEY environment variable.
                    </AlertDescription>
                </Alert>
            )}

            {/* Per-Function Model Overrides */}
            <Card>
                <CardHeader>
                    <CardTitle>Model Overrides (Optional)</CardTitle>
                    <CardDescription>
                        Use a different model for specific functions. Leave empty to use the default model.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {FUNCTION_NAMES.map((fn) => (
                        <div key={fn.id} className="flex items-center gap-3">
                            <Label className="w-40 text-sm shrink-0">{fn.label}</Label>
                            <Input
                                value={settings.model_overrides[fn.id] || ''}
                                onChange={(e) => setModelOverride(fn.id, e.target.value)}
                                placeholder={`Default: ${settings.default_chat_model}`}
                                className="text-sm"
                            />
                        </div>
                    ))}
                    <p className="text-xs text-muted-foreground mt-2">
                        Use cheaper models for background tasks (style detection, memory extraction) to save costs.
                    </p>
                </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={saveSettings} disabled={saving} className="w-full" size="lg">
                {saving ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>) : 'Save Settings'}
            </Button>
        </div>
    );
}
