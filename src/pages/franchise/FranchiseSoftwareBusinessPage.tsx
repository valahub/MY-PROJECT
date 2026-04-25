// Franchise Software Business Page
// SEO-optimized page for software franchise program

import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, DollarSign, Users, Globe, Zap, Building2, Target } from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';

export default function FranchiseSoftwareBusinessPage() {
  const canonicalPath = '/franchise/software-business';
  const title = 'Software Business Franchise - Start Your Digital Products Business | ERP Vala';
  const description = 'Own a software business franchise with ERP Vala. Low investment, high ROI, proven business model. Start your digital products franchise in your territory today.';
  const keywords = 'software business franchise, digital products franchise, business opportunity, software reseller franchise, low investment business';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ERP Vala Software Business Franchise',
    description: 'Start your own software business franchise with proven model',
    url: canonicalPath,
    offers: {
      '@type': 'Offer',
      description: 'Software business franchise opportunity with low investment',
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
            <h1 className="text-4xl font-bold text-foreground mt-4">Software Business Franchise</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Own your territory. Build recurring revenue. Scale globally.
            </p>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          {/* Investment Overview */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Investment Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card text-center">
                <DollarSign className="h-8 w-8 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">$5,000</div>
                <p className="text-muted-foreground">Starting Investment</p>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">40%</div>
                <p className="text-muted-foreground">Average Annual ROI</p>
              </div>
              <div className="p-6 rounded-lg border bg-card text-center">
                <Target className="h-8 w-8 text-primary mx-auto mb-4" />
                <div className="text-3xl font-bold text-foreground mb-2">12-18</div>
                <p className="text-muted-foreground">Months to Break Even</p>
              </div>
            </div>
          </section>

          {/* What You Get */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">What You Get</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <Building2 className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Exclusive Territory</h3>
                <p className="text-muted-foreground">Own your geographic region with exclusive rights to sell our products.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Zap className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Ready-Made Platform</h3>
                <p className="text-muted-foreground">Get a fully functional marketplace platform customized for your brand.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Training & Support</h3>
                <p className="text-muted-foreground">Comprehensive training, marketing materials, and ongoing support.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Product Catalog</h3>
                <p className="text-muted-foreground">Access to 600,000+ digital products to sell in your territory.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <DollarSign className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Revenue Share</h3>
                <p className="text-muted-foreground">Keep 60-70% of all sales revenue generated in your territory.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Proven Model</h3>
                <p className="text-muted-foreground">Battle-tested business model with successful franchises worldwide.</p>
              </div>
            </div>
          </section>

          {/* Available Territories */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Available Territories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">India</h3>
                <p className="text-muted-foreground mb-4">Tier 1 cities available. High growth potential.</p>
                <span className="text-primary font-semibold">Investment: $5,000</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">USA</h3>
                <p className="text-muted-foreground mb-4">State-level territories. Premium market access.</p>
                <span className="text-primary font-semibold">Investment: $15,000</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">UK</h3>
                <p className="text-muted-foreground mb-4">Regional territories. Established market.</p>
                <span className="text-primary font-semibold">Investment: $10,000</span>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-2">UAE</h3>
                <p className="text-muted-foreground mb-4">Country-wide opportunity. Emerging market.</p>
                <span className="text-primary font-semibold">Investment: $8,000</span>
              </div>
            </div>
          </section>

          {/* ROI Calculator */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Projected ROI</h2>
            <div className="p-6 rounded-lg border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-foreground">Year</th>
                    <th className="text-left py-3 text-foreground">Revenue</th>
                    <th className="text-left py-3 text-foreground">Expenses</th>
                    <th className="text-left py-3 text-foreground">Net Profit</th>
                    <th className="text-left py-3 text-foreground">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 text-muted-foreground">Year 1</td>
                    <td className="py-3 text-foreground">$50,000</td>
                    <td className="py-3 text-foreground">$30,000</td>
                    <td className="py-3 text-foreground font-semibold">$20,000</td>
                    <td className="py-3 text-foreground font-semibold">400%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 text-muted-foreground">Year 2</td>
                    <td className="py-3 text-foreground">$120,000</td>
                    <td className="py-3 text-foreground">$40,000</td>
                    <td className="py-3 text-foreground font-semibold">$80,000</td>
                    <td className="py-3 text-foreground font-semibold">800%</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">Year 3</td>
                    <td className="py-3 text-foreground">$250,000</td>
                    <td className="py-3 text-foreground">$50,000</td>
                    <td className="py-3 text-foreground font-semibold">$200,000</td>
                    <td className="py-3 text-foreground font-semibold">2000%</td>
                  </tr>
                </tbody>
              </table>
              <p className="text-sm text-muted-foreground mt-4">* Projections based on average franchise performance. Actual results may vary.</p>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Own Your Territory?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Limited territories available. Secure your region today.
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Apply for Franchise
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
