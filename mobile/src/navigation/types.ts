export type PublicStackParamList = {
  HomeTabs: undefined;
  ListingDetail: { id: string };
  Login: undefined;
  Register: undefined;
};

export type HomeTabsParamList = {
  Home: undefined;
  Listings: { district?: string; property_type?: string };
  Wishlist: undefined;
  Account: undefined;
};

export type LandlordTabsParamList = {
  LandlordHome: undefined;
  Overview: undefined;
  Properties: undefined;
  Leases: undefined;
  More: undefined;
};

export type LandlordStackParamList = {
  LandlordOverview: undefined;
  LandlordProperties: undefined;
  LandlordTenants: undefined;
  LandlordLeases: undefined;
  LeaseDetail: { id: string };
  LandlordReports: undefined;
  LandlordSubscription: undefined;
};

export type TenantTabsParamList = {
  TenantHome: undefined;
  TenantPortal: undefined;
  TenantProfile: undefined;
};

export type AdminTabsParamList = {
  AdminHome: undefined;
  AdminVerification: undefined;
};
