/**
 * MCP Tools for Enums (Słowniki)
 *
 * Tools for retrieving Raynet CRM categories, phases, and other lookup values
 */

import { z } from 'zod';
import { getEnumsService } from '../api/enums';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { EnumItem, CurrencyItem } from '../api/enums';

// ============================================================================
// Zod Schemas
// ============================================================================

export const GetEnumsSchema = z.object({});

// ============================================================================
// Tool Definitions
// ============================================================================

export const enumToolDefinitions = [
  {
    name: 'raynet_get_company_categories',
    description:
      'Pobiera listę kategorii firm (np. KAM, AM, zwykły). Użyj tego, gdy potrzebujesz ID kategorii do tworzenia lub filtrowania firm.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_company_turnovers',
    description:
      'Pobiera listę przedziałów obrotów firm. Użyj tego, gdy potrzebujesz ID przedziału obrotu.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_deal_categories',
    description:
      'Pobiera listę kategorii szans sprzedaży (oznaczone kolorami). Użyj tego, gdy potrzebujesz ID kategorii szansy.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_deal_phases',
    description:
      'Pobiera listę faz szans sprzedaży (Zaczynamy, Spotkanie, Oferta, itd.). Użyj tego, gdy potrzebujesz ID fazy do aktualizacji szansy.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_lead_phases',
    description:
      'Pobiera listę faz leadów (New, In Progress, Converted, Canceled). Użyj tego, gdy potrzebujesz ID fazy leada.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_contact_sources',
    description:
      'Pobiera listę źródeł kontaktu (np. web form, referral). Użyj tego, gdy potrzebujesz ID źródła dla leada.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_currencies',
    description:
      'Pobiera listę dostępnych walut (PLN, EUR, itd.). Użyj tego, gdy potrzebujesz ID waluty.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'raynet_get_all_enums',
    description:
      'Pobiera wszystkie słowniki jednocześnie: kategorie firm, obroty, kategorie i fazy szans, fazy leadów, źródła kontaktu i waluty. Użyj tego na początku, aby poznać dostępne wartości.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

function formatEnumItem(item: EnumItem): string {
  let line = `- **ID ${item.id}**: ${item.code}`;
  if (item.color) {
    line += ` (kolor: #${item.color})`;
  }
  if (item.sequenceNumber !== undefined) {
    line += ` [kolejność: ${item.sequenceNumber}]`;
  }
  return line;
}

function formatCurrencyItem(item: CurrencyItem): string {
  return `- **ID ${item.id}**: ${item.code} (${item.symbol})`;
}

function formatEnumList(title: string, items: EnumItem[]): string {
  if (items.length === 0) {
    return `**${title}**: Brak zdefiniowanych wartości`;
  }
  return `**${title}** (${items.length}):\n${items.map(formatEnumItem).join('\n')}`;
}

function formatCurrencyList(items: CurrencyItem[]): string {
  if (items.length === 0) {
    return '**Waluty**: Brak zdefiniowanych wartości';
  }
  return `**Waluty** (${items.length}):\n${items.map(formatCurrencyItem).join('\n')}`;
}

// ============================================================================
// Tool Handlers
// ============================================================================

export async function handleGetCompanyCategories(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getCompanyCategories();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Kategorie firm', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetCompanyCategories', { error });
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

export async function handleGetCompanyTurnovers(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getCompanyTurnovers();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Przedziały obrotów', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetCompanyTurnovers', { error });
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

export async function handleGetDealCategories(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getDealCategories();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Kategorie szans sprzedaży', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetDealCategories', { error });
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

export async function handleGetDealPhases(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getDealPhases();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Fazy szans sprzedaży', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetDealPhases', { error });
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

export async function handleGetLeadPhases(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getLeadPhases();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Fazy leadów', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetLeadPhases', { error });
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

export async function handleGetContactSources(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getContactSources();

    return {
      content: [
        {
          type: 'text',
          text: formatEnumList('Źródła kontaktu', result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetContactSources', { error });
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

export async function handleGetCurrencies(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const result = await service.getCurrencies();

    return {
      content: [
        {
          type: 'text',
          text: formatCurrencyList(result.items),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetCurrencies', { error });
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

export async function handleGetAllEnums(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getEnumsService();
    const enums = await service.getAllEnums();

    const sections = [
      '📚 **Wszystkie słowniki Raynet CRM**\n',
      formatEnumList('Kategorie firm', enums.companyCategories),
      '',
      formatEnumList('Przedziały obrotów', enums.companyTurnovers),
      '',
      formatEnumList('Kategorie szans sprzedaży', enums.dealCategories),
      '',
      formatEnumList('Fazy szans sprzedaży', enums.dealPhases),
      '',
      formatEnumList('Fazy leadów', enums.leadPhases),
      '',
      formatEnumList('Źródła kontaktu', enums.contactSources),
      '',
      formatCurrencyList(enums.currencies),
    ];

    return {
      content: [
        {
          type: 'text',
          text: sections.join('\n'),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetAllEnums', { error });
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

export async function handleEnumTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_get_company_categories':
      return handleGetCompanyCategories(args);
    case 'raynet_get_company_turnovers':
      return handleGetCompanyTurnovers(args);
    case 'raynet_get_deal_categories':
      return handleGetDealCategories(args);
    case 'raynet_get_deal_phases':
      return handleGetDealPhases(args);
    case 'raynet_get_lead_phases':
      return handleGetLeadPhases(args);
    case 'raynet_get_contact_sources':
      return handleGetContactSources(args);
    case 'raynet_get_currencies':
      return handleGetCurrencies(args);
    case 'raynet_get_all_enums':
      return handleGetAllEnums(args);
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
