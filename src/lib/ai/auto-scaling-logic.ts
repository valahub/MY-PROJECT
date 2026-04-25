// Auto Scaling Logic
// Distribute API calls under high load to prevent overload

export interface ScalingConfig {
  minConcurrent: number;
  maxConcurrent: number;
  scaleUpThreshold: number; // CPU/queue usage percentage
  scaleDownThreshold: number;
  cooldownPeriod: number; // ms
}

export class AIAutoScalingLogic {
  private currentConcurrent: number = 3;
  private config: ScalingConfig = {
    minConcurrent: 3,
    maxConcurrent: 10,
    scaleUpThreshold: 80,
    scaleDownThreshold: 30,
    cooldownPeriod: 60000, // 1 minute
  };
  private lastScaleTime: number = 0;
  private queueSize: number = 0;

  updateQueueSize(size: number) {
    this.queueSize = size;
    this.checkScaling();
  }

  private checkScaling() {
    const now = Date.now();
    if (now - this.lastScaleTime < this.config.cooldownPeriod) {
      return; // Still in cooldown
    }

    const utilization = (this.queueSize / this.currentConcurrent) * 100;

    if (utilization > this.config.scaleUpThreshold && this.currentConcurrent < this.config.maxConcurrent) {
      this.scaleUp();
    } else if (utilization < this.config.scaleDownThreshold && this.currentConcurrent > this.config.minConcurrent) {
      this.scaleDown();
    }
  }

  private scaleUp() {
    const increment = Math.min(2, this.config.maxConcurrent - this.currentConcurrent);
    this.currentConcurrent += increment;
    this.lastScaleTime = Date.now();
    console.log(`[AutoScaling] Scaled up to ${this.currentConcurrent} concurrent requests`);
  }

  private scaleDown() {
    const decrement = Math.min(1, this.currentConcurrent - this.config.minConcurrent);
    this.currentConcurrent -= decrement;
    this.lastScaleTime = Date.now();
    console.log(`[AutoScaling] Scaled down to ${this.currentConcurrent} concurrent requests`);
  }

  getCurrentConcurrent(): number {
    return this.currentConcurrent;
  }

  setConfig(config: Partial<ScalingConfig>) {
    this.config = { ...this.config, ...config };
  }

  getConfig(): ScalingConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const aiAutoScalingLogic = new AIAutoScalingLogic();
