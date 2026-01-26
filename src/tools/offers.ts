/**
 * MCP Tools for Offers (Nabídky)
 *
 * Tools for managing Raynet CRM offers via MCP protocol
 */

import { z } from 'zod';
import { getOffersService } from '../api/offers';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetOffer, RaynetOfferItem } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Remove undefined values from an object (for exactOptionalPropertyTypes compatibility)
 */
function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

export const ListOffersSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO']).optional(),
  companyId: z.number().int().positive().optional(),
  dealId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const SearchOffersSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetOfferSchema = z.object({
  offerId: z.number().int().positive('ID oferty musi być liczbą dodatnią'),
});

const OfferItemSchema = z.object({
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

export const CreateOfferSchema = z.object({
  name: z.string().min(1, 'Nazwa oferty jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  dealId: z.number().int().positive().optional(),
  contactId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validTill: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const CreateOfferWithItemsSchema = z.object({
  name: z.string().min(1, 'Nazwa oferty jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  dealId: z.number().int().positive().optional(),
  contactId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validTill: z.string().optional(),
  description: z.string().optional(),
  items: z.array(OfferItemSchema).min(1, 'Przynajmniej jedna pozycja jest wymagana'),
  tags: z.array(z.string()).optional(),
});

export const UpdateOfferSchema = z.object({
  offerId: z.number().int().positive('ID oferty musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  status: z.enum(['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO']).optional(),
  validFrom: z.string().optional(),
  validTill: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteOfferSchema = z.object({
  offerId: z.number().int().positive('ID oferty musi być liczbą dodatnią'),
});

export const AddOfferItemSchema = z.object({
  offerId: z.number().int().positive('ID oferty musi być liczbą dodatnią'),
  item: OfferItemSchema,
});

export const RemoveOfferItemSchema = z.object({
  offerId: z.number().int().positive('ID oferty musi być liczbą dodatnią'),
  itemId: z.number().int().positive('ID pozycji musi być liczbą dodatnią'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const offerToolDefinitions = [
  {
    name: 'raynet_list_offers',
    description:
      'Pobiera listę ofert z Raynet CRM. Można filtrować po statusie, firmie, szansie sprzedaży i właścicielu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników (1-100, domyślnie 20)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Pomiń pierwsze N wyników (do paginacji)',
          default: 0,
        },
        status: {
          type: 'string',
          description: 'Filtruj po statusie: B_ACTIVE, E_WIN, F_LOST, G_STORNO',
          enum: ['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO'],
        },
        companyId: {
          type: 'number',
          description: 'Filtruj po ID firmy',
        },
        dealId: {
          type: 'number',
          description: 'Filtruj po ID szansy sprzedaży',
        },
        ownerId: {
          type: 'number',
          description: 'Filtruj po ID właściciela',
        },
      },
    },
  },
  {
    name: 'raynet_search_offers',
    description:
      'Wyszukuje oferty po nazwie w Raynet CRM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w nazwie oferty',
        },
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników (1-100, domyślnie 20)',
          default: 20,
        },
        offset: {
          type: 'number',
          description: 'Pomiń pierwsze N wyników',
          default: 0,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'raynet_get_offer',
    description:
      'Pobiera szczegółowe informacje o ofercie na podstawie jej ID, włącznie z pozycjami.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: {
          type: 'number',
          description: 'ID oferty w Raynet CRM',
        },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'raynet_create_offer',
    description:
      'Tworzy nową ofertę w Raynet CRM. Wymagane są nazwa i ID firmy.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Nazwa oferty (wymagana)',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy (wymagane)',
        },
        dealId: {
          type: 'number',
          description: 'ID powiązanej szansy sprzedaży',
        },
        contactId: {
          type: 'number',
          description: 'ID kontaktu',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela oferty',
        },
        validFrom: {
          type: 'string',
          description: 'Data ważności od (format: YYYY-MM-DD)',
        },
        validTill: {
          type: 'string',
          description: 'Data ważności do (format: YYYY-MM-DD)',
        },
        description: {
          type: 'string',
          description: 'Opis oferty',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tagi oferty',
        },
      },
      required: ['name', 'companyId'],
    },
  },
  {
    name: 'raynet_create_offer_with_items',
    description:
      'Tworzy nową ofertę z pozycjami (produktami) w Raynet CRM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Nazwa oferty (wymagana)',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy (wymagane)',
        },
        dealId: {
          type: 'number',
          description: 'ID powiązanej szansy sprzedaży',
        },
        contactId: {
          type: 'number',
          description: 'ID kontaktu',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela oferty',
        },
        validFrom: {
          type: 'string',
          description: 'Data ważności od',
        },
        validTill: {
          type: 'string',
          description: 'Data ważności do',
        },
        description: {
          type: 'string',
          description: 'Opis oferty',
        },
        items: {
          type: 'array',
          description: 'Pozycje oferty',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'number', description: 'ID produktu (opcjonalne)' },
              name: { type: 'string', description: 'Nazwa pozycji' },
              code: { type: 'string', description: 'Kod pozycji' },
              description: { type: 'string', description: 'Opis pozycji' },
              unit: { type: 'string', description: 'Jednostka miary' },
              quantity: { type: 'number', description: 'Ilość' },
              price: { type: 'number', description: 'Cena jednostkowa' },
              taxRate: { type: 'number', description: 'Stawka VAT (%)' },
              discount: { type: 'number', description: 'Rabat (%)' },
            },
            required: ['name', 'quantity', 'price'],
          },
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tagi oferty',
        },
      },
      required: ['name', 'companyId', 'items'],
    },
  },
  {
    name: 'raynet_update_offer',
    description:
      'Aktualizuje dane istniejącej oferty w Raynet CRM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: {
          type: 'number',
          description: 'ID oferty do aktualizacji (wymagane)',
        },
        name: {
          type: 'string',
          description: 'Nowa nazwa oferty',
        },
        status: {
          type: 'string',
          description: 'Nowy status: B_ACTIVE, E_WIN, F_LOST, G_STORNO',
          enum: ['B_ACTIVE', 'E_WIN', 'F_LOST', 'G_STORNO'],
        },
        validFrom: {
          type: 'string',
          description: 'Nowa data ważności od',
        },
        validTill: {
          type: 'string',
          description: 'Nowa data ważności do',
        },
        description: {
          type: 'string',
          description: 'Nowy opis',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nowe tagi',
        },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'raynet_delete_offer',
    description:
      'Usuwa ofertę z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: {
          type: 'number',
          description: 'ID oferty do usunięcia',
        },
      },
      required: ['offerId'],
    },
  },
  {
    name: 'raynet_add_offer_item',
    description:
      'Dodaje pozycję (produkt) do istniejącej oferty.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: {
          type: 'number',
          description: 'ID oferty',
        },
        item: {
          type: 'object',
          description: 'Dane pozycji',
          properties: {
            productId: { type: 'number', description: 'ID produktu (opcjonalne)' },
            name: { type: 'string', description: 'Nazwa pozycji (wymagana)' },
            code: { type: 'string', description: 'Kod pozycji' },
            description: { type: 'string', description: 'Opis pozycji' },
            unit: { type: 'string', description: 'Jednostka miary' },
            quantity: { type: 'number', description: 'Ilość (wymagana)' },
            price: { type: 'number', description: 'Cena jednostkowa (wymagana)' },
            taxRate: { type: 'number', description: 'Stawka VAT (%)' },
            discount: { type: 'number', description: 'Rabat (%)' },
          },
          required: ['name', 'quantity', 'price'],
        },
      },
      required: ['offerId', 'item'],
    },
  },
  {
    name: 'raynet_remove_offer_item',
    description:
      'Usuwa pozycję z oferty.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        offerId: {
          type: 'number',
          description: 'ID oferty',
        },
        itemId: {
          type: 'number',
          description: 'ID pozycji do usunięcia',
        },
      },
      required: ['offerId', 'itemId'],
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  switch (status) {
    case 'B_ACTIVE': return 'Aktywna';
    case 'E_WIN': return 'Wygrana';
    case 'F_LOST': return 'Przegrana';
    case 'G_STORNO': return 'Anulowana';
    default: return status;
  }
}

/**
 * Format offer item for output
 */
function formatOfferItem(item: RaynetOfferItem): string {
  const lines = [];

  lines.push(`  - ${item.name}${item.code ? ` (${item.code})` : ''} (ID: ${item.id})`);
  lines.push(`    Ilość: ${item.quantity} ${item.unit ?? 'szt.'} × ${item.price?.toFixed(2) ?? '0.00'} = ${item.totalPrice?.toFixed(2) ?? '0.00'} zł`);

  if (item.discount && item.discount > 0) {
    lines.push(`    Rabat: ${item.discount}%`);
  }

  return lines.join('\n');
}

/**
 * Format offer for output
 */
function formatOffer(offer: RaynetOffer): string {
  const lines = [
    `**${offer.name}** (ID: ${offer.id})`,
    `- Status: ${formatStatus(offer.status)}`,
    `- Firma: ${offer.company?.name ?? 'N/A'}`,
  ];

  if (offer.businessCase?.name) {
    lines.push(`- Szansa: ${offer.businessCase.name}`);
  }

  if (offer.totalAmount !== undefined) {
    const currency = offer.currency?.value ?? 'PLN';
    lines.push(`- Wartość: ${offer.totalAmount.toFixed(2)} ${currency}`);
    if (offer.totalAmountWithTax !== undefined) {
      lines.push(`- Wartość brutto: ${offer.totalAmountWithTax.toFixed(2)} ${currency}`);
    }
  }

  if (offer.validFrom || offer.validTill) {
    const from = offer.validFrom ?? '?';
    const till = offer.validTill ?? '?';
    lines.push(`- Ważność: ${from} - ${till}`);
  }

  if (offer.owner?.fullName) {
    lines.push(`- Właściciel: ${offer.owner.fullName}`);
  }

  if (offer.items && offer.items.length > 0) {
    lines.push(`\nPozycje (${offer.items.length}):`);
    for (const item of offer.items) {
      lines.push(formatOfferItem(item));
    }
  }

  if (offer.tags && offer.tags.length > 0) {
    lines.push(`\n- Tagi: ${offer.tags.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handle list offers tool
 */
export async function handleListOffers(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = ListOffersSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getOffersService();
    const result = await service.list(input);

    if (result.offers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych ofert spełniających podane kryteria.',
          },
        ],
      };
    }

    const offersList = result.offers.map(formatOffer).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} ofert (wyświetlono ${result.offers.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${offersList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListOffers', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle search offers tool
 */
export async function handleSearchOffers(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchOffersSchema.parse(args);
    const service = getOffersService();
    const result = await service.search(input);

    if (result.offers.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono ofert pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const offersList = result.offers.map(formatOffer).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} ofert (wyświetlono ${result.offers.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${offersList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchOffers', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle get offer tool
 */
export async function handleGetOffer(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetOfferSchema.parse(args);
    const service = getOffersService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatOffer(result.offer),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetOffer', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle create offer tool
 */
export async function handleCreateOffer(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateOfferSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getOffersService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Oferta została utworzona pomyślnie!\n\n${formatOffer(result.offer)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateOffer', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle create offer with items tool
 */
export async function handleCreateOfferWithItems(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateOfferWithItemsSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getOffersService();
    const result = await service.createWithItems(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Oferta z pozycjami została utworzona pomyślnie!\n\n${formatOffer(result.offer)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateOfferWithItems', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle update offer tool
 */
export async function handleUpdateOffer(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateOfferSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getOffersService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Oferta została zaktualizowana pomyślnie!\n\n${formatOffer(result.offer)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateOffer', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle delete offer tool
 */
export async function handleDeleteOffer(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteOfferSchema.parse(args);
    const service = getOffersService();
    await service.delete(input.offerId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Oferta o ID ${input.offerId} została usunięta.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteOffer', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle add offer item tool
 */
export async function handleAddOfferItem(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = AddOfferItemSchema.parse(args);
    const service = getOffersService();
    const result = await service.addItem(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Pozycja została dodana do oferty!\n\n${formatOfferItem(result.item)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleAddOfferItem', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

/**
 * Handle remove offer item tool
 */
export async function handleRemoveOfferItem(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = RemoveOfferItemSchema.parse(args);
    const service = getOffersService();
    await service.removeItem(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Pozycja o ID ${input.itemId} została usunięta z oferty.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleRemoveOfferItem', { error });
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${getPolishErrorMessage(error)}`,
        },
      ],
    };
  }
}

// ============================================================================
// Tool Router
// ============================================================================

export async function handleOfferTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_offers':
      return handleListOffers(args);
    case 'raynet_search_offers':
      return handleSearchOffers(args);
    case 'raynet_get_offer':
      return handleGetOffer(args);
    case 'raynet_create_offer':
      return handleCreateOffer(args);
    case 'raynet_create_offer_with_items':
      return handleCreateOfferWithItems(args);
    case 'raynet_update_offer':
      return handleUpdateOffer(args);
    case 'raynet_delete_offer':
      return handleDeleteOffer(args);
    case 'raynet_add_offer_item':
      return handleAddOfferItem(args);
    case 'raynet_remove_offer_item':
      return handleRemoveOfferItem(args);
    default:
      return {
        content: [
          {
            type: 'text',
            text: `Nieznane narzędzie: ${toolName}`,
          },
        ],
      };
  }
}
