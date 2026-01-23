/**
 * Deals (BusinessCases) API Service
 *
 * CRUD operations for Raynet Business Cases (Szanse sprzedaży)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetBusinessCase,
  RaynetListResponse,
  RaynetResponse,
  ListDealsInput,
  SearchDealsInput,
  GetDealInput,
  CreateDealInput,
  UpdateDealInput,
  UpdateDealPhaseInput,
  DealStatus,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing deals */
type DealQueryParams = Record<string, unknown>;

/** Payload for creating/updating deals */
interface DealPayload {
  name: string;
  company?: number;
  person?: number;
  owner?: number;
  totalAmount?: number;
  probability?: number;
  businessCasePhase?: number;
  status?: DealStatus;
  validFrom?: string;
  scheduledEnd?: string;
  description?: string;
  tags?: string[];
}

/** Result of deal operations */
export interface DealResult {
  deal: RaynetBusinessCase;
}

/** Result of deal list operations */
export interface DealListResult {
  deals: RaynetBusinessCase[];
  totalCount: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Deals Service
// ============================================================================

export class DealsService {
  private client: RaynetClient;
  private readonly endpoint = '/businessCase';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List deals with optional filters
   */
  async list(input: ListDealsInput = {}): Promise<DealListResult> {
    const { limit = 20, offset = 0, status, companyId, ownerId, phaseId } = input;

    const params: DealQueryParams = {
      limit,
      offset,
    };

    if (status) params.status = status;
    if (companyId) params['company[EQ]'] = companyId;
    if (ownerId) params['owner[EQ]'] = ownerId;
    if (phaseId) params['businessCasePhase[EQ]'] = phaseId;

    logger.info('Listing deals', { params });

    const response = await this.client.getList<RaynetBusinessCase>(
      `${this.endpoint}/`,
      params
    );

    return {
      deals: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search deals by name
   */
  async search(input: SearchDealsInput): Promise<DealListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: DealQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching deals', { query, limit, offset });

    const response = await this.client.getList<RaynetBusinessCase>(
      `${this.endpoint}/`,
      params
    );

    return {
      deals: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Get deals by company
   */
  async getByCompany(companyId: number, limit = 20): Promise<DealListResult> {
    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    return this.list({ companyId, limit });
  }

  /**
   * Get active deals
   */
  async getActive(limit = 20, offset = 0): Promise<DealListResult> {
    return this.list({ status: 'B_ACTIVE', limit, offset });
  }

  /**
   * Get won deals
   */
  async getWon(limit = 20, offset = 0): Promise<DealListResult> {
    return this.list({ status: 'C_WON', limit, offset });
  }

  /**
   * Get lost deals
   */
  async getLost(limit = 20, offset = 0): Promise<DealListResult> {
    return this.list({ status: 'D_LOST', limit, offset });
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single deal by ID
   */
  async get(input: GetDealInput): Promise<DealResult> {
    const { dealId } = input;

    if (!dealId || dealId <= 0) {
      throw new ValidationError(['ID szansy sprzedaży musi być liczbą dodatnią']);
    }

    logger.info('Getting deal', { dealId });

    try {
      const response = await this.client.getOne<RaynetBusinessCase>(
        `${this.endpoint}/${dealId}/`
      );

      return { deal: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('szansy sprzedaży', dealId);
      }
      throw error;
    }
  }

  /**
   * Create a new deal
   */
  async create(input: CreateDealInput): Promise<DealResult> {
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa szansy sprzedaży jest wymagana']);
    }
    if (!input.companyId || input.companyId <= 0) {
      throw new ValidationError(['ID firmy jest wymagane']);
    }

    const payload: DealPayload = {
      name: input.name.trim(),
      company: input.companyId,
    };

    // Optional fields
    if (input.contactId) payload.person = input.contactId;
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.totalAmount !== undefined) payload.totalAmount = input.totalAmount;
    if (input.probability !== undefined) payload.probability = input.probability;
    if (input.phaseId) payload.businessCasePhase = input.phaseId;
    if (input.validFrom) payload.validFrom = input.validFrom;
    if (input.scheduledEnd) payload.scheduledEnd = input.scheduledEnd;
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    logger.info('Creating deal', { name: input.name, companyId: input.companyId });

    const response = await this.client.post<RaynetBusinessCase>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Deal created', {
      dealId: response.data.id,
      code: response.data.code,
      name: response.data.name
    });

    return { deal: response.data };
  }

  /**
   * Update an existing deal
   */
  async update(input: UpdateDealInput): Promise<DealResult> {
    const { dealId, ...updates } = input;

    if (!dealId || dealId <= 0) {
      throw new ValidationError(['ID szansy sprzedaży musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current deal to get the _version for optimistic locking
    const currentDeal = await this.client.getOne<RaynetBusinessCase>(`${this.endpoint}/${dealId}/`);
    const version = currentDeal.data._version;

    // Build payload with only provided fields
    const payload: Partial<DealPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.totalAmount !== undefined) payload.totalAmount = updates.totalAmount;
    if (updates.probability !== undefined) payload.probability = updates.probability;
    if (updates.phaseId !== undefined) payload.businessCasePhase = updates.phaseId;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.scheduledEnd !== undefined) payload.scheduledEnd = updates.scheduledEnd;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    logger.info('Updating deal', { dealId, version, updates: Object.keys(payload) });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetBusinessCase>(
        `${this.endpoint}/${dealId}/`,
        payload
      );

      // Fetch the updated deal to return current data
      const updatedDeal = await this.client.getOne<RaynetBusinessCase>(
        `${this.endpoint}/${dealId}/`
      );

      logger.info('Deal updated', { dealId, name: updatedDeal.data.name });

      return { deal: updatedDeal.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('szansy sprzedaży', dealId);
      }
      throw error;
    }
  }

  /**
   * Update deal phase
   */
  async updatePhase(input: UpdateDealPhaseInput): Promise<DealResult> {
    const { dealId, phaseId } = input;

    if (!dealId || dealId <= 0) {
      throw new ValidationError(['ID szansy sprzedaży musi być liczbą dodatnią']);
    }
    if (!phaseId || phaseId <= 0) {
      throw new ValidationError(['ID fazy musi być liczbą dodatnią']);
    }

    logger.info('Updating deal phase', { dealId, phaseId });

    return this.update({ dealId, phaseId });
  }

  /**
   * Mark deal as won
   */
  async markAsWon(dealId: number): Promise<DealResult> {
    logger.info('Marking deal as won', { dealId });
    return this.update({ dealId, status: 'C_WON' });
  }

  /**
   * Mark deal as lost
   */
  async markAsLost(dealId: number): Promise<DealResult> {
    logger.info('Marking deal as lost', { dealId });
    return this.update({ dealId, status: 'D_LOST' });
  }

  /**
   * Delete a deal
   */
  async delete(dealId: number): Promise<void> {
    if (!dealId || dealId <= 0) {
      throw new ValidationError(['ID szansy sprzedaży musi być liczbą dodatnią']);
    }

    logger.info('Deleting deal', { dealId });

    try {
      await this.client.delete(`${this.endpoint}/${dealId}/`);
      logger.info('Deal deleted', { dealId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('szansy sprzedaży', dealId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a deal exists
   */
  async exists(dealId: number): Promise<boolean> {
    try {
      await this.get({ dealId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get deal by code (e.g., SP-26-001)
   */
  async findByCode(code: string): Promise<DealResult | null> {
    if (!code || code.trim().length === 0) {
      throw new ValidationError(['Kod szansy nie może być pusty']);
    }

    const response = await this.client.getList<RaynetBusinessCase>(
      `${this.endpoint}/`,
      { 'code[EQ]': code.trim(), limit: 1 }
    );

    const deal = response.data[0];
    if (!deal) {
      return null;
    }

    return { deal };
  }

  /**
   * Get total pipeline value (sum of active deals)
   */
  async getPipelineValue(): Promise<{ totalValue: number; estimatedValue: number; dealCount: number }> {
    const activeDeals = await this.list({ status: 'B_ACTIVE', limit: 100 });

    let totalValue = 0;
    let estimatedValue = 0;

    for (const deal of activeDeals.deals) {
      totalValue += deal.totalAmount;
      estimatedValue += deal.estimatedValue;
    }

    return {
      totalValue,
      estimatedValue,
      dealCount: activeDeals.totalCount,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: DealsService | null = null;

/**
 * Get or create the Deals service singleton
 */
export function getDealsService(): DealsService {
  if (!serviceInstance) {
    serviceInstance = new DealsService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetDealsService(): void {
  serviceInstance = null;
}
