/**
 * Service-related constants
 */

// Health check intervals (in minutes)
export const HEALTH_CHECK_INTERVALS = {
  MIN: 1,
  MAX: 1440, // 24 hours
  DEFAULT: 30,
} as const;

// Connection test timeout (in milliseconds)
export const CONNECTION_TEST_TIMEOUT = {
  MIN: 1000, // 1 second
  MAX: 30000, // 30 seconds
  DEFAULT: 5000, // 5 seconds
} as const;

// API key display
export const API_KEY_DISPLAY_MASK = '••••••••••••••••';

// Service validation
export const SERVICE_VALIDATION = {
  ID_MIN_LENGTH: 1,
  ID_MAX_LENGTH: 50,
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  USER_ROLE_MAX_LENGTH: 100,
  VERSION_MAX_LENGTH: 50,
} as const;

// Default ports for common services
export const DEFAULT_SERVICE_PORTS: Record<string, number> = {
  jellyfin: 8096,
  nextcloud: 8080,
  radarr: 7878,
  sonarr: 8989,
  plex: 32400,
  overseerr: 5055,
  tautulli: 8181,
  portainer: 9000,
  homeassistant: 8123,
  grafana: 3000,
  prometheus: 9090,
} as const;

// Health check endpoints for common services
export const HEALTH_CHECK_ENDPOINTS: Record<string, string> = {
  jellyfin: '/health',
  nextcloud: '/status.php',
  radarr: '/api/v3/system/status',
  sonarr: '/api/v3/system/status',
  plex: '/identity',
  overseerr: '/api/v1/status',
  tautulli: '/api/v2?cmd=arnold',
  portainer: '/api/status',
  homeassistant: '/api/',
  grafana: '/api/health',
  prometheus: '/-/healthy',
} as const;

// Service documentation URLs
export const SERVICE_DOCUMENTATION: Record<string, string> = {
  jellyfin: 'https://jellyfin.org/docs/',
  nextcloud: 'https://docs.nextcloud.com/',
  radarr: 'https://wiki.servarr.com/radarr',
  sonarr: 'https://wiki.servarr.com/sonarr',
  plex: 'https://support.plex.tv/',
  overseerr: 'https://docs.overseerr.dev/',
  tautulli: 'https://github.com/Tautulli/Tautulli-Wiki',
  portainer: 'https://docs.portainer.io/',
  homeassistant: 'https://www.home-assistant.io/docs/',
  grafana: 'https://grafana.com/docs/',
  prometheus: 'https://prometheus.io/docs/',
} as const;
