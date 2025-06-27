import type { Database } from '@kit/supabase/database';
import type { Service, CreateService, UpdateService } from '../schema/service.schema';

// Database row type
export type ServiceRow = Database['public']['Tables']['services']['Row'];
export type ServiceInsert = Database['public']['Tables']['services']['Insert'];
export type ServiceUpdate = Database['public']['Tables']['services']['Update'];

/**
 * Convert a database service row to the application Service type
 */
export function mapServiceRowToService(row: ServiceRow): Service {
  return {
    id: row.service_key,
    name: row.name,
    description: row.description || '',
    url: row.url,
    apiKey: row.api_key || undefined,
    enabled: row.enabled,
    autoProvision: row.auto_provision,
    status: row.status as Service['status'],
    lastHealthCheck: row.last_health_check ? new Date(row.last_health_check) : undefined,
    healthCheckInterval: row.health_check_interval,
    category: row.category as Service['category'],
    serviceType: row.service_type as Service['serviceType'],
    authType: row.auth_type as Service['authType'],
    requiresAuth: row.requires_auth,
    sslEnabled: row.ssl_enabled,
    supportsUserProvisioning: row.supports_user_provisioning,
    userProvisioningConfig: row.user_provisioning_config ? 
      JSON.parse(JSON.stringify(row.user_provisioning_config)) : undefined,
    defaultUserRole: row.default_user_role || undefined,
    version: row.version || undefined,
    icon: row.icon || undefined,
    documentation: row.documentation || undefined,
    tags: row.tags || [],
    accountId: row.account_id,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

/**
 * Convert a CreateService type to database insert format
 */
export function mapCreateServiceToInsert(service: CreateService): ServiceInsert {
  return {
    service_key: service.id,
    name: service.name,
    description: service.description,
    url: service.url,
    api_key: service.apiKey,
    enabled: service.enabled,
    auto_provision: service.autoProvision,
    status: service.status,
    last_health_check: service.lastHealthCheck?.toISOString(),
    health_check_interval: service.healthCheckInterval,
    category: service.category,
    service_type: service.serviceType,
    auth_type: service.authType,
    requires_auth: service.requiresAuth,
    ssl_enabled: service.sslEnabled,
    supports_user_provisioning: service.supportsUserProvisioning,
    user_provisioning_config: service.userProvisioningConfig ? 
      JSON.parse(JSON.stringify(service.userProvisioningConfig)) : null,
    default_user_role: service.defaultUserRole,
    version: service.version,
    icon: service.icon,
    documentation: service.documentation,
    tags: service.tags,
    account_id: service.accountId,
    created_by: service.createdBy,
    updated_by: service.updatedBy,
  };
}

/**
 * Convert an UpdateService type to database update format
 */
export function mapUpdateServiceToUpdate(service: UpdateService): ServiceUpdate {
  const update: ServiceUpdate = {
    updated_by: service.updatedBy,
    updated_at: service.updatedAt?.toISOString(),
  };

  // Only include fields that are defined in the update
  if (service.name !== undefined) update.name = service.name;
  if (service.description !== undefined) update.description = service.description;
  if (service.url !== undefined) update.url = service.url;
  if (service.apiKey !== undefined) update.api_key = service.apiKey;
  if (service.enabled !== undefined) update.enabled = service.enabled;
  if (service.autoProvision !== undefined) update.auto_provision = service.autoProvision;
  if (service.status !== undefined) update.status = service.status;
  if (service.lastHealthCheck !== undefined) {
    update.last_health_check = service.lastHealthCheck?.toISOString();
  }
  if (service.healthCheckInterval !== undefined) {
    update.health_check_interval = service.healthCheckInterval;
  }
  if (service.category !== undefined) update.category = service.category;
  if (service.serviceType !== undefined) update.service_type = service.serviceType;
  if (service.authType !== undefined) update.auth_type = service.authType;
  if (service.requiresAuth !== undefined) update.requires_auth = service.requiresAuth;
  if (service.sslEnabled !== undefined) update.ssl_enabled = service.sslEnabled;
  if (service.supportsUserProvisioning !== undefined) {
    update.supports_user_provisioning = service.supportsUserProvisioning;
  }
  if (service.userProvisioningConfig !== undefined) {
    update.user_provisioning_config = service.userProvisioningConfig ? 
      JSON.parse(JSON.stringify(service.userProvisioningConfig)) : null;
  }
  if (service.defaultUserRole !== undefined) {
    update.default_user_role = service.defaultUserRole;
  }
  if (service.version !== undefined) update.version = service.version;
  if (service.icon !== undefined) update.icon = service.icon;
  if (service.documentation !== undefined) update.documentation = service.documentation;
  if (service.tags !== undefined) update.tags = service.tags;

  return update;
}
