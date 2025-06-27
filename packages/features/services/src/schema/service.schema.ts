import { z } from 'zod';

// Enums for service fields
export const ServiceStatus = z.enum(['online', 'offline', 'error', 'unknown']);
export const ServiceCategory = z.enum([
  'media',
  'storage',
  'management',
  'productivity',
  'security',
  'monitoring',
  'development',
  'communication',
]);

export const ServiceType = z.enum([
  'jellyfin',
  'nextcloud',
  'radarr',
  'sonarr',
  'plex',
  'overseerr',
  'tautulli',
  'portainer',
  'homeassistant',
  'grafana',
  'prometheus',
  'custom',
]);

export const AuthType = z.enum(['api_key', 'basic_auth', 'oauth', 'none']);

// User provisioning configuration schema
export const UserProvisioningConfigSchema = z.object({
  endpoint: z.string().url().optional(),
  defaultRole: z.string().optional(),
  createGroups: z.boolean().default(false),
  syncUserData: z.boolean().default(true),
  customFields: z.record(z.string(), z.any()).optional(),
});

// Main service schema
export const ServiceSchema = z.object({
  // Core identification
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().max(500),

  // Configuration
  url: z.string().url(),
  apiKey: z.string().optional(),
  enabled: z.boolean().default(true),
  autoProvision: z.boolean().default(false),

  // Status & Health
  status: ServiceStatus.default('unknown'),
  lastHealthCheck: z.date().optional(),
  healthCheckInterval: z.number().int().min(1).max(1440).default(30), // 1 minute to 24 hours

  // Service categorization
  category: ServiceCategory,
  serviceType: ServiceType,

  // Authentication & Security
  authType: AuthType.default('none'),
  requiresAuth: z.boolean().default(false),
  sslEnabled: z.boolean().default(false),

  // User management
  supportsUserProvisioning: z.boolean().default(false),
  userProvisioningConfig: UserProvisioningConfigSchema.optional(),
  defaultUserRole: z.string().optional(),

  // Metadata
  version: z.string().optional(),
  icon: z.string().optional(),
  documentation: z.string().url().optional(),
  tags: z.array(z.string()).default([]),

  // Timestamps & ownership
  accountId: z.string().uuid(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

// Schema for creating a new service (excludes auto-generated fields)
export const CreateServiceSchema = ServiceSchema.omit({
  createdAt: true,
  updatedAt: true,
});

// Schema for updating a service (all fields optional except id)
export const UpdateServiceSchema = ServiceSchema.partial()
  .required({
    id: true,
    updatedBy: true,
  })
  .extend({
    updatedAt: z.date().default(() => new Date()),
  });

// Schema for service health check
export const ServiceHealthCheckSchema = z.object({
  id: z.string(),
  status: ServiceStatus,
  responseTime: z.number().optional(),
  lastChecked: z.date().default(() => new Date()),
  errorMessage: z.string().optional(),
});

// Schema for service connection test
export const ServiceConnectionTestSchema = z.object({
  url: z.string().url(),
  authType: AuthType,
  apiKey: z.string().optional(),
  timeout: z.number().int().min(1000).max(30000).default(5000), // 1-30 seconds
});

// Type exports
export type Service = z.infer<typeof ServiceSchema>;
export type CreateService = z.infer<typeof CreateServiceSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;
export type ServiceHealthCheck = z.infer<typeof ServiceHealthCheckSchema>;
export type ServiceConnectionTest = z.infer<typeof ServiceConnectionTestSchema>;
export type ServiceStatusType = z.infer<typeof ServiceStatus>;
export type ServiceCategoryType = z.infer<typeof ServiceCategory>;
export type ServiceTypeType = z.infer<typeof ServiceType>;
export type AuthTypeType = z.infer<typeof AuthType>;
export type UserProvisioningConfig = z.infer<
  typeof UserProvisioningConfigSchema
>;
