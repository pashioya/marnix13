'use client';

import { useState } from 'react';

import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Settings,
  XCircle,
} from 'lucide-react';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Switch } from '@kit/ui/switch';

interface ServiceConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  enabled: boolean;
  status: 'online' | 'offline' | 'error';
  description: string;
  autoProvision: boolean;
}

const mockServices: ServiceConfig[] = [
  {
    id: 'jellyfin',
    name: 'Jellyfin',
    url: process.env.NEXT_PUBLIC_JELLYFIN_URL || 'http://localhost:8096',
    apiKey: '••••••••••••••••',
    enabled: true,
    status: 'online',
    description: 'Media server for streaming movies, TV shows, and music',
    autoProvision: true,
  },
  {
    id: 'nextcloud',
    name: 'Nextcloud',
    url: process.env.NEXT_PUBLIC_NEXTCLOUD_URL || 'http://localhost:8080',
    apiKey: '••••••••••••••••',
    enabled: true,
    status: 'online',
    description: 'Personal cloud storage and collaboration platform',
    autoProvision: true,
  },
  {
    id: 'radarr',
    name: 'Radarr',
    url: process.env.NEXT_PUBLIC_RADARR_URL || 'http://localhost:7878',
    apiKey: '••••••••••••••••',
    enabled: true,
    status: 'online',
    description: 'Movie collection manager',
    autoProvision: false,
  },
  {
    id: 'sonarr',
    name: 'Sonarr',
    url: process.env.NEXT_PUBLIC_SONARR_URL || 'http://localhost:8989',
    apiKey: '••••••••••••••••',
    enabled: true,
    status: 'offline',
    description: 'TV series collection manager',
    autoProvision: false,
  },
  {
    id: 'manga-reader',
    name: 'Manga Reader',
    url: process.env.NEXT_PUBLIC_MANGA_READER_URL || 'http://localhost:9000',
    enabled: true,
    status: 'error',
    description: 'Manga reading application',
    autoProvision: false,
  },
];

export function ServiceSettings() {
  const [services, setServices] = useState<ServiceConfig[]>(mockServices);

  const handleToggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, enabled: !service.enabled }
          : service,
      ),
    );
  };

  const handleToggleAutoProvision = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, autoProvision: !service.autoProvision }
          : service,
      ),
    );
  };

  const handleTestConnection = async (serviceId: string) => {
    // TODO: Implement actual service connectivity test
    console.log(`Testing connection to ${serviceId}`);

    // Mock the test
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, status: 'online' as const }
          : service,
      ),
    );
  };

  const getStatusIcon = (status: ServiceConfig['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: ServiceConfig['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-100 text-green-800">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'error':
        return <Badge className="bg-yellow-100 text-yellow-800">Error</Badge>;
    }
  };

  const onlineServices = services.filter((s) => s.status === 'online').length;
  const totalServices = services.length;

  return (
    <div className="space-y-6">
      {/* Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Services Status
            </CardTitle>
            <Settings className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineServices}/{totalServices}
            </div>
            <p className="text-muted-foreground text-xs">Services online</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Auto Provisioning
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter((s) => s.autoProvision).length}
            </div>
            <p className="text-muted-foreground text-xs">
              Services with auto user creation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Integration Health
            </CardTitle>
            {onlineServices === totalServices ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {onlineServices === totalServices ? 'Healthy' : 'Issues'}
            </div>
            <p className="text-muted-foreground text-xs">
              Overall system status
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Service Configuration */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Service Configuration</h2>

        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(service.status)}
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(service.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(service.url, '_blank')}
                  >
                    <ExternalLink className="mr-1 h-4 w-4" />
                    Open
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`${service.id}-url`}>Service URL</Label>
                  <Input
                    id={`${service.id}-url`}
                    value={service.url}
                    placeholder="http://localhost:8096"
                    readOnly
                  />
                </div>

                {service.apiKey && (
                  <div className="space-y-2">
                    <Label htmlFor={`${service.id}-api-key`}>API Key</Label>
                    <Input
                      id={`${service.id}-api-key`}
                      type="password"
                      value={service.apiKey}
                      readOnly
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id={`${service.id}-enabled`}
                      checked={service.enabled}
                      onCheckedChange={() => handleToggleService(service.id)}
                    />
                    <Label htmlFor={`${service.id}-enabled`}>
                      Enable Service
                    </Label>
                  </div>

                  {['jellyfin', 'nextcloud'].includes(service.id) && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`${service.id}-auto-provision`}
                        checked={service.autoProvision}
                        onCheckedChange={() =>
                          handleToggleAutoProvision(service.id)
                        }
                      />
                      <Label htmlFor={`${service.id}-auto-provision`}>
                        Auto-provision user accounts
                      </Label>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => handleTestConnection(service.id)}
                >
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Environment Variables Help */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Configure these environment variables to set up your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>NEXT_PUBLIC_JELLYFIN_URL=http://your-jellyfin-server:8096</p>
            <p>NEXT_PUBLIC_NEXTCLOUD_URL=http://your-nextcloud-server:8080</p>
            <p>NEXT_PUBLIC_RADARR_URL=http://your-radarr-server:7878</p>
            <p>NEXT_PUBLIC_SONARR_URL=http://your-sonarr-server:8989</p>
            <p>NEXT_PUBLIC_MANGA_READER_URL=http://your-manga-reader:9000</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
