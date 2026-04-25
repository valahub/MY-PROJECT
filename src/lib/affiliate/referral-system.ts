// Affiliate/Referral System
// Handles referral code generation, tracking, and management

export interface Referral {
  id: string;
  userId: string;
  refCode: string;
  clicks: number;
  sales: number;
  totalCommission: number;
  createdAt: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface ReferralClick {
  id: string;
  refCode: string;
  userId: string;
  clickedAt: string;
  ip?: string;
  userAgent?: string;
  converted: boolean;
  saleId?: string;
}

export interface ReferralSale {
  id: string;
  refCode: string;
  referrerId: string;
  saleAmount: number;
  commissionRate: number;
  commissionAmount: number;
  productId: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

// In-memory storage (in production, use database)
const referralsStore = new Map<string, Referral>();
const clicksStore = new Map<string, ReferralClick>();
const salesStore = new Map<string, ReferralSale>();

export function generateReferralCode(userId: string): string {
  const base = userId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const random = Math.random().toString(36).substr(2, 6);
  return `${base}${random}`.substr(0, 12);
}

export function createReferral(userId: string): Referral {
  const refCode = generateReferralCode(userId);
  const referral: Referral = {
    id: `ref-${Date.now()}`,
    userId,
    refCode,
    clicks: 0,
    sales: 0,
    totalCommission: 0,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  referralsStore.set(referral.id, referral);
  return referral;
}

export function getReferralByCode(refCode: string): Referral | undefined {
  return Array.from(referralsStore.values()).find((r) => r.refCode === refCode);
}

export function getReferralByUserId(userId: string): Referral | undefined {
  return Array.from(referralsStore.values()).find((r) => r.userId === userId);
}

export function trackClick(refCode: string, ip?: string, userAgent?: string): ReferralClick {
  const referral = getReferralByCode(refCode);
  if (!referral) {
    throw new Error('Invalid referral code');
  }

  const click: ReferralClick = {
    id: `click-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    refCode,
    userId: referral.userId,
    clickedAt: new Date().toISOString(),
    ip,
    userAgent,
    converted: false,
  };

  clicksStore.set(click.id, click);

  // Update referral click count
  referral.clicks += 1;
  referralsStore.set(referral.id, referral);

  return click;
}

export function recordSale(
  refCode: string,
  saleAmount: number,
  commissionRate: number,
  productId: string
): ReferralSale {
  const referral = getReferralByCode(refCode);
  if (!referral) {
    throw new Error('Invalid referral code');
  }

  const commissionAmount = saleAmount * (commissionRate / 100);

  const sale: ReferralSale = {
    id: `sale-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    refCode,
    referrerId: referral.userId,
    saleAmount,
    commissionRate,
    commissionAmount,
    productId,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  salesStore.set(sale.id, sale);

  // Update referral stats
  referral.sales += 1;
  referral.totalCommission += commissionAmount;
  referralsStore.set(referral.id, referral);

  // Mark the most recent click as converted
  const recentClicks = Array.from(clicksStore.values())
    .filter((c) => c.refCode === refCode && !c.converted)
    .sort((a, b) => new Date(b.clickedAt).getTime() - new Date(a.clickedAt).getTime());

  if (recentClicks.length > 0) {
    recentClicks[0].converted = true;
    recentClicks[0].saleId = sale.id;
    clicksStore.set(recentClicks[0].id, recentClicks[0]);
  }

  return sale;
}

export function approveSale(saleId: string): boolean {
  const sale = salesStore.get(saleId);
  if (!sale) return false;

  sale.status = 'approved';
  salesStore.set(saleId, sale);
  return true;
}

export function rejectSale(saleId: string): boolean {
  const sale = salesStore.get(saleId);
  if (!sale) return false;

  sale.status = 'rejected';
  salesStore.set(saleId, sale);

  // Revert commission from referral
  const referral = getReferralByCode(sale.refCode);
  if (referral) {
    referral.sales -= 1;
    referral.totalCommission -= sale.commissionAmount;
    referralsStore.set(referral.id, referral);
  }

  return true;
}

export function getReferralStats(userId: string): {
  refCode: string;
  clicks: number;
  sales: number;
  conversionRate: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
} {
  const referral = getReferralByUserId(userId);
  if (!referral) {
    throw new Error('Referral not found for user');
  }

  const userSales = Array.from(salesStore.values()).filter((s) => s.referrerId === userId);
  const pendingCommission = userSales
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.commissionAmount, 0);
  const approvedCommission = userSales
    .filter((s) => s.status === 'approved')
    .reduce((sum, s) => sum + s.commissionAmount, 0);

  const conversionRate = referral.clicks > 0 ? (referral.sales / referral.clicks) * 100 : 0;

  return {
    refCode: referral.refCode,
    clicks: referral.clicks,
    sales: referral.sales,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalCommission: referral.totalCommission,
    pendingCommission,
    approvedCommission,
  };
}

export function getReferralClicks(refCode: string): ReferralClick[] {
  return Array.from(clicksStore.values()).filter((c) => c.refCode === refCode);
}

export function getReferralSales(refCode: string): ReferralSale[] {
  return Array.from(salesStore.values()).filter((s) => s.refCode === refCode);
}

export function updateReferralStatus(referralId: string, status: Referral['status']): boolean {
  const referral = referralsStore.get(referralId);
  if (!referral) return false;

  referral.status = status;
  referralsStore.set(referralId, referral);
  return true;
}

export function getAllReferrals(): Referral[] {
  return Array.from(referralsStore.values());
}

export function getTopReferrers(limit: number = 10): Array<{
  userId: string;
  refCode: string;
  sales: number;
  totalCommission: number;
}> {
  return Array.from(referralsStore.values())
    .sort((a, b) => b.totalCommission - a.totalCommission)
    .slice(0, limit)
    .map((r) => ({
      userId: r.userId,
      refCode: r.refCode,
      sales: r.sales,
      totalCommission: r.totalCommission,
    }));
}

// URL helper
export function buildReferralUrl(baseUrl: string, refCode: string): string {
  return `${baseUrl}?ref=${refCode}`;
}

// Extract ref code from URL
export function extractRefCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    return null;
  }
}
