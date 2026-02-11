import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Loader2, Eye, EyeOff, ExternalLink,
  Shuffle, Server, Zap, Globe, Settings2, ArrowRight, RefreshCw, Search, Filter
} from 'lucide-react';

type ProviderType = '9router' | 'direct' | 'lovable';

interface ModelInfo {
  id: string;
  name: string;
  owned_by?: string;
  provider?: string;
}

interface AISettings {
  providerType: ProviderType;
  endpoint: string;
  apiKey: string;
  model: string;
  directProvider: string;
  directApiKey: string;
  directEndpoint: string;
  directModel: string;
}

const NINE_ROUTER_STATIC_MODELS = [
  { id: 'if/kimi-k2-thinking', label: 'Kimi K2 Thinking (Free)', provider: 'iflow' },
  { id: 'cc/claude-opus-4-6', label: 'Claude Opus 4 (Subscription)', provider: 'claude-code' },
  { id: 'cc/claude-sonnet-4', label: 'Claude Sonnet 4 (Subscription)', provider: 'claude-code' },
  { id: 'glm/glm-4.7', label: 'GLM 4.7 (Cheap $0.6/1M)', provider: 'glm' },
  { id: 'mm/minimax', label: 'MiniMax (Cheap $0.2/1M)', provider: 'minimax' },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'qwen-max', label: 'Qwen Max (Free tier)', provider: 'qwen' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat', provider: 'deepseek' },
  { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner', provider: 'deepseek' },
];

const DIRECT_PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', desc: 'Many models, one API key', defaultEndpoint: 'https://openrouter.ai/api/v1', defaultModel: 'google/gemini-2.0-flash-exp:free' },
  { id: 'openai', label: 'OpenAI', desc: 'GPT-4o, GPT-4o-mini', defaultEndpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'google', label: 'Google AI', desc: 'Gemini models', defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta', defaultModel: 'gemini-2.0-flash' },
  { id: 'anthropic', label: 'Anthropic', desc: 'Claude models', defaultEndpoint: 'https://api.anthropic.com/v1', defaultModel: 'claude-sonnet-4-5-20250929' },
  { id: 'groq', label: 'Groq', desc: 'Ultra-fast inference', defaultEndpoint: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.1-70b-versatile' },
  { id: 'megallm', label: 'MegaLLM', desc: '70+ LLMs with fallbacks', defaultEndpoint: 'https://api.megallm.com/v1', defaultModel: 'gpt-4o-mini' },
  { id: 'cometapi', label: 'CometAPI', desc: '500+ models', defaultEndpoint: 'https://api.cometapi.com/v1', defaultModel: 'gpt-4o-mini' },
];

const DEFAULT_SETTINGS: AISettings = {
  providerType: '9router',
  endpoint: 'http://localhost:20128/v1',
  apiKey: '',
  model: 'if/kimi-k2-thinking',
  directProvider: 'openrouter',
  directApiKey: '',
  directEndpoint: 'https://openrouter.ai/api/v1',
  directModel: 'google/gemini-2.0-flash-exp:free',
};

export function AIProviderTab() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  const [loadedModels, setLoadedModels] = useState<ModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelProviders, setModelProviders] = useState<string[]>([]);
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [modelSearch, setModelSearch] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [showModelBrowser, setShowModelBrowser] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ai-provider-settings');
    if (stored) {
      try {
        setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
      } catch {}
    }
  }, []);

  const save = () => {
    const toSave = settings.providerType === '9router'
      ? { providerType: '9router', endpoint: settings.endpoint, apiKey: settings.apiKey, model: settings.model }
      : settings.providerType === 'direct'
      ? { providerType: 'direct', endpoint: settings.directEndpoint, apiKey: settings.directApiKey, model: settings.directModel }
      : { providerType: 'lovable', endpoint: '', apiKey: '', model: 'google/gemini-3-flash-preview' };
    localStorage.setItem('ai-provider-settings', JSON.stringify(toSave));
    toast.success('Settings saved!');
  };

  const fetchModels = async () => {
    const endpoint = settings.providerType === '9router' ? settings.endpoint : settings.directEndpoint;
    const apiKey = settings.providerType === '9router' ? settings.apiKey : settings.directApiKey;

    if (!endpoint || !apiKey) {
      toast.error('Please enter endpoint and API key first');
      return;
    }

    setLoadingModels(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-models', {
        body: { endpoint, apiKey },
      });

      if (error) throw error;

      if (data.models && data.models.length > 0) {
        setLoadedModels(data.models);
        setModelProviders(data.providers || []);
        setShowModelBrowser(true);
        toast.success(`Loaded ${data.models.length} models from ${data.providers?.length || 0} providers`);
      } else {
        toast.info(data.error || 'No models found. The endpoint may not support /models.');
      }
    } catch (e: any) {
      toast.error(`Failed to load models: ${e.message}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult('idle');
    try {
      const providerType = settings.providerType;
      const body: any = {
        providerType,
        messages: [{ role: 'user', content: 'Say "Connection successful!" in one sentence.' }],
        advisorId: 'first-principles',
      };

      if (providerType === '9router') {
        body.endpoint = settings.endpoint;
        body.apiKey = settings.apiKey;
        body.model = settings.model;
      } else if (providerType === 'direct') {
        body.endpoint = settings.directEndpoint;
        body.apiKey = settings.directApiKey;
        body.model = settings.directModel;
      }

      const response = await supabase.functions.invoke('advisor-chat', { body });
      if (response.error) throw new Error(response.error.message);
      setTestResult('success');
      toast.success('Connection successful!');
    } catch (e: any) {
      setTestResult('error');
      toast.error(`Connection failed: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleDirectProviderChange = (id: string) => {
    const provider = DIRECT_PROVIDERS.find((p) => p.id === id);
    if (provider) {
      setSettings((s) => ({
        ...s,
        directProvider: provider.id,
        directEndpoint: provider.defaultEndpoint,
        directModel: provider.defaultModel,
      }));
      setLoadedModels([]);
      setShowModelBrowser(false);
    }
  };

  const selectModel = (modelId: string) => {
    if (settings.providerType === '9router') {
      setSettings((s) => ({ ...s, model: modelId }));
    } else {
      setSettings((s) => ({ ...s, directModel: modelId }));
    }
    toast.success(`Selected: ${modelId}`);
  };

  const filteredModels = loadedModels.filter((m) => {
    const matchesProvider = providerFilter === 'all' || m.provider === providerFilter;
    const matchesSearch = !modelSearch || m.id.toLowerCase().includes(modelSearch.toLowerCase()) || (m.name && m.name.toLowerCase().includes(modelSearch.toLowerCase()));
    return matchesProvider && matchesSearch;
  });

  const currentModel = settings.providerType === '9router' ? settings.model : settings.directModel;

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          Configure your personal AI provider. This overrides the default admin settings.
          Use 9Router for smart multi-provider routing, or connect directly.
        </p>
      </div>

      {/* Provider Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Provider Type</CardTitle>
          <CardDescription>Choose how to route your AI requests</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.providerType}
            onValueChange={(v) => {
              setSettings((s) => ({ ...s, providerType: v as ProviderType }));
              setLoadedModels([]);
              setShowModelBrowser(false);
            }}
            className="space-y-3"
          >
            <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="9router" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shuffle className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">9Router (Recommended)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Smart 3-tier fallback: Subscription &rarr; Cheap &rarr; Free. Auto-route with zero downtime.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="direct" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Server className="w-4 h-4 text-accent" />
                  <span className="font-semibold text-sm">Direct Provider</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect directly to OpenAI, Anthropic, Google, OpenRouter, Groq, MegaLLM, CometAPI.
                </p>
              </div>
            </label>
            <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="lovable" className="mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">Built-in AI (No setup needed)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Uses the built-in AI gateway. No API key or configuration required.
                </p>
              </div>
            </label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* 9Router Config */}
      {settings.providerType === '9router' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="w-5 h-5 text-primary" />
                  9Router Configuration
                </CardTitle>
                <CardDescription>
                  Connect to your local or remote 9Router instance
                </CardDescription>
              </div>
              <a href="https://9router.com" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" />
                  9router.com
                </Button>
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert className="bg-primary/5 border-primary/15">
              <Zap className="w-4 h-4 text-primary" />
              <AlertDescription className="text-xs">
                <strong>Quick Start:</strong> Run{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">npm install -g 9router && 9router</code>{' '}
                then connect FREE providers from the dashboard at{' '}
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs">localhost:20128</code>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm">Endpoint URL</Label>
              <Input
                value={settings.endpoint}
                onChange={(e) => setSettings((s) => ({ ...s, endpoint: e.target.value }))}
                placeholder="http://localhost:20128/v1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.apiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, apiKey: e.target.value }))}
                  placeholder="Copy from 9Router dashboard"
                  className="pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Model / Combo</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={fetchModels}
                  disabled={loadingModels}
                >
                  {loadingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Load from 9Router
                </Button>
              </div>
              <Select
                value={settings.model}
                onValueChange={(v) => setSettings((s) => ({ ...s, model: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {NINE_ROUTER_STATIC_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.provider}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Input
                  value={customModel}
                  onChange={(e) => setCustomModel(e.target.value)}
                  placeholder="Or type a custom model/combo name..."
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={!customModel.trim()}
                  onClick={() => {
                    setSettings((s) => ({ ...s, model: customModel.trim() }));
                    setCustomModel('');
                    toast.success(`Model set to: ${customModel.trim()}`);
                  }}
                >
                  Use
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current: <code className="bg-muted px-1.5 py-0.5 rounded">{settings.model}</code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Direct Provider Config */}
      {settings.providerType === 'direct' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent" />
              Direct Provider
            </CardTitle>
            <CardDescription>Connect directly to an AI provider</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm">Provider</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DIRECT_PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleDirectProviderChange(p.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      settings.directProvider === p.id
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <p className="font-semibold text-sm">{p.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">API Endpoint</Label>
              <Input
                value={settings.directEndpoint}
                onChange={(e) => setSettings((s) => ({ ...s, directEndpoint: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">API Key</Label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  value={settings.directApiKey}
                  onChange={(e) => setSettings((s) => ({ ...s, directApiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="pr-10"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Model</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs"
                  onClick={fetchModels}
                  disabled={loadingModels}
                >
                  {loadingModels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Load Models
                </Button>
              </div>
              <Input
                value={settings.directModel}
                onChange={(e) => setSettings((s) => ({ ...s, directModel: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lovable AI Info */}
      {settings.providerType === 'lovable' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Built-in AI
            </CardTitle>
            <CardDescription>No configuration needed — AI is ready to use</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <AlertDescription className="text-sm">
                Using <strong>Gemini Flash</strong> via the built-in AI gateway. No API key required.
                For more model options, switch to 9Router or a direct provider.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Model Browser */}
      {showModelBrowser && loadedModels.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              Available Models ({loadedModels.length})
            </CardTitle>
            <CardDescription>
              Loaded from your {settings.providerType === '9router' ? '9Router' : 'provider'} endpoint. Click to select.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Search models..."
                  className="pl-10 text-sm"
                />
              </div>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {modelProviders.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant={providerFilter === 'all' ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => setProviderFilter('all')}
              >
                All ({loadedModels.length})
              </Badge>
              {modelProviders.map((p) => {
                const count = loadedModels.filter((m) => m.provider === p).length;
                return (
                  <Badge
                    key={p}
                    variant={providerFilter === p ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => setProviderFilter(p)}
                  >
                    {p} ({count})
                  </Badge>
                );
              })}
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectModel(m.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                    currentModel === m.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="truncate">{m.id}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.provider && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{m.provider}</Badge>
                    )}
                    {currentModel === m.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
              {filteredModels.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No models match your filter</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button onClick={save} className="gap-2">
          <Settings2 className="w-4 h-4" />
          Save Settings
        </Button>
        {settings.providerType !== 'lovable' && (
          <Button variant="outline" onClick={testConnection} disabled={testing} className="gap-2">
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : testResult === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-accent" />
            ) : testResult === 'error' ? (
              <XCircle className="w-4 h-4 text-destructive" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            Test Connection
          </Button>
        )}
      </div>
    </div>
  );
}
