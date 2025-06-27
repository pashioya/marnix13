import type { CreateService, ServiceCategoryType, ServiceTypeType } from '../schema/service.schema';

/**
 * Default service configurations for common services
 */
export const DEFAULT_SERVICE_CONFIGS: Record<ServiceTypeType, Partial<CreateService>> = {
  jellyfin: {
    category: 'media',
    serviceType: 'jellyfin',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'User',
    healthCheckInterval: 30,
    icon: 'jellyfin',
    description: 'Media server for streaming movies, TV shows, and music',
  },
  nextcloud: {
    category: 'storage',
    serviceType: 'nextcloud',
    authType: 'basic_auth',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'users',
    healthCheckInterval: 30,
    icon: 'nextcloud',
    description: 'Personal cloud storage and collaboration platform',
  },
  radarr: {
    category: 'management',
    serviceType: 'radarr',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: false,
    healthCheckInterval: 60,
    icon: 'radarr',
    description: 'Movie collection manager',
  },
  sonarr: {
    category: 'management',
    serviceType: 'sonarr',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: false,
    healthCheckInterval: 60,
    icon: 'sonarr',
    description: 'TV series collection manager',
  },
  plex: {
    category: 'media',
    serviceType: 'plex',
    authType: 'oauth',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'User',
    healthCheckInterval: 30,
    icon: 'plex',
    description: 'Media server and streaming platform',
  },
  overseerr: {
    category: 'management',
    serviceType: 'overseerr',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'user',
    healthCheckInterval: 60,
    icon: 'overseerr',
    description: 'Request management for media servers',
  },
  tautulli: {
    category: 'monitoring',
    serviceType: 'tautulli',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: false,
    healthCheckInterval: 60,
    icon: 'tautulli',
    description: 'Monitoring and analytics for Plex',
  },
  portainer: {
    category: 'management',
    serviceType: 'portainer',
    authType: 'basic_auth',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'standard',
    healthCheckInterval: 30,
    icon: 'portainer',
    description: 'Container management interface',
  },
  homeassistant: {
    category: 'management',
    serviceType: 'homeassistant',
    authType: 'api_key',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'user',
    healthCheckInterval: 30,
    icon: 'homeassistant',
    description: 'Home automation platform',
  },
  grafana: {
    category: 'monitoring',
    serviceType: 'grafana',
    authType: 'basic_auth',
    requiresAuth: true,
    supportsUserProvisioning: true,
    defaultUserRole: 'Viewer',
    healthCheckInterval: 60,
    icon: 'grafana',
    description: 'Monitoring and observability platform',
  },
  prometheus: {
    category: 'monitoring',
    serviceType: 'prometheus',
    authType: 'basic_auth',
    requiresAuth: false,
    supportsUserProvisioning: false,
    healthCheckInterval: 60,
    icon: 'prometheus',
    description: 'Monitoring and alerting toolkit',
  },
  custom: {
    category: 'productivity',
    serviceType: 'custom',
    authType: 'none',
    requiresAuth: false,
    supportsUserProvisioning: false,
    healthCheckInterval: 60,
    icon: 'gear',
    description: 'Custom service configuration',
  },
};

/**
 * Service categories with their descriptions
 */
export const SERVICE_CATEGORIES: Record<ServiceCategoryType, { label: string; description: string }> = {
  media: {
    label: 'Media',
    description: 'Video, audio, and media streaming services',
  },
  storage: {
    label: 'Storage',
    description: 'File storage and synchronization services',
  },
  management: {
    label: 'Management',
    description: 'Service and infrastructure management tools',
  },
  productivity: {
    label: 'Productivity',
    description: 'Productivity and collaboration tools',
  },
  security: {
    label: 'Security',
    description: 'Security and authentication services',
  },
  monitoring: {
    label: 'Monitoring',
    description: 'System monitoring and analytics tools',
  },
  development: {
    label: 'Development',
    description: 'Development and CI/CD tools',
  },
  communication: {
    label: 'Communication',
    description: 'Communication and messaging platforms',
  },
};

/**
 * Get default configuration for a service type
 */
export function getDefaultServiceConfig(serviceType: ServiceTypeType): Partial<CreateService> {
  return { ...DEFAULT_SERVICE_CONFIGS[serviceType] };
}

/**
 * Generate a unique service key based on service type and name
 */
export function generateServiceKey(serviceType: ServiceTypeType, name: string): string {
  if (serviceType === 'custom') {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  }
  return serviceType;
}

/**
 * Validate if a URL is reachable (basic validation)
 */
export function isValidServiceUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Get service icon name based on service type
 */
export function getServiceIcon(serviceType: ServiceTypeType): string {
  const config = DEFAULT_SERVICE_CONFIGS[serviceType];
  return config.icon || 'gear';
}
