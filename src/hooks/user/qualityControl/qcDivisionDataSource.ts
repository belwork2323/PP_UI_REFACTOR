import {
  applyStatusMapsToPartialNav,
  mapDivisionDetailsToPartialNav,
  normalizePartialItemStatus,
  qcDivisionStatusKeysMatch,
  type QcPartialItemStatus,
  type QcPartialNavItem,
} from "./qcDivisionApprovalUnits";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    const s = String(value ?? "").trim();
    if (s) return s;
  }
  return "";
};

/** Unit/division still waiting for first QC entry — seed from division-details. */
export const isQcStatusAwaitingInitiation = (status: unknown): boolean =>
  normalizePartialItemStatus(status) === "TO_BE_INITIATED";

export const resolveMotorQcStatusFromFormDetails = (
  payload: unknown,
  motorId: string,
  division?: string | null,
): QcPartialItemStatus | null => {
  const root = asRecord(payload);
  const normalizedMotorId = String(motorId ?? "").trim();
  const normalizedDivision = String(division ?? "").trim().toUpperCase();
  if (!root || !normalizedMotorId) return null;

  for (const row of asArray(root.motorStatuses)) {
    const rec = asRecord(row);
    if (!rec) continue;
    if (pickString(rec.motorId, rec.motorIdNo, rec.motor_id) !== normalizedMotorId) continue;
    const rowDivision = pickString(rec.division);
    if (
      normalizedDivision &&
      rowDivision &&
      !qcDivisionStatusKeysMatch(rowDivision, normalizedDivision)
    ) {
      continue;
    }
    return normalizePartialItemStatus(rec.status ?? rec.motorSubmissionStatus);
  }

  // Fallback: nested division details / postCureMotorDetails motorSubmissionStatus.
  for (const detail of asArray(root.divisionDetails)) {
    const detailRec = asRecord(detail);
    if (!detailRec) continue;
    const detailDivision = pickString(detailRec.division);
    if (
      normalizedDivision &&
      detailDivision &&
      !qcDivisionStatusKeysMatch(detailDivision, normalizedDivision)
    ) {
      continue;
    }
    const data = asRecord(detailRec.data) ?? detailRec;
    for (const motor of [
      ...asArray(data.postCureMotorDetails),
      ...asArray(data.motors),
      ...asArray(data.motorDetails),
      ...asArray(data.trimmingDetails),
      ...asArray(data.deCoringDetails),
      ...asArray(data.decoringDetails),
      ...asArray(data.curingDetails),
    ]) {
      const motorRec = asRecord(motor);
      if (!motorRec) continue;
      if (
        pickString(motorRec.motorIdNo, motorRec.motorId, motorRec.id) !== normalizedMotorId
      ) {
        continue;
      }
      const status = motorRec.motorSubmissionStatus ?? motorRec.status ?? motorRec.motor_submission_status;
      if (status != null && String(status).trim()) {
        return normalizePartialItemStatus(status);
      }
    }
  }

  return null;
};

export const resolvePremixQcStatusFromFormDetails = (
  payload: unknown,
  premixNo: number,
): QcPartialItemStatus | null => {
  const root = asRecord(payload);
  if (!root || !Number.isFinite(premixNo)) return null;

  for (const row of asArray(root.premixStatuses)) {
    const rec = asRecord(row);
    if (!rec) continue;
    const rowPremixNo = pickNumber(rec.premixNo, rec.premix_no);
    if (rowPremixNo !== premixNo) continue;
    return normalizePartialItemStatus(rec.status ?? rec.premixSubmissionStatus);
  }

  return null;
};

/** Once past initiation, show saved QC form data from /qc-division/details. */
export const shouldUseQcFormDetailsData = (status: unknown): boolean =>
  !isQcStatusAwaitingInitiation(status);

export const resolveQcDivisionStatusLookupKey = (params: {
  flowKey: string;
  rawMaterialType?: string | null;
}): string => {
  const flowKey = String(params.flowKey ?? "").trim();
  const typeKey = String(params.rawMaterialType ?? "").trim();
  if (flowKey === "RAW_MATERIAL" && typeKey) return typeKey;
  return typeKey || flowKey;
};

export const resolveQcDivisionStatus = (
  statusByKey: Record<string, QcPartialItemStatus> | null | undefined,
  params: { flowKey: string; rawMaterialType?: string | null },
): QcPartialItemStatus => {
  const map = statusByKey ?? {};
  const primary = resolveQcDivisionStatusLookupKey(params);
  const flowKey = String(params.flowKey ?? "").trim();
  const typeKey = String(params.rawMaterialType ?? "").trim();
  return normalizePartialItemStatus(
    map[primary] ?? map[typeKey] ?? map[flowKey] ?? "TO_BE_INITIATED",
  );
};

/** Prefer local status map; fall back to /qc-division/details divisionStatuses. */
export const resolveQcDivisionStatusFromSources = (params: {
  statusByKey?: Record<string, QcPartialItemStatus> | null;
  formDetails?: unknown;
  flowKey: string;
  rawMaterialType?: string | null;
}): QcPartialItemStatus => {
  const fromMap = resolveQcDivisionStatus(params.statusByKey, {
    flowKey: params.flowKey,
    rawMaterialType: params.rawMaterialType,
  });
  if (!isQcStatusAwaitingInitiation(fromMap)) return fromMap;

  const root = asRecord(params.formDetails);
  if (!root || !Array.isArray(root.divisionStatuses)) return fromMap;

  const lookupKey = resolveQcDivisionStatusLookupKey({
    flowKey: params.flowKey,
    rawMaterialType: params.rawMaterialType,
  });
  for (const row of root.divisionStatuses) {
    const rec = asRecord(row);
    if (!rec) continue;
    const key = String(rec.division ?? "").trim();
    if (!key) continue;
    if (
      key === lookupKey ||
      qcDivisionStatusKeysMatch(key, lookupKey) ||
      key === String(params.flowKey ?? "").trim() ||
      key === String(params.rawMaterialType ?? "").trim()
    ) {
      return normalizePartialItemStatus(rec.status);
    }
  }

  const matchingDetail = findQcFormDivisionDetail(params.formDetails, {
    flowKey: params.flowKey,
    rawMaterialType: params.rawMaterialType,
  });
  if (matchingDetail) {
    const detailStatus = normalizePartialItemStatus(
      matchingDetail.status ?? matchingDetail.divisionSubmissionStatus,
    );
    if (!isQcStatusAwaitingInitiation(detailStatus)) return detailStatus;
  }

  return fromMap;
};

/** Match a form-details divisionDetails entry to the selected QC division tab. */
export const findQcFormDivisionDetail = (
  formDetails: unknown,
  params: { flowKey: string; rawMaterialType?: string | null },
): Record<string, unknown> | null => {
  const root = asRecord(formDetails);
  if (!root) return null;
  const details = asArray(root.divisionDetails);
  const flowKey = String(params.flowKey ?? "").trim().toUpperCase();
  const typeKey = String(params.rawMaterialType ?? "").trim().toUpperCase();

  const matches = (detail: Record<string, unknown>): boolean => {
    const division = String(detail.division ?? "").trim().toUpperCase();
    const subType = String(detail.subType ?? detail.sub_type ?? "").trim().toUpperCase();

    if (typeKey === "RAW_MATERIAL_REVALIDATION") {
      return (
        division === "RAW_MATERIAL_REVALIDATION" ||
        (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_REVALIDATION")
      );
    }
    if (typeKey === "RAW_MATERIAL_PROCESSING") {
      return (
        division === "RAW_MATERIAL_PROCESSING" ||
        (division === "RAW_MATERIAL" && subType === "RAW_MATERIAL_PROCESSING") ||
        subType === "SOLID_PROCESSING" ||
        subType === "LIQUID_PROCESSING"
      );
    }
    if (flowKey === "QC" || flowKey === "PROPELLANT_PROPERTIES") {
      return division === "QC" || division === "PROPELLANT_PROPERTIES";
    }
    if (flowKey === "WEIGHTMENT" || flowKey === "WEIGHMENT") {
      return division === "WEIGHTMENT" || division === "WEIGHMENT";
    }
    if (flowKey === "POST_CURE") {
      return division === "POST_CURE" || division === "POST_CURE_OPERATION";
    }
    return (
      qcDivisionStatusKeysMatch(division, flowKey) ||
      qcDivisionStatusKeysMatch(subType, flowKey) ||
      division === flowKey
    );
  };

  for (const row of details) {
    const rec = asRecord(row);
    if (rec && matches(rec)) return rec;
  }
  return null;
};

/** Payload shape expected by processing / revalidation seed parsers. */
export const toDivisionAutoPopulateRecord = (
  detailOrPayload: unknown,
): Record<string, unknown> | null => {
  const rec = asRecord(detailOrPayload);
  if (!rec) return null;
  const nestedData = asRecord(rec.data);
  const hasDivisionData = (value: Record<string, unknown> | null) =>
    Boolean(
      value &&
        (value.premixes != null ||
          value.sections != null ||
          value.materials != null ||
          value.motorDetails != null ||
          value.motors != null ||
          value.trimmingDetails != null ||
          value.deCoringDetails != null ||
          value.decoringDetails != null ||
          value.curingDetails != null ||
          value.postCureMotorDetails != null ||
          value.motorWeightDetails != null ||
          value.weighscaleDetails != null),
    );

  if (hasDivisionData(nestedData)) return nestedData;
  if (hasDivisionData(rec)) return rec;
  return nestedData ?? rec;
};

const matchesStatusDivision = (
  rowDivision: string,
  rowSubType: string,
  filter: string,
): boolean => {
  if (!filter) return true;
  if (!rowDivision && !rowSubType) return true;
  if (qcDivisionStatusKeysMatch(rowDivision, filter) || qcDivisionStatusKeysMatch(rowSubType, filter)) {
    return true;
  }
  const upperFilter = filter.toUpperCase();
  const upperDivision = rowDivision.toUpperCase();
  const upperSubType = rowSubType.toUpperCase();
  if (upperFilter.includes("PROCESSING")) {
    return (
      upperDivision === "RAW_MATERIAL" ||
      upperDivision === "RAW_MATERIAL_PROCESSING" ||
      upperDivision.includes("PROCESSING") ||
      upperSubType === "RAW_MATERIAL_PROCESSING" ||
      upperSubType.includes("PROCESSING")
    );
  }
  if (upperFilter.includes("REVALIDATION")) {
    return (
      upperDivision === "RAW_MATERIAL" ||
      upperDivision === "RAW_MATERIAL_REVALIDATION" ||
      upperDivision.includes("REVALIDATION") ||
      upperSubType === "RAW_MATERIAL_REVALIDATION" ||
      upperSubType.includes("REVALIDATION")
    );
  }
  if (upperFilter === "QC" || upperFilter === "PROPELLANT_PROPERTIES") {
    return upperDivision === "QC" || upperDivision === "PROPELLANT_PROPERTIES";
  }
  if (upperFilter === "WEIGHTMENT" || upperFilter === "WEIGHMENT") {
    return upperDivision === "WEIGHTMENT" || upperDivision === "WEIGHMENT";
  }
  if (upperFilter === "POST_CURE" || upperFilter === "POST_CURE_OPERATION") {
    return upperDivision === "POST_CURE" || upperDivision === "POST_CURE_OPERATION";
  }
  return false;
};

/** Map each unit status row to exactly one QC division tab key. */
export const resolveUnitStatusTabKey = (params: {
  division?: string | null;
  subType?: string | null;
  stageType?: string | null;
}): string | null => {
  const div = String(params.division ?? "")
    .trim()
    .toUpperCase();
  const sub = String(params.subType ?? "")
    .trim()
    .toUpperCase();
  const stage = String(params.stageType ?? "")
    .trim()
    .toUpperCase();

  if (div === "RAW_MATERIAL_PROCESSING" || sub === "RAW_MATERIAL_PROCESSING") {
    return "RAW_MATERIAL_PROCESSING";
  }
  if (div === "RAW_MATERIAL_REVALIDATION" || sub === "RAW_MATERIAL_REVALIDATION") {
    return "RAW_MATERIAL_REVALIDATION";
  }
  if (div === "RAW_MATERIAL" && sub) return sub;

  // Mixing units: MIXING division, or explicit premix/final-mix stage under mixing.
  if (div === "MIXING") return "MIXING";
  if ((stage === "PREMIX" || stage === "FINAL_MIX") && (!div || div === "MIXING")) {
    return "MIXING";
  }

  if (div === "PROPELLANT_PROPERTIES" || div === "QC") return "QC";
  if (div === "POST_CURE" || div === "POST_CURE_OPERATION") return "POST_CURE";
  if (div === "WEIGHMENT" || div === "WEIGHTMENT") return "WEIGHTMENT";
  if (div) return div;
  return null;
};

/** Premix 1 → Final Mix 1 → Premix 2 → Final Mix 2 (motors by id). */
export const compareQcPartialNavItems = (
  a: QcPartialNavItem,
  b: QcPartialNavItem,
): number => {
  if (a.kind === "MOTOR" || b.kind === "MOTOR") {
    if (a.kind === "MOTOR" && b.kind === "MOTOR") {
      return String(a.motorId ?? "").localeCompare(String(b.motorId ?? ""));
    }
    if (a.kind === "MOTOR") return 1;
    if (b.kind === "MOTOR") return -1;
  }

  const aNo = a.premixNo ?? a.finalMixNo ?? 0;
  const bNo = b.premixNo ?? b.finalMixNo ?? 0;
  if (aNo !== bNo) return aNo - bNo;

  const kindRank = (kind: QcPartialNavItem["kind"]) => {
    if (kind === "PREMIX") return 0;
    if (kind === "FINAL_MIX") return 1;
    return 2;
  };
  const rankDiff = kindRank(a.kind) - kindRank(b.kind);
  if (rankDiff !== 0) return rankDiff;
  return a.label.localeCompare(b.label);
};

/** Group form-details unit statuses by QC division tab key (one key per unit). */
export const groupUnitStatusesByDivisionTabKey = (payload: {
  motorStatuses?: unknown;
  premixStatuses?: unknown;
}): Record<string, QcPartialNavItem[]> => {
  const grouped: Record<string, QcPartialNavItem[]> = {};

  const push = (key: string | null, item: QcPartialNavItem) => {
    const normalized = String(key ?? "").trim().toUpperCase();
    if (!normalized) return;
    const list = grouped[normalized] ?? [];
    if (list.some((row) => row.id === item.id)) {
      // Prefer non-initiated status when duplicates appear.
      const idx = list.findIndex((row) => row.id === item.id);
      if (idx >= 0 && list[idx].status === "TO_BE_INITIATED" && item.status !== "TO_BE_INITIATED") {
        list[idx] = item;
      }
      return;
    }
    list.push(item);
    grouped[normalized] = list;
  };

  asArray(payload.motorStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const motorId = pickString(rec.motorId, rec.motor_id);
    if (!motorId) return;
    const division = String(rec.division ?? "").trim();
    const subType = String(rec.subType ?? rec.sub_type ?? "").trim();
    push(resolveUnitStatusTabKey({ division, subType }), {
      id: `motor:${motorId}`,
      kind: "MOTOR",
      label: motorId,
      status: normalizePartialItemStatus(rec.motorSubmissionStatus ?? rec.status),
      motorId,
    });
  });

  asArray(payload.premixStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const premixNo = pickNumber(rec.premixNo, rec.premix_no);
    if (premixNo == null) return;
    const division = String(rec.division ?? "").trim();
    const subType = String(rec.subType ?? rec.sub_type ?? "").trim();
    const stageType = String(rec.stageType ?? rec.stage_type ?? "").trim();
    const stage = stageType.toUpperCase();
    const tabKey = resolveUnitStatusTabKey({ division, subType, stageType });
    if (stage === "FINAL_MIX") {
      push(tabKey, {
        id: `final-mix:${premixNo}`,
        kind: "FINAL_MIX",
        label: `Final Mix ${premixNo}`,
        status: normalizePartialItemStatus(rec.premixSubmissionStatus ?? rec.status),
        finalMixNo: premixNo,
        premixNo,
      });
      return;
    }
    push(tabKey, {
      id: `premix:${premixNo}`,
      kind: "PREMIX",
      label: `Premix ${premixNo}`,
      status: normalizePartialItemStatus(rec.premixSubmissionStatus ?? rec.status),
      premixNo,
      processingType: "SOLID_PROCESSING",
    });
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key] = grouped[key].sort(compareQcPartialNavItems);
  });

  return grouped;
};

/** Weighment motors live in divisionDetails.data.motorWeightDetails when motorStatuses omits them. */
export const extractWeighmentMotorNavFromFormDetails = (
  payload: unknown,
): QcPartialNavItem[] => {
  const root = asRecord(payload);
  if (!root) return [];
  const items: QcPartialNavItem[] = [];
  const seen = new Set<string>();

  for (const detail of asArray(root.divisionDetails)) {
    const rec = asRecord(detail);
    if (!rec) continue;
    const division = String(rec.division ?? "")
      .trim()
      .toUpperCase();
    if (division !== "WEIGHTMENT" && division !== "WEIGHMENT") continue;
    const data = asRecord(rec.data) ?? rec;
    const divisionStatus = normalizePartialItemStatus(
      rec.divisionSubmissionStatus ?? rec.status,
    );
    for (const motor of [
      ...asArray(data.motorWeightDetails),
      ...asArray(data.motors),
      ...asArray(data.motorDetails),
    ]) {
      const motorRec = asRecord(motor);
      const motorId = pickString(motorRec?.motorId, motorRec?.motorIdNo, motorRec?.id);
      if (!motorId || seen.has(motorId)) continue;
      seen.add(motorId);
      items.push({
        id: `motor:${motorId}`,
        kind: "MOTOR",
        label: motorId,
        status: normalizePartialItemStatus(
          motorRec?.motorSubmissionStatus ?? motorRec?.status ?? divisionStatus,
        ),
        motorId,
      });
    }
  }

  return items.sort(compareQcPartialNavItems);
};

/** Build unit nav chips from /qc-division/details status arrays. */
export const buildPartialNavFromUnitStatusMaps = (payload: {
  motorStatuses?: unknown;
  premixStatuses?: unknown;
  division: string;
}): QcPartialNavItem[] => {
  const divisionFilter = String(payload.division ?? "").trim();
  const items: QcPartialNavItem[] = [];
  const seen = new Set<string>();

  asArray(payload.motorStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const division = String(rec.division ?? "").trim();
    const subType = String(rec.subType ?? rec.sub_type ?? "").trim();
    if (!matchesStatusDivision(division, subType, divisionFilter)) return;
    const motorId = pickString(rec.motorId, rec.motor_id);
    if (!motorId) return;
    const id = `motor:${motorId}`;
    if (seen.has(id)) return;
    seen.add(id);
    items.push({
      id,
      kind: "MOTOR",
      label: motorId,
      status: normalizePartialItemStatus(rec.motorSubmissionStatus ?? rec.status),
      motorId,
    });
  });

  asArray(payload.premixStatuses).forEach((row) => {
    const rec = asRecord(row);
    if (!rec) return;
    const division = String(rec.division ?? "").trim();
    const subType = String(rec.subType ?? rec.sub_type ?? "").trim();
    // Skip mixing-stage rows when resolving raw-material processing units.
    const stage = String(rec.stageType ?? rec.stage_type ?? "")
      .trim()
      .toUpperCase();
    const filterUpper = divisionFilter.toUpperCase();
    if (
      filterUpper.includes("PROCESSING") &&
      (stage === "PREMIX" || stage === "FINAL_MIX") &&
      division.toUpperCase() === "MIXING"
    ) {
      return;
    }
    if (!matchesStatusDivision(division, subType, divisionFilter)) return;
    const premixNo = pickNumber(rec.premixNo, rec.premix_no);
    if (premixNo == null) return;
    if (stage === "FINAL_MIX") {
      const id = `final-mix:${premixNo}`;
      if (seen.has(id)) return;
      seen.add(id);
      items.push({
        id,
        kind: "FINAL_MIX",
        label: `Final Mix ${premixNo}`,
        status: normalizePartialItemStatus(rec.premixSubmissionStatus ?? rec.status),
        finalMixNo: premixNo,
        premixNo,
      });
      return;
    }
    // Mixing PREMIX stage rows belong only to MIXING tabs.
    if (stage === "PREMIX" && !filterUpper.includes("MIXING") && division.toUpperCase() === "MIXING") {
      return;
    }
    const id = `premix:${premixNo}`;
    if (seen.has(id)) return;
    seen.add(id);
    items.push({
      id,
      kind: "PREMIX",
      label: `Premix ${premixNo}`,
      status: normalizePartialItemStatus(rec.premixSubmissionStatus ?? rec.status),
      premixNo,
      processingType: "SOLID_PROCESSING",
    });
  });

  return items.sort(compareQcPartialNavItems);
};

export const mergePartialNavItems = (
  primary: QcPartialNavItem[],
  secondary: QcPartialNavItem[],
): QcPartialNavItem[] => {
  const byId = new Map<string, QcPartialNavItem>();
  secondary.forEach((item) => byId.set(item.id, item));
  primary.forEach((item) => {
    const existing = byId.get(item.id);
    byId.set(
      item.id,
      existing
        ? {
            ...existing,
            ...item,
            status: item.status || existing.status,
            divisionDetailsStatus:
              item.divisionDetailsStatus ??
              existing.divisionDetailsStatus ??
              item.status ??
              existing.status,
          }
        : item,
    );
  });
  return Array.from(byId.values()).sort(compareQcPartialNavItems);
};

/** Prerequisite approval status always comes from manufacturing `/division-details`. */
const applyManufacturingPrerequisiteStatuses = (
  items: QcPartialNavItem[],
  autoPopulatePayload: unknown,
  options: {
    flowKey: string;
    rawMaterialType?: string | null;
    batchPayload?: unknown;
  },
): QcPartialNavItem[] => {
  const root = asRecord(autoPopulatePayload);
  const manufacturingPayload = root?.__manufacturingDivisionData;
  if (!manufacturingPayload) return items;

  const fromManufacturing = mapDivisionDetailsToPartialNav(manufacturingPayload, {
    flowKey: options.flowKey,
    rawMaterialType: options.rawMaterialType,
    batchPayload: options.batchPayload,
  });
  if (!fromManufacturing.length) return items;

  const mfgStatusById = new Map<string, QcPartialItemStatus>();
  fromManufacturing.forEach((item) => {
    mfgStatusById.set(item.id, item.divisionDetailsStatus ?? item.status);
  });

  return items.map((item) => {
    const mfgStatus = mfgStatusById.get(item.id);
    if (!mfgStatus) return item;
    return { ...item, divisionDetailsStatus: mfgStatus };
  });
};

export const buildQcDivisionPartialNav = (params: {
  flowKey: string;
  rawMaterialType?: string | null;
  autoPopulatePayload?: unknown;
  batchPayload?: unknown;
  motorStatuses?: unknown;
  premixStatuses?: unknown;
}): QcPartialNavItem[] => {
  const typeKey = String(params.rawMaterialType ?? "").trim();
  const statusDivisionKey =
    params.flowKey === "RAW_MATERIAL" && typeKey
      ? typeKey
      : typeKey || params.flowKey;

  const fromPayload = mapDivisionDetailsToPartialNav(params.autoPopulatePayload, {
    flowKey: params.flowKey,
    rawMaterialType: typeKey,
    batchPayload: params.batchPayload,
  });
  const fromStatuses = buildPartialNavFromUnitStatusMaps({
    motorStatuses: params.motorStatuses,
    premixStatuses: params.premixStatuses,
    division: statusDivisionKey,
  });
  const merged = mergePartialNavItems(fromStatuses, fromPayload);
  const withManufacturingPrerequisites = applyManufacturingPrerequisiteStatuses(
    merged,
    params.autoPopulatePayload,
    {
      flowKey: params.flowKey,
      rawMaterialType: typeKey,
      batchPayload: params.batchPayload,
    },
  );
  return applyStatusMapsToPartialNav(withManufacturingPrerequisites, {
    motorStatuses: params.motorStatuses,
    premixStatuses: params.premixStatuses,
    division: statusDivisionKey,
  });
};
