// Social Auto-Post System
// Auto-posts new products to Twitter, Telegram, Discord

export interface SocialPost {
  id: string;
  platform: 'twitter' | 'telegram' | 'discord';
  content: string;
  imageUrl?: string;
  url: string;
  status: 'pending' | 'processing' | 'posted' | 'failed';
  postedAt?: string;
  error?: string;
}

export interface SocialConfig {
  twitter: {
    enabled: boolean;
    apiKey?: string;
    apiSecret?: string;
    accessToken?: string;
    accessSecret?: string;
  };
  telegram: {
    enabled: boolean;
    botToken?: string;
    channelId?: string;
  };
  discord: {
    enabled: boolean;
    webhookUrl?: string;
  };
}

// Post queue
const postQueue = new Map<string, SocialPost>();

// Default configuration
const DEFAULT_CONFIG: SocialConfig = {
  twitter: {
    enabled: false,
  },
  telegram: {
    enabled: false,
  },
  discord: {
    enabled: false,
  },
};

// Generate Twitter post content
export function generateTwitterPost(product: {
  title: string;
  description: string;
  category: string;
  url: string;
}): string {
  const maxLength = 280;
  const baseUrl = product.url;
  const baseContent = `🚀 New ${product.category}: ${product.title}\n\n${product.description.substring(0, 100)}...\n\n`;
  
  const availableLength = maxLength - baseContent.length - baseUrl.length - 10;
  const truncatedTitle = product.title.length > availableLength 
    ? product.title.substring(0, availableLength - 3) + '...'
    : product.title;

  return `${baseContent}${truncatedTitle}\n\n${baseUrl}\n\n#new #${product.category.replace(/ /g, '')} #dev`;
}

// Generate Telegram post content
export function generateTelegramPost(product: {
  title: string;
  description: string;
  category: string;
  url: string;
  thumbnail?: string;
}): {
  text: string;
  parseMode: 'HTML' | 'Markdown';
} {
  const text = `🚀 <b>New Release</b>\n\n` +
    `<b>${product.title}</b>\n\n` +
    `${product.description}\n\n` +
    `📂 ${product.category}\n\n` +
    `<a href="${product.url}">View Product →</a>`;

  return {
    text,
    parseMode: 'HTML',
  };
}

// Generate Discord post content
export function generateDiscordPost(product: {
  title: string;
  description: string;
  category: string;
  url: string;
  thumbnail?: string;
}): {
  content: string;
  embeds: Array<{
    title: string;
    description: string;
    url: string;
    color: number;
    fields?: Array<{ name: string; value: string; inline: boolean }>;
    thumbnail?: { url: string };
  }>;
} {
  const embeds = [
    {
      title: `🚀 New ${product.category} Release`,
      description: product.description,
      url: product.url,
      color: 0x00ff00,
      fields: [
        { name: 'Category', value: product.category, inline: true },
        { name: 'Type', value: 'Digital Product', inline: true },
      ],
      thumbnail: product.thumbnail ? { url: product.thumbnail } : undefined,
    },
  ];

  return {
    content: '@everyone New product available!',
    embeds,
  };
}

// Post to Twitter (placeholder - requires API integration)
export async function postToTwitter(
  content: string,
  config: SocialConfig['twitter']
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Twitter API v2
  // For now, return mock response
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: 'https://twitter.com/user/status/mock',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Post to Telegram (placeholder - requires API integration)
export async function postToTelegram(
  text: string,
  config: SocialConfig['telegram']
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Telegram Bot API
  // For now, return mock response
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: 'https://t.me/channel/mock',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Post to Discord (placeholder - requires webhook integration)
export async function postToDiscord(
  content: string,
  embeds: any[],
  config: SocialConfig['discord']
): Promise<{ success: boolean; url?: string; error?: string }> {
  // In production, integrate with Discord Webhook API
  // For now, return mock response
  try {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    return {
      success: true,
      url: 'https://discord.com/channels/mock',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Add social post to queue
export function addSocialPost(
  platform: SocialPost['platform'],
  product: {
    title: string;
    description: string;
    category: string;
    url: string;
    thumbnail?: string;
  }
): SocialPost {
  const id = `social-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  let content = '';
  let imageUrl = product.thumbnail;

  switch (platform) {
    case 'twitter':
      content = generateTwitterPost(product);
      break;
    case 'telegram':
      const telegramPost = generateTelegramPost(product);
      content = telegramPost.text;
      break;
    case 'discord':
      const discordPost = generateDiscordPost(product);
      content = discordPost.content;
      break;
  }

  const post: SocialPost = {
    id,
    platform,
    content,
    imageUrl,
    url: product.url,
    status: 'pending',
  };

  postQueue.set(id, post);
  return post;
}

// Process post queue
export async function processPostQueue(config: SocialConfig = DEFAULT_CONFIG): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  for (const [id, post] of postQueue.entries()) {
    if (post.status !== 'pending') continue;

    processed++;
    post.status = 'processing';

    try {
      let result;

      switch (post.platform) {
        case 'twitter':
          if (config.twitter.enabled) {
            result = await postToTwitter(post.content, config.twitter);
          } else {
            result = { success: false, error: 'Twitter not enabled' };
          }
          break;
        case 'telegram':
          if (config.telegram.enabled) {
            result = await postToTelegram(post.content, config.telegram);
          } else {
            result = { success: false, error: 'Telegram not enabled' };
          }
          break;
        case 'discord':
          if (config.discord.enabled) {
            result = await postToDiscord(post.content, [], config.discord);
          } else {
            result = { success: false, error: 'Discord not enabled' };
          }
          break;
      }

      if (result?.success) {
        post.status = 'posted';
        post.postedAt = new Date().toISOString();
        succeeded++;
      } else {
        post.status = 'failed';
        post.error = result?.error || 'Unknown error';
        failed++;
      }

      postQueue.set(id, post);
    } catch (error) {
      post.status = 'failed';
      post.error = error instanceof Error ? error.message : 'Unknown error';
      failed++;
      postQueue.set(id, post);
    }
  }

  return { processed, succeeded, failed };
}

// Get queue status
export function getPostQueueStatus(): {
  total: number;
  pending: number;
  processing: number;
  posted: number;
  failed: number;
} {
  const posts = Array.from(postQueue.values());
  
  return {
    total: posts.length,
    pending: posts.filter((p) => p.status === 'pending').length,
    processing: posts.filter((p) => p.status === 'processing').length,
    posted: posts.filter((p) => p.status === 'posted').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };
}

// Clear completed posts
export function clearCompletedPosts(): number {
  let cleared = 0;
  
  for (const [id, post] of postQueue.entries()) {
    if (post.status === 'posted') {
      postQueue.delete(id);
      cleared++;
    }
  }
  
  return cleared;
}

// Retry failed posts
export function retryFailedPosts(): number {
  let retried = 0;
  
  for (const [id, post] of postQueue.entries()) {
    if (post.status === 'failed') {
      post.status = 'pending';
      post.error = undefined;
      postQueue.set(id, post);
      retried++;
    }
  }
  
  return retried;
}

// Schedule periodic posting
export function scheduleSocialPosting(intervalHours: number = 24, config?: SocialConfig): number {
  return setInterval(async () => {
    await processPostQueue(config);
    clearCompletedPosts();
  }, intervalHours * 60 * 60 * 1000) as unknown as number;
}

// Get posting statistics
export function getPostingStats(): {
  totalPosts: number;
  byPlatform: Record<string, number>;
  successRate: number;
} {
  const posts = Array.from(postQueue.values());
  const byPlatform: Record<string, number> = {
    twitter: 0,
    telegram: 0,
    discord: 0,
  };

  posts.forEach((post) => {
    byPlatform[post.platform]++;
  });

  const posted = posts.filter((p) => p.status === 'posted').length;
  const successRate = posts.length > 0 ? (posted / posts.length) * 100 : 0;

  return {
    totalPosts: posts.length,
    byPlatform,
    successRate,
  };
}

// Export post queue
export function exportPostQueue(): string {
  return JSON.stringify(Array.from(postQueue.values()), null, 2);
}

// Import post queue
export function importPostQueue(json: string): void {
  const posts = JSON.parse(json) as SocialPost[];
  posts.forEach((post) => {
    postQueue.set(post.id, post);
  });
}

// Clear all posts
export function clearPostQueue(): void {
  postQueue.clear();
}

// Validate post content
export function validatePostContent(platform: SocialPost['platform'], content: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!content || content.length === 0) {
    issues.push('Content is required');
  }

  if (platform === 'twitter' && content.length > 280) {
    issues.push('Twitter post exceeds 280 characters');
  }

  if (platform === 'telegram' && content.length > 4096) {
    issues.push('Telegram post exceeds 4096 characters');
  }

  if (platform === 'discord' && content.length > 2000) {
    issues.push('Discord content exceeds 2000 characters');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Auto-post new product to all enabled platforms
export function autoPostNewProduct(product: {
  title: string;
  description: string;
  category: string;
  url: string;
  thumbnail?: string;
}, config: SocialConfig = DEFAULT_CONFIG): SocialPost[] {
  const posts: SocialPost[] = [];

  if (config.twitter.enabled) {
    posts.push(addSocialPost('twitter', product));
  }

  if (config.telegram.enabled) {
    posts.push(addSocialPost('telegram', product));
  }

  if (config.discord.enabled) {
    posts.push(addSocialPost('discord', product));
  }

  return posts;
}
