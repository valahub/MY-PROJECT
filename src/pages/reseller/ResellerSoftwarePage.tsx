// Reseller Software Page
// SEO-optimized page for software reseller program

import { Link } from 'react-router-dom';
import { CheckCircle, TrendingUp, DollarSign, Users, Globe, Zap } from 'lucide-react';
import { SeoMeta } from '@/components/seo/SeoMeta';

export default function ResellerSoftwarePage() {
  const canonicalPath = '/reseller/software';
  const title = 'Software Reseller Program - Earn Commission Selling Digital Products | ERP Vala';
  const description = 'Join our software reseller program and earn up to 40% commission selling premium digital products. No inventory, instant delivery, global reach. Start your software business today.';
  const keywords = 'software reseller program, digital products reseller, earn commission, software business, white label software, affiliate program';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ERP Vala Software Reseller Program',
    description: 'Join our software reseller program and earn commission selling digital products',
    url: canonicalPath,
    offers: {
      '@type': 'Offer',
      description: 'Earn up to 40% commission on software sales',
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
            <h1 className="text-4xl font-bold text-foreground mt-4">Software Reseller Program</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Earn up to 40% commission selling premium digital products
            </p>
          </div>
        </header>

        <div className="container mx-auto px-4 py-12">
          {/* Benefits */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Why Become a Software Reseller?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg border bg-card">
                <DollarSign className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">High Commission</h3>
                <p className="text-muted-foreground">Earn up to 40% commission on every sale. No hidden fees, transparent earnings.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Zap className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Instant Delivery</h3>
                <p className="text-muted-foreground">Products are delivered instantly to customers. No inventory management needed.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Globe className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Global Reach</h3>
                <p className="text-muted-foreground">Sell to customers worldwide. Our marketplace handles payments and delivery.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <Users className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Growing Demand</h3>
                <p className="text-muted-foreground">Digital products market is booming. Tap into the $400B+ industry.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <TrendingUp className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Recurring Revenue</h3>
                <p className="text-muted-foreground">Build a sustainable income stream with repeat customers and subscriptions.</p>
              </div>
              <div className="p-6 rounded-lg border bg-card">
                <CheckCircle className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Easy Setup</h3>
                <p className="text-muted-foreground">Get started in minutes. No technical skills required. We provide everything.</p>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Sign Up</h3>
                <p className="text-muted-foreground">Create your free reseller account in under 2 minutes.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Promote</h3>
                <p className="text-muted-foreground">Share products using your unique referral links across channels.</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Earn</h3>
                <p className="text-muted-foreground">Receive commission payments automatically every month.</p>
              </div>
            </div>
          </section>

          {/* Commission Structure */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">Commission Structure</h2>
            <div className="p-6 rounded-lg border bg-card">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 text-foreground">Product Category</th>
                    <th className="text-left py-3 text-foreground">Commission Rate</th>
                    <th className="text-left py-3 text-foreground">Avg. Earnings/Sale</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3 text-muted-foreground">WordPress Plugins</td>
                    <td className="py-3 text-foreground font-semibold">30%</td>
                    <td className="py-3 text-foreground">$15-$50</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 text-muted-foreground">React Templates</td>
                    <td className="py-3 text-foreground font-semibold">35%</td>
                    <td className="py-3 text-foreground">$20-$75</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3 text-muted-foreground">Laravel Scripts</td>
                    <td className="py-3 text-foreground font-semibold">40%</td>
                    <td className="py-3 text-foreground">$30-$100</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-muted-foreground">eCommerce Solutions</td>
                    <td className="py-3 text-foreground font-semibold">35%</td>
                    <td className="py-3 text-foreground">$25-$80</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to Start Earning?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of resellers already earning with ERP Vala
            </p>
            <Link
              to="/login"
              className="inline-block px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Your Reseller Journey
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
