// Auto Content Engine (Free AI)
// Generates SEO content using free AI APIs

export interface ContentRequest {
  type: 'category-intro' | 'product-description' | 'meta-description' | 'blog-post';
  topic: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
}

export interface ContentResponse {
  content: string;
  source: 'huggingface' | 'openrouter' | 'ollama' | 'template' | 'auto';
  confidence: number;
}

// Template-based content generation (fallback)
const CONTENT_TEMPLATES = {
  'category-intro': `Discover the best {topic} for your needs. Our curated selection features top-rated solutions trusted by thousands of users. Browse our comprehensive collection of {topic} with detailed reviews, ratings, and instant download options.`,
  
  'product-description': `{topic} is a premium solution designed for modern businesses. Features include advanced functionality, user-friendly interface, and comprehensive support. Perfect for {keywords} with proven performance and reliability.`,
  
  'meta-description': `Buy {topic} online. Top-rated {keywords} with instant download. Trusted by 1000+ users. Best prices guaranteed.`,
  
  'blog-post': `# {topic}: Complete Guide\n\nIn this comprehensive guide, we'll explore everything about {topic}. Whether you're a beginner or an expert, this article covers all the essential aspects you need to know.\n\n## What is {topic}?\n\n{topic} is a powerful tool that helps businesses achieve their goals. With its advanced features and intuitive design, it has become the go-to solution for professionals worldwide.\n\n## Key Benefits\n\n- **Efficiency**: Streamline your workflow\n- **Cost-effective**: Save money with smart solutions\n- **Scalability**: Grow without limits\n- **Support**: Expert assistance when you need it\n\n## Getting Started\n\nTo get started with {topic}, follow these simple steps:\n\n1. Assess your requirements\n2. Choose the right plan\n3. Implement the solution\n4. Optimize for your needs\n\n## Conclusion\n\n{topic} offers exceptional value for businesses of all sizes. Start your journey today and experience the difference.`,
};

// HuggingFace Inference API (free tier)
export async function generateWithHuggingFace(
  prompt: string,
  model: string = 'gpt2'
): Promise<ContentResponse> {
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${model}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 500,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error('HuggingFace API error');
    }

    const data = await response.json();
    const content = Array.isArray(data) ? data[0]?.generated_text : data.generated_text;

    return {
      content: content || '',
      source: 'huggingface',
      confidence: 0.8,
    };
  } catch (error) {
    console.error('HuggingFace error:', error);
    return generateWithTemplate(prompt);
  }
}

// OpenRouter free models
export async function generateWithOpenRouter(
  prompt: string,
  model: string = 'mistralai/mistral-7b-instruct:free'
): Promise<ContentResponse> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenRouter API error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      source: 'openrouter',
      confidence: 0.9,
    };
  } catch (error) {
    console.error('OpenRouter error:', error);
    return generateWithTemplate(prompt);
  }
}

// Ollama local (free, self-hosted)
export async function generateWithOllama(
  prompt: string,
  model: string = 'llama2'
): Promise<ContentResponse> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama API error');
    }

    const data = await response.json();
    const content = data.response || '';

    return {
      content,
      source: 'ollama',
      confidence: 0.95,
    };
  } catch (error) {
    console.error('Ollama error:', error);
    return generateWithTemplate(prompt);
  }
}

// Template-based generation (fallback)
function generateWithTemplate(prompt: string): ContentResponse {
  // Extract topic from prompt
  const topicMatch = prompt.match(/(?:about|for|generate|create)\s+(.+)/i);
  const topic = topicMatch ? topicMatch[1] : 'this topic';

  // Determine content type
  let type: keyof typeof CONTENT_TEMPLATES = 'product-description';
  if (prompt.toLowerCase().includes('category')) type = 'category-intro';
  if (prompt.toLowerCase().includes('meta')) type = 'meta-description';
  if (prompt.toLowerCase().includes('blog')) type = 'blog-post';

  const template = CONTENT_TEMPLATES[type];
  const content = template
    .replace(/{topic}/g, topic)
    .replace(/{keywords}/g, 'various features');

  return {
    content,
    source: 'template',
    confidence: 0.5,
  };
}

// Main content generation function
export async function generateContent(request: ContentRequest): Promise<ContentResponse> {
  const { type, topic, keywords = [], length = 'medium' } = request;

  // Build prompt
  const keywordsStr = keywords.join(', ');
  let prompt = '';

  switch (type) {
    case 'category-intro':
      prompt = `Write a category introduction about ${topic}. Include keywords: ${keywordsStr}. Length: ${length}.`;
      break;
    case 'product-description':
      prompt = `Write a product description for ${topic}. Features: ${keywordsStr}. Length: ${length}.`;
      break;
    case 'meta-description':
      prompt = `Write a meta description for ${topic}. Keywords: ${keywordsStr}. Max 160 characters.`;
      break;
    case 'blog-post':
      prompt = `Write a blog post about ${topic}. Include keywords: ${keywordsStr}. Length: ${length}.`;
      break;
  }

  // Try AI sources in order of preference
  // 1. Ollama (local, free)
  // 2. OpenRouter (free tier)
  // 3. HuggingFace (free tier)
  // 4. Template (fallback)

  try {
    return await generateWithOllama(prompt);
  } catch {
    try {
      return await generateWithOpenRouter(prompt);
    } catch {
      try {
        return await generateWithHuggingFace(prompt);
      } catch {
        return generateWithTemplate(prompt);
      }
    }
  }
}

// Batch content generation
export async function batchGenerateContent(
  requests: ContentRequest[]
): Promise<Map<string, ContentResponse>> {
  const results = new Map<string, ContentResponse>();

  for (const request of requests) {
    const key = `${request.type}-${request.topic}`;
    const response = await generateContent(request);
    results.set(key, response);
  }

  return results;
}

// Generate category intro
export async function generateCategoryIntro(
  category: string,
  keywords: string[] = []
): Promise<string> {
  const response = await generateContent({
    type: 'category-intro',
    topic: category,
    keywords,
    length: 'medium',
  });
  return response.content;
}

// Generate product description
export async function generateProductDescription(
  productName: string,
  features: string[] = []
): Promise<string> {
  const response = await generateContent({
    type: 'product-description',
    topic: productName,
    keywords: features,
    length: 'medium',
  });
  return response.content;
}

// Generate meta description
export async function generateMetaDescription(
  topic: string,
  keywords: string[] = []
): Promise<string> {
  const response = await generateContent({
    type: 'meta-description',
    topic,
    keywords,
    length: 'short',
  });
  return response.content;
}

// Generate blog post
export async function generateBlogPost(
  topic: string,
  keywords: string[] = []
): Promise<string> {
  const response = await generateContent({
    type: 'blog-post',
    topic,
    keywords,
    length: 'long',
  });
  return response.content;
}

// Content cache
const contentCache = new Map<string, ContentResponse>();

export function cacheContent(key: string, content: ContentResponse): void {
  contentCache.set(key, content);
}

export function getCachedContent(key: string): ContentResponse | undefined {
  return contentCache.get(key);
}

export function clearContentCache(): void {
  contentCache.clear();
}

// Validate generated content
export function validateContent(content: string, type: ContentRequest['type']): boolean {
  if (!content || content.length === 0) return false;

  switch (type) {
    case 'meta-description':
      return content.length <= 160;
    case 'category-intro':
      return content.length >= 100 && content.length <= 500;
    case 'product-description':
      return content.length >= 50 && content.length <= 1000;
    case 'blog-post':
      return content.length >= 500;
    default:
      return true;
  }
}

// Optimize content for SEO
export function optimizeContentForSEO(content: string, keywords: string[]): string {
  let optimized = content;

  // Ensure primary keyword appears in first paragraph
  if (keywords.length > 0) {
    const primaryKeyword = keywords[0];
    const firstParagraph = optimized.split('\n\n')[0];
    
    if (!firstParagraph.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      optimized = `${primaryKeyword} is essential. ${optimized}`;
    }
  }

  // Add keyword density (natural)
  keywords.forEach((keyword) => {
    const regex = new RegExp(keyword, 'gi');
    const count = (optimized.match(regex) || []).length;
    
    if (count < 2) {
      optimized = optimized.replace(/\. /g, `. ${keyword}. `);
    }
  });

  return optimized;
}

// Get content generation stats
export function getContentStats(): {
  cacheSize: number;
  totalGenerated: number;
  bySource: Record<string, number>;
} {
  const bySource: Record<string, number> = {
    huggingface: 0,
    openrouter: 0,
    ollama: 0,
    template: 0,
  };

  contentCache.forEach((content) => {
    bySource[content.source]++;
  });

  return {
    cacheSize: contentCache.size,
    totalGenerated: contentCache.size,
    bySource,
  };
}

// Auto-generate content for all categories
export async function autoGenerateCategoryContent(): Promise<void> {
  const { CATEGORY_TREE } = await import('../marketplace-data');
  
  for (const category of CATEGORY_TREE) {
    const key = `category-intro-${category.slug}`;
    const cached = getCachedContent(key);
    
    if (!cached) {
      const content = await generateCategoryIntro(category.title, category.subs.slice(0, 3));
      cacheContent(key, { content, source: 'auto', confidence: 0.7 });
    }
  }
}

// Auto-generate content for all products
export async function autoGenerateProductContent(): Promise<void> {
  const { ITEMS } = await import('../marketplace-data');
  
  for (const item of ITEMS) {
    const key = `product-description-${item.id}`;
    const cached = getCachedContent(key);
    
    if (!cached) {
      const content = await generateProductDescription(item.title, item.tags.slice(0, 3));
      cacheContent(key, { content, source: 'auto', confidence: 0.7 });
    }
  }
}
