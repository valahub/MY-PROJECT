// Commission Engine
// Handles commission calculation, tracking, and payouts for resellers and franchises

export interface CommissionTier {
  id: string;
  name: string;
  minSales: number;
  maxSales: number;
  commissionRate: number;
  type: 'reseller' | 'franchise';
}

export interface Commission {
  id: string;
  userId: string;
  saleId: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  type: 'reseller' | 'franchise';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string;
  paidAt?: string;
}

export interface Payout {
  id: string;
  userId: string;
  totalAmount: number;
  commissionIds: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  method: 'bank_transfer' | 'paypal' | 'stripe' | 'crypto';
  accountDetails?: string;
}

// Commission Tiers
export const COMMISSION_TIERS: CommissionTier[] = [
  // Reseller Tiers
  {
    id: 'reseller-bronze',
    name: 'Bronze Reseller',
    minSales: 0,
    maxSales: 1000,
    commissionRate: 30,
    type: 'reseller',
  },
  {
    id: 'reseller-silver',
    name: 'Silver Reseller',
    minSales: 1000,
    maxSales: 5000,
    commissionRate: 35,
    type: 'reseller',
  },
  {
    id: 'reseller-gold',
    name: 'Gold Reseller',
    minSales: 5000,
    maxSales: 10000,
    commissionRate: 40,
    type: 'reseller',
  },
  {
    id: 'reseller-platinum',
    name: 'Platinum Reseller',
    minSales: 10000,
    maxSales: Infinity,
    commissionRate: 45,
    type: 'reseller',
  },
  // Franchise Tiers
  {
    id: 'franchise-starter',
    name: 'Starter Franchise',
    minSales: 0,
    maxSales: 50000,
    commissionRate: 60,
    type: 'franchise',
  },
  {
    id: 'franchise-growth',
    name: 'Growth Franchise',
    minSales: 50000,
    maxSales: 200000,
    commissionRate: 65,
    type: 'franchise',
  },
  {
    id: 'franchise-enterprise',
    name: 'Enterprise Franchise',
    minSales: 200000,
    maxSales: Infinity,
    commissionRate: 70,
    type: 'franchise',
  },
];

// In-memory storage (in production, use database)
const commissionsStore = new Map<string, Commission>();
const payoutsStore = new Map<string, Payout>();
const userSalesStore = new Map<string, number>(); // Track total sales per user

export function generateCommissionId(): string {
  return `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function generatePayoutId(): string {
  return `payout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCommissionTier(
  totalSales: number,
  type: 'reseller' | 'franchise'
): CommissionTier {
  const tiers = COMMISSION_TIERS.filter((t) => t.type === type);
  return (
    tiers.find((t) => totalSales >= t.minSales && totalSales < t.maxSales) ||
    tiers[tiers.length - 1]
  );
}

export function calculateCommission(
  saleAmount: number,
  userId: string,
  type: 'reseller' | 'franchise'
): {
  commissionRate: number;
  commissionAmount: number;
  tier: CommissionTier;
} {
  const totalSales = userSalesStore.get(userId) || 0;
  const tier = getCommissionTier(totalSales, type);
  const commissionAmount = saleAmount * (tier.commissionRate / 100);

  return {
    commissionRate: tier.commissionRate,
    commissionAmount,
    tier,
  };
}

export function createCommission(
  userId: string,
  saleId: string,
  saleAmount: number,
  type: 'reseller' | 'franchise'
): Commission {
  const { commissionRate, commissionAmount, tier } = calculateCommission(
    saleAmount,
    userId,
    type
  );

  const commission: Commission = {
    id: generateCommissionId(),
    userId,
    saleId,
    saleAmount,
    commissionRate,
    commissionAmount,
    type,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  commissionsStore.set(commission.id, commission);

  // Update user sales total
  const currentSales = userSalesStore.get(userId) || 0;
  userSalesStore.set(userId, currentSales + saleAmount);

  return commission;
}

export function approveCommission(commissionId: string): boolean {
  const commission = commissionsStore.get(commissionId);
  if (!commission || commission.status !== 'pending') return false;

  commission.status = 'approved';
  commission.approvedAt = new Date().toISOString();
  commissionsStore.set(commissionId, commission);
  return true;
}

export function rejectCommission(commissionId: string): boolean {
  const commission = commissionsStore.get(commissionId);
  if (!commission || commission.status !== 'pending') return false;

  commission.status = 'rejected';
  commissionsStore.set(commissionId, commission);

  // Revert sales total
  const currentSales = userSalesStore.get(commission.userId) || 0;
  userSalesStore.set(commission.userId, Math.max(0, currentSales - commission.saleAmount));

  return true;
}

export function getUserCommissions(
  userId: string,
  status?: Commission['status']
): Commission[] {
  const commissions = Array.from(commissionsStore.values()).filter(
    (c) => c.userId === userId
  );

  if (status) {
    return commissions.filter((c) => c.status === status);
  }

  return commissions;
}

export function getUserTotalEarnings(userId: string): {
  pending: number;
  approved: number;
  paid: number;
  total: number;
} {
  const commissions = getUserCommissions(userId);

  return {
    pending: commissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    approved: commissions
      .filter((c) => c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    paid: commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
    total: commissions
      .filter((c) => c.status === 'approved' || c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0),
  };
}

export function createPayout(
  userId: string,
  commissionIds: string[],
  method: Payout['method'],
  accountDetails?: string
): Payout {
  const commissions = commissionIds
    .map((id) => commissionsStore.get(id))
    .filter((c) => c && c.status === 'approved') as Commission[];

  if (commissions.length === 0) {
    throw new Error('No approved commissions found');
  }

  const totalAmount = commissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );

  const payout: Payout = {
    id: generatePayoutId(),
    userId,
    totalAmount,
    commissionIds,
    status: 'pending',
    createdAt: new Date().toISOString(),
    method,
    accountDetails,
  };

  payoutsStore.set(payout.id, payout);

  // Mark commissions as paid
  commissions.forEach((c) => {
    c.status = 'paid';
    c.paidAt = new Date().toISOString();
    commissionsStore.set(c.id, c);
  });

  return payout;
}

export function processPayout(payoutId: string): boolean {
  const payout = payoutsStore.get(payoutId);
  if (!payout || payout.status !== 'pending') return false;

  payout.status = 'processing';
  payoutsStore.set(payoutId, payout);

  // Simulate processing (in production, integrate with payment gateway)
  setTimeout(() => {
    payout.status = 'completed';
    payout.processedAt = new Date().toISOString();
    payoutsStore.set(payoutId, payout);
  }, 2000);

  return true;
}

export function getUserPayouts(userId: string): Payout[] {
  return Array.from(payoutsStore.values()).filter((p) => p.userId === userId);
}

export function getUserStats(userId: string): {
  totalSales: number;
  totalCommissions: number;
  currentTier: CommissionTier;
  nextTier?: CommissionTier;
  salesToNextTier: number;
  pendingEarnings: number;
  availableForPayout: number;
} {
  const totalSales = userSalesStore.get(userId) || 0;
  const commissions = getUserCommissions(userId);
  const currentTier = getCommissionTier(totalSales, 'reseller');
  const nextTier = COMMISSION_TIERS.find(
    (t) =>
      t.type === 'reseller' &&
      t.minSales > totalSales &&
      t.commissionRate > currentTier.commissionRate
  );

  const salesToNextTier = nextTier
    ? Math.max(0, nextTier.minSales - totalSales)
    : 0;

  const earnings = getUserTotalEarnings(userId);

  return {
    totalSales,
    totalCommissions: commissions.reduce((sum, c) => sum + c.commissionAmount, 0),
    currentTier,
    nextTier,
    salesToNextTier,
    pendingEarnings: earnings.pending,
    availableForPayout: earnings.approved,
  };
}

export function getAllCommissions(): Commission[] {
  return Array.from(commissionsStore.values());
}

export function getAllPayouts(): Payout[] {
  return Array.from(payoutsStore.values());
}

export function getCommissionStats(): {
  totalCommissions: number;
  totalPaid: number;
  pendingPayouts: number;
  totalUsers: number;
} {
  const commissions = getAllCommissions();
  const payouts = getAllPayouts();

  return {
    totalCommissions: commissions.length,
    totalPaid: payouts
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + p.totalAmount, 0),
    pendingPayouts: payouts.filter((p) => p.status === 'pending').length,
    totalUsers: new Set(commissions.map((c) => c.userId)).size,
  };
}
