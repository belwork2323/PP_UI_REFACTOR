import rawMaterialSourcingApproverController from "@controllers/approver/sourcing/rms/rawMaterialSourcingApproverController";
import {
  mapRawMaterialApproverStatusCountsForUi,
  mapRawMaterialSourcingApproverListItem,
  toRawMaterialApproverListApiStatus,
} from "@data/models/approver/sourcing/rms/RawMaterialSourcingApproverModel";
import type { SubDepartmentListFetcher } from "@hooks/approver/subDepartmentListFetcher";
import { approverRowMatchesSearchQuery } from "@data/models/approver/ApproverBatchListModel";

const CLIENT_SEARCH_FETCH_LIMIT = 5000;
const SEARCH_KEYS = [
  "lotId",
  "sourcingId",
  "materialCode",
  "materialName",
  "supplyOrderNo",
  "receiptDate",
  "manufacturerName",
  "status",
  "submittedBy",
  "createdOn",
];

export const fetchRawMaterialSourcingApproverList: SubDepartmentListFetcher = async ({
  subDepartmentId,
  page,
  limit,
  status,
  allLabel,
  search,
  extraFilters,
}) => {
  const apiStatus =
    status !== allLabel ? toRawMaterialApproverListApiStatus(status, allLabel) : null;
  const materialCode = String(extraFilters.materialCode ?? "").trim();
  const manufacturerName = String(extraFilters.manufacturer ?? "").trim();
  const fromDate = String(extraFilters.fromDate ?? "").trim();
  const toDate = String(extraFilters.toDate ?? "").trim();
  const isClientSearch = Boolean(search.trim());

  const payload = {
    subDepartmentId,
    page: isClientSearch ? 1 : page,
    limit: isClientSearch ? CLIENT_SEARCH_FETCH_LIMIT : limit,
    ...(apiStatus ? { status: [apiStatus] } : {}),
    ...(materialCode && materialCode !== allLabel ? { materialCode: [materialCode] } : {}),
    ...(manufacturerName ? { manufacturerName } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const response = await rawMaterialSourcingApproverController.fetchLotList(payload);
  if (!response.success || !response.data) return null;

  const fetchedLots = (response.data.lots ?? []).map((lot, index) =>
    mapRawMaterialSourcingApproverListItem(lot, index),
  );
  const matchingLots = isClientSearch
    ? fetchedLots.filter((lot) =>
        approverRowMatchesSearchQuery(lot, search, SEARCH_KEYS),
      )
    : fetchedLots;
  const lots = isClientSearch
    ? matchingLots.slice((page - 1) * limit, page * limit)
    : matchingLots;
  const totalRecords = isClientSearch
    ? matchingLots.length
    : response.data.pagination?.totalRecords ?? lots.length;
  return {
    batches: lots as unknown as Record<string, unknown>[],
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    statusCounts: mapRawMaterialApproverStatusCountsForUi(
      response.data.statusCounts,
      allLabel,
      totalRecords,
    ),
  };
};

export default fetchRawMaterialSourcingApproverList;
