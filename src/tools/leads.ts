/**
 * MCP Tools for Leads (Leady)
 *
 * Tools for managing Raynet CRM leads via MCP protocol
 */

import { z } from 'zod';
import { getLeadsService } from '../api/leads';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetLead } from '../types';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

const LeadStatusSchema = z.enum(['A_DRAFT', 'B_ACTIVE', 'C_CONVERTED', 'D_CANCELLED']);
const LeadPrioritySchema = z.enum(['LOW', 'DEFAULT', 'HIGH']);

export const ListLeadsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: LeadStatusSchema.optional(),
  phaseId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const SearchLeadsSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetLeadSchema = z.object({
  leadId: z.number().int().positive('ID leada musi być liczbą dodatnią'),
});

export const CreateLeadSchema = z.object({
  topic: z.string().min(1, 'Temat leada jest wymagany'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  ownerId: z.number().int().positive().optional(),
  phaseId: z.number().int().positive().optional(),
  priority: LeadPrioritySchema.optional(),
  contactSourceId: z.number().int().positive().optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateLeadSchema = z.object({
  leadId: z.number().int().positive('ID leada musi być liczbą dodatnią'),
  topic: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  phaseId: z.number().int().positive().optional(),
  priority: LeadPrioritySchema.optional(),
  status: LeadStatusSchema.optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateLeadPhaseSchema = z.object({
  leadId: z.number().int().positive('ID leada musi być liczbą dodatnią'),
  phaseId: z.number().int().positive('ID fazy musi być liczbą dodatnią'),
});

export const DeleteLeadSchema = z.object({
  leadId: z.number().int().positive('ID leada musi być liczbą dodatnią'),
});

export const ConvertLeadSchema = z.object({
  leadId: z.number().int().positive('ID leada musi być liczbą dodatnią'),
  createCompany: z.boolean().optional().default(true),
  createContact: z.boolean().optional().default(true),
  createDeal: z.boolean().optional().default(false),
  dealName: z.string().optional(),
});

export const GetLeadStatsSchema = z.object({});

// ============================================================================
// Tool Definitions
// ============================================================================

export const leadToolDefinitions = [
  {
    name: 'raynet_list_leads',
    description:
      'Pobiera listę leadów z Raynet CRM. Można filtrować po statusie, fazie i właścicielu. Leady to potencjalni klienci przed konwersją.',
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
          enum: ['A_DRAFT', 'B_ACTIVE', 'C_CONVERTED', 'D_CANCELLED'],
          description:
            'Filtruj po statusie: A_DRAFT (szkic), B_ACTIVE (aktywny), C_CONVERTED (skonwertowany), D_CANCELLED (anulowany)',
        },
        phaseId: {
          type: 'number',
          description: 'Filtruj po ID fazy (103=New, 104=In Progress, 105=Converted, 106=Canceled)',
        },
        ownerId: {
          type: 'number',
          description: 'Filtruj po ID właściciela',
        },
      },
    },
  },
  {
    name: 'raynet_search_leads',
    description:
      'Wyszukuje leady po temacie w Raynet CRM. Użyj tego narzędzia, gdy użytkownik szuka leada po nazwie lub temacie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w temacie leada',
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
    name: 'raynet_get_lead',
    description:
      'Pobiera szczegółowe informacje o leadzie na podstawie jego ID. Zwraca pełne dane włącznie z kontaktem i źródłem.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        leadId: {
          type: 'number',
          description: 'ID leada w Raynet CRM',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'raynet_create_lead',
    description:
      'Tworzy nowego leada w Raynet CRM. Lead reprezentuje potencjalnego klienta przed konwersją na firmę/kontakt.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          description: 'Temat/nazwa leada (wymagany)',
        },
        firstName: {
          type: 'string',
          description: 'Imię osoby kontaktowej',
        },
        lastName: {
          type: 'string',
          description: 'Nazwisko osoby kontaktowej',
        },
        companyName: {
          type: 'string',
          description: 'Nazwa firmy',
        },
        email: {
          type: 'string',
          description: 'Adres email',
        },
        phone: {
          type: 'string',
          description: 'Numer telefonu',
        },
        website: {
          type: 'string',
          description: 'Strona internetowa',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela leada',
        },
        phaseId: {
          type: 'number',
          description: 'ID fazy (103=New, 104=In Progress)',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'DEFAULT', 'HIGH'],
          description: 'Priorytet: LOW (niski), DEFAULT (normalny), HIGH (wysoki)',
        },
        contactSourceId: {
          type: 'number',
          description: 'ID źródła kontaktu',
        },
        notice: {
          type: 'string',
          description: 'Notatka/uwagi',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista tagów',
        },
      },
      required: ['topic'],
    },
  },
  {
    name: 'raynet_update_lead',
    description:
      'Aktualizuje dane istniejącego leada w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        leadId: {
          type: 'number',
          description: 'ID leada do aktualizacji (wymagane)',
        },
        topic: {
          type: 'string',
          description: 'Nowy temat leada',
        },
        firstName: {
          type: 'string',
          description: 'Nowe imię',
        },
        lastName: {
          type: 'string',
          description: 'Nowe nazwisko',
        },
        companyName: {
          type: 'string',
          description: 'Nowa nazwa firmy',
        },
        email: {
          type: 'string',
          description: 'Nowy email',
        },
        phone: {
          type: 'string',
          description: 'Nowy telefon',
        },
        website: {
          type: 'string',
          description: 'Nowa strona www',
        },
        phaseId: {
          type: 'number',
          description: 'ID nowej fazy',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'DEFAULT', 'HIGH'],
          description: 'Nowy priorytet',
        },
        status: {
          type: 'string',
          enum: ['A_DRAFT', 'B_ACTIVE', 'C_CONVERTED', 'D_CANCELLED'],
          description: 'Nowy status',
        },
        notice: {
          type: 'string',
          description: 'Nowa notatka',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Nowe tagi (zastąpią istniejące)',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'raynet_update_lead_phase',
    description:
      'Zmienia fazę leada. Użyj tego narzędzia, gdy chcesz przesunąć lead do następnej fazy procesu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        leadId: {
          type: 'number',
          description: 'ID leada',
        },
        phaseId: {
          type: 'number',
          description: 'ID nowej fazy (103=New, 104=In Progress, 105=Converted, 106=Canceled)',
        },
      },
      required: ['leadId', 'phaseId'],
    },
  },
  {
    name: 'raynet_delete_lead',
    description:
      'Usuwa lead z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        leadId: {
          type: 'number',
          description: 'ID leada do usunięcia',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'raynet_convert_lead',
    description:
      'Konwertuje lead na firmę, kontakt i/lub szansę sprzedaży. Użyj tego po kwalifikacji leada.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        leadId: {
          type: 'number',
          description: 'ID leada do konwersji',
        },
        createCompany: {
          type: 'boolean',
          description: 'Czy utworzyć firmę (domyślnie: tak)',
          default: true,
        },
        createContact: {
          type: 'boolean',
          description: 'Czy utworzyć kontakt (domyślnie: tak)',
          default: true,
        },
        createDeal: {
          type: 'boolean',
          description: 'Czy utworzyć szansę sprzedaży (domyślnie: nie)',
          default: false,
        },
        dealName: {
          type: 'string',
          description: 'Nazwa szansy sprzedaży (jeśli tworzona)',
        },
      },
      required: ['leadId'],
    },
  },
  {
    name: 'raynet_get_lead_stats',
    description:
      'Pobiera statystyki leadów: łączna liczba, aktywne, skonwertowane, anulowane. Przydatne do raportowania.',
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
 * Format lead status for display
 */
function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    A_DRAFT: 'Szkic',
    B_ACTIVE: '🟢 Aktywny',
    C_CONVERTED: '✅ Skonwertowany',
    D_CANCELLED: '❌ Anulowany',
  };
  return statuses[status] ?? status;
}

/**
 * Format priority for display
 */
function formatPriority(priority: string): string {
  const priorities: Record<string, string> = {
    LOW: 'Niski',
    DEFAULT: 'Normalny',
    HIGH: '⚠️ Wysoki',
  };
  return priorities[priority] ?? priority;
}

/**
 * Format lead for output
 */
function formatLead(lead: RaynetLead): string {
  const lines = [
    `**${lead.topic}** (${lead.code}, ID: ${lead.id})`,
    `- Status: ${formatStatus(lead.status)} | Faza: ${lead.leadPhase?.code01 ?? 'N/A'}`,
    `- Priorytet: ${formatPriority(lead.priority)}`,
  ];

  // Contact name
  if (lead.firstName || lead.lastName) {
    const name = [lead.titleBefore, lead.firstName, lead.lastName, lead.titleAfter]
      .filter(Boolean)
      .join(' ');
    lines.push(`- Kontakt: ${name}`);
  }

  // Company name
  if (lead.companyName) {
    lines.push(`- Firma: ${lead.companyName}`);
  }

  // Contact info
  if (lead.contactInfo?.email) {
    lines.push(`- Email: ${lead.contactInfo.email}`);
  }
  if (lead.contactInfo?.tel1) {
    lines.push(`- Telefon: ${lead.contactInfo.tel1}`);
  }
  if (lead.contactInfo?.www) {
    lines.push(`- WWW: ${lead.contactInfo.www}`);
  }

  // Source
  if (lead.contactSource?.value) {
    lines.push(`- Źródło: ${lead.contactSource.value}`);
  }

  // Owner
  if (lead.owner?.fullName) {
    lines.push(`- Właściciel: ${lead.owner.fullName}`);
  }

  // Lead date
  if (lead.leadDate) {
    lines.push(`- Data: ${lead.leadDate}`);
  }

  // Tags
  if (lead.tags && lead.tags.length > 0) {
    lines.push(`- Tagi: ${lead.tags.join(', ')}`);
  }

  // Notice
  if (lead.notice) {
    lines.push(`- Notatka: ${lead.notice}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handle list leads tool
 */
export async function handleListLeads(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ListLeadsSchema.parse(args);
    const service = getLeadsService();
    const result = await service.list(input);

    if (result.leads.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych leadów spełniających podane kryteria.',
          },
        ],
      };
    }

    const leadsList = result.leads.map(formatLead).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} leadów (wyświetlono ${result.leads.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${leadsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListLeads', { error });
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
 * Handle search leads tool
 */
export async function handleSearchLeads(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchLeadsSchema.parse(args);
    const service = getLeadsService();
    const result = await service.search(input);

    if (result.leads.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono leadów pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const leadsList = result.leads.map(formatLead).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} leadów (wyświetlono ${result.leads.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${leadsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchLeads', { error });
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
 * Handle get lead tool
 */
export async function handleGetLead(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetLeadSchema.parse(args);
    const service = getLeadsService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatLead(result.lead),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetLead', { error });
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
 * Handle create lead tool
 */
export async function handleCreateLead(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CreateLeadSchema.parse(args);
    const service = getLeadsService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Lead został utworzony pomyślnie!\n\n${formatLead(result.lead)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateLead', { error });
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
 * Handle update lead tool
 */
export async function handleUpdateLead(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateLeadSchema.parse(args);
    const service = getLeadsService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Lead został zaktualizowany pomyślnie!\n\n${formatLead(result.lead)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateLead', { error });
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
 * Handle update lead phase tool
 */
export async function handleUpdateLeadPhase(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateLeadPhaseSchema.parse(args);
    const service = getLeadsService();
    const result = await service.updatePhase(input.leadId, input.phaseId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Faza leada została zmieniona!\n\n${formatLead(result.lead)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateLeadPhase', { error });
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
 * Handle delete lead tool
 */
export async function handleDeleteLead(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteLeadSchema.parse(args);
    const service = getLeadsService();
    await service.delete(input.leadId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Lead o ID ${input.leadId} został usunięty.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteLead', { error });
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
 * Handle convert lead tool
 */
export async function handleConvertLead(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ConvertLeadSchema.parse(args);
    const service = getLeadsService();
    const result = await service.convert(input);

    const lines = [
      '✅ Lead został skonwertowany!',
      '',
      formatLead(result.lead),
    ];

    if (result.company) {
      lines.push(`\n📦 Utworzono firmę: ${result.company.name} (ID: ${result.company.id})`);
    }
    if (result.contact) {
      lines.push(`👤 Utworzono kontakt: ${result.contact.name} (ID: ${result.contact.id})`);
    }
    if (result.deal) {
      lines.push(`💼 Utworzono szansę: ${result.deal.name} (ID: ${result.deal.id})`);
    }

    return {
      content: [
        {
          type: 'text',
          text: lines.join('\n'),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleConvertLead', { error });
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
 * Handle get lead stats tool
 */
export async function handleGetLeadStats(
  _args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const service = getLeadsService();
    const stats = await service.getStats();

    const text = [
      '📊 **Statystyki Leadów**',
      '',
      `- Łącznie: ${stats.total}`,
      `- 🟢 Aktywne: ${stats.active}`,
      `- ✅ Skonwertowane: ${stats.converted}`,
      `- ❌ Anulowane: ${stats.cancelled}`,
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
    logger.error('Error in handleGetLeadStats', { error });
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

export async function handleLeadTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_leads':
      return handleListLeads(args);
    case 'raynet_search_leads':
      return handleSearchLeads(args);
    case 'raynet_get_lead':
      return handleGetLead(args);
    case 'raynet_create_lead':
      return handleCreateLead(args);
    case 'raynet_update_lead':
      return handleUpdateLead(args);
    case 'raynet_update_lead_phase':
      return handleUpdateLeadPhase(args);
    case 'raynet_delete_lead':
      return handleDeleteLead(args);
    case 'raynet_convert_lead':
      return handleConvertLead(args);
    case 'raynet_get_lead_stats':
      return handleGetLeadStats(args);
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
