// Social Backlink Engine
// Auto-generates backlinks on Reddit, Medium, Dev.to

export interface BacklinkTask {
  id: string;
  platform: 'reddit' | 'medium' | 'devto';
  title: string;
  content: string;
  url: string;
  status: 'pending' | 'processing' | 'posted' | 'failed';
  postedAt?: string;
  error?: string;
}

export interface BacklinkConfig {
  reddit: {
    enabled: boolean;
    subreddits: string[];
    apiKey?: string;
  };
  medium: {
    enabled: boolean;
    apiKey?: string;
  };
  devto: {
    enabled: boolean;
    apiKey?: string;
  };
}

// Backlink task queue
const backlinkQueue = new Map<string, BacklinkTask>();

// Default configuration
const DEFAULT_CONFIG: BacklinkConfig = {
  reddit: {
    enabled: false,
    subreddits: ['javascript', 'webdev', 'reactjs', 'vuejs', 'programming'],
  },
  medium: {
    enabled: false,
  },
  devto: {
    enabled: false,
  },
};

// Generate Reddit post content
export function generateRedditPostContent(product: {
  title: string;
  description: string;
  category: string;
  url: string;
}): {
  title: string;
  content: string;
} {
  const postTitle = `[Release] ${product.title} - ${product.category}`;
  
  const postContent = `I just released a new ${product.category} product that might be useful for this community.

**${product.title}**

${product.description}

Check it out here: ${product.url}

Looking for feedback and suggestions!

#${product.category.replace(/ /g, '')} #opensource #dev`;

  return {
    title: postTitle,
    content: postContent,
  };
}

// Generate Medium article content
export function generateMediumArticleContent(product: {
  title: string;
  description: string;
  category: string;
  url: string;
}): {
  title: string;
  content: string;
  tags: string[];
} {
  const articleTitle = `The Ultimate Guide to ${product.title}`;
  
  const articleContent = `# ${articleTitle}

In this article, we'll explore ${product.title}, a powerful ${product.category} solution.

## What is ${product.title}?

${product.description}

## Key Features

- Easy to use
- High performance
- Well documented
- Regular updates

## Why Choose This Solution?

${product.title} stands out in the ${product.category} space for its simplicity and effectiveness.

## Get Started

You can find ${product.title} at: ${product.url}

## Conclusion

${product.title} is a great choice for your ${product.category} needs. Give it a try and let me know your thoughts!`;

  const tags = [product.category, 'tutorial', 'guide', 'development'];

  return {
    title: articleTitle,
    content: articleContent,
    tags,
  };
}

// Generate Dev.to post content
export function generateDevtoPostContent(product: {
  title: string;
  description: string;
  category: string;
  url: string;
}): {
  title: string;
  content: string;
  tags: string[];
} {
  const postTitle = `${product.title}: A ${product.category} Solution`;

  const postContent = `I've been working on ${product.title}, a ${product.category} tool that I think you'll find useful.

## Overview

${product.description}

## Features

- Simple and intuitive
- Built for performance
- Comprehensive documentation

## Usage

Check out the full project at: ${product.url}

Would love to hear your feedback!`;

  const tags = [product.category, 'javascript', 'webdev', 'showdev'];

  return {
    title: postTitle,
    content: postContent,
    tags,
  };
}

// Post to Reddit (placeholder - requires API integration)
export async function postToReddit(
  subreddit: string,
  title: string,
  content: string,
  apiKey?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Reddit API
  // For now, return mock response
  try {
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: `https://reddit.com/r/${subreddit}/comments/mock`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Post to Medium (placeholder - requires API integration)
export async function postToMedium(
  title: string,
  content: string,
  tags: string[],
  apiKey?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Medium API
  // For now, return mock response
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: 'https://medium.com/@user/mock-article',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Post to Dev.to (placeholder - requires API integration)
export async function postToDevto(
  title: string,
  content: string,
  tags: string[],
  apiKey?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Dev.to API
  // For now, return mock response
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: 'https://dev.to/user/mock-post',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Add backlink task to queue
export function addBacklinkTask(
  platform: BacklinkTask['platform'],
  product: {
    title: string;
    description: string;
    category: string;
    url: string;
  }
): BacklinkTask {
  const id = `backlink-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let title = '';
  let content = '';

  switch (platform) {
    case 'reddit':
      const redditContent = generateRedditPostContent(product);
      title = redditContent.title;
      content = redditContent.content;
      break;
    case 'medium':
      const mediumContent = generateMediumArticleContent(product);
      title = mediumContent.title;
      content = mediumContent.content;
      break;
    case 'devto':
      const devtoContent = generateDevtoPostContent(product);
      title = devtoContent.title;
      content = devtoContent.content;
      break;
  }

  const task: BacklinkTask = {
    id,
    platform,
    title,
    content,
    url: product.url,
    status: 'pending',
  };

  backlinkQueue.set(id, task);
  return task;
}

// Process backlink queue
export async function processBacklinkQueue(config: BacklinkConfig = DEFAULT_CONFIG): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const [id, task] of backlinkQueue.entries()) {
    if (task.status !== 'pending') continue;

    processed++;
    task.status = 'processing';

    try {
      let result;

      switch (task.platform) {
        case 'reddit':
          if (config.reddit.enabled) {
            const subreddit = config.reddit.subreddits[0];
            result = await postToReddit(subreddit, task.title, task.content, config.reddit.apiKey);
          } else {
            result = { success: false, error: 'Reddit not enabled' };
          }
          break;
        case 'medium':
          if (config.medium.enabled) {
            result = await postToMedium(task.title, task.content, [], config.medium.apiKey);
          } else {
            result = { success: false, error: 'Medium not enabled' };
          }
          break;
        case 'devto':
          if (config.devto.enabled) {
            result = await postToDevto(task.title, task.content, [], config.devto.apiKey);
          } else {
            result = { success: false, error: 'Dev.to not enabled' };
          }
          break;
      }

      if (result?.success) {
        task.status = 'posted';
        task.postedAt = new Date().toISOString();
        succeeded++;
      } else {
        task.status = 'failed';
        task.error = result?.error || 'Unknown error';
        failed++;
      }

      backlinkQueue.set(id, task);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      failed++;
      backlinkQueue.set(id, task);
    }
  }

  return { processed, succeeded, failed };
}

// Get queue status
export function getBacklinkQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  posted: number;
  failed: number;
} {
  const tasks = Array.from(backlinkQueue.values());
  
  return {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'pending').length,
    processing: tasks.filter((t) => t.status === 'processing').length,
    posted: tasks.filter((t) => t.status === 'posted').length,
    failed: tasks.filter((t) => t.status === 'failed').length,
  };
}

// Clear completed tasks
export function clearCompletedBacklinkTasks(): number {
  let cleared = 0;
  
  for (const [id, task] of backlinkQueue.entries()) {
    if (task.status === 'posted') {
      backlinkQueue.delete(id);
      cleared++;
    }
  }
  
  return cleared;
}

// Retry failed tasks
export function retryFailedBacklinkTasks(): number {
  let retried = 0;
  
  for (const [id, task] of backlinkQueue.entries()) {
    if (task.status === 'failed') {
      task.status = 'pending';
      task.error = undefined;
      backlinkQueue.set(id, task);
      retried++;
    }
  }
  
  return retried;
}

// Schedule periodic backlink posting
export function scheduleBacklinkPosting(intervalDays: number = 7, config?: BacklinkConfig): number {
  return setInterval(async () => {
    await processBacklinkQueue(config);
    clearCompletedBacklinkTasks();
  }, intervalDays * 24 * 60 * 60 * 1000) as unknown as number;
}

// Get backlink statistics
export function getBacklinkStats(): {
  totalTasks: number;
  byPlatform: Record<string, number>;
  successRate: number;
} {
  const tasks = Array.from(backlinkQueue.values());
  const byPlatform: Record<string, number> = {
    reddit: 0,
    medium: 0,
    devto: 0,
  };

  tasks.forEach((task) => {
    byPlatform[task.platform]++;
  });

  const posted = tasks.filter((t) => t.status === 'posted').length;
  const successRate = tasks.length > 0 ? (posted / tasks.length) * 100 : 0;

  return {
    totalTasks: tasks.length,
    byPlatform,
    successRate,
  };
}

// Export backlink queue
export function exportBacklinkQueue(): string {
  return JSON.stringify(Array.from(backlinkQueue.values()), null, 2);
}

// Import backlink queue
export function importBacklinkQueue(json: string): void {
  const tasks = JSON.parse(json) as BacklinkTask[];
  tasks.forEach((task) => {
    backlinkQueue.set(task.id, task);
  });
}

// Clear all backlink tasks
export function clearBacklinkQueue(): void {
  backlinkQueue.clear();
}

// Validate backlink content
export function validateBacklinkContent(title: string, content: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!title || title.length === 0) {
    issues.push('Title is required');
  }

  if (title.length > 200) {
    issues.push('Title exceeds 200 characters');
  }

  if (!content || content.length === 0) {
    issues.push('Content is required');
  }

  if (content.length < 100) {
    issues.push('Content is too short (minimum 100 characters)');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
