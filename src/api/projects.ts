/**
 * Projects API Service
 *
 * CRUD operations for Raynet Projects (Projekty)
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import type {
  RaynetProject,
  RaynetProjectParticipant,
  ListProjectsInput,
  SearchProjectsInput,
  GetProjectInput,
  CreateProjectInput,
  UpdateProjectInput,
  AddProjectParticipantInput,
  RemoveProjectParticipantInput,
  ProjectStatus,
} from '../types';

// ============================================================================
// Types
// ============================================================================

/** Query parameters for listing projects */
type ProjectQueryParams = Record<string, unknown>;

/** Payload for creating/updating projects */
interface ProjectPayload {
  name: string;
  company: number;
  businessCase?: number;
  owner?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  status?: ProjectStatus;
  tags?: string[];
  _version?: number;
}

/** Payload for project participants */
interface ParticipantPayload {
  person?: number;
  company?: number;
  category?: number;
  note?: string;
}

/** Result of project operations */
export interface ProjectResult {
  project: RaynetProject;
}

/** Result of project list operations */
export interface ProjectListResult {
  projects: RaynetProject[];
  totalCount: number;
  limit: number;
  offset: number;
}

/** Result of participant operations */
export interface ParticipantResult {
  participant: RaynetProjectParticipant;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize date to YYYY-MM-DD format for Raynet API
 */
function normalizeDate(isoDate: string): string {
  return isoDate.replace('T', ' ').slice(0, 10);
}

// ============================================================================
// Projects Service
// ============================================================================

export class ProjectsService {
  private client: RaynetClient;
  private readonly endpoint = '/project';

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  // ==========================================================================
  // List Operations
  // ==========================================================================

  /**
   * List projects with optional filters
   */
  async list(input: ListProjectsInput = {}): Promise<ProjectListResult> {
    const { limit = 20, offset = 0, status, companyId, ownerId } = input;

    const params: ProjectQueryParams = {
      limit,
      offset,
    };

    if (status) params['status[EQ]'] = status;
    if (companyId) params['company[EQ]'] = companyId;
    if (ownerId) params['owner[EQ]'] = ownerId;

    logger.info('Listing projects', { params });

    const response = await this.client.getList<RaynetProject>(
      `${this.endpoint}/`,
      params
    );

    return {
      projects: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  /**
   * Search projects by name
   */
  async search(input: SearchProjectsInput): Promise<ProjectListResult> {
    const { query, limit = 20, offset = 0 } = input;

    if (!query || query.trim().length === 0) {
      throw new ValidationError(['Zapytanie wyszukiwania nie może być puste']);
    }

    const params: ProjectQueryParams = {
      limit,
      offset,
      fulltext: query,
    };

    logger.info('Searching projects', { query, limit, offset });

    const response = await this.client.getList<RaynetProject>(
      `${this.endpoint}/`,
      params
    );

    return {
      projects: response.data,
      totalCount: response.totalCount,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Single Entity Operations
  // ==========================================================================

  /**
   * Get a single project by ID
   */
  async get(input: GetProjectInput): Promise<ProjectResult> {
    const { projectId } = input;

    if (!projectId || projectId <= 0) {
      throw new ValidationError(['ID projektu musi być liczbą dodatnią']);
    }

    logger.info('Getting project', { projectId });

    try {
      const response = await this.client.getOne<RaynetProject>(
        `${this.endpoint}/${projectId}/`
      );

      return { project: response.data };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('projektu', projectId);
      }
      throw error;
    }
  }

  /**
   * Create a new project
   */
  async create(input: CreateProjectInput): Promise<ProjectResult> {
    if (!input.name || input.name.trim().length === 0) {
      throw new ValidationError(['Nazwa projektu jest wymagana']);
    }
    if (!input.companyId || input.companyId <= 0) {
      throw new ValidationError(['ID firmy jest wymagane']);
    }

    const payload: ProjectPayload = {
      name: input.name.trim(),
      company: input.companyId,
      status: 'B_ACTIVE',
    };

    if (input.dealId) payload.businessCase = input.dealId;
    if (input.ownerId) payload.owner = input.ownerId;
    if (input.startDate) payload.startDate = normalizeDate(input.startDate);
    if (input.endDate) payload.endDate = normalizeDate(input.endDate);
    if (input.description) payload.description = input.description;
    if (input.tags && input.tags.length > 0) payload.tags = input.tags;

    logger.info('Creating project', { name: input.name, companyId: input.companyId });

    const response = await this.client.put<RaynetProject>(
      `${this.endpoint}/`,
      payload
    );

    logger.info('Project created', { projectId: response.data.id, name: response.data.name });

    return { project: response.data };
  }

  /**
   * Update an existing project
   */
  async update(input: UpdateProjectInput): Promise<ProjectResult> {
    const { projectId, ...updates } = input;

    if (!projectId || projectId <= 0) {
      throw new ValidationError(['ID projektu musi być liczbą dodatnią']);
    }

    const hasUpdates = Object.values(updates).some((v) => v !== undefined);
    if (!hasUpdates) {
      throw new ValidationError(['Nie podano żadnych zmian do zapisania']);
    }

    const currentProject = await this.client.getOne<RaynetProject>(`${this.endpoint}/${projectId}/`);
    const version = currentProject.data._version;

    const payload: Partial<ProjectPayload> & { _version: number } = {
      _version: version,
    };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.startDate !== undefined) payload.startDate = normalizeDate(updates.startDate);
    if (updates.endDate !== undefined) payload.endDate = normalizeDate(updates.endDate);
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.tags !== undefined) payload.tags = updates.tags;

    logger.info('Updating project', { projectId, version, updates: Object.keys(payload) });

    try {
      await this.client.post<RaynetProject>(
        `${this.endpoint}/${projectId}/`,
        payload
      );

      const updatedProject = await this.client.getOne<RaynetProject>(
        `${this.endpoint}/${projectId}/`
      );

      logger.info('Project updated', { projectId, name: updatedProject.data.name });

      return { project: updatedProject.data };
    } catch (error) {
      logger.error('Project update failed', { projectId, payload, error });
      if (error instanceof NotFoundError) {
        throw new NotFoundError('projektu', projectId);
      }
      throw error;
    }
  }

  /**
   * Delete a project
   */
  async delete(projectId: number): Promise<void> {
    if (!projectId || projectId <= 0) {
      throw new ValidationError(['ID projektu musi być liczbą dodatnią']);
    }

    logger.info('Deleting project', { projectId });

    try {
      await this.client.delete(`${this.endpoint}/${projectId}/`);
      logger.info('Project deleted', { projectId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('projektu', projectId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Participant Operations
  // ==========================================================================

  /**
   * Add a participant to a project
   */
  async addParticipant(input: AddProjectParticipantInput): Promise<ParticipantResult> {
    const { projectId, contactId, note } = input;

    if (!projectId || projectId <= 0) {
      throw new ValidationError(['ID projektu musi być liczbą dodatnią']);
    }

    if (!contactId || contactId <= 0) {
      throw new ValidationError(['ID kontaktu musi być liczbą dodatnią']);
    }

    const payload: ParticipantPayload = {
      person: contactId,
    };

    if (note) payload.note = note;

    logger.info('Adding project participant', { projectId, contactId });

    const response = await this.client.put<RaynetProjectParticipant>(
      `${this.endpoint}/${projectId}/participants/`,
      payload
    );

    logger.info('Project participant added', { projectId, participantId: response.data.id });

    return { participant: response.data };
  }

  /**
   * Remove a participant from a project
   */
  async removeParticipant(input: RemoveProjectParticipantInput): Promise<void> {
    const { projectId, participantId } = input;

    if (!projectId || projectId <= 0) {
      throw new ValidationError(['ID projektu musi być liczbą dodatnią']);
    }

    if (!participantId || participantId <= 0) {
      throw new ValidationError(['ID uczestnika musi być liczbą dodatnią']);
    }

    logger.info('Removing project participant', { projectId, participantId });

    try {
      await this.client.delete(`${this.endpoint}/${projectId}/participants/${participantId}/`);
      logger.info('Project participant removed', { projectId, participantId });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new NotFoundError('uczestnika projektu', participantId);
      }
      throw error;
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  async exists(projectId: number): Promise<boolean> {
    try {
      await this.get({ projectId });
      return true;
    } catch (error) {
      if (error instanceof NotFoundError) {
        return false;
      }
      throw error;
    }
  }

  async getActive(limit = 20, offset = 0): Promise<ProjectListResult> {
    return this.list({ status: 'B_ACTIVE', limit, offset });
  }

  async getByCompany(companyId: number, limit = 20): Promise<ProjectListResult> {
    return this.list({ companyId, limit });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: ProjectsService | null = null;

export function getProjectsService(): ProjectsService {
  serviceInstance ??= new ProjectsService();
  return serviceInstance;
}

export function resetProjectsService(): void {
  serviceInstance = null;
}
