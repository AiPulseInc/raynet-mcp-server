/**
 * Enums API Service
 *
 * Lookup operations for Raynet CRM categories, phases, and other enums
 */

import { getRaynetClient, RaynetClient } from './client';
import { logger } from '../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface EnumItem {
  id: number;
  code: string;
  color?: string;
  sequenceNumber?: number;
}

export interface EnumListResult {
  items: EnumItem[];
  totalCount: number;
}

export interface CurrencyItem {
  id: number;
  code: string;
  symbol: string;
}

// ============================================================================
// Enums Service
// ============================================================================

export class EnumsService {
  private client: RaynetClient;

  constructor(client?: RaynetClient) {
    this.client = client ?? getRaynetClient();
  }

  /**
   * Generic enum fetcher
   */
  private async fetchEnum(endpoint: string): Promise<EnumListResult> {
    const response = await this.client.getList<{ id: number; code01: string; code02?: string; sequenceNumber?: number }>(
      endpoint,
      { limit: 100 }
    );

    const items = response.data.map((item) => ({
      id: item.id,
      code: item.code01,
      color: item.code02,
      sequenceNumber: item.sequenceNumber,
    }));

    return {
      items,
      totalCount: response.totalCount,
    };
  }

  // ==========================================================================
  // Company Enums
  // ==========================================================================

  /**
   * Get company categories (KAM, AM, etc.)
   */
  async getCompanyCategories(): Promise<EnumListResult> {
    logger.info('Fetching company categories');
    return this.fetchEnum('/companyCategory/');
  }

  /**
   * Get company turnover ranges
   */
  async getCompanyTurnovers(): Promise<EnumListResult> {
    logger.info('Fetching company turnovers');
    return this.fetchEnum('/companyTurnover/');
  }

  // ==========================================================================
  // Person Enums
  // ==========================================================================

  /**
   * Get person/contact categories
   */
  async getPersonCategories(): Promise<EnumListResult> {
    logger.info('Fetching person categories');
    return this.fetchEnum('/personCategory/');
  }

  // ==========================================================================
  // Deal Enums
  // ==========================================================================

  /**
   * Get business case/deal categories
   */
  async getDealCategories(): Promise<EnumListResult> {
    logger.info('Fetching deal categories');
    return this.fetchEnum('/businessCaseCategory/');
  }

  /**
   * Get business case/deal phases
   */
  async getDealPhases(): Promise<EnumListResult> {
    logger.info('Fetching deal phases');
    return this.fetchEnum('/businessCasePhase/');
  }

  // ==========================================================================
  // Lead Enums
  // ==========================================================================

  /**
   * Get lead phases
   */
  async getLeadPhases(): Promise<EnumListResult> {
    logger.info('Fetching lead phases');
    return this.fetchEnum('/leadPhase/');
  }

  /**
   * Get contact sources
   */
  async getContactSources(): Promise<EnumListResult> {
    logger.info('Fetching contact sources');
    return this.fetchEnum('/contactSource/');
  }

  // ==========================================================================
  // Activity Enums
  // ==========================================================================

  /**
   * Get activity categories
   */
  async getActivityCategories(): Promise<EnumListResult> {
    logger.info('Fetching activity categories');
    return this.fetchEnum('/activityCategory/');
  }

  // ==========================================================================
  // General Enums
  // ==========================================================================

  /**
   * Get currencies
   */
  async getCurrencies(): Promise<{ items: CurrencyItem[]; totalCount: number }> {
    logger.info('Fetching currencies');
    const response = await this.client.getList<{ id: number; code: string; value: string }>(
      '/currency/',
      { limit: 100 }
    );

    const items = response.data.map((item) => ({
      id: item.id,
      code: item.code,
      symbol: item.value,
    }));

    return {
      items,
      totalCount: response.totalCount,
    };
  }

  /**
   * Get all enums at once (for initial setup/caching)
   */
  async getAllEnums(): Promise<{
    companyCategories: EnumItem[];
    companyTurnovers: EnumItem[];
    dealCategories: EnumItem[];
    dealPhases: EnumItem[];
    leadPhases: EnumItem[];
    contactSources: EnumItem[];
    currencies: CurrencyItem[];
  }> {
    logger.info('Fetching all enums');

    const [
      companyCategories,
      companyTurnovers,
      dealCategories,
      dealPhases,
      leadPhases,
      contactSources,
      currencies,
    ] = await Promise.all([
      this.getCompanyCategories(),
      this.getCompanyTurnovers(),
      this.getDealCategories(),
      this.getDealPhases(),
      this.getLeadPhases(),
      this.getContactSources(),
      this.getCurrencies(),
    ]);

    return {
      companyCategories: companyCategories.items,
      companyTurnovers: companyTurnovers.items,
      dealCategories: dealCategories.items,
      dealPhases: dealPhases.items,
      leadPhases: leadPhases.items,
      contactSources: contactSources.items,
      currencies: currencies.items,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let serviceInstance: EnumsService | null = null;

/**
 * Get or create the Enums service singleton
 */
export function getEnumsService(): EnumsService {
  if (!serviceInstance) {
    serviceInstance = new EnumsService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetEnumsService(): void {
  serviceInstance = null;
}
