// Content Spin Engine
// Generates multiple variations to avoid duplicate SEO content

interface SpinTemplate {
  pattern: string;
  replacements: string[][];
}

interface ContentVariation {
  id: string;
  original: string;
  variation: string;
  type: 'title' | 'description' | 'summary';
  createdAt: string;
}

// Title spin templates
const titleTemplates: SpinTemplate[] = [
  {
    pattern: '{prefix} {topic} {suffix}',
    replacements: [
      ['Top 10', 'Best', 'Ultimate', 'Complete Guide to', 'Essential'],
      ['{topic}'],
      ['in 2026', 'You Need to Know', 'for Success', 'That Work', 'Updated'],
    ],
  },
  {
    pattern: '{action} {topic} {context}',
    replacements: [
      ['How to Master', 'Learn', 'Discover', 'Explore', 'Get Started with'],
      ['{topic}'],
      ['Today', 'in Minutes', 'Step by Step', 'Like a Pro', 'from Scratch'],
    ],
  },
  {
    pattern: '{topic} {benefit}',
    replacements: [
      ['{topic}'],
      ['for Business', 'for Beginners', 'That Boosts Productivity', 'Made Easy', 'Explained'],
    ],
  },
];

// Description spin templates
const descriptionTemplates: SpinTemplate[] = [
  {
    pattern: '{intro} {topic} {details} {cta}',
    replacements: [
      ['Discover the power of', 'Explore our comprehensive guide to', 'Learn everything about', 'Unlock the potential of'],
      ['{topic}'],
      ['with expert tips, best practices, and real-world examples.', 'through our detailed analysis and recommendations.', 'using proven strategies and techniques.', 'with step-by-step instructions and insights.'],
      ['Start your journey today.', 'Boost your productivity now.', 'Get ahead of the competition.', 'Transform your workflow.'],
    ],
  },
  {
    pattern: '{topic} {benefit} {details}',
    replacements: [
      ['{topic}'],
      ['is essential for modern development', 'offers powerful features', 'provides unmatched flexibility', 'delivers exceptional results'],
      ['and helps you achieve your goals faster.', 'with our expert guidance and resources.', 'through its intuitive design and robust capabilities.', 'by streamlining your workflow and saving time.'],
    ],
  },
];

// Summary spin templates
const summaryTemplates: SpinTemplate[] = [
  {
    pattern: '{topic} {value} {usage}',
    replacements: [
      ['{topic}'],
      ['provides exceptional value', 'delivers outstanding performance', 'offers incredible features', 'brings powerful capabilities'],
      ['for developers worldwide.', 'in various project scenarios.', 'across different use cases.', 'for businesses of all sizes.'],
    ],
  },
  {
    pattern: '{benefit} {topic} {context}',
    replacements: [
      ['Maximize your productivity with', 'Achieve better results with', 'Streamline your workflow using', 'Enhance your projects with'],
      ['{topic}'],
      ['and experience the difference.', 'with our comprehensive support.', 'through its advanced features.', 'in record time.'],
    ],
  },
];

function applyTemplate(template: SpinTemplate, topic: string): string {
  let result = template.pattern;
  
  template.replacements.forEach((replacementGroup) => {
    const options = replacementGroup.map((opt) => opt.replace('{topic}', topic));
    const selected = options[Math.floor(Math.random() * options.length)];
    result = result.replace(replacementGroup[0].includes('{') ? replacementGroup[0] : replacementGroup[0], selected);
  });
  
  // Clean up remaining placeholders
  result = result.replace(/{topic}/g, topic);
  
  return result;
}

export function spinTitle(original: string, topic: string): string {
  const template = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  return applyTemplate(template, topic);
}

export function spinDescription(original: string, topic: string): string {
  const template = descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
  return applyTemplate(template, topic);
}

export function spinSummary(original: string, topic: string): string {
  const template = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)];
  return applyTemplate(template, topic);
}

export function generateContentVariations(
  original: string,
  topic: string,
  type: 'title' | 'description' | 'summary',
  count: number = 3
): ContentVariation[] {
  const variations: ContentVariation[] = [];
  
  for (let i = 0; i < count; i++) {
    let variation: string;
    
    switch (type) {
      case 'title':
        variation = spinTitle(original, topic);
        break;
      case 'description':
        variation = spinDescription(original, topic);
        break;
      case 'summary':
        variation = spinSummary(original, topic);
        break;
    }
    
    variations.push({
      id: `${type}-${Date.now()}-${i}`,
      original,
      variation,
      type,
      createdAt: new Date().toISOString(),
    });
  }
  
  return variations;
}

// Store variations in memory (in production, use DB)
const variationStore = new Map<string, ContentVariation[]>();

export function saveVariations(variations: ContentVariation[]): void {
  variations.forEach((v) => {
    if (!variationStore.has(v.original)) {
      variationStore.set(v.original, []);
    }
    variationStore.get(v.original)!.push(v);
  });
}

export function getVariations(original: string): ContentVariation[] {
  return variationStore.get(original) || [];
}

export function rotateVariation(original: string): string | null {
  const variations = getVariations(original);
  if (variations.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex].variation;
}

// Batch spin for multiple items
export function batchSpinContent(
  items: Array<{ original: string; topic: string }>,
  type: 'title' | 'description' | 'summary'
): Array<{ original: string; variations: string[] }> {
  return items.map((item) => ({
    original: item.original,
    variations: generateContentVariations(item.original, item.topic, type).map((v) => v.variation),
  }));
}

// Check for duplicate content
export function isDuplicateContent(content1: string, content2: string, threshold: number = 0.9): boolean {
  const words1 = content1.toLowerCase().split(/\s+/);
  const words2 = content2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter((word) => words2.includes(word));
  const similarity = intersection.length / Math.max(words1.length, words2.length);
  
  return similarity >= threshold;
}

// Get unique variation (avoid duplicates)
export function getUniqueVariation(
  original: string,
  topic: string,
  type: 'title' | 'description' | 'summary',
  existingContent: string[]
): string {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const variation = generateContentVariations(original, topic, type, 1)[0].variation;
    
    const isDuplicate = existingContent.some((existing) =>
      isDuplicateContent(variation, existing)
    );
    
    if (!isDuplicate) {
      return variation;
    }
    
    attempts++;
  }
  
  // Return original if no unique variation found
  return original;
}
