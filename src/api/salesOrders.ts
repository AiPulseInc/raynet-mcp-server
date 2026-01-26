/**
 * Sales Orders API Service
 *
 * CRUD operations for Raynet Sales Orders (Zamówienia sprzedaży)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetSalesOrder,
  RaynetSalesOrderItem,
  ListSalesOrdersInput,
  SearchSalesOrdersInput,
  GetSalesOrderInput,
  CreateSalesOrderInput,
  CreateSalesOrderWithItemsInput,
  CreateSalesOrderFromOfferInput,
  UpdateSalesOrderInput,
  AddSalesOrderItemInput,
  RemoveSalesOrderItemInput,
  SalesOrderStatus,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing sales orders */
type SalesOrderQueryParams = Record<string, unknown>;

/** Payload for creating/updating sales orders */
interface SalesOrderPayload {
  name: string;
  company: number;
  person?: number;
  businessCase?: number;
  offer?: number;
  owner?: number;
  orderDate?: string;
  deliveryDate?: string;
  deliveryAddress?: number;
  invoiceAddress?: number;
  description?: string;
  status?: SalesOrderStatus;
  tags?: string[];
  _version?: number;
}

/** Payload for sales order items */
interface SalesOrderItemPayload {
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

/** Result of sales order operations */
export interface SalesOrderResult {
  salesOrder: RaynetSalesOrder;
}

/** Result of sales order list operations */
export interface SalesOrderListResult {
  salesOrders: RaynetSalesOrder[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Result of sales order item operations */
export interface SalesOrderItemResult {
  item: RaynetSalesOrderItem;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize date to YYYY-MM-DD format for Raynet API
 */
function normalizeDate(isoDate: string): string {
  return isoDate.replace('T', ' ').slice(0, 10);
}

// ============================================================================
// Sales Orders Service
// ============================================================================

export class SalesOrdersService {
  private client: RaynetClient;
  private readonly endpoint = '/salesOrder';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List sales orders with optional filters
   */
  async list(input: ListSalesOrdersInput = {}): Promise<SalesOrderListResult> {
    const { limit = 20, offset = 0, status, companyId, dealId, offerId, ownerId } = input;

    const params: SalesOrderQueryParams = {
      limit,
      offset,
    };

    if (status) params['status[EQ]'] = status;
    if (companyId) params['company[EQ]'] = companyId;
    if (dealId) params['businessCase[EQ]'] = dealId;
    if (offerId) params['offer[EQ]'] = offerId;
    if (ownerId) params['owner[EQ]'] = ownerId;

    logger.info('Listing sales orders', { params });

    const response = await this.client.getList<RaynetSalesOrder>(
      `${this.endpoint}/`,
      params
    );

    return {
      salesOrders: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search sales orders by name
   */
  async search(input: SearchSalesOrdersInput): Promise<SalesOrderListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: SalesOrderQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching sales orders', { query, limit, offset });

    const response = await this.client.getList<RaynetSalesOrder>(
      `${this.endpoint}/`,
      params
    );

    return {
      salesOrders: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single sales order by ID
   */
  async get(input: GetSalesOrderInput): Promise<SalesOrderResult> {
    const { salesOrderId } = input;

    if (!salesOrderId || salesOrderId <= 0) {
      throw new ValidationError(['ID zamówienia musi być liczbą dodatnią']);
    }

    logger.info('Getting sales order', { salesOrderId });

    try {
      const response = await this.client.getOne<RaynetSalesOrder>(
        `${this.endpoint}/${salesOrderId}/`
      );

      return { salesOrder: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('zamówienia', salesOrderId);
      }
      throw error;
    }
  }

  /**
   * Create a new sales order
   */
  async create(input: CreateSalesOrderInput): Promise<SalesOrderResult> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa zamówienia jest wymagana']);
    }
    if (!input.companyId || input.companyId <= 0) {
      throw new ValidationError(['ID firmy jest wymagane']);
    }

    const payload: SalesOrderPayload = {
      name: input.name.trim(),
      company: input.companyId,
      status: 'B_ACTIVE',
    };

    if (input.dealId) payload.businessCase = input.dealId;
    if (input.offerId) payload.offer = input.offerId;
    if (input.contactId) payload.person = input.contactId;
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.orderDate) payload.orderDate = normalizeDate(input.orderDate);
    if (input.deliveryDate) payload.deliveryDate = normalizeDate(input.deliveryDate);
    if (input.deliveryAddressId) payload.deliveryAddress = input.deliveryAddressId;
    if (input.invoiceAddressId) payload.invoiceAddress = input.invoiceAddressId;
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    logger.info('Creating sales order', { name: input.name, companyId: input.companyId });

    const response = await this.client.put<RaynetSalesOrder>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Sales order created', { salesOrderId: response.data.id, name: response.data.name });

    return { salesOrder: response.data };
  }

  /**
   * Create a new sales order with line items
   */
  async createWithItems(input: CreateSalesOrderWithItemsInput): Promise<SalesOrderResult> {
    const orderResult = await this.create({
      name: input.name,
      companyId: input.companyId,
      dealId: input.dealId,
      offerId: input.offerId,
      contactId: input.contactId,
      ownerId: input.ownerId,
      orderDate: input.orderDate,
      deliveryDate: input.deliveryDate,
      deliveryAddressId: input.deliveryAddressId,
      invoiceAddressId: input.invoiceAddressId,
      description: input.description,
      tags: input.tags,
    });

    const salesOrderId = orderResult.salesOrder.id;

    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        await this.addItem({ salesOrderId, item });
      }
    }

    return this.get({ salesOrderId });
  }

  /**
   * Create a sales order from an existing offer
   */
  async createFromOffer(input: CreateSalesOrderFromOfferInput): Promise<SalesOrderResult> {
    const { offerId, orderDate, deliveryDate } = input;

    if (!offerId || offerId <= 0) {
      throw new ValidationError(['ID oferty jest wymagane']);
    }

    logger.info('Creating sales order from offer', { offerId });

    const payload: Record<string, unknown> = {
      offer: offerId,
    };

    if (orderDate) payload.orderDate = normalizeDate(orderDate);
    if (deliveryDate) payload.deliveryDate = normalizeDate(deliveryDate);

    const response = await this.client.put<RaynetSalesOrder>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Sales order created from offer', {
      salesOrderId: response.data.id,
      offerId
    });

    return { salesOrder: response.data };
  }

  /**
   * Update an existing sales order
   */
  async update(input: UpdateSalesOrderInput): Promise<SalesOrderResult> {
    const { salesOrderId, ...updates } = input;

    if (!salesOrderId || salesOrderId <= 0) {
      throw new ValidationError(['ID zamówienia musi być liczbą dodatnią']);
    }

    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    const currentOrder = await this.client.getOne<RaynetSalesOrder>(`${this.endpoint}/${salesOrderId}/`);
    const version = currentOrder.data._version;

    const payload: Partial<SalesOrderPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.orderDate !== undefined) payload.orderDate = normalizeDate(updates.orderDate);
    if (updates.deliveryDate !== undefined) payload.deliveryDate = normalizeDate(updates.deliveryDate);
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    logger.info('Updating sales order', { salesOrderId, version, updates: Object.keys(payload) });

    try {
      await this.client.post<RaynetSalesOrder>(
        `${this.endpoint}/${salesOrderId}/`,
        payload
      );

      const updatedOrder = await this.client.getOne<RaynetSalesOrder>(
        `${this.endpoint}/${salesOrderId}/`
      );

      logger.info('Sales order updated', { salesOrderId, name: updatedOrder.data.name });

      return { salesOrder: updatedOrder.data };
    } catch (error) {
      logger.error('Sales order update failed', { salesOrderId, payload, error });
      if (error instanceof NotFoundError) {
        throw new NotFoundError('zamówienia', salesOrderId);
      }
      throw error;
    }
  }

  /**
   * Delete a sales order
   */
  async delete(salesOrderId: number): Promise<void> {
    if (!salesOrderId || salesOrderId <= 0) {
      throw new ValidationError(['ID zamówienia musi być liczbą dodatnią']);
    }

    logger.info('Deleting sales order', { salesOrderId });

    try {
      await this.client.delete(`${this.endpoint}/${salesOrderId}/`);
      logger.info('Sales order deleted', { salesOrderId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('zamówienia', salesOrderId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Item Operations
  // ==========================================================================

  /**
   * Add an item to a sales order
   */
  async addItem(input: AddSalesOrderItemInput): Promise<SalesOrderItemResult> {
    const { salesOrderId, item } = input;

    if (!salesOrderId || salesOrderId <= 0) {
      throw new ValidationError(['ID zamówienia musi być liczbą dodatnią']);
    }

    if (!item.name || item.name.trim().length === 0) {
      throw new ValidationError(['Nazwa pozycji jest wymagana']);
    }

    if (item.quantity === undefined || item.quantity <= 0) {
      throw new ValidationError(['Ilość musi być liczbą dodatnią']);
    }

    const itemPayload: SalesOrderItemPayload = {
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

    logger.info('Adding sales order item', { salesOrderId, itemName: item.name });

    const response = await this.client.put<RaynetSalesOrderItem>(
      `${this.endpoint}/${salesOrderId}/item/`,
      itemPayload
    );

    logger.info('Sales order item added', { salesOrderId, itemId: response.data.id });

    return { item: response.data };
  }

  /**
   * Remove an item from a sales order
   */
  async removeItem(input: RemoveSalesOrderItemInput): Promise<void> {
    const { salesOrderId, itemId } = input;

    if (!salesOrderId || salesOrderId <= 0) {
      throw new ValidationError(['ID zamówienia musi być liczbą dodatnią']);
    }

    if (!itemId || itemId <= 0) {
      throw new ValidationError(['ID pozycji musi być liczbą dodatnią']);
    }

    logger.info('Removing sales order item', { salesOrderId, itemId });

    try {
      await this.client.delete(`${this.endpoint}/${salesOrderId}/item/${itemId}/`);
      logger.info('Sales order item removed', { salesOrderId, itemId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('pozycji zamówienia', itemId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  async exists(salesOrderId: number): Promise<boolean> {
    try {
      await this.get({ salesOrderId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  async getActive(limit = 20, offset = 0): Promise<SalesOrderListResult> {
    return this.list({ status: 'B_ACTIVE', limit, offset });
  }

  async getByCompany(companyId: number, limit = 20): Promise<SalesOrderListResult> {
    return this.list({ companyId, limit });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: SalesOrdersService | null = null;

export function getSalesOrdersService(): SalesOrdersService {
  serviceInstance ??= new SalesOrdersService();
  return serviceInstance;
}

export function resetSalesOrdersService(): void {
  serviceInstance = null;
}
