/**
 * MCP Tools for Products (Produkty)
 *
 * Tools for managing Raynet CRM products via MCP protocol
 */

import { z } from 'zod';
import { getProductsService } from '../api/products';
import { getEnumsService } from '../api/enums';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetProduct } from '../types';

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

export const ListProductsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  categoryId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export const SearchProductsSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetProductSchema = z.object({
  productId: z.number().int().positive('ID produktu musi być liczbą dodatnią'),
});

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Nazwa produktu jest wymagana'),
  code: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currencyId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const UpdateProductSchema = z.object({
  productId: z.number().int().positive('ID produktu musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  description: z.string().optional(),
  unit: z.string().optional(),
  price: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  currencyId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  active: z.boolean().optional(),
});

export const DeleteProductSchema = z.object({
  productId: z.number().int().positive('ID produktu musi być liczbą dodatnią'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const productToolDefinitions = [
  {
    name: 'raynet_list_products',
    description:
      'Pobiera listę produktów z Raynet CRM. Można filtrować po kategorii i statusie aktywności. Zwraca produkty z paginacją.',
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
        categoryId: {
          type: 'number',
          description: 'Filtruj po ID kategorii produktu',
        },
        active: {
          type: 'boolean',
          description: 'Filtruj po statusie aktywności (true = aktywne, false = nieaktywne)',
        },
      },
    },
  },
  {
    name: 'raynet_search_products',
    description:
      'Wyszukuje produkty po nazwie lub kodzie w Raynet CRM. Użyj tego narzędzia, gdy użytkownik szuka produktu po nazwie lub fragmencie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w nazwie lub kodzie produktu',
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
    name: 'raynet_get_product',
    description:
      'Pobiera szczegółowe informacje o produkcie na podstawie jego ID. Zwraca pełne dane produktu włącznie z ceną, jednostką i kategorią.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'number',
          description: 'ID produktu w Raynet CRM',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'raynet_create_product',
    description:
      'Tworzy nowy produkt w Raynet CRM. Wymagana jest nazwa produktu, pozostałe pola są opcjonalne.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Nazwa produktu (wymagana)',
        },
        code: {
          type: 'string',
          description: 'Kod produktu (SKU)',
        },
        description: {
          type: 'string',
          description: 'Opis produktu',
        },
        unit: {
          type: 'string',
          description: 'Jednostka miary (np. szt., kg, godz.)',
        },
        price: {
          type: 'number',
          description: 'Cena jednostkowa',
        },
        taxRate: {
          type: 'number',
          description: 'Stawka VAT w procentach (np. 23)',
        },
        currencyId: {
          type: 'number',
          description: 'ID waluty',
        },
        categoryId: {
          type: 'number',
          description: 'ID kategorii produktu',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela produktu',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'raynet_update_product',
    description:
      'Aktualizuje dane istniejącego produktu w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'number',
          description: 'ID produktu do aktualizacji (wymagane)',
        },
        name: {
          type: 'string',
          description: 'Nowa nazwa produktu',
        },
        code: {
          type: 'string',
          description: 'Nowy kod produktu',
        },
        description: {
          type: 'string',
          description: 'Nowy opis produktu',
        },
        unit: {
          type: 'string',
          description: 'Nowa jednostka miary',
        },
        price: {
          type: 'number',
          description: 'Nowa cena jednostkowa',
        },
        taxRate: {
          type: 'number',
          description: 'Nowa stawka VAT',
        },
        currencyId: {
          type: 'number',
          description: 'ID nowej waluty',
        },
        categoryId: {
          type: 'number',
          description: 'ID nowej kategorii',
        },
        active: {
          type: 'boolean',
          description: 'Status aktywności (true = aktywny)',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'raynet_delete_product',
    description:
      'Usuwa produkt z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'number',
          description: 'ID produktu do usunięcia',
        },
      },
      required: ['productId'],
    },
  },
  {
    name: 'raynet_get_product_categories',
    description:
      'Pobiera listę dostępnych kategorii produktów w Raynet CRM. Użyj do uzyskania ID kategorii przy tworzeniu/aktualizacji produktów.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Format product for output
 */
function formatProduct(product: RaynetProduct): string {
  const lines = [
    `**${product.name}** (ID: ${product.id})`,
  ];

  if (product.code) {
    lines.push(`- Kod: ${product.code}`);
  }

  const priceInfo = [];
  if (product.price !== undefined && product.price !== null) {
    const currency = product.currency?.value ?? 'zł';
    priceInfo.push(`Cena: ${product.price.toFixed(2)} ${currency}`);
  }
  if (product.taxRate !== undefined && product.taxRate !== null) {
    priceInfo.push(`VAT: ${product.taxRate}%`);
  }
  if (priceInfo.length > 0) {
    lines.push(`- ${priceInfo.join(' | ')}`);
  }

  if (product.unit) {
    lines.push(`- Jednostka: ${product.unit}`);
  }

  if (product.category?.name) {
    lines.push(`- Kategoria: ${product.category.name}`);
  }

  if (product.description) {
    const desc = product.description.length > 100
      ? product.description.substring(0, 100) + '...'
      : product.description;
    lines.push(`- Opis: ${desc}`);
  }

  lines.push(`- Status: ${product.active ? 'Aktywny' : 'Nieaktywny'}`);

  if (product.owner?.fullName) {
    lines.push(`- Właściciel: ${product.owner.fullName}`);
  }

  return lines.join('\n');
}

/**
 * Handle list products tool
 */
export async function handleListProducts(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = ListProductsSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProductsService();
    const result = await service.list(input);

    if (result.products.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych produktów spełniających podane kryteria.',
          },
        ],
      };
    }

    const productsList = result.products.map(formatProduct).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} produktów (wyświetlono ${result.products.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${productsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListProducts', { error });
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
 * Handle search products tool
 */
export async function handleSearchProducts(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchProductsSchema.parse(args);
    const service = getProductsService();
    const result = await service.search(input);

    if (result.products.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono produktów pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const productsList = result.products.map(formatProduct).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} produktów (wyświetlono ${result.products.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${productsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchProducts', { error });
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
 * Handle get product tool
 */
export async function handleGetProduct(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetProductSchema.parse(args);
    const service = getProductsService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatProduct(result.product),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetProduct', { error });
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
 * Handle create product tool
 */
export async function handleCreateProduct(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateProductSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProductsService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `Produkt został utworzony pomyślnie!\n\n${formatProduct(result.product)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateProduct', { error });
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
 * Handle update product tool
 */
export async function handleUpdateProduct(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateProductSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProductsService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `Produkt został zaktualizowany pomyślnie!\n\n${formatProduct(result.product)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateProduct', { error });
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
 * Handle delete product tool
 */
export async function handleDeleteProduct(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteProductSchema.parse(args);
    const service = getProductsService();
    await service.delete(input.productId);

    return {
      content: [
        {
          type: 'text',
          text: `Produkt o ID ${input.productId} został usunięty.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteProduct', { error });
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
 * Handle get product categories tool
 */
export async function handleGetProductCategories(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getProductCategories();

    if (result.items.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych kategorii produktów.',
          },
        ],
      };
    }

    const categoriesList = result.items
      .map((item) => `- **${item.code}** (ID: ${item.id})`)
      .join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `Kategorie produktów (${result.items.length}):\n\n${categoriesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetProductCategories', { error });
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

export async function handleProductTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_products':
      return handleListProducts(args);
    case 'raynet_search_products':
      return handleSearchProducts(args);
    case 'raynet_get_product':
      return handleGetProduct(args);
    case 'raynet_create_product':
      return handleCreateProduct(args);
    case 'raynet_update_product':
      return handleUpdateProduct(args);
    case 'raynet_delete_product':
      return handleDeleteProduct(args);
    case 'raynet_get_product_categories':
      return handleGetProductCategories(args);
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
