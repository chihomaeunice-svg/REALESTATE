export type Role = "landlord" | "tenant" | "agent" | "admin";
export type Verification = "unverified" | "pending" | "verified" | "rejected";

export interface User {
  id: string;
  email?: string;
  phone: string;
  full_name: string;
  role: Role;
  nida_number?: string;
  business_license?: string;
  verification: Verification;
  created_at: string;
}

export interface Listing {
  id: string;
  property_id: string;
  unit_id?: string;
  purpose: "rent" | "sale";
  title: string;
  description?: string;
  price: number;
  price_period: string;
  status: string;
  contact_phone: string;
  view_count: number;
  created_at: string;
  district: string;
  ward: string;
  city: string;
  property_type: string;
  verification: Verification;
  images?: string[];
  bedrooms: number;
  bathrooms: number;
  land_size_acres?: number;
  title_deed_status?: string;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  property_type: string;
  district: string;
  ward: string;
  address_line?: string;
  city: string;
  land_size_acres?: number;
  title_deed_status?: string;
  has_fence: boolean;
  has_security_gate: boolean;
  has_parking: boolean;
  verification: Verification;
  created_at: string;
}

export interface Unit {
  id: string;
  property_id: string;
  unit_label: string;
  bedrooms: number;
  bathrooms: number;
  size_sqm?: number;
  rent_amount: number;
  status: "vacant" | "occupied" | "maintenance" | "under_renovation";
  meter_type?: string;
  water_source?: string;
  has_fence: boolean;
  has_security_gate: boolean;
  has_balcony: boolean;
  master_bedrooms: number;
  has_parking: boolean;
  created_at: string;
  property_title?: string;
}

export interface Tenant {
  id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  nida_number?: string;
  emergency_contact?: string;
  created_at: string;
}

export interface Lease {
  id: string;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  language: "sw" | "en";
  start_date: string;
  end_date: string;
  rent_amount: number;
  advance_months: number;
  deposit_amount: number;
  status: "draft" | "active" | "terminated" | "expired";
  tenant_signature_name?: string;
  tenant_signed_at?: string;
  tenant_signature_ip?: string;
  landlord_signed_at?: string;
  created_at: string;
  tenant_name?: string;
  unit_label?: string;
  property_title?: string;
  district?: string;
  ward?: string;
}

export interface PaymentSchedule {
  id: string;
  lease_id: string;
  period_start: string;
  period_end: string;
  amount_due: number;
  due_date: string;
  status: "pending" | "paid" | "partial" | "overdue";
  created_at: string;
  tenant_name?: string;
  tenant_phone?: string;
  unit_label?: string;
  property_title?: string;
}

export interface Payment {
  id: string;
  lease_id: string;
  schedule_id?: string;
  amount: number;
  method: "mpesa" | "cash" | "bank";
  mpesa_receipt?: string;
  phone_number?: string;
  status: "pending" | "completed" | "failed";
  paid_at?: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  listing_id: string;
  seeker_name: string;
  seeker_phone: string;
  message?: string;
  status: string;
  created_at: string;
  listing_title?: string;
}

export interface IncomeSummary {
  total_units: number;
  occupied_units: number;
  vacant_units: number;
  active_leases: number;
  collected_ytd: number;
  overdue_amount: number;
  overdue_count: number;
}

export interface BuildingIncome {
  property_id: string;
  property_name: string;
  collected: number;
  overdue: number;
  units: number;
}

export interface Subscription {
  id: string;
  landlord_id: string;
  tier: "free" | "starter" | "growth" | "scale";
  unit_count: number;
  price_tzs: number;
  created_at: string;
}

export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  tenant_user_id: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "completed" | "closed";
  created_at: string;
  updated_at: string;
  unit_label?: string;
  property_title?: string;
  tenant_name?: string;
}
