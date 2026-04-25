// Lead Capture API
// Handles reseller and franchise lead capture

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  country: string;
  interest: 'reseller' | 'franchise' | 'both';
  message?: string;
  source: string;
  refCode?: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  country: string;
  interest: 'reseller' | 'franchise' | 'both';
  message?: string;
  source: string;
  refCode?: string;
}

export interface CreateLeadResponse {
  success: boolean;
  leadId?: string;
  error?: string;
}

// In-memory storage (in production, use database)
const leadsStore = new Map<string, Lead>();

export function generateLeadId(): string {
  return `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createLead(request: CreateLeadRequest): CreateLeadResponse {
  try {
    // Validate required fields
    if (!request.name || !request.email || !request.country || !request.interest) {
      return {
        success: false,
        error: 'Missing required fields: name, email, country, interest',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(request.email)) {
      return {
        success: false,
        error: 'Invalid email format',
      };
    }

    // Check for duplicate email
    for (const lead of leadsStore.values()) {
      if (lead.email === request.email) {
        return {
          success: false,
          error: 'Email already registered',
        };
      }
    }

    // Create lead
    const lead: Lead = {
      id: generateLeadId(),
      name: request.name,
      email: request.email,
      phone: request.phone,
      country: request.country,
      interest: request.interest,
      message: request.message,
      source: request.source,
      refCode: request.refCode,
      createdAt: new Date().toISOString(),
      status: 'new',
    };

    leadsStore.set(lead.id, lead);

    return {
      success: true,
      leadId: lead.id,
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create lead',
    };
  }
}

export function getLeadById(id: string): Lead | undefined {
  return leadsStore.get(id);
}

export function getLeadsByInterest(interest: 'reseller' | 'franchise' | 'both'): Lead[] {
  return Array.from(leadsStore.values()).filter(
    (lead) => lead.interest === interest || lead.interest === 'both'
  );
}

export function getLeadsByCountry(country: string): Lead[] {
  return Array.from(leadsStore.values()).filter((lead) => lead.country === country);
}

export function getLeadsByRefCode(refCode: string): Lead[] {
  return Array.from(leadsStore.values()).filter((lead) => lead.refCode === refCode);
}

export function updateLeadStatus(id: string, status: Lead['status']): boolean {
  const lead = leadsStore.get(id);
  if (!lead) return false;

  lead.status = status;
  leadsStore.set(id, lead);
  return true;
}

export function getAllLeads(): Lead[] {
  return Array.from(leadsStore.values());
}

export function getLeadStats(): {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
  reseller: number;
  franchise: number;
} {
  const leads = getAllLeads();
  return {
    total: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    converted: leads.filter((l) => l.status === 'converted').length,
    lost: leads.filter((l) => l.status === 'lost').length,
    reseller: leads.filter((l) => l.interest === 'reseller' || l.interest === 'both').length,
    franchise: leads.filter((l) => l.interest === 'franchise' || l.interest === 'both').length,
  };
}

// API endpoint handler (for integration with backend)
export async function handleCreateLeadRequest(
  request: CreateLeadRequest
): Promise<CreateLeadResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return createLead(request);
}
