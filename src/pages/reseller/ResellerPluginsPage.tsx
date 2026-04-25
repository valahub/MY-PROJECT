// Reseller Plugins Page
// SEO-optimized page for plugins reseller program

import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, DollarSign, Users, Globe, Zap, Code } from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';

export default function ResellerPluginsPage() {
  const canonicalPath = '/reseller/plugins';
  const title = 'Plugins Reseller Program - Earn Commission Selling WordPress & Code Plugins | ERP Vala';
  const description = 'Join our plugins reseller program and earn up to 40% commission selling WordPress, React, Laravel plugins. High-demand products, instant delivery, global marketplace.';
  const keywords = 'plugins reseller program, WordPress plugins reseller, code plugins affiliate, earn commission plugins, plugin business';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ERP Vala Plugins Reseller Program',
    description: 'Join our plugins reseller program and earn commission selling WordPress and code plugins',
    url: canonicalPath,
    offers: {
      '@type': 'Offer',
      description: 'Earn up to 40% commission on plugin sales',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <SeoMeta
        title={title}
        description={description}
        keywords={keywords}
        canonicalPath={canonicalPath}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-8">
            <Link to="/marketplace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Back to Marketplace
            </Link>
            <h1 className="text-4xl font-bold text-foreground mt-4">Plugins Reseller Program</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Earn up to 40% commission selling WordPress, React, and Laravel plugins
            </p>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          {/* Benefits */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Why Sell Plugins?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <Code className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">High Demand</h3>
                <p className="text-muted-foreground">WordPress powers 40%+ of websites. Plugin demand is massive and growing.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <DollarSign className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Recurring Sales</h3>
                <p className="text-muted-foreground">Plugins often need updates and support. Build recurring customer relationships.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Zap className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Easy Integration</h3>
                <p className="text-muted-foreground">Plugins are easy to sell. Customers know what they need and buy quickly.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Global Market</h3>
                <p className="text-muted-foreground">Sell plugins to developers and businesses worldwide. No geographic limits.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Growing Trend</h3>
                <p className="text-muted-foreground">No-code/low-code movement increasing plugin demand exponentially.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Proven Products</h3>
                <p className="text-muted-foreground">Our plugins are battle-tested with thousands of active installations.</p>
              </div>
            </div>
          </section>

          {/* Plugin Categories */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Plugin Categories You Can Sell</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">WordPress Plugins</h3>
                <p className="text-muted-foreground mb-4">SEO, security, performance, eCommerce, and utility plugins.</p>
                <span className="text-primary font-semibold">30-40% Commission</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">React Components</h3>
                <p className="text-muted-foreground mb-4">UI kits, form builders, data visualization, and state management.</p>
                <span className="text-primary font-semibold">35-40% Commission</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">Laravel Packages</h3>
                <p className="text-muted-foreground mb-4">Authentication, API, queue systems, and admin panels.</p>
                <span className="text-primary font-semibold">35-40% Commission</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">eCommerce Plugins</h3>
                <p className="text-muted-foreground mb-4">Payment gateways, shipping, inventory, and marketing tools.</p>
                <span className="text-primary font-semibold">30-35% Commission</span>
              </div>
            </div>
          </section>

          {/* Success Stories */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Reseller Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary mb-2">$5,000+</div>
                <p className="text-muted-foreground">Monthly earnings from WordPress plugins</p>
                <p className="text-sm text-muted-foreground mt-2">- Sarah M., Digital Agency Owner</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary mb-2">$3,200+</div>
                <p className="text-muted-foreground">Monthly earnings from React components</p>
                <p className="text-sm text-muted-foreground mt-2">- John D., Freelance Developer</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <div className="text-3xl font-bold text-primary mb-2">$4,800+</div>
                <p className="text-muted-foreground">Monthly earnings from Laravel packages</p>
                <p className="text-sm text-muted-foreground mt-2">- Alex K., Software Consultant</p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Start Selling Plugins Today</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join the fastest-growing plugins reseller program
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Become a Plugins Reseller
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
