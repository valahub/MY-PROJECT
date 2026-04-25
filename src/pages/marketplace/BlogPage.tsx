// Marketplace Blog Listing Page
// Shows all blog posts with filtering

import { Link, useSearchParams } from 'react-router-dom';
import { Calendar, User, Tag, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { BLOG_POSTS, getFeaturedBlogs, getBlogsByCategory, getBlogsByTag, getBlogCategories, getAllTags } from '@/lib/blog-data';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { buildBlogListJsonLd } from '@/lib/marketplace-seo';
import { useState, useEffect } from 'react';

// Self-heal helper functions
function healImage(image?: string): string {
  if (!image) {
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&auto=format';
  }
  return image;
}

function healDescription(title: string, excerpt?: string): string {
  if (excerpt && excerpt.length > 0) return excerpt;
  return title.length > 100 ? title.substring(0, 97) + '...' : title;
}

function healAuthor(author?: string): string {
  if (!author || author.trim().length === 0) return 'Editorial';
  return author;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlogPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const categoryFilter = searchParams.get('category');
  const tagFilter = searchParams.get('tag');

  useEffect(() => {
    // Simulate loading and error handling
    try {
      setIsLoading(true);
      setError(null);
      // Simulate API delay
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to load blog posts');
      setIsLoading(false);
    }
  }, [categoryFilter, tagFilter]);

  const featuredPosts = getFeaturedBlogs();
  let filteredPosts = BLOG_POSTS.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (categoryFilter) {
    filteredPosts = getBlogsByCategory(categoryFilter);
  } else if (tagFilter) {
    filteredPosts = getBlogsByTag(tagFilter);
  }

  const recentPosts = filteredPosts.slice(0, 12);
  const categories = getBlogCategories();
  const allTags = getAllTags();

  // SEO Meta
  const canonicalPath = '/marketplace/blog';
  const title = categoryFilter 
    ? `${categoryFilter} Blog Posts | ERP Vala`
    : tagFilter
    ? `${tagFilter} Blog Posts | ERP Vala`
    : 'Blog - Latest Marketplace News & Tutorials | ERP Vala';
  const description = categoryFilter
    ? `Read the latest ${categoryFilter} blog posts, tutorials, and guides on ERP Vala marketplace.`
    : tagFilter
    ? `Read the latest ${tagFilter} blog posts, tutorials, and guides on ERP Vala marketplace.`
    : 'Read the latest marketplace news, tutorials, product reviews, and development guides. Stay updated with ERP Vala blog.';
  const jsonLd = buildBlogListJsonLd(canonicalPath, filteredPosts.length);

  // Loading state
  if (isLoading) {
    return (
      <>
        <SeoMeta
          title="Loading Blog | ERP Vala"
          description="Loading blog posts..."
          canonicalPath={canonicalPath}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading blog posts...</p>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error) {
    return (
      <>
        <SeoMeta
          title="Blog Error | ERP Vala"
          description="Failed to load blog posts"
          canonicalPath={canonicalPath}
        />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Unable to Load Blog</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Link to="/marketplace" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Return to Marketplace
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SeoMeta
        title={title}
        description={description}
        keywords="marketplace blog, tutorials, product reviews, development guides"
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground">Marketplace Blog</h1>
            <p className="text-muted-foreground mt-2">
              News, tutorials, and stories from the ERP Vala community.
            </p>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/marketplace/blog"
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  !categoryFilter && !tagFilter
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-primary/20'
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  to={`/marketplace/blog?category=${cat}`}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-primary/20'
                  }`}
                >
                  {cat.toUpperCase()}
                </Link>
              ))}
            </div>
          </div>

          {/* Empty State */}
          {recentPosts.length === 0 && (
            <div className="text-center py-16">
              <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No blog posts available</h2>
              <p className="text-muted-foreground">
                {categoryFilter 
                  ? `No posts found in ${categoryFilter} category.`
                  : tagFilter
                  ? `No posts found with tag "${tagFilter}".`
                  : 'Check back later for new content.'}
              </p>
              {!categoryFilter && !tagFilter && (
                <Link to="/marketplace" className="inline-block mt-4 text-primary hover:underline">
                  Browse Marketplace
                </Link>
              )}
            </div>
          )}

          {/* Featured Posts */}
          {featuredPosts.length > 0 && !categoryFilter && !tagFilter && recentPosts.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-foreground mb-6">Featured Posts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/marketplace/blog/${post.slug}`}
                    className="group block rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Cover Image */}
                    <div className="h-48 bg-muted relative overflow-hidden">
                      {post.image ? (
                        <img 
                          src={healImage(post.image)} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <ImageIcon className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          {post.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {healDescription(post.title, post.excerpt)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{healAuthor(post.author)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {categoryFilter ? `${categoryFilter} Posts` : tagFilter ? `${tagFilter} Posts` : 'Recent Posts'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/marketplace/blog/${post.slug}`}
                    className="group block rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all overflow-hidden"
                  >
                    {/* Cover Image */}
                    <div className="h-48 bg-muted relative overflow-hidden">
                      {post.image ? (
                        <img 
                          src={healImage(post.image)} 
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <ImageIcon className="h-12 w-12 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className="px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                          {post.category.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {healDescription(post.title, post.excerpt)}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{healAuthor(post.author)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
