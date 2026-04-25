// Cart Integration System
// Add to cart, count tracking, and persistent storage

import { ITEMS } from '../marketplace-data';

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: string;
}

export interface CartResponse {
  success: boolean;
  cart: CartItem[];
  count: number;
  total: number;
  error?: string;
}

// In-memory cart storage (in production, use DB)
const userCarts = new Map<string, CartItem[]>();

// Get user's cart
export function getUserCart(userId: string): CartItem[] {
  return userCarts.get(userId) || [];
}

// Get cart count
export function getCartCount(userId: string): number {
  const cart = getUserCart(userId);
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// Get cart total
export function getCartTotal(userId: string): number {
  const cart = getUserCart(userId);
  return cart.reduce((sum, item) => {
    const product = ITEMS.find((p) => p.id === item.productId);
    return sum + (product?.price || 0) * item.quantity;
  }, 0);
}

// Add product to cart
export function addToCart(userId: string, productId: string, quantity: number = 1): CartResponse {
  if (!userId) {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'User not authenticated',
    };
  }

  const product = ITEMS.find((p) => p.id === productId);
  if (!product) {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'Product not found',
    };
  }

  const cart = getUserCart(userId);
  const existingIndex = cart.findIndex((item) => item.productId === productId);

  let updatedCart: CartItem[];

  if (existingIndex > -1) {
    // Update quantity
    updatedCart = cart.map((item, index) =>
      index === existingIndex
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    // Add new item
    updatedCart = [
      ...cart,
      {
        productId,
        quantity,
        addedAt: new Date().toISOString(),
      },
    ];
  }

  userCarts.set(userId, updatedCart);

  // Persist to localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(updatedCart));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    cart: updatedCart,
    count: getCartCount(userId),
    total: getCartTotal(userId),
  };
}

// Remove product from cart
export function removeFromCart(userId: string, productId: string): CartResponse {
  if (!userId) {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'User not authenticated',
    };
  }

  const cart = getUserCart(userId);
  const updatedCart = cart.filter((item) => item.productId !== productId);

  userCarts.set(userId, updatedCart);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(updatedCart));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    cart: updatedCart,
    count: getCartCount(userId),
    total: getCartTotal(userId),
  };
}

// Update cart item quantity
export function updateCartQuantity(userId: string, productId: string, quantity: number): CartResponse {
  if (!userId) {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'User not authenticated',
    };
  }

  if (quantity <= 0) {
    return removeFromCart(userId, productId);
  }

  const cart = getUserCart(userId);
  const updatedCart = cart.map((item) =>
    item.productId === productId ? { ...item, quantity } : item
  );

  userCarts.set(userId, updatedCart);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(updatedCart));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    cart: updatedCart,
    count: getCartCount(userId),
    total: getCartTotal(userId),
  };
}

// Clear cart
export function clearCart(userId: string): CartResponse {
  if (!userId) {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'User not authenticated',
    };
  }

  userCarts.set(userId, []);

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`cart-${userId}`);
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    cart: [],
    count: 0,
    total: 0,
  };
}

// Load cart from localStorage
export function loadCartFromStorage(userId: string): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(`cart-${userId}`);
    if (!stored) return [];

    const cart = JSON.parse(stored) as CartItem[];
    userCarts.set(userId, cart);
    return cart;
  } catch {
    return [];
  }
}

// Get cart with product details
export function getCartWithProducts(userId: string): Array<{
  cartItem: CartItem;
  product: typeof ITEMS[0] | null;
  subtotal: number;
}> {
  const cart = getUserCart(userId);

  return cart.map((item) => {
    const product = ITEMS.find((p) => p.id === item.productId);
    return {
      cartItem: item,
      product: product || null,
      subtotal: (product?.price || 0) * item.quantity,
    };
  });
}

// Validate cart items (remove non-existent products)
export function validateCart(userId: string): {
  removed: number;
  valid: CartItem[];
} {
  const cart = getUserCart(userId);
  const validItems = cart.filter((item) =>
    ITEMS.some((p) => p.id === item.productId)
  );

  const removed = cart.length - validItems.length;
  userCarts.set(userId, validItems);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(validItems));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    removed,
    valid: validItems,
  };
}

// Simulate API call for add to cart
export async function addToCartAPI(userId: string, productId: string, quantity: number = 1): Promise<CartResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200));

  return addToCart(userId, productId, quantity);
}

// Move item from wishlist to cart
export async function moveWishlistToCart(userId: string, productId: string): Promise<CartResponse> {
  const addResult = addToCart(userId, productId, 1);
  
  if (!addResult.success) {
    return addResult;
  }

  // Remove from wishlist (simplified - in production use proper import)
  // const { removeFromWishlist } = await import('./wishlist-system');
  // removeFromWishlist(userId, productId);

  return addResult;
}

// Get cart statistics
export function getCartStats(userId: string): {
  totalItems: number;
  totalValue: number;
  uniqueProducts: number;
  categories: Record<string, number>;
} {
  const cartWithProducts = getCartWithProducts(userId);
  const totalItems = cartWithProducts.reduce((sum, cp) => sum + cp.cartItem.quantity, 0);
  const totalValue = cartWithProducts.reduce((sum, cp) => sum + cp.subtotal, 0);
  const uniqueProducts = cartWithProducts.filter((cp) => cp.product !== null).length;

  const categories: Record<string, number> = {};
  cartWithProducts.forEach((cp) => {
    if (cp.product) {
      categories[cp.product.category] = (categories[cp.product.category] || 0) + cp.cartItem.quantity;
    }
  });

  return {
    totalItems,
    totalValue,
    uniqueProducts,
    categories,
  };
}

// Export cart
export function exportCart(userId: string): string {
  const cart = getUserCart(userId);
  return JSON.stringify(cart, null, 2);
}

// Import cart
export function importCart(userId: string, json: string): CartResponse {
  try {
    const items = JSON.parse(json) as CartItem[];
    
    // Validate items
    const validItems = items.filter((item) =>
      ITEMS.some((p) => p.id === item.productId)
    );

    userCarts.set(userId, validItems);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`cart-${userId}`, JSON.stringify(validItems));
      } catch {
        // Ignore storage errors
      }
    }

    return {
      success: true,
      cart: validItems,
      count: getCartCount(userId),
      total: getCartTotal(userId),
    };
  } catch {
    return {
      success: false,
      cart: [],
      count: 0,
      total: 0,
      error: 'Invalid cart data',
    };
  }
}

// Merge guest cart with user cart after login
export function mergeCartAfterLogin(userId: string, guestCart: CartItem[]): CartResponse {
  const userCart = getUserCart(userId);
  const mergedCart = [...userCart];

  guestCart.forEach((guestItem) => {
    const existingIndex = mergedCart.findIndex((item) => item.productId === guestItem.productId);
    
    if (existingIndex > -1) {
      mergedCart[existingIndex].quantity += guestItem.quantity;
    } else {
      mergedCart.push(guestItem);
    }
  });

  userCarts.set(userId, mergedCart);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`cart-${userId}`, JSON.stringify(mergedCart));
      localStorage.removeItem('cart-guest');
    } catch {
      // Ignore storage errors
    }
  }

  return {
    success: true,
    cart: mergedCart,
    count: getCartCount(userId),
    total: getCartTotal(userId),
  };
}
