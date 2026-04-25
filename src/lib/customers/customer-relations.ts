// Customer Relations Engine
// Links customers → subscriptions, transactions, licenses
// Auto calculates LTV, active subscriptions, last payment date

import type { Customer, CustomerRelations } from './customer-types';

// ============================================
// CUSTOMER RELATIONS ENGINE
// ============================================

export class CustomerRelationsEngine {
  // ============================================
  // GET CUSTOMER RELATIONS
  // ============================================

  async getCustomerRelations(customerId: string, tenantId: string): Promise<CustomerRelations> {
    // In production, fetch from database
    const subscriptions = await this.getCustomerSubscriptions(customerId, tenantId);
    const transactions = await this.getCustomerTransactions(customerId, tenantId);
    const licenses = await this.getCustomerLicenses(customerId, tenantId);

    return {
      subscriptions,
      transactions,
      licenses,
    };
  }

  // ============================================
  // GET CUSTOMER SUBSCRIPTIONS
  // ============================================

  private async getCustomerSubscriptions(customerId: string, tenantId: string): Promise<CustomerRelations['subscriptions']> {
    // In production, fetch from subscriptions table
    const subscriptions: CustomerRelations['subscriptions'] = [
      {
        id: 'sub_123',
        plan: 'Pro Plan',
        status: 'active',
        amount: 29.99,
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
      },
    ];

    return subscriptions;
  }

  // ============================================
  // GET CUSTOMER TRANSACTIONS
  // ============================================

  private async getCustomerTransactions(customerId: string, tenantId: string): Promise<CustomerRelations['transactions']> {
    // In production, fetch from transactions table
    const transactions: CustomerRelations['transactions'] = [
      {
        id: 'txn_123',
        amount: 29.99,
        currency: 'USD',
        status: 'success',
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'txn_456',
        amount: 29.99,
        currency: 'USD',
        status: 'success',
        createdAt: new Date(Date.now() - 86400000 * 37).toISOString(),
      },
    ];

    return transactions;
  }

  // ============================================
  // GET CUSTOMER LICENSES
  // ============================================

  private async getCustomerLicenses(customerId: string, tenantId: string): Promise<CustomerRelations['licenses']> {
    // In production, fetch from licenses table
    const licenses: CustomerRelations['licenses'] = [
      {
        id: 'lic_123',
        product: 'Product A',
        status: 'active',
        expiresAt: new Date(Date.now() + 86400000 * 365).toISOString(),
      },
    ];

    return licenses;
  }

  // ============================================
  // CALCULATE LTV FROM TRANSACTIONS
  // ============================================

  calculateLTV(transactions: CustomerRelations['transactions']): number {
    return transactions
      .filter((txn) => txn.status === 'success')
      .reduce((sum, txn) => sum + txn.amount, 0);
  }

  // ============================================
  // COUNT ACTIVE SUBSCRIPTIONS
  // ============================================

  countActiveSubscriptions(subscriptions: CustomerRelations['subscriptions']): number {
    return subscriptions.filter((sub) => sub.status === 'active').length;
  }

  // ============================================
  // GET LAST PAYMENT DATE
  // ============================================

  getLastPaymentDate(transactions: CustomerRelations['transactions']): string | null {
    const successfulTransactions = transactions
      .filter((txn) => txn.status === 'success')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return successfulTransactions.length > 0 ? successfulTransactions[0].createdAt : null;
  }

  // ============================================
  // UPDATE CUSTOMER FROM RELATIONS
  // ============================================

  async updateCustomerFromRelations(customer: Customer): Promise<Customer> {
    const relations = await this.getCustomerRelations(customer.id, customer.tenantId);

    const ltv = this.calculateLTV(relations.transactions);
    const activeSubscriptions = this.countActiveSubscriptions(relations.subscriptions);
    const lastPaymentDate = this.getLastPaymentDate(relations.transactions);

    return {
      ...customer,
      ltv,
      activeSubscriptions,
      totalSpent: ltv,
      lastActiveAt: lastPaymentDate || customer.lastActiveAt,
      updatedAt: new Date().toISOString(),
    };
  }

  // ============================================
  // BULK UPDATE CUSTOMERS FROM RELATIONS
  // ============================================

  async bulkUpdateCustomersFromRelations(customers: Customer[]): Promise<Customer[]> {
    const updatedCustomers: Customer[] = [];

    for (const customer of customers) {
      const updated = await this.updateCustomerFromRelations(customer);
      updatedCustomers.push(updated);
    }

    return updatedCustomers;
  }

  // ============================================
  // FIND CUSTOMERS BY RELATION
  // ============================================

  async findCustomersBySubscription(subscriptionId: string, tenantId: string): Promise<Customer[]> {
    // In production, query database
    const customers: Customer[] = [];

    console.log(`[CustomerRelations] Finding customers with subscription ${subscriptionId}`);

    return customers;
  }

  async findCustomersByTransaction(transactionId: string, tenantId: string): Promise<Customer[]> {
    // In production, query database
    const customers: Customer[] = [];

    console.log(`[CustomerRelations] Finding customers with transaction ${transactionId}`);

    return customers;
  }

  async findCustomersByLicense(licenseId: string, tenantId: string): Promise<Customer[]> {
    // In production, query database
    const customers: Customer[] = [];

    console.log(`[CustomerRelations] Finding customers with license ${licenseId}`);

    return customers;
  }

  // ============================================
  // GET CUSTOMER RELATION SUMMARY
  // ============================================

  async getCustomerRelationSummary(customerId: string, tenantId: string): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalTransactions: number;
    successfulTransactions: number;
    totalLicenses: number;
    activeLicenses: number;
    ltv: number;
    averageTransactionValue: number;
  }> {
    const relations = await this.getCustomerRelations(customerId, tenantId);

    const totalSubscriptions = relations.subscriptions.length;
    const activeSubscriptions = this.countActiveSubscriptions(relations.subscriptions);
    const totalTransactions = relations.transactions.length;
    const successfulTransactions = relations.transactions.filter((txn) => txn.status === 'success').length;
    const totalLicenses = relations.licenses.length;
    const activeLicenses = relations.licenses.filter((lic) => lic.status === 'active').length;
    const ltv = this.calculateLTV(relations.transactions);
    const averageTransactionValue = successfulTransactions > 0 ? ltv / successfulTransactions : 0;

    return {
      totalSubscriptions,
      activeSubscriptions,
      totalTransactions,
      successfulTransactions,
      totalLicenses,
      activeLicenses,
      ltv,
      averageTransactionValue,
    };
  }
}

// Export singleton instance
export const customerRelationsEngine = new CustomerRelationsEngine();
