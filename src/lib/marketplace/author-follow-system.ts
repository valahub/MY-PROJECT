// Author Follow System
// Allow users to follow authors for recommendations

import { ITEMS } from '../marketplace-data';

export interface AuthorFollow {
  userId: string;
  authorName: string;
  followedAt: string;
}

export interface FollowResponse {
  success: boolean;
  following: boolean;
  error?: string;
}

// Follow storage (in production, use DB)
const authorFollows = new Map<string, AuthorFollow[]>();

// Get authors followed by user
export function getFollowedAuthors(userId: string): string[] {
  const follows = authorFollows.get(userId) || [];
  return follows.map((f) => f.authorName);
}

// Check if user follows author
export function isFollowingAuthor(userId: string, authorName: string): boolean {
  const follows = authorFollows.get(userId) || [];
  return follows.some((f) => f.authorName === authorName);
}

// Toggle follow
export function toggleFollowAuthor(userId: string, authorName: string): FollowResponse {
  if (!userId) {
    return {
      success: false,
      following: false,
      error: 'User not authenticated',
    };
  }

  const follows = authorFollows.get(userId) || [];
  const existingIndex = follows.findIndex((f) => f.authorName === authorName);

  let updatedFollows: AuthorFollow[];

  if (existingIndex > -1) {
    // Unfollow
    updatedFollows = follows.filter((f) => f.authorName !== authorName);
  } else {
    // Follow
    updatedFollows = [
      ...follows,
      {
        userId,
        authorName,
        followedAt: new Date().toISOString(),
      },
    ];
  }

  authorFollows.set(userId, updatedFollows);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`follows-${userId}`, JSON.stringify(updatedFollows));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    following: existingIndex === -1,
  };
}

// Follow author
export function followAuthor(userId: string, authorName: string): FollowResponse {
  if (!userId) {
    return {
      success: false,
      following: false,
      error: 'User not authenticated',
    };
  }

  const follows = authorFollows.get(userId) || [];
  
  if (follows.some((f) => f.authorName === authorName)) {
    return {
      success: true,
      following: true,
    };
  }

  const updatedFollows = [
    ...follows,
    {
      userId,
      authorName,
      followedAt: new Date().toISOString(),
    },
  ];

  authorFollows.set(userId, updatedFollows);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`follows-${userId}`, JSON.stringify(updatedFollows));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    following: true,
  };
}

// Unfollow author
export function unfollowAuthor(userId: string, authorName: string): FollowResponse {
  if (!userId) {
    return {
      success: false,
      following: false,
      error: 'User not authenticated',
    };
  }

  const follows = authorFollows.get(userId) || [];
  const updatedFollows = follows.filter((f) => f.authorName !== authorName);

  authorFollows.set(userId, updatedFollows);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`follows-${userId}`, JSON.stringify(updatedFollows));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    following: false,
  };
}

// Get products from followed authors
export function getProductsFromFollowedAuthors(userId: string): typeof ITEMS {
  const followedAuthors = getFollowedAuthors(userId);
  
  return ITEMS.filter((item) => followedAuthors.includes(item.author));
}

// Get follow count for author
export function getAuthorFollowCount(authorName: string): number {
  let count = 0;
  
  authorFollows.forEach((follows) => {
    if (follows.some((f) => f.authorName === authorName)) {
      count++;
    }
  });

  return count;
}

// Load follows from localStorage
export function loadFollowsFromStorage(userId: string): AuthorFollow[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`follows-${userId}`);
    if (!stored) return [];

    const follows = JSON.parse(stored) as AuthorFollow[];
    authorFollows.set(userId, follows);
    return follows;
  } catch {
    return [];
  }
}

// Get all authors
export function getAllAuthors(): string[] {
  const authors = new Set<string>();
  
  ITEMS.forEach((item) => {
    authors.add(item.author);
  });

  return Array.from(authors);
}

// Get author statistics
export function getAuthorStats(authorName: string): {
  productCount: number;
  averageRating: number;
  totalReviews: number;
  followCount: number;
} {
  const authorProducts = ITEMS.filter((item) => item.author === authorName);
  
  const totalRating = authorProducts.reduce((sum, item) => sum + item.rating, 0);
  const averageRating = authorProducts.length > 0 ? totalRating / authorProducts.length : 0;
  const totalReviews = authorProducts.reduce((sum, item) => sum + (item.reviews || 0), 0);

  return {
    productCount: authorProducts.length,
    averageRating,
    totalReviews,
    followCount: getAuthorFollowCount(authorName),
  };
}

// Export follow data
export function exportFollowData(userId: string): string {
  const follows = authorFollows.get(userId) || [];
  return JSON.stringify(follows, null, 2);
}

// Import follow data
export function importFollowData(userId: string, json: string): FollowResponse {
  try {
    const follows = JSON.parse(json) as AuthorFollow[];
    authorFollows.set(userId, follows);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`follows-${userId}`, JSON.stringify(follows));
      } catch {
        // Ignore storage errors
      }
    }

    return {
      success: true,
      following: true,
    };
  } catch {
    return {
      success: false,
      following: false,
      error: 'Invalid follow data',
    };
  }
}

// Clear all follows for user
export function clearUserFollows(userId: string): void {
  authorFollows.delete(userId);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`follows-${userId}`);
    } catch {
      // Ignore storage errors
    }
  }
}
