// Forum Data Module
// Dynamic forum categories, topics, and discussions

export interface ForumCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  topics: number;
  posts: number;
  lastActivity: string;
  type: 'general' | 'tech';
}

export interface ForumTopic {
  id: string;
  categoryId: string;
  title: string;
  author: string;
  authorId: string;
  replies: number;
  views: number;
  lastActivity: string;
  createdAt: string;
  isPinned?: boolean;
  isLocked?: boolean;
}

export interface ForumReply {
  id: string;
  topicId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// Forum Categories
export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: 'item-discussion',
    slug: 'item-discussion',
    name: 'Item Discussion',
    description: 'Discuss marketplace items and products',
    topics: 12450,
    posts: 84320,
    lastActivity: '2h ago',
    type: 'general',
  },
  {
    id: 'authors-lounge',
    slug: 'authors-lounge',
    name: 'Authors Lounge',
    description: 'Community for authors to connect and share',
    topics: 8420,
    posts: 52100,
    lastActivity: '15m ago',
    type: 'general',
  },
  {
    id: 'buyers-help',
    slug: 'buyers-help',
    name: 'Buyers Help',
    description: 'Get help with purchases and usage',
    topics: 23110,
    posts: 142000,
    lastActivity: '5m ago',
    type: 'general',
  },
  {
    id: 'wordpress',
    slug: 'wordpress',
    name: 'WordPress',
    description: 'WordPress plugins, themes, and development',
    topics: 18920,
    posts: 98400,
    lastActivity: '1h ago',
    type: 'tech',
  },
  {
    id: 'html-css-js',
    slug: 'html-css-js',
    name: 'HTML / CSS / JS',
    description: 'Frontend development discussions',
    topics: 9450,
    posts: 41200,
    lastActivity: '3h ago',
    type: 'tech',
  },
  {
    id: 'mobile-apps',
    slug: 'mobile-apps',
    name: 'Mobile Apps',
    description: 'iOS and Android app development',
    topics: 4120,
    posts: 18900,
    lastActivity: '6h ago',
    type: 'tech',
  },
];

// Sample Topics (in production, this would come from DB)
export const FORUM_TOPICS: ForumTopic[] = [
  {
    id: 'topic-1',
    categoryId: 'item-discussion',
    title: 'Best practices for plugin development',
    author: 'dev_master',
    authorId: 'user-1',
    replies: 45,
    views: 1230,
    lastActivity: '2h ago',
    createdAt: '3 days ago',
    isPinned: true,
  },
  {
    id: 'topic-2',
    categoryId: 'item-discussion',
    title: 'How to optimize theme performance',
    author: 'theme_expert',
    authorId: 'user-2',
    replies: 32,
    views: 890,
    lastActivity: '5h ago',
    createdAt: '1 week ago',
  },
  {
    id: 'topic-3',
    categoryId: 'authors-lounge',
    title: 'Tips for increasing sales',
    author: 'sales_guru',
    authorId: 'user-3',
    replies: 67,
    views: 2340,
    lastActivity: '15m ago',
    createdAt: '2 days ago',
    isPinned: true,
  },
  {
    id: 'topic-4',
    categoryId: 'wordpress',
    title: 'WordPress 6.4 compatibility issues',
    author: 'wp_dev',
    authorId: 'user-4',
    replies: 28,
    views: 567,
    lastActivity: '1h ago',
    createdAt: '4 days ago',
  },
  {
    id: 'topic-5',
    categoryId: 'html-css-js',
    title: 'CSS Grid vs Flexbox - when to use which',
    author: 'css_ninja',
    authorId: 'user-5',
    replies: 54,
    views: 1890,
    lastActivity: '3h ago',
    createdAt: '5 days ago',
  },
];

// Sample Replies (in production, this would come from DB)
export const FORUM_REPLIES: ForumReply[] = [
  {
    id: 'reply-1',
    topicId: 'topic-1',
    author: 'dev_master',
    authorId: 'user-1',
    content: 'Here are some best practices I recommend for plugin development...',
    createdAt: '3 days ago',
  },
  {
    id: 'reply-2',
    topicId: 'topic-1',
    author: 'code_wizard',
    authorId: 'user-6',
    content: 'Great tips! I would also add that you should always sanitize user input.',
    createdAt: '2 days ago',
  },
];

// Helper functions
export function getForumCategoryBySlug(slug: string): ForumCategory | undefined {
  return FORUM_CATEGORIES.find((cat) => cat.slug === slug);
}

export function getTopicsByCategory(categoryId: string): ForumTopic[] {
  return FORUM_TOPICS.filter((topic) => topic.categoryId === categoryId);
}

export function getTopicById(topicId: string): ForumTopic | undefined {
  return FORUM_TOPICS.find((topic) => topic.id === topicId);
}

export function getRepliesByTopic(topicId: string): ForumReply[] {
  return FORUM_REPLIES.filter((reply) => reply.topicId === topicId);
}
