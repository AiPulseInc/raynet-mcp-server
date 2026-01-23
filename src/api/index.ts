/**
 * API Module Exports
 */

// Client
export { RaynetClient, getRaynetClient, resetRaynetClient } from './client';

// Services
export {
  CompaniesService,
  getCompaniesService,
  resetCompaniesService,
  type CompanyResult,
  type CompanyListResult,
} from './companies';

export {
  ContactsService,
  getContactsService,
  resetContactsService,
  type ContactResult,
  type ContactListResult,
} from './contacts';

export {
  DealsService,
  getDealsService,
  resetDealsService,
  type DealResult,
  type DealListResult,
} from './deals';

export {
  ActivitiesService,
  getActivitiesService,
  resetActivitiesService,
  type ActivityResult,
  type ActivityListResult,
} from './activities';

export {
  LeadsService,
  getLeadsService,
  resetLeadsService,
  type LeadResult,
  type LeadListResult,
  type LeadConversionResult,
} from './leads';

export {
  EnumsService,
  getEnumsService,
  resetEnumsService,
  type EnumItem,
  type EnumListResult,
  type CurrencyItem,
} from './enums';
