/**
 * MCP Tools for Sales Orders (Zamówienia sprzedaży)
 *
 * Tools for managing Raynet CRM sales orders via MCP protocol
 */

import { z } from 'zod';
import { getSalesOrdersService } from '../api/salesOrders';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetSalesOrder, RaynetSalesOrderItem } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

export const ListSalesOrdersSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO']).optional(),
  companyId: z.number().int().positive().optional(),
  dealId: z.number().int().positive().optional(),
  offerId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const SearchSalesOrdersSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetSalesOrderSchema = z.object({
  salesOrderId: z.number().int().positive('ID zamówienia musi być liczbą dodatnią'),
});

const SalesOrderItemSchema = z.object({
  productId: z.number().int().positive().optional(),
  name: z.string().min(1, 'Nazwa pozycji jest wymagana'),
  code: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().positive('Ilość musi być dodatnia'),
  price: z.number().min(0),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).max(100).optional(),
});

export const CreateSalesOrderSchema = z.object({
  name: z.string().min(1, 'Nazwa zamówienia jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  dealId: z.number().int().positive('ID szansy sprzedaży jest wymagane'),
  offerId: z.number().int().positive().optional(),
  contactId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddressId: z.number().int().positive().optional(),
  invoiceAddressId: z.number().int().positive().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateSalesOrderWithItemsSchema = z.object({
  name: z.string().min(1, 'Nazwa zamówienia jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  dealId: z.number().int().positive('ID szansy sprzedaży jest wymagane'),
  offerId: z.number().int().positive().optional(),
  contactId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  deliveryAddressId: z.number().int().positive().optional(),
  invoiceAddressId: z.number().int().positive().optional(),
  description: z.string().optional(),
  items: z.array(SalesOrderItemSchema).min(1, 'Przynajmniej jedna pozycja jest wymagana'),
  tags: z.array(z.string()).optional(),
});

export const CreateSalesOrderFromOfferSchema = z.object({
  offerId: z.number().int().positive('ID oferty jest wymagane'),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
});

export const UpdateSalesOrderSchema = z.object({
  salesOrderId: z.number().int().positive('ID zamówienia musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  status: z.enum(['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO']).optional(),
  orderDate: z.string().optional(),
  deliveryDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteSalesOrderSchema = z.object({
  salesOrderId: z.number().int().positive('ID zamówienia musi być liczbą dodatnią'),
});

export const AddSalesOrderItemSchema = z.object({
  salesOrderId: z.number().int().positive('ID zamówienia musi być liczbą dodatnią'),
  item: SalesOrderItemSchema,
});

export const RemoveSalesOrderItemSchema = z.object({
  salesOrderId: z.number().int().positive('ID zamówienia musi być liczbą dodatnią'),
  itemId: z.number().int().positive('ID pozycji musi być liczbą dodatnią'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const salesOrderToolDefinitions = [
  {
    name: 'raynet_list_sales_orders',
    description: 'Pobiera listę zamówień sprzedaży z Raynet CRM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Maksymalna liczba wyników (1-100)', default: 20 },
        offset: { type: 'number', description: 'Pomiń pierwsze N wyników', default: 0 },
        status: { type: 'string', enum: ['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO'], description: 'Filtruj po statusie' },
        companyId: { type: 'number', description: 'Filtruj po ID firmy' },
        dealId: { type: 'number', description: 'Filtruj po ID szansy sprzedaży' },
        offerId: { type: 'number', description: 'Filtruj po ID oferty' },
        ownerId: { type: 'number', description: 'Filtruj po ID właściciela' },
      },
    },
  },
  {
    name: 'raynet_search_sales_orders',
    description: 'Wyszukuje zamówienia sprzedaży po nazwie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Tekst do wyszukania' },
        limit: { type: 'number', description: 'Maksymalna liczba wyników', default: 20 },
        offset: { type: 'number', description: 'Pomiń pierwsze N wyników', default: 0 },
      },
      required: ['query'],
    },
  },
  {
    name: 'raynet_get_sales_order',
    description: 'Pobiera szczegóły zamówienia sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        salesOrderId: { type: 'number', description: 'ID zamówienia' },
      },
      required: ['salesOrderId'],
    },
  },
  {
    name: 'raynet_create_sales_order',
    description: 'Tworzy nowe zamówienie sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nazwa zamówienia (wymagana)' },
        companyId: { type: 'number', description: 'ID firmy (wymagane)' },
        dealId: { type: 'number', description: 'ID szansy sprzedaży (wymagane)' },
        offerId: { type: 'number', description: 'ID oferty źródłowej' },
        contactId: { type: 'number', description: 'ID kontaktu' },
        ownerId: { type: 'number', description: 'ID właściciela' },
        orderDate: { type: 'string', description: 'Data zamówienia (YYYY-MM-DD)' },
        deliveryDate: { type: 'string', description: 'Data dostawy (YYYY-MM-DD)' },
        deliveryAddressId: { type: 'number', description: 'ID adresu dostawy' },
        invoiceAddressId: { type: 'number', description: 'ID adresu faktury' },
        description: { type: 'string', description: 'Opis' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tagi' },
      },
      required: ['name', 'companyId', 'dealId'],
    },
  },
  {
    name: 'raynet_create_sales_order_with_items',
    description: 'Tworzy zamówienie sprzedaży z pozycjami.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nazwa zamówienia (wymagana)' },
        companyId: { type: 'number', description: 'ID firmy (wymagane)' },
        dealId: { type: 'number', description: 'ID szansy sprzedaży (wymagane)' },
        offerId: { type: 'number', description: 'ID oferty' },
        contactId: { type: 'number', description: 'ID kontaktu' },
        ownerId: { type: 'number', description: 'ID właściciela' },
        orderDate: { type: 'string', description: 'Data zamówienia' },
        deliveryDate: { type: 'string', description: 'Data dostawy' },
        deliveryAddressId: { type: 'number', description: 'ID adresu dostawy' },
        invoiceAddressId: { type: 'number', description: 'ID adresu faktury' },
        description: { type: 'string', description: 'Opis' },
        items: { type: 'array', description: 'Pozycje zamówienia (wymagane)', items: { type: 'object' } },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tagi' },
      },
      required: ['name', 'companyId', 'dealId', 'items'],
    },
  },
  {
    name: 'raynet_create_sales_order_from_offer',
    description: 'Tworzy zamówienie sprzedaży z istniejącej oferty.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: { type: 'number', description: 'ID oferty źródłowej (wymagane)' },
        orderDate: { type: 'string', description: 'Data zamówienia' },
        deliveryDate: { type: 'string', description: 'Data dostawy' },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'raynet_update_sales_order',
    description: 'Aktualizuje zamówienie sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        salesOrderId: { type: 'number', description: 'ID zamówienia (wymagane)' },
        name: { type: 'string', description: 'Nowa nazwa' },
        status: { type: 'string', enum: ['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO'], description: 'Nowy status' },
        orderDate: { type: 'string', description: 'Nowa data zamówienia' },
        deliveryDate: { type: 'string', description: 'Nowa data dostawy' },
        description: { type: 'string', description: 'Nowy opis' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Nowe tagi' },
      },
      required: ['salesOrderId'],
    },
  },
  {
    name: 'raynet_delete_sales_order',
    description: 'Usuwa zamówienie sprzedaży. UWAGA: Nieodwracalne!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        salesOrderId: { type: 'number', description: 'ID zamówienia do usunięcia' },
      },
      required: ['salesOrderId'],
    },
  },
  {
    name: 'raynet_add_sales_order_item',
    description: 'Dodaje pozycję do zamówienia sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        salesOrderId: { type: 'number', description: 'ID zamówienia' },
        item: { type: 'object', description: 'Dane pozycji' },
      },
      required: ['salesOrderId', 'item'],
    },
  },
  {
    name: 'raynet_remove_sales_order_item',
    description: 'Usuwa pozycję z zamówienia sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        salesOrderId: { type: 'number', description: 'ID zamówienia' },
        itemId: { type: 'number', description: 'ID pozycji do usunięcia' },
      },
      required: ['salesOrderId', 'itemId'],
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

function formatStatus(status: string): string {
  switch (status) {
    case 'B_ACTIVE': return 'Aktywne';
    case 'E_WIN': return 'Zrealizowane';
    case 'F_LOST': return 'Anulowane';
    case 'G_STORNO': return 'Storno';
    default: return status;
  }
}

function formatSalesOrderItem(item: RaynetSalesOrderItem): string {
  const lines = [];
  lines.push(`  - ${item.name}${item.code ? ` (${item.code})` : ''} (ID: ${item.id})`);
  lines.push(`    Ilość: ${item.quantity} ${item.unit ?? 'szt.'} × ${item.price?.toFixed(2) ?? '0.00'} = ${item.totalPrice?.toFixed(2) ?? '0.00'} zł`);
  if (item.discount && item.discount > 0) {
    lines.push(`    Rabat: ${item.discount}%`);
  }
  return lines.join('\n');
}

function formatSalesOrder(order: RaynetSalesOrder): string {
  const lines = [
    `**${order.name}** (ID: ${order.id})`,
    `- Status: ${formatStatus(order.status)}`,
    `- Firma: ${order.company?.name ?? 'N/A'}`,
  ];

  if (order.offer?.name) {
    lines.push(`- Z oferty: ${order.offer.name}`);
  }

  if (order.totalAmount !== undefined) {
    const currency = order.currency?.value ?? 'PLN';
    lines.push(`- Wartość: ${order.totalAmount.toFixed(2)} ${currency}`);
  }

  if (order.orderDate) {
    lines.push(`- Data zamówienia: ${order.orderDate}`);
  }
  if (order.deliveryDate) {
    lines.push(`- Data dostawy: ${order.deliveryDate}`);
  }

  if (order.owner?.fullName) {
    lines.push(`- Właściciel: ${order.owner.fullName}`);
  }

  if (order.items && order.items.length > 0) {
    lines.push(`\nPozycje (${order.items.length}):`);
    for (const item of order.items) {
      lines.push(formatSalesOrderItem(item));
    }
  }

  if (order.tags && order.tags.length > 0) {
    lines.push(`\n- Tagi: ${order.tags.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

export async function handleListSalesOrders(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = ListSalesOrdersSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getSalesOrdersService();
    const result = await service.list(input);

    if (result.salesOrders.length === 0) {
      return { content: [{ type: 'text', text: 'Nie znaleziono żadnych zamówień sprzedaży.' }] };
    }

    const ordersList = result.salesOrders.map(formatSalesOrder).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} zamówień (wyświetlono ${result.salesOrders.length})`;

    return { content: [{ type: 'text', text: `${summary}\n\n${ordersList}` }] };
  } catch (error) {
    logger.error('Error in handleListSalesOrders', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleSearchSalesOrders(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchSalesOrdersSchema.parse(args);
    const service = getSalesOrdersService();
    const result = await service.search(input);

    if (result.salesOrders.length === 0) {
      return { content: [{ type: 'text', text: `Nie znaleziono zamówień pasujących do: "${input.query}"` }] };
    }

    const ordersList = result.salesOrders.map(formatSalesOrder).join('\n\n---\n\n');
    return { content: [{ type: 'text', text: `Wyniki dla "${input.query}":\n\n${ordersList}` }] };
  } catch (error) {
    logger.error('Error in handleSearchSalesOrders', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleGetSalesOrder(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetSalesOrderSchema.parse(args);
    const service = getSalesOrdersService();
    const result = await service.get(input);
    return { content: [{ type: 'text', text: formatSalesOrder(result.salesOrder) }] };
  } catch (error) {
    logger.error('Error in handleGetSalesOrder', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleCreateSalesOrder(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateSalesOrderSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getSalesOrdersService();
    const result = await service.create(input);
    return { content: [{ type: 'text', text: `✅ Zamówienie utworzone!\n\n${formatSalesOrder(result.salesOrder)}` }] };
  } catch (error) {
    logger.error('Error in handleCreateSalesOrder', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleCreateSalesOrderWithItems(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateSalesOrderWithItemsSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getSalesOrdersService();
    const result = await service.createWithItems(input);
    return { content: [{ type: 'text', text: `✅ Zamówienie z pozycjami utworzone!\n\n${formatSalesOrder(result.salesOrder)}` }] };
  } catch (error) {
    logger.error('Error in handleCreateSalesOrderWithItems', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleCreateSalesOrderFromOffer(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CreateSalesOrderFromOfferSchema.parse(args);
    const service = getSalesOrdersService();
    const result = await service.createFromOffer(input);
    return { content: [{ type: 'text', text: `✅ Zamówienie utworzone z oferty!\n\n${formatSalesOrder(result.salesOrder)}` }] };
  } catch (error) {
    logger.error('Error in handleCreateSalesOrderFromOffer', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleUpdateSalesOrder(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateSalesOrderSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getSalesOrdersService();
    const result = await service.update(input);
    return { content: [{ type: 'text', text: `✅ Zamówienie zaktualizowane!\n\n${formatSalesOrder(result.salesOrder)}` }] };
  } catch (error) {
    logger.error('Error in handleUpdateSalesOrder', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleDeleteSalesOrder(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteSalesOrderSchema.parse(args);
    const service = getSalesOrdersService();
    await service.delete(input.salesOrderId);
    return { content: [{ type: 'text', text: `✅ Zamówienie o ID ${input.salesOrderId} zostało usunięte.` }] };
  } catch (error) {
    logger.error('Error in handleDeleteSalesOrder', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleAddSalesOrderItem(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = AddSalesOrderItemSchema.parse(args);
    const service = getSalesOrdersService();
    const result = await service.addItem(input);
    return { content: [{ type: 'text', text: `✅ Pozycja dodana!\n\n${formatSalesOrderItem(result.item)}` }] };
  } catch (error) {
    logger.error('Error in handleAddSalesOrderItem', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleRemoveSalesOrderItem(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = RemoveSalesOrderItemSchema.parse(args);
    const service = getSalesOrdersService();
    await service.removeItem(input);
    return { content: [{ type: 'text', text: `✅ Pozycja o ID ${input.itemId} została usunięta.` }] };
  } catch (error) {
    logger.error('Error in handleRemoveSalesOrderItem', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

// ============================================================================
// Tool Router
// ============================================================================

export async function handleSalesOrderTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_sales_orders': return handleListSalesOrders(args);
    case 'raynet_search_sales_orders': return handleSearchSalesOrders(args);
    case 'raynet_get_sales_order': return handleGetSalesOrder(args);
    case 'raynet_create_sales_order': return handleCreateSalesOrder(args);
    case 'raynet_create_sales_order_with_items': return handleCreateSalesOrderWithItems(args);
    case 'raynet_create_sales_order_from_offer': return handleCreateSalesOrderFromOffer(args);
    case 'raynet_update_sales_order': return handleUpdateSalesOrder(args);
    case 'raynet_delete_sales_order': return handleDeleteSalesOrder(args);
    case 'raynet_add_sales_order_item': return handleAddSalesOrderItem(args);
    case 'raynet_remove_sales_order_item': return handleRemoveSalesOrderItem(args);
    default:
      return { content: [{ type: 'text', text: `Nieznane narzędzie: ${toolName}` }] };
  }
}
