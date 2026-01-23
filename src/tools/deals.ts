/**
 * MCP Tools for Deals (Szanse sprzedaży)
 *
 * Tools for managing Raynet CRM deals/business cases via MCP protocol
 */

import { z } from 'zod';
import { getDealsService } from '../api/deals';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetBusinessCase } from '../types';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

const DealStatusSchema = z.enum(['A_DRAFT', 'B_ACTIVE', 'C_WON', 'D_LOST', 'E_CANCELLED']);

export const ListDealsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: DealStatusSchema.optional(),
  companyId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  phaseId: z.number().int().positive().optional(),
});

export const SearchDealsSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetDealSchema = z.object({
  dealId: z.number().int().positive('ID szansy musi być liczbą dodatnią'),
});

export const CreateDealSchema = z.object({
  name: z.string().min(1, 'Nazwa szansy jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  contactId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  totalAmount: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  phaseId: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  scheduledEnd: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateDealSchema = z.object({
  dealId: z.number().int().positive('ID szansy musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  totalAmount: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  phaseId: z.number().int().positive().optional(),
  status: DealStatusSchema.optional(),
  scheduledEnd: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateDealPhaseSchema = z.object({
  dealId: z.number().int().positive('ID szansy musi być liczbą dodatnią'),
  phaseId: z.number().int().positive('ID fazy musi być liczbą dodatnią'),
});

export const DeleteDealSchema = z.object({
  dealId: z.number().int().positive('ID szansy musi być liczbą dodatnią'),
});

export const GetPipelineValueSchema = z.object({});

// ============================================================================
// Tool Definitions
// ============================================================================

export const dealToolDefinitions = [
  {
    name: 'raynet_list_deals',
    description:
      'Pobiera listę szans sprzedaży z Raynet CRM. Można filtrować po statusie, firmie, właścicielu i fazie. Zwraca szanse z paginacją.',
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
          enum: ['A_DRAFT', 'B_ACTIVE', 'C_WON', 'D_LOST', 'E_CANCELLED'],
          description:
            'Filtruj po statusie: A_DRAFT (szkic), B_ACTIVE (aktywna), C_WON (wygrana), D_LOST (przegrana), E_CANCELLED (anulowana)',
        },
        companyId: {
          type: 'number',
          description: 'Filtruj po ID firmy',
        },
        ownerId: {
          type: 'number',
          description: 'Filtruj po ID właściciela',
        },
        phaseId: {
          type: 'number',
          description: 'Filtruj po ID fazy',
        },
      },
    },
  },
  {
    name: 'raynet_search_deals',
    description:
      'Wyszukuje szanse sprzedaży po nazwie w Raynet CRM. Użyj tego narzędzia, gdy użytkownik szuka szansy po nazwie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w nazwie szansy',
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
    name: 'raynet_get_deal',
    description:
      'Pobiera szczegółowe informacje o szansie sprzedaży na podstawie jej ID. Zwraca pełne dane włącznie z wartością, fazą i powiązaniami.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dealId: {
          type: 'number',
          description: 'ID szansy sprzedaży w Raynet CRM',
        },
      },
      required: ['dealId'],
    },
  },
  {
    name: 'raynet_create_deal',
    description:
      'Tworzy nową szansę sprzedaży w Raynet CRM. Wymagane są nazwa i ID firmy, pozostałe pola są opcjonalne.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Nazwa szansy sprzedaży (wymagana)',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy, której dotyczy szansa (wymagane)',
        },
        contactId: {
          type: 'number',
          description: 'ID osoby kontaktowej',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela szansy',
        },
        totalAmount: {
          type: 'number',
          description: 'Wartość szansy (w PLN)',
        },
        probability: {
          type: 'number',
          description: 'Prawdopodobieństwo wygrania (0-100%)',
        },
        phaseId: {
          type: 'number',
          description: 'ID fazy sprzedaży',
        },
        validFrom: {
          type: 'string',
          description: 'Data rozpoczęcia (format YYYY-MM-DD)',
        },
        scheduledEnd: {
          type: 'string',
          description: 'Planowana data zakończenia (format YYYY-MM-DD)',
        },
        description: {
          type: 'string',
          description: 'Opis szansy',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista tagów',
        },
      },
      required: ['name', 'companyId'],
    },
  },
  {
    name: 'raynet_update_deal',
    description:
      'Aktualizuje dane istniejącej szansy sprzedaży w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dealId: {
          type: 'number',
          description: 'ID szansy do aktualizacji (wymagane)',
        },
        name: {
          type: 'string',
          description: 'Nowa nazwa szansy',
        },
        totalAmount: {
          type: 'number',
          description: 'Nowa wartość szansy',
        },
        probability: {
          type: 'number',
          description: 'Nowe prawdopodobieństwo (0-100%)',
        },
        phaseId: {
          type: 'number',
          description: 'ID nowej fazy',
        },
        status: {
          type: 'string',
          enum: ['A_DRAFT', 'B_ACTIVE', 'C_WON', 'D_LOST', 'E_CANCELLED'],
          description: 'Nowy status szansy',
        },
        scheduledEnd: {
          type: 'string',
          description: 'Nowa planowana data zakończenia',
        },
        description: {
          type: 'string',
          description: 'Nowy opis',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nowe tagi (zastąpią istniejące)',
        },
      },
      required: ['dealId'],
    },
  },
  {
    name: 'raynet_update_deal_phase',
    description:
      'Zmienia fazę szansy sprzedaży. Użyj tego narzędzia, gdy chcesz przesunąć szansę do następnej fazy procesu sprzedaży.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dealId: {
          type: 'number',
          description: 'ID szansy',
        },
        phaseId: {
          type: 'number',
          description: 'ID nowej fazy (1-7: Zaczynamy, Spotkanie, Oferta, Przed zamknięciem, Wygrana, Przegrana, Anulowane)',
        },
      },
      required: ['dealId', 'phaseId'],
    },
  },
  {
    name: 'raynet_delete_deal',
    description:
      'Usuwa szansę sprzedaży z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        dealId: {
          type: 'number',
          description: 'ID szansy do usunięcia',
        },
      },
      required: ['dealId'],
    },
  },
  {
    name: 'raynet_get_pipeline_value',
    description:
      'Pobiera wartość pipeline (łączną wartość wszystkich aktywnych szans sprzedaży). Przydatne do raportowania i prognozowania.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format deal for output
 */
function formatDeal(deal: RaynetBusinessCase): string {
  const lines = [
    `**${deal.name}** (${deal.code}, ID: ${deal.id})`,
    `- Status: ${formatStatus(deal.status)} | Faza: ${deal.businessCasePhase?.value ?? 'N/A'}`,
    `- Wartość: ${formatCurrency(deal.totalAmount)} | Prawdopodobieństwo: ${deal.probability}%`,
    `- Wartość ważona: ${formatCurrency(deal.estimatedValue)}`,
  ];

  // Company
  if (deal.company?.name) {
    lines.push(`- Firma: ${deal.company.name}`);
  }

  // Contact
  if (deal.person?.name) {
    lines.push(`- Kontakt: ${deal.person.name}`);
  }

  // Owner
  if (deal.owner?.fullName) {
    lines.push(`- Właściciel: ${deal.owner.fullName}`);
  }

  // Dates
  if (deal.validFrom) {
    lines.push(`- Od: ${deal.validFrom}`);
  }
  if (deal.scheduledEnd) {
    lines.push(`- Planowane zamknięcie: ${deal.scheduledEnd}`);
  }

  // Tags
  if (deal.tags && deal.tags.length > 0) {
    lines.push(`- Tagi: ${deal.tags.join(', ')}`);
  }

  return lines.join('\n');
}

function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    A_DRAFT: 'Szkic',
    B_ACTIVE: 'Aktywna',
    C_WON: '✅ Wygrana',
    D_LOST: '❌ Przegrana',
    E_CANCELLED: 'Anulowana',
  };
  return statuses[status] ?? status;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handle list deals tool
 */
export async function handleListDeals(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ListDealsSchema.parse(args);
    const service = getDealsService();
    const result = await service.list(input);

    if (result.deals.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych szans sprzedaży spełniających podane kryteria.',
          },
        ],
      };
    }

    const dealsList = result.deals.map(formatDeal).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} szans sprzedaży (wyświetlono ${result.deals.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${dealsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListDeals', { error });
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
 * Handle search deals tool
 */
export async function handleSearchDeals(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchDealsSchema.parse(args);
    const service = getDealsService();
    const result = await service.search(input);

    if (result.deals.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono szans sprzedaży pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const dealsList = result.deals.map(formatDeal).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} szans (wyświetlono ${result.deals.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${dealsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchDeals', { error });
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
 * Handle get deal tool
 */
export async function handleGetDeal(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetDealSchema.parse(args);
    const service = getDealsService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatDeal(result.deal),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetDeal', { error });
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
 * Handle create deal tool
 */
export async function handleCreateDeal(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CreateDealSchema.parse(args);
    const service = getDealsService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Szansa sprzedaży została utworzona pomyślnie!\n\n${formatDeal(result.deal)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateDeal', { error });
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
 * Handle update deal tool
 */
export async function handleUpdateDeal(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateDealSchema.parse(args);
    const service = getDealsService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Szansa sprzedaży została zaktualizowana pomyślnie!\n\n${formatDeal(result.deal)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateDeal', { error });
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
 * Handle update deal phase tool
 */
export async function handleUpdateDealPhase(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateDealPhaseSchema.parse(args);
    const service = getDealsService();
    const result = await service.updatePhase(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Faza szansy sprzedaży została zmieniona!\n\n${formatDeal(result.deal)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateDealPhase', { error });
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
 * Handle delete deal tool
 */
export async function handleDeleteDeal(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteDealSchema.parse(args);
    const service = getDealsService();
    await service.delete(input.dealId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Szansa sprzedaży o ID ${input.dealId} została usunięta.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteDeal', { error });
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
 * Handle get pipeline value tool
 */
export async function handleGetPipelineValue(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getDealsService();
    const result = await service.getPipelineValue();

    const text = [
      '📊 **Wartość Pipeline**',
      '',
      `- Liczba aktywnych szans: ${result.dealCount}`,
      `- Łączna wartość: ${formatCurrency(result.totalValue)}`,
      `- Wartość ważona: ${formatCurrency(result.estimatedValue)}`,
    ].join('\n');

    return {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetPipelineValue', { error });
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

export async function handleDealTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_deals':
      return handleListDeals(args);
    case 'raynet_search_deals':
      return handleSearchDeals(args);
    case 'raynet_get_deal':
      return handleGetDeal(args);
    case 'raynet_create_deal':
      return handleCreateDeal(args);
    case 'raynet_update_deal':
      return handleUpdateDeal(args);
    case 'raynet_update_deal_phase':
      return handleUpdateDealPhase(args);
    case 'raynet_delete_deal':
      return handleDeleteDeal(args);
    case 'raynet_get_pipeline_value':
      return handleGetPipelineValue(args);
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
