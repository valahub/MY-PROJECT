// Author Items API Service
// Backend API endpoints for marketplace author item management with Paddle RBAC integration

import { paddleRBACManager } from "@/lib/paddle-rbac";
import type {
  ItemEntity,
  ItemCreateInput,
  ItemUpdateInput,
  ItemVersionEntity,
  ItemVersionCreateInput,
  ItemReviewEntity,
  UserReviewEntity,
  DmcaReportEntity,
  ViolationEntity,
  AuditLogEntity,
  ItemStatus,
  AuditAction,
} from "./author-items-schema";

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

const items: Map<string, ItemEntity> = new Map();
const itemVersions: Map<string, ItemVersionEntity> = new Map();
const itemReviews: Map<string, ItemReviewEntity> = new Map();
const userReviews: Map<string, UserReviewEntity> = new Map();
const dmcaReports: Map<string, DmcaReportEntity> = new Map();
const violations: Map<string, ViolationEntity> = new Map();
const auditLogs: Map<string, AuditLogEntity> = new Map();

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

// Validate file type (ZIP only)
function validateFileType(fileType: string): boolean {
  const allowedTypes = ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'];
  return allowedTypes.includes(fileType) || fileType.endsWith('.zip');
}

// Validate file size (max 500MB)
function validateFileSize(fileSize: number): boolean {
  const maxSize = 500 * 1024 * 1024; // 500MB
  return fileSize <= maxSize;
}

// Log audit action
function logAudit(
  userId: string,
  action: AuditAction,
  itemId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): void {
  const log: AuditLogEntity = {
    id: `audit-${Date.now()}`,
    userId,
    itemId,
    action,
    metadata,
    ipAddress,
    userAgent,
    createdAt: new Date().toISOString(),
  };
  auditLogs.set(log.id, log);
}

// ============================================
// AUTHOR ITEMS API SERVICE
// ============================================

export class AuthorItemsApiService {
  // ============================================
  // ITEM CRUD
  // ============================================

  async createItem(input: ItemCreateInput): Promise<ApiResponse<ItemEntity>> {
    try {
      // Paddle RBAC Permission Check
      const hasPermission = paddleRBACManager.hasPermission(input.userId, "marketplace.product.write", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: marketplace.product.write required" };
      }

      // File validation
      if (!validateFileType(input.fileType)) {
        return { success: false, error: "Invalid file type. Only ZIP files are allowed." };
      }
      if (!validateFileSize(input.fileSize)) {
        return { success: false, error: "File size exceeds 500MB limit." };
      }

      // Legal validation
      if (!input.termsAccepted || !input.originalWorkConfirmed) {
        return { success: false, error: "You must accept terms and confirm original work." };
      }

      const id = `item-${Date.now()}`;
      const slug = input.slug || generateSlug(input.title);
      const item: ItemEntity = {
        id,
        userId: input.userId,
        title: input.title,
        description: input.description,
        category: input.category,
        subcategory: input.subcategory,
        microcategory: input.microcategory,
        price: input.price,
        demoUrl: input.demoUrl,
        thumbnailUrl: input.thumbnailUrl,
        galleryUrls: input.galleryUrls,
        fileUrl: input.fileUrl,
        tags: input.tags,
        version: input.version || "1.0.0",
        status: "draft",
        rejectionReason: undefined,
        sales: 0,
        views: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        submittedAt: undefined,
        approvedAt: undefined,
        rejectedAt: undefined,
        // SEO Fields
        slug,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        ogImageUrl: input.ogImageUrl,
        schemaJson: input.schemaJson,
        // License System
        licenseType: input.licenseType || "regular",
        extendedPrice: input.extendedPrice,
        // Download System
        downloadCount: 0,
        licenseKeyRequired: input.licenseKeyRequired || false,
        // Preview System
        videoPreviewUrl: input.videoPreviewUrl,
        // Analytics
        conversionRate: 0,
        // Soft Delete
        isDeleted: false,
        deletedAt: undefined,
        // Legal & Compliance
        termsAccepted: input.termsAccepted,
        originalWorkConfirmed: input.originalWorkConfirmed,
        licenseDeclaration: input.licenseDeclaration,
        thirdPartyLicenseInfo: input.thirdPartyLicenseInfo,
        // Support
        supportEmail: input.supportEmail,
        supportDuration: input.supportDuration,
        // Documentation
        documentationUrl: input.documentationUrl,
        // Compatibility
        compatibility: input.compatibility,
        // File Security
        fileSize: input.fileSize,
        fileType: input.fileType,
        virusScanStatus: "pending",
      };

      items.set(id, item);

      // Create initial version
      const versionId = `version-${Date.now()}`;
      const version: ItemVersionEntity = {
        id: versionId,
        itemId: id,
        version: item.version,
        fileUrl: input.fileUrl,
        changelog: "Initial release",
        createdAt: new Date().toISOString(),
      };
      itemVersions.set(versionId, version);

      // Log audit
      logAudit(input.userId, "upload", id, { title: item.title, category: item.category });

      return { success: true, data: item, message: "Item created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create item" };
    }
  }

  async updateItem(itemId: string, input: ItemUpdateInput): Promise<ApiResponse<ItemEntity>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.status === "approved" || item.status === "pending") {
        return { success: false, error: "Cannot update item in current status" };
      }

      if (input.title !== undefined) item.title = input.title;
      if (input.description !== undefined) item.description = input.description;
      if (input.category !== undefined) item.category = input.category;
      if (input.subcategory !== undefined) item.subcategory = input.subcategory;
      if (input.microcategory !== undefined) item.microcategory = input.microcategory;
      if (input.price !== undefined) item.price = input.price;
      if (input.demoUrl !== undefined) item.demoUrl = input.demoUrl;
      if (input.thumbnailUrl !== undefined) item.thumbnailUrl = input.thumbnailUrl;
      if (input.galleryUrls !== undefined) item.galleryUrls = input.galleryUrls;
      if (input.fileUrl !== undefined) item.fileUrl = input.fileUrl;
      if (input.tags !== undefined) item.tags = input.tags;
      // SEO
      if (input.slug !== undefined) item.slug = input.slug;
      if (input.metaTitle !== undefined) item.metaTitle = input.metaTitle;
      if (input.metaDescription !== undefined) item.metaDescription = input.metaDescription;
      if (input.ogImageUrl !== undefined) item.ogImageUrl = input.ogImageUrl;
      if (input.schemaJson !== undefined) item.schemaJson = input.schemaJson;
      // License
      if (input.licenseType !== undefined) item.licenseType = input.licenseType;
      if (input.extendedPrice !== undefined) item.extendedPrice = input.extendedPrice;
      if (input.licenseKeyRequired !== undefined) item.licenseKeyRequired = input.licenseKeyRequired;
      // Preview
      if (input.videoPreviewUrl !== undefined) item.videoPreviewUrl = input.videoPreviewUrl;
      // Support
      if (input.supportEmail !== undefined) item.supportEmail = input.supportEmail;
      if (input.supportDuration !== undefined) item.supportDuration = input.supportDuration;
      // Documentation
      if (input.documentationUrl !== undefined) item.documentationUrl = input.documentationUrl;
      // Compatibility
      if (input.compatibility !== undefined) item.compatibility = input.compatibility;
      // File Security
      if (input.fileSize !== undefined) item.fileSize = input.fileSize;
      if (input.fileType !== undefined) item.fileType = input.fileType;

      item.updatedAt = new Date().toISOString();
      items.set(itemId, item);

      // Log audit
      logAudit(item.userId, "update", itemId, { changes: Object.keys(input) });

      return { success: true, data: item, message: "Item updated successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to update item" };
    }
  }

  async getMyItems(userId: string): Promise<ApiResponse<ItemEntity[]>> {
    try {
      const userItems = Array.from(items.values()).filter(item => item.userId === userId);
      return { success: true, data: userItems };
    } catch (error) {
      return { success: false, error: "Failed to fetch items" };
    }
  }

  async getItem(itemId: string): Promise<ApiResponse<ItemEntity>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }
      return { success: true, data: item };
    } catch (error) {
      return { success: false, error: "Failed to fetch item" };
    }
  }

  async deleteItem(itemId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.userId !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      if (item.status === "approved") {
        // Soft delete approved items
        item.isDeleted = true;
        item.deletedAt = new Date().toISOString();
        item.updatedAt = new Date().toISOString();
        items.set(itemId, item);
        logAudit(userId, "delete", itemId, { softDelete: true });
        return { success: true, message: "Item soft deleted successfully" };
      }

      // Hard delete draft/rejected items
      items.delete(itemId);

      // Delete associated versions and reviews
      const versionKeys: string[] = [];
      for (const [key, version] of itemVersions.entries()) {
        if (version.itemId === itemId) {
          versionKeys.push(key);
        }
      }
      versionKeys.forEach(key => itemVersions.delete(key));

      const reviewKeys: string[] = [];
      for (const [key, review] of itemReviews.entries()) {
        if (review.itemId === itemId) {
          reviewKeys.push(key);
        }
      }
      reviewKeys.forEach(key => itemReviews.delete(key));

      logAudit(userId, "delete", itemId, { softDelete: false });

      return { success: true, message: "Item deleted successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to delete item" };
    }
  }

  // ============================================
  // SUBMIT FOR APPROVAL
  // ============================================

  async submitItem(itemId: string, userId: string): Promise<ApiResponse<ItemEntity>> {
    try {
      // Paddle RBAC Permission Check
      const hasPermission = paddleRBACManager.hasPermission(userId, "marketplace.product.publish", "write");
      if (!hasPermission) {
        return { success: false, error: "Permission denied: marketplace.product.publish required" };
      }

      // Plan Gate Check
      const user = paddleRBACManager["users"].get(userId);
      if (user && !user.planActive) {
        return { success: false, error: "Active plan required to submit items" };
      }

      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.userId !== userId) {
        return { success: false, error: "Unauthorized" };
      }

      if (item.status !== "draft") {
        return { success: false, error: "Item must be in draft status to submit" };
      }

      // Validation
      if (!item.demoUrl || !item.fileUrl) {
        return { success: false, error: "Demo URL and file are required" };
      }

      item.status = "pending";
      item.submittedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      items.set(itemId, item);

      // Create review entry
      const reviewId = `review-${Date.now()}`;
      const review: ItemReviewEntity = {
        id: reviewId,
        itemId,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      itemReviews.set(reviewId, review);

      // Log audit
      logAudit(userId, "submit", itemId, { title: item.title });

      return { success: true, data: item, message: "Item submitted for approval" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to submit item" };
    }
  }

  // ============================================
  // VERSION MANAGEMENT
  // ============================================

  async createVersion(input: ItemVersionCreateInput): Promise<ApiResponse<ItemVersionEntity>> {
    try {
      const item = items.get(input.itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.status !== "approved") {
        return { success: false, error: "Can only create versions for approved items" };
      }

      const versionId = `version-${Date.now()}`;
      const version: ItemVersionEntity = {
        id: versionId,
        itemId: input.itemId,
        version: input.version,
        fileUrl: input.fileUrl,
        changelog: input.changelog,
        createdAt: new Date().toISOString(),
      };
      itemVersions.set(versionId, version);

      // Update item version
      item.version = input.version;
      item.updatedAt = new Date().toISOString();
      items.set(input.itemId, item);

      return { success: true, data: version, message: "Version created successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to create version" };
    }
  }

  async getItemVersions(itemId: string): Promise<ApiResponse<ItemVersionEntity[]>> {
    try {
      const versions = Array.from(itemVersions.values()).filter(v => v.itemId === itemId);
      return { success: true, data: versions };
    } catch (error) {
      return { success: false, error: "Failed to fetch versions" };
    }
  }

  // ============================================
  // STATUS MANAGEMENT (Admin)
  // ============================================

  async approveItem(itemId: string, adminId: string): Promise<ApiResponse<ItemEntity>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.status !== "pending") {
        return { success: false, error: "Item must be in pending status" };
      }

      item.status = "approved";
      item.approvedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      items.set(itemId, item);

      // Update review
      const review = Array.from(itemReviews.values()).find(r => r.itemId === itemId && r.status === "pending");
      if (review) {
        review.status = "approved";
        review.reviewedBy = adminId;
        review.reviewedAt = new Date().toISOString();
        itemReviews.set(review.id, review);
      }

      // Log audit
      logAudit(adminId, "approve", itemId, { title: item.title });

      return { success: true, data: item, message: "Item approved" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to approve item" };
    }
  }

  async rejectItem(itemId: string, reason: string, adminId: string): Promise<ApiResponse<ItemEntity>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.status !== "pending") {
        return { success: false, error: "Item must be in pending status" };
      }

      item.status = "rejected";
      item.rejectionReason = reason;
      item.rejectedAt = new Date().toISOString();
      item.updatedAt = new Date().toISOString();
      items.set(itemId, item);

      // Update review
      const review = Array.from(itemReviews.values()).find(r => r.itemId === itemId && r.status === "pending");
      if (review) {
        review.status = "rejected";
        review.note = reason;
        review.reviewedBy = adminId;
        review.reviewedAt = new Date().toISOString();
        itemReviews.set(review.id, review);
      }

      // Log audit
      logAudit(adminId, "reject", itemId, { title: item.title, reason });

      return { success: true, data: item, message: "Item rejected" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to reject item" };
    }
  }

  // ============================================
  // USER REVIEWS (Customer Reviews)
  // ============================================

  async addUserReview(
    itemId: string,
    userId: string,
    rating: number,
    comment: string
  ): Promise<ApiResponse<UserReviewEntity>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      if (item.status !== "approved") {
        return { success: false, error: "Can only review approved items" };
      }

      if (rating < 1 || rating > 5) {
        return { success: false, error: "Rating must be between 1 and 5" };
      }

      const reviewId = `user-review-${Date.now()}`;
      const review: UserReviewEntity = {
        id: reviewId,
        itemId,
        userId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      userReviews.set(reviewId, review);

      // Update item rating
      const itemReviewsList = Array.from(userReviews.values()).filter(r => r.itemId === itemId);
      const avgRating = itemReviewsList.reduce((sum, r) => sum + r.rating, 0) / itemReviewsList.length;
      item.rating = Math.round(avgRating * 100) / 100;
      item.reviewCount = itemReviewsList.length;
      items.set(itemId, item);

      return { success: true, data: review, message: "Review added successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to add review" };
    }
  }

  async replyToReview(reviewId: string, authorId: string, reply: string): Promise<ApiResponse<UserReviewEntity>> {
    try {
      const review = userReviews.get(reviewId);
      if (!review) {
        return { success: false, error: "Review not found" };
      }

      const item = items.get(review.itemId);
      if (!item || item.userId !== authorId) {
        return { success: false, error: "Unauthorized" };
      }

      review.authorReply = reply;
      review.updatedAt = new Date().toISOString();
      userReviews.set(reviewId, review);

      return { success: true, data: review, message: "Reply added successfully" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to add reply" };
    }
  }

  async getItemUserReviews(itemId: string): Promise<ApiResponse<UserReviewEntity[]>> {
    try {
      const reviews = Array.from(userReviews.values()).filter(r => r.itemId === itemId);
      return { success: true, data: reviews };
    } catch (error) {
      return { success: false, error: "Failed to fetch reviews" };
    }
  }

  // ============================================
  // DMCA REPORTS
  // ============================================

  async createDmcaReport(
    itemId: string,
    reportedBy: string,
    reason: string,
    description: string
  ): Promise<ApiResponse<DmcaReportEntity>> {
    try {
      const reportId = `dmca-${Date.now()}`;
      const report: DmcaReportEntity = {
        id: reportId,
        itemId,
        reportedBy,
        reason,
        description,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      dmcaReports.set(reportId, report);

      return { success: true, data: report, message: "DMCA report submitted" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to submit report" };
    }
  }

  async resolveDmcaReport(
    reportId: string,
    adminId: string,
    action: "none" | "remove" | "suspend"
  ): Promise<ApiResponse<DmcaReportEntity>> {
    try {
      const report = dmcaReports.get(reportId);
      if (!report) {
        return { success: false, error: "Report not found" };
      }

      report.status = "resolved";
      report.action = action;
      report.resolvedBy = adminId;
      report.resolvedAt = new Date().toISOString();
      dmcaReports.set(reportId, report);

      // If action is remove or suspend, handle item
      if (action === "remove" || action === "suspend") {
        const item = items.get(report.itemId);
        if (item) {
          if (action === "remove") {
            item.isDeleted = true;
            item.deletedAt = new Date().toISOString();
          }
          items.set(report.itemId, item);
        }
      }

      return { success: true, data: report, message: "DMCA report resolved" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to resolve report" };
    }
  }

  // ============================================
  // VIOLATIONS
  // ============================================

  async createViolation(
    userId: string,
    itemId: string | undefined,
    type: "warning" | "suspension" | "ban",
    reason: string
  ): Promise<ApiResponse<ViolationEntity>> {
    try {
      const violationId = `violation-${Date.now()}`;
      const violation: ViolationEntity = {
        id: violationId,
        userId,
        itemId,
        type,
        reason,
        strikeCount: 1,
        createdAt: new Date().toISOString(),
      };
      violations.set(violationId, violation);

      return { success: true, data: violation, message: "Violation recorded" };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Failed to record violation" };
    }
  }

  async getUserViolations(userId: string): Promise<ApiResponse<ViolationEntity[]>> {
    try {
      const userViolations = Array.from(violations.values()).filter(v => v.userId === userId);
      return { success: true, data: userViolations };
    } catch (error) {
      return { success: false, error: "Failed to fetch violations" };
    }
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  async getAuditLogs(userId?: string, itemId?: string): Promise<ApiResponse<AuditLogEntity[]>> {
    try {
      let logs = Array.from(auditLogs.values());
      if (userId) logs = logs.filter(l => l.userId === userId);
      if (itemId) logs = logs.filter(l => l.itemId === itemId);
      return { success: true, data: logs };
    } catch (error) {
      return { success: false, error: "Failed to fetch audit logs" };
    }
  }

  // ============================================
  // RELATED ITEMS
  // ============================================

  async getRelatedItems(itemId: string, limit: number = 5): Promise<ApiResponse<ItemEntity[]>> {
    try {
      const item = items.get(itemId);
      if (!item) {
        return { success: false, error: "Item not found" };
      }

      const related = Array.from(items.values())
        .filter(i => i.id !== itemId && i.category === item.category && i.status === "approved" && !i.isDeleted)
        .slice(0, limit);

      return { success: true, data: related };
    } catch (error) {
      return { success: false, error: "Failed to fetch related items" };
    }
  }

  // ============================================
  // GET BY SLUG
  // ============================================

  async getItemBySlug(slug: string): Promise<ApiResponse<ItemEntity>> {
    try {
      const item = Array.from(items.values()).find(i => i.slug === slug && !i.isDeleted);
      if (!item) {
        return { success: false, error: "Item not found" };
      }
      return { success: true, data: item };
    } catch (error) {
      return { success: false, error: "Failed to fetch item" };
    }
  }
}

// Export singleton instance
export const authorItemsApiService = new AuthorItemsApiService();
