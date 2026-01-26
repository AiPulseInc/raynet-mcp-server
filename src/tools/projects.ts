/**
 * MCP Tools for Projects (Projekty)
 *
 * Tools for managing Raynet CRM projects via MCP protocol
 */

import { z } from 'zod';
import { getProjectsService } from '../api/projects';
import { logger } from '../utils/logger';
import { getPolishErrorMessage } from '../utils/errors';
import type { RaynetProject, RaynetProjectParticipant } from '../types';

// ============================================================================
// Utility Functions
// ============================================================================

function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

export const ListProjectsSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(['A_DRAFT', 'B_ACTIVE', 'C_FINISHED', 'D_CANCELLED']).optional(),
  companyId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
});

export const SearchProjectsSchema = z.object({
  query: z.string().min(1, 'Zapytanie wyszukiwania jest wymagane'),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const GetProjectSchema = z.object({
  projectId: z.number().int().positive('ID projektu musi być liczbą dodatnią'),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Nazwa projektu jest wymagana'),
  companyId: z.number().int().positive('ID firmy jest wymagane'),
  dealId: z.number().int().positive().optional(),
  ownerId: z.number().int().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateProjectSchema = z.object({
  projectId: z.number().int().positive('ID projektu musi być liczbą dodatnią'),
  name: z.string().min(1).optional(),
  status: z.enum(['A_DRAFT', 'B_ACTIVE', 'C_FINISHED', 'D_CANCELLED']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const DeleteProjectSchema = z.object({
  projectId: z.number().int().positive('ID projektu musi być liczbą dodatnią'),
});

export const AddProjectParticipantSchema = z.object({
  projectId: z.number().int().positive('ID projektu musi być liczbą dodatnią'),
  contactId: z.number().int().positive('ID kontaktu musi być liczbą dodatnią'),
  note: z.string().optional(),
});

export const RemoveProjectParticipantSchema = z.object({
  projectId: z.number().int().positive('ID projektu musi być liczbą dodatnią'),
  participantId: z.number().int().positive('ID uczestnika musi być liczbą dodatnią'),
});

// ============================================================================
// Tool Definitions
// ============================================================================

export const projectToolDefinitions = [
  {
    name: 'raynet_list_projects',
    description: 'Pobiera listę projektów z Raynet CRM.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Maksymalna liczba wyników (1-100)', default: 20 },
        offset: { type: 'number', description: 'Pomiń pierwsze N wyników', default: 0 },
        status: { type: 'string', enum: ['A_DRAFT', 'B_ACTIVE', 'C_FINISHED', 'D_CANCELLED'], description: 'Filtruj po statusie' },
        companyId: { type: 'number', description: 'Filtruj po ID firmy' },
        ownerId: { type: 'number', description: 'Filtruj po ID właściciela' },
      },
    },
  },
  {
    name: 'raynet_search_projects',
    description: 'Wyszukuje projekty po nazwie.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Tekst do wyszukania' },
        limit: { type: 'number', description: 'Maksymalna liczba wyników', default: 20 },
        offset: { type: 'number', description: 'Pomiń pierwsze N wyników', default: 0 },
      },
      required: ['query'],
    },
  },
  {
    name: 'raynet_get_project',
    description: 'Pobiera szczegóły projektu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'number', description: 'ID projektu' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'raynet_create_project',
    description: 'Tworzy nowy projekt.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nazwa projektu (wymagana)' },
        companyId: { type: 'number', description: 'ID firmy (wymagane)' },
        dealId: { type: 'number', description: 'ID szansy sprzedaży' },
        ownerId: { type: 'number', description: 'ID właściciela' },
        startDate: { type: 'string', description: 'Data rozpoczęcia (YYYY-MM-DD)' },
        endDate: { type: 'string', description: 'Data zakończenia (YYYY-MM-DD)' },
        description: { type: 'string', description: 'Opis projektu' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tagi' },
      },
      required: ['name', 'companyId'],
    },
  },
  {
    name: 'raynet_update_project',
    description: 'Aktualizuje projekt.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'number', description: 'ID projektu (wymagane)' },
        name: { type: 'string', description: 'Nowa nazwa' },
        status: { type: 'string', enum: ['A_DRAFT', 'B_ACTIVE', 'C_FINISHED', 'D_CANCELLED'], description: 'Nowy status' },
        startDate: { type: 'string', description: 'Nowa data rozpoczęcia' },
        endDate: { type: 'string', description: 'Nowa data zakończenia' },
        description: { type: 'string', description: 'Nowy opis' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Nowe tagi' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'raynet_delete_project',
    description: 'Usuwa projekt. UWAGA: Nieodwracalne!',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'number', description: 'ID projektu do usunięcia' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'raynet_add_project_participant',
    description: 'Dodaje uczestnika do projektu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'number', description: 'ID projektu' },
        contactId: { type: 'number', description: 'ID kontaktu (osoby)' },
        note: { type: 'string', description: 'Notatka do uczestnika' },
      },
      required: ['projectId', 'contactId'],
    },
  },
  {
    name: 'raynet_remove_project_participant',
    description: 'Usuwa uczestnika z projektu.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'number', description: 'ID projektu' },
        participantId: { type: 'number', description: 'ID uczestnika do usunięcia' },
      },
      required: ['projectId', 'participantId'],
    },
  },
];

// ============================================================================
// Formatting Functions
// ============================================================================

function formatStatus(status: string): string {
  switch (status) {
    case 'A_DRAFT': return 'Szkic';
    case 'B_ACTIVE': return 'Aktywny';
    case 'C_FINISHED': return 'Zakończony';
    case 'D_CANCELLED': return 'Anulowany';
    default: return status;
  }
}

function formatParticipant(participant: RaynetProjectParticipant): string {
  const name = participant.person?.name ?? 'N/A';
  const role = participant.role ? ` (${participant.role})` : '';
  return `  - ${name}${role} (ID: ${participant.id})`;
}

function formatProject(project: RaynetProject): string {
  const lines = [
    `**${project.name}** (ID: ${project.id})`,
    `- Status: ${formatStatus(project.status)}`,
    `- Firma: ${project.company?.name ?? 'N/A'}`,
  ];

  if (project.businessCase?.name) {
    lines.push(`- Szansa: ${project.businessCase.name}`);
  }

  if (project.startDate || project.endDate) {
    const start = project.startDate ?? '?';
    const end = project.endDate ?? '?';
    lines.push(`- Okres: ${start} - ${end}`);
  }

  if (project.owner?.fullName) {
    lines.push(`- Właściciel: ${project.owner.fullName}`);
  }

  if (project.description) {
    const desc = project.description.length > 100
      ? project.description.substring(0, 100) + '...'
      : project.description;
    lines.push(`- Opis: ${desc}`);
  }

  if (project.participants && project.participants.length > 0) {
    lines.push(`\nUczestnicy (${project.participants.length}):`);
    for (const participant of project.participants) {
      lines.push(formatParticipant(participant));
    }
  }

  if (project.tags && project.tags.length > 0) {
    lines.push(`\n- Tagi: ${project.tags.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// Tool Handlers
// ============================================================================

export async function handleListProjects(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = ListProjectsSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProjectsService();
    const result = await service.list(input);

    if (result.projects.length === 0) {
      return { content: [{ type: 'text', text: 'Nie znaleziono żadnych projektów.' }] };
    }

    const projectsList = result.projects.map(formatProject).join('\n\n---\n\n');
    const summary = `Znaleziono ${result.totalCount} projektów (wyświetlono ${result.projects.length})`;

    return { content: [{ type: 'text', text: `${summary}\n\n${projectsList}` }] };
  } catch (error) {
    logger.error('Error in handleListProjects', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleSearchProjects(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = SearchProjectsSchema.parse(args);
    const service = getProjectsService();
    const result = await service.search(input);

    if (result.projects.length === 0) {
      return { content: [{ type: 'text', text: `Nie znaleziono projektów pasujących do: "${input.query}"` }] };
    }

    const projectsList = result.projects.map(formatProject).join('\n\n---\n\n');
    return { content: [{ type: 'text', text: `Wyniki dla "${input.query}":\n\n${projectsList}` }] };
  } catch (error) {
    logger.error('Error in handleSearchProjects', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleGetProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = GetProjectSchema.parse(args);
    const service = getProjectsService();
    const result = await service.get(input);
    return { content: [{ type: 'text', text: formatProject(result.project) }] };
  } catch (error) {
    logger.error('Error in handleGetProject', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleCreateProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = CreateProjectSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProjectsService();
    const result = await service.create(input);
    return { content: [{ type: 'text', text: `✅ Projekt utworzony!\n\n${formatProject(result.project)}` }] };
  } catch (error) {
    logger.error('Error in handleCreateProject', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleUpdateProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const parsed = UpdateProjectSchema.parse(args);
    const input = removeUndefined(parsed);
    const service = getProjectsService();
    const result = await service.update(input);
    return { content: [{ type: 'text', text: `✅ Projekt zaktualizowany!\n\n${formatProject(result.project)}` }] };
  } catch (error) {
    logger.error('Error in handleUpdateProject', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleDeleteProject(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = DeleteProjectSchema.parse(args);
    const service = getProjectsService();
    await service.delete(input.projectId);
    return { content: [{ type: 'text', text: `✅ Projekt o ID ${input.projectId} został usunięty.` }] };
  } catch (error) {
    logger.error('Error in handleDeleteProject', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleAddProjectParticipant(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = AddProjectParticipantSchema.parse(args);
    const service = getProjectsService();
    const result = await service.addParticipant(input);
    return { content: [{ type: 'text', text: `✅ Uczestnik dodany do projektu!\n\n${formatParticipant(result.participant)}` }] };
  } catch (error) {
    logger.error('Error in handleAddProjectParticipant', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

export async function handleRemoveProjectParticipant(args: unknown): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  try {
    const input = RemoveProjectParticipantSchema.parse(args);
    const service = getProjectsService();
    await service.removeParticipant(input);
    return { content: [{ type: 'text', text: `✅ Uczestnik o ID ${input.participantId} został usunięty z projektu.` }] };
  } catch (error) {
    logger.error('Error in handleRemoveProjectParticipant', { error });
    return { content: [{ type: 'text', text: `Błąd: ${getPolishErrorMessage(error)}` }] };
  }
}

// ============================================================================
// Tool Router
// ============================================================================

export async function handleProjectTool(
  toolName: string,
  args: unknown
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  switch (toolName) {
    case 'raynet_list_projects': return handleListProjects(args);
    case 'raynet_search_projects': return handleSearchProjects(args);
    case 'raynet_get_project': return handleGetProject(args);
    case 'raynet_create_project': return handleCreateProject(args);
    case 'raynet_update_project': return handleUpdateProject(args);
    case 'raynet_delete_project': return handleDeleteProject(args);
    case 'raynet_add_project_participant': return handleAddProjectParticipant(args);
    case 'raynet_remove_project_participant': return handleRemoveProjectParticipant(args);
    default:
      return { content: [{ type: 'text', text: `Nieznane narzędzie: ${toolName}` }] };
  }
}
