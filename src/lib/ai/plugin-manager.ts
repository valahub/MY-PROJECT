// AI Plugin Manager
// Enable/Disable APIs, priority control, group by type

export interface AIPlugin {
  id: string;
  name: string;
  type: 'llm' | 'image' | 'audio' | 'translation' | 'analysis';
  provider: string;
  enabled: boolean;
  priority: number;
  config: Record<string, any>;
}

export class AIPluginManager {
  private plugins: Map<string, AIPlugin> = new Map();

  registerPlugin(plugin: Omit<AIPlugin, 'id'>): string {
    const id = this.generateId();
    const newPlugin: AIPlugin = {
      ...plugin,
      id,
    };

    this.plugins.set(id, newPlugin);
    return id;
  }

  enablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.enabled = true;
    return true;
  }

  disablePlugin(id: string): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.enabled = false;
    return true;
  }

  setPriority(id: string, priority: number): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.priority = priority;
    return true;
  }

  getPlugin(id: string): AIPlugin | undefined {
    return this.plugins.get(id);
  }

  getPluginsByType(type: AIPlugin['type']): AIPlugin[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.type === type && p.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  getEnabledPlugins(): AIPlugin[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  updateConfig(id: string, config: Partial<Record<string, any>>): boolean {
    const plugin = this.plugins.get(id);
    if (!plugin) return false;

    plugin.config = { ...plugin.config, ...config };
    return true;
  }

  removePlugin(id: string): boolean {
    return this.plugins.delete(id);
  }

  private generateId(): string {
    return `plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiPluginManager = new AIPluginManager();
