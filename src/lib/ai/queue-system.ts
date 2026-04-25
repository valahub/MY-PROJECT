// AI Queue System
// Background processing for heavy AI tasks to prevent UI blocking

export interface QueueTask {
  id: string;
  type: string;
  payload: any;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: any;
  error?: string;
  retries: number;
  maxRetries: number;
}

export class AIQueueSystem {
  private queue: QueueTask[] = [];
  private processing: boolean = false;
  private maxConcurrent: number = 3;
  private currentProcessing: number = 0;

  addTask(task: Omit<QueueTask, 'id' | 'status' | 'createdAt' | 'retries'>): string {
    const newTask: QueueTask = {
      ...task,
      id: this.generateId(),
      status: 'pending',
      createdAt: Date.now(),
      retries: 0,
    };

    this.queue.push(newTask);
    this.sortQueue();
    this.processQueue();

    return newTask.id;
  }

  private sortQueue() {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    this.queue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt - b.createdAt;
    });
  }

  private async processQueue() {
    if (this.processing || this.currentProcessing >= this.maxConcurrent) return;

    this.processing = true;

    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const task = this.queue.find((t) => t.status === 'pending');
      if (!task) break;

      this.currentProcessing++;
      task.status = 'processing';
      task.startedAt = Date.now();

      this.executeTask(task).finally(() => {
        this.currentProcessing--;
        this.processQueue();
      });
    }

    this.processing = false;
  }

  private async executeTask(task: QueueTask) {
    try {
      // In production, this would call the actual AI handler
      const result = await this.processTaskType(task.type, task.payload);

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;
    } catch (error) {
      task.retries++;

      if (task.retries < task.maxRetries) {
        task.status = 'pending';
        setTimeout(() => this.processQueue(), 1000 * Math.pow(2, task.retries));
      } else {
        task.status = 'failed';
        task.completedAt = Date.now();
        task.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  private async processTaskType(type: string, payload: any): Promise<any> {
    // In production, route to appropriate AI handler
    return Promise.resolve({ success: true });
  }

  getTask(id: string): QueueTask | undefined {
    return this.queue.find((t) => t.id === id);
  }

  getTasks(filter?: { status?: QueueTask['status']; type?: string }): QueueTask[] {
    let filtered = this.queue;

    if (filter?.status) {
      filtered = filtered.filter((t) => t.status === filter.status);
    }
    if (filter?.type) {
      filtered = filtered.filter((t) => t.type === filter.type);
    }

    return filtered;
  }

  removeTask(id: string): boolean {
    const index = this.queue.findIndex((t) => t.id === id);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    return true;
  }

  clearCompleted(): number {
    const before = this.queue.length;
    this.queue = this.queue.filter((t) => t.status !== 'completed');
    return before - this.queue.length;
  }

  private generateId(): string {
    return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiQueueSystem = new AIQueueSystem();
