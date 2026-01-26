/**
 * Products API Service
 *
 * CRUD operations for Raynet Products (Produkty)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetProduct,
  ListProductsInput,
  SearchProductsInput,
  GetProductInput,
  CreateProductInput,
  UpdateProductInput,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing products */
type ProductQueryParams = Record<string, unknown>;

/** Payload for creating/updating products */
interface ProductPayload {
  code?: string;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  currency?: { id: number };
  category?: { id: number };
  owner?: number;
  active?: boolean;
  _version?: number;
}

/** Result of product operations */
export interface ProductResult {
  product: RaynetProduct;
}

/** Result of product list operations */
export interface ProductListResult {
  products: RaynetProduct[];
  totalCount: number;
  limit: number;
  offset: number;
}

// ============================================================================
// Products Service
// ============================================================================

export class ProductsService {
  private client: RaynetClient;
  private readonly endpoint = '/product';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List products with optional filters
   */
  async list(input: ListProductsInput = {}): Promise<ProductListResult> {
    const { limit = 20, offset = 0, categoryId } = input;

    const params: ProductQueryParams = {
      limit,
      offset,
    };

    if (categoryId) params['category[EQ]'] = categoryId;
    // Note: 'active' filter is not supported by Raynet API

    logger.info('Listing products', { params });

    const response = await this.client.getList<RaynetProduct>(
      `${this.endpoint}/`,
      params
    );

    return {
      products: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search products by name or code
   */
  async search(input: SearchProductsInput): Promise<ProductListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: ProductQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching products', { query, limit, offset });

    const response = await this.client.getList<RaynetProduct>(
      `${this.endpoint}/`,
      params
    );

    return {
      products: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single product by ID
   */
  async get(input: GetProductInput): Promise<ProductResult> {
    const { productId } = input;

    if (!productId || productId <= 0) {
      throw new ValidationError(['ID produktu musi być liczbą dodatnią']);
    }

    logger.info('Getting product', { productId });

    try {
      const response = await this.client.getOne<RaynetProduct>(
        `${this.endpoint}/${productId}/`
      );

      return { product: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('produktu', productId);
      }
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async create(input: CreateProductInput): Promise<ProductResult> {
    // Validate required fields
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa produktu jest wymagana']);
    }

    const payload: ProductPayload = {
      name: input.name.trim(),
      active: true,
    };

    // Optional fields
    if (input.code) payload.code = input.code;
    if (input.description) payload.description = input.description;
    if (input.unit) payload.unit = input.unit;
    if (input.price !== undefined) payload.price = input.price;
    if (input.taxRate !== undefined) payload.taxRate = input.taxRate;
    if (input.currencyId) payload.currency = { id: input.currencyId };
    if (input.categoryId) payload.category = { id: input.categoryId };
    if (input.ownerId) payload.owner = input.ownerId;

    logger.info('Creating product', { name: input.name });

    const response = await this.client.put<RaynetProduct>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Product created', { productId: response.data.id, name: response.data.name });

    return { product: response.data };
  }

  /**
   * Update an existing product
   */
  async update(input: UpdateProductInput): Promise<ProductResult> {
    const { productId, ...updates } = input;

    if (!productId || productId <= 0) {
      throw new ValidationError(['ID produktu musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current product to get the _version for optimistic locking
    const currentProduct = await this.client.getOne<RaynetProduct>(`${this.endpoint}/${productId}/`);
    const version = currentProduct.data._version;

    // Build payload with only provided fields
    const payload: Partial<ProductPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.code !== undefined) payload.code = updates.code;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.unit !== undefined) payload.unit = updates.unit;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.taxRate !== undefined) payload.taxRate = updates.taxRate;
    if (updates.currencyId !== undefined) payload.currency = { id: updates.currencyId };
    if (updates.categoryId !== undefined) payload.category = { id: updates.categoryId };
    if (updates.active !== undefined) payload.active = updates.active;

    logger.info('Updating product', { productId, version, updates: Object.keys(payload) });

    try {
      await this.client.post<RaynetProduct>(
        `${this.endpoint}/${productId}/`,
        payload
      );

      // Fetch the updated product to return current data
      const updatedProduct = await this.client.getOne<RaynetProduct>(
        `${this.endpoint}/${productId}/`
      );

      logger.info('Product updated', { productId, name: updatedProduct.data.name });

      return { product: updatedProduct.data };
    } catch (error) {
      logger.error('Product update failed', { productId, payload, error });
      if (error instanceof NotFoundError) {
        throw new NotFoundError('produktu', productId);
      }
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async delete(productId: number): Promise<void> {
    if (!productId || productId <= 0) {
      throw new ValidationError(['ID produktu musi być liczbą dodatnią']);
    }

    logger.info('Deleting product', { productId });

    try {
      await this.client.delete(`${this.endpoint}/${productId}/`);
      logger.info('Product deleted', { productId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('produktu', productId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a product exists
   */
  async exists(productId: number): Promise<boolean> {
    try {
      await this.get({ productId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get product by code
   */
  async findByCode(code: string): Promise<ProductResult | null> {
    if (!code || code.trim().length === 0) {
      throw new ValidationError(['Kod produktu nie może być pusty']);
    }

    const response = await this.client.getList<RaynetProduct>(
      `${this.endpoint}/`,
      { 'code[EQ]': code.trim(), limit: 1 }
    );

    const product = response.data[0];
    if (!product) {
      return null;
    }

    return { product };
  }

  /**
   * Get active products only
   */
  async getActive(limit = 20, offset = 0): Promise<ProductListResult> {
    return this.list({ active: true, limit, offset });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ProductsService | null = null;

/**
 * Get or create the Products service singleton
 */
export function getProductsService(): ProductsService {
  serviceInstance ??= new ProductsService();
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetProductsService(): void {
  serviceInstance = null;
}
