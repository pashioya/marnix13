'use client';

import { ExternalLink, Film, Book, Download, Cloud, Settings, Clapperboard } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';

import { OnboardingGuide } from './onboarding-guide';

interface Service {
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  category: 'media' | 'productivity' | 'management';
  featured?: boolean;
}

const services: Service[] = [
  {
    name: 'Jellyfin',
    description: 'Stream your personal media library',
    url: process.env.NEXT_PUBLIC_JELLYFIN_URL || '#',
    icon: <Film className="h-6 w-6" />,
    category: 'media',
    featured: true,
  },
  {
    name: 'Manga Reader',
    description: 'Read your manga collection',
    url: process.env.NEXT_PUBLIC_MANGA_READER_URL || '#',
    icon: <Book className="h-6 w-6" />,
    category: 'media',
  },
  {
    name: 'Radarr',
    description: 'Movie collection manager',
    url: process.env.NEXT_PUBLIC_RADARR_URL || '#',
    icon: <Clapperboard className="h-6 w-6" />,
    category: 'management',
  },
  {
    name: 'Sonarr',
    description: 'TV series collection manager',
    url: process.env.NEXT_PUBLIC_SONARR_URL || '#',
    icon: <Settings className="h-6 w-6" />,
    category: 'management',
  },
  {
    name: 'Nextcloud',
    description: 'Your personal cloud storage',
    url: process.env.NEXT_PUBLIC_NEXTCLOUD_URL || '#',
    icon: <Cloud className="h-6 w-6" />,
    category: 'productivity',
    featured: true,
  },
];

export function ServicesPortal() {
  const featuredServices = services.filter(service => service.featured);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">Welcome to Your Home Server Portal</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Access all your self-hosted services from one unified dashboard. Your personal 
              cloud is ready - stream media, manage files, and control your digital life.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Guide */}
      <OnboardingGuide />
      {/* Quick Setup Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Quick Setup
          </CardTitle>
          <CardDescription>
            Get started with your mobile apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Infuse App Setup</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Stream your Jellyfin library on iOS and Apple TV with one-click setup
              </p>
              <Button size="sm" className="w-full sm:w-auto">
                Configure Infuse
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              <p>More mobile client integrations coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Featured Services */}
      {featuredServices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Featured Services</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredServices.map((service) => (
              <ServiceCard key={service.name} service={service} featured />
            ))}
          </div>
        </div>
      )}

      {/* All Services */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Services</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </div>
      </div>

      {/* Mobile Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Mobile Client Recommendations</CardTitle>
          <CardDescription>
            Recommended mobile apps for managing your services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <h4 className="font-medium">Radarr Companion</h4>
                <p className="text-sm text-muted-foreground">Manage your movie collection on the go</p>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <h4 className="font-medium">Sonarr Companion</h4>
                <p className="text-sm text-muted-foreground">Manage your TV series collection</p>
              </div>
              <Badge variant="secondary">Recommended</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceCard({ service, featured = false }: { service: Service; featured?: boolean }) {
  const handleServiceClick = () => {
    if (service.url === '#') {
      alert('Service URL not configured. Please set the appropriate environment variable.');
      return;
    }
    window.open(service.url, '_blank');
  };

  return (
    <Card className={`transition-all hover:shadow-md ${featured ? 'ring-2 ring-primary/20' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {service.icon}
            </div>
            <div>
              <CardTitle className="text-base">{service.name}</CardTitle>
              {featured && <Badge variant="outline" className="text-xs">Featured</Badge>}
            </div>
          </div>
        </div>
        <CardDescription className="text-sm">
          {service.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button 
          onClick={handleServiceClick}
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open {service.name}
        </Button>
      </CardContent>
    </Card>
  );
}
