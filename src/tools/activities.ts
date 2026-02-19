/**
 * MCP Tools for Activities (Aktywności)
 *
 * Tools for managing Raynet CRM activities (Tasks, PhoneCalls, Meetings, Emails) via MCP protocol
 */

import { z } from 'zod';
import { getActivitiesService } from '../api/activities';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetActivity, ActivityType } from '../types';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

const ActivityTypeSchema = z.enum(['Task', 'PhoneCall', 'Meeting', 'Email']);
const ActivityStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
const ActivityPrioritySchema = z.enum(['LOW', 'DEFAULT', 'HIGH']);

export const ListActivitiesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  // nullish() = optional() + nullable() — LLMs sometimes send null instead of omitting
  companyId: z.number().int().positive().nullish(),
  contactId: z.number().int().positive().nullish(),
  dealId: z.number().int().positive().nullish(),
  status: ActivityStatusSchema.optional(),
});

export const SearchActivitiesSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetActivitySchema = z.object({
  activityId: z.number().int().positive('ID aktywności musi być liczbą dodatnią'),
  activityType: ActivityTypeSchema,
});

export const CreateActivitySchema = z.object({
  type: ActivityTypeSchema,
  title: z.string().min(1, 'Tytuł aktywności jest wymagany'),
  // nullish() = optional() + nullable() — LLMs sometimes send null instead of omitting
  companyId: z.number().int().positive().nullish(),
  contactId: z.number().int().positive().nullish(),
  dealId: z.number().int().positive().nullish(),
  scheduledFrom: z.string().min(1, 'Data rozpoczęcia jest wymagana'),
  scheduledTill: z.string().min(1, 'Data zakończenia jest wymagana'),
  description: z.string().optional(),
  priority: ActivityPrioritySchema.optional(),
});

export const UpdateActivitySchema = z.object({
  activityId: z.number().int().positive('ID aktywności musi być liczbą dodatnią'),
  activityType: ActivityTypeSchema,
  title: z.string().min(1).optional(),
  scheduledFrom: z.string().optional(),
  scheduledTill: z.string().optional(),
  description: z.string().optional(),
  priority: ActivityPrioritySchema.optional(),
  status: ActivityStatusSchema.optional(),
});

export const CompleteActivitySchema = z.object({
  activityId: z.number().int().positive('ID aktywności musi być liczbą dodatnią'),
  activityType: ActivityTypeSchema,
  solution: z.string().optional(),
});

export const DeleteActivitySchema = z.object({
  activityId: z.number().int().positive('ID aktywności musi być liczbą dodatnią'),
  activityType: ActivityTypeSchema,
});

export const GetTodayActivitiesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
});

export const GetOverdueActivitiesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const activityToolDefinitions = [
  {
    name: 'raynet_list_activities',
    description:
      'Pobiera listę aktywności (zadań, rozmów, spotkań, e-maili) z Raynet CRM. Można filtrować po firmie, kontakcie, szansie i statusie.',
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
        companyId: {
          type: 'number',
          description: 'Filtruj po ID firmy',
        },
        contactId: {
          type: 'number',
          description: 'Filtruj po ID kontaktu',
        },
        dealId: {
          type: 'number',
          description: 'Filtruj po ID szansy sprzedaży',
        },
        status: {
          type: 'string',
          enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
          description: 'Filtruj po statusie: SCHEDULED (zaplanowane), COMPLETED (zakończone), CANCELLED (anulowane)',
        },
      },
    },
  },
  {
    name: 'raynet_search_activities',
    description:
      'Wyszukuje aktywności po tytule w Raynet CRM. Przeszukuje wszystkie typy aktywności.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w tytule aktywności',
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
    name: 'raynet_get_activity',
    description:
      'Pobiera szczegółowe informacje o aktywności na podstawie jej ID i typu. Zwraca pełne dane włącznie z opisem i uczestnikami.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activityId: {
          type: 'number',
          description: 'ID aktywności w Raynet CRM',
        },
        activityType: {
          type: 'string',
          enum: ['Task', 'PhoneCall', 'Meeting', 'Email'],
          description: 'Typ aktywności: Task (zadanie), PhoneCall (rozmowa), Meeting (spotkanie), Email (e-mail)',
        },
      },
      required: ['activityId', 'activityType'],
    },
  },
  {
    name: 'raynet_create_activity',
    description:
      'Tworzy nową aktywność w Raynet CRM. Można utworzyć zadanie, rozmowę telefoniczną, spotkanie lub e-mail.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['Task', 'PhoneCall', 'Meeting', 'Email'],
          description: 'Typ aktywności: Task (zadanie), PhoneCall (rozmowa), Meeting (spotkanie), Email (e-mail)',
        },
        title: {
          type: 'string',
          description: 'Tytuł aktywności (wymagany)',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy powiązanej z aktywnością',
        },
        contactId: {
          type: 'number',
          description: 'ID osoby kontaktowej',
        },
        dealId: {
          type: 'number',
          description: 'ID szansy sprzedaży',
        },
        scheduledFrom: {
          type: 'string',
          description: 'Data i czas rozpoczęcia (format: YYYY-MM-DD HH:MM lub YYYY-MM-DDTHH:MM:SS)',
        },
        scheduledTill: {
          type: 'string',
          description: 'Data i czas zakończenia (format: YYYY-MM-DD HH:MM lub YYYY-MM-DDTHH:MM:SS)',
        },
        description: {
          type: 'string',
          description: 'Opis aktywności',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'DEFAULT', 'HIGH'],
          description: 'Priorytet: LOW (niski), DEFAULT (normalny), HIGH (wysoki)',
        },
      },
      required: ['type', 'title', 'scheduledFrom', 'scheduledTill'],
    },
  },
  {
    name: 'raynet_update_activity',
    description:
      'Aktualizuje dane istniejącej aktywności w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activityId: {
          type: 'number',
          description: 'ID aktywności do aktualizacji (wymagane)',
        },
        activityType: {
          type: 'string',
          enum: ['Task', 'PhoneCall', 'Meeting', 'Email'],
          description: 'Typ aktywności (wymagane)',
        },
        title: {
          type: 'string',
          description: 'Nowy tytuł',
        },
        scheduledFrom: {
          type: 'string',
          description: 'Nowa data rozpoczęcia',
        },
        scheduledTill: {
          type: 'string',
          description: 'Nowa data zakończenia',
        },
        description: {
          type: 'string',
          description: 'Nowy opis',
        },
        priority: {
          type: 'string',
          enum: ['LOW', 'DEFAULT', 'HIGH'],
          description: 'Nowy priorytet',
        },
        status: {
          type: 'string',
          enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
          description: 'Nowy status',
        },
      },
      required: ['activityId', 'activityType'],
    },
  },
  {
    name: 'raynet_complete_activity',
    description:
      'Oznacza aktywność jako zakończoną. Opcjonalnie można dodać opis rozwiązania/rezultatu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activityId: {
          type: 'number',
          description: 'ID aktywności do zakończenia',
        },
        activityType: {
          type: 'string',
          enum: ['Task', 'PhoneCall', 'Meeting', 'Email'],
          description: 'Typ aktywności',
        },
        solution: {
          type: 'string',
          description: 'Opis rozwiązania/rezultatu (opcjonalny)',
        },
      },
      required: ['activityId', 'activityType'],
    },
  },
  {
    name: 'raynet_delete_activity',
    description:
      'Usuwa aktywność z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        activityId: {
          type: 'number',
          description: 'ID aktywności do usunięcia',
        },
        activityType: {
          type: 'string',
          enum: ['Task', 'PhoneCall', 'Meeting', 'Email'],
          description: 'Typ aktywności',
        },
      },
      required: ['activityId', 'activityType'],
    },
  },
  {
    name: 'raynet_get_today_activities',
    description:
      'Pobiera aktywności zaplanowane na dzisiaj. Przydatne do planowania dnia pracy.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników (domyślnie 50)',
          default: 50,
        },
      },
    },
  },
  {
    name: 'raynet_get_overdue_activities',
    description:
      'Pobiera przeterminowane aktywności (zaplanowane w przeszłości, ale niezakończone). Pomaga w identyfikacji zaległości.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników (domyślnie 50)',
          default: 50,
        },
      },
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format activity type for display
 */
function formatActivityType(type: ActivityType): string {
  const types: Record<ActivityType, string> = {
    Task: 'Zadanie',
    PhoneCall: 'Rozmowa telefoniczna',
    Meeting: 'Spotkanie',
    Email: 'E-mail',
  };
  return types[type] ?? type;
}

/**
 * Format activity status for display
 */
function formatStatus(status: string): string {
  const statuses: Record<string, string> = {
    SCHEDULED: '📅 Zaplanowane',
    COMPLETED: '✅ Zakończone',
    CANCELLED: '❌ Anulowane',
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
 * Format date for display
 */
function formatDateTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('pl-PL', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format activity for output
 */
function formatActivity(activity: RaynetActivity): string {
  const lines = [
    `**${activity.title}** (${formatActivityType(activity._entityName)}, ID: ${activity.id})`,
    `- Status: ${formatStatus(activity.status)} | Priorytet: ${formatPriority(activity.priority)}`,
    `- Termin: ${formatDateTime(activity.scheduledFrom)} - ${formatDateTime(activity.scheduledTill)}`,
  ];

  // Company
  if (activity.company?.name) {
    lines.push(`- Firma: ${activity.company.name}`);
  }

  // Contact
  if (activity.person?.name) {
    lines.push(`- Kontakt: ${activity.person.name}`);
  }

  // Deal
  if (activity.businessCase?.name) {
    lines.push(`- Szansa: ${activity.businessCase.name}`);
  }

  // Description
  if (activity.description) {
    const desc = activity.description.length > 100
      ? activity.description.substring(0, 100) + '...'
      : activity.description;
    lines.push(`- Opis: ${desc}`);
  }

  // Solution (if completed)
  if (activity.solution) {
    lines.push(`- Rezultat: ${activity.solution}`);
  }

  // Tags
  if (activity.tags && activity.tags.length > 0) {
    lines.push(`- Tagi: ${activity.tags.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handle list activities tool
 */
export async function handleListActivities(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ListActivitiesSchema.parse(args);
    const service = getActivitiesService();
    // Normalize null → undefined (LLMs sometimes send null for optional numeric fields)
    const result = await service.list({
      ...input,
      companyId: input.companyId ?? undefined,
      contactId: input.contactId ?? undefined,
      dealId: input.dealId ?? undefined,
    });

    if (result.activities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych aktywności spełniających podane kryteria.',
          },
        ],
      };
    }

    const activitiesList = result.activities.map(formatActivity).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} aktywności (wyświetlono ${result.activities.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${activitiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListActivities', { error });
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
 * Handle search activities tool
 */
export async function handleSearchActivities(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchActivitiesSchema.parse(args);
    const service = getActivitiesService();
    const result = await service.search(input);

    if (result.activities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono aktywności pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const activitiesList = result.activities.map(formatActivity).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} aktywności (wyświetlono ${result.activities.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${activitiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchActivities', { error });
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
 * Handle get activity tool
 */
export async function handleGetActivity(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetActivitySchema.parse(args);
    const service = getActivitiesService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatActivity(result.activity),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetActivity', { error });
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
 * Handle create activity tool
 */
export async function handleCreateActivity(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CreateActivitySchema.parse(args);
    const service = getActivitiesService();
    // Normalize null → undefined (LLMs sometimes send null for optional numeric fields)
    const result = await service.create({
      ...input,
      companyId: input.companyId ?? undefined,
      contactId: input.contactId ?? undefined,
      dealId: input.dealId ?? undefined,
    });

    return {
      content: [
        {
          type: 'text',
          text: `✅ Aktywność została utworzona pomyślnie!\n\n${formatActivity(result.activity)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateActivity', { error });
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
 * Handle update activity tool
 */
export async function handleUpdateActivity(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateActivitySchema.parse(args);
    const service = getActivitiesService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Aktywność została zaktualizowana pomyślnie!\n\n${formatActivity(result.activity)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateActivity', { error });
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
 * Handle complete activity tool
 */
export async function handleCompleteActivity(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CompleteActivitySchema.parse(args);
    const service = getActivitiesService();
    const result = await service.complete(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Aktywność została oznaczona jako zakończona!\n\n${formatActivity(result.activity)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCompleteActivity', { error });
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
 * Handle delete activity tool
 */
export async function handleDeleteActivity(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteActivitySchema.parse(args);
    const service = getActivitiesService();
    await service.delete(input.activityId, input.activityType);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Aktywność o ID ${input.activityId} (${formatActivityType(input.activityType)}) została usunięta.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteActivity', { error });
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
 * Handle get today's activities tool
 */
export async function handleGetTodayActivities(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetTodayActivitiesSchema.parse(args);
    const service = getActivitiesService();
    const result = await service.getToday(input.limit);

    if (result.activities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '📅 Brak zaplanowanych aktywności na dzisiaj.',
          },
        ],
      };
    }

    const activitiesList = result.activities.map(formatActivity).join('\n\n---\n\n');
    const today = new Date().toLocaleDateString('pl-PL', { dateStyle: 'full' });

    return {
      content: [
        {
          type: 'text',
          text: `📅 **Aktywności na dziś** (${today})\n\nZnaleziono ${result.totalCount} aktywności\n\n${activitiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetTodayActivities', { error });
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
 * Handle get overdue activities tool
 */
export async function handleGetOverdueActivities(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetOverdueActivitiesSchema.parse(args);
    const service = getActivitiesService();
    const result = await service.getOverdue(input.limit);

    if (result.activities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: '✅ Brak przeterminowanych aktywności. Świetna robota!',
          },
        ],
      };
    }

    const activitiesList = result.activities.map(formatActivity).join('\n\n---\n\n');

    return {
      content: [
        {
          type: 'text',
          text: `⚠️ **Przeterminowane aktywności**\n\nZnaleziono ${result.totalCount} zaległych aktywności\n\n${activitiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetOverdueActivities', { error });
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

export async function handleActivityTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_activities':
      return handleListActivities(args);
    case 'raynet_search_activities':
      return handleSearchActivities(args);
    case 'raynet_get_activity':
      return handleGetActivity(args);
    case 'raynet_create_activity':
      return handleCreateActivity(args);
    case 'raynet_update_activity':
      return handleUpdateActivity(args);
    case 'raynet_complete_activity':
      return handleCompleteActivity(args);
    case 'raynet_delete_activity':
      return handleDeleteActivity(args);
    case 'raynet_get_today_activities':
      return handleGetTodayActivities(args);
    case 'raynet_get_overdue_activities':
      return handleGetOverdueActivities(args);
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
