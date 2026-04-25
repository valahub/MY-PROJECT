// Version Control for AI Output
// Store versions of generated content with rollback option

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  content: string;
  metadata: {
    provider: string;
    model?: string;
    prompt: string;
    timestamp: number;
    userId?: string;
  };
  isCurrent: boolean;
}

export class AIVersionControl {
  private versions: Map<string, ContentVersion[]> = new Map();

  saveVersion(
    contentId: string,
    content: string,
    provider: string,
    prompt: string,
    userId?: string
  ): string {
    const existingVersions = this.versions.get(contentId) || [];
    const nextVersion = existingVersions.length + 1;

    // Mark previous versions as not current
    existingVersions.forEach((v) => (v.isCurrent = false));

    const newVersion: ContentVersion = {
      id: this.generateId(),
      contentId,
      version: nextVersion,
      content,
      metadata: {
        provider,
        prompt,
        timestamp: Date.now(),
        userId,
      },
      isCurrent: true,
    };

    existingVersions.push(newVersion);
    this.versions.set(contentId, existingVersions);

    return newVersion.id;
  }

  getVersion(contentId: string, version: number): ContentVersion | undefined {
    const versions = this.versions.get(contentId);
    return versions?.find((v) => v.version === version);
  }

  getCurrentVersion(contentId: string): ContentVersion | undefined {
    const versions = this.versions.get(contentId);
    return versions?.find((v) => v.isCurrent);
  }

  getAllVersions(contentId: string): ContentVersion[] {
    return this.versions.get(contentId) || [];
  }

  rollbackToVersion(contentId: string, version: number): boolean {
    const versions = this.versions.get(contentId);
    if (!versions) return false;

    const targetVersion = versions.find((v) => v.version === version);
    if (!targetVersion) return false;

    // Mark all versions as not current
    versions.forEach((v) => (v.isCurrent = false));

    // Mark target version as current
    targetVersion.isCurrent = true;

    return true;
  }

  deleteVersion(contentId: string, version: number): boolean {
    const versions = this.versions.get(contentId);
    if (!versions) return false;

    const index = versions.findIndex((v) => v.version === version);
    if (index === -1) return false;

    // Don't delete current version
    if (versions[index].isCurrent) return false;

    versions.splice(index, 1);
    return true;
  }

  deleteAllVersions(contentId: string): boolean {
    return this.versions.delete(contentId);
  }

  private generateId(): string {
    return `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiVersionControl = new AIVersionControl();
