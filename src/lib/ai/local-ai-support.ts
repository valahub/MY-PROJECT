// Local AI Support
// Add optional Ollama and Local LLM support for when API fails

export interface LocalAIConfig {
  id: string;
  type: 'ollama' | 'local-llm';
  endpoint: string;
  model: string;
  enabled: boolean;
}

export class LocalAISupport {
  private configs: Map<string, LocalAIConfig> = new Map();

  registerConfig(config: Omit<LocalAIConfig, 'id'>): string {
    const id = this.generateId();
    const newConfig: LocalAIConfig = {
      ...config,
      id,
    };

    this.configs.set(id, newConfig);
    return id;
  }

  enableLocalAI(id: string): boolean {
    const config = this.configs.get(id);
    if (!config) return false;

    config.enabled = true;
    return true;
  }

  disableLocalAI(id: string): boolean {
    const config = this.configs.get(id);
    if (!config) return false;

    config.enabled = false;
    return true;
  }

  async executeLocalAI(id: string, prompt: string): Promise<string> {
    const config = this.configs.get(id);
    if (!config || !config.enabled) {
      throw new Error('Local AI not available');
    }

    if (config.type === 'ollama') {
      return this.executeOllama(config, prompt);
    } else if (config.type === 'local-llm') {
      return this.executeLocalLLM(config, prompt);
    }

    throw new Error('Unknown local AI type');
  }

  private async executeOllama(config: LocalAIConfig, prompt: string): Promise<string> {
    // In production, actual HTTP call to Ollama endpoint
    console.log(`[LocalAI] Executing Ollama: ${config.model} at ${config.endpoint}`);
    return 'Local AI response from Ollama';
  }

  private async executeLocalLLM(config: LocalAIConfig, prompt: string): Promise<string> {
    // In production, actual call to local LLM
    console.log(`[LocalAI] Executing Local LLM: ${config.model} at ${config.endpoint}`);
    return 'Local AI response from Local LLM';
  }

  isAvailable(id: string): boolean {
    const config = this.configs.get(id);
    return config?.enabled ?? false;
  }

  getAvailableConfigs(): LocalAIConfig[] {
    return Array.from(this.configs.values()).filter((c) => c.enabled);
  }

  private generateId(): string {
    return `local-ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const localAISupport = new LocalAISupport();
