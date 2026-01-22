/**
 * Raynet MCP Server - Shared Type Definitions
 */

// ============================================================================
// Environment Configuration Types
// ============================================================================

export interface RaynetConfig {
  instanceUrl: string;
  instanceName: string;
  username: string;
  apiKey: string;
  maxRetries: number;
  timeoutMs: number;
  rateLimitBuffer: number;
}

export interface ServerConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logFormat: 'json' | 'pretty';
}

export interface AppConfig {
  raynet: RaynetConfig;
  server: ServerConfig;
}

// ============================================================================
// Raynet API Response Types
// ============================================================================

export interface RaynetResponse<T> {
  success: boolean;
  data: T;
}

export interface RaynetListResponse<T> {
  success: boolean;
  totalCount: number;
  data: T[];
}

export interface RaynetErrorResponse {
  type: string;
  message: string;
  translatedMessage?: string;
  status: number;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// ============================================================================
// Raynet Entity Types - Company (Account)
// ============================================================================

export interface RaynetCompany {
  id: number;
  name: string;
  lastName?: string;
  person?: boolean;
  rating?: 'A' | 'B' | 'C' | 'D';
  state?: 'A_POTENTIAL' | 'B_ACTUAL' | 'C_INVALID';
  role?: 'A_SUBSCRIBER' | 'B_PARTNER' | 'C_COMPETITION' | 'D_SUPPLIER' | 'E_UNKNOWN';
  regNumber?: string;
  taxNumber?: string;
  taxNumber2?: string;
  bankAccount?: string;
  taxPayer?: 'YES' | 'NO';
  category?: RaynetReference;
  owner?: RaynetReference;
  economyActivity?: RaynetReference;
  companyClassification1?: RaynetReference;
  companyClassification2?: RaynetReference;
  companyClassification3?: RaynetReference;
  primaryAddress?: RaynetAddress;
  notice?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
}

// ============================================================================
// Raynet Entity Types - Person (Contact)
// ============================================================================

export interface RaynetPerson {
  id: number;
  firstName?: string;
  lastName?: string;
  titleBefore?: string;
  titleAfter?: string;
  salutation?: string;
  birthday?: string;
  language?: string;
  category?: RaynetReference;
  owner?: RaynetReference;
  contactInfo?: RaynetContactInfo;
  primaryRelationship?: RaynetPersonRelationship;
  notice?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
}

export interface RaynetPersonRelationship {
  id: number;
  company?: RaynetReference;
  primary?: boolean;
  contactInfo?: RaynetContactInfo;
}

// ============================================================================
// Raynet Entity Types - Business Case (Deal)
// ============================================================================

export interface RaynetBusinessCase {
  id: number;
  name: string;
  company?: RaynetReference;
  person?: RaynetReference;
  owner?: RaynetReference;
  businessCasePhase?: RaynetReference;
  businessCaseType?: RaynetReference;
  businessCaseSource?: RaynetReference;
  price?: number;
  probability?: number;
  scheduledEnd?: string;
  validFrom?: string;
  validTill?: string;
  description?: string;
  notice?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
}

// ============================================================================
// Raynet Shared Types
// ============================================================================

export interface RaynetReference {
  id: number;
  name?: string;
}

export interface RaynetAddress {
  id?: number;
  name?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  countryCode?: string;
  province?: string;
  lat?: number;
  lng?: number;
  contactInfo?: RaynetContactInfo;
}

export interface RaynetContactInfo {
  email?: string;
  email2?: string;
  tel1?: string;
  tel1Type?: string;
  tel2?: string;
  tel2Type?: string;
  www?: string;
  fax?: string;
  otherContact?: string;
}

export interface RaynetRowInfo {
  createdAt?: string;
  createdBy?: RaynetReference;
  updatedAt?: string;
  updatedBy?: RaynetReference;
  lastModifiedAt?: string;
  rowAccess?: string;
}

// ============================================================================
// MCP Tool Input Types
// ============================================================================

export interface SearchCompaniesInput {
  query?: string;
  limit?: number;
  offset?: number;
  rating?: string;
  state?: string;
  category?: number;
  owner?: number;
  tags?: string[];
}

export interface GetCompanyInput {
  companyId: number;
}

export interface CreateCompanyInput {
  name: string;
  rating?: 'A' | 'B' | 'C' | 'D';
  state?: 'A_POTENTIAL' | 'B_ACTUAL' | 'C_INVALID';
  owner?: number;
  category?: number;
  regNumber?: string;
  taxNumber?: string;
  notice?: string;
  tags?: string[];
}

export interface UpdateCompanyInput {
  companyId: number;
  name?: string;
  rating?: 'A' | 'B' | 'C' | 'D';
  state?: 'A_POTENTIAL' | 'B_ACTUAL' | 'C_INVALID';
  owner?: number;
  category?: number;
  notice?: string;
  tags?: string[];
}

export interface DeleteCompanyInput {
  companyId: number;
}

export interface SearchContactsInput {
  query?: string;
  companyId?: number;
  limit?: number;
  offset?: number;
  owner?: number;
}

export interface GetContactInput {
  contactId: number;
}

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  companyId?: number;
  email?: string;
  phone?: string;
  titleBefore?: string;
  titleAfter?: string;
  notice?: string;
}

export interface UpdateContactInput {
  contactId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notice?: string;
}

export interface DeleteContactInput {
  contactId: number;
}

export interface LinkContactToCompanyInput {
  contactId: number;
  companyId: number;
  primary?: boolean;
}

export interface SearchDealsInput {
  query?: string;
  companyId?: number;
  owner?: number;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface GetDealInput {
  dealId: number;
}

export interface CreateDealInput {
  name: string;
  companyId?: number;
  contactId?: number;
  owner?: number;
  price?: number;
  probability?: number;
  scheduledEnd?: string;
  description?: string;
}

export interface UpdateDealInput {
  dealId: number;
  name?: string;
  price?: number;
  probability?: number;
  scheduledEnd?: string;
  description?: string;
  phaseId?: number;
}

export interface DeleteDealInput {
  dealId: number;
}
