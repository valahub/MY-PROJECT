// Author Items Schema - Backend Tables for Marketplace Author System

// ============================================
// ITEM STATUS
// ============================================

export type ItemStatus = "draft" | "pending" | "approved" | "rejected" | "soft_rejected";

// ============================================
// LICENSE TYPE
// ============================================

export type LicenseType = "regular" | "extended";

// ============================================
// VIOLATION TYPE
// ============================================

export type ViolationType = "warning" | "suspension" | "ban";

// ============================================
// AUDIT ACTION
// ============================================

export type AuditAction = "upload" | "update" | "delete" | "approve" | "reject" | "submit";

// ============================================
// TABLE: items
// ============================================

export interface ItemEntity {
  id: string;
  userId: string; // Author ID
  title: string;
  description: string;
  category: string;
  subcategory: string;
  microcategory?: string;
  price: number;
  demoUrl: string; // Required
  thumbnailUrl?: string;
  galleryUrls?: string[];
  fileUrl: string; // ZIP file
  tags: string[];
  version: string;
  status: ItemStatus;
  rejectionReason?: string;
  sales: number;
  views: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  // SEO Fields
  slug: string; // Auto-generated + editable
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  schemaJson?: string; // JSON-LD
  // License System
  licenseType: LicenseType;
  extendedPrice?: number;
  // Download System
  downloadCount: number;
  licenseKeyRequired: boolean;
  // Preview System
  videoPreviewUrl?: string;
  // Analytics
  conversionRate: number;
  // Soft Delete
  isDeleted: boolean;
  deletedAt?: string;
  // Legal & Compliance
  termsAccepted: boolean;
  originalWorkConfirmed: boolean;
  licenseDeclaration: "own" | "third-party";
  thirdPartyLicenseInfo?: string;
  // Support
  supportEmail?: string;
  supportDuration?: string;
  // Documentation
  documentationUrl?: string;
  // Compatibility
  compatibility?: string[];
  // File Security
  fileSize: number; // in bytes
  fileType: string;
  virusScanStatus?: "pending" | "clean" | "infected";
}

export interface ItemCreateInput {
  userId: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  microcategory?: string;
  price: number;
  demoUrl: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
  fileUrl: string;
  tags: string[];
  version?: string;
  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  schemaJson?: string;
  // License
  licenseType?: LicenseType;
  extendedPrice?: number;
  licenseKeyRequired?: boolean;
  // Preview
  videoPreviewUrl?: string;
  // Support
  supportEmail?: string;
  supportDuration?: string;
  // Documentation
  documentationUrl?: string;
  // Compatibility
  compatibility?: string[];
  // File Security
  fileSize: number;
  fileType: string;
  // Legal
  termsAccepted: boolean;
  originalWorkConfirmed: boolean;
  licenseDeclaration: "own" | "third-party";
  thirdPartyLicenseInfo?: string;
}

export interface ItemUpdateInput {
  title?: string;
  description?: string;
  category?: string;
  subcategory?: string;
  microcategory?: string;
  price?: number;
  demoUrl?: string;
  thumbnailUrl?: string;
  galleryUrls?: string[];
  fileUrl?: string;
  tags?: string[];
  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  schemaJson?: string;
  // License
  licenseType?: LicenseType;
  extendedPrice?: number;
  licenseKeyRequired?: boolean;
  // Preview
  videoPreviewUrl?: string;
  // Support
  supportEmail?: string;
  supportDuration?: string;
  // Documentation
  documentationUrl?: string;
  // Compatibility
  compatibility?: string[];
  // File Security
  fileSize?: number;
  fileType?: string;
}

// ============================================
// TABLE: item_versions
// ============================================

export interface ItemVersionEntity {
  id: string;
  itemId: string;
  version: string;
  fileUrl: string;
  changelog: string;
  createdAt: string;
}

export interface ItemVersionCreateInput {
  itemId: string;
  version: string;
  fileUrl: string;
  changelog: string;
}

// ============================================
// TABLE: item_reviews (admin review)
// ============================================

export interface ItemReviewEntity {
  id: string;
  itemId: string;
  status: "pending" | "approved" | "rejected" | "soft_rejected";
  note?: string;
  reviewedBy?: string; // Admin ID
  reviewedAt?: string;
  createdAt: string;
}

// ============================================
// TABLE: user_reviews (customer reviews)
// ============================================

export interface UserReviewEntity {
  id: string;
  itemId: string;
  userId: string; // Buyer ID
  rating: number; // 1-5 stars
  comment: string;
  authorReply?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// TABLE: dmca_reports
// ============================================

export interface DmcaReportEntity {
  id: string;
  itemId: string;
  reportedBy: string;
  reason: string;
  description: string;
  status: "pending" | "investigating" | "resolved" | "dismissed";
  action?: "none" | "remove" | "suspend";
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

// ============================================
// TABLE: violations
// ============================================

export interface ViolationEntity {
  id: string;
  userId: string;
  itemId?: string;
  type: ViolationType;
  reason: string;
  strikeCount: number;
  createdAt: string;
  expiresAt?: string;
}

// ============================================
// TABLE: audit_logs
// ============================================

export interface AuditLogEntity {
  id: string;
  userId: string;
  itemId?: string;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============================================
// SQL SCHEMA (for reference)
// ============================================

export const SQL_SCHEMA = `
-- Create items table
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100) NOT NULL,
  microcategory VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  demo_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  gallery_urls JSONB,
  file_url VARCHAR(500) NOT NULL,
  tags TEXT[] NOT NULL,
  version VARCHAR(50) DEFAULT '1.0.0',
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'soft_rejected')),
  rejection_reason TEXT,
  sales INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMP,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  -- SEO Fields
  slug VARCHAR(255) UNIQUE NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  og_image_url VARCHAR(500),
  schema_json JSONB,
  -- License System
  license_type VARCHAR(20) NOT NULL DEFAULT 'regular' CHECK (license_type IN ('regular', 'extended')),
  extended_price DECIMAL(10, 2),
  -- Download System
  download_count INTEGER DEFAULT 0,
  license_key_required BOOLEAN DEFAULT false,
  -- Preview System
  video_preview_url VARCHAR(500),
  -- Analytics
  conversion_rate DECIMAL(5, 2) DEFAULT 0,
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMP,
  -- Legal & Compliance
  terms_accepted BOOLEAN DEFAULT false,
  original_work_confirmed BOOLEAN DEFAULT false,
  license_declaration VARCHAR(20) NOT NULL DEFAULT 'own' CHECK (license_declaration IN ('own', 'third-party')),
  third_party_license_info TEXT,
  -- Support
  support_email VARCHAR(255),
  support_duration VARCHAR(100),
  -- Documentation
  documentation_url VARCHAR(500),
  -- Compatibility
  compatibility TEXT[],
  -- File Security
  file_size BIGINT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  virus_scan_status VARCHAR(20) CHECK (virus_scan_status IN ('pending', 'clean', 'infected'))
);

-- Create item_versions table
CREATE TABLE IF NOT EXISTS item_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  changelog TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create item_reviews table (admin review)
CREATE TABLE IF NOT EXISTS item_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'soft_rejected')),
  note TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create user_reviews table (customer reviews)
CREATE TABLE IF NOT EXISTS user_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  author_reply TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create dmca_reports table
CREATE TABLE IF NOT EXISTS dmca_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  action VARCHAR(20) CHECK (action IN ('none', 'remove', 'suspend')),
  resolved_by UUID,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create violations table
CREATE TABLE IF NOT EXISTS violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('warning', 'suspension', 'ban')),
  reason TEXT NOT NULL,
  strike_count INTEGER DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('upload', 'update', 'delete', 'approve', 'reject', 'submit')),
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_slug ON items(slug);
CREATE INDEX IF NOT EXISTS idx_items_is_deleted ON items(is_deleted);
CREATE INDEX IF NOT EXISTS idx_item_versions_item_id ON item_versions(item_id);
CREATE INDEX IF NOT EXISTS idx_item_reviews_item_id ON item_reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_item_id ON user_reviews(item_id);
CREATE INDEX IF NOT EXISTS idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_dmca_reports_item_id ON dmca_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON violations(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_item_id ON audit_logs(item_id);
`;
