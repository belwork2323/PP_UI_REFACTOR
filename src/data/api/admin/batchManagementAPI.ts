import { post, put, del } from "../httpClient";
import { BATCH_MANAGEMENT } from "../endPoints";

/* ─────────────────────────────────────────────────────────────────────────────
   BATCH STATS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch batch statistics with optional date filters.
 * @param filterType - "day" | "week" | "month"
 * @param startDate  - "DD-MM-YYYY"
 * @param endDate    - "DD-MM-YYYY"
 */
export const fetchBatchStatsApi = (
  filterType: string,
  startDate?: string,
  endDate?  : string
) => {
  const payload: Record<string, string> = { filterType };
  if (startDate) payload.startDate = startDate;
  if (endDate)   payload.endDate   = endDate;
  return post(BATCH_MANAGEMENT.GET_STATS, payload);
};

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH ALL BATCHES  (paginated + filtered)
───────────────────────────────────────────────────────────────────────────── */

export interface BatchFilters {
  search?         : string;
  status?         : string;
  priority?       : string;
  department?     : string;
  subDepartment?  : string;
  /** Filter by one or more motor IDs (POST body filters.motorIds) */
  motorIds?       : string[];
  /** Filter by one or more lot IDs (POST body filters.lotIds) */
  lotIds?         : string[];
}

export interface BatchSort {
  field?: string;
  order?: "asc" | "desc";
}

/**
 * Fetch paginated batch list with optional filters, search and sort.
 * @param page    - 1-based page number
 * @param limit   - Records per page
 * @param filters - Optional filter fields
 * @param sort    - Optional sort config (defaults to createdOn desc)
 */
export const fetchAllBatches = (
  page   : number       = 1,
  limit  : number       = 10,
  filters: BatchFilters = {},
  sort   : BatchSort    = { field: "createdOn", order: "desc" }
) => {
  // Strip undefined / empty — server expects {} for "no filters"
  const cleanFilters: Record<string, string | string[]> = {};
  (Object.entries(filters) as [string, string | string[] | undefined][]).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (typeof val === "string" && val.trim() === "") return;
    if (Array.isArray(val) && val.length === 0) return;
    cleanFilters[key] = val as string | string[];
  });

  const payload = {
    pagination: { page, limit },
    filters   : cleanFilters,
    sort      : {
      field: sort.field ?? "createdOn",
      order: sort.order ?? "desc",
    },
  };

  return post(BATCH_MANAGEMENT.GET_ALL_BATCHES, payload);
};

/* ─────────────────────────────────────────────────────────────────────────────
   FETCH BATCH BY ID
   POST  →  { batchId }
───────────────────────────────────────────────────────────────────────────── */

/**
 * Fetch full details of a single batch.
 * @param batchId - e.g. "BATCH102"
 */
export const fetchBatchById = (batchId: string) =>
  post(BATCH_MANAGEMENT.GET_BATCH_BY_ID, { batchId });

/* ─────────────────────────────────────────────────────────────────────────────
   CREATE BATCH (Step 1: Basic Details)
   POST → Two-step workflow:
   Step 1: Create batch with basic details (batchType, projectId, motorType, etc.)
           identificationSheet is OPTIONAL in create
   Step 2: Update batch with implementation details via updateBatch endpoint
───────────────────────────────────────────────────────────────────────────── */

export interface CreateBatchPayloadAPI {
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorStage?         : string | number;
  numberOfMotors?     : number;
  motorIds?           : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: Record<string, unknown>;
  objective?          : string;
  articles?           : string[];
}

/**
 * Create a new batch (Step 1).
 * @param payload - Batch creation fields
 */
export const createBatch = (payload: CreateBatchPayloadAPI) =>
  post(BATCH_MANAGEMENT.CREATE_BATCH, payload);

/* ─────────────────────────────────────────────────────────────────────────────
   UPDATE BATCH (Step 2: Implementation Details)
   PUT  →  Used to update batch with implementation details (identificationSheet)
           Can also update other fields like priority, systemManagerId if needed
───────────────────────────────────────────────────────────────────────────── */

export interface UpdateBatchPayloadAPI {
  batchId             : string;
  batchType           : string;
  subBatchType?       : string;
  projectId?          : string | null;
  motorStage?         : string | number;
  numberOfMotors?     : number;
  motorIds?           : string[];
  priority            : string;
  systemManagerId     : string;
  identificationSheet?: Record<string, unknown>;
  objective?          : string;
  articles?           : string[];
}

/**
 * Update an existing batch (PUT body includes batchId per API contract).
 */
export const updateBatch = (payload: UpdateBatchPayloadAPI) =>
  put(BATCH_MANAGEMENT.UPDATE_BATCH, payload);

/* ─────────────────────────────────────────────────────────────────────────────
   DELETE BATCH
   DELETE  →  { batchId, reason }
───────────────────────────────────────────────────────────────────────────── */

/**
 * Delete a batch with a mandatory reason.
 * @param batchId - e.g. "BATCH102"
 * @param reason  - Human-readable deletion reason (required by the API)
 */
export const deleteBatch = (batchId: string, reason: string) =>
  del(BATCH_MANAGEMENT.DELETE_BATCH, { data: { batchId, reason } });