// Blog Extension Support
// Plug-and-play system for SEO tools, analytics tools, and keyword APIs

export interface BlogExtension {
  id: string;
  name: string;
  type: 'seo' | 'analytics' | 'keyword' | 'translation' | 'content';
  enabled: boolean;
  config: Record<string, any>;
  execute?: (data: any) => Promise<any>;
}

export class BlogExtensionSupport {
  private extensions: Map<string, BlogExtension> = new Map();

  registerExtension(extension: BlogExtension): string {
    this.extensions.set(extension.id, extension);
    return extension.id;
  }

  unregisterExtension(extensionId: string): boolean {
    return this.extensions.delete(extensionId);
  }

  enableExtension(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.enabled = true;
      return true;
    }
    return false;
  }

  disableExtension(extensionId: string): boolean {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.enabled = false;
      return true;
    }
    return false;
  }

  getExtension(extensionId: string): BlogExtension | undefined {
    return this.extensions.get(extensionId);
  }

  getExtensionsByType(type: BlogExtension['type']): BlogExtension[] {
    return Array.from(this.extensions.values()).filter((e) => e.type === type && e.enabled);
  }

  async executeExtension(extensionId: string, data: any): Promise<any> {
    const extension = this.extensions.get(extensionId);
    if (!extension || !extension.enabled || !extension.execute) {
      throw new Error(`Extension ${extensionId} not available or not executable`);
    }

    return extension.execute(data);
  }

  updateExtensionConfig(extensionId: string, config: Record<string, any>): boolean {
    const extension = this.extensions.get(extensionId);
    if (extension) {
      extension.config = { ...extension.config, ...config };
      return true;
    }
    return false;
  }

  getAllExtensions(): BlogExtension[] {
    return Array.from(this.extensions.values());
  }
}

// Export singleton instance
export const blogExtensionSupport = new BlogExtensionSupport();
