// Prompt Management System
// Store, version, and manage AI prompts

export interface PromptTemplate {
  id: string;
  name: string;
  module: string;
  template: string;
  variables: string[];
  version: number;
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

export interface PromptExecution {
  id: string;
  templateId: string;
  variables: Record<string, string>;
  renderedPrompt: string;
  timestamp: number;
  userId?: string;
}

export class PromptManager {
  private templates: Map<string, PromptTemplate> = new Map();
  private executions: PromptExecution[] = [];

  registerTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId();
    const now = Date.now();

    const newTemplate: PromptTemplate = {
      ...template,
      id,
      createdAt: now,
      updatedAt: now,
    };

    this.templates.set(id, newTemplate);
    return id;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  getActiveTemplate(module: string): PromptTemplate | undefined {
    for (const template of this.templates.values()) {
      if (template.module === module && template.active) {
        return template;
      }
    }
    return undefined;
  }

  updateTemplate(id: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    const updated: PromptTemplate = {
      ...template,
      ...updates,
      version: template.version + 1,
      updatedAt: Date.now(),
    };

    this.templates.set(id, updated);
    return true;
  }

  deactivateTemplate(id: string): boolean {
    return this.updateTemplate(id, { active: false });
  }

  renderPrompt(templateId: string, variables: Record<string, string>): string {
    const template = this.templates.get(templateId);
    if (!template) throw new Error('Template not found');

    let rendered = template.template;

    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    return rendered;
  }

  executePrompt(templateId: string, variables: Record<string, string>, userId?: string): PromptExecution {
    const rendered = this.renderPrompt(templateId, variables);
    const execution: PromptExecution = {
      id: this.generateId(),
      templateId,
      variables,
      renderedPrompt: rendered,
      timestamp: Date.now(),
      userId,
    };

    this.executions.push(execution);
    return execution;
  }

  getExecutions(templateId?: string): PromptExecution[] {
    if (templateId) {
      return this.executions.filter((e) => e.templateId === templateId);
    }
    return this.executions;
  }

  private generateId(): string {
    return `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const promptManager = new PromptManager();
