import type { Paginated } from "@/lib/pagination";

export type SupplierSummary = {
  id: string;
  workspace_id: string;
  company_id: string;
  company_name: string | null;
  name: string;
  address: string | null;
  country: string | null;
  created_at: string;
};

export type PaginatedSuppliers = Paginated<SupplierSummary>;

export type CompanyOption = {
  id: string;
  name: string;
};
