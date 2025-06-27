# @kit/services

A comprehensive service configuration and management package for the MakerKit project.

## Overview

This package provides TypeScript schemas, types, and utilities for managing external services in your application. It supports various service types like media servers (Jellyfin, Plex), cloud storage (Nextcloud), monitoring tools (Grafana, Prometheus), and more.

## Features

- **Type-safe service schemas** with Zod validation
- **Database integration** with Supabase
- **Service health monitoring** and status tracking
- **User provisioning** support for compatible services
- **Flexible authentication** support (API keys, OAuth, Basic Auth)
- **Service categorization** and metadata management

## Service Model Fields

### Core Fields
- `id` - Unique service identifier
- `name` - Display name
- `description` - Service description
- `url` - Service endpoint URL
- `enabled` - Whether service is active

### Authentication & Security
- `authType` - Authentication method (`api_key`, `basic_auth`, `oauth`, `none`)
- `apiKey` - API key for authentication (optional)
- `requiresAuth` - Whether authentication is required
- `sslEnabled` - SSL/TLS status

### Health & Monitoring
- `status` - Current status (`online`, `offline`, `error`, `unknown`)
- `lastHealthCheck` - Last health check timestamp
- `healthCheckInterval` - Check frequency in minutes

### User Management
- `autoProvision` - Auto-create user accounts
- `supportsUserProvisioning` - Service supports user provisioning
- `userProvisioningConfig` - Provisioning configuration
- `defaultUserRole` - Default role for new users

### Categorization
- `category` - Service category (`media`, `storage`, `management`, etc.)
- `serviceType` - Specific service type (`jellyfin`, `nextcloud`, etc.)

### Metadata
- `version` - Service version
- `icon` - Icon identifier
- `documentation` - Documentation URL
- `tags` - Custom tags

## Usage

### Basic Schema Usage

```typescript
import { ServiceSchema, CreateServiceSchema } from '@kit/services';

// Validate service data
const service = ServiceSchema.parse(serviceData);

// Create new service
const newService = CreateServiceSchema.parse({
  id: 'jellyfin',
  name: 'Jellyfin Media Server',
  url: 'http://localhost:8096',
  category: 'media',
  serviceType: 'jellyfin',
  accountId: 'account-uuid',
  createdBy: 'user-uuid',
  updatedBy: 'user-uuid',
});
```

### Service Configuration

```typescript
import { getDefaultServiceConfig, generateServiceKey } from '@kit/services';

// Get default config for a service type
const defaultConfig = getDefaultServiceConfig('jellyfin');

// Generate service key
const serviceKey = generateServiceKey('jellyfin', 'My Jellyfin Server');
```

### Constants and Defaults

```typescript
import { 
  DEFAULT_SERVICE_PORTS, 
  HEALTH_CHECK_ENDPOINTS,
  SERVICE_CATEGORIES 
} from '@kit/services';

// Get default port for service
const jellyfinPort = DEFAULT_SERVICE_PORTS.jellyfin; // 8096

// Get health check endpoint
const healthEndpoint = HEALTH_CHECK_ENDPOINTS.jellyfin; // '/health'
```

## Database Schema

The package includes a database migration that creates a `services` table with:

- Full type safety with TypeScript
- Row Level Security (RLS) policies
- Proper indexing for performance
- Foreign key relationships to accounts
- Automatic timestamp updates

## Supported Services

The package includes built-in configurations for:

- **Media**: Jellyfin, Plex
- **Storage**: Nextcloud
- **Management**: Radarr, Sonarr, Overseerr, Portainer, Home Assistant
- **Monitoring**: Tautulli, Grafana, Prometheus
- **Custom**: User-defined services

## Service Categories

- `media` - Video, audio, and media streaming
- `storage` - File storage and synchronization
- `management` - Infrastructure and service management
- `productivity` - Productivity and collaboration
- `security` - Security and authentication
- `monitoring` - System monitoring and analytics
- `development` - Development and CI/CD tools
- `communication` - Communication and messaging

## Installation

This package is part of the MakerKit monorepo and should be installed via the workspace configuration.

```json
{
  "dependencies": {
    "@kit/services": "workspace:*"
  }
}
```
