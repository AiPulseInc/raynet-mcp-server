/**
 * Activities API Service
 *
 * CRUD operations for Raynet Activities (Tasks, PhoneCalls, Meetings, Emails)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetActivity,
  ActivityType,
  ActivityStatus,
  ListActivitiesInput,
  SearchActivitiesInput,
  GetActivityInput,
  CreateActivityInput,
  UpdateActivityInput,
  CompleteActivityInput,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing activities */
type ActivityQueryParams = Record<string, unknown>;

/** Payload for creating/updating activities */
interface ActivityPayload {
  title: string;
  scheduledFrom: string;
  scheduledTill: string;
  deadline?: string;
  owner?: number;
  company?: number;
  person?: number;
  businessCase?: number;
  description?: string;
  // Note: priority field is not supported by Raynet API for activities
  status?: ActivityStatus;
  solution?: string;
}

/** Result of activity operations */
export interface ActivityResult {
  activity: RaynetActivity;
}

/** Result of activity list operations */
export interface ActivityListResult {
  activities: RaynetActivity[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Endpoint mapping for activity types */
const ACTIVITY_ENDPOINTS: Record<ActivityType, string> = {
  Task: '/task',
  PhoneCall: '/phonecall',
  Meeting: '/meeting',
  Email: '/email',
};

/** Polish names for activity types */
const ACTIVITY_NAMES_PL: Record<ActivityType, string> = {
  Task: 'zadania',
  PhoneCall: 'rozmowy telefonicznej',
  Meeting: 'spotkania',
  Email: 'e-maila',
};

/**
 * Normalize date string to Raynet API format: "YYYY-MM-DD HH:mm"
 * Accepts ISO format, "YYYY-MM-DD HH:mm", "YYYY-MM-DD HH:mm:ss", etc.
 */
function normalizeDateTime(dateStr: string): string {
  // If already in correct format "YYYY-MM-DD HH:mm", return as-is
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Parse the date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    // If invalid, return as-is and let API validate
    return dateStr;
  }

  // Format as "YYYY-MM-DD HH:mm"
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ============================================================================
// Activities Service
// ============================================================================

export class ActivitiesService {
  private client: RaynetClient;
  private cachedOwnerId: number | null = null;

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  /**
   * Get endpoint for activity type
   */
  private getEndpoint(type: ActivityType): string {
    return ACTIVITY_ENDPOINTS[type];
  }

  /**
   * Get the owner ID for creating activities.
   * Uses the owner ID from the first company found (as the authenticated user).
   * Caches the result for subsequent calls.
   */
  private async getOwnerId(): Promise<number> {
    if (this.cachedOwnerId !== null) {
      return this.cachedOwnerId;
    }

    try {
      // Get owner ID from an existing company (the authenticated user should be the owner)
      const response = await this.client.getList<{ owner?: { id: number } }>('/company/', { limit: 1 });
      const firstCompany = response.data[0];
      if (firstCompany?.owner?.id) {
        this.cachedOwnerId = firstCompany.owner.id;
        return this.cachedOwnerId;
      }
    } catch (error) {
      logger.warn('Failed to get owner ID from companies', { error });
    }

    // Fallback: try to get from an existing activity
    try {
      const response = await this.client.getList<{ owner?: { id: number } }>('/task/', { limit: 1 });
      const firstTask = response.data[0];
      if (firstTask?.owner?.id) {
        this.cachedOwnerId = firstTask.owner.id;
        return this.cachedOwnerId;
      }
    } catch (error) {
      logger.warn('Failed to get owner ID from tasks', { error });
    }

    // Last resort: use a default value (should be configurable in production)
    this.cachedOwnerId = 1;
    return this.cachedOwnerId;
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List activities with optional filters
   */
  async list(input: ListActivitiesInput = {}): Promise<ActivityListResult> {
    const { limit = 20, offset = 0, companyId, contactId, dealId, status } = input;

    // Fetch from all activity types and merge
    const allActivities: RaynetActivity[] = [];
    let totalCount = 0;

    const types: ActivityType[] = ['Task', 'PhoneCall', 'Meeting', 'Email'];

    for (const type of types) {
      const params: ActivityQueryParams = {
        limit: 100, // Fetch more to filter later
        offset: 0,
      };

      if (status) params.status = status;
      if (companyId) params['company[EQ]'] = companyId;
      if (contactId) params['person[EQ]'] = contactId;
      if (dealId) params['businessCase[EQ]'] = dealId;

      try {
        const response = await this.client.getList<RaynetActivity>(
          `${this.getEndpoint(type)}/`,
          params
        );
        allActivities.push(...response.data);
        totalCount += response.totalCount;
      } catch (error) {
        logger.warn(`Failed to fetch ${type} activities`, { error });
      }
    }

    // Sort by scheduled date (newest first)
    allActivities.sort((a, b) => {
      const dateA = new Date(a.scheduledFrom).getTime();
      const dateB = new Date(b.scheduledFrom).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    logger.info('Listed activities', {
      totalCount,
      returned: paginatedActivities.length,
      offset,
      limit,
    });

    return {
      activities: paginatedActivities,
      totalCount,
      limit,
      offset,
    };
  }

  /**
   * List activities by type
   */
  async listByType(
    type: ActivityType,
    input: Omit<ListActivitiesInput, 'type'> = {}
  ): Promise<ActivityListResult> {
    const { limit = 20, offset = 0, companyId, contactId, dealId, status } = input;

    const params: ActivityQueryParams = {
      limit,
      offset,
    };

    if (status) params.status = status;
    if (companyId) params['company[EQ]'] = companyId;
    if (contactId) params['person[EQ]'] = contactId;
    if (dealId) params['businessCase[EQ]'] = dealId;

    logger.info('Listing activities by type', { type, params });

    const response = await this.client.getList<RaynetActivity>(
      `${this.getEndpoint(type)}/`,
      params
    );

    return {
      activities: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search activities by title
   */
  async search(input: SearchActivitiesInput): Promise<ActivityListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    // Search across all activity types
    const allActivities: RaynetActivity[] = [];
    let totalCount = 0;

    const types: ActivityType[] = ['Task', 'PhoneCall', 'Meeting', 'Email'];

    for (const type of types) {
      try {
        const response = await this.client.getList<RaynetActivity>(
          `${this.getEndpoint(type)}/`,
          { fulltext: query, limit: 50 }
        );
        allActivities.push(...response.data);
        totalCount += response.totalCount;
      } catch (error) {
        logger.warn(`Failed to search ${type} activities`, { error });
      }
    }

    // Sort by scheduled date
    allActivities.sort((a, b) => {
      const dateA = new Date(a.scheduledFrom).getTime();
      const dateB = new Date(b.scheduledFrom).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedActivities = allActivities.slice(offset, offset + limit);

    logger.info('Searched activities', { query, totalCount, returned: paginatedActivities.length });

    return {
      activities: paginatedActivities,
      totalCount,
      limit,
      offset,
    };
  }

  /**
   * Get scheduled activities (upcoming)
   */
  async getScheduled(limit = 20, offset = 0): Promise<ActivityListResult> {
    return this.list({ status: 'SCHEDULED', limit, offset });
  }

  /**
   * Get completed activities
   */
  async getCompleted(limit = 20, offset = 0): Promise<ActivityListResult> {
    return this.list({ status: 'COMPLETED', limit, offset });
  }

  /**
   * Get activities for a company
   */
  async getByCompany(companyId: number, limit = 20): Promise<ActivityListResult> {
    if (!companyId || companyId <= 0) {
      throw new ValidationError(['ID firmy musi być liczbą dodatnią']);
    }
    return this.list({ companyId, limit });
  }

  /**
   * Get activities for a deal
   */
  async getByDeal(dealId: number, limit = 20): Promise<ActivityListResult> {
    if (!dealId || dealId <= 0) {
      throw new ValidationError(['ID szansy musi być liczbą dodatnią']);
    }
    return this.list({ dealId, limit });
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single activity by ID and type
   */
  async get(input: GetActivityInput): Promise<ActivityResult> {
    const { activityId, activityType } = input;

    if (!activityId || activityId <= 0) {
      throw new ValidationError(['ID aktywności musi być liczbą dodatnią']);
    }

    logger.info('Getting activity', { activityId, activityType });

    try {
      const response = await this.client.getOne<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`
      );

      // Add _entityName since it's not returned by single-get endpoint
      // but is needed for formatting
      const activity = {
        ...response.data,
        _entityName: activityType,
      };

      return { activity };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ACTIVITY_NAMES_PL[activityType], activityId);
      }
      throw error;
    }
  }

  /**
   * Create a new activity
   */
  async create(input: CreateActivityInput): Promise<ActivityResult> {
    const { type, title, companyId, contactId, dealId, scheduledFrom, scheduledTill, description } = input;

    // Validate required fields
    if (!title || title.trim().length === 0) {
      throw new ValidationError(['Tytuł aktywności jest wymagany']);
    }
    if (!scheduledFrom) {
      throw new ValidationError(['Data rozpoczęcia jest wymagana']);
    }
    if (!scheduledTill) {
      throw new ValidationError(['Data zakończenia jest wymagana']);
    }

    // Get owner ID (required by Raynet API)
    const ownerId = await this.getOwnerId();
    const normalizedTill = normalizeDateTime(scheduledTill);

    const payload: ActivityPayload = {
      title: title.trim(),
      scheduledFrom: normalizeDateTime(scheduledFrom),
      scheduledTill: normalizedTill,
      deadline: normalizedTill,  // Raynet API requires deadline
      owner: ownerId,  // Raynet API requires owner
    };

    // Optional fields
    // Note: priority field is not supported by Raynet API for activities
    if (companyId) payload.company = companyId;
    if (contactId) payload.person = contactId;
    if (dealId) payload.businessCase = dealId;
    if (description) payload.description = description;

    logger.info('Creating activity', {
      type,
      title,
      companyId,
      dealId,
      payload: JSON.stringify(payload),
    });

    // Raynet API uses PUT for creating new records
    try {
      const createResponse = await this.client.put<{ id: number }>(
        `${this.getEndpoint(type)}/`,
        payload
      );

      const activityId = createResponse.data.id;

      logger.info('Activity created', { activityId, type, title });

      // Raynet API only returns ID on create, so fetch the full activity
      const fullActivity = await this.client.getOne<RaynetActivity>(
        `${this.getEndpoint(type)}/${activityId}/`
      );

      // Add _entityName since it's not returned by API but needed for formatting
      const activity = {
        ...fullActivity.data,
        _entityName: type,
      };

      return { activity };
    } catch (error) {
      logger.error('Activity creation failed', {
        type,
        payload: JSON.stringify(payload),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Update an existing activity
   */
  async update(input: UpdateActivityInput): Promise<ActivityResult> {
    const { activityId, activityType, ...updates } = input;

    if (!activityId || activityId <= 0) {
      throw new ValidationError(['ID aktywności musi być liczbą dodatnią']);
    }

    // Check if there are any updates
    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    // First, fetch the current activity to get the _version for optimistic locking
    const currentActivity = await this.client.getOne<RaynetActivity>(`${this.getEndpoint(activityType)}/${activityId}/`);
    const version = currentActivity.data._version;

    // Build payload with only provided fields
    const payload: Partial<ActivityPayload> & { _version: number } = {
      _version: version,
    };

    // Note: priority field is not supported by Raynet API for activities
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.scheduledFrom !== undefined) payload.scheduledFrom = normalizeDateTime(updates.scheduledFrom);
    if (updates.scheduledTill !== undefined) payload.scheduledTill = normalizeDateTime(updates.scheduledTill);
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.status !== undefined) payload.status = updates.status;

    logger.info('Updating activity', { activityId, activityType, version, updates: Object.keys(payload) });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`,
        payload
      );

      // Fetch the updated activity to return current data
      const updatedActivity = await this.client.getOne<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`
      );

      logger.info('Activity updated', { activityId, title: updatedActivity.data.title });

      // Add _entityName since it's not returned by API but needed for formatting
      const activity = {
        ...updatedActivity.data,
        _entityName: activityType,
      };

      return { activity };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ACTIVITY_NAMES_PL[activityType], activityId);
      }
      throw error;
    }
  }

  /**
   * Complete an activity
   */
  async complete(input: CompleteActivityInput): Promise<ActivityResult> {
    const { activityId, activityType, solution } = input;

    if (!activityId || activityId <= 0) {
      throw new ValidationError(['ID aktywności musi być liczbą dodatnią']);
    }

    // First, fetch the current activity to get the _version for optimistic locking
    const currentActivity = await this.client.getOne<RaynetActivity>(`${this.getEndpoint(activityType)}/${activityId}/`);
    const version = currentActivity.data._version;

    logger.info('Completing activity', { activityId, activityType, version });

    const payload: Partial<ActivityPayload> & { _version: number } = {
      _version: version,
      status: 'COMPLETED',
    };

    if (solution) {
      payload.solution = solution;
    }

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`,
        payload
      );

      // Fetch the updated activity to return current data
      const updatedActivity = await this.client.getOne<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`
      );

      logger.info('Activity completed', { activityId, title: updatedActivity.data.title });

      // Add _entityName since it's not returned by API but needed for formatting
      const activity = {
        ...updatedActivity.data,
        _entityName: activityType,
      };

      return { activity };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ACTIVITY_NAMES_PL[activityType], activityId);
      }
      throw error;
    }
  }

  /**
   * Cancel an activity
   */
  async cancel(activityId: number, activityType: ActivityType): Promise<ActivityResult> {
    if (!activityId || activityId <= 0) {
      throw new ValidationError(['ID aktywności musi być liczbą dodatnią']);
    }

    // First, fetch the current activity to get the _version for optimistic locking
    const currentActivity = await this.client.getOne<RaynetActivity>(`${this.getEndpoint(activityType)}/${activityId}/`);
    const version = currentActivity.data._version;

    logger.info('Cancelling activity', { activityId, activityType, version });

    try {
      // POST returns minimal response, so we just check for success
      await this.client.post<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`,
        { _version: version, status: 'CANCELLED' }
      );

      // Fetch the updated activity to return current data
      const updatedActivity = await this.client.getOne<RaynetActivity>(
        `${this.getEndpoint(activityType)}/${activityId}/`
      );

      logger.info('Activity cancelled', { activityId });

      // Add _entityName since it's not returned by API but needed for formatting
      const activity = {
        ...updatedActivity.data,
        _entityName: activityType,
      };

      return { activity };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ACTIVITY_NAMES_PL[activityType], activityId);
      }
      throw error;
    }
  }

  /**
   * Delete an activity
   */
  async delete(activityId: number, activityType: ActivityType): Promise<void> {
    if (!activityId || activityId <= 0) {
      throw new ValidationError(['ID aktywności musi być liczbą dodatnią']);
    }

    logger.info('Deleting activity', { activityId, activityType });

    try {
      await this.client.delete(`${this.getEndpoint(activityType)}/${activityId}/`);
      logger.info('Activity deleted', { activityId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError(ACTIVITY_NAMES_PL[activityType], activityId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if an activity exists
   */
  async exists(activityId: number, activityType: ActivityType): Promise<boolean> {
    try {
      await this.get({ activityId, activityType });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get today's activities
   */
  async getToday(limit = 50): Promise<ActivityListResult> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const allActivities: RaynetActivity[] = [];
    let totalCount = 0;

    const types: ActivityType[] = ['Task', 'PhoneCall', 'Meeting', 'Email'];

    for (const type of types) {
      try {
        const response = await this.client.getList<RaynetActivity>(
          `${this.getEndpoint(type)}/`,
          {
            'scheduledFrom[GE]': startOfDay.toISOString().split('T')[0],
            'scheduledFrom[LT]': endOfDay.toISOString().split('T')[0],
            limit: 100,
          }
        );
        allActivities.push(...response.data);
        totalCount += response.totalCount;
      } catch (error) {
        logger.warn(`Failed to fetch today's ${type} activities`, { error });
      }
    }

    // Sort by time
    allActivities.sort((a, b) => {
      const dateA = new Date(a.scheduledFrom).getTime();
      const dateB = new Date(b.scheduledFrom).getTime();
      return dateA - dateB;
    });

    return {
      activities: allActivities.slice(0, limit),
      totalCount,
      limit,
      offset: 0,
    };
  }

  /**
   * Get overdue activities
   */
  async getOverdue(limit = 50): Promise<ActivityListResult> {
    const now = new Date();

    const allActivities: RaynetActivity[] = [];
    let totalCount = 0;

    const types: ActivityType[] = ['Task', 'PhoneCall', 'Meeting', 'Email'];

    for (const type of types) {
      try {
        const response = await this.client.getList<RaynetActivity>(
          `${this.getEndpoint(type)}/`,
          {
            status: 'SCHEDULED',
            'scheduledTill[LT]': now.toISOString().split('T')[0],
            limit: 100,
          }
        );
        allActivities.push(...response.data);
        totalCount += response.totalCount;
      } catch (error) {
        logger.warn(`Failed to fetch overdue ${type} activities`, { error });
      }
    }

    // Sort by date (oldest first - most overdue)
    allActivities.sort((a, b) => {
      const dateA = new Date(a.scheduledTill).getTime();
      const dateB = new Date(b.scheduledTill).getTime();
      return dateA - dateB;
    });

    return {
      activities: allActivities.slice(0, limit),
      totalCount,
      limit,
      offset: 0,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ActivitiesService | null = null;

/**
 * Get or create the Activities service singleton
 */
export function getActivitiesService(): ActivitiesService {
  if (!serviceInstance) {
    serviceInstance = new ActivitiesService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetActivitiesService(): void {
  serviceInstance = null;
}
