// Image SEO Engine
// Auto-generates alt text, compresses images, and optimizes for SEO

import { ITEMS } from '../marketplace-data';

export interface ImageSEOData {
  originalUrl: string;
  altText: string;
  optimizedUrl?: string;
  format: 'webp' | 'jpeg' | 'png' | 'original';
  size: number;
  width: number;
  height: number;
  processed: boolean;
}

export interface ImageOptimizationOptions {
  quality: number;
  format: 'webp' | 'jpeg' | 'png';
  maxWidth: number;
  maxHeight: number;
}

// Image SEO cache
const imageSEOCache = new Map<string, ImageSEOData>();

// Generate alt text for product image
export function generateAltText(productId: string): string {
  const product = ITEMS.find((item) => item.id === productId);
  if (!product) return 'Product image';

  // Format: "{product name} - {category} {subcategory}"
  const altText = `${product.title} - ${product.category} ${product.subcategory}`;
  
  // Clean up special characters
  return altText.replace(/[^\w\s-]/g, '').trim();
}

// Generate alt text for category image
export function generateCategoryAltText(category: string, subcategory?: string): string {
  if (subcategory) {
    return `${subcategory} - ${category} category image`;
  }
  return `${category} category image`;
}

// Generate alt text for author image
export function generateAuthorAltText(authorName: string): string {
  return `${authorName} - author profile picture`;
}

// Generate alt text for blog image
export function generateBlogAltText(blogTitle: string): string {
  return `${blogTitle} - blog featured image`;
}

// Optimize image URL (placeholder - in production, use image processing service)
export async function optimizeImage(
  imageUrl: string,
  options: ImageOptimizationOptions = {
    quality: 80,
    format: 'webp',
    maxWidth: 1200,
    maxHeight: 1200,
  }
): Promise<string> {
  // In production, integrate with image optimization service like:
  // - Cloudinary
  // - ImageKit
  // - imgix
  // - Next.js Image Optimization
  
  // For now, return original URL with query params for CDN optimization
  const url = new URL(imageUrl, 'https://erpvala.com');
  url.searchParams.set('q', options.quality.toString());
  url.searchParams.set('f', options.format);
  url.searchParams.set('w', options.maxWidth.toString());
  url.searchParams.set('h', options.maxHeight.toString());
  
  return url.toString();
}

// Process image for SEO
export async function processImageForSEO(
  imageUrl: string,
  context: 'product' | 'category' | 'author' | 'blog',
  contextId?: string
): Promise<ImageSEOData> {
  const cached = imageSEOCache.get(imageUrl);
  if (cached) return cached;

  let altText = '';
  
  switch (context) {
    case 'product':
      altText = contextId ? generateAltText(contextId) : 'Product image';
      break;
    case 'category':
      altText = contextId ? generateCategoryAltText(contextId) : 'Category image';
      break;
    case 'author':
      altText = contextId ? generateAuthorAltText(contextId) : 'Author image';
      break;
    case 'blog':
      altText = contextId ? generateBlogAltText(contextId) : 'Blog image';
      break;
  }

  const optimizedUrl = await optimizeImage(imageUrl);

  const data: ImageSEOData = {
    originalUrl: imageUrl,
    altText,
    optimizedUrl,
    format: 'webp',
    size: 0, // Would be filled by image processing service
    width: 1200,
    height: 1200,
    processed: true,
  };

  imageSEOCache.set(imageUrl, data);
  return data;
}

// Batch process all product images
export async function batchProcessProductImages(): Promise<ImageSEOData[]> {
  const results: ImageSEOData[] = [];

  for (const item of ITEMS) {
    const data = await processImageForSEO(item.thumbnail, 'product', item.id);
    results.push(data);
  }

  return results;
}

// Generate lazy loading HTML
export function generateLazyLoadingHTML(imageUrl: string, altText: string): string {
  return `<img src="${imageUrl}" alt="${altText}" loading="lazy" decoding="async" />`;
}

// Generate responsive image HTML
export function generateResponsiveImageHTML(
  imageUrl: string,
  altText: string,
  sizes: Array<{ width: number; height: number }> = [
    { width: 320, height: 320 },
    { width: 640, height: 640 },
    { width: 1200, height: 1200 },
  ]
): string {
  const srcset = sizes
    .map((size) => {
      const url = new URL(imageUrl, 'https://erpvala.com');
      url.searchParams.set('w', size.width.toString());
      url.searchParams.set('h', size.height.toString());
      return `${url.toString()} ${size.width}w`;
    })
    .join(', ');

  return `<img 
    src="${imageUrl}" 
    srcset="${srcset}" 
    alt="${altText}" 
    loading="lazy" 
    decoding="async" 
    sizes="(max-width: 640px) 320px, (max-width: 1200px) 640px, 1200px"
  />`;
}

// Generate WebP fallback HTML
export function generateWebPFallbackHTML(imageUrl: string, altText: string): string {
  const webpUrl = imageUrl.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  return `<picture>
    <source srcset="${webpUrl}" type="image/webp" />
    <img src="${imageUrl}" alt="${altText}" loading="lazy" decoding="async" />
  </picture>`;
}

// Validate alt text
export function validateAltText(altText: string): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!altText || altText.length === 0) {
    issues.push('Alt text is missing');
  }

  if (altText.length > 125) {
    issues.push('Alt text exceeds 125 characters');
  }

  if (altText.includes('.jpg') || altText.includes('.png')) {
    issues.push('Alt text contains file extension');
  }

  if (altText === 'image' || altText === 'photo') {
    issues.push('Alt text is too generic');
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

// Rename image file for SEO
export function renameImageForSEO(originalName: string, productName: string, category: string): string {
  const extension = originalName.split('.').pop();
  const seoName = `${productName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${extension}`;
  return seoName;
}

// Get image SEO statistics
export function getImageSEOStats(): {
  totalImages: number;
  processedImages: number;
  imagesWithAltText: number;
  imagesWithoutAltText: number;
  averageAltTextLength: number;
} {
  const images = Array.from(imageSEOCache.values());
  const totalImages = images.length;
  const processedImages = images.filter((i) => i.processed).length;
  const imagesWithAltText = images.filter((i) => i.altText && i.altText.length > 0).length;
  const imagesWithoutAltText = totalImages - imagesWithAltText;
  const averageAltTextLength = imagesWithAltText > 0
    ? images.reduce((sum, i) => sum + i.altText.length, 0) / imagesWithAltText
    : 0;

  return {
    totalImages,
    processedImages,
    imagesWithAltText,
    imagesWithoutAltText,
    averageAltTextLength,
  };
}

// Find images missing alt text
export function findImagesMissingAltText(): ImageSEOData[] {
  return Array.from(imageSEOCache.values()).filter((i) => !i.altText || i.altText.length === 0 || !validateAltText(i.altText).valid);
}

// Auto-fix missing alt text
export async function autoFixMissingAltText(): Promise<number> {
  const missing = findImagesMissingAltText();
  let fixed = 0;

  for (const image of missing) {
    // Try to infer context from URL
    const url = image.originalUrl;
    
    if (url.includes('/product/')) {
      const productId = url.split('/product/')[1]?.split('/')[0];
      if (productId) {
        const data = await processImageForSEO(url, 'product', productId);
        imageSEOCache.set(url, data);
        fixed++;
      }
    }
  }

  return fixed;
}

// Generate image sitemap
export function generateImageSitemap(): string {
  const images = Array.from(imageSEOCache.values());
  const now = new Date().toISOString().split('T')[0];

  const urlEntries = images.map((image) => {
    return `  <url>
    <loc>${image.originalUrl}</loc>
    <lastmod>${now}</lastmod>
    <image:image>
      <image:loc>${image.optimizedUrl || image.originalUrl}</image:loc>
      <image:caption>${image.altText}</image:caption>
    </image:image>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
}

// Export image SEO data
export function exportImageSEOData(): string {
  return JSON.stringify(Array.from(imageSEOCache.entries()), null, 2);
}

// Import image SEO data
export function importImageSEOData(json: string): void {
  const data = JSON.parse(json) as Array<[string, ImageSEOData]>;
  data.forEach(([url, imageData]) => {
    imageSEOCache.set(url, imageData);
  });
}

// Clear image SEO cache
export function clearImageSEOCache(): void {
  imageSEOCache.clear();
}

// Schedule periodic image optimization
export function scheduleImageOptimization(intervalDays: number = 30): number {
  return setInterval(async () => {
    await batchProcessProductImages();
  }, intervalDays * 24 * 60 * 60 * 1000) as unknown as number;
}

// Generate image compression report
export function generateCompressionReport(): {
  summary: string;
  stats: ReturnType<typeof getImageSEOStats>;
  recommendations: string[];
} {
  const stats = getImageSEOStats();
  const recommendations: string[] = [];

  if (stats.imagesWithoutAltText > 0) {
    recommendations.push(`Add alt text to ${stats.imagesWithoutAltText} images`);
  }

  if (stats.averageAltTextLength < 50) {
    recommendations.push('Improve alt text descriptions for better SEO');
  }

  if (stats.processedImages < stats.totalImages) {
    recommendations.push('Process remaining images for optimization');
  }

  return {
    summary: `Processed ${stats.processedImages} of ${stats.totalImages} images. ${stats.imagesWithAltText} have alt text.`,
    stats,
    recommendations,
  };
}
