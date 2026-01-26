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
  type AddressResult,
  type AddressListResult,
} from './companies';

export {
  ContactsService,
  getContactsService,
  resetContactsService,
  type ContactResult,
  type ContactListResult,
  type RelationshipResult,
  type RelationshipListResult,
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

export {
  ProductsService,
  getProductsService,
  resetProductsService,
  type ProductResult,
  type ProductListResult,
} from './products';

export {
  OffersService,
  getOffersService,
  resetOffersService,
  type OfferResult,
  type OfferListResult,
  type OfferItemResult,
} from './offers';

export {
  SalesOrdersService,
  getSalesOrdersService,
  resetSalesOrdersService,
  type SalesOrderResult,
  type SalesOrderListResult,
  type SalesOrderItemResult,
} from './salesOrders';

export {
  ProjectsService,
  getProjectsService,
  resetProjectsService,
  type ProjectResult,
  type ProjectListResult,
  type ParticipantResult,
} from './projects';
