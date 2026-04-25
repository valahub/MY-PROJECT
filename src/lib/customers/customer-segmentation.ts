// Customer Segmentation Engine
// High LTV, at-risk, new users, churned

import type { Customer, CustomerSegment, CustomerSegmentData } from './customer-types';

// ============================================
// CUSTOMER SEGMENTATION ENGINE
// ============================================

export class CustomerSegmentationEngine {
  // ============================================
  // SEGMENT CUSTOMERS
  // ============================================

  segmentCustomers(customers: Customer[]): Map<CustomerSegment, CustomerSegmentData> {
    const segments = new Map<CustomerSegment, CustomerSegmentData>();

    const highLTVCustomers = this.getHighLTVCustomers(customers);
    const atRiskCustomers = this.getAtRiskCustomers(customers);
    const newUsers = this.getNewUsers(customers);
    const churnedCustomers = this.getChurnedCustomers(customers);
    const vipCustomers = this.getVIPCustomers(customers);

    segments.set('high_ltv', {
      segment: 'high_ltv',
      count: highLTVCustomers.length,
      averageLTV: this.calculateAverageLTV(highLTVCustomers),
      customers: highLTVCustomers,
    });

    segments.set('at_risk', {
      segment: 'at_risk',
      count: atRiskCustomers.length,
      averageLTV: this.calculateAverageLTV(atRiskCustomers),
      customers: atRiskCustomers,
    });

    segments.set('new_user', {
      segment: 'new_user',
      count: newUsers.length,
      averageLTV: this.calculateAverageLTV(newUsers),
      customers: newUsers,
    });

    segments.set('churned', {
      segment: 'churned',
      count: churnedCustomers.length,
      averageLTV: this.calculateAverageLTV(churnedCustomers),
      customers: churnedCustomers,
    });

    segments.set('vip', {
      segment: 'vip',
      count: vipCustomers.length,
      averageLTV: this.calculateAverageLTV(vipCustomers),
      customers: vipCustomers,
    });

    return segments;
  }

  // ============================================
  // GET HIGH LTV CUSTOMERS
  // ============================================

  getHighLTVCustomers(customers: Customer[]): Customer[] {
    const threshold = this.calculatePercentile(customers.map((c) => c.ltv), 75);
    return customers.filter((customer) => customer.ltv >= threshold);
  }

  // ============================================
  // GET AT-RISK CUSTOMERS
  // ============================================

  getAtRiskCustomers(customers: Customer[]): Customer[] {
    return customers.filter((customer) => 
      customer.churnRiskScore >= 50 && customer.status === 'active'
    );
  }

  // ============================================
  // GET NEW USERS
  // ============================================

  getNewUsers(customers: Customer[]): Customer[] {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return customers.filter((customer) => 
      new Date(customer.createdAt) >= thirtyDaysAgo
    );
  }

  // ============================================
  // GET CHURNED CUSTOMERS
  // ============================================

  getChurnedCustomers(customers: Customer[]): Customer[] {
    return customers.filter((customer) => 
      customer.status === 'inactive' || customer.status === 'blocked'
    );
  }

  // ============================================
  // GET VIP CUSTOMERS
  // ============================================

  getVIPCustomers(customers: Customer[]): Customer[] {
    return customers.filter((customer) => 
      customer.ltv >= 500 && customer.activeSubscriptions >= 2
    );
  }

  // ============================================
  // CALCULATE AVERAGE LTV
  // ============================================

  calculateAverageLTV(customers: Customer[]): number {
    if (customers.length === 0) return 0;
    const total = customers.reduce((sum, c) => sum + c.ltv, 0);
    return total / customers.length;
  }

  // ============================================
  // CALCULATE PERCENTILE
  // ============================================

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  // ============================================
  // GET CUSTOMER SEGMENT
  // ============================================

  getCustomerSegment(customer: Customer, allCustomers: Customer[]): CustomerSegment[] {
    const segments: CustomerSegment[] = [];

    const highLTVThreshold = this.calculatePercentile(allCustomers.map((c) => c.ltv), 75);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (customer.ltv >= highLTVThreshold) {
      segments.push('high_ltv');
    }

    if (customer.churnRiskScore >= 50 && customer.status === 'active') {
      segments.push('at_risk');
    }

    if (new Date(customer.createdAt) >= thirtyDaysAgo) {
      segments.push('new_user');
    }

    if (customer.status === 'inactive' || customer.status === 'blocked') {
      segments.push('churned');
    }

    if (customer.ltv >= 500 && customer.activeSubscriptions >= 2) {
      segments.push('vip');
    }

    return segments;
  }

  // ============================================
  // GET SEGMENT BY CUSTOMER ID
  // ============================================

  getSegmentByCustomerId(customerId: string, customers: Customer[]): CustomerSegment[] {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return [];
    return this.getCustomerSegment(customer, customers);
  }

  // ============================================
  // GET SEGMENT SUMMARY
  // ============================================

  getSegmentSummary(customers: Customer[]): {
    totalCustomers: number;
    segments: Map<CustomerSegment, CustomerSegmentData>;
    segmentDistribution: Record<CustomerSegment, number>;
  } {
    const segments = this.segmentCustomers(customers);
    const segmentDistribution: Record<CustomerSegment, number> = {
      high_ltv: 0,
      at_risk: 0,
      new_user: 0,
      churned: 0,
      vip: 0,
    };

    for (const [segment, data] of segments) {
      segmentDistribution[segment] = data.count;
    }

    return {
      totalCustomers: customers.length,
      segments,
      segmentDistribution,
    };
  }

  // ============================================
  // GET CUSTOMERS BY SEGMENT
  // ============================================

  getCustomersBySegment(customers: Customer[], segment: CustomerSegment): Customer[] {
    switch (segment) {
      case 'high_ltv':
        return this.getHighLTVCustomers(customers);
      case 'at_risk':
        return this.getAtRiskCustomers(customers);
      case 'new_user':
        return this.getNewUsers(customers);
      case 'churned':
        return this.getChurnedCustomers(customers);
      case 'vip':
        return this.getVIPCustomers(customers);
      default:
        return [];
    }
  }

  // ============================================
  // GET SEGMENT TRANSITIONS
  // ============================================

  getSegmentTransitions(
    previousCustomers: Customer[],
    currentCustomers: Customer[]
  ): Map<string, { from: CustomerSegment[]; to: CustomerSegment[] }> {
    const transitions = new Map<string, { from: CustomerSegment[]; to: CustomerSegment[] }>();

    for (const current of currentCustomers) {
      const previous = previousCustomers.find((c) => c.id === current.id);
      if (!previous) continue;

      const previousSegments = this.getCustomerSegment(previous, previousCustomers);
      const currentSegments = this.getCustomerSegment(current, currentCustomers);

      const from = previousSegments.filter((s) => !currentSegments.includes(s));
      const to = currentSegments.filter((s) => !previousSegments.includes(s));

      if (from.length > 0 || to.length > 0) {
        transitions.set(current.id, { from, to });
      }
    }

    return transitions;
  }

  // ============================================
  // GET SEGMENT INSIGHTS
  // ============================================

  getSegmentInsights(customers: Customer[]): {
    highLTV: { count: number; avgLTV: number; revenueAtRisk: number };
    atRisk: { count: number; avgChurnRisk: number; recommendedActions: string[] };
    newUsers: { count: number; conversionRate: number; avgTimeToFirstPurchase: number };
    churned: { count: number; avgLTV: number; recoveryPotential: number };
  } {
    const highLTVCustomers = this.getHighLTVCustomers(customers);
    const atRiskCustomers = this.getAtRiskCustomers(customers);
    const newUsers = this.getNewUsers(customers);
    const churnedCustomers = this.getChurnedCustomers(customers);

    return {
      highLTV: {
        count: highLTVCustomers.length,
        avgLTV: this.calculateAverageLTV(highLTVCustomers),
        revenueAtRisk: highLTVCustomers.reduce((sum, c) => sum + c.ltv, 0) * 0.1, // 10% risk
      },
      atRisk: {
        count: atRiskCustomers.length,
        avgChurnRisk: atRiskCustomers.reduce((sum, c) => sum + c.churnRiskScore, 0) / atRiskCustomers.length,
        recommendedActions: [
          'Send personalized retention offers',
          'Schedule account review calls',
          'Provide premium support',
          'Offer loyalty discounts',
        ],
      },
      newUsers: {
        count: newUsers.length,
        conversionRate: newUsers.filter((c) => c.ltv > 0).length / newUsers.length,
        avgTimeToFirstPurchase: 7, // In production, calculate from data
      },
      churned: {
        count: churnedCustomers.length,
        avgLTV: this.calculateAverageLTV(churnedCustomers),
        recoveryPotential: churnedCustomers.reduce((sum, c) => sum + c.ltv, 0) * 0.3, // 30% recovery potential
      },
    };
  }
}

// Export singleton instance
export const customerSegmentationEngine = new CustomerSegmentationEngine();

// ============================================
// REACT HOOK FOR CUSTOMER SEGMENTATION
// ============================================

import { useState, useCallback } from 'react';

export function useCustomerSegmentation() {
  const [isSegmenting, setIsSegmenting] = useState(false);

  const segmentCustomers = useCallback((customers: Customer[]) => {
    setIsSegmenting(true);
    try {
      const segments = customerSegmentationEngine.segmentCustomers(customers);
      return segments;
    } finally {
      setIsSegmenting(false);
    }
  }, []);

  const getCustomerSegment = useCallback((customer: Customer, allCustomers: Customer[]) => {
    return customerSegmentationEngine.getCustomerSegment(customer, allCustomers);
  }, []);

  const getCustomersBySegment = useCallback((customers: Customer[], segment: CustomerSegment) => {
    return customerSegmentationEngine.getCustomersBySegment(customers, segment);
  }, []);

  const getSegmentSummary = useCallback((customers: Customer[]) => {
    return customerSegmentationEngine.getSegmentSummary(customers);
  }, []);

  const getSegmentInsights = useCallback((customers: Customer[]) => {
    return customerSegmentationEngine.getSegmentInsights(customers);
  }, []);

  return {
    isSegmenting,
    segmentCustomers,
    getCustomerSegment,
    getCustomersBySegment,
    getSegmentSummary,
    getSegmentInsights,
  };
}
