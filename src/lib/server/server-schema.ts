// Server Module Database Schema
// Hosting Panel (Plesk-style) backend data structures

// ============================================
// TYPE DEFINITIONS
// ============================================

export type ServerStatus = "online" | "offline" | "maintenance";
export type ServiceStatus = "running" | "stopped" | "restarting" | "error";
export type DomainStatus = "online" | "suspended" | "pending" | "offline" | "expiring";
export type SSLStatus = "active" | "none" | "expiring" | "expired";
export type DNSRecordType = "A" | "CNAME" | "TXT" | "MX" | "AAAA" | "NS";
export type DatabaseType = "postgresql" | "mysql" | "redis" | "mongodb";
export type AppStatus = "running" | "stopped" | "deploying" | "error";
export type AppType = "node" | "php" | "static" | "python" | "go";
export type InstallStatus = "queued" | "installing" | "completed" | "failed";
export type LogType = "access" | "error" | "system" | "mail" | "security";
export type BackupStatus = "pending" | "completed" | "failed";
export type BackupType = "manual" | "daily" | "weekly";
export type UserRole = "admin" | "manager" | "user";

// ============================================
// SERVER ENTITY
// ============================================

export interface ServerEntity {
  id: string;
  userId: string;
  name: string;
  hostname: string;
  ip: string;
  status: ServerStatus;
  cpuCores: number;
  ramGB: number;
  diskGB: number;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServerCreateInput {
  userId: string;
  name: string;
  hostname: string;
  ip: string;
  cpuCores: number;
  ramGB: number;
  diskGB: number;
}

export interface ServerUpdateInput {
  name?: string;
  status?: ServerStatus;
}

// ============================================
// DOMAIN ENTITY
// ============================================

export interface DomainEntity {
  id: string;
  serverId: string;
  name: string;
  rootPath: string;
  ip: string;
  sslStatus: SSLStatus;
  sslIssuer?: string;
  sslExpiry?: string;
  status: DomainStatus;
  redirectUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DomainCreateInput {
  serverId: string;
  name: string;
  rootPath: string;
  ip: string;
}

export interface DomainUpdateInput {
  rootPath?: string;
  sslStatus?: SSLStatus;
  status?: DomainStatus;
  redirectUrl?: string;
}

// ============================================
// DNS RECORD ENTITY
// ============================================

export interface DNSRecordEntity {
  id: string;
  domainId: string;
  type: DNSRecordType;
  name: string;
  value: string;
  ttl: number;
  priority?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DNSRecordCreateInput {
  domainId: string;
  type: DNSRecordType;
  name: string;
  value: string;
  ttl?: number;
  priority?: number;
}

export interface DNSRecordUpdateInput {
  type?: DNSRecordType;
  name?: string;
  value?: string;
  ttl?: number;
  priority?: number;
}

// ============================================
// DATABASE ENTITY
// ============================================

export interface DatabaseEntity {
  id: string;
  serverId: string;
  name: string;
  type: DatabaseType;
  user: string;
  password: string;
  host: string;
  port: number;
  sizeGB: number;
  storageLimitGB: number;
  status: ServiceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseCreateInput {
  serverId: string;
  name: string;
  type: DatabaseType;
  user: string;
  password: string;
}

export interface DatabaseUpdateInput {
  password?: string;
  status?: ServiceStatus;
  storageLimitGB?: number;
}

// ============================================
// DATABASE BACKUP ENTITY
// ============================================

export interface DatabaseBackupEntity {
  id: string;
  databaseId: string;
  serverId: string;
  size: number;
  status: "completed" | "failed" | "in_progress";
  createdAt: string;
  createdBy?: string;
}

// ============================================
// DATABASE USER ENTITY
// ============================================

export interface DatabaseUserEntity {
  id: string;
  databaseId: string;
  serverId: string;
  username: string;
  permissions: "read" | "write" | "admin";
  createdAt: string;
}

// ============================================
// SERVICE ENTITY
// ============================================

export interface ServiceEntity {
  id: string;
  serverId: string;
  serviceName: string;
  status: ServiceStatus;
  uptime: number; // seconds
  cpuUsage: number;
  memoryUsage: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceUpdateInput {
  status?: ServiceStatus;
}

// ============================================
// MAIL ENTITY
// ============================================

export interface MailEntity {
  id: string;
  serverId: string;
  address: string;
  password: string;
  quotaGB: number;
  usedGB: number;
  forwardTo?: string;
  status: DomainStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MailCreateInput {
  serverId: string;
  address: string;
  password: string;
  quotaGB: number;
  forwardTo?: string;
}

export interface MailUpdateInput {
  password?: string;
  quotaGB?: number;
  forwardTo?: string;
  status?: DomainStatus;
}

// ============================================
// APPLICATION ENTITY
// ============================================

export interface ApplicationEntity {
  id: string;
  serverId: string;
  domainId: string;
  name: string;
  type: AppType;
  version: string;
  status: AppStatus;
  gitRepo?: string;
  gitBranch?: string;
  envVars: Record<string, string>;
  port: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationCreateInput {
  serverId: string;
  domainId: string;
  name: string;
  type: AppType;
  version: string;
  gitRepo?: string;
  gitBranch?: string;
  envVars?: Record<string, string>;
  port?: number;
}

export interface ApplicationUpdateInput {
  status?: AppStatus;
  gitRepo?: string;
  gitBranch?: string;
  envVars?: Record<string, string>;
}

// ============================================
// INSTALL QUEUE ENTITY
// ============================================

export interface InstallQueueEntity {
  id: string;
  serverId: string;
  app: string;
  appName: string;
  domain: string;
  status: InstallStatus;
  progress: number;
  eta: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SECURITY ENTITY
// ============================================

export interface SecurityEntity {
  id: string;
  serverId: string;
  firewallEnabled: boolean;
  blockedIPs: string[];
  sslEnabled: boolean;
  malwareScanEnabled: boolean;
  lastScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SecurityUpdateInput {
  firewallEnabled?: boolean;
  blockedIPs?: string[];
  sslEnabled?: boolean;
  malwareScanEnabled?: boolean;
}

// ============================================
// USER ENTITY (SERVER LEVEL)
// ============================================

export interface ServerUserEntity {
  id: string;
  serverId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ServerUserCreateInput {
  serverId: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface ServerUserUpdateInput {
  role?: UserRole;
  permissions?: string[];
}

// ============================================
// LOG ENTITY
// ============================================

export interface LogEntity {
  id: string;
  serverId: string;
  type: LogType;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================
// BACKUP ENTITY
// ============================================

export interface BackupEntity {
  id: string;
  serverId: string;
  type: BackupType;
  status: BackupStatus;
  sizeGB: number;
  path: string;
  createdAt: string;
  completedAt?: string;
}

export interface BackupCreateInput {
  serverId: string;
  type: BackupType;
}

// ============================================
// CRON JOB ENTITY
// ============================================

export interface CronJobEntity {
  id: string;
  serverId: string;
  name: string;
  command: string;
  schedule: string; // cron expression
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CronJobCreateInput {
  serverId: string;
  name: string;
  command: string;
  schedule: string;
}

export interface CronJobUpdateInput {
  schedule?: string;
  command?: string;
  enabled?: boolean;
}

// ============================================
// FILE VERSION ENTITY
// ============================================

export interface FileVersionEntity {
  id: string;
  serverId: string;
  filePath: string;
  version: number;
  content?: string;
  checksum?: string;
  createdAt: string;
  createdBy?: string;
}

// ============================================
// SQL SCHEMA (for reference)
// ============================================

export const SQL_SCHEMA = `
-- Servers table
CREATE TABLE servers (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  status VARCHAR(50) DEFAULT 'online',
  cpu_cores INT NOT NULL,
  ram_gb INT NOT NULL,
  disk_gb INT NOT NULL,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  ram_usage DECIMAL(5,2) DEFAULT 0,
  disk_usage DECIMAL(5,2) DEFAULT 0,
  network_in DECIMAL(10,2) DEFAULT 0,
  network_out DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- Domains table
CREATE TABLE domains (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL UNIQUE,
  root_path VARCHAR(500) NOT NULL,
  ip VARCHAR(45) NOT NULL,
  ssl_status VARCHAR(50) DEFAULT 'none',
  ssl_issuer VARCHAR(255),
  ssl_expiry DATE,
  status VARCHAR(50) DEFAULT 'online',
  redirect_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_status (status)
);

-- Databases table
CREATE TABLE databases (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  user VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  port INT NOT NULL,
  size_gb DECIMAL(10,2) DEFAULT 0,
  storage_limit_gb DECIMAL(10,2) DEFAULT 10,
  status VARCHAR(50) DEFAULT 'running',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_type (type)
);

-- Database backups table
CREATE TABLE database_backups (
  id VARCHAR(255) PRIMARY KEY,
  database_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_database_id (database_id),
  INDEX idx_status (status)
);

-- Database users table
CREATE TABLE database_users (
  id VARCHAR(255) PRIMARY KEY,
  database_id VARCHAR(255) NOT NULL,
  server_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  permissions VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (database_id) REFERENCES databases(id) ON DELETE CASCADE,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_database_id (database_id)
);

-- Services table
CREATE TABLE services (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'running',
  uptime BIGINT DEFAULT 0,
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_service (server_id, service_name),
  INDEX idx_status (status)
);

-- Mail table
CREATE TABLE mail (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  quota_gb DECIMAL(5,2) NOT NULL,
  used_gb DECIMAL(5,2) DEFAULT 0,
  forward_to VARCHAR(255),
  status VARCHAR(50) DEFAULT 'online',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id)
);

-- Applications table
CREATE TABLE applications (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  domain_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  version VARCHAR(50),
  status VARCHAR(50) DEFAULT 'running',
  git_repo VARCHAR(500),
  git_branch VARCHAR(100),
  env_vars JSON,
  port INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_status (status)
);

-- Install queue table
CREATE TABLE install_queue (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  app VARCHAR(255) NOT NULL,
  domain VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'queued',
  progress INT DEFAULT 0,
  eta VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);

-- Security table
CREATE TABLE security (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  firewall_enabled BOOLEAN DEFAULT true,
  blocked_ips JSON,
  ssl_enabled BOOLEAN DEFAULT true,
  malware_scan_enabled BOOLEAN DEFAULT false,
  last_scan_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
);

-- Server users table
CREATE TABLE server_users (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (server_id, username),
  INDEX idx_role (role)
);

-- Logs table
CREATE TABLE logs (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  level VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_type (type),
  INDEX idx_level (level),
  INDEX idx_created_at (created_at)
);

-- Backups table
CREATE TABLE backups (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  size_gb DECIMAL(10,2) DEFAULT 0,
  path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_status (status)
);

-- Cron jobs table
CREATE TABLE cron_jobs (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  command TEXT NOT NULL,
  schedule VARCHAR(100) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_server_id (server_id),
  INDEX idx_enabled (enabled)
);

-- File versions table
CREATE TABLE file_versions (
  id VARCHAR(255) PRIMARY KEY,
  server_id VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  version INT NOT NULL,
  content TEXT,
  checksum VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
  INDEX idx_file_path (file_path),
  INDEX idx_version (version)
);
`;
