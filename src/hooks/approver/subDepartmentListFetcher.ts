export type SubDepartmentListPagination = {
  page: number;
  limit: number;
  totalRecords: number;
  totalPages: number;
};

export type SubDepartmentListFetchArgs = {
  subDepartmentId: number;
  page: number;
  limit: number;
  status: string;
  allLabel: string;
  search: string;
  extraFilters: Record<string, string>;
};

export type SubDepartmentListResult = {
  batches: Record<string, unknown>[];
  pagination: SubDepartmentListPagination;
  statusCounts: Record<string, number>;
};

/** Resolves to `null` when the API call fails. */
export type SubDepartmentListFetcher = (
  args: SubDepartmentListFetchArgs,
) => Promise<SubDepartmentListResult | null>;
