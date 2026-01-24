/**
 * Companies API Service
 *
 * CRUD operations for Raynet Companies (Firmy)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetCompany,
  RaynetListResponse,
  RaynetResponse,
  ListCompaniesInput,
  SearchCompaniesInput,
  GetCompanyInput,
  CreateCompanyInput,
  UpdateCompanyInput,
  CompanyState,
  CompanyRole,
  Rating,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing companies */
type CompanyQueryParams = Record<string, unknown>;

/** Payload for creating/updating companies */
interface CompanyPayload {
  name: string;
  role?: CompanyRole;
  state?: CompanyState;
  rating?: Rating;
  owner?: number;
  category?: number;
  regNumber?: string;
  taxNumber?: string;
  notice?: string;
  tags?: string[];
  primaryAddress?: {
    address?: {
      street?: string;
      city?: string;
      zipCode?: string;
      country?: string;
    };
    contactInfo?: {
      email?: string;
      tel1?: string;
      www?: string;
    };
  };
}

/** Result of company operations */
export interface CompanyResult {
  company: RaynetCompany;
}

/** Result of company list operations */
export interface CompanyListResult {
  companies: RaynetCompany[];
  totalCount: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Companies Service
// ============================================================================

export class CompaniesService {
  private client: RaynetClient;
  private readonly endpoint = '/company';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List companies with optional filters
   */
  async list(input: ListCompaniesInput = {}): Promise<CompanyListResult> {
    const { limit = 20, offset = 0, state, role, rating, ownerId, categoryId } = input;

    const params: CompanyQueryParams = {
      limit,
      offset,
    };

    if (state) params.state = state;
    if (role) params.role = role;
    if (rating) params.rating = rating;
    if (ownerId) params['owner[EQ]'] = ownerId;
    if (categoryId) params['category[EQ]'] = categoryId;

    logger.info('Listing companies', { params });

    const response = await this.client.getList<RaynetCompany>(
      `${this.endpoint}/`,
      params
    );

    return {
      companies: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search companies by name
   */
  async search(input: SearchCompaniesInput): Promise<CompanyListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: CompanyQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching companies', { query, limit, offset });

    const response = await this.client.getList<RaynetCompany>(
      `${this.endpoint}/`,
      params
    );

    return {
      companies: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single company by ID
   */
  async get(input: GetCompanyInput): Promise<CompanyResult> {
    const { companyId } = input;

    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    logger.info('Getting company', { companyId });

    try {
      const response = await this.client.getOne<RaynetCompany>(
        `${this.endpoint}/${companyId}/`
      );

      return { company: response.data };
    } catch (error) {
      // Enhance not found error with context
      if (error instanceof NotFoundError) {
        throw new NotFoundError('firmy', companyId);
      }
      throw error;
    }
  }

  /**
   * Create a new company
   */
  async create(input: CreateCompanyInput): Promise<CompanyResult> {
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa firmy jest wymagana']);
    }

    const payload: CompanyPayload = {
      name: input.name.trim(),
      // Raynet API requires state, role, and rating - use defaults if not provided
      state: input.state ?? 'A_POTENTIAL',
      role: input.role ?? 'A_SUBSCRIBER',
      rating: input.rating ?? 'B',
    };

    // Optional fields - role, state, rating already set above
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.categoryId) payload.category = input.categoryId;
    if (input.regNumber) payload.regNumber = input.regNumber;
    if (input.taxNumber) payload.taxNumber = input.taxNumber;
    if (input.notice) payload.notice = input.notice;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    // Address and contact info
    if (input.address || input.contactInfo) {
      payload.primaryAddress = {};

      if (input.address) {
        const addr: Record<string, string> = {};
        if (input.address.street) addr.street = input.address.street;
        if (input.address.city) addr.city = input.address.city;
        if (input.address.zipCode) addr.zipCode = input.address.zipCode;
        addr.country = input.address.country ?? 'Polska';
        payload.primaryAddress.address = addr;
      }

      if (input.contactInfo) {
        const contact: Record<string, string> = {};
        if (input.contactInfo.email) contact.email = input.contactInfo.email;
        if (input.contactInfo.tel1) contact.tel1 = input.contactInfo.tel1;
        if (input.contactInfo.www) contact.www = input.contactInfo.www;
        payload.primaryAddress.contactInfo = contact;
      }
    }

    logger.info('Creating company', { name: input.name });

    // Raynet API uses PUT for creating new records
    const response = await this.client.put<RaynetCompany>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Company created', { companyId: response.data.id, name: response.data.name });

    return { company: response.data };
  }

  /**
   * Update an existing company
   */
  async update(input: UpdateCompanyInput): Promise<CompanyResult> {
    const { companyId, ...updates } = input;

    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current company to get the _version for optimistic locking
    const currentCompany = await this.client.getOne<RaynetCompany>(`${this.endpoint}/${companyId}/`);
    const version = currentCompany.data._version;

    // Build payload with only provided fields
    const payload: Partial<CompanyPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.state !== undefined) payload.state = updates.state;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.ownerId !== undefined) payload.owner = updates.ownerId;
    if (updates.categoryId !== undefined) payload.category = updates.categoryId;
    if (updates.notice !== undefined) payload.notice = updates.notice;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    logger.info('Updating company', { companyId, version, updates: Object.keys(payload), payload });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetCompany>(
        `${this.endpoint}/${companyId}/`,
        payload
      );

      // Fetch the updated company to return current data
      const updatedCompany = await this.client.getOne<RaynetCompany>(
        `${this.endpoint}/${companyId}/`
      );

      logger.info('Company updated', { companyId, name: updatedCompany.data.name });

      return { company: updatedCompany.data };
    } catch (error) {
      logger.error('Company update failed', { companyId, payload, error });
      if (error instanceof NotFoundError) {
        throw new NotFoundError('firmy', companyId);
      }
      throw error;
    }
  }

  /**
   * Delete a company
   */
  async delete(companyId: number): Promise<void> {
    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    logger.info('Deleting company', { companyId });

    try {
      await this.client.delete(`${this.endpoint}/${companyId}/`);
      logger.info('Company deleted', { companyId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('firmy', companyId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a company exists
   */
  async exists(companyId: number): Promise<boolean> {
    try {
      await this.get({ companyId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get company by registration number (NIP/IČO)
   */
  async findByRegNumber(regNumber: string): Promise<CompanyResult | null> {
    if (!regNumber || regNumber.trim().length === 0) {
      throw new ValidationError(['Numer rejestracyjny nie może być pusty']);
    }

    const response = await this.client.getList<RaynetCompany>(
      `${this.endpoint}/`,
      { 'regNumber[EQ]': regNumber.trim(), limit: 1 }
    );

    const company = response.data[0];
    if (!company) {
      return null;
    }

    return { company };
  }

  /**
   * Get companies by owner
   */
  async findByOwner(ownerId: number, limit = 20): Promise<CompanyListResult> {
    return this.list({ ownerId, limit });
  }

  /**
   * Get potential companies (state = A_POTENTIAL)
   */
  async getPotential(limit = 20, offset = 0): Promise<CompanyListResult> {
    return this.list({ state: 'A_POTENTIAL', limit, offset });
  }

  /**
   * Get active companies (state = B_ACTUAL)
   */
  async getActive(limit = 20, offset = 0): Promise<CompanyListResult> {
    return this.list({ state: 'B_ACTUAL', limit, offset });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: CompaniesService | null = null;

/**
 * Get or create the Companies service singleton
 */
export function getCompaniesService(): CompaniesService {
  if (!serviceInstance) {
    serviceInstance = new CompaniesService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetCompaniesService(): void {
  serviceInstance = null;
}
