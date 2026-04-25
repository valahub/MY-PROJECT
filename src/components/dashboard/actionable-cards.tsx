// Actionable Dashboard Cards
// Each card is clickable and opens detailed views/modals
// NO DEAD CARDS ALLOWED

import { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================
// ACTIONABLE CARD BASE
// ============================================

interface ActionableCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  onClick: () => void;
  className?: string;
  loading?: boolean;
  badge?: {
    text: string;
    variant: 'default' | 'warning' | 'error' | 'success';
  };
}

export function ActionableCard({
  title,
  value,
  change,
  icon,
  onClick,
  className,
  loading = false,
  badge,
}: ActionableCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'group relative w-full rounded-lg border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed',
        className
      )}
    >
      {badge && (
        <div
          className={cn(
            'absolute right-4 top-4 rounded-full px-2 py-0.5 text-xs font-medium',
            {
              'bg-primary/10 text-primary': badge.variant === 'default',
              'bg-yellow-500/10 text-yellow-600': badge.variant === 'warning',
              'bg-destructive/10 text-destructive': badge.variant === 'error',
              'bg-green-500/10 text-green-600': badge.variant === 'success',
            }
          )}
        >
          {badge.text}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="mt-2 text-3xl font-bold tracking-tight">
            {loading ? '...' : value}
          </h3>
          {change && !loading && (
            <p
              className={cn(
                'mt-2 text-xs font-medium',
                change.isPositive ? 'text-green-600' : 'text-red-600'
              )}
            >
              {change.isPositive ? '+' : ''}
              {change.value}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className="ml-4 rounded-lg bg-muted p-2 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center text-xs text-muted-foreground group-hover:text-primary transition-colors">
        <span>View details</span>
        <svg
          className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </button>
  );
}

// ============================================
// MRR CARD - OPENS BREAKDOWN
// ============================================

interface MRRBreakdownProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    byPlan: Array<{ plan: string; mrr: number; count: number }>;
    byRegion: Array<{ region: string; mrr: number; count: number }>;
    byChannel: Array<{ channel: string; mrr: number; count: number }>;
  };
}

export function MRRCard({ value, change, onClick, loading }: Pick<ActionableCardProps, 'value' | 'change' | 'onClick' | 'loading'>) {
  return (
    <ActionableCard
      title="Monthly Recurring Revenue"
      value={loading ? '...' : `$${(value as number).toLocaleString()}`}
      change={change}
      onClick={onClick}
      loading={loading}
      badge={{ text: 'Click for breakdown', variant: 'default' }}
    />
  );
}

export function MRRBreakdownModal({ isOpen, onClose, data }: MRRBreakdownProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">MRR Breakdown</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* By Plan */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">By Plan</h3>
            <div className="space-y-2">
              {data.byPlan.map((item) => (
                <div key={item.plan} className="flex justify-between text-sm">
                  <span>{item.plan}</span>
                  <span className="font-medium">${item.mrr.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Region */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">By Region</h3>
            <div className="space-y-2">
              {data.byRegion.map((item) => (
                <div key={item.region} className="flex justify-between text-sm">
                  <span>{item.region}</span>
                  <span className="font-medium">${item.mrr.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Channel */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">By Channel</h3>
            <div className="space-y-2">
              {data.byChannel.map((item) => (
                <div key={item.channel} className="flex justify-between text-sm">
                  <span>{item.channel}</span>
                  <span className="font-medium">${item.mrr.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CHURN CARD - SHOWS RISKY USERS
// ============================================

interface ChurnRiskyUsersProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    customerId: string;
    customerName: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    subscriptionValue: number;
    lastActivity: string;
  }>;
}

export function ChurnCard({ value, change, onClick, loading }: Pick<ActionableCardProps, 'value' | 'change' | 'onClick' | 'loading'>) {
  const isHighRisk = (value as number) > 0.05;

  return (
    <ActionableCard
      title="Churn Rate"
      value={loading ? '...' : `${((value as number) * 100).toFixed(2)}%`}
      change={change}
      onClick={onClick}
      loading={loading}
      badge={{
        text: isHighRisk ? 'High Risk' : 'Normal',
        variant: isHighRisk ? 'error' : 'default',
      }}
    />
  );
}

export function ChurnRiskyUsersModal({ isOpen, onClose, data }: ChurnRiskyUsersProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Risky Customers</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium">Customer</th>
                <th className="text-left p-3 text-sm font-medium">Risk Level</th>
                <th className="text-left p-3 text-sm font-medium">Reason</th>
                <th className="text-left p-3 text-sm font-medium">Value</th>
                <th className="text-left p-3 text-sm font-medium">Last Activity</th>
                <th className="text-left p-3 text-sm font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((customer) => (
                <tr key={customer.customerId} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm">{customer.customerName}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        {
                          'bg-green-500/10 text-green-600': customer.riskLevel === 'low',
                          'bg-yellow-500/10 text-yellow-600': customer.riskLevel === 'medium',
                          'bg-orange-500/10 text-orange-600': customer.riskLevel === 'high',
                          'bg-red-500/10 text-red-600': customer.riskLevel === 'critical',
                        }
                      )}
                    >
                      {customer.riskLevel}
                    </span>
                  </td>
                  <td className="p-3 text-sm">{customer.reason}</td>
                  <td className="p-3 text-sm font-medium">${customer.subscriptionValue}</td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(customer.lastActivity).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button className="text-sm text-primary hover:underline">
                      Reach out
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// REVENUE CARD - SHOWS SOURCES
// ============================================

interface RevenueSourcesProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    source: string;
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export function RevenueCard({ value, change, onClick, loading }: Pick<ActionableCardProps, 'value' | 'change' | 'onClick' | 'loading'>) {
  return (
    <ActionableCard
      title="Total Revenue"
      value={loading ? '...' : `$${(value as number).toLocaleString()}`}
      change={change}
      onClick={onClick}
      loading={loading}
      badge={{ text: 'Click for sources', variant: 'default' }}
    />
  );
}

export function RevenueSourcesModal({ isOpen, onClose, data }: RevenueSourcesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Revenue Sources</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {data.map((source) => (
            <div key={source.source} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{source.source}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">{source.percentage}%</span>
                  <span className="font-semibold">${source.amount.toLocaleString()}</span>
                  <svg
                    className={cn(
                      'h-4 w-4',
                      {
                        'text-green-600': source.trend === 'up',
                        'text-red-600': source.trend === 'down',
                        'text-gray-400': source.trend === 'stable',
                      }
                    )}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {source.trend === 'up' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    )}
                    {source.trend === 'down' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    )}
                    {source.trend === 'stable' && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                    )}
                  </svg>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${source.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// ACTIVE SUBSCRIPTIONS CARD - SHOWS LIST
// ============================================

interface SubscriptionsListProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<{
    id: string;
    customerName: string;
    plan: string;
    amount: number;
    status: 'active' | 'canceled' | 'past_due';
    nextBilling: string;
  }>;
}

export function SubscriptionsCard({ value, onClick, loading }: Pick<ActionableCardProps, 'value' | 'onClick' | 'loading'>) {
  return (
    <ActionableCard
      title="Active Subscriptions"
      value={loading ? '...' : value as number}
      onClick={onClick}
      loading={loading}
      badge={{ text: 'Click for list', variant: 'default' }}
    />
  );
}

export function SubscriptionsListModal({ isOpen, onClose, data }: SubscriptionsListProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl rounded-lg border bg-background p-6 shadow-lg max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Active Subscriptions</h2>
          <button
            onClick={onClose}
            className="rounded-md p-2 hover:bg-muted"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full">
            <thead className="sticky top-0 bg-background">
              <tr className="border-b">
                <th className="text-left p-3 text-sm font-medium">Customer</th>
                <th className="text-left p-3 text-sm font-medium">Plan</th>
                <th className="text-left p-3 text-sm font-medium">Amount</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Next Billing</th>
              </tr>
            </thead>
            <tbody>
              {data.map((sub) => (
                <tr key={sub.id} className="border-b hover:bg-muted/50">
                  <td className="p-3 text-sm">{sub.customerName}</td>
                  <td className="p-3 text-sm">{sub.plan}</td>
                  <td className="p-3 text-sm font-medium">${sub.amount}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        'rounded-full px-2 py-1 text-xs font-medium',
                        {
                          'bg-green-500/10 text-green-600': sub.status === 'active',
                          'bg-red-500/10 text-red-600': sub.status === 'canceled',
                          'bg-yellow-500/10 text-yellow-600': sub.status === 'past_due',
                        }
                      )}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-muted-foreground">
                    {new Date(sub.nextBilling).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPOSITE ACTIONABLE DASHBOARD
// ============================================

export function ActionableDashboard() {
  const [mrrBreakdownOpen, setMrrBreakdownOpen] = useState(false);
  const [churnRiskyUsersOpen, setChurnRiskyUsersOpen] = useState(false);
  const [revenueSourcesOpen, setRevenueSourcesOpen] = useState(false);
  const [subscriptionsListOpen, setSubscriptionsListOpen] = useState(false);

  // Mock data for modals
  const mrrBreakdownData = {
    byPlan: [
      { plan: 'Basic', mrr: 45000, count: 500 },
      { plan: 'Pro', mrr: 55000, count: 300 },
      { plan: 'Enterprise', mrr: 25000, count: 42 },
    ],
    byRegion: [
      { region: 'North America', mrr: 70000, count: 500 },
      { region: 'Europe', mrr: 35000, count: 250 },
      { region: 'Asia Pacific', mrr: 20000, count: 92 },
    ],
    byChannel: [
      { channel: 'Direct', mrr: 60000, count: 400 },
      { channel: 'Partner', mrr: 40000, count: 300 },
      { channel: 'Marketplace', mrr: 25000, count: 142 },
    ],
  };

  const churnRiskyUsersData = [
    { customerId: '1', customerName: 'Acme Corp', riskLevel: 'critical' as const, reason: 'Payment method expired', subscriptionValue: 299, lastActivity: '2024-01-15' },
    { customerId: '2', customerName: 'Tech Startup Inc', riskLevel: 'high' as const, reason: 'Low engagement', subscriptionValue: 99, lastActivity: '2024-01-10' },
    { customerId: '3', customerName: 'Global Solutions', riskLevel: 'medium' as const, reason: 'Support tickets increased', subscriptionValue: 199, lastActivity: '2024-01-08' },
  ];

  const revenueSourcesData = [
    { source: 'Direct Sales', amount: 75000, percentage: 60, trend: 'up' as const },
    { source: 'Marketplace', amount: 35000, percentage: 28, trend: 'stable' as const },
    { source: 'Partners', amount: 15000, percentage: 12, trend: 'down' as const },
  ];

  const subscriptionsListData = [
    { id: '1', customerName: 'Acme Corp', plan: 'Enterprise', amount: 299, status: 'active' as const, nextBilling: '2024-02-01' },
    { id: '2', customerName: 'Tech Startup Inc', plan: 'Pro', amount: 99, status: 'active' as const, nextBilling: '2024-02-01' },
    { id: '3', customerName: 'Global Solutions', plan: 'Pro', amount: 99, status: 'past_due' as const, nextBilling: '2024-01-25' },
  ];

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MRRCard
          value={125000}
          change={{ value: 12.5, isPositive: true }}
          onClick={() => setMrrBreakdownOpen(true)}
        />
        <ChurnCard
          value={0.025}
          change={{ value: -0.5, isPositive: true }}
          onClick={() => setChurnRiskyUsersOpen(true)}
        />
        <RevenueCard
          value={145000}
          change={{ value: 8.3, isPositive: true }}
          onClick={() => setRevenueSourcesOpen(true)}
        />
        <SubscriptionsCard
          value={842}
          onClick={() => setSubscriptionsListOpen(true)}
        />
      </div>

      <MRRBreakdownModal
        isOpen={mrrBreakdownOpen}
        onClose={() => setMrrBreakdownOpen(false)}
        data={mrrBreakdownData}
      />
      <ChurnRiskyUsersModal
        isOpen={churnRiskyUsersOpen}
        onClose={() => setChurnRiskyUsersOpen(false)}
        data={churnRiskyUsersData}
      />
      <RevenueSourcesModal
        isOpen={revenueSourcesOpen}
        onClose={() => setRevenueSourcesOpen(false)}
        data={revenueSourcesData}
      />
      <SubscriptionsListModal
        isOpen={subscriptionsListOpen}
        onClose={() => setSubscriptionsListOpen(false)}
        data={subscriptionsListData}
      />
    </>
  );
}
