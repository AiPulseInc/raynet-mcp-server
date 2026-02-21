/**
 * MCP Tools for Companies (Firmy)
 *
 * Tools for managing Raynet CRM companies via MCP protocol
 */

import { z } from 'zod';
import { getCompaniesService } from '../api/companies';
import { getContactsService } from '../api/contacts';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetCompany, RaynetCompanyAddress, RaynetPerson } from '../types';

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

const CompanyStateSchema = z.enum(['A_POTENTIAL', 'B_ACTUAL', 'C_DEFERRED', 'D_ENDED']);
const CompanyRoleSchema = z.enum(['A_SUBSCRIBER', 'B_PARTNER', 'C_SUPPLIER', 'D_RIVAL']);
const RatingSchema = z.enum(['A', 'B', 'C']);

export const ListCompaniesSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  state: CompanyStateSchema.optional(),
  role: CompanyRoleSchema.optional(),
  rating: RatingSchema.optional(),
  ownerId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
});

export const SearchCompaniesSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetCompanySchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
});

export const CreateCompanySchema = z.object({
  name: z.string().min(1, 'Nazwa firmy jest wymagana'),
  role: CompanyRoleSchema.optional(),
  state: CompanyStateSchema.optional(),
  rating: RatingSchema.optional(),
  ownerId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  regNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  contactInfo: z
    .object({
      email: z.string().email('Nieprawidłowy format email').optional(),
      tel1: z.string().optional(),
      www: z.string().optional(),
    })
    .optional(),
});

export const UpdateCompanySchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  role: CompanyRoleSchema.optional(),
  state: CompanyStateSchema.optional(),
  rating: RatingSchema.optional(),
  ownerId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  notice: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteCompanySchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
});

// Address Schemas
export const ListCompanyAddressesSchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
});

export const AddCompanyAddressSchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  name: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email('Nieprawidłowy format email').optional(),
  phone: z.string().optional(),
  primary: z.boolean().optional(),
  contactAddress: z.boolean().optional(),
});

export const UpdateCompanyAddressSchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  addressId: z.number().int().positive('ID adresu musi być liczbą dodatnią'),
  name: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  email: z.string().email('Nieprawidłowy format email').optional(),
  phone: z.string().optional(),
});

export const DeleteCompanyAddressSchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  addressId: z.number().int().positive('ID adresu musi być liczbą dodatnią'),
});

export const SetPrimaryCompanyAddressSchema = z.object({
  companyId: z.number().int().positive('ID firmy musi być liczbą dodatnią'),
  addressId: z.number().int().positive('ID adresu musi być liczbą dodatnią'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const companyToolDefinitions = [
  {
    name: 'raynet_list_companies',
    description:
      'Pobiera listę firm z Raynet CRM. Można filtrować po stanie, roli, ratingu, właścicielu i kategorii. Zwraca firmy z paginacją.',
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
        state: {
          type: 'string',
          enum: ['A_POTENTIAL', 'B_ACTUAL', 'C_DEFERRED', 'D_ENDED'],
          description:
            'Filtruj po stanie: A_POTENTIAL (potencjalny), B_ACTUAL (aktualny), C_DEFERRED (odroczony), D_ENDED (zakończony)',
        },
        role: {
          type: 'string',
          enum: ['A_SUBSCRIBER', 'B_PARTNER', 'C_SUPPLIER', 'D_RIVAL'],
          description:
            'Filtruj po roli: A_SUBSCRIBER (klient), B_PARTNER (partner), C_SUPPLIER (dostawca), D_RIVAL (konkurent)',
        },
        rating: {
          type: 'string',
          enum: ['A', 'B', 'C'],
          description: 'Filtruj po ratingu: A (wysoki), B (średni), C (niski)',
        },
        ownerId: {
          type: 'number',
          description: 'Filtruj po ID właściciela',
        },
        categoryId: {
          type: 'number',
          description: 'Filtruj po ID kategorii',
        },
      },
    },
  },
  {
    name: 'raynet_search_companies',
    description:
      'Wyszukuje firmy po nazwie w Raynet CRM. Użyj tego narzędzia, gdy użytkownik szuka firmy po nazwie lub jej fragmencie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Tekst do wyszukania w nazwie firmy',
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
    name: 'raynet_get_company',
    description:
      'Pobiera szczegółowe informacje o firmie na podstawie jej ID. Zwraca pełne dane firmy włącznie z adresami, danymi kontaktowymi oraz listą powiązanych osób kontaktowych.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy w Raynet CRM',
        },
      },
      required: ['companyId'],
    },
  },
  {
    name: 'raynet_create_company',
    description:
      'Tworzy nową firmę w Raynet CRM. Wymagana jest nazwa firmy, pozostałe pola są opcjonalne.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: {
          type: 'string',
          description: 'Nazwa firmy (wymagana)',
        },
        role: {
          type: 'string',
          enum: ['A_SUBSCRIBER', 'B_PARTNER', 'C_SUPPLIER', 'D_RIVAL'],
          description: 'Rola firmy',
        },
        state: {
          type: 'string',
          enum: ['A_POTENTIAL', 'B_ACTUAL', 'C_DEFERRED', 'D_ENDED'],
          description: 'Stan firmy',
        },
        rating: {
          type: 'string',
          enum: ['A', 'B', 'C'],
          description: 'Rating firmy',
        },
        ownerId: {
          type: 'number',
          description: 'ID właściciela firmy',
        },
        categoryId: {
          type: 'number',
          description: 'ID kategorii firmy',
        },
        regNumber: {
          type: 'string',
          description: 'Numer rejestracyjny (NIP/REGON)',
        },
        taxNumber: {
          type: 'string',
          description: 'Numer VAT',
        },
        notice: {
          type: 'string',
          description: 'Notatka o firmie',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista tagów',
        },
        address: {
          type: 'object',
          description: 'Adres firmy',
          properties: {
            street: { type: 'string', description: 'Ulica' },
            city: { type: 'string', description: 'Miasto' },
            zipCode: { type: 'string', description: 'Kod pocztowy' },
            country: { type: 'string', description: 'Kraj (domyślnie Polska)' },
          },
        },
        contactInfo: {
          type: 'object',
          description: 'Dane kontaktowe',
          properties: {
            email: { type: 'string', description: 'Email' },
            tel1: { type: 'string', description: 'Telefon' },
            www: { type: 'string', description: 'Strona WWW' },
          },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'raynet_update_company',
    description:
      'Aktualizuje dane istniejącej firmy w Raynet CRM. Podaj tylko pola, które chcesz zmienić.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy do aktualizacji (wymagane)',
        },
        name: {
          type: 'string',
          description: 'Nowa nazwa firmy',
        },
        role: {
          type: 'string',
          enum: ['A_SUBSCRIBER', 'B_PARTNER', 'C_SUPPLIER', 'D_RIVAL'],
          description: 'Nowa rola firmy',
        },
        state: {
          type: 'string',
          enum: ['A_POTENTIAL', 'B_ACTUAL', 'C_DEFERRED', 'D_ENDED'],
          description: 'Nowy stan firmy',
        },
        rating: {
          type: 'string',
          enum: ['A', 'B', 'C'],
          description: 'Nowy rating firmy',
        },
        ownerId: {
          type: 'number',
          description: 'ID nowego właściciela',
        },
        categoryId: {
          type: 'number',
          description: 'ID nowej kategorii',
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
      required: ['companyId'],
    },
  },
  {
    name: 'raynet_delete_company',
    description:
      'Usuwa firmę z Raynet CRM. UWAGA: Ta operacja jest nieodwracalna!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy do usunięcia',
        },
      },
      required: ['companyId'],
    },
  },
  // Address tools
  {
    name: 'raynet_list_company_addresses',
    description:
      'Pobiera listę wszystkich adresów firmy. Zwraca adresy główne i kontaktowe.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy',
        },
      },
      required: ['companyId'],
    },
  },
  {
    name: 'raynet_add_company_address',
    description:
      'Dodaje nowy adres do firmy. Można oznaczyć jako główny lub kontaktowy.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy',
        },
        name: {
          type: 'string',
          description: 'Nazwa adresu (np. "Siedziba główna")',
        },
        street: {
          type: 'string',
          description: 'Ulica i numer',
        },
        city: {
          type: 'string',
          description: 'Miasto',
        },
        zipCode: {
          type: 'string',
          description: 'Kod pocztowy',
        },
        country: {
          type: 'string',
          description: 'Kraj (domyślnie Polska)',
        },
        email: {
          type: 'string',
          description: 'Email kontaktowy',
        },
        phone: {
          type: 'string',
          description: 'Telefon kontaktowy',
        },
        primary: {
          type: 'boolean',
          description: 'Czy to adres główny',
        },
        contactAddress: {
          type: 'boolean',
          description: 'Czy to adres kontaktowy',
        },
      },
      required: ['companyId'],
    },
  },
  {
    name: 'raynet_update_company_address',
    description:
      'Aktualizuje istniejący adres firmy. Podaj tylko pola do zmiany.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy',
        },
        addressId: {
          type: 'number',
          description: 'ID adresu do aktualizacji',
        },
        name: {
          type: 'string',
          description: 'Nazwa adresu',
        },
        street: {
          type: 'string',
          description: 'Ulica i numer',
        },
        city: {
          type: 'string',
          description: 'Miasto',
        },
        zipCode: {
          type: 'string',
          description: 'Kod pocztowy',
        },
        country: {
          type: 'string',
          description: 'Kraj',
        },
        email: {
          type: 'string',
          description: 'Email kontaktowy',
        },
        phone: {
          type: 'string',
          description: 'Telefon kontaktowy',
        },
      },
      required: ['companyId', 'addressId'],
    },
  },
  {
    name: 'raynet_delete_company_address',
    description:
      'Usuwa adres firmy. Nie można usunąć adresu głównego.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy',
        },
        addressId: {
          type: 'number',
          description: 'ID adresu do usunięcia',
        },
      },
      required: ['companyId', 'addressId'],
    },
  },
  {
    name: 'raynet_set_primary_company_address',
    description:
      'Ustawia adres jako główny dla firmy.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        companyId: {
          type: 'number',
          description: 'ID firmy',
        },
        addressId: {
          type: 'number',
          description: 'ID adresu do ustawienia jako główny',
        },
      },
      required: ['companyId', 'addressId'],
    },
  },
];

// ============================================================================
// Tool Handlers
// ============================================================================

/**
 * Format company for output
 */
function formatCompany(company: RaynetCompany): string {
  const lines = [
    `**${company.name}** (ID: ${company.id})`,
    `- Stan: ${formatState(company.state)} | Rola: ${formatRole(company.role)} | Rating: ${company.rating ?? 'N/A'}`,
    `- Właściciel: ${company.owner?.fullName ?? 'N/A'}`,
  ];

  if (company.regNumber) {
    lines.push(`- Nr Rejestracyjny (REGON/KRS): ${company.regNumber}`);
  }

  if (company.taxNumber) {
    lines.push(`- NIP (Tax ID): ${company.taxNumber}`);
  }

  if (company.primaryAddress?.contactInfo?.email) {
    lines.push(`- Email: ${company.primaryAddress.contactInfo.email}`);
  }

  if (company.primaryAddress?.contactInfo?.tel1) {
    lines.push(`- Tel: ${company.primaryAddress.contactInfo.tel1}`);
  }

  if (company.primaryAddress?.address?.city) {
    const addr = company.primaryAddress.address;
    lines.push(`- Adres: ${addr.street ?? ''}, ${addr.zipCode ?? ''} ${addr.city}`);
  }

  if (company.tags && company.tags.length > 0) {
    lines.push(`- Tagi: ${company.tags.join(', ')}`);
  }

  return lines.join('\n');
}

function formatState(state: string): string {
  const states: Record<string, string> = {
    A_POTENTIAL: 'Potencjalny',
    B_ACTUAL: 'Aktualny',
    C_DEFERRED: 'Odroczony',
    D_ENDED: 'Zakończony',
  };
  return states[state] ?? state;
}

function formatRole(role: string): string {
  const roles: Record<string, string> = {
    A_SUBSCRIBER: 'Klient',
    B_PARTNER: 'Partner',
    C_SUPPLIER: 'Dostawca',
    D_RIVAL: 'Konkurent',
  };
  return roles[role] ?? role;
}

/**
 * Format contact person for company output
 */
function formatContactPerson(contact: RaynetPerson): string {
  const fullName = [
    contact.titleBefore,
    contact.firstName,
    contact.lastName,
    contact.titleAfter,
  ]
    .filter(Boolean)
    .join(' ');

  const parts = [`  - **${fullName}**`];

  if (contact.primaryRelationship?.type) {
    parts.push(`(${contact.primaryRelationship.type})`);
  }

  const contactDetails: string[] = [];
  if (contact.contactInfo?.email) {
    contactDetails.push(`Email: ${contact.contactInfo.email}`);
  }
  if (contact.contactInfo?.tel1) {
    contactDetails.push(`Tel: ${contact.contactInfo.tel1}`);
  }

  if (contactDetails.length > 0) {
    parts.push(`- ${contactDetails.join(', ')}`);
  }

  return parts.join(' ');
}

/**
 * Handle list companies tool
 */
export async function handleListCompanies(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = ListCompaniesSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getCompaniesService();
    const result = await service.list(input);

    if (result.companies.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Nie znaleziono żadnych firm spełniających podane kryteria.',
          },
        ],
      };
    }

    const companiesList = result.companies.map(formatCompany).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} firm (wyświetlono ${result.companies.length}, offset: ${result.offset})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${companiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListCompanies', { error });
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
 * Handle search companies tool
 */
export async function handleSearchCompanies(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchCompaniesSchema.parse(args);
    const service = getCompaniesService();
    const result = await service.search(input);

    if (result.companies.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `Nie znaleziono firm pasujących do zapytania: "${input.query}"`,
          },
        ],
      };
    }

    const companiesList = result.companies.map(formatCompany).join('\n\n---\n\n');
    const summary = `Wyniki wyszukiwania dla "${input.query}": ${result.totalCount} firm (wyświetlono ${result.companies.length})`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${companiesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSearchCompanies', { error });
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
 * Handle get company tool
 */
export async function handleGetCompany(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetCompanySchema.parse(args);
    const companiesService = getCompaniesService();
    const contactsService = getContactsService();

    // Fetch company details and linked contacts in parallel
    const [companyResult, contactsResult] = await Promise.all([
      companiesService.get(input),
      contactsService.list({ companyId: input.companyId, limit: 50 }),
    ]);

    // Format company info
    let output = formatCompany(companyResult.company);

    // Add linked contacts section
    if (contactsResult.contacts.length > 0) {
      const contactsList = contactsResult.contacts.map(formatContactPerson).join('\n');
      output += `\n\n**Osoby kontaktowe (${contactsResult.contacts.length}):**\n${contactsList}`;
    } else {
      output += '\n\n**Osoby kontaktowe:** Brak przypisanych kontaktów';
    }

    return {
      content: [
        {
          type: 'text',
          text: output,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleGetCompany', { error });
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
 * Handle create company tool
 */
export async function handleCreateCompany(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateCompanySchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getCompaniesService();
    const result = await service.create(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Firma została utworzona pomyślnie!\n\n${formatCompany(result.company)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleCreateCompany', { error });
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
 * Handle update company tool
 */
export async function handleUpdateCompany(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateCompanySchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getCompaniesService();
    const result = await service.update(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Firma została zaktualizowana pomyślnie!\n\n${formatCompany(result.company)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateCompany', { error });
    const errorMessage = getPolishErrorMessage(error);
    const errorDetails = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: `Błąd: ${errorMessage}\n\nSzczegóły: ${errorDetails}`,
        },
      ],
    };
  }
}

/**
 * Handle delete company tool
 */
export async function handleDeleteCompany(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteCompanySchema.parse(args);
    const service = getCompaniesService();
    await service.delete(input.companyId);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Firma o ID ${input.companyId} została usunięta.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteCompany', { error });
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
// Address Tool Handlers
// ============================================================================

/**
 * Format address for output
 */
function formatAddress(address: RaynetCompanyAddress): string {
  const lines = [];

  const name = address.address?.name ?? 'Adres';
  const flags = [];
  if (address.primary) flags.push('Główny');
  if (address.contactAddress) flags.push('Kontaktowy');

  lines.push(`**${name}** (ID: ${address.id})${flags.length > 0 ? ` [${flags.join(', ')}]` : ''}`);

  const addr = address.address;
  if (addr?.street || addr?.city) {
    const parts = [];
    if (addr.street) parts.push(addr.street);
    if (addr.zipCode || addr.city) {
      parts.push(`${addr.zipCode ?? ''} ${addr.city ?? ''}`.trim());
    }
    if (addr.country && addr.country !== 'Polska') parts.push(addr.country);
    lines.push(`- Adres: ${parts.join(', ')}`);
  }

  if (address.contactInfo?.email) {
    lines.push(`- Email: ${address.contactInfo.email}`);
  }

  if (address.contactInfo?.tel1) {
    lines.push(`- Tel: ${address.contactInfo.tel1}`);
  }

  return lines.join('\n');
}

/**
 * Handle list company addresses tool
 */
export async function handleListCompanyAddresses(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = ListCompanyAddressesSchema.parse(args);
    const service = getCompaniesService();
    const result = await service.listAddresses(input);

    if (result.addresses.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: 'Firma nie ma żadnych dodatkowych adresów.',
          },
        ],
      };
    }

    const addressesList = result.addresses.map(formatAddress).join('\n\n---\n\n');
    const summary = `Adresy firmy (${result.totalCount}):`;

    return {
      content: [
        {
          type: 'text',
          text: `${summary}\n\n${addressesList}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleListCompanyAddresses', { error });
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
 * Handle add company address tool
 */
export async function handleAddCompanyAddress(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = AddCompanyAddressSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getCompaniesService();
    const result = await service.addAddress(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Adres został dodany pomyślnie!\n\n${formatAddress(result.address)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleAddCompanyAddress', { error });
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
 * Handle update company address tool
 */
export async function handleUpdateCompanyAddress(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateCompanyAddressSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getCompaniesService();
    const result = await service.updateAddress(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Adres został zaktualizowany pomyślnie!\n\n${formatAddress(result.address)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleUpdateCompanyAddress', { error });
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
 * Handle delete company address tool
 */
export async function handleDeleteCompanyAddress(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteCompanyAddressSchema.parse(args);
    const service = getCompaniesService();
    await service.deleteAddress(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Adres o ID ${input.addressId} został usunięty.`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleDeleteCompanyAddress', { error });
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
 * Handle set primary company address tool
 */
export async function handleSetPrimaryCompanyAddress(
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SetPrimaryCompanyAddressSchema.parse(args);
    const service = getCompaniesService();
    const result = await service.setPrimaryAddress(input);

    return {
      content: [
        {
          type: 'text',
          text: `✅ Adres został ustawiony jako główny!\n\n${formatAddress(result.address)}`,
        },
      ],
    };
  } catch (error) {
    logger.error('Error in handleSetPrimaryCompanyAddress', { error });
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

export async function handleCompanyTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_companies':
      return handleListCompanies(args);
    case 'raynet_search_companies':
      return handleSearchCompanies(args);
    case 'raynet_get_company':
      return handleGetCompany(args);
    case 'raynet_create_company':
      return handleCreateCompany(args);
    case 'raynet_update_company':
      return handleUpdateCompany(args);
    case 'raynet_delete_company':
      return handleDeleteCompany(args);
    // Address tools
    case 'raynet_list_company_addresses':
      return handleListCompanyAddresses(args);
    case 'raynet_add_company_address':
      return handleAddCompanyAddress(args);
    case 'raynet_update_company_address':
      return handleUpdateCompanyAddress(args);
    case 'raynet_delete_company_address':
      return handleDeleteCompanyAddress(args);
    case 'raynet_set_primary_company_address':
      return handleSetPrimaryCompanyAddress(args);
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
