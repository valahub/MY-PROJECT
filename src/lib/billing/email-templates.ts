// Email Templates
// Payment failed, retry reminder, final warning, payment success

import type { EmailTemplate, EmailSendResult, Invoice } from './invoice-types';

// ============================================
// EMAIL TEMPLATE MANAGER
// ============================================

export class EmailTemplateManager {
  private templates: Map<string, EmailTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  // ============================================
  // INITIALIZE TEMPLATES
  // ============================================

  private initializeTemplates(): void {
    // Payment Failed Template
    this.templates.set('payment_failed', {
      type: 'payment_failed',
      subject: 'Payment Failed - Action Required',
      body: `
Dear {{customer_name}},

We were unable to process your payment of {{amount}} {{currency}} for invoice {{invoice_number}}.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount: {{amount}} {{currency}}
- Due Date: {{due_date}}
- Subscription: {{subscription_name}}

Please update your payment method or retry the payment manually from your account dashboard.

If you have any questions, please contact our support team.

Best regards,
{{company_name}}
      `,
      variables: ['customer_name', 'amount', 'currency', 'invoice_number', 'due_date', 'subscription_name', 'company_name'],
    });

    // Retry Reminder Template
    this.templates.set('retry_reminder', {
      type: 'retry_reminder',
      subject: 'Payment Retry Scheduled - Invoice {{invoice_number}}',
      body: `
Dear {{customer_name}},

This is a reminder that we will retry your payment of {{amount}} {{currency}} for invoice {{invoice_number}} on {{retry_date}}.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount: {{amount}} {{currency}}
- Due Date: {{due_date}}
- Retry Date: {{retry_date}}
- Attempt: {{attempt_number}} of {{max_attempts}}

To avoid service interruption, please ensure your payment method is valid and has sufficient funds.

If you have any questions, please contact our support team.

Best regards,
{{company_name}}
      `,
      variables: ['customer_name', 'amount', 'currency', 'invoice_number', 'due_date', 'retry_date', 'attempt_number', 'max_attempts', 'company_name'],
    });

    // Final Warning Template
    this.templates.set('final_warning', {
      type: 'final_warning',
      subject: 'URGENT: Final Payment Warning - Service Suspension Imminent',
      body: `
Dear {{customer_name},

URGENT: Your payment of {{amount}} {{currency}} for invoice {{invoice_number}} has failed multiple times.

Invoice Details:
- Invoice Number: {{invoice_number}}
- Amount: {{amount}} {{currency}}
- Due Date: {{due_date}}
- Failed Attempts: {{attempt_number}}

ACTION REQUIRED:
Your subscription will be suspended on {{suspension_date}} if payment is not received.

Please update your payment method immediately to avoid service interruption.

If you have any questions, please contact our support team immediately.

Best regards,
{{company_name}}
      `,
      variables: ['customer_name', 'amount', 'currency', 'invoice_number', 'due_date', 'attempt_number', 'suspension_date', 'company_name'],
    });

    // Payment Success Template
    this.templates.set('payment_success', {
      type: 'payment_success',
      subject: 'Payment Successful - Invoice {{invoice_number}}',
      body: `
Dear {{customer_name},

Great news! Your payment of {{amount}} {{currency}} for invoice {{invoice_number}} was successful.

Payment Details:
- Invoice Number: {{invoice_number}}
- Amount: {{amount}} {{currency}}
- Paid On: {{paid_date}}
- Payment Method: {{payment_method}}

Your subscription is now active and will continue uninterrupted.

Thank you for your payment!

Best regards,
{{company_name}}
      `,
      variables: ['customer_name', 'amount', 'currency', 'invoice_number', 'paid_date', 'payment_method', 'company_name'],
    });
  }

  // ============================================
  // GET TEMPLATE
  // ============================================

  getTemplate(type: EmailTemplate['type']): EmailTemplate | null {
    return this.templates.get(type) || null;
  }

  // ============================================
  // RENDER TEMPLATE
  // ============================================

  renderTemplate(template: EmailTemplate, variables: Record<string, string>): string {
    let body = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return body;
  }

  // ============================================
  // SEND EMAIL
  // ============================================

  async sendEmail(
    type: EmailTemplate['type'],
    to: string,
    variables: Record<string, string>
  ): Promise<EmailSendResult> {
    try {
      const template = this.getTemplate(type);
      if (!template) {
        return {
          success: false,
          emailId: null,
          errorMessage: `Template not found: ${type}`,
          timestamp: new Date().toISOString(),
        };
      }

      const subject = this.renderTemplate(template, variables);
      const body = this.renderTemplate(template, variables);

      // In production, call email service API
      console.log(`[EmailTemplateManager] Sending email: ${type} to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body length: ${body.length} characters`);

      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        success: true,
        emailId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        emailId: null,
        errorMessage: error instanceof Error ? error.message : 'Failed to send email',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // ============================================
  // SEND PAYMENT FAILED EMAIL
  // ============================================

  async sendPaymentFailedEmail(
    invoice: Invoice,
    customerName: string,
    customerEmail: string,
    subscriptionName?: string
  ): Promise<EmailSendResult> {
    const variables = {
      customer_name: customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      invoice_number: invoice.invoiceNumber,
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      subscription_name: subscriptionName || 'N/A',
      company_name: 'Your Company',
    };

    return this.sendEmail('payment_failed', customerEmail, variables);
  }

  // ============================================
  // SEND RETRY REMINDER EMAIL
  // ============================================

  async sendRetryReminderEmail(
    invoice: Invoice,
    customerName: string,
    customerEmail: string,
    retryDate: Date,
    attemptNumber: number,
    maxAttempts: number
  ): Promise<EmailSendResult> {
    const variables = {
      customer_name: customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      invoice_number: invoice.invoiceNumber,
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      retry_date: retryDate.toLocaleDateString(),
      attempt_number: attemptNumber.toString(),
      max_attempts: maxAttempts.toString(),
      company_name: 'Your Company',
    };

    return this.sendEmail('retry_reminder', customerEmail, variables);
  }

  // ============================================
  // SEND FINAL WARNING EMAIL
  // ============================================

  async sendFinalWarningEmail(
    invoice: Invoice,
    customerName: string,
    customerEmail: string,
    suspensionDate: Date,
    attemptNumber: number
  ): Promise<EmailSendResult> {
    const variables = {
      customer_name: customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      invoice_number: invoice.invoiceNumber,
      due_date: new Date(invoice.dueDate).toLocaleDateString(),
      attempt_number: attemptNumber.toString(),
      suspension_date: suspensionDate.toLocaleDateString(),
      company_name: 'Your Company',
    };

    return this.sendEmail('final_warning', customerEmail, variables);
  }

  // ============================================
  // SEND PAYMENT SUCCESS EMAIL
  // ============================================

  async sendPaymentSuccessEmail(
    invoice: Invoice,
    customerName: string,
    customerEmail: string,
    paymentMethod: string = 'credit_card'
  ): Promise<EmailSendResult> {
    const variables = {
      customer_name: customerName,
      amount: invoice.amount.toString(),
      currency: invoice.currency,
      invoice_number: invoice.invoiceNumber,
      paid_date: invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : new Date().toLocaleDateString(),
      payment_method: paymentMethod,
      company_name: 'Your Company',
    };

    return this.sendEmail('payment_success', customerEmail, variables);
  }

  // ============================================
  // ADD CUSTOM TEMPLATE
  // ============================================

  addTemplate(template: EmailTemplate): void {
    this.templates.set(template.type, template);
  }

  // ============================================
  // REMOVE TEMPLATE
  // ============================================

  removeTemplate(type: EmailTemplate['type']): void {
    this.templates.delete(type);
  }

  // ============================================
  // LIST TEMPLATES
  // ============================================

  listTemplates(): EmailTemplate[] {
    return Array.from(this.templates.values());
  }
}

// Export singleton instance
export const emailTemplateManager = new EmailTemplateManager();
