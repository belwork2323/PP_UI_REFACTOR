import rocketMotorCasingApproverController from "@controllers/approver/rocketMotorCasingApproverController";
import type { SubDepartmentListFetcher } from "@hooks/approver/subDepartmentListFetcher";
import { mapRocketMotorCasingListRow } from "@hooks/user/sourcing/useRocketMotorCasingList";
import { rocketMotorCasingMatchesSearch } from "@data/models/user/RocketMotorCasingProcurementModel";
import { mapApiStatusCountKeyToUiTab, toOperationStatusApiValue } from "@hooks/operationStatus";

const CLIENT_SEARCH_FETCH_LIMIT = 5000;

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

  const isClientSearch = Boolean(search.trim());
  const payload = {
    subDepartmentId,
    page: isClientSearch ? 1 : page,
    limit: isClientSearch ? CLIENT_SEARCH_FETCH_LIMIT : limit,
    ...(apiStatus ? { status: [apiStatus] } : {}),
    ...(motorStage && motorStage !== allLabel ? { motorStage: [motorStage] } : {}),
    ...(casingType && casingType !== allLabel ? { casingType: [casingType] } : {}),
    ...(insulationType && insulationType !== allLabel ? { insulationType: [insulationType] } : {}),
    ...(fromDate ? { fromDate } : {}),
    ...(toDate ? { toDate } : {}),
  };

  const response = await rocketMotorCasingApproverController.fetchCasingList(payload);
  if (!response.success || !response.data) return null;

  const fetchedBatches = ((response.data.casings ?? []) as unknown as Record<string, unknown>[]).map(
    (batch) => {
      const stage = String(
        batch.motorStage ?? batch.motorStageName ?? batch.motorType ?? batch.stage ?? "",
      ).trim();
      return {
        ...batch,
        motorStageLabel: stage
          ? /^stage\b/i.test(stage)
            ? stage
            : `Stage ${stage}`
          : "",
      };
    },
  );
  const matchingBatches = isClientSearch
    ? fetchedBatches.filter((batch) =>
        rocketMotorCasingMatchesSearch(mapRocketMotorCasingListRow(batch), search),
      )
    : fetchedBatches;
  const batches = isClientSearch
    ? matchingBatches.slice((page - 1) * limit, page * limit)
    : matchingBatches;
  const totalRecords = isClientSearch
    ? matchingBatches.length
    : response.data.pagination?.totalRecords ?? batches.length;
  return {
    batches,
    pagination: {
      page,
      limit,
      totalRecords,
      totalPages: Math.max(1, Math.ceil(totalRecords / limit)),
    },
    statusCounts: mapCasingStatusCounts(
      response.data.statusCounts as CasingStatusCounts | undefined,
      allLabel,
      isClientSearch ? matchingBatches : batches,
    ),
  };
};

export default fetchRocketMotorCasingApproverList;
