/**
 * Offers API Service
 *
 * CRUD operations for Raynet Offers (Nabídky)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetOffer,
  RaynetOfferItem,
  ListOffersInput,
  SearchOffersInput,
  GetOfferInput,
  CreateOfferInput,
  CreateOfferWithItemsInput,
  UpdateOfferInput,
  AddOfferItemInput,
  RemoveOfferItemInput,
  OfferStatus,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing offers */
type OfferQueryParams = Record<string, unknown>;

/** Payload for creating/updating offers */
interface OfferPayload {
  name: string;
  company: number;
  person?: number;
  businessCase?: number;
  owner?: number;
  validFrom?: string;
  validTill?: string;
  description?: string;
  status?: OfferStatus;
  tags?: string[];
  _version?: number;
}

/** Payload for offer items */
interface OfferItemPayload {
  product?: number;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  count: number;
  price: number;
  taxRate?: number;
  discountPercent?: number;
}

/** Result of offer operations */
export interface OfferResult {
  offer: RaynetOffer;
}

/** Result of offer list operations */
export interface OfferListResult {
  offers: RaynetOffer[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Result of offer item operations */
export interface OfferItemResult {
  item: RaynetOfferItem;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize date to YYYY-MM-DD format for Raynet API
 */
function normalizeDate(isoDate: string): string {
  // Handle ISO format: 2026-01-25T10:00:00.000Z -> 2026-01-25
  return isoDate.replace('T', ' ').slice(0, 10);
}

// ============================================================================
// Offers Service
// ============================================================================

export class OffersService {
  private client: RaynetClient;
  private readonly endpoint = '/offer';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List offers with optional filters
   */
  async list(input: ListOffersInput = {}): Promise<OfferListResult> {
    const { limit = 20, offset = 0, status, companyId, dealId, ownerId } = input;

    const params: OfferQueryParams = {
      limit,
      offset,
    };

    if (status) params['status[EQ]'] = status;
    if (companyId) params['company[EQ]'] = companyId;
    if (dealId) params['businessCase[EQ]'] = dealId;
    if (ownerId) params['owner[EQ]'] = ownerId;

    logger.info('Listing offers', { params });

    const response = await this.client.getList<RaynetOffer>(
      `${this.endpoint}/`,
      params
    );

    return {
      offers: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search offers by name
   */
  async search(input: SearchOffersInput): Promise<OfferListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: OfferQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching offers', { query, limit, offset });

    const response = await this.client.getList<RaynetOffer>(
      `${this.endpoint}/`,
      params
    );

    return {
      offers: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single offer by ID
   */
  async get(input: GetOfferInput): Promise<OfferResult> {
    const { offerId } = input;

    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty musi być liczbą dodatnią']);
    }

    logger.info('Getting offer', { offerId });

    try {
      const response = await this.client.getOne<RaynetOffer>(
        `${this.endpoint}/${offerId}/`
      );

      return { offer: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('oferty', offerId);
      }
      throw error;
    }
  }

  /**
   * Create a new offer
   */
  async create(input: CreateOfferInput): Promise<OfferResult> {
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa oferty jest wymagana']);
    }
    if (!input.companyId || input.companyId <= 0) {
      throw new ValidationError(['ID firmy jest wymagane']);
    }

    const payload: OfferPayload = {
      name: input.name.trim(),
      company: input.companyId,
      status: 'B_ACTIVE',
    };

    // Optional fields
    if (input.dealId) payload.businessCase = input.dealId;
    if (input.contactId) payload.person = input.contactId;
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.validFrom) payload.validFrom = normalizeDate(input.validFrom);
    if (input.validTill) payload.validTill = normalizeDate(input.validTill);
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    logger.info('Creating offer', { name: input.name, companyId: input.companyId });

    const response = await this.client.put<RaynetOffer>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Offer created', { offerId: response.data.id, name: response.data.name });

    return { offer: response.data };
  }

  /**
   * Create a new offer with line items
   */
  async createWithItems(input: CreateOfferWithItemsInput): Promise<OfferResult> {
    // First create the offer
    const offerResult = await this.create({
      name: input.name,
      companyId: input.companyId,
      dealId: input.dealId,
      contactId: input.contactId,
      ownerId: input.ownerId,
      validFrom: input.validFrom,
      validTill: input.validTill,
      description: input.description,
      tags: input.tags,
    });

    const offerId = offerResult.offer.id;

    // Add items
    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        await this.addItem({ offerId, item });
      }
    }

    // Fetch the complete offer with items
    return this.get({ offerId });
  }

  /**
   * Update an existing offer
   */
  async update(input: UpdateOfferInput): Promise<OfferResult> {
    const { offerId, ...updates } = input;

    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current offer to get the _version for optimistic locking
    const currentOffer = await this.client.getOne<RaynetOffer>(`${this.endpoint}/${offerId}/`);
    const version = currentOffer.data._version;

    // Build payload with only provided fields
    const payload: Partial<OfferPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.validFrom !== undefined) payload.validFrom = normalizeDate(updates.validFrom);
    if (updates.validTill !== undefined) payload.validTill = normalizeDate(updates.validTill);
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    logger.info('Updating offer', { offerId, version, updates: Object.keys(payload) });

    try {
      await this.client.post<RaynetOffer>(
        `${this.endpoint}/${offerId}/`,
        payload
      );

      // Fetch the updated offer to return current data
      const updatedOffer = await this.client.getOne<RaynetOffer>(
        `${this.endpoint}/${offerId}/`
      );

      logger.info('Offer updated', { offerId, name: updatedOffer.data.name });

      return { offer: updatedOffer.data };
    } catch (error) {
      logger.error('Offer update failed', { offerId, payload, error });
      if (error instanceof NotFoundError) {
        throw new NotFoundError('oferty', offerId);
      }
      throw error;
    }
  }

  /**
   * Delete an offer
   */
  async delete(offerId: number): Promise<void> {
    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty musi być liczbą dodatnią']);
    }

    logger.info('Deleting offer', { offerId });

    try {
      await this.client.delete(`${this.endpoint}/${offerId}/`);
      logger.info('Offer deleted', { offerId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('oferty', offerId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Item Operations
  // ==========================================================================

  /**
   * Add an item to an offer
   */
  async addItem(input: AddOfferItemInput): Promise<OfferItemResult> {
    const { offerId, item } = input;

    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty musi być liczbą dodatnią']);
    }

    if (!item.name || item.name.trim().length === 0) {
      throw new ValidationError(['Nazwa pozycji jest wymagana']);
    }

    if (item.quantity === undefined || item.quantity <= 0) {
      throw new ValidationError(['Ilość musi być liczbą dodatnią']);
    }

    const itemPayload: OfferItemPayload = {
      name: item.name.trim(),
      count: item.quantity,
      price: item.price || 0,
    };

    if (item.productId) itemPayload.product = item.productId;
    if (item.code) itemPayload.code = item.code;
    if (item.description) itemPayload.description = item.description;
    if (item.unit) itemPayload.unit = item.unit;
    if (item.taxRate !== undefined) itemPayload.taxRate = item.taxRate;
    if (item.discount !== undefined) itemPayload.discountPercent = item.discount;

    logger.info('Adding offer item', { offerId, itemName: item.name });

    const response = await this.client.put<RaynetOfferItem>(
      `${this.endpoint}/${offerId}/item/`,
      itemPayload
    );

    logger.info('Offer item added', { offerId, itemId: response.data.id });

    return { item: response.data };
  }

  /**
   * Remove an item from an offer
   */
  async removeItem(input: RemoveOfferItemInput): Promise<void> {
    const { offerId, itemId } = input;

    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty musi być liczbą dodatnią']);
    }

    if (!itemId || itemId <= 0) {
      throw new ValidationError(['ID pozycji musi być liczbą dodatnią']);
    }

    logger.info('Removing offer item', { offerId, itemId });

    try {
      await this.client.delete(`${this.endpoint}/${offerId}/item/${itemId}/`);
      logger.info('Offer item removed', { offerId, itemId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('pozycji oferty', itemId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if an offer exists
   */
  async exists(offerId: number): Promise<boolean> {
    try {
      await this.get({ offerId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get active offers only
   */
  async getActive(limit = 20, offset = 0): Promise<OfferListResult> {
    return this.list({ status: 'B_ACTIVE', limit, offset });
  }

  /**
   * Get offers for a company
   */
  async getByCompany(companyId: number, limit = 20): Promise<OfferListResult> {
    return this.list({ companyId, limit });
  }

  /**
   * Get offers for a deal
   */
  async getByDeal(dealId: number, limit = 20): Promise<OfferListResult> {
    return this.list({ dealId, limit });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: OffersService | null = null;

/**
 * Get or create the Offers service singleton
 */
export function getOffersService(): OffersService {
  serviceInstance ??= new OffersService();
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetOffersService(): void {
  serviceInstance = null;
}
