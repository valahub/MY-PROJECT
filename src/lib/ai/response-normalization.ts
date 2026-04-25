// AI Response Normalization
// Convert all API outputs to same format for easy frontend usage

export interface NormalizedResponse {
  success: boolean;
  content: string;
  metadata: {
    provider: string;
    model?: string;
    tokensUsed: number;
    cost: number;
    latency: number;
  };
  error?: string;
}

export class AIResponseNormalizer {
  normalize(response: any, provider: string, metadata?: any): NormalizedResponse {
    const baseMetadata = {
      provider,
      model: metadata?.model,
      tokensUsed: metadata?.tokensUsed || 0,
      cost: metadata?.cost || 0,
      latency: metadata?.latency || 0,
    };

    // Handle string responses
    if (typeof response === 'string') {
      return {
        success: true,
        content: response,
        metadata: baseMetadata,
      };
    }

    // Handle object responses
    if (typeof response === 'object' && response !== null) {
      // OpenAI format
      if (response.choices && response.choices[0]?.message?.content) {
        return {
          success: true,
          content: response.choices[0].message.content,
          metadata: {
            ...baseMetadata,
            model: response.model,
            tokensUsed: response.usage?.total_tokens || 0,
          },
        };
      }

      // Claude format
      if (response.content && response.content[0]?.text) {
        return {
          success: true,
          content: response.content[0].text,
          metadata: baseMetadata,
        };
      }

      // Generic format with content field
      if (response.content) {
        return {
          success: true,
          content: typeof response.content === 'string' ? response.content : JSON.stringify(response.content),
          metadata: baseMetadata,
        };
      }

      // Generic format with text field
      if (response.text) {
        return {
          success: true,
          content: response.text,
          metadata: baseMetadata,
        };
      }

      // Generic format with data field
      if (response.data) {
        return {
          success: true,
          content: typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
          metadata: baseMetadata,
        };
      }
    }

    // Error case
    return {
      success: false,
      content: '',
      metadata: baseMetadata,
      error: 'Unable to normalize response',
    };
  }

  normalizeError(error: any, provider: string): NormalizedResponse {
    return {
      success: false,
      content: '',
      metadata: {
        provider,
        tokensUsed: 0,
        cost: 0,
        latency: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export singleton instance
export const aiResponseNormalizer = new AIResponseNormalizer();
