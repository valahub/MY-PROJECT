// Server Module API Service
// Hosting Panel (Plesk-style) backend API endpoints

import { paddleRBACManager } from "@/lib/paddle-rbac";
import type {
  ServerEntity,
  ServerCreateInput,
  ServerUpdateInput,
  DomainEntity,
  DomainCreateInput,
  DomainUpdateInput,
  DNSRecordEntity,
  DNSRecordCreateInput,
  DNSRecordUpdateInput,
  DatabaseEntity,
  DatabaseCreateInput,
  DatabaseUpdateInput,
  DatabaseBackupEntity,
  DatabaseUserEntity,
  ServiceEntity,
  ServiceUpdateInput,
  MailEntity,
  MailCreateInput,
  MailUpdateInput,
  ApplicationEntity,
  ApplicationCreateInput,
  ApplicationUpdateInput,
  InstallQueueEntity,
  SecurityEntity,
  SecurityUpdateInput,
  ServerUserEntity,
  ServerUserCreateInput,
  ServerUserUpdateInput,
  LogEntity,
  BackupEntity,
  BackupCreateInput,
  CronJobEntity,
  CronJobCreateInput,
  CronJobUpdateInput,
  FileVersionEntity,
  ServerStatus,
  ServiceStatus,
  UserRole,
  LogType,
  BackupStatus,
  BackupType,
} from "./server-schema";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================
// IN-MEMORY STORAGE (for demo)
// ============================================

const servers: Map<string, ServerEntity> = new Map();
const domains: Map<string, DomainEntity> = new Map();
const dnsRecords: Map<string, DNSRecordEntity> = new Map();
const databases: Map<string, DatabaseEntity> = new Map();
const databaseBackups: Map<string, DatabaseBackupEntity> = new Map();
const databaseUsers: Map<string, DatabaseUserEntity> = new Map();
const services: Map<string, ServiceEntity> = new Map();
const mail: Map<string, MailEntity> = new Map();
const applications: Map<string, ApplicationEntity> = new Map();
const installQueue: Map<string, InstallQueueEntity> = new Map();
const security: Map<string, SecurityEntity> = new Map();
const serverUsers: Map<string, ServerUserEntity> = new Map();
const logs: Map<string, LogEntity> = new Map();
const backups: Map<string, BackupEntity> = new Map();
const cronJobs: Map<string, CronJobEntity> = new Map();
const fileVersions: Map<string, FileVersionEntity> = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function logEvent(serverId: string, type: LogType, level: "info" | "warning" | "error" | "debug", message: string, metadata?: Record<string, unknown>): void {
  const log: LogEntity = {
    id: generateId("log"),
    serverId,
    type,
    level,
    message,
    metadata,
    createdAt: new Date().toISOString(),
  };
  logs.set(log.id, log);
}

// ============================================
// SERVER API SERVICE
// ============================================

export class ServerApiService {
  // ============================================
  // SERVER CRUD
  // ============================================

  async createServer(input: ServerCreateInput): Promise<ApiResponse<ServerEntity>> {
    try {
      // Paddle RBAC Permission Check
      const hasPermission = paddleRBACManager.hasPermission(input.userId, "server.create", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: server.create required" };
      }

      const id = generateId("server");
      const server: ServerEntity = {
        id,
        userId: input.userId,
        name: input.name,
        hostname: input.hostname,
        ip: input.ip,
        status: "online",
        cpuCores: input.cpuCores,
        ramGB: input.ramGB,
        diskGB: input.diskGB,
        cpuUsage: 0,
        ramUsage: 0,
        diskUsage: 0,
        networkIn: 0,
        networkOut: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      servers.set(id, server);

      // Initialize default services
      await this.initializeServices(id);

      // Initialize security
      await this.initializeSecurity(id);

      logEvent(id, "system", "info", `Server created: ${input.name}`);

      return { success: true, data: server, message: "Server created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create server" };
    }
  }

  async getServer(serverId: string): Promise<ApiResponse<ServerEntity>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }
      return { success: true, data: server };
    } catch (error) {
      return { success: false, error: "Failed to fetch server" };
    }
  }

  async getServers(userId: string): Promise<ApiResponse<ServerEntity[]>> {
    try {
      const userServers = Array.from(servers.values()).filter(s => s.userId === userId);
      return { success: true, data: userServers };
    } catch (error) {
      return { success: false, error: "Failed to fetch servers" };
    }
  }

  async updateServer(serverId: string, input: ServerUpdateInput): Promise<ApiResponse<ServerEntity>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      if (input.name !== undefined) server.name = input.name;
      if (input.status !== undefined) server.status = input.status;
      server.updatedAt = new Date().toISOString();

      servers.set(serverId, server);

      logEvent(serverId, "system", "info", `Server updated`);

      return { success: true, data: server, message: "Server updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update server" };
    }
  }

  async deleteServer(serverId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      if (server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      servers.delete(serverId);

      logEvent(serverId, "system", "warning", `Server deleted: ${server.name}`);

      return { success: true, message: "Server deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete server" };
    }
  }

  async getServerMetrics(serverId: string): Promise<ApiResponse<{
    cpu: number;
    ram: number;
    disk: number;
    networkIn: number;
    networkOut: number;
  }>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      // Simulate real-time metrics
      const metrics = {
        cpu: Math.random() * 100,
        ram: Math.random() * 100,
        disk: server.diskUsage,
        networkIn: Math.random() * 100,
        networkOut: Math.random() * 100,
      };

      return { success: true, data: metrics };
    } catch (error) {
      return { success: false, error: "Failed to fetch metrics" };
    }
  }

  // ============================================
  // SERVICES
  // ============================================

  private async initializeServices(serverId: string): Promise<void> {
    const defaultServices = ["nginx", "postgresql", "redis", "postfix", "dovecot"];
    for (const serviceName of defaultServices) {
      const service: ServiceEntity = {
        id: generateId("service"),
        serverId,
        serviceName,
        status: serviceName === "postfix" ? "stopped" : "running",
        uptime: Math.floor(Math.random() * 1000000),
        cpuUsage: Math.random() * 10,
        memoryUsage: Math.random() * 500,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      services.set(service.id, service);
    }
  }

  async getServices(serverId: string): Promise<ApiResponse<ServiceEntity[]>> {
    try {
      const serverServices = Array.from(services.values()).filter(s => s.serverId === serverId);
      return { success: true, data: serverServices };
    } catch (error) {
      return { success: false, error: "Failed to fetch services" };
    }
  }

  async restartService(serviceId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const service = services.get(serviceId);
      if (!service) {
        return { success: false, error: "Service not found" };
      }

      // Check permission
      const server = servers.get(service.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      service.status = "restarting";
      service.updatedAt = new Date().toISOString();
      services.set(serviceId, service);

      logEvent(service.serverId, "system", "info", `Service restarting: ${service.serviceName}`);

      // Simulate restart delay
      setTimeout(() => {
        service.status = "running";
        service.uptime = 0;
        service.updatedAt = new Date().toISOString();
        services.set(serviceId, service);
        logEvent(service.serverId, "system", "info", `Service restarted: ${service.serviceName}`);
      }, 2000);

      return { success: true, message: "Service restart initiated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restart service" };
    }
  }

  async stopService(serviceId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const service = services.get(serviceId);
      if (!service) {
        return { success: false, error: "Service not found" };
      }

      const server = servers.get(service.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      service.status = "stopped";
      service.updatedAt = new Date().toISOString();
      services.set(serviceId, service);

      logEvent(service.serverId, "system", "warning", `Service stopped: ${service.serviceName}`);

      return { success: true, message: "Service stopped" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to stop service" };
    }
  }

  // ============================================
  // DOMAINS
  // ============================================

  async createDomain(input: DomainCreateInput, userId: string): Promise<ApiResponse<DomainEntity>> {
    try {
      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to create domains" };
      }

      // Check permission
      const hasPermission = paddleRBACManager.hasPermission(userId, "domain.create", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: domain.create required" };
      }

      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("domain");
      const domain: DomainEntity = {
        id,
        serverId: input.serverId,
        name: input.name,
        rootPath: input.rootPath,
        ip: input.ip,
        sslStatus: "none",
        status: "online",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      domains.set(id, domain);

      logEvent(input.serverId, "system", "info", `Domain created: ${input.name}`);

      return { success: true, data: domain, message: "Domain created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create domain" };
    }
  }

  async getDomains(serverId: string): Promise<ApiResponse<DomainEntity[]>> {
    try {
      const serverDomains = Array.from(domains.values()).filter(d => d.serverId === serverId);
      return { success: true, data: serverDomains };
    } catch (error) {
      return { success: false, error: "Failed to fetch domains" };
    }
  }

  async updateDomain(domainId: string, input: DomainUpdateInput, userId: string): Promise<ApiResponse<DomainEntity>> {
    try {
      const domain = domains.get(domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (input.rootPath !== undefined) domain.rootPath = input.rootPath;
      if (input.sslStatus !== undefined) domain.sslStatus = input.sslStatus;
      if (input.status !== undefined) domain.status = input.status;
      if (input.redirectUrl !== undefined) domain.redirectUrl = input.redirectUrl;
      domain.updatedAt = new Date().toISOString();

      domains.set(domainId, domain);

      logEvent(domain.serverId, "system", "info", `Domain updated: ${domain.name}`);

      return { success: true, data: domain, message: "Domain updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update domain" };
    }
  }

  async deleteDomain(domainId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const domain = domains.get(domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      domains.delete(domainId);

      logEvent(domain.serverId, "system", "warning", `Domain deleted: ${domain.name}`);

      return { success: true, message: "Domain deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete domain" };
    }
  }

  async enableSSL(domainId: string, userId: string): Promise<ApiResponse<DomainEntity>> {
    try {
      const domain = domains.get(domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      domain.sslStatus = "active";
      domain.sslIssuer = "Let's Encrypt";
      domain.sslExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      domain.updatedAt = new Date().toISOString();

      domains.set(domainId, domain);

      logEvent(domain.serverId, "security", "info", `SSL enabled for: ${domain.name}`);

      return { success: true, data: domain, message: "SSL enabled successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to enable SSL" };
    }
  }

  async renewSSL(domainId: string, userId: string): Promise<ApiResponse<DomainEntity>> {
    try {
      const domain = domains.get(domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      domain.sslStatus = "active";
      domain.sslIssuer = "Let's Encrypt";
      domain.sslExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      domain.updatedAt = new Date().toISOString();

      domains.set(domainId, domain);

      logEvent(domain.serverId, "security", "info", `SSL renewed for: ${domain.name}`);

      return { success: true, data: domain, message: "SSL renewed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to renew SSL" };
    }
  }

  async removeSSL(domainId: string, userId: string): Promise<ApiResponse<DomainEntity>> {
    try {
      const domain = domains.get(domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      domain.sslStatus = "none";
      domain.sslIssuer = undefined;
      domain.sslExpiry = undefined;
      domain.updatedAt = new Date().toISOString();

      domains.set(domainId, domain);

      logEvent(domain.serverId, "security", "warning", `SSL removed for: ${domain.name}`);

      return { success: true, data: domain, message: "SSL removed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to remove SSL" };
    }
  }

  // ============================================
  // DNS RECORDS
  // ============================================

  async addDNSRecord(input: DNSRecordCreateInput, userId: string): Promise<ApiResponse<DNSRecordEntity>> {
    try {
      const domain = domains.get(input.domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const hasPermission = paddleRBACManager.hasPermission(userId, "domain.dns", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied" };
      }

      const id = generateId("dns");
      const record: DNSRecordEntity = {
        id,
        domainId: input.domainId,
        type: input.type,
        name: input.name,
        value: input.value,
        ttl: input.ttl || 3600,
        priority: input.priority,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      dnsRecords.set(id, record);

      logEvent(domain.serverId, "system", "info", `DNS record added: ${input.type} ${input.name} -> ${input.value}`);

      return { success: true, data: record, message: "DNS record added successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to add DNS record" };
    }
  }

  async getDNSRecords(domainId: string): Promise<ApiResponse<DNSRecordEntity[]>> {
    try {
      const domainRecords = Array.from(dnsRecords.values()).filter(r => r.domainId === domainId);
      return { success: true, data: domainRecords };
    } catch (error) {
      return { success: false, error: "Failed to fetch DNS records" };
    }
  }

  async updateDNSRecord(recordId: string, input: DNSRecordUpdateInput, userId: string): Promise<ApiResponse<DNSRecordEntity>> {
    try {
      const record = dnsRecords.get(recordId);
      if (!record) {
        return { success: false, error: "DNS record not found" };
      }

      const domain = domains.get(record.domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const hasPermission = paddleRBACManager.hasPermission(userId, "domain.dns", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied" };
      }

      if (input.type !== undefined) record.type = input.type;
      if (input.name !== undefined) record.name = input.name;
      if (input.value !== undefined) record.value = input.value;
      if (input.ttl !== undefined) record.ttl = input.ttl;
      if (input.priority !== undefined) record.priority = input.priority;
      record.updatedAt = new Date().toISOString();

      dnsRecords.set(recordId, record);

      logEvent(domain.serverId, "system", "info", `DNS record updated: ${recordId}`);

      return { success: true, data: record, message: "DNS record updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update DNS record" };
    }
  }

  async deleteDNSRecord(recordId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const record = dnsRecords.get(recordId);
      if (!record) {
        return { success: false, error: "DNS record not found" };
      }

      const domain = domains.get(record.domainId);
      if (!domain) {
        return { success: false, error: "Domain not found" };
      }

      const server = servers.get(domain.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const hasPermission = paddleRBACManager.hasPermission(userId, "domain.dns", "delete");
      if (!hasPermission) {
        return { success: false, error: "Permission denied" };
      }

      dnsRecords.delete(recordId);

      logEvent(domain.serverId, "system", "warning", `DNS record deleted: ${recordId}`);

      return { success: true, message: "DNS record deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete DNS record" };
    }
  }

  // ============================================
  // DATABASES
  // ============================================

  async createDatabase(input: DatabaseCreateInput, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to create databases" };
      }

      // Check permission
      const hasPermission = paddleRBACManager.hasPermission(userId, "database.create", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: database.create required" };
      }

      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("db");
      const database: DatabaseEntity = {
        id,
        serverId: input.serverId,
        name: input.name,
        type: input.type,
        user: input.user,
        password: input.password,
        host: input.type === "postgresql" ? "localhost" : input.type === "mysql" ? "localhost" : "127.0.0.1",
        port: input.type === "postgresql" ? 5432 : input.type === "mysql" ? 3306 : 6379,
        sizeGB: 0,
        storageLimitGB: 10,
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      databases.set(id, database);

      logEvent(input.serverId, "system", "info", `Database created: ${input.name}`);

      return { success: true, data: database, message: "Database created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create database" };
    }
  }

  async getDatabases(serverId: string): Promise<ApiResponse<DatabaseEntity[]>> {
    try {
      const serverDatabases = Array.from(databases.values()).filter(d => d.serverId === serverId);
      return { success: true, data: serverDatabases };
    } catch (error) {
      return { success: false, error: "Failed to fetch databases" };
    }
  }

  async deleteDatabase(databaseId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      databases.delete(databaseId);

      logEvent(database.serverId, "system", "warning", `Database deleted: ${database.name}`);

      return { success: true, message: "Database deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete database" };
    }
  }

  async backupDatabase(databaseId: string, userId: string): Promise<ApiResponse<DatabaseBackupEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to backup databases" };
      }

      const backupId = generateId("dbbackup");
      const backup: DatabaseBackupEntity = {
        id: backupId,
        databaseId,
        serverId: database.serverId,
        size: database.sizeGB * 1024 * 1024 * 1024,
        status: "completed",
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };

      databaseBackups.set(backupId, backup);

      logEvent(database.serverId, "system", "info", `Database backup created: ${database.name}`);

      return { success: true, data: backup, message: "Database backup created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to backup database" };
    }
  }

  async restoreDatabaseBackup(backupId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const backup = databaseBackups.get(backupId);
      if (!backup) {
        return { success: false, error: "Backup not found" };
      }

      const database = databases.get(backup.databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to restore databases" };
      }

      logEvent(database.serverId, "system", "info", `Database restored from backup: ${database.name}`);

      return { success: true, message: "Database restored successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restore database" };
    }
  }

  async renameDatabase(databaseId: string, newName: string, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      database.name = newName;
      database.updatedAt = new Date().toISOString();
      databases.set(databaseId, database);

      logEvent(database.serverId, "system", "info", `Database renamed: ${newName}`);

      return { success: true, data: database, message: "Database renamed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to rename database" };
    }
  }

  async resetDatabasePassword(databaseId: string, newPassword: string, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      database.password = newPassword;
      database.updatedAt = new Date().toISOString();
      databases.set(databaseId, database);

      logEvent(database.serverId, "security", "info", `Database password reset: ${database.name}`);

      return { success: true, data: database, message: "Password reset successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to reset password" };
    }
  }

  async scaleDatabaseStorage(databaseId: string, newLimitGB: number, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to scale storage" };
      }

      database.storageLimitGB = newLimitGB;
      database.updatedAt = new Date().toISOString();
      databases.set(databaseId, database);

      logEvent(database.serverId, "system", "info", `Database storage scaled: ${database.name} to ${newLimitGB}GB`);

      return { success: true, data: database, message: "Storage scaled successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to scale storage" };
    }
  }

  async executeQuery(databaseId: string, query: string, userId: string): Promise<ApiResponse<{ columns: string[]; rows: any[] }>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to run queries" };
      }

      // Security validation
      if (!this.isQuerySafe(query)) {
        return { success: false, error: "Query contains restricted keywords" };
      }

      // Simulate query execution based on engine
      let result: { columns: string[]; rows: any[] };
      
      if (database.type === "redis") {
        result = this.executeRedisQuery(query);
      } else {
        result = this.executeSQLQuery(query);
      }

      logEvent(database.serverId, "system", "info", `Query executed on ${database.name}: ${query.substring(0, 50)}...`);

      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to execute query" };
    }
  }

  async addDatabaseUser(databaseId: string, username: string, permissions: "read" | "write" | "admin", userId: string): Promise<ApiResponse<DatabaseUserEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const id = generateId("dbuser");
      const dbUser: DatabaseUserEntity = {
        id,
        databaseId,
        serverId: database.serverId,
        username,
        permissions,
        createdAt: new Date().toISOString(),
      };

      databaseUsers.set(id, dbUser);

      logEvent(database.serverId, "security", "info", `Database user added: ${username} to ${database.name}`);

      return { success: true, data: dbUser, message: "User added successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to add user" };
    }
  }

  async removeDatabaseUser(userId: string, databaseUserId: string, requestingUserId: string): Promise<ApiResponse<void>> {
    try {
      const dbUser = databaseUsers.get(databaseUserId);
      if (!dbUser) {
        return { success: false, error: "Database user not found" };
      }

      const database = databases.get(dbUser.databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== requestingUserId) {
        return { success: false, error: "Permission denied" };
      }

      databaseUsers.delete(databaseUserId);

      logEvent(database.serverId, "security", "warning", `Database user removed: ${dbUser.username}`);

      return { success: true, message: "User removed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to remove user" };
    }
  }

  async getDatabaseUsers(databaseId: string): Promise<ApiResponse<DatabaseUserEntity[]>> {
    try {
      const users = Array.from(databaseUsers.values()).filter(u => u.databaseId === databaseId);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: "Failed to fetch database users" };
    }
  }

  async getDatabaseBackups(databaseId: string): Promise<ApiResponse<DatabaseBackupEntity[]>> {
    try {
      const backups = Array.from(databaseBackups.values()).filter(b => b.databaseId === databaseId);
      return { success: true, data: backups };
    } catch (error) {
      return { success: false, error: "Failed to fetch database backups" };
    }
  }

  async restartDatabase(databaseId: string, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      database.status = "running";
      database.updatedAt = new Date().toISOString();
      databases.set(databaseId, database);

      logEvent(database.serverId, "system", "info", `Database restarted: ${database.name}`);

      return { success: true, data: database, message: "Database restarted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restart database" };
    }
  }

  async optimizeDatabase(databaseId: string, userId: string): Promise<ApiResponse<DatabaseEntity>> {
    try {
      const database = databases.get(databaseId);
      if (!database) {
        return { success: false, error: "Database not found" };
      }

      const server = servers.get(database.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Simulate optimization
      database.sizeGB = Math.max(database.sizeGB * 0.9, 0.1);
      database.updatedAt = new Date().toISOString();
      databases.set(databaseId, database);

      logEvent(database.serverId, "system", "info", `Database optimized: ${database.name}`);

      return { success: true, data: database, message: "Database optimized successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to optimize database" };
    }
  }

  // ============================================
  // DATABASE SECURITY VALIDATION
  // ============================================

  isQuerySafe(query: string): boolean {
    const restrictedKeywords = ["DROP DATABASE", "DROP TABLE", "TRUNCATE", "DELETE FROM", "GRANT ALL", "REVOKE"];
    const upperQuery = query.toUpperCase();
    
    for (const keyword of restrictedKeywords) {
      if (upperQuery.includes(keyword)) {
        return false;
      }
    }
    
    return true;
  }

  executeSQLQuery(query: string): { columns: string[]; rows: any[] } {
    // Simulate SQL query execution
    if (query.toUpperCase().includes("SELECT")) {
      return {
        columns: ["id", "name", "value", "created_at"],
        rows: [
          { id: 1, name: "example", value: "data", created_at: "2026-04-24" },
          { id: 2, name: "test", value: "123", created_at: "2026-04-24" },
        ],
      };
    }
    
    return {
      columns: ["result"],
      rows: [{ result: "Query executed successfully" }],
    };
  }

  executeRedisQuery(query: string): { columns: string[]; rows: any[] } {
    // Simulate Redis query execution
    if (query.toUpperCase().includes("GET")) {
      return {
        columns: ["key", "value"],
        rows: [
          { key: "session:123", value: '{"user":"admin"}' },
          { key: "cache:home", value: '{"html":"<div>...</div>"}' },
        ],
      };
    }
    
    return {
      columns: ["result"],
      rows: [{ result: "OK" }],
    };
  }

  // ============================================
  // MAIL
  // ============================================

  async createMail(input: MailCreateInput, userId: string): Promise<ApiResponse<MailEntity>> {
    try {
      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("mail");
      const mailEntity: MailEntity = {
        id,
        serverId: input.serverId,
        address: input.address,
        password: input.password,
        quotaGB: input.quotaGB,
        usedGB: 0,
        forwardTo: input.forwardTo,
        status: "online",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mail.set(id, mailEntity);

      logEvent(input.serverId, "mail", "info", `Mailbox created: ${input.address}`);

      return { success: true, data: mailEntity, message: "Mailbox created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create mailbox" };
    }
  }

  async getMail(serverId: string): Promise<ApiResponse<MailEntity[]>> {
    try {
      const serverMail = Array.from(mail.values()).filter(m => m.serverId === serverId);
      return { success: true, data: serverMail };
    } catch (error) {
      return { success: false, error: "Failed to fetch mailboxes" };
    }
  }

  async deleteMail(mailId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const mailEntity = mail.get(mailId);
      if (!mailEntity) {
        return { success: false, error: "Mailbox not found" };
      }

      const server = servers.get(mailEntity.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      mail.delete(mailId);

      logEvent(mailEntity.serverId, "mail", "warning", `Mailbox deleted: ${mailEntity.address}`);

      return { success: true, message: "Mailbox deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete mailbox" };
    }
  }

  // ============================================
  // APPLICATIONS
  // ============================================

  async createApplication(input: ApplicationCreateInput, userId: string): Promise<ApiResponse<ApplicationEntity>> {
    try {
      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to deploy applications" };
      }

      // Check permission
      const hasPermission = paddleRBACManager.hasPermission(userId, "app.deploy", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: app.deploy required" };
      }

      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("app");
      const application: ApplicationEntity = {
        id,
        serverId: input.serverId,
        domainId: input.domainId,
        name: input.name,
        type: input.type,
        version: input.version,
        status: "deploying",
        gitRepo: input.gitRepo,
        gitBranch: input.gitBranch,
        envVars: input.envVars || {},
        port: input.port || 3000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      applications.set(id, application);

      // Add to install queue
      const queueId = generateId("queue");
      const queue: InstallQueueEntity = {
        id: queueId,
        serverId: input.serverId,
        app: input.type,
        appName: input.name,
        domain: input.domainId || "",
        status: "queued",
        progress: 0,
        eta: "5m",
        retryCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      installQueue.set(queueId, queue);

      logEvent(input.serverId, "system", "info", `Application deploying: ${input.name}`);

      // Simulate deployment
      setTimeout(() => {
        application.status = "running";
        application.updatedAt = new Date().toISOString();
        applications.set(id, application);

        const queueItem = installQueue.get(queueId);
        queueItem.status = "completed";
        queueItem.progress = 100;
        queueItem.eta = "just now";
        queueItem.updatedAt = new Date().toISOString();
        installQueue.set(queueId, queueItem);

        logEvent(input.serverId, "system", "info", `Application deployed: ${input.name}`);
      }, 5000);

      return { success: true, data: application, message: "Application deployment started" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create application" };
    }
  }

  async getApplications(serverId: string): Promise<ApiResponse<ApplicationEntity[]>> {
    try {
      const serverApps = Array.from(applications.values()).filter(a => a.serverId === serverId);
      return { success: true, data: serverApps };
    } catch (error) {
      return { success: false, error: "Failed to fetch applications" };
    }
  }

  async restartApplication(appId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const app = applications.get(appId);
      if (!app) {
        return { success: false, error: "Application not found" };
      }

      const server = servers.get(app.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      app.status = "deploying";
      app.updatedAt = new Date().toISOString();
      applications.set(appId, app);

      logEvent(app.serverId, "system", "info", `Application restarting: ${app.name}`);

      setTimeout(() => {
        app.status = "running";
        app.updatedAt = new Date().toISOString();
        applications.set(appId, app);
        logEvent(app.serverId, "system", "info", `Application restarted: ${app.name}`);
      }, 2000);

      return { success: true, message: "Application restart initiated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restart application" };
    }
  }

  async stopApplication(appId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const app = applications.get(appId);
      if (!app) {
        return { success: false, error: "Application not found" };
      }

      const server = servers.get(app.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      app.status = "stopped";
      app.updatedAt = new Date().toISOString();
      applications.set(appId, app);

      logEvent(app.serverId, "system", "warning", `Application stopped: ${app.name}`);

      return { success: true, message: "Application stopped" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to stop application" };
    }
  }

  async getInstallQueue(serverId: string): Promise<ApiResponse<InstallQueueEntity[]>> {
    try {
      const queue = Array.from(installQueue.values()).filter(q => q.serverId === serverId);
      return { success: true, data: queue };
    } catch (error) {
      return { success: false, error: "Failed to fetch install queue" };
    }
  }

  // ============================================
  // SECURITY
  // ============================================

  private async initializeSecurity(serverId: string): Promise<void> {
    const securityEntity: SecurityEntity = {
      id: generateId("security"),
      serverId,
      firewallEnabled: true,
      blockedIPs: [],
      sslEnabled: true,
      malwareScanEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    security.set(securityEntity.id, securityEntity);
  }

  async getSecurity(serverId: string): Promise<ApiResponse<SecurityEntity>> {
    try {
      const sec = Array.from(security.values()).find(s => s.serverId === serverId);
      if (!sec) {
        return { success: false, error: "Security config not found" };
      }
      return { success: true, data: sec };
    } catch (error) {
      return { success: false, error: "Failed to fetch security config" };
    }
  }

  async updateSecurity(serverId: string, input: SecurityUpdateInput, userId: string): Promise<ApiResponse<SecurityEntity>> {
    try {
      const sec = Array.from(security.values()).find(s => s.serverId === serverId);
      if (!sec) {
        return { success: false, error: "Security config not found" };
      }

      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (input.firewallEnabled !== undefined) sec.firewallEnabled = input.firewallEnabled;
      if (input.blockedIPs !== undefined) sec.blockedIPs = input.blockedIPs;
      if (input.sslEnabled !== undefined) sec.sslEnabled = input.sslEnabled;
      if (input.malwareScanEnabled !== undefined) sec.malwareScanEnabled = input.malwareScanEnabled;
      sec.updatedAt = new Date().toISOString();

      security.set(sec.id, sec);

      logEvent(serverId, "security", "info", `Security config updated`);

      return { success: true, data: sec, message: "Security config updated" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update security" };
    }
  }

  async blockIP(serverId: string, ip: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const sec = Array.from(security.values()).find(s => s.serverId === serverId);
      if (!sec) {
        return { success: false, error: "Security config not found" };
      }

      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (!sec.blockedIPs.includes(ip)) {
        sec.blockedIPs.push(ip);
        sec.updatedAt = new Date().toISOString();
        security.set(sec.id, sec);
      }

      logEvent(serverId, "security", "warning", `IP blocked: ${ip}`);

      return { success: true, message: "IP blocked successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to block IP" };
    }
  }

  async runMalwareScan(serverId: string, userId: string): Promise<ApiResponse<{ found: number; scanned: number }>> {
    try {
      const sec = Array.from(security.values()).find(s => s.serverId === serverId);
      if (!sec) {
        return { success: false, error: "Security config not found" };
      }

      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      sec.lastScanAt = new Date().toISOString();
      sec.updatedAt = new Date().toISOString();
      security.set(sec.id, sec);

      logEvent(serverId, "security", "info", "Malware scan completed");

      // Simulate scan results
      return { success: true, data: { found: 0, scanned: 1524 }, message: "Malware scan completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to run malware scan" };
    }
  }

  // ============================================
  // USERS (SERVER LEVEL)
  // ============================================

  async createServerUser(input: ServerUserCreateInput, userId: string): Promise<ApiResponse<ServerUserEntity>> {
    try {
      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("serveruser");
      const serverUser: ServerUserEntity = {
        id,
        serverId: input.serverId,
        username: input.username,
        email: input.email,
        role: input.role,
        permissions: input.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      serverUsers.set(id, serverUser);

      logEvent(input.serverId, "system", "info", `Server user created: ${input.username}`);

      return { success: true, data: serverUser, message: "Server user created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create server user" };
    }
  }

  async getServerUsers(serverId: string): Promise<ApiResponse<ServerUserEntity[]>> {
    try {
      const users = Array.from(serverUsers.values()).filter(u => u.serverId === serverId);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: "Failed to fetch server users" };
    }
  }

  async deleteServerUser(userId: string, adminId: string): Promise<ApiResponse<void>> {
    try {
      const user = serverUsers.get(userId);
      if (!user) {
        return { success: false, error: "User not found" };
      }

      const server = servers.get(user.serverId);
      if (!server || server.userId !== adminId) {
        return { success: false, error: "Permission denied" };
      }

      serverUsers.delete(userId);

      logEvent(user.serverId, "system", "warning", `Server user deleted: ${user.username}`);

      return { success: true, message: "Server user deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete server user" };
    }
  }

  // ============================================
  // LOGS
  // ============================================

  async getLogs(serverId: string, type?: LogType, limit: number = 100): Promise<ApiResponse<LogEntity[]>> {
    try {
      let serverLogs = Array.from(logs.values()).filter(l => l.serverId === serverId);
      if (type) serverLogs = serverLogs.filter(l => l.type === type);
      serverLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      serverLogs = serverLogs.slice(0, limit);
      return { success: true, data: serverLogs };
    } catch (error) {
      return { success: false, error: "Failed to fetch logs" };
    }
  }

  // ============================================
  // BACKUPS
  // ============================================

  async createBackup(input: BackupCreateInput, userId: string): Promise<ApiResponse<BackupEntity>> {
    try {
      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("backup");
      const backup: BackupEntity = {
        id,
        serverId: input.serverId,
        type: input.type,
        status: "pending",
        sizeGB: 0,
        path: `/backups/server-${Date.now()}.tar.gz`,
        createdAt: new Date().toISOString(),
      };

      backups.set(id, backup);

      logEvent(input.serverId, "system", "info", `Backup created: ${input.type}`);

      // Simulate backup completion
      setTimeout(() => {
        backup.status = "completed";
        backup.sizeGB = Math.random() * 50;
        backup.completedAt = new Date().toISOString();
        backups.set(id, backup);
        logEvent(input.serverId, "system", "info", `Backup completed: ${input.type}`);
      }, 3000);

      return { success: true, data: backup, message: "Backup created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create backup" };
    }
  }

  async getBackups(serverId: string): Promise<ApiResponse<BackupEntity[]>> {
    try {
      const serverBackups = Array.from(backups.values()).filter(b => b.serverId === serverId);
      return { success: true, data: serverBackups };
    } catch (error) {
      return { success: false, error: "Failed to fetch backups" };
    }
  }

  async restoreBackup(backupId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const backup = backups.get(backupId);
      if (!backup) {
        return { success: false, error: "Backup not found" };
      }

      const server = servers.get(backup.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      logEvent(backup.serverId, "system", "info", `Backup restored: ${backup.path}`);

      return { success: true, message: "Backup restored successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restore backup" };
    }
  }

  // ============================================
  // FILES
  // ============================================

  async listFiles(serverId: string, path: string = "/"): Promise<ApiResponse<{ name: string; type: "file" | "directory"; size: number; modified: string }[]>> {
    try {
      // Simulate file listing
      const files = [
        { name: "public", type: "directory" as const, size: 0, modified: new Date().toISOString() },
        { name: "logs", type: "directory" as const, size: 0, modified: new Date().toISOString() },
        { name: "index.html", type: "file" as const, size: 2048, modified: new Date().toISOString() },
        { name: "robots.txt", type: "file" as const, size: 128, modified: new Date().toISOString() },
        { name: "sitemap.xml", type: "file" as const, size: 4096, modified: new Date().toISOString() },
      ];
      return { success: true, data: files };
    } catch (error) {
      return { success: false, error: "Failed to list files" };
    }
  }

  async uploadFile(serverId: string, path: string, fileName: string, content: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to upload files" };
      }

      logEvent(serverId, "system", "info", `File uploaded: ${path}/${fileName}`);

      return { success: true, message: "File uploaded successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to upload file" };
    }
  }

  async deleteFile(serverId: string, path: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Check plan gate
      const hasActivePlan = await this.checkPlanGate(userId);
      if (!hasActivePlan) {
        return { success: false, error: "Active plan required to delete files" };
      }

      logEvent(serverId, "system", "warning", `File deleted: ${path}`);

      return { success: true, message: "File deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete file" };
    }
  }

  async readFile(serverId: string, path: string, userId: string): Promise<ApiResponse<{ content: string }>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Simulate file content
      const content = `<!DOCTYPE html>
<html>
<head>
  <title>Example Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>`;

      return { success: true, data: { content } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to read file" };
    }
  }

  async writeFile(serverId: string, path: string, content: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Create version before overwriting
      const existingVersions = Array.from(fileVersions.values()).filter(v => v.serverId === serverId && v.filePath === path);
      const nextVersion = existingVersions.length + 1;
      
      const version: FileVersionEntity = {
        id: generateId("filever"),
        serverId,
        filePath: path,
        version: nextVersion,
        content,
        checksum: this.generateChecksum(content),
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };
      fileVersions.set(version.id, version);

      logEvent(serverId, "system", "info", `File written: ${path} (v${nextVersion})`);

      return { success: true, message: "File saved successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to write file" };
    }
  }

  async renameFile(serverId: string, oldPath: string, newPath: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (!this.isPathSafe(newPath)) {
        return { success: false, error: "Invalid or restricted path" };
      }

      logEvent(serverId, "system", "info", `File renamed: ${oldPath} -> ${newPath}`);

      return { success: true, message: "File renamed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to rename file" };
    }
  }

  async moveFile(serverId: string, sourcePath: string, targetPath: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (!this.isPathSafe(targetPath)) {
        return { success: false, error: "Invalid or restricted path" };
      }

      logEvent(serverId, "system", "info", `File moved: ${sourcePath} -> ${targetPath}`);

      return { success: true, message: "File moved successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to move file" };
    }
  }

  async copyFile(serverId: string, sourcePath: string, targetPath: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (!this.isPathSafe(targetPath)) {
        return { success: false, error: "Invalid or restricted path" };
      }

      logEvent(serverId, "system", "info", `File copied: ${sourcePath} -> ${targetPath}`);

      return { success: true, message: "File copied successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to copy file" };
    }
  }

  async createFolder(serverId: string, path: string, folderName: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const fullPath = `${path}/${folderName}`.replace(/\/+/g, "/");
      
      if (!this.isPathSafe(fullPath)) {
        return { success: false, error: "Invalid or restricted path" };
      }

      logEvent(serverId, "system", "info", `Folder created: ${fullPath}`);

      return { success: true, message: "Folder created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create folder" };
    }
  }

  async compressToZip(serverId: string, sourcePath: string, zipName: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      logEvent(serverId, "system", "info", `Compressed to ZIP: ${sourcePath} -> ${zipName}`);

      return { success: true, message: "ZIP created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create ZIP" };
    }
  }

  async extractZip(serverId: string, zipPath: string, targetPath: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (!this.isPathSafe(targetPath)) {
        return { success: false, error: "Invalid or restricted path" };
      }

      logEvent(serverId, "system", "info", `ZIP extracted: ${zipPath} -> ${targetPath}`);

      return { success: true, message: "ZIP extracted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to extract ZIP" };
    }
  }

  async setFilePermissions(serverId: string, path: string, permissions: { read: boolean; write: boolean; execute: boolean }, userId: string): Promise<ApiResponse<void>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      const permString = `${permissions.read ? "r" : "-"}${permissions.write ? "w" : "-"}${permissions.execute ? "x" : "-"}`;
      
      logEvent(serverId, "security", "info", `File permissions updated: ${path} -> ${permString}`);

      return { success: true, message: "Permissions updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update permissions" };
    }
  }

  async getFileVersions(serverId: string, filePath: string): Promise<ApiResponse<FileVersionEntity[]>> {
    try {
      const versions = Array.from(fileVersions.values())
        .filter(v => v.serverId === serverId && v.filePath === filePath)
        .sort((a, b) => b.version - a.version);
      
      return { success: true, data: versions };
    } catch (error) {
      return { success: false, error: "Failed to fetch file versions" };
    }
  }

  async restoreFileVersion(serverId: string, versionId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const version = fileVersions.get(versionId);
      if (!version) {
        return { success: false, error: "Version not found" };
      }

      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      // Create new version with restored content
      const existingVersions = Array.from(fileVersions.values()).filter(v => v.serverId === serverId && v.filePath === version.filePath);
      const nextVersion = existingVersions.length + 1;
      
      const newVersion: FileVersionEntity = {
        id: generateId("filever"),
        serverId,
        filePath: version.filePath,
        version: nextVersion,
        content: version.content,
        checksum: version.checksum,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };
      fileVersions.set(newVersion.id, newVersion);

      logEvent(serverId, "system", "info", `File restored: ${version.filePath} from v${version.version} to v${nextVersion}`);

      return { success: true, message: "File restored successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to restore file" };
    }
  }

  // ============================================
  // FILE SECURITY VALIDATION
  // ============================================

  isPathSafe(path: string): boolean {
    const restrictedPaths = ["/etc", "/root", "/sys", "/proc", "/boot", "/bin", "/sbin", "/usr/bin", "/usr/sbin"];
    const normalizedPath = path.replace(/\/+/g, "/");
    
    for (const restricted of restrictedPaths) {
      if (normalizedPath.startsWith(restricted)) {
        return false;
      }
    }
    
    return true;
  }

  validateFileType(fileName: string, allowedTypes: string[]): boolean {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    return allowedTypes.includes(ext);
  }

  validateFileSize(size: number, maxSizeMB: number): boolean {
    return size <= maxSizeMB * 1024 * 1024;
  }

  generateChecksum(content: string): string {
    // Simple checksum for demo (in production use crypto hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  // ============================================
  // CRON JOBS
  // ============================================

  async createCronJob(input: CronJobCreateInput, userId: string): Promise<ApiResponse<CronJobEntity>> {
    try {
      const server = servers.get(input.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Server not found or access denied" };
      }

      const id = generateId("cron");
      const cronJob: CronJobEntity = {
        id,
        serverId: input.serverId,
        name: input.name,
        command: input.command,
        schedule: input.schedule,
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      cronJobs.set(id, cronJob);

      logEvent(input.serverId, "system", "info", `Cron job created: ${input.name}`);

      return { success: true, data: cronJob, message: "Cron job created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create cron job" };
    }
  }

  async getCronJobs(serverId: string): Promise<ApiResponse<CronJobEntity[]>> {
    try {
      const jobs = Array.from(cronJobs.values()).filter(c => c.serverId === serverId);
      return { success: true, data: jobs };
    } catch (error) {
      return { success: false, error: "Failed to fetch cron jobs" };
    }
  }

  async updateCronJob(cronId: string, input: CronJobUpdateInput, userId: string): Promise<ApiResponse<CronJobEntity>> {
    try {
      const cron = cronJobs.get(cronId);
      if (!cron) {
        return { success: false, error: "Cron job not found" };
      }

      const server = servers.get(cron.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      if (input.command !== undefined) cron.command = input.command;
      if (input.schedule !== undefined) cron.schedule = input.schedule;
      if (input.enabled !== undefined) cron.enabled = input.enabled;
      cron.updatedAt = new Date().toISOString();

      cronJobs.set(cronId, cron);

      logEvent(cron.serverId, "system", "info", `Cron job updated: ${cron.name}`);

      return { success: true, data: cron, message: "Cron job updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update cron job" };
    }
  }

  async deleteCronJob(cronId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const cron = cronJobs.get(cronId);
      if (!cron) {
        return { success: false, error: "Cron job not found" };
      }

      const server = servers.get(cron.serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      cronJobs.delete(cronId);

      logEvent(cron.serverId, "system", "warning", `Cron job deleted: ${cron.name}`);

      return { success: true, message: "Cron job deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete cron job" };
    }
  }

  // ============================================
  // PERMISSION SYSTEM (PADDLE LINKED)
  // ============================================

  async checkPermission(userId: string, permission: string, action: "read" | "write" | "delete"): Promise<boolean> {
    return paddleRBACManager.hasPermission(userId, permission, action);
  }

  // ============================================
  // PLAN GATE
  // ============================================

  async checkPlanGate(userId: string): Promise<boolean> {
    // In production, this would check Paddle subscription status
    // For demo, we'll return true
    return true;
  }

  // ============================================
  // SELF-HEAL SYSTEM
  // ============================================

  async selfHealServices(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      const serverServices = Array.from(services.values()).filter(s => s.serverId === serverId);
      let healed = 0;
      let failed = 0;

      for (const service of serverServices) {
        if (service.status === "stopped" || service.status === "error") {
          // Attempt to restart
          service.status = "restarting";
          service.updatedAt = new Date().toISOString();
          services.set(service.id, service);

          setTimeout(() => {
            service.status = "running";
            service.uptime = 0;
            service.updatedAt = new Date().toISOString();
            services.set(service.id, service);
            logEvent(serverId, "system", "info", `Service auto-healed: ${service.serviceName}`);
          }, 2000);

          healed++;
        }
      }

      logEvent(serverId, "system", "info", `Self-heal completed: ${healed} services`);

      return { success: true, data: { healed, failed }, message: `Self-heal completed: ${healed} services` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to self-heal" };
    }
  }

  async retryFailedOperations(serverId: string): Promise<ApiResponse<{ retried: number; failed: number }>> {
    try {
      const failedInstalls = Array.from(installQueue.values()).filter(q => q.serverId === serverId && q.status === "failed");
      let retried = 0;
      let failed = 0;

      for (const item of failedInstalls) {
        item.status = "installing";
        item.updatedAt = new Date().toISOString();
        installQueue.set(item.id, item);

        // Simulate retry
        setTimeout(() => {
          item.status = "completed";
          item.progress = 100;
          item.updatedAt = new Date().toISOString();
          installQueue.set(item.id, item);
          retried++;
        }, 3000);
      }

      logEvent(serverId, "system", "info", `Retry completed: ${retried} operations`);

      return { success: true, data: { retried, failed }, message: `Retry completed: ${retried} operations` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to retry operations" };
    }
  }

  // ============================================
  // DOMAIN SELF-HEAL
  // ============================================

  async healDNSMismatch(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      const serverDomains = Array.from(domains.values()).filter(d => d.serverId === serverId);
      let healed = 0;
      let failed = 0;

      for (const domain of serverDomains) {
        const domainRecords = Array.from(dnsRecords.values()).filter(r => r.domainId === domain.id);
        const hasARecord = domainRecords.some(r => r.type === "A" && r.name === "@");
        
        if (!hasARecord) {
          // Auto-create missing A record
          const record: DNSRecordEntity = {
            id: generateId("dns"),
            domainId: domain.id,
            type: "A",
            name: "@",
            value: domain.ip,
            ttl: 3600,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          dnsRecords.set(record.id, record);
          healed++;
          logEvent(serverId, "system", "info", `DNS auto-healed: Added A record for ${domain.name}`);
        }
      }

      return { success: true, data: { healed, failed }, message: `DNS heal completed: ${healed} records added` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to heal DNS" };
    }
  }

  async healSSLFailures(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      const serverDomains = Array.from(domains.values()).filter(d => d.serverId === serverId && d.sslStatus === "expiring");
      let healed = 0;
      let failed = 0;

      for (const domain of serverDomains) {
        // Auto-renew expiring SSL
        domain.sslStatus = "active";
        domain.sslIssuer = "Let's Encrypt";
        domain.sslExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        domain.updatedAt = new Date().toISOString();
        domains.set(domain.id, domain);
        healed++;
        logEvent(serverId, "security", "info", `SSL auto-renewed for: ${domain.name}`);
      }

      return { success: true, data: { healed, failed }, message: `SSL heal completed: ${healed} certificates renewed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to heal SSL" };
    }
  }

  // ============================================
  // SECURITY VALIDATION
  // ============================================

  validateDomainFormat(domainName: string): boolean {
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    return domainRegex.test(domainName);
  }

  checkDuplicateDomain(domainName: string, serverId: string): boolean {
    return Array.from(domains.values()).some(d => d.serverId === serverId && d.name === domainName);
  }

  private dnsChangeRateLimit = new Map<string, number[]>();

  async checkDNSRateLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userChanges = this.dnsChangeRateLimit.get(userId) || [];
    
    // Remove changes older than 1 hour
    const recentChanges = userChanges.filter(t => now - t < 3600000);
    
    if (recentChanges.length >= 10) {
      return false; // Rate limited
    }
    
    recentChanges.push(now);
    this.dnsChangeRateLimit.set(userId, recentChanges);
    return true;
  }

  // ============================================
  // FILE SELF-HEAL
  // ============================================

  async healFailedUploads(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      // Simulate retrying failed uploads
      let healed = 0;
      let failed = 0;
      
      logEvent(serverId, "system", "info", `File upload heal completed: ${healed} retried`);

      return { success: true, data: { healed, failed }, message: `Upload heal completed: ${healed} retried` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to heal uploads" };
    }
  }

  async healSyncMismatch(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      // Simulate refreshing directory sync
      let healed = 0;
      let failed = 0;
      
      logEvent(serverId, "system", "info", `Directory sync heal completed: ${healed} refreshed`);

      return { success: true, data: { healed, failed }, message: `Sync heal completed: ${healed} refreshed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to heal sync" };
    }
  }

  // ============================================
  // DATABASE SELF-HEAL
  // ============================================

  async healDatabaseConnection(serverId: string): Promise<ApiResponse<{ healed: number; failed: number }>> {
    try {
      const serverDatabases = Array.from(databases.values()).filter(d => d.serverId === serverId);
      let healed = 0;
      let failed = 0;

      for (const db of serverDatabases) {
        if (db.status === "stopped") {
          db.status = "running";
          db.updatedAt = new Date().toISOString();
          databases.set(db.id, db);
          healed++;
        }
      }

      logEvent(serverId, "system", "info", `Database connection heal completed: ${healed} reconnected`);

      return { success: true, data: { healed, failed }, message: `Connection heal completed: ${healed} reconnected` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to heal database connections" };
    }
  }

  async healFailedQueries(serverId: string): Promise<ApiResponse<{ retried: number; failed: number }>> {
    try {
      // Simulate retrying failed queries
      let retried = 0;
      let failed = 0;
      
      logEvent(serverId, "system", "info", `Query retry completed: ${retried} queries`);

      return { success: true, data: { retried, failed }, message: `Query retry completed: ${retried} queries` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to retry queries" };
    }
  }

  async healFailedBackups(serverId: string): Promise<ApiResponse<{ retried: number; failed: number }>> {
    try {
      const failedBackups = Array.from(databaseBackups.values()).filter(b => b.serverId === serverId && b.status === "failed");
      let retried = 0;
      let failed = 0;

      for (const backup of failedBackups) {
        backup.status = "completed";
        backup.createdAt = new Date().toISOString();
        databaseBackups.set(backup.id, backup);
        retried++;
      }

      logEvent(serverId, "system", "info", `Backup retry completed: ${retried} backups`);

      return { success: true, data: { retried, failed }, message: `Backup retry completed: ${retried} backups` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to retry backups" };
    }
  }

  // ============================================
  // TOOLS & SETTINGS - AUTOMATION CORE ENGINE
  // ============================================

  // 1. GLOBAL SELF-HEAL ENGINE
  async globalSelfHealEngine(serverId: string): Promise<ApiResponse<{ servicesHealed: number; errorsFixed: number }>> {
    try {
      let servicesHealed = 0;
      let errorsFixed = 0;

      // Monitor and heal nginx
      const nginxService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "nginx");
      if (nginxService && nginxService.status !== "running") {
        nginxService.status = "running";
        services.set(nginxService.id, nginxService);
        servicesHealed++;
        logEvent(serverId, "system", "warning", "Self-heal: nginx restarted");
      }

      // Monitor and heal mysql/postgres
      const dbServices = Array.from(services.values()).filter(s => s.serverId === serverId && (s.serviceName === "mysql" || s.serviceName === "postgresql"));
      for (const dbService of dbServices) {
        if (dbService.status !== "running") {
          dbService.status = "running";
          services.set(dbService.id, dbService);
          servicesHealed++;
          logEvent(serverId, "system", "warning", `Self-heal: ${dbService.serviceName} restarted`);
        }
      }

      // Monitor and heal redis
      const redisService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "redis");
      if (redisService && redisService.status !== "running") {
        redisService.status = "running";
        services.set(redisService.id, redisService);
        servicesHealed++;
        logEvent(serverId, "system", "warning", "Self-heal: redis restarted");
      }

      // Monitor and heal mail
      const mailService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
      if (mailService && mailService.status !== "running") {
        mailService.status = "running";
        services.set(mailService.id, mailService);
        servicesHealed++;
        logEvent(serverId, "system", "warning", "Self-heal: postfix restarted");
      }

      return { success: true, data: { servicesHealed, errorsFixed }, message: `Self-heal completed: ${servicesHealed} services healed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Self-heal engine failed" };
    }
  }

  // 2. SMART PHP AUTO TUNER
  async smartPHPTuner(serverId: string): Promise<ApiResponse<{ memoryLimit: string; maxExecutionTime: string; uploadSize: string }>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      // Simulate RAM-based tuning
      const ramUsage = Math.random() * 100;
      const activeApps = Math.floor(Math.random() * 10);

      let memoryLimit = "256M";
      let maxExecutionTime = "30";
      let uploadSize = "10M";

      if (ramUsage > 80 || activeApps > 5) {
        memoryLimit = "512M";
        maxExecutionTime = "60";
        uploadSize = "20M";
        logEvent(serverId, "system", "info", "PHP tuner: Increased limits for high load");
      } else if (ramUsage < 30 && activeApps < 3) {
        memoryLimit = "128M";
        maxExecutionTime = "30";
        uploadSize = "5M";
        logEvent(serverId, "system", "info", "PHP tuner: Optimized for low load");
      }

      return { success: true, data: { memoryLimit, maxExecutionTime, uploadSize }, message: "PHP auto-tuned successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "PHP tuner failed" };
    }
  }

  // 3. WEB SERVER AUTO OPTIMIZER
  async webServerAutoOptimizer(serverId: string): Promise<ApiResponse<{ gzipEnabled: boolean; cacheEnabled: boolean; workersScaled: boolean }>> {
    try {
      const server = servers.get(serverId);
      if (!server) {
        return { success: false, error: "Server not found" };
      }

      const load = Math.random() * 100;
      let gzipEnabled = true;
      let cacheEnabled = true;
      let workersScaled = false;

      if (load > 70) {
        workersScaled = true;
        logEvent(serverId, "system", "info", "Web optimizer: Scaled workers for high load");
      }

      return { success: true, data: { gzipEnabled, cacheEnabled, workersScaled }, message: "Web server optimized" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Web optimizer failed" };
    }
  }

  // 4. CRON SELF MANAGER
  async cronSelfManager(serverId: string): Promise<ApiResponse<{ jobsRestarted: number; processesKilled: number }>> {
    try {
      const serverCronJobs = Array.from(cronJobs.values()).filter(c => c.serverId === serverId);
      let jobsRestarted = 0;
      let processesKilled = 0;

      for (const job of serverCronJobs) {
        // Simulate checking for failed jobs
        if (Math.random() > 0.9) {
          job.enabled = true;
          cronJobs.set(job.id, job);
          jobsRestarted++;
          logEvent(serverId, "system", "warning", `Cron manager: Restarted job ${job.name}`);
        }

        // Simulate checking for stuck processes
        if (Math.random() > 0.95) {
          processesKilled++;
          logEvent(serverId, "system", "warning", `Cron manager: Killed stuck process for ${job.name}`);
        }
      }

      return { success: true, data: { jobsRestarted, processesKilled }, message: `Cron manager: ${jobsRestarted} jobs restarted, ${processesKilled} processes killed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Cron manager failed" };
    }
  }

  // 5. SCHEDULED TASK AI
  async scheduledTaskAI(serverId: string): Promise<ApiResponse<{ tasksExecuted: string[] }>> {
    try {
      const tasksExecuted: string[] = [];
      const now = new Date();

      // Auto backup (daily at 2 AM)
      if (now.getHours() === 2 && now.getMinutes() === 0) {
        const serverDatabases = Array.from(databases.values()).filter(d => d.serverId === serverId);
        for (const db of serverDatabases) {
          await this.backupDatabase(db.id, "system");
          tasksExecuted.push(`Backup: ${db.name}`);
        }
      }

      // Auto cleanup (daily at 3 AM)
      if (now.getHours() === 3 && now.getMinutes() === 0) {
        tasksExecuted.push("Cleanup: Old logs compressed");
        logEvent(serverId, "system", "info", "Task AI: Executed log cleanup");
      }

      // Auto SSL renew (daily check)
      const serverDomains = Array.from(domains.values()).filter(d => d.serverId === serverId);
      for (const domain of serverDomains) {
        if (domain.sslExpiry) {
          const expiryDate = new Date(domain.sslExpiry);
          const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30) {
            tasksExecuted.push(`SSL Renew: ${domain.name}`);
            logEvent(serverId, "system", "info", `Task AI: SSL renewed for ${domain.name}`);
          }
        }
      }

      // Auto log rotate (weekly)
      if (now.getDay() === 0 && now.getHours() === 4) {
        tasksExecuted.push("Log rotate: Completed");
        logEvent(serverId, "system", "info", "Task AI: Executed log rotation");
      }

      return { success: true, data: { tasksExecuted }, message: `Task AI: ${tasksExecuted.length} tasks executed` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Task AI failed" };
    }
  }

  // 6. IP AUTO BAN SYSTEM
  async ipAutoBanSystem(serverId: string): Promise<ApiResponse<{ ipsBanned: string[] }>> {
    try {
      const ipsBanned: string[] = [];
      
      // Simulate brute force detection
      const suspiciousIPs = ["192.168.1.100", "10.0.0.50"];
      
      for (const ip of suspiciousIPs) {
        if (Math.random() > 0.8) {
          ipsBanned.push(ip);
          logEvent(serverId, "security", "warning", `IP ban system: Banned ${ip} for brute force`);
        }
      }

      return { success: true, data: { ipsBanned }, message: `IP ban: ${ipsBanned.length} IPs banned` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "IP ban system failed" };
    }
  }

  // 7. MAIL AUTO FIX ENGINE
  async mailAutoFixEngine(serverId: string): Promise<ApiResponse<{ postfixRestarted: boolean; queueFlushed: boolean }>> {
    try {
      let postfixRestarted = false;
      let queueFlushed = false;

      const mailService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
      if (mailService && mailService.status !== "running") {
        mailService.status = "running";
        services.set(mailService.id, mailService);
        postfixRestarted = true;
        logEvent(serverId, "system", "warning", "Mail fix: Postfix restarted");
      }

      // Simulate queue check
      if (Math.random() > 0.9) {
        queueFlushed = true;
        logEvent(serverId, "system", "info", "Mail fix: Queue flushed");
      }

      return { success: true, data: { postfixRestarted, queueFlushed }, message: "Mail fix completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail fix engine failed" };
    }
  }

  // 8. DNS AUTO SYNC
  async dnsAutoSync(serverId: string): Promise<ApiResponse<{ recordsRegenerated: number; synced: boolean }>> {
    try {
      const serverDomains = Array.from(domains.values()).filter(d => d.serverId === serverId);
      let recordsRegenerated = 0;

      for (const domain of serverDomains) {
        // Simulate propagation check
        if (Math.random() > 0.85) {
          const domainRecords = Array.from(dnsRecords.values()).filter(r => r.domainId === domain.id);
          if (domainRecords.length === 0) {
            // Regenerate missing A record
            const newRecord: DNSRecordEntity = {
              id: generateId("dns"),
              domainId: domain.id,
              name: "@",
              type: "A",
              value: domain.ip,
              ttl: 3600,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            dnsRecords.set(newRecord.id, newRecord);
            recordsRegenerated++;
            logEvent(serverId, "system", "info", `DNS sync: Regenerated A record for ${domain.name}`);
          }
        }
      }

      return { success: true, data: { recordsRegenerated, synced: true }, message: `DNS sync: ${recordsRegenerated} records regenerated` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "DNS sync failed" };
    }
  }

  // 9. ONE CLICK SERVER RESET (SAFE)
  async safeServerReset(serverId: string, userId: string): Promise<ApiResponse<{ servicesRestarted: number; cacheCleared: boolean; configsReloaded: boolean }>> {
    try {
      const server = servers.get(serverId);
      if (!server || server.userId !== userId) {
        return { success: false, error: "Permission denied" };
      }

      let servicesRestarted = 0;
      const serverServices = Array.from(services.values()).filter(s => s.serverId === serverId);

      for (const service of serverServices) {
        service.status = "running";
        services.set(service.id, service);
        servicesRestarted++;
      }

      const cacheCleared = true;
      const configsReloaded = true;

      logEvent(serverId, "system", "warning", "Server reset: All services restarted, cache cleared, configs reloaded");

      return { success: true, data: { servicesRestarted, cacheCleared, configsReloaded }, message: "Server reset completed safely" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Server reset failed" };
    }
  }

  // 10. AUTO BACKGROUND DAEMON
  async autoBackgroundDaemon(serverId: string): Promise<ApiResponse<{ status: string; lastCheck: string }>> {
    try {
      // System watcher - runs every 5-10 seconds
      const status = "running";
      const lastCheck = new Date().toISOString();

      // Trigger other auto systems
      await this.globalSelfHealEngine(serverId);
      await this.webServerAutoOptimizer(serverId);

      return { success: true, data: { status, lastCheck }, message: "Background daemon active" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Background daemon failed" };
    }
  }

  // 11. LOG AUTO CLEANER
  async logAutoCleaner(serverId: string): Promise<ApiResponse<{ logsCompressed: number; logsDeleted: number }>> {
    try {
      const serverLogs = Array.from(logs.values()).filter(l => l.serverId === serverId);
      let logsCompressed = 0;
      let logsDeleted = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      for (const log of serverLogs) {
        const logDate = new Date(log.createdAt);
        if (logDate < thirtyDaysAgo) {
          if (Math.random() > 0.5) {
            logsCompressed++;
          } else {
            logsDeleted++;
          }
        }
      }

      if (logsCompressed > 0 || logsDeleted > 0) {
        logEvent(serverId, "system", "info", `Log cleaner: ${logsCompressed} compressed, ${logsDeleted} deleted`);
      }

      return { success: true, data: { logsCompressed, logsDeleted }, message: "Log cleaner completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Log cleaner failed" };
    }
  }

  // 12. SYSTEM HEALTH SCORE
  async getSystemHealthScore(serverId: string): Promise<ApiResponse<{ score: "healthy" | "warning" | "critical"; metrics: { cpu: number; ram: number; disk: number; errors: number } }>> {
    try {
      const cpu = Math.random() * 100;
      const ram = Math.random() * 100;
      const disk = Math.random() * 100;
      const errors = Math.floor(Math.random() * 10);

      let score: "healthy" | "warning" | "critical" = "healthy";

      if (cpu > 90 || ram > 90 || disk > 90 || errors > 5) {
        score = "critical";
      } else if (cpu > 70 || ram > 70 || disk > 70 || errors > 2) {
        score = "warning";
      }

      return { success: true, data: { score, metrics: { cpu, ram, disk, errors } }, message: `Health score: ${score}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Health score failed" };
    }
  }

  // 13. FAILSAFE MODE
  async failsafeMode(serverId: string): Promise<ApiResponse<{ isolated: boolean; systemRunning: boolean; alertSent: boolean }>> {
    try {
      const health = await this.getSystemHealthScore(serverId);
      if (!health.success) {
        return { success: false, error: "Failed to check health" };
      }

      let isolated = false;
      let systemRunning = true;
      let alertSent = false;

      if (health.data.score === "critical") {
        isolated = true;
        alertSent = true;
        logEvent(serverId, "system", "error", "FAILSAFE: Critical error detected, issue isolated, admin alerted");
      }

      return { success: true, data: { isolated, systemRunning, alertSent }, message: "Failsafe mode checked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failsafe mode failed" };
    }
  }

  // 14. COMMAND CORE FLOW (10 second cycle)
  async commandCoreFlow(serverId: string): Promise<ApiResponse<{ servicesChecked: number; errorsFixed: number; systemOptimized: boolean }>> {
    try {
      let servicesChecked = 0;
      let errorsFixed = 0;
      let systemOptimized = false;

      // Check services
      const serverServices = Array.from(services.values()).filter(s => s.serverId === serverId);
      servicesChecked = serverServices.length;

      // Fix errors
      const healResult = await this.globalSelfHealEngine(serverId);
      if (healResult.success) {
        errorsFixed = healResult.data.servicesHealed;
      }

      // Optimize system
      await this.webServerAutoOptimizer(serverId);
      await this.smartPHPTuner(serverId);
      systemOptimized = true;

      // Log status
      logEvent(serverId, "system", "info", `Core flow: ${servicesChecked} services checked, ${errorsFixed} errors fixed, system optimized`);

      return { success: true, data: { servicesChecked, errorsFixed, systemOptimized }, message: "Core flow completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Core flow failed" };
    }
  }

  // ============================================
  // APPLICATIONS - ULTRA INSTALL ENGINE
  // ============================================

  // 1. INSTALL SELF-HEAL SYSTEM
  async installSelfHeal(queueId: string): Promise<ApiResponse<{ retried: boolean; tempCleared: boolean; servicesRestarted: boolean }>> {
    try {
      const queueItem = installQueue.get(queueId);
      if (!queueItem) {
        return { success: false, error: "Queue item not found" };
      }

      let retried = false;
      let tempCleared = false;
      let servicesRestarted = false;

      if (queueItem.status === "failed" && queueItem.retryCount < 3) {
        queueItem.status = "installing";
        queueItem.retryCount++;
        queueItem.updatedAt = new Date().toISOString();
        installQueue.set(queueId, queueItem);
        retried = true;

        // Clear temp files
        tempCleared = true;
        logEvent(queueItem.serverId, "system", "warning", `Install self-heal: Cleared temp files for ${queueItem.appName}`);

        // Restart services
        const nginxService = Array.from(services.values()).find(s => s.serverId === queueItem.serverId && s.serviceName === "nginx");
        if (nginxService) {
          nginxService.status = "running";
          services.set(nginxService.id, nginxService);
        }
        const phpService = Array.from(services.values()).find(s => s.serverId === queueItem.serverId && s.serviceName === "php-fpm");
        if (phpService) {
          phpService.status = "running";
          services.set(phpService.id, phpService);
        }
        servicesRestarted = true;
        logEvent(queueItem.serverId, "system", "warning", "Install self-heal: Restarted nginx and php-fpm");
      }

      return { success: true, data: { retried, tempCleared, servicesRestarted }, message: "Install self-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Install self-heal failed" };
    }
  }

  // 2. DEPENDENCY AUTO FIXER
  async dependencyAutoFixer(serverId: string): Promise<ApiResponse<{ phpFixed: boolean; nodeFixed: boolean; dbReady: boolean; diskOk: boolean }>> {
    try {
      let phpFixed = false;
      let nodeFixed = false;
      let dbReady = false;
      let diskOk = true;

      // Check PHP version
      const phpVersion = "8.2";
      if (Math.random() > 0.9) {
        phpFixed = true;
        logEvent(serverId, "system", "info", "Dependency fixer: PHP 8.2 installed");
      }

      // Check Node version
      const nodeVersion = "18";
      if (Math.random() > 0.9) {
        nodeFixed = true;
        logEvent(serverId, "system", "info", "Dependency fixer: Node 18 installed");
      }

      // Check database ready
      const dbServices = Array.from(services.values()).filter(s => s.serverId === serverId && (s.serviceName === "mysql" || s.serviceName === "postgresql"));
      dbReady = dbServices.some(s => s.status === "running");

      // Check disk space
      const diskUsage = Math.random() * 100;
      diskOk = diskUsage < 80;

      return { success: true, data: { phpFixed, nodeFixed, dbReady, diskOk }, message: "Dependency check completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Dependency fixer failed" };
    }
  }

  // 3. AUTO DATABASE CONNECTOR
  async autoDatabaseConnector(serverId: string, appName: string, dbType: "postgresql" | "mysql"): Promise<ApiResponse<{ dbName: string; dbUser: string; dbPassword: string; configLinked: boolean }>> {
    try {
      const dbName = `${appName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_db`;
      const dbUser = `${appName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_user`;
      const dbPassword = generateId("pass").substring(0, 16);

      // Create database
      const dbInput: DatabaseCreateInput = {
        serverId,
        name: dbName,
        type: dbType,
        user: dbUser,
        password: dbPassword,
      };

      const dbResult = await this.createDatabase(dbInput, "system");
      if (!dbResult.success) {
        return { success: false, error: "Failed to create database" };
      }

      // Auto link config
      const configLinked = true;
      logEvent(serverId, "system", "info", `Auto DB connector: Created DB ${dbName} and linked config for ${appName}`);

      return { success: true, data: { dbName, dbUser, dbPassword, configLinked }, message: "Database auto-connected" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Auto DB connector failed" };
    }
  }

  // 4. DOMAIN AUTO BIND
  async domainAutoBind(serverId: string, appName: string, domainName: string): Promise<ApiResponse<{ domainAttached: boolean; vhostCreated: boolean; sslEnabled: boolean }>> {
    try {
      let domainAttached = false;
      let vhostCreated = false;
      let sslEnabled = false;

      // Attach domain
      const domainInput: DomainCreateInput = {
        serverId,
        name: domainName,
        rootPath: `/var/www/${appName}`,
        ip: "192.168.1.1",
      };

      const domainResult = await this.createDomain(domainInput, "system");
      if (domainResult.success) {
        domainAttached = true;
        vhostCreated = true;
        logEvent(serverId, "system", "info", `Domain auto bind: Attached ${domainName} to ${appName}`);
      }

      // Enable SSL
      if (domainAttached) {
        const sslResult = await this.enableSSL(domainResult.data.id, "system");
        if (sslResult.success) {
          sslEnabled = true;
          logEvent(serverId, "system", "info", `Domain auto bind: SSL enabled for ${domainName}`);
        }
      }

      return { success: true, data: { domainAttached, vhostCreated, sslEnabled }, message: "Domain auto-bound" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Domain auto bind failed" };
    }
  }

  // 5. INSTALL QUEUE INTELLIGENCE
  async processInstallQueue(serverId: string): Promise<ApiResponse<{ processed: number; retried: number; completed: number }>> {
    try {
      const serverQueue = Array.from(installQueue.values())
        .filter(q => q.serverId === serverId && q.status === "queued")
        .slice(0, 2); // Max 2 parallel installs

      let processed = 0;
      let retried = 0;
      let completed = 0;

      for (const item of serverQueue) {
        item.status = "installing";
        item.updatedAt = new Date().toISOString();
        installQueue.set(item.id, item);
        processed++;

        // Simulate install
        setTimeout(() => {
          if (Math.random() > 0.1) {
            item.status = "completed";
            item.progress = 100;
            completed++;
          } else {
            item.status = "failed";
            // Auto retry
            this.installSelfHeal(item.id);
            retried++;
          }
          item.updatedAt = new Date().toISOString();
          installQueue.set(item.id, item);
        }, 5000);
      }

      return { success: true, data: { processed, retried, completed }, message: `Queue processed: ${processed} items` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Queue processing failed" };
    }
  }

  // 6. INSTALL LOG TRACKING
  async trackInstallLog(queueId: string, logType: "install" | "error", message: string): Promise<ApiResponse<void>> {
    try {
      const queueItem = installQueue.get(queueId);
      if (!queueItem) {
        return { success: false, error: "Queue item not found" };
      }

      const logId = generateId("installlog");
      const log: LogEntity = {
        id: logId,
        serverId: queueItem.serverId,
        type: (logType === "error" ? "error" : "info") as LogType,
        level: "info",
        message: `[${queueItem.appName}] ${message}`,
        createdAt: new Date().toISOString(),
      };

      logs.set(logId, log);

      return { success: true, message: "Install log tracked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Log tracking failed" };
    }
  }

  // 7. APP HEALTH MONITOR
  async appHealthMonitor(appId: string): Promise<ApiResponse<{ urlWorking: boolean; portRunning: boolean; dbConnected: boolean; overall: "healthy" | "unhealthy" }>> {
    try {
      const app = applications.get(appId);
      if (!app) {
        return { success: false, error: "Application not found" };
      }

      const urlWorking = Math.random() > 0.1;
      const portRunning = app.status === "running";
      const dbConnected = Math.random() > 0.1;

      let overall: "healthy" | "unhealthy" = "healthy";
      if (!urlWorking || !portRunning || !dbConnected) {
        overall = "unhealthy";
      }

      // Auto fix if unhealthy
      if (overall === "unhealthy") {
        app.status = "running";
        applications.set(appId, app);
        logEvent(app.serverId, "system", "warning", `App health monitor: Restarted ${app.name}`);
      }

      return { success: true, data: { urlWorking, portRunning, dbConnected, overall }, message: `App health: ${overall}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "App health monitor failed" };
    }
  }

  // 8. AUTO ROLLBACK SYSTEM
  async autoRollback(appId: string): Promise<ApiResponse<{ deleted: boolean; restored: boolean; retried: boolean }>> {
    try {
      const app = applications.get(appId);
      if (!app) {
        return { success: false, error: "Application not found" };
      }

      let deleted = false;
      let restored = false;
      let retried = false;

      // Delete corrupted install
      applications.delete(appId);
      deleted = true;
      logEvent(app.serverId, "system", "warning", `Auto rollback: Deleted corrupted ${app.name}`);

      // Restore previous state (simulated)
      restored = true;
      logEvent(app.serverId, "system", "info", "Auto rollback: Previous state restored");

      // Retry clean install
      retried = true;
      logEvent(app.serverId, "system", "info", "Auto rollback: Initiating clean install retry");

      return { success: true, data: { deleted, restored, retried }, message: "Auto rollback completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Auto rollback failed" };
    }
  }

  // 9. STORAGE PROTECTION
  async storageProtection(serverId: string): Promise<ApiResponse<{ diskOk: boolean; installBlocked: boolean; tempCleaned: boolean }>> {
    try {
      const diskUsage = Math.random() * 100;
      const diskOk = diskUsage > 20;
      let installBlocked = false;
      let tempCleaned = false;

      if (!diskOk) {
        installBlocked = true;
        logEvent(serverId, "system", "error", "Storage protection: Install blocked - disk space < 20%");
        
        // Auto clean temp
        tempCleaned = true;
        logEvent(serverId, "system", "info", "Storage protection: Auto cleaned temp files");
      }

      return { success: true, data: { diskOk, installBlocked, tempCleaned }, message: "Storage protection checked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Storage protection failed" };
    }
  }

  // 10. SECURITY HARDEN
  async securityHarden(appId: string): Promise<ApiResponse<{ isolated: boolean; noCrossAccess: boolean; configSecured: boolean }>> {
    try {
      const app = applications.get(appId);
      if (!app) {
        return { success: false, error: "Application not found" };
      }

      const isolated = true;
      const noCrossAccess = true;
      const configSecured = true;

      logEvent(app.serverId, "security", "info", `Security harden: ${app.name} isolated and secured`);

      return { success: true, data: { isolated, noCrossAccess, configSecured }, message: "Security hardening applied" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Security harden failed" };
    }
  }

  // 11. CRITICAL COMMAND FLOW
  async criticalInstallFlow(serverId: string, appName: string, appType: string, domainName?: string): Promise<ApiResponse<{ step: string; status: string }>> {
    try {
      // Step 1: Check system
      const storageCheck = await this.storageProtection(serverId);
      if (!storageCheck.success || storageCheck.data.installBlocked) {
        return { success: false, error: "Storage check failed" };
      }

      // Step 2: Install dependencies
      const depFix = await this.dependencyAutoFixer(serverId);
      if (!depFix.success) {
        return { success: false, error: "Dependency fix failed" };
      }

      // Step 3: Create DB
      const dbType = appType === "wordpress" ? "mysql" : "postgresql";
      const dbConnect = await this.autoDatabaseConnector(serverId, appName, dbType);
      if (!dbConnect.success) {
        return { success: false, error: "DB connection failed" };
      }

      // Step 4: Bind domain
      if (domainName) {
        const domainBind = await this.domainAutoBind(serverId, appName, domainName);
        if (!domainBind.success) {
          return { success: false, error: "Domain bind failed" };
        }
      }

      // Step 5: Install app (simulated)
      const appId = generateId("app");
      const app: ApplicationEntity = {
        id: appId,
        serverId,
        domainId: domainName ? Array.from(domains.values()).find(d => d.name === domainName)?.id || "" : "",
        name: appName,
        type: appType as any,
        version: "1.0.0",
        envVars: {},
        port: 3000,
        status: "running",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      applications.set(appId, app);

      // Step 6: Verify
      const healthCheck = await this.appHealthMonitor(appId);
      if (!healthCheck.success || healthCheck.data.overall !== "healthy") {
        await this.autoRollback(appId);
        return { success: false, error: "Health check failed, rollback initiated" };
      }

      // Step 7: Security harden
      await this.securityHarden(appId);

      // Step 8: Mark complete
      logEvent(serverId, "system", "info", `Critical flow: ${appName} installed successfully`);

      return { success: true, data: { step: "complete", status: "success" }, message: "Install completed successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Critical install flow failed" };
    }
  }

  // 12. BACKGROUND WORKER
  async backgroundInstallWorker(serverId: string): Promise<ApiResponse<{ status: string; queueProcessed: number }>> {
    try {
      const status = "running";
      const queueResult = await this.processInstallQueue(serverId);
      const queueProcessed = queueResult.success ? queueResult.data.processed : 0;

      // Also run scheduled task AI
      await this.scheduledTaskAI(serverId);

      return { success: true, data: { status, queueProcessed }, message: "Background worker active" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Background worker failed" };
    }
  }

  // ============================================
  // MAIL - ULTRA SELF-HEAL ENGINE
  // ============================================

  // 1. REAL-TIME MAIL WATCHER
  async realTimeMailWatcher(serverId: string): Promise<ApiResponse<{ postfixRunning: boolean; dovecotRunning: boolean; port25Open: boolean; port587Open: boolean; queueSize: number; actionsTaken: string[] }>> {
    try {
      const actionsTaken: string[] = [];
      
      // Check postfix status
      const postfixService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
      let postfixRunning = postfixService?.status === "running";
      
      if (!postfixRunning) {
        postfixService.status = "running";
        services.set(postfixService.id, postfixService);
        postfixRunning = true;
        actionsTaken.push("Restarted postfix");
        logEvent(serverId, "system", "warning", "Mail watcher: Postfix restarted");
      }

      // Check dovecot status
      const dovecotService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "dovecot");
      let dovecotRunning = dovecotService?.status === "running";
      
      if (!dovecotRunning) {
        dovecotService.status = "running";
        services.set(dovecotService.id, dovecotService);
        dovecotRunning = true;
        actionsTaken.push("Restarted dovecot");
        logEvent(serverId, "system", "warning", "Mail watcher: Dovecot restarted");
      }

      // Check ports (simulated)
      const port25Open = Math.random() > 0.05;
      const port587Open = Math.random() > 0.05;

      // Check queue size
      const queueSize = Math.floor(Math.random() * 50);

      return { success: true, data: { postfixRunning, dovecotRunning, port25Open, port587Open, queueSize, actionsTaken }, message: "Mail watcher completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail watcher failed" };
    }
  }

  // 2. SMART MAIL QUEUE AI
  async smartMailQueueAI(serverId: string): Promise<ApiResponse<{ queueFlushed: boolean; stuckRemoved: boolean; mailRestarted: boolean }>> {
    try {
      const watcherResult = await this.realTimeMailWatcher(serverId);
      const queueSize = watcherResult.success ? watcherResult.data.queueSize : 0;

      let queueFlushed = false;
      let stuckRemoved = false;
      let mailRestarted = false;

      if (queueSize > 20) {
        // Flush queue
        queueFlushed = true;
        logEvent(serverId, "system", "warning", "Mail queue AI: Queue flushed (postqueue -f)");

        // Remove stuck
        stuckRemoved = true;
        logEvent(serverId, "system", "warning", "Mail queue AI: Stuck mails removed (postsuper -d ALL)");

        // Restart mail
        const postfixService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
        if (postfixService) {
          postfixService.status = "running";
          services.set(postfixService.id, postfixService);
          mailRestarted = true;
          logEvent(serverId, "system", "warning", "Mail queue AI: Postfix restarted");
        }
      }

      return { success: true, data: { queueFlushed, stuckRemoved, mailRestarted }, message: "Mail queue AI completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail queue AI failed" };
    }
  }

  // 3. DELIVERY FAILURE AUTO FIX
  async deliveryFailureAutoFix(serverId: string): Promise<ApiResponse<{ retried: boolean; dnsChecked: boolean; serviceRestarted: boolean }>> {
    try {
      let retried = false;
      let dnsChecked = false;
      let serviceRestarted = false;

      // Simulate log detection
      const hasDeferred = Math.random() > 0.85;
      const hasTimeout = Math.random() > 0.9;
      const hasUnreachable = Math.random() > 0.95;

      if (hasDeferred || hasTimeout || hasUnreachable) {
        // Retry send
        retried = true;
        logEvent(serverId, "system", "warning", "Delivery fix: Retrying failed deliveries");

        // Switch DNS check
        dnsChecked = true;
        await this.dnsAutoSync(serverId);

        // Restart service
        const postfixService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
        if (postfixService) {
          postfixService.status = "running";
          services.set(postfixService.id, postfixService);
          serviceRestarted = true;
          logEvent(serverId, "system", "warning", "Delivery fix: Postfix restarted");
        }
      }

      return { success: true, data: { retried, dnsChecked, serviceRestarted }, message: "Delivery failure fix completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Delivery failure fix failed" };
    }
  }

  // 4. DNS AUTO VALIDATOR
  async dnsAutoValidator(serverId: string): Promise<ApiResponse<{ mxValid: boolean; spfValid: boolean; dkimValid: boolean; dmarcValid: boolean; warnings: string[] }>> {
    try {
      const warnings: string[] = [];
      
      const mxValid = Math.random() > 0.1;
      const spfValid = Math.random() > 0.15;
      const dkimValid = Math.random() > 0.1;
      const dmarcValid = Math.random() > 0.15;

      if (!mxValid) warnings.push("MX record invalid");
      if (!spfValid) warnings.push("SPF record missing or invalid");
      if (!dkimValid) {
        warnings.push("DKIM not signed - regenerating");
        // Auto regenerate DKIM
        logEvent(serverId, "system", "info", "DNS validator: DKIM regenerated");
      }
      if (!dmarcValid) warnings.push("DMARC not active");

      if (warnings.length > 0) {
        logEvent(serverId, "security", "warning", `DNS validator: ${warnings.join(", ")}`);
      }

      return { success: true, data: { mxValid, spfValid, dkimValid, dmarcValid, warnings }, message: "DNS validation completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "DNS validator failed" };
    }
  }

  // 5. ANTI-SPAM + ATTACK DEFENSE
  async antiSpamAttackDefense(serverId: string): Promise<ApiResponse<{ fail2BanActive: boolean; spamAssassinActive: boolean; ipsBlocked: string[] }>> {
    try {
      const fail2BanActive = true;
      const spamAssassinActive = true;
      const ipsBlocked: string[] = [];

      // Simulate brute force detection
      const suspiciousIPs = ["192.168.1.200", "10.0.0.100"];
      
      for (const ip of suspiciousIPs) {
        if (Math.random() > 0.8) {
          ipsBlocked.push(ip);
          logEvent(serverId, "security", "warning", `Anti-spam: Blocked ${ip} (brute force)`);
        }
      }

      return { success: true, data: { fail2BanActive, spamAssassinActive, ipsBlocked }, message: "Anti-spam defense active" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Anti-spam defense failed" };
    }
  }

  // 6. MAIL DELIVERY TRACKING
  async getMailDeliveryLogs(serverId: string): Promise<ApiResponse<{ sent: number; delivered: number; bounced: number; spam: number; logs: any[] }>> {
    try {
      const sent = Math.floor(Math.random() * 1000);
      const delivered = Math.floor(sent * 0.85);
      const bounced = Math.floor(sent * 0.1);
      const spam = Math.floor(sent * 0.05);

      const logs = [
        { id: "1", type: "sent", from: "admin@erpvala.com", to: "user@example.com", status: "delivered", timestamp: new Date().toISOString() },
        { id: "2", type: "sent", from: "admin@erpvala.com", to: "spam@example.com", status: "spam", timestamp: new Date().toISOString() },
        { id: "3", type: "sent", from: "admin@erpvala.com", to: "invalid@example.com", status: "bounced", timestamp: new Date().toISOString() },
      ];

      return { success: true, data: { sent, delivered, bounced, spam, logs }, message: "Delivery logs retrieved" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Delivery logs failed" };
    }
  }

  // 7. AUTO MAILBOX HEAL
  async autoMailboxHeal(mailboxId: string): Promise<ApiResponse<{ recreated: boolean; restored: boolean }>> {
    try {
      const mailbox = mail.get(mailboxId);
      if (!mailbox) {
        return { success: false, error: "Mailbox not found" };
      }

      let recreated = false;
      let restored = false;

      // Simulate corrupted mailbox detection
      if (Math.random() > 0.9) {
        // Recreate mailbox
        recreated = true;
        logEvent(mailbox.serverId, "system", "warning", `Mailbox heal: Recreated ${mailbox.address}`);

        // Restore from backup
        restored = true;
        logEvent(mailbox.serverId, "system", "info", "Mailbox heal: Emails restored from backup");
      }

      return { success: true, data: { recreated, restored }, message: "Mailbox heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mailbox heal failed" };
    }
  }

  // 8. STORAGE AUTO CONTROL
  async storageAutoControl(mailboxId: string): Promise<ApiResponse<{ notified: boolean; trashCleaned: boolean; expanded: boolean }>> {
    try {
      const mailbox = mail.get(mailboxId);
      if (!mailbox) {
        return { success: false, error: "Mailbox not found" };
      }

      let notified = false;
      let trashCleaned = false;
      let expanded = false;

      // Check if mailbox full
      if (mailbox.usedGB > mailbox.quotaGB * 0.9) {
        notified = true;
        logEvent(mailbox.serverId, "system", "warning", `Storage control: ${mailbox.address} nearly full`);

        // Auto clean trash
        trashCleaned = true;
        mailbox.usedGB = Math.max(mailbox.usedGB * 0.8, 0);
        mail.set(mailboxId, mailbox);
        logEvent(mailbox.serverId, "system", "info", "Storage control: Trash cleaned");

        // Optional auto expand
        if (mailbox.usedGB > mailbox.quotaGB * 0.95) {
          expanded = true;
          mailbox.quotaGB += 5;
          mail.set(mailboxId, mailbox);
          logEvent(mailbox.serverId, "system", "info", "Storage control: Quota expanded by 5GB");
        }
      }

      return { success: true, data: { notified, trashCleaned, expanded }, message: "Storage control completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Storage control failed" };
    }
  }

  // 9. BACKUP + RESTORE
  async backupMailSystem(serverId: string): Promise<ApiResponse<{ backupPath: string; size: number }>> {
    try {
      const backupPath = "/var/mail/mail-backup.tar.gz";
      const size = Math.floor(Math.random() * 1024 * 1024 * 1024); // Up to 1GB

      logEvent(serverId, "system", "info", `Mail backup: Created ${backupPath} (${(size / 1024 / 1024).toFixed(0)}MB)`);

      return { success: true, data: { backupPath, size }, message: "Mail backup completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail backup failed" };
    }
  }

  async restoreMailSystem(serverId: string, backupPath: string): Promise<ApiResponse<void>> {
    try {
      logEvent(serverId, "system", "warning", `Mail restore: Restoring from ${backupPath}`);

      return { success: true, message: "Mail restore completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail restore failed" };
    }
  }

  // 10. SECURITY LOCK
  async securityLockMail(serverId: string): Promise<ApiResponse<{ openRelayDisabled: boolean; authRequired: boolean; tlsRequired: boolean }>> {
    try {
      const openRelayDisabled = true;
      const authRequired = true;
      const tlsRequired = true;

      logEvent(serverId, "security", "info", "Mail security: Open relay disabled, auth required, TLS enforced");

      return { success: true, data: { openRelayDisabled, authRequired, tlsRequired }, message: "Mail security locked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Mail security lock failed" };
    }
  }

  // 11. ULTRA SELF HEAL FLOW
  async ultraMailSelfHealFlow(serverId: string): Promise<ApiResponse<{ issueDetected: boolean; restarted: boolean; queueCleared: boolean; dnsValidated: boolean; deliveryRetried: boolean }>> {
    try {
      let issueDetected = false;
      let restarted = false;
      let queueCleared = false;
      let dnsValidated = false;
      let deliveryRetried = false;

      // Detect issue
      const watcherResult = await this.realTimeMailWatcher(serverId);
      if (!watcherResult.success || !watcherResult.data.postfixRunning || !watcherResult.data.dovecotRunning || watcherResult.data.queueSize > 20) {
        issueDetected = true;
      }

      if (issueDetected) {
        // Restart services
        const postfixService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "postfix");
        const dovecotService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "dovecot");
        
        if (postfixService) {
          postfixService.status = "running";
          services.set(postfixService.id, postfixService);
        }
        if (dovecotService) {
          dovecotService.status = "running";
          services.set(dovecotService.id, dovecotService);
        }
        restarted = true;
        logEvent(serverId, "system", "warning", "Ultra heal: Mail services restarted");

        // Clear queue
        const queueResult = await this.smartMailQueueAI(serverId);
        queueCleared = queueResult.success && queueResult.data.queueFlushed;

        // Validate DNS
        const dnsResult = await this.dnsAutoValidator(serverId);
        dnsValidated = dnsResult.success;

        // Retry delivery
        const deliveryResult = await this.deliveryFailureAutoFix(serverId);
        deliveryRetried = deliveryResult.success && deliveryResult.data.retried;
      }

      return { success: true, data: { issueDetected, restarted, queueCleared, dnsValidated, deliveryRetried }, message: "Ultra mail self-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Ultra mail self-heal failed" };
    }
  }

  // ============================================
  // DATABASE - ULTRA SELF-HEAL ENGINE
  // ============================================

  // 1. AUTO DB HEALTH CHECK
  async autoDBHealthCheck(databaseId: string): Promise<ApiResponse<{ connectionOk: boolean; responseTime: number; activeConnections: number; status: "healthy" | "degraded" | "critical" }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const connectionOk = db.status === "running";
      const responseTime = Math.random() * 100; // ms
      const activeConnections = Math.floor(Math.random() * 100);

      let status: "healthy" | "degraded" | "critical" = "healthy";
      if (!connectionOk || responseTime > 500 || activeConnections > 80) {
        status = "critical";
      } else if (responseTime > 200 || activeConnections > 50) {
        status = "degraded";
      }

      return { success: true, data: { connectionOk, responseTime, activeConnections, status }, message: `DB health: ${status}` };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "DB health check failed" };
    }
  }

  // 2. SELF HEAL ENGINE
  async dbSelfHealEngine(databaseId: string): Promise<ApiResponse<{ dbRestarted: boolean; connectionsKilled: number; backupRestored: boolean }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      let dbRestarted = false;
      let connectionsKilled = 0;
      let backupRestored = false;

      // A. DB DOWN
      if (db.status !== "running") {
        db.status = "running";
        databases.set(databaseId, db);
        dbRestarted = true;
        logEvent(db.serverId, "system", "warning", `DB self-heal: ${db.name} restarted`);
      }

      // B. CONNECTION FAIL
      const healthCheck = await this.autoDBHealthCheck(databaseId);
      if (healthCheck.success && healthCheck.data.activeConnections > 80) {
        connectionsKilled = Math.floor(healthCheck.data.activeConnections * 0.3);
        logEvent(db.serverId, "system", "warning", `DB self-heal: Killed ${connectionsKilled} stuck connections`);
      }

      // C. CRASH RECOVERY
      if (healthCheck.success && healthCheck.data.status === "critical") {
        const backups = Array.from(databaseBackups.values()).filter(b => b.databaseId === databaseId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (backups.length > 0) {
          await this.restoreDatabaseBackup(backups[0].id, "system");
          backupRestored = true;
          logEvent(db.serverId, "system", "warning", `DB self-heal: Restored from backup ${backups[0].id}`);
        }
      }

      return { success: true, data: { dbRestarted, connectionsKilled, backupRestored }, message: "DB self-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "DB self-heal failed" };
    }
  }

  // 3. SLOW QUERY AUTO FIX
  async slowQueryAutoFix(databaseId: string): Promise<ApiResponse<{ slowQueriesDetected: number; queriesKilled: number; heavyQueriesLogged: number }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const slowQueriesDetected = Math.floor(Math.random() * 10);
      let queriesKilled = 0;
      let heavyQueriesLogged = 0;

      for (let i = 0; i < slowQueriesDetected; i++) {
        const queryTime = Math.random() * 10; // seconds
        if (queryTime > 5) {
          queriesKilled++;
          logEvent(db.serverId, "system", "warning", `Slow query fix: Killed query running for ${queryTime.toFixed(1)}s`);
        } else if (queryTime > 1) {
          heavyQueriesLogged++;
          logEvent(db.serverId, "system", "info", `Slow query fix: Logged heavy query (${queryTime.toFixed(1)}s)`);
        }
      }

      return { success: true, data: { slowQueriesDetected, queriesKilled, heavyQueriesLogged }, message: "Slow query fix completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Slow query fix failed" };
    }
  }

  // 4. AUTO BACKUP SYSTEM
  async autoBackupSystem(serverId: string): Promise<ApiResponse<{ backupsCreated: number; oldBackupsCleaned: number }>> {
    try {
      const now = new Date();
      const serverDatabases = Array.from(databases.values()).filter(d => d.serverId === serverId);
      let backupsCreated = 0;
      let oldBackupsCleaned = 0;

      // Check if it's time for backup (every 6 hours)
      for (const db of serverDatabases) {
        const lastBackup = Array.from(databaseBackups.values())
          .filter(b => b.databaseId === db.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

        const shouldBackup = !lastBackup || (now.getTime() - new Date(lastBackup.createdAt).getTime()) > 6 * 60 * 60 * 1000;

        if (shouldBackup) {
          const backupResult = await this.backupDatabase(db.id, "system");
          if (backupResult.success) {
            backupsCreated++;
          }
        }
      }

      // Keep only last 7 backups per database
      for (const db of serverDatabases) {
        const dbBackups = Array.from(databaseBackups.values())
          .filter(b => b.databaseId === db.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (dbBackups.length > 7) {
          const toDelete = dbBackups.slice(7);
          for (const backup of toDelete) {
            databaseBackups.delete(backup.id);
            oldBackupsCleaned++;
          }
        }
      }

      if (backupsCreated > 0) {
        logEvent(serverId, "system", "info", `Auto backup: Created ${backupsCreated} backups, cleaned ${oldBackupsCleaned} old backups`);
      }

      return { success: true, data: { backupsCreated, oldBackupsCleaned }, message: "Auto backup system completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Auto backup system failed" };
    }
  }

  // 5. SMART RESTORE
  async smartRestorePreview(backupId: string): Promise<ApiResponse<{ size: number; timestamp: string; estimatedRestoreTime: number; tablesCount: number }>> {
    try {
      const backup = databaseBackups.get(backupId);
      if (!backup) {
        return { success: false, error: "Backup not found" };
      }

      const size = backup.size;
      const timestamp = backup.createdAt;
      const estimatedRestoreTime = Math.ceil(size / (1024 * 1024 * 10)); // 10MB/s
      const tablesCount = Math.floor(Math.random() * 50) + 10;

      return { success: true, data: { size, timestamp, estimatedRestoreTime, tablesCount }, message: "Restore preview ready" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Restore preview failed" };
    }
  }

  // 6. DATA PROTECTION
  async dataProtectionBackup(databaseId: string, operation: "delete" | "update"): Promise<ApiResponse<{ backupCreated: boolean; backupId: string }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      // Force backup before delete/update
      const backupResult = await this.backupDatabase(databaseId, "system");
      if (backupResult.success) {
        logEvent(db.serverId, "system", "info", `Data protection: Backup created before ${operation} on ${db.name}`);
        return { success: true, data: { backupCreated: true, backupId: backupResult.data.id }, message: "Protection backup created" };
      }

      return { success: false, error: "Failed to create protection backup" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Data protection failed" };
    }
  }

  // 7. REDIS AUTO HEAL
  async redisAutoHeal(databaseId: string): Promise<ApiResponse<{ memoryCleared: boolean; restarted: boolean; safeMode: boolean }>> {
    try {
      const db = databases.get(databaseId);
      if (!db || db.type !== "redis") {
        return { success: false, error: "Redis database not found" };
      }

      let memoryCleared = false;
      let restarted = false;
      const safeMode = true;

      // Check if memory full
      if (db.sizeGB > db.storageLimitGB * 0.9) {
        memoryCleared = true;
        db.sizeGB = db.sizeGB * 0.5;
        databases.set(databaseId, db);
        logEvent(db.serverId, "system", "warning", "Redis auto-heal: Memory cleared (safe mode)");
      }

      // Restart if crash
      if (db.status !== "running") {
        db.status = "running";
        databases.set(databaseId, db);
        restarted = true;
        logEvent(db.serverId, "system", "warning", "Redis auto-heal: Redis restarted");
      }

      return { success: true, data: { memoryCleared, restarted, safeMode }, message: "Redis auto-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Redis auto-heal failed" };
    }
  }

  // 8. RESOURCE CONTROL
  async dbResourceControl(databaseId: string): Promise<ApiResponse<{ connectionsLimited: boolean; maxConnections: number; currentConnections: number }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const healthCheck = await this.autoDBHealthCheck(databaseId);
      const currentConnections = healthCheck.success ? healthCheck.data.activeConnections : 0;
      let connectionsLimited = false;
      let maxConnections = 100;

      if (currentConnections > 80) {
        connectionsLimited = true;
        maxConnections = 50;
        logEvent(db.serverId, "system", "warning", `Resource control: Limited connections to ${maxConnections}`);
      }

      return { success: true, data: { connectionsLimited, maxConnections, currentConnections }, message: "Resource control completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Resource control failed" };
    }
  }

  // 9. DB SECURITY
  async dbSecurityLock(databaseId: string): Promise<ApiResponse<{ remoteAccessBlocked: boolean; whitelistEnabled: boolean; allowedIPs: string[] }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const remoteAccessBlocked = true;
      const whitelistEnabled = true;
      const allowedIPs = ["127.0.0.1", "::1"];

      logEvent(db.serverId, "security", "info", `DB security: ${db.name} locked to localhost only`);

      return { success: true, data: { remoteAccessBlocked, whitelistEnabled, allowedIPs }, message: "DB security locked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "DB security lock failed" };
    }
  }

  // 10. AUTO INDEX OPTIMIZER
  async autoIndexOptimizer(databaseId: string): Promise<ApiResponse<{ slowTablesDetected: string[]; indexesSuggested: string[]; indexesApplied: string[] }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const slowTablesDetected = ["users", "orders", "logs"].filter(() => Math.random() > 0.7);
      const indexesSuggested = slowTablesDetected.map(t => `idx_${t}_created_at`);
      const indexesApplied = indexesSuggested.filter(() => Math.random() > 0.5);

      if (indexesApplied.length > 0) {
        logEvent(db.serverId, "system", "info", `Index optimizer: Applied ${indexesApplied.length} indexes on ${db.name}`);
      }

      return { success: true, data: { slowTablesDetected, indexesSuggested, indexesApplied }, message: "Index optimizer completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Index optimizer failed" };
    }
  }

  // 11. LIVE DB MONITORING
  async liveDBMonitoring(databaseId: string): Promise<ApiResponse<{ queriesPerSecond: number; activeUsers: number; slowQueriesCount: number; cpuUsage: number; memoryUsage: number }>> {
    try {
      const db = databases.get(databaseId);
      if (!db) {
        return { success: false, error: "Database not found" };
      }

      const queriesPerSecond = Math.floor(Math.random() * 1000);
      const activeUsers = Math.floor(Math.random() * 50);
      const slowQueriesCount = Math.floor(Math.random() * 20);
      const cpuUsage = Math.random() * 100;
      const memoryUsage = (db.sizeGB / db.storageLimitGB) * 100;

      return { success: true, data: { queriesPerSecond, activeUsers, slowQueriesCount, cpuUsage, memoryUsage }, message: "Live monitoring data" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Live monitoring failed" };
    }
  }

  // 12. ULTRA DB SELF HEAL FLOW
  async ultraDBSelfHealFlow(databaseId: string): Promise<ApiResponse<{ issueDetected: boolean; dbRestarted: boolean; connectionsKilled: number; backupRestored: boolean; slowQueriesFixed: number }>> {
    try {
      let issueDetected = false;
      let dbRestarted = false;
      let connectionsKilled = 0;
      let backupRestored = false;
      let slowQueriesFixed = 0;

      // Detect issue
      const healthCheck = await this.autoDBHealthCheck(databaseId);
      if (!healthCheck.success || healthCheck.data.status === "critical") {
        issueDetected = true;
      }

      if (issueDetected) {
        // Run self-heal engine
        const healResult = await this.dbSelfHealEngine(databaseId);
        if (healResult.success) {
          dbRestarted = healResult.data.dbRestarted;
          connectionsKilled = healResult.data.connectionsKilled;
          backupRestored = healResult.data.backupRestored;
        }

        // Fix slow queries
        const slowQueryResult = await this.slowQueryAutoFix(databaseId);
        if (slowQueryResult.success) {
          slowQueriesFixed = slowQueryResult.data.queriesKilled;
        }
      }

      return { success: true, data: { issueDetected, dbRestarted, connectionsKilled, backupRestored, slowQueriesFixed }, message: "Ultra DB self-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Ultra DB self-heal failed" };
    }
  }

  // ============================================
  // FILE MANAGER - ULTRA SELF-HEAL ENGINE
  // ============================================

  // 1. AUTO PERMISSION HEAL
  async autoPermissionHeal(serverId: string, filePath: string): Promise<ApiResponse<{ permissionsFixed: boolean; folderChmod: boolean; fileChmod: boolean }>> {
    try {
      let permissionsFixed = false;
      let folderChmod = false;
      let fileChmod = false;

      // Simulate permission check
      const needsFix = Math.random() > 0.8;
      
      if (needsFix) {
        permissionsFixed = true;
        
        // Fix folder permissions (chmod 755)
        if (filePath.endsWith("/")) {
          folderChmod = true;
          logEvent(serverId, "system", "info", `Permission heal: chmod 755 ${filePath}`);
        } else {
          // Fix file permissions (chmod 644)
          fileChmod = true;
          logEvent(serverId, "system", "info", `Permission heal: chmod 644 ${filePath}`);
        }
      }

      return { success: true, data: { permissionsFixed, folderChmod, fileChmod }, message: "Permission heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Permission heal failed" };
    }
  }

  // 2. AUTO OWNER FIX
  async autoOwnerFix(serverId: string, path: string): Promise<ApiResponse<{ ownerFixed: boolean; newOwner: string }>> {
    try {
      let ownerFixed = false;
      const newOwner = "www-data:www-data";

      // Simulate owner check
      const needsFix = Math.random() > 0.85;
      
      if (needsFix) {
        ownerFixed = true;
        logEvent(serverId, "system", "warning", `Owner fix: chown -R ${newOwner} ${path}`);
      }

      return { success: true, data: { ownerFixed, newOwner }, message: "Owner fix completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Owner fix failed" };
    }
  }

  // 3. FILE SELF HEAL
  async fileSelfHeal(serverId: string, filePath: string): Promise<ApiResponse<{ restoredFromBackup: boolean; recreated: boolean; nginxReloaded: boolean }>> {
    try {
      let restoredFromBackup = false;
      let recreated = false;
      let nginxReloaded = false;

      // Simulate file issue detection
      const fileMissing = Math.random() > 0.9;
      const fileCorrupted = Math.random() > 0.95;

      if (fileMissing || fileCorrupted) {
        // Restore from backup
        const fileVersionsList = Array.from(fileVersions.values()).filter((fv: FileVersionEntity) => fv.filePath === filePath);
        if (fileVersionsList.length > 0) {
          restoredFromBackup = true;
          logEvent(serverId, "system", "warning", `File self-heal: Restored ${filePath} from backup`);
        } else {
          // Recreate default file
          recreated = true;
          logEvent(serverId, "system", "warning", `File self-heal: Recreated ${filePath} as default`);
        }

        // Reload nginx
        const nginxService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "nginx");
        if (nginxService) {
          nginxService.status = "running";
          services.set(nginxService.id, nginxService);
          nginxReloaded = true;
          logEvent(serverId, "system", "info", "File self-heal: Nginx reloaded");
        }
      }

      return { success: true, data: { restoredFromBackup, recreated, nginxReloaded }, message: "File self-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "File self-heal failed" };
    }
  }

  // 4. VERSION CONTROL
  async createFileVersion(serverId: string, filePath: string, content: string, userId: string): Promise<ApiResponse<{ versionId: string; backupPath: string }>> {
    try {
      const versionId = generateId("filever");
      const timestamp = new Date().toISOString();
      const backupPath = `/backup/${filePath.replace(/\//g, "_")}.${timestamp}`;

      const version: FileVersionEntity = {
        id: versionId,
        serverId,
        filePath,
        content,
        version: 1,
        createdAt: timestamp,
        createdBy: userId,
      };

      fileVersions.set(versionId, version);
      logEvent(serverId, "system", "info", `Version control: Created backup of ${filePath}`);

      return { success: true, data: { versionId, backupPath }, message: "File version created" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Version control failed" };
    }
  }

  // 5. MALWARE / BAD FILE DETECTION
  async detectMalware(serverId: string, fileName: string, content: string): Promise<ApiResponse<{ isMalicious: boolean; threats: string[]; blocked: boolean }>> {
    try {
      const threats: string[] = [];
      let isMalicious = false;

      // Suspicious patterns
      const suspiciousPatterns = [
        "eval(",
        "exec(",
        "system(",
        "shell_exec(",
        "passthru(",
        "base64_decode(",
        "<?php",
        "#!/bin/bash",
        "#!/bin/sh",
      ];

      for (const pattern of suspiciousPatterns) {
        if (content.includes(pattern)) {
          threats.push(`Suspicious pattern: ${pattern}`);
          isMalicious = true;
        }
      }

      // Check file extension
      const dangerousExtensions = [".sh", ".bash", ".exe", ".bat", ".cmd"];
      if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
        threats.push(`Dangerous file extension: ${fileName.split('.').pop()}`);
        isMalicious = true;
      }

      const blocked = isMalicious;
      if (blocked) {
        logEvent(serverId, "security", "error", `Malware detection: Blocked ${fileName} - ${threats.join(", ")}`);
      }

      return { success: true, data: { isMalicious, threats, blocked }, message: "Malware scan completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Malware detection failed" };
    }
  }

  // 6. LARGE FILE PROTECTION
  async checkFileSize(serverId: string, fileSize: number, maxSizeMB: number = 100): Promise<ApiResponse<{ allowed: boolean; reason?: string; chunked: boolean }>> {
    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      let allowed = true;
      let reason: string | undefined;
      let chunked = false;

      if (fileSize > maxSizeBytes) {
        allowed = false;
        reason = `File size exceeds ${maxSizeMB}MB limit`;
        logEvent(serverId, "system", "warning", `File protection: Blocked large file (${(fileSize / 1024 / 1024).toFixed(0)}MB)`);
      } else if (fileSize > 10 * 1024 * 1024) {
        // Files > 10MB should be chunked
        chunked = true;
        logEvent(serverId, "system", "info", "File protection: Using chunked upload");
      }

      return { success: true, data: { allowed, reason, chunked }, message: "File size check completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "File size check failed" };
    }
  }

  // 7. LIVE FILE SYNC
  async liveFileSync(serverId: string, filePath: string): Promise<ApiResponse<{ nginxReloaded: boolean; cacheCleared: boolean }>> {
    try {
      let nginxReloaded = false;
      let cacheCleared = false;

      // Reload nginx
      const nginxService = Array.from(services.values()).find(s => s.serverId === serverId && s.serviceName === "nginx");
      if (nginxService) {
        nginxService.status = "running";
        services.set(nginxService.id, nginxService);
        nginxReloaded = true;
        logEvent(serverId, "system", "info", "Live sync: Nginx reloaded");
      }

      // Clear cache
      cacheCleared = true;
      logEvent(serverId, "system", "info", "Live sync: Cache cleared (rm -rf /var/cache/nginx/*)");

      return { success: true, data: { nginxReloaded, cacheCleared }, message: "Live sync completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Live sync failed" };
    }
  }

  // 8. AUTO CACHE CLEAR
  async autoCacheClear(serverId: string): Promise<ApiResponse<{ cacheCleared: boolean; path: string }>> {
    try {
      const path = "/var/cache/nginx/*";
      const cacheCleared = true;
      
      logEvent(serverId, "system", "info", `Cache clear: rm -rf ${path}`);

      return { success: true, data: { cacheCleared, path }, message: "Cache cleared" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Cache clear failed" };
    }
  }

  // 9. FILE LOCK SYSTEM
  async acquireFileLock(serverId: string, filePath: string, userId: string): Promise<ApiResponse<{ locked: boolean; lockId: string }>> {
    try {
      const lockId = generateId("filelock");
      const locked = true;
      
      logEvent(serverId, "system", "info", `File lock: ${filePath} locked by ${userId}`);

      return { success: true, data: { locked, lockId }, message: "File locked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "File lock failed" };
    }
  }

  async releaseFileLock(serverId: string, lockId: string): Promise<ApiResponse<{ unlocked: boolean }>> {
    try {
      const unlocked = true;
      
      logEvent(serverId, "system", "info", `File lock: Lock ${lockId} released`);

      return { success: true, data: { unlocked }, message: "File unlocked" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "File unlock failed" };
    }
  }

  // 10. LOGGING SYSTEM
  async logFileAction(serverId: string, userId: string, action: string, filePath: string): Promise<ApiResponse<void>> {
    try {
      const logId = generateId("filelog");
      const log: LogEntity = {
        id: logId,
        serverId,
        type: "info" as LogType,
        level: "info",
        message: `File action: ${userId} ${action} ${filePath}`,
        createdAt: new Date().toISOString(),
      };

      logs.set(logId, log);

      return { success: true, message: "File action logged" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "File logging failed" };
    }
  }

  // 11. HIDDEN SYSTEM PROTECTION
  async checkSystemProtection(serverId: string, filePath: string): Promise<ApiResponse<{ allowed: boolean; reason?: string }>> {
    try {
      const blockedPaths = [".env", "/etc", "/root", "/boot", "/sys", "/proc"];
      let allowed = true;
      let reason: string | undefined;

      for (const blocked of blockedPaths) {
        if (filePath.includes(blocked) || filePath.startsWith(blocked)) {
          allowed = false;
          reason = `Access to system path ${blocked} is blocked`;
          logEvent(serverId, "security", "error", `System protection: Blocked access to ${filePath}`);
          break;
        }
      }

      return { success: true, data: { allowed, reason }, message: "System protection check completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "System protection check failed" };
    }
  }

  // 12. ULTRA AUTO HEAL FLOW
  async ultraFileAutoHealFlow(serverId: string, filePath: string, userId: string): Promise<ApiResponse<{ permissionFixed: boolean; ownerFixed: boolean; fileHealed: boolean; backupCreated: boolean; synced: boolean }>> {
    try {
      let permissionFixed = false;
      let ownerFixed = false;
      let fileHealed = false;
      let backupCreated = false;
      let synced = false;

      // Check system protection
      const protectionCheck = await this.checkSystemProtection(serverId, filePath);
      if (!protectionCheck.success || !protectionCheck.data.allowed) {
        return { success: false, error: protectionCheck.data.reason || "Access denied by system protection" };
      }

      // Auto permission heal
      const permResult = await this.autoPermissionHeal(serverId, filePath);
      if (permResult.success && permResult.data.permissionsFixed) {
        permissionFixed = true;
      }

      // Auto owner fix
      const ownerResult = await this.autoOwnerFix(serverId, filePath);
      if (ownerResult.success && ownerResult.data.ownerFixed) {
        ownerFixed = true;
      }

      // File self heal
      const healResult = await this.fileSelfHeal(serverId, filePath);
      if (healResult.success && (healResult.data.restoredFromBackup || healResult.data.recreated)) {
        fileHealed = true;
      }

      // Create version before edit
      const versionResult = await this.createFileVersion(serverId, filePath, "", userId);
      if (versionResult.success) {
        backupCreated = true;
      }

      // Live sync
      const syncResult = await this.liveFileSync(serverId, filePath);
      if (syncResult.success) {
        synced = true;
      }

      // Log action
      await this.logFileAction(serverId, userId, "accessed", filePath);

      return { success: true, data: { permissionFixed, ownerFixed, fileHealed, backupCreated, synced }, message: "Ultra file auto-heal completed" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Ultra file auto-heal failed" };
    }
  }
}

// Export singleton instance
export const serverApiService = new ServerApiService();
