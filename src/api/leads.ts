/**
 * Leads API Service
 *
 * CRUD operations for Raynet Leads (Leady)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetLead,
  LeadStatus,
  ListLeadsInput,
  SearchLeadsInput,
  GetLeadInput,
  CreateLeadInput,
  UpdateLeadInput,
  ConvertLeadInput,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing leads */
type LeadQueryParams = Record<string, unknown>;

/** Payload for creating/updating leads */
interface LeadPayload {
  topic: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  owner?: number;
  leadPhase?: number;
  // Note: priority field is read-only in Raynet API
  status?: LeadStatus;
  contactSource?: number;
  notice?: string;
  tags?: string[];
  contactInfo?: {
    email?: string;
    tel1?: string;
    www?: string;
  };
}

/** Result of lead operations */
export interface LeadResult {
  lead: RaynetLead;
}

/** Result of lead list operations */
export interface LeadListResult {
  leads: RaynetLead[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Result of lead conversion */
export interface LeadConversionResult {
  lead: RaynetLead;
  company?: { id: number; name: string };
  contact?: { id: number; name: string };
  deal?: { id: number; name: string };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize website URL - ensure it has a protocol
 */
function normalizeWebsite(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;
  // Add https:// if no protocol specified
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Normalize phone number - remove spaces and special chars except + and digits
 */
function normalizePhone(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  const trimmed = phone.trim();
  if (!trimmed) return undefined;
  // Keep only +, digits, and spaces (Raynet may accept formatted numbers)
  return trimmed.replace(/[^\d+\s-]/g, '');
}

// ============================================================================
// Leads Service
// ============================================================================

export class LeadsService {
  private client: RaynetClient;
  private readonly endpoint = '/lead';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List leads with optional filters
   */
  async list(input: ListLeadsInput = {}): Promise<LeadListResult> {
    const { limit = 20, offset = 0, status, phaseId, ownerId } = input;

    const params: LeadQueryParams = {
      limit,
      offset,
    };

    if (status) params.status = status;
    if (phaseId) params['leadPhase[EQ]'] = phaseId;
    if (ownerId) params['owner[EQ]'] = ownerId;

    logger.info('Listing leads', { params });

    const response = await this.client.getList<RaynetLead>(
      `${this.endpoint}/`,
      params
    );

    return {
      leads: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search leads by name (lastName or companyName)
   */
  async search(input: SearchLeadsInput): Promise<LeadListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: LeadQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching leads', { query, limit, offset });

    const response = await this.client.getList<RaynetLead>(
      `${this.endpoint}/`,
      params
    );

    return {
      leads: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Get active leads
   */
  async getActive(limit = 20, offset = 0): Promise<LeadListResult> {
    return this.list({ status: 'B_ACTIVE', limit, offset });
  }

  /**
   * Get leads by phase
   */
  async getByPhase(phaseId: number, limit = 20): Promise<LeadListResult> {
    if (!phaseId || phaseId <= 0) {
      throw new ValidationError(['ID fazy musi być liczbą dodatnią']);
    }
    return this.list({ phaseId, limit });
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single lead by ID
   */
  async get(input: GetLeadInput): Promise<LeadResult> {
    const { leadId } = input;

    if (!leadId || leadId <= 0) {
      throw new ValidationError(['ID leada musi być liczbą dodatnią']);
    }

    logger.info('Getting lead', { leadId });

    try {
      const response = await this.client.getOne<RaynetLead>(
        `${this.endpoint}/${leadId}/`
      );

      return { lead: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('leada', leadId);
      }
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  async create(input: CreateLeadInput): Promise<LeadResult> {
    // Validate required fields
    if (!input.topic || input.topic.trim().length === 0) {
      throw new ValidationError(['Temat leada jest wymagany']);
    }

    const payload: LeadPayload = {
      topic: input.topic.trim(),
    };

    // Optional fields
    // Note: priority field is read-only in Raynet API - cannot be set on create
    if (input.firstName) payload.firstName = input.firstName;
    if (input.lastName) payload.lastName = input.lastName;
    if (input.companyName) payload.companyName = input.companyName;
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.phaseId) payload.leadPhase = input.phaseId;
    if (input.contactSourceId) payload.contactSource = input.contactSourceId;
    if (input.notice) payload.notice = input.notice;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    // Contact info - normalize values
    const normalizedPhone = normalizePhone(input.phone);
    const normalizedWebsite = normalizeWebsite(input.website);
    if (input.email || normalizedPhone || normalizedWebsite) {
      payload.contactInfo = {};
      if (input.email) payload.contactInfo.email = input.email.trim();
      if (normalizedPhone) payload.contactInfo.tel1 = normalizedPhone;
      if (normalizedWebsite) payload.contactInfo.www = normalizedWebsite;
    }

    logger.info('Creating lead', { topic: input.topic });

    // Raynet API uses PUT for creating new records
    const response = await this.client.put<RaynetLead>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Lead created', {
      leadId: response.data.id,
      code: response.data.code,
      topic: response.data.topic,
    });

    return { lead: response.data };
  }

  /**
   * Update an existing lead
   */
  async update(input: UpdateLeadInput): Promise<LeadResult> {
    const { leadId, ...updates } = input;

    if (!leadId || leadId <= 0) {
      throw new ValidationError(['ID leada musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current lead to get the _version for optimistic locking
    const currentLead = await this.client.getOne<RaynetLead>(`${this.endpoint}/${leadId}/`);
    const version = currentLead.data._version;

    // Build payload with only provided fields
    const payload: Partial<LeadPayload> & { _version: number } = {
      _version: version,
    };

    // Note: priority field is read-only in Raynet API - cannot be set on update
    if (updates.topic !== undefined) payload.topic = updates.topic.trim();
    if (updates.firstName !== undefined) payload.firstName = updates.firstName;
    if (updates.lastName !== undefined) payload.lastName = updates.lastName;
    if (updates.companyName !== undefined) payload.companyName = updates.companyName;
    if (updates.phaseId !== undefined) payload.leadPhase = updates.phaseId;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.notice !== undefined) payload.notice = updates.notice;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    // Contact info updates - normalize values
    if (updates.email !== undefined || updates.phone !== undefined || updates.website !== undefined) {
      payload.contactInfo = {};
      if (updates.email !== undefined) payload.contactInfo.email = updates.email.trim();
      if (updates.phone !== undefined) payload.contactInfo.tel1 = normalizePhone(updates.phone) ?? updates.phone;
      if (updates.website !== undefined) payload.contactInfo.www = normalizeWebsite(updates.website) ?? updates.website;
    }

    logger.info('Updating lead', { leadId, version, updates: Object.keys(payload) });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetLead>(
        `${this.endpoint}/${leadId}/`,
        payload
      );

      // Fetch the updated lead to return current data
      const updatedLead = await this.client.getOne<RaynetLead>(
        `${this.endpoint}/${leadId}/`
      );

      logger.info('Lead updated', { leadId, topic: updatedLead.data.topic });

      return { lead: updatedLead.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('leada', leadId);
      }
      throw error;
    }
  }

  /**
   * Update lead phase
   */
  async updatePhase(leadId: number, phaseId: number): Promise<LeadResult> {
    if (!leadId || leadId <= 0) {
      throw new ValidationError(['ID leada musi być liczbą dodatnią']);
    }
    if (!phaseId || phaseId <= 0) {
      throw new ValidationError(['ID fazy musi być liczbą dodatnią']);
    }

    logger.info('Updating lead phase', { leadId, phaseId });

    return this.update({ leadId, phaseId });
  }

  /**
   * Delete a lead
   */
  async delete(leadId: number): Promise<void> {
    if (!leadId || leadId <= 0) {
      throw new ValidationError(['ID leada musi być liczbą dodatnią']);
    }

    logger.info('Deleting lead', { leadId });

    try {
      await this.client.delete(`${this.endpoint}/${leadId}/`);
      logger.info('Lead deleted', { leadId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('leada', leadId);
      }
      throw error;
    }
  }

  /**
   * Convert lead to company/contact/deal
   * Note: This is a complex operation that may require multiple API calls
   */
  async convert(input: ConvertLeadInput): Promise<LeadConversionResult> {
    const { leadId, createCompany = true, createContact = true, createDeal = false, dealName } = input;

    if (!leadId || leadId <= 0) {
      throw new ValidationError(['ID leada musi być liczbą dodatnią']);
    }

    logger.info('Converting lead', { leadId, createCompany, createContact, createDeal });

    // Get current lead data
    const { lead } = await this.get({ leadId });

    const result: LeadConversionResult = { lead };

    // Note: Raynet may have a specific convert endpoint
    // For now, we'll update the lead status to converted
    // The actual conversion logic depends on Raynet's API

    try {
      // Update lead status to converted
      const updatedLead = await this.update({
        leadId,
        status: 'C_CONVERTED',
      });
      result.lead = updatedLead.lead;

      logger.info('Lead converted', { leadId });
    } catch (error) {
      logger.error('Failed to convert lead', { leadId, error });
      throw error;
    }

    return result;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a lead exists
   */
  async exists(leadId: number): Promise<boolean> {
    try {
      await this.get({ leadId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get lead by code (e.g., L-26-001)
   */
  async findByCode(code: string): Promise<LeadResult | null> {
    if (!code || code.trim().length === 0) {
      throw new ValidationError(['Kod leada nie może być pusty']);
    }

    const response = await this.client.getList<RaynetLead>(
      `${this.endpoint}/`,
      { 'code[EQ]': code.trim(), limit: 1 }
    );

    const lead = response.data[0];
    if (!lead) {
      return null;
    }

    return { lead };
  }

  /**
   * Get lead statistics
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    converted: number;
    cancelled: number;
  }> {
    // Get counts for each status (handle API errors gracefully)
    let active = 0;
    let converted = 0;
    let cancelled = 0;

    try {
      const activeResult = await this.client.getList<RaynetLead>(`${this.endpoint}/`, { status: 'B_ACTIVE', limit: 1 });
      active = activeResult.totalCount;
    } catch (error) {
      logger.warn('Failed to get active leads count', { error });
    }

    try {
      const convertedResult = await this.client.getList<RaynetLead>(`${this.endpoint}/`, { status: 'C_CONVERTED', limit: 1 });
      converted = convertedResult.totalCount;
    } catch (error) {
      logger.warn('Failed to get converted leads count', { error });
    }

    try {
      const cancelledResult = await this.client.getList<RaynetLead>(`${this.endpoint}/`, { status: 'D_CANCELLED', limit: 1 });
      cancelled = cancelledResult.totalCount;
    } catch (error) {
      logger.warn('Failed to get cancelled leads count', { error });
    }

    const total = active + converted + cancelled;

    return {
      total,
      active,
      converted,
      cancelled,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: LeadsService | null = null;

/**
 * Get or create the Leads service singleton
 */
export function getLeadsService(): LeadsService {
  if (!serviceInstance) {
    serviceInstance = new LeadsService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetLeadsService(): void {
  serviceInstance = null;
}
