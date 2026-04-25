// Customer Self-Healing Engine
// Auto-fix LTV, active_subs, merge duplicates, create from payments

import type { Customer, CustomerStatus } from './customer-types';
import { customerRelationsEngine } from './customer-relations';

// ============================================
// SELF-HEAL RESULT
// ============================================

export interface SelfHealResult {
  success: boolean;
  customer: Customer | null;
  issues: string[];
  fixes: string[];
  timestamp: string;
}

// ============================================
// CUSTOMER SELF-HEAL ENGINE
// ============================================

export class CustomerSelfHealEngine {
  // ============================================
  // HEAL CUSTOMER LTV
  // ============================================

  async healCustomerLTV(customer: Customer): Promise<SelfHealResult> {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
      const calculatedLTV = customerRelationsEngine.calculateLTV(relations.transactions);

      if (customer.ltv !== calculatedLTV) {
        issues.push(`LTV mismatch: customer.ltv=${customer.ltv}, calculated=${calculatedLTV}`);
        
        // Fix LTV
        const updatedCustomer = {
          ...customer,
          ltv: calculatedLTV,
          totalSpent: calculatedLTV,
          updatedAt: new Date().toISOString(),
        };

        fixes.push(`Updated LTV from ${customer.ltv} to ${calculatedLTV}`);

        console.log(`[SelfHeal] Fixed LTV for customer ${customer.id}: ${customer.ltv} → ${calculatedLTV}`);

        return {
          success: true,
          customer: updatedCustomer,
          issues,
          fixes,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        customer,
        issues,
        fixes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        issues: [`Failed to heal LTV: ${error instanceof Error ? error.message : 'Unknown error'}`],
        fixes,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HEAL CUSTOMER ACTIVE SUBSCRIPTIONS
  // ============================================

  async healCustomerActiveSubscriptions(customer: Customer): Promise<SelfHealResult> {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
      const calculatedActiveSubs = customerRelationsEngine.countActiveSubscriptions(relations.subscriptions);

      if (customer.activeSubscriptions !== calculatedActiveSubs) {
        issues.push(`Active subscriptions mismatch: customer.activeSubscriptions=${customer.activeSubscriptions}, calculated=${calculatedActiveSubs}`);
        
        // Fix active subscriptions
        const updatedCustomer = {
          ...customer,
          activeSubscriptions: calculatedActiveSubs,
          updatedAt: new Date().toISOString(),
        };

        fixes.push(`Updated active subscriptions from ${customer.activeSubscriptions} to ${calculatedActiveSubs}`);

        console.log(`[SelfHeal] Fixed active subscriptions for customer ${customer.id}: ${customer.activeSubscriptions} → ${calculatedActiveSubs}`);

        return {
          success: true,
          customer: updatedCustomer,
          issues,
          fixes,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        customer,
        issues,
        fixes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        issues: [`Failed to heal active subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`],
        fixes,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HEAL CUSTOMER STATUS
  // ============================================

  async healCustomerStatus(customer: Customer): Promise<SelfHealResult> {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
      const hasActiveSubscriptions = relations.subscriptions.some((sub) => sub.status === 'active');

      let newStatus: CustomerStatus = customer.status;

      // If customer has active subscriptions but is inactive, activate them
      if (hasActiveSubscriptions && customer.status === 'inactive') {
        issues.push(`Customer has active subscriptions but status is inactive`);
        newStatus = 'active';
        fixes.push(`Updated status from inactive to active`);
      }

      // If customer has no active subscriptions and is active, mark as inactive
      if (!hasActiveSubscriptions && customer.status === 'active') {
        issues.push(`Customer has no active subscriptions but status is active`);
        newStatus = 'inactive';
        fixes.push(`Updated status from active to inactive`);
      }

      if (newStatus !== customer.status) {
        const updatedCustomer = {
          ...customer,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        console.log(`[SelfHeal] Fixed status for customer ${customer.id}: ${customer.status} → ${newStatus}`);

        return {
          success: true,
          customer: updatedCustomer,
          issues,
          fixes,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        customer,
        issues,
        fixes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        issues: [`Failed to heal status: ${error instanceof Error ? error.message : 'Unknown error'}`],
        fixes,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // HEAL LAST ACTIVE DATE
  // ============================================

  async healLastActiveDate(customer: Customer): Promise<SelfHealResult> {
    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      const relations = await customerRelationsEngine.getCustomerRelations(customer.id, customer.tenantId);
      const lastPaymentDate = customerRelationsEngine.getLastPaymentDate(relations.transactions);

      if (lastPaymentDate && new Date(lastPaymentDate) > new Date(customer.lastActiveAt)) {
        issues.push(`Last active date is older than last payment date`);
        
        const updatedCustomer = {
          ...customer,
          lastActiveAt: lastPaymentDate,
          updatedAt: new Date().toISOString(),
        };

        fixes.push(`Updated last active date to ${lastPaymentDate}`);

        console.log(`[SelfHeal] Fixed last active date for customer ${customer.id}: ${customer.lastActiveAt} → ${lastPaymentDate}`);

        return {
          success: true,
          customer: updatedCustomer,
          issues,
          fixes,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        customer,
        issues,
        fixes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        customer: null,
        issues: [`Failed to heal last active date: ${error instanceof Error ? error.message : 'Unknown error'}`],
        fixes,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // FULL CUSTOMER HEAL
  // ============================================

  async healCustomer(customer: Customer): Promise<SelfHealResult> {
    const allIssues: string[] = [];
    const allFixes: string[] = [];
    let healedCustomer = customer;

    const healFunctions = [
      () => this.healCustomerLTV(healedCustomer),
      () => this.healCustomerActiveSubscriptions(healedCustomer),
      () => this.healCustomerStatus(healedCustomer),
      () => this.healLastActiveDate(healedCustomer),
    ];

    for (const healFn of healFunctions) {
      const result = await healFn();
      allIssues.push(...result.issues);
      allFixes.push(...result.fixes);

      if (result.customer) {
        healedCustomer = result.customer;
      }
    }

    return {
      success: allFixes.length > 0 || allIssues.length === 0,
      customer: healedCustomer,
      issues: allIssues,
      fixes: allFixes,
      timestamp: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK HEAL CUSTOMERS
  // ============================================

  async bulkHealCustomers(customers: Customer[]): Promise<{
    healed: number;
    failed: number;
    results: SelfHealResult[];
  }> {
    const results: SelfHealResult[] = [];
    let healed = 0;
    let failed = 0;

    for (const customer of customers) {
      const result = await this.healCustomer(customer);
      results.push(result);

      if (result.success) {
        healed++;
      } else {
        failed++;
      }
    }

    console.log(`[SelfHeal] Bulk heal: ${healed} healed, ${failed} failed`);

    return { healed, failed, results };
  }

  // ============================================
  // FIND DUPLICATE EMAILS
  // ============================================

  findDuplicateEmails(customers: Customer[]): Map<string, Customer[]> {
    const emailMap = new Map<string, Customer[]>();

    for (const customer of customers) {
      const email = customer.email.toLowerCase();
      
      if (!emailMap.has(email)) {
        emailMap.set(email, []);
      }

      emailMap.get(email)!.push(customer);
    }

    // Filter to only duplicates
    const duplicates = new Map<string, Customer[]>();
    for (const [email, customersWithEmail] of emailMap) {
      if (customersWithEmail.length > 1) {
        duplicates.set(email, customersWithEmail);
      }
    }

    return duplicates;
  }

  // ============================================
  // MERGE DUPLICATE CUSTOMERS
  // ============================================

  async mergeDuplicateCustomers(customers: Customer[]): Promise<{
    merged: number;
    results: Array<{ primaryCustomer: Customer; mergedCustomers: Customer[] }>;
  }> {
    const duplicates = this.findDuplicateEmails(customers);
    const results: Array<{ primaryCustomer: Customer; mergedCustomers: Customer[] }> = [];
    let merged = 0;

    for (const [email, duplicateCustomers] of duplicates) {
      // Sort by creation date (oldest first = primary)
      const sorted = [...duplicateCustomers].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const primaryCustomer = sorted[0];
      const toMerge = sorted.slice(1);

      // Merge data
      const mergedCustomer = {
        ...primaryCustomer,
        ltv: sorted.reduce((sum, c) => sum + c.ltv, 0),
        totalSpent: sorted.reduce((sum, c) => sum + c.totalSpent, 0),
        activeSubscriptions: sorted.reduce((sum, c) => sum + c.activeSubscriptions, 0),
        updatedAt: new Date().toISOString(),
      };

      results.push({
        primaryCustomer: mergedCustomer,
        mergedCustomers: toMerge,
      });

      merged += toMerge.length;

      console.log(`[SelfHeal] Merged ${toMerge.length} customers with email ${email}`);
    }

    return { merged, results };
  }

  // ============================================
  // CREATE CUSTOMER FROM PAYMENT
  // ============================================

  async createCustomerFromPayment(
    email: string,
    name: string,
    amount: number,
    currency: string,
    tenantId: string,
    country: string = 'US'
  ): Promise<Customer | null> {
    try {
      const customer: Customer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        email,
        phone: null,
        country,
        status: 'active',
        totalSpent: amount,
        ltv: amount,
        activeSubscriptions: 0,
        churnRiskScore: 0,
        fraudRiskScore: 0,
        lastActiveAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tenantId,
      };

      console.log(`[SelfHeal] Created customer from payment: ${email}`);

      return customer;
    } catch (error) {
      console.error(`[SelfHeal] Failed to create customer from payment:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const customerSelfHealEngine = new CustomerSelfHealEngine();
