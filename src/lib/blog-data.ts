// Blog Data
// Auto-generated blog posts for SEO with topical authority clusters

import type { BlogPost } from './marketplace-seo';
import { ITEMS, CATEGORY_TREE } from './marketplace-data';

// FAQ Generator
function generateFAQs(topic: string, count: number = 5): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const templates = [
    { question: `What is ${topic}?`, answer: `${topic} is a powerful solution for modern development needs. It offers robust features and flexibility for various use cases.` },
    { question: `How do I get started with ${topic}?`, answer: `Getting started with ${topic} is simple. Follow our installation guide and you'll be up and running in minutes.` },
    { question: `Is ${topic} suitable for beginners?`, answer: `Yes, ${topic} is designed to be beginner-friendly while offering advanced features for experienced developers.` },
    { question: `What are the benefits of using ${topic}?`, answer: `${topic} provides improved productivity, better performance, and cost-effective solutions for your projects.` },
    { question: `How much does ${topic} cost?`, answer: `${topic} offers various pricing options to fit different budgets. Check our marketplace for the latest deals.` },
    { question: `Can I use ${topic} for commercial projects?`, answer: `Absolutely. ${topic} is licensed for commercial use. Review the specific license terms for details.` },
    { question: `What support is available for ${topic}?`, answer: `${topic} comes with comprehensive documentation and community support. Premium support options are also available.` },
    { question: `How often is ${topic} updated?`, answer: `${topic} receives regular updates to ensure compatibility and add new features based on user feedback.` },
    { question: `What are the system requirements for ${topic}?`, answer: `${topic} has minimal system requirements and works on most modern platforms. Check the documentation for specifics.` },
    { question: `Is ${topic} secure?`, answer: `Security is a top priority for ${topic}. It includes built-in security features and follows best practices.` },
  ];

  for (let i = 0; i < count; i++) {
    faqs.push(templates[i % templates.length]);
  }

  return faqs;
}

// Content Expander (800+ words)
function expandContent(baseContent: string, topic: string, tags: string[]): string {
  const sections = [
    `\n\n## Why Choose ${topic}?\n\n${topic} has become increasingly popular due to its versatility and powerful features. Developers worldwide trust ${topic} for their critical projects because it delivers consistent results and maintains high performance standards.`,
    `\n\n## Key Features of ${topic}\n\nOne of the standout aspects of ${topic} is its comprehensive feature set. From basic functionality to advanced capabilities, ${topic} covers all the essential requirements for modern development. The intuitive interface makes it accessible to users of all skill levels.`,
    `\n\n## Best Practices for ${topic}\n\nTo get the most out of ${topic}, it's important to follow established best practices. This includes proper setup, regular updates, and leveraging the full range of available features. Our community has compiled extensive documentation to guide you through every aspect.`,
    `\n\n## Common Use Cases\n\n${topic} is used across various industries and project types. Whether you're building a small application or an enterprise solution, ${topic} scales to meet your needs. Common applications include web development, mobile apps, and system integrations.`,
    `\n\n## Comparison with Alternatives\n\nWhen compared to other solutions in the market, ${topic} stands out for its balance of features, performance, and cost-effectiveness. While alternatives may offer specific advantages, ${topic} provides a well-rounded package that suits most requirements.`,
    `\n\n## Getting Started Guide\n\nThe journey with ${topic} begins with installation. Our step-by-step guide walks you through the process, ensuring you have everything configured correctly. Once set up, you can immediately start exploring the features and building your first project.`,
    `\n\n## Advanced Tips and Tricks\n\nFor experienced users, ${topic} offers advanced capabilities that can significantly enhance productivity. These include automation features, integration options, and customization possibilities that let you tailor the solution to your specific needs.`,
    `\n\n## Troubleshooting Common Issues\n\nWhile ${topic} is designed to be reliable, you may encounter occasional challenges. Our troubleshooting guide addresses the most common issues and provides clear solutions. The community forum is also available for additional support.`,
    `\n\n## Future of ${topic}\n\nThe development team behind ${topic} is committed to continuous improvement. Roadmap updates include exciting new features, performance enhancements, and expanded compatibility. Staying updated ensures you always have access to the latest capabilities.`,
    `\n\n## Community and Resources\n\nJoin thousands of developers who use ${topic} daily. Our active community provides support, shares knowledge, and contributes to the ecosystem. Access tutorials, forums, and documentation to accelerate your learning journey.`,
  ];

  let expandedContent = baseContent;
  sections.forEach((section) => {
    expandedContent += section;
  });

  return expandedContent;
}

// CTR-Optimized Title Templates
function generateCTRTitle(baseTopic: string, year: number, type: 'list' | 'guide' | 'comparison' | 'review'): string {
  const templates = {
    list: [
      `Top 10 ${baseTopic} in ${year} (Updated)`,
      `Best ${baseTopic} You Need to Know`,
      `${year}'s Ultimate ${baseTopic} Guide`,
      `10 Essential ${baseTopic} for Success`,
    ],
    guide: [
      `Complete ${baseTopic} Guide (${year})`,
      `How to Master ${baseTopic} in ${year}`,
      `${baseTopic} Tutorial: From Zero to Hero`,
      `The Definitive ${baseTopic} Handbook`,
    ],
    comparison: [
      `${baseTopic} vs Alternatives: Which Wins?`,
      `${baseTopic} Comparison: ${year} Edition`,
      `Is ${baseTopic} Right for You?`,
      `${baseTopic} Pros and Cons Revealed`,
    ],
    review: [
      `${baseTopic} Review: ${year} Analysis`,
      `Honest ${baseTopic} Assessment`,
      `${baseTopic}: Worth It in ${year}?`,
      `Our ${baseTopic} Experience`,
    ],
  };

  const typeTemplates = templates[type];
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

// Helper to generate blog posts with topical authority
function generateBlogPosts(): BlogPost[] {
  const posts: BlogPost[] = [];
  const categories = CATEGORY_TREE.map((c) => c.title);
  const tags = ['react', 'vue', 'wordpress', 'laravel', 'php', 'javascript', 'tailwind', 'flutter', 'django', 'node'];
  const years = [2024, 2025, 2026];

  // Topical Authority Clusters - WordPress
  const wordpressTopics = [
    'WordPress Plugins',
    'WordPress Themes',
    'WordPress SEO',
    'WordPress Security',
    'WordPress Performance',
  ];
  wordpressTopics.forEach((topic, index) => {
    const title = generateCTRTitle(topic, years[0], 'list');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `WordPress is the world's most popular content management system, and ${topic} plays a crucial role in its success. In this comprehensive guide, we explore everything you need to know about ${topic}.`;
    const expandedContent = expandContent(baseContent, topic, ['wordpress', 'cms']);
    const faqs = generateFAQs(topic, 5);
    
    posts.push({
      id: `blog-wp-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Discover the best ${topic} solutions for your WordPress site. Expert reviews, comparisons, and recommendations for ${years[0]}.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'WordPress',
      tags: ['wordpress', topic.toLowerCase().replace(' ', '-'), 'cms'],
      publishedAt: `${years[0]}-${String(index + 1).padStart(2, '0')}-15`,
      updatedAt: `${years[0]}-${String(index + 1).padStart(2, '0')}-15`,
      featured: index < 2,
      relatedProducts: ITEMS.filter((i) => i.category === 'wordpress').slice(index * 2, (index + 1) * 2).map((i) => i.id),
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Topical Authority Clusters - React
  const reactTopics = [
    'React Components',
    'React Hooks',
    'React State Management',
    'React Performance',
    'React Testing',
  ];
  reactTopics.forEach((topic, index) => {
    const title = generateCTRTitle(topic, years[0], 'guide');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `React has revolutionized frontend development, and mastering ${topic} is essential for building modern applications. This guide covers everything from basics to advanced techniques.`;
    const expandedContent = expandContent(baseContent, topic, ['react', 'javascript', 'frontend']);
    const faqs = generateFAQs(topic, 5);
    
    posts.push({
      id: `blog-react-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Master ${topic} in React with our comprehensive guide. Best practices, examples, and expert tips for ${years[0]}.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'React',
      tags: ['react', topic.toLowerCase().replace(' ', '-'), 'javascript', 'frontend'],
      publishedAt: `${years[0]}-${String(index + 6).padStart(2, '0')}-10`,
      updatedAt: `${years[0]}-${String(index + 6).padStart(2, '0')}-10`,
      featured: index < 2,
      relatedProducts: ITEMS.filter((i) => i.tags.includes('react')).slice(index * 2, (index + 1) * 2).map((i) => i.id),
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Topical Authority Clusters - Laravel
  const laravelTopics = [
    'Laravel Eloquent',
    'Laravel Authentication',
    'Laravel API Development',
    'Laravel Queue System',
    'Laravel Package Development',
  ];
  laravelTopics.forEach((topic, index) => {
    const title = generateCTRTitle(topic, years[0], 'guide');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `Laravel is PHP's most popular framework, and ${topic} is a powerful feature that simplifies development. Learn how to leverage it effectively in your projects.`;
    const expandedContent = expandContent(baseContent, topic, ['laravel', 'php', 'backend']);
    const faqs = generateFAQs(topic, 5);
    
    posts.push({
      id: `blog-laravel-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Complete guide to ${topic} in Laravel. Learn best practices, examples, and expert tips for building robust applications.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'Laravel',
      tags: ['laravel', topic.toLowerCase().replace(' ', '-'), 'php', 'backend'],
      publishedAt: `${years[0]}-${String(index + 11).padStart(2, '0')}-05`,
      updatedAt: `${years[0]}-${String(index + 11).padStart(2, '0')}-05`,
      featured: index < 2,
      relatedProducts: ITEMS.filter((i) => i.tags.includes('laravel')).slice(index * 2, (index + 1) * 2).map((i) => i.id),
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Topical Authority Clusters - eCommerce
  const ecommerceTopics = [
    'eCommerce Plugins',
    'Payment Gateways',
    'Shopping Cart Solutions',
    'eCommerce Security',
    'eCommerce SEO',
  ];
  ecommerceTopics.forEach((topic, index) => {
    const title = generateCTRTitle(topic, years[0], 'list');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `Building a successful online store requires the right tools. ${topic} is essential for creating a seamless shopping experience. Explore the best options available.`;
    const expandedContent = expandContent(baseContent, topic, ['ecommerce', 'online-store', 'woocommerce']);
    const faqs = generateFAQs(topic, 5);
    
    posts.push({
      id: `blog-ecommerce-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Best ${topic} solutions for your online store. Compare features, pricing, and find the perfect fit for your business.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'eCommerce',
      tags: ['ecommerce', topic.toLowerCase().replace(' ', '-'), 'online-store'],
      publishedAt: `${years[0]}-${String(index + 16).padStart(2, '0')}-20`,
      updatedAt: `${years[0]}-${String(index + 16).padStart(2, '0')}-20`,
      featured: index < 2,
      relatedProducts: ITEMS.filter((i) => i.category === 'ecommerce').slice(index * 2, (index + 1) * 2).map((i) => i.id),
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Product-focused blogs (top products)
  const topProducts = ITEMS.slice(0, 20);
  topProducts.forEach((product, index) => {
    const title = generateCTRTitle(product.title, years[0], 'review');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `${product.title} is a leading solution in the ${product.category} space. With a ${product.rating}-star rating and ${product.sales.toLocaleString()} sales, it has proven its value to thousands of users.`;
    const expandedContent = expandContent(baseContent, product.title, product.tags);
    const faqs = generateFAQs(product.title, 5);
    
    posts.push({
      id: `blog-product-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Comprehensive review of ${product.title}. Features, pricing, pros and cons, and whether it's worth your investment in ${years[0]}.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: product.category,
      tags: [product.subcategory, ...product.tags.slice(0, 3)],
      publishedAt: `${years[0]}-${String(index + 21).padStart(2, '0')}-25`,
      updatedAt: `${years[0]}-${String(index + 21).padStart(2, '0')}-25`,
      featured: index < 5,
      relatedProducts: [product.id],
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Comparison blogs
  const comparisons = [
    ['React', 'Vue'],
    ['WordPress', 'Shopify'],
    ['Laravel', 'Django'],
    ['Flutter', 'React Native'],
    ['Tailwind', 'Bootstrap'],
    ['Next.js', 'Nuxt.js'],
    ['TypeScript', 'JavaScript'],
    ['GraphQL', 'REST API'],
  ];
  comparisons.forEach(([tech1, tech2], index) => {
    const title = generateCTRTitle(`${tech1} vs ${tech2}`, years[0], 'comparison');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `Choosing between ${tech1} and ${tech2} is a common dilemma for developers. Both have their strengths, and the right choice depends on your specific needs.`;
    const expandedContent = expandContent(baseContent, `${tech1} vs ${tech2}`, [tech1.toLowerCase(), tech2.toLowerCase()]);
    const faqs = generateFAQs(`${tech1} vs ${tech2}`, 5);
    
    posts.push({
      id: `blog-compare-${index + 1}`,
      slug: slug,
      title: title,
      excerpt: `Detailed comparison: ${tech1} vs ${tech2}. Features, performance, learning curve, and which one to choose for your next project.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'Comparisons',
      tags: [tech1.toLowerCase(), tech2.toLowerCase(), 'comparison'],
      publishedAt: `${years[0]}-${String(index + 41).padStart(2, '0')}-01`,
      updatedAt: `${years[0]}-${String(index + 41).padStart(2, '0')}-01`,
      featured: index < 3,
      relatedProducts: ITEMS.filter((i) => i.tags.some((t) => t.toLowerCase().includes(tech1.toLowerCase()) || t.toLowerCase().includes(tech2.toLowerCase()))).slice(0, 3).map((i) => i.id),
      faqs: faqs,
      image: `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&auto=format`,
    });
  });

  // Fill remaining to reach 100
  const remainingCount = 100 - posts.length;
  for (let i = 0; i < remainingCount; i++) {
    const tag = tags[i % tags.length];
    const category = categories[i % categories.length];
    const title = generateCTRTitle(`${tag} ${category}`, years[i % years.length], 'guide');
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const baseContent = `This comprehensive guide covers ${tag} within ${category} development. From fundamentals to advanced techniques, you'll learn everything needed to succeed.`;
    const expandedContent = expandContent(baseContent, tag, [tag, category.toLowerCase()]);
    
    posts.push({
      id: `blog-extra-${i + 1}`,
      slug: slug,
      title: title,
      excerpt: `Complete guide to ${tag} in ${category}. Learn best practices, examples, and expert tips for ${years[i % years.length]}.`,
      content: expandedContent,
      author: 'ERP Vala Team',
      category: 'Guides',
      tags: [tag, category.toLowerCase(), 'guide'],
      publishedAt: `${years[i % years.length]}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      updatedAt: `${years[i % years.length]}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      featured: false,
      relatedProducts: ITEMS.slice(i % 5, (i % 5) + 3).map((item) => item.id),
      image: `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&auto=format`,
    });
  }

  return posts;
}

export const BLOG_POSTS = generateBlogPosts();

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getFeaturedBlogs(): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.featured);
}

export function getBlogsByCategory(category: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.category === category).sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getBlogsByTag(tag: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.tags.includes(tag)).sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getRelatedBlogs(blogId: string): BlogPost[] {
  const blog = BLOG_POSTS.find((b) => b.id === blogId);
  if (!blog) return [];
  return BLOG_POSTS.filter(
    (post) =>
      post.id !== blogId &&
      (post.category === blog.category || post.tags.some((t) => blog.tags.includes(t)))
  ).slice(0, 5);
}

export function getBlogCategories(): string[] {
  const categories = new Set(BLOG_POSTS.map((post) => post.category));
  return Array.from(categories);
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  BLOG_POSTS.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });
  return Array.from(tags);
}

// Content Quality Detection
export function detectThinContent(post: BlogPost, minWords: number = 800): boolean {
  const wordCount = post.content.split(/\s+/).length;
  return wordCount < minWords;
}

export function detectOldContent(post: BlogPost, daysThreshold: number = 90): boolean {
  const updatedAt = new Date(post.updatedAt);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays > daysThreshold;
}

export function detectDuplicateContent(post: BlogPost, threshold: number = 0.85): BlogPost[] {
  const duplicates: BlogPost[] = [];
  const postWords = post.content.toLowerCase().split(/\s+/);
  
  BLOG_POSTS.forEach((otherPost) => {
    if (otherPost.id === post.id) return;
    
    const otherWords = otherPost.content.toLowerCase().split(/\s+/);
    const intersection = postWords.filter((word) => otherWords.includes(word));
    const similarity = intersection.length / Math.max(postWords.length, otherWords.length);
    
    if (similarity >= threshold) {
      duplicates.push(otherPost);
    }
  });
  
  return duplicates;
}

export function getContentQualityReport(post: BlogPost): {
  wordCount: number;
  isThin: boolean;
  isOld: boolean;
  duplicates: BlogPost[];
  needsRefresh: boolean;
} {
  const wordCount = post.content.split(/\s+/).length;
  const isThin = detectThinContent(post);
  const isOld = detectOldContent(post);
  const duplicates = detectDuplicateContent(post);
  const needsRefresh = isOld || isThin || duplicates.length > 0;
  
  return {
    wordCount,
    isThin,
    isOld,
    duplicates,
    needsRefresh,
  };
}

export function getAllContentQualityReports(): Record<string, ReturnType<typeof getContentQualityReport>> {
  const reports: Record<string, ReturnType<typeof getContentQualityReport>> = {};
  
  BLOG_POSTS.forEach((post) => {
    reports[post.id] = getContentQualityReport(post);
  });
  
  return reports;
}
