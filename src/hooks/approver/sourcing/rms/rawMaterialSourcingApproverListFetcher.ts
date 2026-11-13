import rawMaterialSourcingApproverController from "@controllers/approver/sourcing/rms/rawMaterialSourcingApproverController";
import {
  mapRawMaterialApproverStatusCountsForUi,
  mapRawMaterialSourcingApproverListItem,
  toRawMaterialApproverListApiStatus,
} from "@data/models/approver/sourcing/rms/RawMaterialSourcingApproverModel";
import type { SubDepartmentListFetcher } from "@hooks/approver/subDepartmentListFetcher";

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
  const fromDate = String(extraFilters.fromDate ?? "").trim();
  const toDate = String(extraFilters.toDate ?? "").trim();

  const payload = {
    subDepartmentId,
    page,
    limit,
    ...(apiStatus ? { status: [apiStatus] } : {}),
    ...(materialCode && materialCode !== allLabel ? { materialCode: [materialCode] } : {}),
    ...(search ? { search } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const response = await rawMaterialSourcingApproverController.fetchLotList(payload);
  if (!response.success || !response.data) return null;

  const lots = response.data.lots ?? [];
  const totalRecords = response.data.pagination?.totalRecords ?? lots.length;
  return {
    batches: lots.map((lot, index) =>
      mapRawMaterialSourcingApproverListItem(lot, index),
    ) as unknown as Record<string, unknown>[],
    pagination: {
      page: response.data.pagination?.page ?? page,
      limit: response.data.pagination?.limit ?? limit,
      totalRecords,
      totalPages: response.data.pagination?.totalPages ?? 1,
    },
    statusCounts: mapRawMaterialApproverStatusCountsForUi(
      response.data.statusCounts,
      allLabel,
      totalRecords,
    ),
  };
};

export default fetchRawMaterialSourcingApproverList;
