// Wishlist System
// Product wishlist toggle with API integration and persistence

import { ITEMS } from '../marketplace-data';

export interface WishlistItem {
  productId: string;
  addedAt: string;
}

export interface WishlistResponse {
  success: boolean;
  wishlist: WishlistItem[];
  count: number;
  error?: string;
}

// In-memory wishlist storage (in production, use DB)
const userWishlists = new Map<string, WishlistItem[]>();

// Get user's wishlist
export function getUserWishlist(userId: string): WishlistItem[] {
  return userWishlists.get(userId) || [];
}

// Check if product is in wishlist
export function isInWishlist(userId: string, productId: string): boolean {
  const wishlist = getUserWishlist(userId);
  return wishlist.some((item) => item.productId === productId);
}

// Toggle product in wishlist
export function toggleWishlist(userId: string, productId: string): WishlistResponse {
  if (!userId) {
    return {
      success: false,
      wishlist: [],
      count: 0,
      error: 'User not authenticated',
    };
  }

  const wishlist = getUserWishlist(userId);
  const existingIndex = wishlist.findIndex((item) => item.productId === productId);

  let updatedWishlist: WishlistItem[];

  if (existingIndex > -1) {
    // Remove from wishlist
    updatedWishlist = wishlist.filter((item) => item.productId !== productId);
  } else {
    // Add to wishlist
    updatedWishlist = [
      ...wishlist,
      {
        productId,
        addedAt: new Date().toISOString(),
      },
    ];
  }

  userWishlists.set(userId, updatedWishlist);

  // Persist to localStorage for current user
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`wishlist-${userId}`, JSON.stringify(updatedWishlist));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    wishlist: updatedWishlist,
    count: updatedWishlist.length,
  };
}

// Add product to wishlist
export function addToWishlist(userId: string, productId: string): WishlistResponse {
  if (!userId) {
    return {
      success: false,
      wishlist: [],
      count: 0,
      error: 'User not authenticated',
    };
  }

  const wishlist = getUserWishlist(userId);
  
  if (wishlist.some((item) => item.productId === productId)) {
    return {
      success: true,
      wishlist,
      count: wishlist.length,
    };
  }

  const updatedWishlist = [
    ...wishlist,
    {
      productId,
      addedAt: new Date().toISOString(),
    },
  ];

  userWishlists.set(userId, updatedWishlist);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`wishlist-${userId}`, JSON.stringify(updatedWishlist));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    wishlist: updatedWishlist,
    count: updatedWishlist.length,
  };
}

// Remove product from wishlist
export function removeFromWishlist(userId: string, productId: string): WishlistResponse {
  if (!userId) {
    return {
      success: false,
      wishlist: [],
      count: 0,
      error: 'User not authenticated',
    };
  }

  const wishlist = getUserWishlist(userId);
  const updatedWishlist = wishlist.filter((item) => item.productId !== productId);

  userWishlists.set(userId, updatedWishlist);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`wishlist-${userId}`, JSON.stringify(updatedWishlist));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    wishlist: updatedWishlist,
    count: updatedWishlist.length,
  };
}

// Clear wishlist
export function clearWishlist(userId: string): WishlistResponse {
  if (!userId) {
    return {
      success: false,
      wishlist: [],
      count: 0,
      error: 'User not authenticated',
    };
  }

  userWishlists.set(userId, []);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`wishlist-${userId}`);
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    wishlist: [],
    count: 0,
  };
}

// Get wishlist count
export function getWishlistCount(userId: string): number {
  return getUserWishlist(userId).length;
}

// Load wishlist from localStorage
export function loadWishlistFromStorage(userId: string): WishlistItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`wishlist-${userId}`);
    if (!stored) return [];

    const wishlist = JSON.parse(stored) as WishlistItem[];
    userWishlists.set(userId, wishlist);
    return wishlist;
  } catch {
    return [];
  }
}

// Get wishlist with product details
export function getWishlistWithProducts(userId: string): Array<{
  wishlistItem: WishlistItem;
  product: typeof ITEMS[0] | null;
}> {
  const wishlist = getUserWishlist(userId);

  return wishlist.map((item) => {
    const product = ITEMS.find((p) => p.id === item.productId);
    return {
      wishlistItem: item,
      product: product || null,
    };
  });
}

// Move item from wishlist to cart
export function moveToCart(userId: string, productId: string): {
  success: boolean;
  wishlist: WishlistItem[];
  error?: string;
} {
  const removeResult = removeFromWishlist(userId, productId);
  
  if (!removeResult.success) {
    return removeResult;
  }

  // In production, add to cart logic here
  return {
    success: true,
    wishlist: removeResult.wishlist,
  };
}

// Validate wishlist items (remove non-existent products)
export function validateWishlist(userId: string): {
  removed: number;
  valid: WishlistItem[];
} {
  const wishlist = getUserWishlist(userId);
  const validItems = wishlist.filter((item) =>
    ITEMS.some((p) => p.id === item.productId)
  );

  const removed = wishlist.length - validItems.length;
  userWishlists.set(userId, validItems);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`wishlist-${userId}`, JSON.stringify(validItems));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    removed,
    valid: validItems,
  };
}

// Simulate API call for wishlist toggle
export async function wishlistToggleAPI(userId: string, productId: string): Promise<WishlistResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return toggleWishlist(userId, productId);
}

// Get wishlist statistics
export function getWishlistStats(userId: string): {
  totalItems: number;
  totalValue: number;
  categories: Record<string, number>;
} {
  const wishlistWithProducts = getWishlistWithProducts(userId);
  const totalItems = wishlistWithProducts.filter((wp) => wp.product !== null).length;
  const totalValue = wishlistWithProducts.reduce((sum, wp) => {
    return sum + (wp.product?.price || 0);
  }, 0);

  const categories: Record<string, number> = {};
  wishlistWithProducts.forEach((wp) => {
    if (wp.product) {
      categories[wp.product.category] = (categories[wp.product.category] || 0) + 1;
    }
  });

  return {
    totalItems,
    totalValue,
    categories,
  };
}

// Export wishlist
export function exportWishlist(userId: string): string {
  const wishlist = getUserWishlist(userId);
  return JSON.stringify(wishlist, null, 2);
}

// Import wishlist
export function importWishlist(userId: string, json: string): WishlistResponse {
  try {
    const items = JSON.parse(json) as WishlistItem[];
    
    // Validate items
    const validItems = items.filter((item) =>
      ITEMS.some((p) => p.id === item.productId)
    );

    userWishlists.set(userId, validItems);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`wishlist-${userId}`, JSON.stringify(validItems));
      } catch {
        // Ignore storage errors
      }
    }

    return {
      success: true,
      wishlist: validItems,
      count: validItems.length,
    };
  } catch {
    return {
      success: false,
      wishlist: [],
      count: 0,
      error: 'Invalid wishlist data',
    };
  }
}
