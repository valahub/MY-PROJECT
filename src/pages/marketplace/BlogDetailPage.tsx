// Marketplace Blog Detail Page
// Shows individual blog post with SEO

import { Link, useParams } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Share2, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { getBlogBySlug, getRelatedBlogs, BLOG_POSTS, getBlogsByCategory } from '@/lib/blog-data';
import { ITEMS } from '@/lib/marketplace-data';
import { ItemCard } from '@/components/marketplace/ItemCard';
import { SeoMeta } from '@/components/seo/SeoMeta';
import { buildBlogMeta, buildBlogJsonLd, buildBlogFaqJsonLd } from '@/lib/marketplace-seo';
import { useState, useEffect } from 'react';

// Slug validation function
function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9-]+$/;
  return slugRegex.test(slug);
}

// Self-heal helper functions
function healImage(image?: string): string {
  if (!image) {
    return 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=400&fit=crop&auto=format';
  }
  return image;
}

function healAuthor(author?: string): string {
  if (!author || author.trim().length === 0) return 'Editorial';
  return author;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Validate slug
  const validSlug = slug && isValidSlug(slug) ? slug : null;
  const post = validSlug ? getBlogBySlug(validSlug) : undefined;
  const relatedBlogs = post ? getRelatedBlogs(post.id) : [];
  const relatedProducts = post
    ? ITEMS.filter((item) => post.relatedProducts.includes(item.id))
    : [];
  const categoryBlogs = post ? getBlogsByCategory(post.category).filter((b) => b.id !== post.id).slice(0, 3) : [];

  useEffect(() => {
    try {
      setIsLoading(true);
      setError(null);
      // Simulate loading
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 100);
      return () => clearTimeout(timer);
    } catch (err) {
      setError('Failed to load blog post');
      setIsLoading(false);
    }
  }, [slug]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Unable to Load Blog</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link to="/marketplace/blog" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Invalid slug or post not found
  if (!post || !validSlug) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Blog post not found</h1>
          <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
          <Link to="/marketplace/blog" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // SEO Meta
  const seoMeta = buildBlogMeta(post);
  const jsonLd = buildBlogJsonLd(post, seoMeta.canonicalPath);
  const faqJsonLd = post.faqs ? buildBlogFaqJsonLd(post.faqs) : null;

  return (
    <>
      <SeoMeta
        title={seoMeta.title}
        description={seoMeta.description}
        keywords={seoMeta.keywords}
        canonicalPath={seoMeta.canonicalPath}
        jsonLd={faqJsonLd ? [jsonLd, faqJsonLd] : jsonLd}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <Link
              to="/marketplace/blog"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to blog
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Cover Image */}
            {post.image && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img 
                  src={healImage(post.image)} 
                  alt={post.title}
                  className="w-full h-64 md:h-96 object-cover"
                  loading="eager"
                />
              </div>
            )}

            {/* Blog Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Tag className="h-4 w-4" />
                <Link to={`/marketplace/blog?category=${post.category}`} className="hover:text-primary transition-colors">
                  {post.category.toUpperCase()}
                </Link>
                <span>•</span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {post.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{healAuthor(post.author)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Updated {formatDate(post.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Blog Content */}
            <article className="prose prose-lg max-w-none mb-12">
              <p className="text-lg text-muted-foreground mb-6">{post.excerpt}</p>
              <div className="text-foreground whitespace-pre-line">{post.content}</div>
            </article>

            {/* FAQ Section */}
            {post.faqs && post.faqs.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <HelpCircle className="h-6 w-6" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {post.faqs.map((faq, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-card">
                      <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/marketplace/blog?tag=${tag}`}
                  className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>

            {/* Share */}
            <div className="flex items-center gap-2 mb-12">
              <Share2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Share this article</span>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedProducts.map((item) => (
                    <ItemCard item={item} key={item.id} />
                  ))}
                </div>
              </section>
            )}

            {/* More in this category */}
            {categoryBlogs.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-foreground mb-6">More in {post.category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryBlogs.map((blog) => (
                    <Link
                      key={blog.id}
                      to={`/marketplace/blog/${blog.slug}`}
                      className="group block p-6 rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Tag className="h-3 w-3" />
                        <span>{blog.category}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Related Blogs */}
            {relatedBlogs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relatedBlogs.map((blog) => (
                    <Link
                      key={blog.id}
                      to={`/marketplace/blog/${blog.slug}`}
                      className="group block p-6 rounded-lg border bg-card hover:border-primary/40 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <Tag className="h-3 w-3" />
                        <span>{blog.category}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {blog.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
