import { useState, useEffect } from 'react';
import { useGoogleAdsConfig } from '@/hooks/useGoogleAdsConfig';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';

export default function GoogleAdsSettings() {
  const { config, loading, saveConfig } = useGoogleAdsConfig();
  const [developerToken, setDeveloperToken] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setDeveloperToken(config.developerToken);
      setClientId(config.clientId);
      setClientSecret(config.clientSecret);
      setRefreshToken(config.refreshToken);
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    await saveConfig({ developerToken, clientId, clientSecret, refreshToken });
    setSaving(false);
  };

  const isConfigured = config && config.developerToken && config.clientId && config.clientSecret && config.refreshToken;

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-heading flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Google Ads API-inställningar
          </div>
          {isConfigured ? (
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 gap-1">
              <CheckCircle2 className="h-3 w-3" /> Konfigurerad
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-500/10 text-red-500 gap-1">
              <XCircle className="h-3 w-3" /> Ej konfigurerad
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">Så här kopplar du ditt Google Ads-konto:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Skapa ett projekt i <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a></li>
            <li>Aktivera <strong>Google Ads API</strong> i API-biblioteket</li>
            <li>Skapa OAuth 2.0-klientuppgifter (Desktop-app)</li>
            <li>Ansök om en Developer Token i <a href="https://ads.google.com/aw/apicenter" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Ads API Center <ExternalLink className="h-3 w-3" /></a></li>
            <li>Generera en Refresh Token med <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">OAuth Playground <ExternalLink className="h-3 w-3" /></a></li>
          </ol>
        </div>

        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium">Developer Token</label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={developerToken}
              onChange={(e) => setDeveloperToken(e.target.value)}
              placeholder="Från Google Ads API Center"
            />
          </div>
          <div>
            <label className="text-sm font-medium">OAuth Client ID</label>
            <Input
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="xxxx.apps.googleusercontent.com"
            />
          </div>
          <div>
            <label className="text-sm font-medium">OAuth Client Secret</label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Refresh Token</label>
            <Input
              type={showSecrets ? 'text' : 'password'}
              value={refreshToken}
              onChange={(e) => setRefreshToken(e.target.value)}
              placeholder="1//0..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setShowSecrets(!showSecrets)} className="gap-1 text-muted-foreground">
            {showSecrets ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showSecrets ? 'Dölj' : 'Visa'} nycklar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Sparar...' : 'Spara konfiguration'}
          </Button>
        </div>

        {config?.lastSyncedAt && (
          <p className="text-xs text-muted-foreground">
            Senast synkad: {new Date(config.lastSyncedAt).toLocaleString('sv-SE')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
