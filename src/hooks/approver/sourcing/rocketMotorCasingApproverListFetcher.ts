import rocketMotorCasingApproverController from "@controllers/approver/rocketMotorCasingApproverController";
import type { SubDepartmentListFetcher } from "@hooks/approver/subDepartmentListFetcher";
import { mapApiStatusCountKeyToUiTab, toOperationStatusApiValue } from "@hooks/operationStatus";

type CasingStatusCounts = Record<string, number | undefined>;

const mapCasingStatusCounts = (
  counts: CasingStatusCounts | undefined,
  allLabel: string,
  fallbackBatches: Record<string, unknown>[],
) => {
  const mapped: Record<string, number> = {
    [allLabel]: 0,
  };

  Object.entries(counts ?? {}).forEach(([key, value]) => {
    const tab = mapApiStatusCountKeyToUiTab(key);
    if (tab) {
      mapped[tab] = (mapped[tab] ?? 0) + (value ?? 0);
      mapped[allLabel] += value ?? 0;
    }
  });

  fallbackBatches.forEach((batch) => {
    if (!batch.status) {
      return;
    }
    const displayStatus = String(batch.status);
    const tab = mapApiStatusCountKeyToUiTab(displayStatus) ?? displayStatus;
    if (mapped[tab] === undefined) {
      mapped[tab] = fallbackBatches.filter((item) => item.status === batch.status).length;
    }
  });

  if ((counts == null || Object.keys(counts).length === 0) && fallbackBatches.length > 0) {
    mapped[allLabel] = fallbackBatches.length;
  }

  return mapped;
};

export const fetchRocketMotorCasingApproverList: SubDepartmentListFetcher = async ({
  subDepartmentId,
  page,
  limit,
  status,
  allLabel,
  search,
  extraFilters,
}) => {
  const apiStatus = status !== allLabel ? toOperationStatusApiValue(status, allLabel) : null;
  const fromDate = String(extraFilters.fromDate ?? "").trim();
  const toDate = String(extraFilters.toDate ?? "").trim();
  const motorStage = String(extraFilters.motorStage ?? "").trim();
  const casingType = String(extraFilters.casingType ?? "").trim();
  const insulationType = String(extraFilters.insulationType ?? "").trim();

  const payload = {
    subDepartmentId,
    page,
    limit,
    ...(apiStatus ? { status: [apiStatus] } : {}),
    ...(motorStage && motorStage !== allLabel ? { motorStage: [motorStage] } : {}),
    ...(casingType && casingType !== allLabel ? { casingType: [casingType] } : {}),
    ...(insulationType && insulationType !== allLabel ? { insulationType: [insulationType] } : {}),
    ...(search ? { search } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const response = await rocketMotorCasingApproverController.fetchCasingList(payload);
  if (!response.success || !response.data) return null;

  const batches = (response.data.casings ?? []) as unknown as Record<string, unknown>[];
  return {
    batches,
    pagination: {
      page: response.data.pagination?.page ?? page,
      limit: response.data.pagination?.limit ?? limit,
      totalRecords: response.data.pagination?.totalRecords ?? batches.length,
      totalPages: response.data.pagination?.totalPages ?? 1,
    },
    statusCounts: mapCasingStatusCounts(
      response.data.statusCounts as CasingStatusCounts | undefined,
      allLabel,
      batches,
    ),
  };
};

export default fetchRocketMotorCasingApproverList;
