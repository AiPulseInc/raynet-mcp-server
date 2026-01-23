/**
 * MCP Tools for Contacts (Kontakty)
 *
 * Tools for managing Raynet CRM contacts via MCP protocol
 */

import { z } from 'zod';
import { getContactsService } from '../api/contacts';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetPerson } from '../types';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

export const ListContactsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  companyId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const SearchContactsSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetContactSchema = z.object({
  contactId: z.number().int().positive('ID kontaktu musi być liczbą dodatnią'),
});

export const CreateContactSchema = z.object({
  firstName: z.string().min(1, 'Imię jest wymagane'),
  lastName: z.string().min(1, 'Nazwisko jest wymagane'),
  companyId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  email: z.string().email('Nieprawidłowy format email').optional(),
  phone: z.string().optional(),
  titleBefore: z.string().optional(),
  titleAfter: z.string().optional(),
  birthday: z.string().optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateContactSchema = z.object({
  contactId: z.number().int().positive('ID kontaktu musi być liczbą dodatnią'),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email('Nieprawidłowy format email').optional(),
  phone: z.string().optional(),
  titleBefore: z.string().optional(),
  titleAfter: z.string().optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteContactSchema = z.object({
  contactId: z.number().int().positive('ID kontaktu musi być liczbą dodatnią'),
});

export const LinkContactToCompanySchema = z.object({
  contactId: z.number().int().positive('ID kontaktu musi być liczbą dodatnią'),
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  relationshipType: z.string().optional(),
  primary: z.boolean().optional(),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const contactToolDefinitions = [
  {
    name: 'raynet_list_contacts',
    description:
      'Pobiera listę kontaktów z Raynet CRM. Można filtrować po firmie i właścicielu. Zwraca kontakty z paginacją.',
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
          description: 'Filtruj po ID firmy - zwróć tylko kontakty powiązane z daną firmą',
        },
        ownerId: {
          type: 'number',
          description: 'Filtruj po ID właściciela kontaktu',
        },
      },
    },
  },
  {
    name: 'raynet_search_contacts',
    description:
      'Wyszukuje kontakty po imieniu lub nazwisku w Raynet CRM. Użyj tego narzędzia, gdy użytkownik szuka osoby po nazwie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w imieniu/nazwisku kontaktu',
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
    name: 'raynet_get_contact',
    description:
      'Pobiera szczegółowe informacje o kontakcie na podstawie jego ID. Zwraca pełne dane osoby włącznie z danymi kontaktowymi i powiązaniami z firmami.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'number',
          description: 'ID kontaktu w Raynet CRM',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'raynet_create_contact',
    description:
      'Tworzy nowy kontakt (osobę) w Raynet CRM. Wymagane są imię i nazwisko, pozostałe pola są opcjonalne.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        firstName: {
          type: 'string',
          description: 'Imię kontaktu (wymagane)',
        },
        lastName: {
          type: 'string',
          description: 'Nazwisko kontaktu (wymagane)',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy, do której przypisać kontakt',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela kontaktu',
        },
        email: {
          type: 'string',
          description: 'Adres email',
        },
        phone: {
          type: 'string',
          description: 'Numer telefonu',
        },
        titleBefore: {
          type: 'string',
          description: 'Tytuł przed imieniem (np. mgr, dr)',
        },
        titleAfter: {
          type: 'string',
          description: 'Tytuł po nazwisku (np. PhD)',
        },
        birthday: {
          type: 'string',
          description: 'Data urodzenia (format YYYY-MM-DD)',
        },
        notice: {
          type: 'string',
          description: 'Notatka o kontakcie',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista tagów',
        },
      },
      required: ['firstName', 'lastName'],
    },
  },
  {
    name: 'raynet_update_contact',
    description:
      'Aktualizuje dane istniejącego kontaktu w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'number',
          description: 'ID kontaktu do aktualizacji (wymagane)',
        },
        firstName: {
          type: 'string',
          description: 'Nowe imię',
        },
        lastName: {
          type: 'string',
          description: 'Nowe nazwisko',
        },
        email: {
          type: 'string',
          description: 'Nowy email',
        },
        phone: {
          type: 'string',
          description: 'Nowy telefon',
        },
        titleBefore: {
          type: 'string',
          description: 'Nowy tytuł przed imieniem',
        },
        titleAfter: {
          type: 'string',
          description: 'Nowy tytuł po nazwisku',
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
      required: ['contactId'],
    },
  },
  {
    name: 'raynet_delete_contact',
    description:
      'Usuwa kontakt z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'number',
          description: 'ID kontaktu do usunięcia',
        },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'raynet_link_contact_to_company',
    description:
      'Przypisuje kontakt do firmy w Raynet CRM. Tworzy relację między osobą a firmą.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        contactId: {
          type: 'number',
          description: 'ID kontaktu',
        },
        companyId: {
          type: 'number',
          description: 'ID firmy, do której przypisać kontakt',
        },
        relationshipType: {
          type: 'string',
          description: 'Typ relacji (np. Pracownik, Dyrektor, Właściciel)',
        },
        primary: {
          type: 'boolean',
          description: 'Czy to główna firma kontaktu',
        },
      },
      required: ['contactId', 'companyId'],
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

/**
 * Format contact for output
 */
function formatContact(contact: RaynetPerson): string {
  const fullName = [
    contact.titleBefore,
    contact.firstName,
    contact.lastName,
    contact.titleAfter,
  ]
    .filter(Boolean)
    .join(' ');

  const lines = [
    `**${fullName}** (ID: ${contact.id})`,
  ];

  // Company relationship
  if (contact.primaryRelationship?.company?.name) {
    lines.push(`- Firma: ${contact.primaryRelationship.company.name} (${contact.primaryRelationship.type})`);
  }

  // Owner
  if (contact.owner?.fullName) {
    lines.push(`- Właściciel: ${contact.owner.fullName}`);
  }

  // Contact info
  if (contact.contactInfo?.email) {
    lines.push(`- Email: ${contact.contactInfo.email}`);
  }
  if (contact.contactInfo?.tel1) {
    lines.push(`- Tel: ${contact.contactInfo.tel1}`);
  }

  // Key contact indicator
  if (contact.keyman) {
    lines.push(`- ⭐ Kluczowa osoba decyzyjna`);
  }

  // Tags
  if (contact.tags && contact.tags.length > 0) {
    lines.push(`- Tagi: ${contact.tags.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Handle list contacts tool
 */
export async function handleListContacts(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ListContactsSchema.parse(args);
    const service = getContactsService();
    const result = await service.list(input);

    if (result.contacts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych kontaktów spełniających podane kryteria.',
          },
        ],
      };
    }

    const contactsList = result.contacts.map(formatContact).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} kontaktów (wyświetlono ${result.contacts.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${contactsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListContacts', { error });
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
 * Handle search contacts tool
 */
export async function handleSearchContacts(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchContactsSchema.parse(args);
    const service = getContactsService();
    const result = await service.search(input);

    if (result.contacts.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono kontaktów pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const contactsList = result.contacts.map(formatContact).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} kontaktów (wyświetlono ${result.contacts.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${contactsList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchContacts', { error });
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
 * Handle get contact tool
 */
export async function handleGetContact(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetContactSchema.parse(args);
    const service = getContactsService();
    const result = await service.get(input);

    return {
      content: [
        {
          type: 'text',
          text: formatContact(result.contact),
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetContact', { error });
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
 * Handle create contact tool
 */
export async function handleCreateContact(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = CreateContactSchema.parse(args);
    const service = getContactsService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Kontakt został utworzony pomyślnie!\n\n${formatContact(result.contact)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateContact', { error });
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
 * Handle update contact tool
 */
export async function handleUpdateContact(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = UpdateContactSchema.parse(args);
    const service = getContactsService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Kontakt został zaktualizowany pomyślnie!\n\n${formatContact(result.contact)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateContact', { error });
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
 * Handle delete contact tool
 */
export async function handleDeleteContact(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteContactSchema.parse(args);
    const service = getContactsService();
    await service.delete(input.contactId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Kontakt o ID ${input.contactId} został usunięty.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteContact', { error });
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
 * Handle link contact to company tool
 */
export async function handleLinkContactToCompany(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = LinkContactToCompanySchema.parse(args);
    const service = getContactsService();
    const result = await service.linkToCompany(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Kontakt został przypisany do firmy!\n\n${formatContact(result.contact)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleLinkContactToCompany', { error });
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

export async function handleContactTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_contacts':
      return handleListContacts(args);
    case 'raynet_search_contacts':
      return handleSearchContacts(args);
    case 'raynet_get_contact':
      return handleGetContact(args);
    case 'raynet_create_contact':
      return handleCreateContact(args);
    case 'raynet_update_contact':
      return handleUpdateContact(args);
    case 'raynet_delete_contact':
      return handleDeleteContact(args);
    case 'raynet_link_contact_to_company':
      return handleLinkContactToCompany(args);
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
