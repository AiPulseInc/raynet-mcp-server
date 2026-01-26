/**
 * Contacts (Persons) API Service
 *
 * CRUD operations for Raynet Persons (Kontakty)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetPerson,
  RaynetPersonRelationship,
  RaynetListResponse,
  RaynetResponse,
  ListContactsInput,
  SearchContactsInput,
  GetContactInput,
  CreateContactInput,
  UpdateContactInput,
  LinkContactToCompanyInput,
  ListContactRelationshipsInput,
  AddContactRelationshipInput,
  UpdateContactRelationshipInput,
  DeleteContactRelationshipInput,
  SetPrimaryContactRelationshipInput,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing contacts */
type ContactQueryParams = Record<string, unknown>;

/** Payload for creating/updating contacts */
interface ContactPayload {
  firstName: string;
  lastName: string;
  owner?: number;
  category?: number;
  titleBefore?: string;
  titleAfter?: string;
  birthday?: string;
  notice?: string;
  tags?: string[];
  contactInfo?: {
    email?: string;
    tel1?: string;
    www?: string;
  };
  relationship?: {
    company: number;
    type?: string;
    primary?: boolean;
  };
}

/** Result of contact operations */
export interface ContactResult {
  contact: RaynetPerson;
}

/** Result of contact list operations */
export interface ContactListResult {
  contacts: RaynetPerson[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Result of relationship operations */
export interface RelationshipResult {
  relationship: RaynetPersonRelationship;
}

/** Result of relationship list operations */
export interface RelationshipListResult {
  relationships: RaynetPersonRelationship[];
  totalCount: number;
}

// ============================================================================
// Contacts Service
// ============================================================================

export class ContactsService {
  private client: RaynetClient;
  private readonly endpoint = '/person';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List contacts with optional filters
   * Note: Raynet API doesn't support filtering by company directly on person endpoint,
   * so when companyId is provided, we fetch via company relationship endpoint.
   */
  async list(input: ListContactsInput = {}): Promise<ContactListResult> {
    const { limit = 20, offset = 0, companyId, ownerId } = input;

    // If filtering by company, use relationship endpoint
    if (companyId) {
      return this.getByCompany(companyId, limit, offset);
    }

    const params: ContactQueryParams = {
      limit,
      offset,
    };

    if (ownerId) params['owner[EQ]'] = ownerId;

    logger.info('Listing contacts', { params });

    const response = await this.client.getList<RaynetPerson>(
      `${this.endpoint}/`,
      params
    );

    return {
      contacts: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Get contacts linked to a specific company via relationship endpoint
   */
  private async getByCompany(companyId: number, limit: number, offset: number): Promise<ContactListResult> {
    logger.info('Fetching contacts for company', { companyId });

    try {
      // Fetch relationships for the company
      const response = await this.client.getList<{
        id: number;
        person: { id: number; firstName: string; lastName: string };
        type: string;
      }>(`/company/${companyId}/relationship/`, { limit: 100 });

      // Extract unique person IDs from relationships
      const personIds = new Set<number>();
      for (const rel of response.data) {
        if (rel.person?.id) {
          personIds.add(rel.person.id);
        }
      }

      if (personIds.size === 0) {
        return {
          contacts: [],
          totalCount: 0,
          limit,
          offset,
        };
      }

      // Fetch full person details for each ID (up to limit)
      const idsToFetch = Array.from(personIds).slice(offset, offset + limit);
      const contacts: RaynetPerson[] = [];

      for (const personId of idsToFetch) {
        try {
          const personResponse = await this.client.getOne<RaynetPerson>(`${this.endpoint}/${personId}/`);
          contacts.push(personResponse.data);
        } catch (error) {
          logger.warn('Failed to fetch person details', { personId, error });
        }
      }

      return {
        contacts,
        totalCount: personIds.size,
        limit,
        offset,
      };
    } catch (error) {
      logger.warn('Failed to fetch company relationships', { companyId, error });
      // Fallback to empty result
      return {
        contacts: [],
        totalCount: 0,
        limit,
        offset,
      };
    }
  }

  /**
   * Search contacts by name
   */
  async search(input: SearchContactsInput): Promise<ContactListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: ContactQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching contacts', { query, limit, offset });

    const response = await this.client.getList<RaynetPerson>(
      `${this.endpoint}/`,
      params
    );

    return {
      contacts: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }


  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single contact by ID
   */
  async get(input: GetContactInput): Promise<ContactResult> {
    const { contactId } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    logger.info('Getting contact', { contactId });

    try {
      const response = await this.client.getOne<RaynetPerson>(
        `${this.endpoint}/${contactId}/`
      );

      return { contact: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('kontaktu', contactId);
      }
      throw error;
    }
  }

  /**
   * Create a new contact
   */
  async create(input: CreateContactInput): Promise<ContactResult> {
    // Validate required fields
    if (!input.firstName || input.firstName.trim().length === 0) {
      throw new ValidationError(['Imię kontaktu jest wymagane']);
    }
    if (!input.lastName || input.lastName.trim().length === 0) {
      throw new ValidationError(['Nazwisko kontaktu jest wymagane']);
    }

    const payload: ContactPayload = {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
    };

    // Optional fields
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.titleBefore) payload.titleBefore = input.titleBefore;
    if (input.titleAfter) payload.titleAfter = input.titleAfter;
    if (input.birthday) payload.birthday = input.birthday;
    if (input.notice) payload.notice = input.notice;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    // Contact info
    if (input.email || input.phone) {
      payload.contactInfo = {};
      if (input.email) payload.contactInfo.email = input.email;
      if (input.phone) payload.contactInfo.tel1 = input.phone;
    }

    // Company relationship with optional position/role
    if (input.companyId) {
      payload.relationship = {
        company: input.companyId,
        primary: true,
      };
      if (input.position) {
        payload.relationship.type = input.position;
      }
    }

    logger.info('Creating contact', {
      firstName: input.firstName,
      lastName: input.lastName,
      companyId: input.companyId
    });

    // Raynet API uses PUT for creating new records
    const response = await this.client.put<RaynetPerson>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Contact created', {
      contactId: response.data.id,
      name: `${response.data.firstName} ${response.data.lastName}`
    });

    return { contact: response.data };
  }

  /**
   * Update an existing contact
   */
  async update(input: UpdateContactInput): Promise<ContactResult> {
    const { contactId, ...updates } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current contact to get the _version for optimistic locking
    const currentContact = await this.client.getOne<RaynetPerson>(`${this.endpoint}/${contactId}/`);
    const version = currentContact.data._version;

    // Build payload with only provided fields
    const payload: Partial<ContactPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.firstName !== undefined) payload.firstName = updates.firstName.trim();
    if (updates.lastName !== undefined) payload.lastName = updates.lastName.trim();
    if (updates.titleBefore !== undefined) payload.titleBefore = updates.titleBefore;
    if (updates.titleAfter !== undefined) payload.titleAfter = updates.titleAfter;
    if (updates.notice !== undefined) payload.notice = updates.notice;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    // Contact info updates
    if (updates.email !== undefined || updates.phone !== undefined) {
      payload.contactInfo = {};
      if (updates.email !== undefined) payload.contactInfo.email = updates.email;
      if (updates.phone !== undefined) payload.contactInfo.tel1 = updates.phone;
    }

    logger.info('Updating contact', { contactId, version, updates: Object.keys(payload) });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetPerson>(
        `${this.endpoint}/${contactId}/`,
        payload
      );

      // Fetch the updated contact to return current data
      const updatedContact = await this.client.getOne<RaynetPerson>(
        `${this.endpoint}/${contactId}/`
      );

      logger.info('Contact updated', {
        contactId,
        name: `${updatedContact.data.firstName} ${updatedContact.data.lastName}`
      });

      return { contact: updatedContact.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('kontaktu', contactId);
      }
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async delete(contactId: number): Promise<void> {
    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    logger.info('Deleting contact', { contactId });

    try {
      await this.client.delete(`${this.endpoint}/${contactId}/`);
      logger.info('Contact deleted', { contactId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('kontaktu', contactId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Relationship Operations
  // ==========================================================================

  /**
   * Link contact to a company
   */
  async linkToCompany(input: LinkContactToCompanyInput): Promise<ContactResult> {
    const { contactId, companyId, relationshipType, primary } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }
    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    logger.info('Linking contact to company', { contactId, companyId, relationshipType });

    // Create relationship via the relationship endpoint
    const relationshipPayload = {
      company: companyId,
      type: relationshipType ?? 'Pracownik',
      primary: primary ?? false,
    };

    try {
      await this.client.post(
        `${this.endpoint}/${contactId}/relationship/`,
        relationshipPayload
      );

      // Fetch updated contact
      const result = await this.get({ contactId });

      logger.info('Contact linked to company', { contactId, companyId });

      return result;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('kontaktu', contactId);
      }
      throw error;
    }
  }

  /**
   * List all relationships for a contact
   */
  async listRelationships(input: ListContactRelationshipsInput): Promise<RelationshipListResult> {
    const { contactId } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    logger.info('Listing contact relationships', { contactId });

    // Get the contact with full details including relationships
    const response = await this.client.getOne<RaynetPerson>(
      `${this.endpoint}/${contactId}/`
    );

    const relationships = response.data.relationships ?? [];

    return {
      relationships,
      totalCount: relationships.length,
    };
  }

  /**
   * Add a new relationship to a contact
   */
  async addRelationship(input: AddContactRelationshipInput): Promise<RelationshipResult> {
    const { contactId, companyId, relationshipType, primary } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }
    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }

    const payload = {
      company: companyId,
      type: relationshipType ?? 'Pracownik',
      primary: primary ?? false,
    };

    logger.info('Adding contact relationship', { contactId, companyId });

    const response = await this.client.put<RaynetPersonRelationship>(
      `${this.endpoint}/${contactId}/relationship/`,
      payload
    );

    logger.info('Contact relationship added', { contactId, relationshipId: response.data.id });

    return { relationship: response.data };
  }

  /**
   * Update an existing contact relationship
   */
  async updateRelationship(input: UpdateContactRelationshipInput): Promise<RelationshipResult> {
    const { contactId, relationshipId, relationshipType } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    if (!relationshipId || relationshipId <= 0) {
      throw new ValidationError(['ID relacji musi być liczbą dodatnią']);
    }

    if (!relationshipType) {
      throw new ValidationError(['Typ relacji jest wymagany']);
    }

    const payload = {
      type: relationshipType,
    };

    logger.info('Updating contact relationship', { contactId, relationshipId });

    await this.client.post<RaynetPersonRelationship>(
      `${this.endpoint}/${contactId}/relationship/${relationshipId}/`,
      payload
    );

    // Fetch updated relationships
    const relResult = await this.listRelationships({ contactId });
    const updatedRelationship = relResult.relationships.find(r => r.id === relationshipId);

    if (!updatedRelationship) {
      throw new NotFoundError('relacji', relationshipId);
    }

    logger.info('Contact relationship updated', { contactId, relationshipId });

    return { relationship: updatedRelationship };
  }

  /**
   * Delete a contact relationship
   */
  async deleteRelationship(input: DeleteContactRelationshipInput): Promise<void> {
    const { contactId, relationshipId } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    if (!relationshipId || relationshipId <= 0) {
      throw new ValidationError(['ID relacji musi być liczbą dodatnią']);
    }

    logger.info('Deleting contact relationship', { contactId, relationshipId });

    try {
      await this.client.delete(`${this.endpoint}/${contactId}/relationship/${relationshipId}/`);
      logger.info('Contact relationship deleted', { contactId, relationshipId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('relacji', relationshipId);
      }
      throw error;
    }
  }

  /**
   * Set a relationship as primary
   */
  async setPrimaryRelationship(input: SetPrimaryContactRelationshipInput): Promise<RelationshipResult> {
    const { contactId, relationshipId } = input;

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    if (!relationshipId || relationshipId <= 0) {
      throw new ValidationError(['ID relacji musi być liczbą dodatnią']);
    }

    logger.info('Setting primary contact relationship', { contactId, relationshipId });

    await this.client.post<void>(
      `${this.endpoint}/${contactId}/relationship/${relationshipId}/`,
      { primary: true }
    );

    // Fetch updated relationships
    const relResult = await this.listRelationships({ contactId });
    const updatedRelationship = relResult.relationships.find(r => r.id === relationshipId);

    if (!updatedRelationship) {
      throw new NotFoundError('relacji', relationshipId);
    }

    logger.info('Primary contact relationship set', { contactId, relationshipId });

    return { relationship: updatedRelationship };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a contact exists
   */
  async exists(contactId: number): Promise<boolean> {
    try {
      await this.get({ contactId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Find contact by email
   */
  async findByEmail(email: string): Promise<ContactResult | null> {
    if (!email || email.trim().length === 0) {
      throw new ValidationError(['Email nie może być pusty']);
    }

    const response = await this.client.getList<RaynetPerson>(
      `${this.endpoint}/`,
      { 'contactInfo.email[EQ]': email.trim(), limit: 1 }
    );

    const contact = response.data[0];
    if (!contact) {
      return null;
    }

    return { contact };
  }

  /**
   * Get key contacts (keyman = true)
   */
  async getKeyContacts(limit = 20, offset = 0): Promise<ContactListResult> {
    const response = await this.client.getList<RaynetPerson>(
      `${this.endpoint}/`,
      { keyman: true, limit, offset }
    );

    return {
      contacts: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ContactsService | null = null;

/**
 * Get or create the Contacts service singleton
 */
export function getContactsService(): ContactsService {
  if (!serviceInstance) {
    serviceInstance = new ContactsService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetContactsService(): void {
  serviceInstance = null;
}
