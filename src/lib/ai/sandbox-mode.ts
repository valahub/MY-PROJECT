// Test Mode / Sandbox
// Test APIs without affecting production

export interface SandboxConfig {
  id: string;
  name: string;
  mockResponses: Map<string, any>;
  enabled: boolean;
  recordRequests: boolean;
  recordedRequests: Array<{
    input: any;
    output: any;
    timestamp: number;
  }>;
}

export class AISandboxMode {
  private configs: Map<string, SandboxConfig> = new Map();
  private isActive: boolean = false;

  enableSandbox() {
    this.isActive = true;
  }

  disableSandbox() {
    this.isActive = false;
  }

  isSandboxActive(): boolean {
    return this.isActive;
  }

  createSandbox(name: string): string {
    const id = this.generateId();
    const config: SandboxConfig = {
      id,
      name,
      mockResponses: new Map(),
      enabled: true,
      recordRequests: false,
      recordedRequests: [],
    };

    this.configs.set(id, config);
    return id;
  }

  setMockResponse(sandboxId: string, key: string, response: any): boolean {
    const config = this.configs.get(sandboxId);
    if (!config) return false;

    config.mockResponses.set(key, response);
    return true;
  }

  getMockResponse(sandboxId: string, key: string): any | undefined {
    const config = this.configs.get(sandboxId);
    return config?.mockResponses.get(key);
  }

  enableRecording(sandboxId: string): boolean {
    const config = this.configs.get(sandboxId);
    if (!config) return false;

    config.recordRequests = true;
    return true;
  }

  disableRecording(sandboxId: string): boolean {
    const config = this.configs.get(sandboxId);
    if (!config) return false;

    config.recordRequests = false;
    return true;
  }

  recordRequest(sandboxId: string, input: any, output: any) {
    const config = this.configs.get(sandboxId);
    if (!config || !config.recordRequests) return;

    config.recordedRequests.push({
      input,
      output,
      timestamp: Date.now(),
    });
  }

  getRecordedRequests(sandboxId: string): Array<{
    input: any;
    output: any;
    timestamp: number;
  }> {
    const config = this.configs.get(sandboxId);
    return config?.recordedRequests || [];
  }

  clearRecordedRequests(sandboxId: string): boolean {
    const config = this.configs.get(sandboxId);
    if (!config) return false;

    config.recordedRequests = [];
    return true;
  }

  deleteSandbox(sandboxId: string): boolean {
    return this.configs.delete(sandboxId);
  }

  private generateId(): string {
    return `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiSandboxMode = new AISandboxMode();
