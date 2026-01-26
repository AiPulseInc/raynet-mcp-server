/**
 * Raynet MCP Server - Shared Type Definitions
 *
 * Based on API exploration performed 2026-01-22
 * Instance: crm321grow (EU region)
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
  success: false;
  type: string;
  message: string;
  translatedMessage?: string;
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
// Raynet Shared/Reference Types
// ============================================================================

/** Minimal reference to a related entity */
export interface RaynetReference {
  id: number;
  name?: string;
  fullName?: string;
  value?: string;
}

/** Owner reference with fullName */
export interface RaynetOwnerReference {
  id: number;
  fullName: string;
}

/** Security level reference */
export interface RaynetSecurityLevel {
  id: number;
  name: string;
}

/** Currency reference */
export interface RaynetCurrency {
  id: number;
  value: string; // e.g., "zł", "CZK", "EUR"
}

/** Row audit information */
export interface RaynetRowInfo {
  createdAt: string; // "2025-12-16 14:10"
  createdBy: string; // email or "(unknown)"
  updatedAt?: string | null;
  updatedBy?: string | null;
  rowAccess?: string | null;
  rowState?: string | null;
}

// ============================================================================
// Address and Contact Info Types
// ============================================================================

export interface RaynetAddressDetails {
  id: number;
  name?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  countryCode?: string;
  province?: string | null;
  lat?: number;
  lng?: number;
}

export interface RaynetContactInfo {
  primary?: boolean;
  email?: string;
  email2?: string | null;
  tel1?: string | null;
  tel1Type?: string | null;
  tel2?: string | null;
  tel2Type?: string | null;
  www?: string | null;
  fax?: string | null;
  otherContact?: string | null;
  doNotSendMM?: boolean;
}

export interface RaynetCompanyAddress {
  id: number;
  primary: boolean;
  contactAddress: boolean;
  extIds?: Record<string, unknown> | null;
  address: RaynetAddressDetails;
  contactInfo: RaynetContactInfo;
  territory?: RaynetReference | null;
}

export interface RaynetPrivateAddress {
  city?: string | null;
  country?: string | null;
  countryCode?: string | null;
  province?: string | null;
  street?: string | null;
  zipCode?: string | null;
}

export interface RaynetSocialNetworkContact {
  facebook?: string | null;
  googleplus?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
  pinterest?: string | null;
  instagram?: string | null;
  skype?: string | null;
  youtube?: string | null;
}

// ============================================================================
// File/Attachment Types
// ============================================================================

export interface RaynetFileInfo {
  id: number;
  contentType: string;
  fileName: string;
  size: number;
}

// ============================================================================
// Company (Firma) Types
// ============================================================================

/** Company states */
export type CompanyState = 'A_POTENTIAL' | 'B_ACTUAL' | 'C_DEFERRED' | 'D_ENDED';

/** Company roles */
export type CompanyRole = 'A_SUBSCRIBER' | 'B_PARTNER' | 'C_SUPPLIER' | 'D_RIVAL';

/** Company/Contact ratings */
export type Rating = 'A' | 'B' | 'C';

export interface RaynetCompany {
  id: number;
  name: string;
  person: boolean;
  firstName?: string | null;
  lastName?: string | null;
  titleBefore?: string | null;
  titleAfter?: string | null;
  salutation?: string | null;
  role: CompanyRole;
  state: CompanyState;
  rating: Rating;
  owner: RaynetOwnerReference;
  regNumber?: string;
  taxNumber?: string;
  taxNumber2?: string | null;
  taxPayer?: string | null;
  bankAccount?: string | null;
  databox?: string | null;
  court?: string | null;
  birthday?: string;
  notice?: string | null;
  primaryAddress: RaynetCompanyAddress;
  contactAddress: RaynetCompanyAddress;
  category?: RaynetReference | null;
  turnover?: RaynetReference | null;
  economyActivity?: RaynetReference | null;
  companyClassification1?: RaynetReference | null;
  companyClassification2?: RaynetReference | null;
  companyClassification3?: RaynetReference | null;
  paymentTerm?: RaynetReference;
  contactSource?: RaynetReference | null;
  tags: string[];
  customFields: Record<string, unknown>;
  attachments?: RaynetFileInfo[] | null;
  rowInfo: RaynetRowInfo;
  securityLevel: RaynetSecurityLevel;
  inlineGdpr: unknown[];
  _version: number;
  // Detail-only fields
  employeesNumber?: RaynetReference | null;
  legalForm?: RaynetReference | null;
  logo?: RaynetFileInfo | null;
  socialNetworkContact?: RaynetSocialNetworkContact;
  originLead?: RaynetReference | null;
  extIds?: Record<string, unknown> | null;
  addresses?: RaynetCompanyAddress[];
}

// ============================================================================
// Person/Contact (Kontakt) Types
// ============================================================================

export interface RaynetPersonRelationship {
  id: number;
  type: string;
  company: RaynetReference;
  primary?: boolean;
}

export interface RaynetPerson {
  id: number;
  firstName: string;
  lastName: string;
  titleBefore?: string | null;
  titleAfter?: string | null;
  salutation?: string | null;
  birthday?: string;
  language?: RaynetReference | null;
  maritalStatus?: RaynetReference | null;
  gender?: string | null;
  communicationTone?: string | null;
  owner: RaynetOwnerReference;
  category?: RaynetReference | null;
  primaryRelationship: RaynetPersonRelationship;
  personClassification1?: RaynetReference | null;
  personClassification2?: RaynetReference | null;
  personClassification3?: RaynetReference | null;
  contactInfo: RaynetContactInfo;
  privateAddress: RaynetPrivateAddress;
  companyAddress?: {
    address: RaynetAddressDetails;
    territory?: RaynetReference | null;
  };
  notice?: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  keyman: boolean;
  activeUserAccount: boolean;
  rowInfo: RaynetRowInfo;
  securityLevel: RaynetSecurityLevel;
  inlineGdpr: unknown[];
  _version: number;
  // Detail-only fields
  photo?: RaynetFileInfo | null;
  socialNetworkContact?: RaynetSocialNetworkContact;
  originLead?: RaynetReference | null;
  extIds?: Record<string, unknown> | null;
  attachments?: RaynetFileInfo[];
  relationships?: RaynetPersonRelationship[];
}

// ============================================================================
// Business Case/Deal (Szansa sprzedaży) Types
// ============================================================================

/** Deal status */
export type DealStatus = 'A_DRAFT' | 'B_ACTIVE' | 'C_WON' | 'D_LOST' | 'E_CANCELLED';

export interface RaynetPhaseChange {
  phase: RaynetReference;
  changedAt: string;
}

export interface RaynetBusinessCase {
  id: number;
  code: string;
  name: string;
  status: DealStatus;
  probability: number;
  totalAmount: number;
  totalAmountWithTax?: number; // Detail only
  tradingProfit: number;
  estimatedValue: number;
  exchangeRate: number;
  validFrom: string;
  validTill?: string | null;
  scheduledEnd?: string | null;
  description?: string | null;
  company: RaynetReference;
  person?: RaynetReference | null;
  owner: RaynetOwnerReference;
  currency: RaynetCurrency;
  businessCasePhase: RaynetReference;
  businessCaseType: RaynetReference;
  category?: RaynetReference | null;
  project?: RaynetReference | null;
  source?: RaynetReference | null;
  businessCaseClassification1?: RaynetReference | null;
  businessCaseClassification2?: RaynetReference | null;
  businessCaseClassification3?: RaynetReference | null;
  losingReason?: RaynetReference | null;
  losingCategory?: RaynetReference | null;
  phaseChanges: RaynetPhaseChange[];
  tags: string[];
  customFields: Record<string, unknown>;
  rowInfo: RaynetRowInfo;
  securityLevel: RaynetSecurityLevel;
  _version: number;
  // Detail-only fields
  originalLead?: RaynetReference | null;
  items?: unknown[];
  signatures?: unknown[];
  attachments?: RaynetFileInfo[];
  extIds?: Record<string, unknown> | null;
}

// ============================================================================
// Activity Types
// ============================================================================

/** Activity type (entity name) */
export type ActivityType = 'PhoneCall' | 'Meeting' | 'Task' | 'Email';

/** Activity status */
export type ActivityStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** Activity priority */
export type ActivityPriority = 'LOW' | 'DEFAULT' | 'HIGH';

export interface RaynetActivityParticipant {
  id: number;
  person?: RaynetReference;
  company?: RaynetReference;
}

export interface RaynetActivity {
  id: number;
  _entityName: ActivityType;
  title: string;
  status: ActivityStatus;
  priority: ActivityPriority;
  personal: boolean;
  scheduledFrom: string;
  scheduledTill: string;
  completed?: string | null;
  description?: string | null;
  solution?: string | null;
  category?: RaynetReference | null;
  activity?: RaynetReference | null;
  company?: RaynetReference | null;
  person?: RaynetReference | null;
  lead?: RaynetReference | null;
  project?: RaynetReference | null;
  businessCase?: RaynetReference | null;
  offer?: RaynetReference | null;
  salesOrder?: RaynetReference | null;
  participants: RaynetActivityParticipant[];
  recurrence?: unknown | null;
  tags: string[];
  customFields: Record<string, unknown>;
  rowInfo: RaynetRowInfo;
  securityLevel: RaynetSecurityLevel;
  _version: number;
}

// ============================================================================
// Lead Types
// ============================================================================

/** Lead status */
export type LeadStatus = 'A_DRAFT' | 'B_ACTIVE' | 'C_CONVERTED' | 'D_CANCELLED';

/** Lead priority */
export type LeadPriority = 'LOW' | 'DEFAULT' | 'HIGH';

export interface RaynetLeadPhase {
  id: number;
  code01: string;
  color?: string;
  sequenceNumber: number;
  locked: boolean;
}

export interface RaynetLead {
  id: number;
  code: string;
  topic: string;
  leadDate: string;
  status: LeadStatus;
  priority: LeadPriority;
  leadPhase: RaynetLeadPhase;
  owner: RaynetOwnerReference;
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  titleBefore?: string | null;
  titleAfter?: string | null;
  leadPerson: boolean;
  company?: RaynetReference | null;
  person?: RaynetReference | null;
  businessCase?: RaynetReference | null;
  convertDate?: string | null;
  contactSource?: RaynetReference | null;
  category?: RaynetReference | null;
  territory?: RaynetReference | null;
  contactInfo: RaynetContactInfo;
  address?: RaynetAddressDetails | null;
  socialNetworkContact?: Record<string, string | null>;
  regNumber?: string | null;
  taxNumber?: string | null;
  notice?: string | null;
  tags: string[];
  customFields: Record<string, unknown>;
  rowInfo: RaynetRowInfo;
  securityLevel: RaynetSecurityLevel;
  attachments?: RaynetFileInfo[];
  _version: number;
}

// ============================================================================
// Product Types
// ============================================================================

export interface RaynetProduct {
  id: number;
  code?: string;
  name: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  active: boolean;
  currency?: RaynetCurrency;
  category?: RaynetReference;
  owner?: RaynetOwnerReference;
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
  _version: number;
}

// ============================================================================
// Offer Types
// ============================================================================

/** Offer status */
export type OfferStatus = 'B_ACTIVE' | 'E_WIN' | 'F_LOST' | 'G_STORNO';

export interface RaynetOfferItem {
  id: number;
  product?: RaynetReference;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  quantity: number;
  price: number;
  taxRate?: number;
  discount?: number;
  totalPrice: number;
}

export interface RaynetOffer {
  id: number;
  code?: string;
  name: string;
  status: OfferStatus;
  validFrom: string;
  validTill?: string;
  totalAmount: number;
  totalAmountWithTax?: number;
  company: RaynetReference;
  person?: RaynetReference;
  businessCase?: RaynetReference;
  owner: RaynetOwnerReference;
  currency: RaynetCurrency;
  category?: RaynetReference;
  description?: string;
  items?: RaynetOfferItem[];
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
  securityLevel?: RaynetSecurityLevel;
  _version: number;
}

// ============================================================================
// Sales Order Types
// ============================================================================

/** Sales order status */
export type SalesOrderStatus = 'B_ACTIVE' | 'E_WIN' | 'F_LOST' | 'G_STORNO';

export interface RaynetSalesOrderItem {
  id: number;
  product?: RaynetReference;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  quantity: number;
  price: number;
  taxRate?: number;
  discount?: number;
  totalPrice: number;
}

export interface RaynetSalesOrder {
  id: number;
  code?: string;
  name: string;
  status: SalesOrderStatus;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  totalAmountWithTax?: number;
  company: RaynetReference;
  person?: RaynetReference;
  businessCase?: RaynetReference;
  offer?: RaynetReference;
  owner: RaynetOwnerReference;
  currency: RaynetCurrency;
  category?: RaynetReference;
  description?: string;
  deliveryAddress?: RaynetCompanyAddress;
  invoiceAddress?: RaynetCompanyAddress;
  items?: RaynetSalesOrderItem[];
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
  securityLevel?: RaynetSecurityLevel;
  _version: number;
}

// ============================================================================
// Project Types
// ============================================================================

/** Project status */
export type ProjectStatus = 'A_DRAFT' | 'B_ACTIVE' | 'C_FINISHED' | 'D_CANCELLED';

export interface RaynetProjectParticipant {
  id: number;
  person: RaynetReference;
  role?: string;
}

export interface RaynetProject {
  id: number;
  code?: string;
  name: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  company: RaynetReference;
  businessCase?: RaynetReference;
  owner: RaynetOwnerReference;
  category?: RaynetReference;
  description?: string;
  participants?: RaynetProjectParticipant[];
  tags?: string[];
  customFields?: Record<string, unknown>;
  rowInfo?: RaynetRowInfo;
  securityLevel?: RaynetSecurityLevel;
  _version: number;
}

// ============================================================================
// Enum/Category Types
// ============================================================================

export interface RaynetCategory {
  id: number;
  code01: string;
  code02?: string; // Color code for visual categories
}

export interface RaynetPhase {
  id: number;
  code01: string;
}

export interface RaynetTurnover {
  id: number;
  code01: string;
}

// ============================================================================
// MCP Tool Input Types - Companies
// ============================================================================

export interface ListCompaniesInput {
  limit?: number;
  offset?: number;
  state?: CompanyState;
  role?: CompanyRole;
  rating?: Rating;
  ownerId?: number;
  categoryId?: number;
}

export interface SearchCompaniesInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetCompanyInput {
  companyId: number;
}

export interface CreateCompanyInput {
  name: string;
  role?: CompanyRole;
  state?: CompanyState;
  rating?: Rating;
  ownerId?: number;
  categoryId?: number;
  regNumber?: string;
  taxNumber?: string;
  notice?: string;
  tags?: string[];
  address?: {
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
  };
  contactInfo?: {
    email?: string;
    tel1?: string;
    www?: string;
  };
}

export interface UpdateCompanyInput {
  companyId: number;
  name?: string;
  role?: CompanyRole;
  state?: CompanyState;
  rating?: Rating;
  ownerId?: number;
  categoryId?: number;
  notice?: string;
  tags?: string[];
}

// ============================================================================
// MCP Tool Input Types - Contacts
// ============================================================================

export interface ListContactsInput {
  limit?: number;
  offset?: number;
  companyId?: number;
  ownerId?: number;
}

export interface SearchContactsInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetContactInput {
  contactId: number;
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  companyId?: number;
  position?: string;
  ownerId?: number;
  email?: string;
  phone?: string;
  titleBefore?: string;
  titleAfter?: string;
  birthday?: string;
  notice?: string;
  tags?: string[];
}

export interface UpdateContactInput {
  contactId: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  titleBefore?: string;
  titleAfter?: string;
  notice?: string;
  tags?: string[];
}

export interface LinkContactToCompanyInput {
  contactId: number;
  companyId: number;
  relationshipType?: string;
  primary?: boolean;
}

// ============================================================================
// MCP Tool Input Types - Deals
// ============================================================================

export interface ListDealsInput {
  limit?: number;
  offset?: number;
  status?: DealStatus;
  companyId?: number;
  ownerId?: number;
  phaseId?: number;
}

export interface SearchDealsInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetDealInput {
  dealId: number;
}

export interface CreateDealInput {
  name: string;
  companyId: number;
  contactId?: number;
  ownerId?: number;
  totalAmount?: number;
  probability?: number;
  phaseId?: number;
  validFrom?: string;
  scheduledEnd?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDealInput {
  dealId: number;
  name?: string;
  totalAmount?: number;
  probability?: number;
  phaseId?: number;
  status?: DealStatus;
  scheduledEnd?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateDealPhaseInput {
  dealId: number;
  phaseId: number;
}

// ============================================================================
// MCP Tool Input Types - Activities
// ============================================================================

export interface ListActivitiesInput {
  limit?: number;
  offset?: number;
  companyId?: number;
  contactId?: number;
  dealId?: number;
  status?: ActivityStatus;
}

export interface CreateActivityInput {
  type: ActivityType;
  title: string;
  companyId?: number;
  contactId?: number;
  dealId?: number;
  scheduledFrom: string;
  scheduledTill: string;
  description?: string;
  priority?: ActivityPriority;
}

export interface CompleteActivityInput {
  activityId: number;
  activityType: ActivityType;
  solution?: string;
}

export interface GetActivityInput {
  activityId: number;
  activityType: ActivityType;
}

export interface UpdateActivityInput {
  activityId: number;
  activityType: ActivityType;
  title?: string;
  scheduledFrom?: string;
  scheduledTill?: string;
  description?: string;
  priority?: ActivityPriority;
  status?: ActivityStatus;
}

export interface SearchActivitiesInput {
  query: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// MCP Tool Input Types - Leads
// ============================================================================

export interface ListLeadsInput {
  limit?: number;
  offset?: number;
  status?: LeadStatus;
  phaseId?: number;
  ownerId?: number;
}

export interface SearchLeadsInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetLeadInput {
  leadId: number;
}

export interface CreateLeadInput {
  topic: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  ownerId?: number;
  phaseId?: number;
  priority?: LeadPriority;
  contactSourceId?: number;
  notice?: string;
  tags?: string[];
}

export interface UpdateLeadInput {
  leadId: number;
  topic?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  phaseId?: number;
  priority?: LeadPriority;
  status?: LeadStatus;
  notice?: string;
  tags?: string[];
}

export interface ConvertLeadInput {
  leadId: number;
  createCompany?: boolean;
  createContact?: boolean;
  createDeal?: boolean;
  dealName?: string;
}

// ============================================================================
// MCP Tool Input Types - Products
// ============================================================================

export interface ListProductsInput {
  limit?: number;
  offset?: number;
  categoryId?: number;
  active?: boolean;
}

export interface SearchProductsInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetProductInput {
  productId: number;
}

export interface CreateProductInput {
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  currencyId?: number;
  categoryId?: number;
  ownerId?: number;
}

export interface UpdateProductInput {
  productId: number;
  name?: string;
  code?: string;
  description?: string;
  unit?: string;
  price?: number;
  taxRate?: number;
  currencyId?: number;
  categoryId?: number;
  active?: boolean;
}

// ============================================================================
// MCP Tool Input Types - Company Addresses
// ============================================================================

export interface ListCompanyAddressesInput {
  companyId: number;
}

export interface AddCompanyAddressInput {
  companyId: number;
  name?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  primary?: boolean;
  contactAddress?: boolean;
}

export interface UpdateCompanyAddressInput {
  companyId: number;
  addressId: number;
  name?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface DeleteCompanyAddressInput {
  companyId: number;
  addressId: number;
}

export interface SetPrimaryCompanyAddressInput {
  companyId: number;
  addressId: number;
}

// ============================================================================
// MCP Tool Input Types - Contact Relationships
// ============================================================================

export interface ListContactRelationshipsInput {
  contactId: number;
}

export interface AddContactRelationshipInput {
  contactId: number;
  companyId: number;
  relationshipType?: string;
  primary?: boolean;
}

export interface UpdateContactRelationshipInput {
  contactId: number;
  relationshipId: number;
  relationshipType?: string;
}

export interface DeleteContactRelationshipInput {
  contactId: number;
  relationshipId: number;
}

export interface SetPrimaryContactRelationshipInput {
  contactId: number;
  relationshipId: number;
}

// ============================================================================
// MCP Tool Input Types - Offers
// ============================================================================

export interface ListOffersInput {
  limit?: number;
  offset?: number;
  status?: OfferStatus;
  companyId?: number;
  dealId?: number;
  ownerId?: number;
}

export interface SearchOffersInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetOfferInput {
  offerId: number;
}

export interface OfferItemInput {
  productId?: number;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  quantity: number;
  price: number;
  taxRate?: number;
  discount?: number;
}

export interface CreateOfferInput {
  name: string;
  companyId: number;
  dealId?: number;
  contactId?: number;
  ownerId?: number;
  validFrom?: string;
  validTill?: string;
  description?: string;
  tags?: string[];
}

export interface CreateOfferWithItemsInput {
  name: string;
  companyId: number;
  dealId?: number;
  contactId?: number;
  ownerId?: number;
  validFrom?: string;
  validTill?: string;
  description?: string;
  items: OfferItemInput[];
  tags?: string[];
}

export interface UpdateOfferInput {
  offerId: number;
  name?: string;
  status?: OfferStatus;
  validFrom?: string;
  validTill?: string;
  description?: string;
  tags?: string[];
}

export interface AddOfferItemInput {
  offerId: number;
  item: OfferItemInput;
}

export interface RemoveOfferItemInput {
  offerId: number;
  itemId: number;
}

// ============================================================================
// MCP Tool Input Types - Sales Orders
// ============================================================================

export interface ListSalesOrdersInput {
  limit?: number;
  offset?: number;
  status?: SalesOrderStatus;
  companyId?: number;
  dealId?: number;
  offerId?: number;
  ownerId?: number;
}

export interface SearchSalesOrdersInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetSalesOrderInput {
  salesOrderId: number;
}

export interface SalesOrderItemInput {
  productId?: number;
  name: string;
  code?: string;
  description?: string;
  unit?: string;
  quantity: number;
  price: number;
  taxRate?: number;
  discount?: number;
}

export interface CreateSalesOrderInput {
  name: string;
  companyId: number;
  dealId: number;
  offerId?: number;
  contactId?: number;
  ownerId?: number;
  orderDate?: string;
  deliveryDate?: string;
  deliveryAddressId?: number;
  invoiceAddressId?: number;
  description?: string;
  tags?: string[];
}

export interface CreateSalesOrderWithItemsInput {
  name: string;
  companyId: number;
  dealId: number;
  offerId?: number;
  contactId?: number;
  ownerId?: number;
  orderDate?: string;
  deliveryDate?: string;
  deliveryAddressId?: number;
  invoiceAddressId?: number;
  description?: string;
  items: SalesOrderItemInput[];
  tags?: string[];
}

export interface CreateSalesOrderFromOfferInput {
  offerId: number;
  orderDate?: string;
  deliveryDate?: string;
}

export interface UpdateSalesOrderInput {
  salesOrderId: number;
  name?: string;
  status?: SalesOrderStatus;
  orderDate?: string;
  deliveryDate?: string;
  description?: string;
  tags?: string[];
}

export interface AddSalesOrderItemInput {
  salesOrderId: number;
  item: SalesOrderItemInput;
}

export interface RemoveSalesOrderItemInput {
  salesOrderId: number;
  itemId: number;
}

// ============================================================================
// MCP Tool Input Types - Projects
// ============================================================================

export interface ListProjectsInput {
  limit?: number;
  offset?: number;
  status?: ProjectStatus;
  companyId?: number;
  ownerId?: number;
}

export interface SearchProjectsInput {
  query: string;
  limit?: number;
  offset?: number;
}

export interface GetProjectInput {
  projectId: number;
}

export interface CreateProjectInput {
  name: string;
  companyId: number;
  dealId?: number;
  ownerId?: number;
  startDate?: string;
  endDate?: string;
  description?: string;
  tags?: string[];
}

export interface UpdateProjectInput {
  projectId: number;
  name?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  description?: string;
  tags?: string[];
}

export interface AddProjectParticipantInput {
  projectId: number;
  contactId: number;
  note?: string;
}

export interface RemoveProjectParticipantInput {
  projectId: number;
  participantId: number;
}

// ============================================================================
// Query Parameter Types
// ============================================================================

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
}

export type FilterOperator = 'EQ' | 'LIKE' | 'GT' | 'GE' | 'LT' | 'LE';

export interface FilterParam {
  field: string;
  operator: FilterOperator;
  value: string | number;
}
