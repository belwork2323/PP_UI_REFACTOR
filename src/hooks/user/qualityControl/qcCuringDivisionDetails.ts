import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import type { QcApiSubType } from "../../../schema-engine/adapters/qc.adapter";
import { formatToUiDate, UI_DATETIME_FORMAT } from "../../../utils/dateUtils";
import {
  createInitialCuringValues,
  getCuringSetupField,
  hydrateCuringValuesFromSections,
  mapApiCuringCycleRowToForm,
  mapApiSubscaleCuringTableToParameterRows,
  setCuringSetupField,
  type QcCuringCycleRow,
  type QcCuringSubscaleParameterRow,
} from "./qcCuringTables";
import {
  formatQcCuringMotorStageLabel,
  getQcCuringTypeLabel,
  normalizeQcCuringType,
  QC_CURING_SECTION_IDS,
  type QcCuringSubType,
} from "./qcCuringConfig";
import { resolveManufacturingDivisionDetailsPayload } from "./qcHardwareDivisionDetails";

type ManufacturingSection = {
  sectionId: string;
  sectionData: unknown[];
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const hasValue = (value: unknown) => Boolean(String(value ?? "").trim());

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const isValueEmpty = (value: unknown): boolean => {
  if (value == null) return true;
  if (typeof value === "string") return !value.trim();
  if (Array.isArray(value)) {
    return !value.some(
      (row) =>
        row &&
        typeof row === "object" &&
        Object.entries(row as Record<string, unknown>).some(
          ([field, fieldValue]) =>
            field !== "SR_NO" &&
            field !== "TEMPERATURE" &&
            field !== "DURATION" &&
            field !== "PARAMETER" &&
            hasValue(fieldValue),
        ),
    );
  }
  return !hasValue(value);
};

const normalizeTimeValue = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

const formatManufacturingDateTime = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const dmyTime = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::\d{2})?)?$/);
  if (dmyTime) {
    const date = `${dmyTime[1].padStart(2, "0")}-${dmyTime[2].padStart(2, "0")}-${dmyTime[3]}`;
    if (dmyTime[4] != null) {
      return `${date} ${dmyTime[4].padStart(2, "0")}:${dmyTime[5]}`;
    }
    return date;
  }

  if (raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      if (/[T\s]\d{1,2}:\d{2}/.test(raw)) return parsed.format(UI_DATETIME_FORMAT);
      return parsed.format("DD-MM-YYYY");
    }
  }

  return formatToUiDate(raw) || raw;
};

const findCuringMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  if (!root) return null;

  const details =
    asRecord(root.castingCuringDetails) ?? asRecord(root.data) ?? root;
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  for (const motor of asArray(details.motors ?? details.curingDetails ?? root.motors ?? root.curingDetails)) {
    const rec = asRecord(motor);
    if (!rec) continue;
    const id = String(rec.motorId ?? rec.motorIdNo ?? rec.id ?? "").trim();
    if (id === normalizedMotorId) return rec;
  }
  return null;
};

const extractMotorSections = (motor: Record<string, unknown> | null): ManufacturingSection[] => {
  if (!motor) return [];
  const details = asRecord(motor.details) ?? motor;

  // Manufacturing shape: details.curingSections is a nested object, not a section array.
  const nested =
    asRecord(details.curingSections) ??
    (!Array.isArray(motor.curingSections) ? asRecord(motor.curingSections) : null);
  if (nested) {
    const sections: ManufacturingSection[] = [];
    const cycles = asRecord(nested.curingCycles);
    const cycleTable = asArray(cycles?.curingTable ?? cycles?.CURING_TABLE);
    if (cycleTable.length) {
      sections.push({ sectionId: "CURING_TABLE", sectionData: cycleTable });
    }
    const post = asRecord(nested.postCuringDetails) ?? asRecord(nested.POST_CURING_DETAILS);
    if (post) {
      sections.push({ sectionId: "POST_CURING_DETAILS", sectionData: [post] });
    }
    return sections;
  }

  const sections = asArray(
    details.curingSections ?? details.sections ?? motor.curingSections ?? motor.sections,
  );
  return sections
    .map((section) => asRecord(section))
    .filter(Boolean)
    .map((section) => ({
      sectionId: String(section!.sectionId ?? "").trim(),
      sectionData: asArray(section!.sectionData),
    }))
    .filter((section) => section.sectionId);
};

const firstSectionRecord = (
  sections: ManufacturingSection[],
  sectionId: string,
): Record<string, unknown> | null => {
  const match = sections.find((section) => section.sectionId === sectionId);
  return asRecord(asArray(match?.sectionData)[0]) ?? null;
};

const deepFindTableRows = (
  source: unknown,
  tableId: string,
  depth = 0,
): Record<string, unknown>[] => {
  if (depth > 6 || source == null) return [];
  if (Array.isArray(source)) {
    for (const item of source) {
      const found = deepFindTableRows(item, tableId, depth + 1);
      if (found.length) return found;
    }
    return [];
  }
  const rec = asRecord(source);
  if (!rec) return [];
  const direct = rec[tableId];
  if (Array.isArray(direct)) {
    return direct.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  }
  if (direct && typeof direct === "object") {
    const nested = asArray((direct as Record<string, unknown>).rows);
    if (nested.length) {
      return nested.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
    }
  }
  for (const child of Object.values(rec)) {
    const found = deepFindTableRows(child, tableId, depth + 1);
    if (found.length) return found;
  }
  return [];
};

const sectionsLookLikeQcCuring = (sections: ManufacturingSection[]) =>
  sections.some((section) =>
    Object.values(QC_CURING_SECTION_IDS).includes(
      section.sectionId as (typeof QC_CURING_SECTION_IDS)[keyof typeof QC_CURING_SECTION_IDS],
    ),
  );

const mapCycleRowsFromManufacturing = (sections: ManufacturingSection[]): QcCuringCycleRow[] => {
  const tableSection = sections.find(
    (section) =>
      section.sectionId === "CURING_TABLE" ||
      section.sectionId === "CURING_CYCLES" ||
      section.sectionId === QC_CURING_SECTION_IDS.CYCLE_DETAILS,
  );
  if (tableSection?.sectionId === "CURING_TABLE") {
    const directRows = tableSection.sectionData
      .map((row) => asRecord(row))
      .filter((row): row is Record<string, unknown> => Boolean(row));
    if (
      directRows.length &&
      (directRows[0].temperature != null ||
        directRows[0].TEMPERATURE != null ||
        directRows[0].srNo != null ||
        directRows[0].time != null)
    ) {
      return directRows.map((row, index) => mapApiCuringCycleRowToForm(row, index));
    }
  }

  const cyclesSection =
    firstSectionRecord(sections, "CURING_CYCLES") ??
    firstSectionRecord(sections, QC_CURING_SECTION_IDS.CYCLE_DETAILS) ??
    firstSectionRecord(sections, "CURING_TABLE");
  const rows =
    deepFindTableRows(cyclesSection ?? sections, "curingTable").length
      ? deepFindTableRows(cyclesSection ?? sections, "curingTable")
      : deepFindTableRows(cyclesSection ?? sections, "CURING_TABLE").length
        ? deepFindTableRows(cyclesSection ?? sections, "CURING_TABLE")
        : deepFindTableRows(cyclesSection ?? sections, "CURING_CYCLE_DETAILS");
  const sourceRows = rows.length
    ? rows
    : deepFindTableRows(sections, "CURING_CYCLE_DETAILS");
  if (!sourceRows.length) return [];
  return sourceRows.map((row, index) => mapApiCuringCycleRowToForm(row, index));
};

const mapPostCuringFromManufacturing = (
  sections: ManufacturingSection[],
): Record<string, string> => {
  const post =
    firstSectionRecord(sections, "POST_CURING_DETAILS") ??
    firstSectionRecord(sections, QC_CURING_SECTION_IDS.POST_CURING);
  if (!post) return {};

  const visual = String(
    post.VISUAL_OBSERVATIONS ??
      post.VISUAL_OBSERVATION ??
      post.visualObservation ??
      "",
  ).trim();
  const other = String(post.OTHER_OBSERVATIONS ?? post.otherObservations ?? "").trim();
  const visualCombined = [visual, other && other.toLowerCase() !== "na" ? other : ""]
    .filter(Boolean)
    .join("; ");

  return {
    VISUAL_OBSERVATIONS: visualCombined,
    PRESSURE_PLATE_REMOVAL_DATE_TIME: formatManufacturingDateTime(
      post.PRESSURE_PLATE_REMOVAL_DATE_TIME ?? post.pressurePlateRemovalDateTime,
    ),
    SHORE_A_HARDNESS: String(post.SHORE_A_HARDNESS ?? post.shoreAHardness ?? "").trim(),
    DISPATCH_DATE_TIME: formatManufacturingDateTime(
      post.DE_CORING_DISPATCH_DATE_TIME ??
        post.DISPATCH_DATE_TIME ??
        post.decoringDispatchDateTime,
    ),
  };
};

const pickFirstValue = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const mapMotorSetupFromManufacturing = (
  motor: Record<string, unknown>,
  sections: ManufacturingSection[],
  payload: unknown,
  motorId: string,
): Record<string, string> => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  const details = asRecord(root?.data) ?? root;
  const motorDetails = asRecord(motor.details) ?? {};
  const curingSetup = asRecord(motor.curingSetup) ?? asRecord(motor.curingDetails) ?? {};
  const setupSection = firstSectionRecord(sections, QC_CURING_SECTION_IDS.MOTOR_SETUP);
  const curingType =
    normalizeQcCuringType(motor.curingType ?? motor.subType) ||
    normalizeQcCuringType(curingSetup.curingType) ||
    normalizeQcCuringType(setupSection?.CURING_TYPE) ||
    normalizeQcCuringType(details?.curingType) ||
    normalizeQcCuringType(root?.curingType) ||
    normalizeQcCuringType(resolveCuringSubTypeFromDivisionDetails(payload, motorId)) ||
    "";

  const motorStage = formatQcCuringMotorStageLabel(
    pickFirstValue(
      motor.motorStage,
      curingSetup.motorStage,
      motorDetails.motorStage,
      setupSection?.MOTOR_STAGE,
      details?.motorStage,
      root?.motorStage,
    ),
  );

  return {
    MOTOR_STAGE: motorStage,
    CURING_TYPE: curingType,
    OVEN: pickFirstValue(
      motor.oven,
      motor.ovenName,
      curingSetup.oven,
      motorDetails.oven,
      setupSection?.OVEN,
      details?.oven,
      root?.oven,
    ),
    OVEN_NUMBER: pickFirstValue(
      motor.ovenNumber,
      motor.ovenNo,
      curingSetup.ovenNumber,
      curingSetup.ovenNo,
      motorDetails.ovenNumber,
      motorDetails.ovenNo,
      setupSection?.OVEN_NUMBER,
      details?.ovenNumber,
      root?.ovenNumber,
    ),
    MOTOR_POSITIONING_DATE_TIME: formatManufacturingDateTime(
      curingSetup.motorPositioningDateTime ??
        curingSetup.MOTOR_POSITIONING_DATE_TIME ??
        motor.motorPositioningDateTime ??
        setupSection?.MOTOR_POSITIONING_DATE_TIME,
    ),
  };
};

const mapSubscaleCuringFromManufacturing = (
  motor: Record<string, unknown>,
): {
  numberOfOvens: string;
  parameterRows: QcCuringSubscaleParameterRow[];
  curingStartDate: string;
  curingCompleteDate: string;
  bemAverageHardness: string;
  cartonAverageHardness: string;
  visualObservations: string;
} => {
  const motorDetails = asRecord(motor.details) ?? {};
  const subscale =
    asRecord(motorDetails.subscaleDetails) ?? asRecord(motor.subscaleDetails) ?? {};
  const curingTable = asArray(subscale.curingTable);

  const numberOfOvens = pickFirstValue(
    motor.ovenNumber,
    motor.ovenNo,
    motor.noOfOvens,
    motor.numberOfOvens,
    subscale.numberOfOvens,
    subscale.noOfOvens,
  );

  const articleRows = curingTable
    .map((row) => asRecord(row))
    .filter((row): row is Record<string, unknown> => Boolean(row));

  const startDates = articleRows
    .map((row) => formatToUiDate(String(row.curingStartDate ?? row.CURING_START_DATE ?? "")))
    .filter(Boolean);
  const endDates = articleRows
    .map((row) => formatToUiDate(String(row.curingEndDate ?? row.CURING_END_DATE ?? "")))
    .filter(Boolean);

  const bemHardness = articleRows
    .filter((row) => {
      const type = String(row.articleType ?? row.ARTICLE_TYPE ?? "").toUpperCase();
      return type.includes("BEM");
    })
    .map((row) => Number(row.hardness ?? row.HARDNESS))
    .filter((n) => Number.isFinite(n));
  const cartonHardness = articleRows
    .filter((row) => {
      const type = String(row.articleType ?? row.ARTICLE_TYPE ?? "").toUpperCase();
      return type.includes("CARTON");
    })
    .map((row) => Number(row.hardness ?? row.HARDNESS))
    .filter((n) => Number.isFinite(n));

  const avg = (nums: number[]) =>
    nums.length ? String(Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2))) : "";

  const visualObservations = articleRows
    .map((row) => String(row.grainSurfaceObservations ?? row.GRAIN_SURFACE_OBSERVATIONS ?? "").trim())
    .filter(Boolean)
    .join("; ");

  return {
    numberOfOvens,
    parameterRows: mapApiSubscaleCuringTableToParameterRows(curingTable),
    curingStartDate: startDates[0] ?? "",
    curingCompleteDate: endDates[endDates.length - 1] ?? "",
    bemAverageHardness: avg(bemHardness),
    cartonAverageHardness: avg(cartonHardness),
    visualObservations,
  };
};

const applyManufacturingCuringFieldSeed = (
  values: SchemaFormValues,
  motor: Record<string, unknown>,
  sections: ManufacturingSection[],
  payload: unknown,
  motorId: string,
  onlyIfEmpty: boolean,
): SchemaFormValues => {
  let next = { ...values };

  const mergeField = (key: string, incoming: unknown) => {
    if (onlyIfEmpty && !isValueEmpty(next[key])) return;
    if (hasValue(incoming)) next[key] = String(incoming);
  };

  const setup = mapMotorSetupFromManufacturing(motor, sections, payload, motorId);
  mergeField(formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "MOTOR_STAGE"), setup.MOTOR_STAGE);
  mergeField(formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "CURING_TYPE"), setup.CURING_TYPE);
  mergeField(formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "OVEN"), setup.OVEN);
  mergeField(formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "OVEN_NUMBER"), setup.OVEN_NUMBER);
  mergeField(
    formKey(QC_CURING_SECTION_IDS.MOTOR_SETUP, "MOTOR_POSITIONING_DATE_TIME"),
    setup.MOTOR_POSITIONING_DATE_TIME,
  );

  const cycleRows = mapCycleRowsFromManufacturing(sections);
  const cycleKey = formKey(QC_CURING_SECTION_IDS.CYCLE_DETAILS, "CURING_CYCLE_DETAILS");
  if (cycleRows.length && (!onlyIfEmpty || isValueEmpty(next[cycleKey]))) {
    next[cycleKey] = cycleRows;
  }

  const post = mapPostCuringFromManufacturing(sections);
  mergeField(formKey(QC_CURING_SECTION_IDS.POST_CURING, "VISUAL_OBSERVATIONS"), post.VISUAL_OBSERVATIONS);
  mergeField(
    formKey(QC_CURING_SECTION_IDS.POST_CURING, "PRESSURE_PLATE_REMOVAL_DATE_TIME"),
    post.PRESSURE_PLATE_REMOVAL_DATE_TIME,
  );
  mergeField(formKey(QC_CURING_SECTION_IDS.POST_CURING, "SHORE_A_HARDNESS"), post.SHORE_A_HARDNESS);
  mergeField(formKey(QC_CURING_SECTION_IDS.POST_CURING, "DISPATCH_DATE_TIME"), post.DISPATCH_DATE_TIME);

  const subscale = mapSubscaleCuringFromManufacturing(motor);
  mergeField(
    formKey(QC_CURING_SECTION_IDS.SUBSCALE, "NUMBER_OF_OVENS"),
    subscale.numberOfOvens,
  );
  const subscaleTableKey = formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_PARAMETER_TABLE");
  if (subscale.parameterRows.length && (!onlyIfEmpty || isValueEmpty(next[subscaleTableKey]))) {
    next[subscaleTableKey] = subscale.parameterRows;
  }
  mergeField(formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_START_DATE"), subscale.curingStartDate);
  mergeField(
    formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CURING_COMPLETE_DATE"),
    subscale.curingCompleteDate,
  );
  mergeField(
    formKey(QC_CURING_SECTION_IDS.SUBSCALE, "BEM_AVERAGE_SHORE_A_HARDNESS"),
    subscale.bemAverageHardness,
  );
  mergeField(
    formKey(QC_CURING_SECTION_IDS.SUBSCALE, "CARTON_AVERAGE_SHORE_A_HARDNESS"),
    subscale.cartonAverageHardness,
  );
  mergeField(
    formKey(QC_CURING_SECTION_IDS.SUBSCALE, "SUBSCALE_VISUAL_OBSERVATIONS"),
    subscale.visualObservations,
  );

  return next;
};

/** Resolve QC curing subType from manufacturing division-details for a motor. */
export const resolveCuringSubTypeFromDivisionDetails = (
  payload: unknown,
  motorId: string,
): QcApiSubType => {
  const motor = findCuringMotorRecord(payload, motorId);
  if (!motor) return null;

  const curingSetup = asRecord(motor.curingSetup) ?? asRecord(motor.curingDetails);
  const fromSetup = normalizeQcCuringType(curingSetup?.curingType);
  if (fromSetup) return fromSetup;

  const fromMotor = normalizeQcCuringType(motor.curingType ?? motor.subType);
  if (fromMotor) return fromMotor;

  const fromRoot = normalizeQcCuringType(
    asRecord(resolveManufacturingDivisionDetailsPayload(payload))?.curingType,
  );
  return fromRoot || null;
};

export const applyCuringDivisionDetailsSeed = (
  base: SchemaFormValues,
  payload: unknown,
  motorId: string,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const onlyIfEmpty = options?.onlyIfEmpty ?? false;
  const motor = findCuringMotorRecord(payload, motorId);
  if (!motor) return base;

  const sections = extractMotorSections(motor);
  let next = { ...base };

  if (sectionsLookLikeQcCuring(sections)) {
    const hydrated = hydrateCuringValuesFromSections(sections as SchemaSectionSubmission[]);
    if (onlyIfEmpty) {
      Object.entries(hydrated).forEach(([key, value]) => {
        if (isValueEmpty(next[key])) next[key] = value;
      });
    } else {
      next = { ...next, ...hydrated };
    }
    // Overlay motor-level metadata (oven, ovenNumber, stage, type) even when
    // sections are QC-shaped — those fields live on the motor, not in sections.
    next = applyManufacturingCuringFieldSeed(next, motor, sections, payload, motorId, true);
    return next;
  }

  return applyManufacturingCuringFieldSeed(next, motor, sections, payload, motorId, onlyIfEmpty);
};

export const buildInitialCuringValuesForMotor = (
  payload: unknown,
  motorId: string,
  subType?: QcCuringSubType | "",
): SchemaFormValues => {
  const resolvedSubType =
    subType || resolveCuringSubTypeFromDivisionDetails(payload, motorId) || "NORMAL";
  let values = createInitialCuringValues(resolvedSubType);
  values = applyCuringDivisionDetailsSeed(values, payload, motorId, { onlyIfEmpty: false });
  if (!getCuringSetupField(values, "CURING_TYPE")) {
    values = setCuringSetupField(values, "CURING_TYPE", resolvedSubType);
  }
  return values;
};

export const getQcCuringTypeLabelFromPayload = (payload: unknown, motorId: string) => {
  const subType = resolveCuringSubTypeFromDivisionDetails(payload, motorId);
  return subType ? getQcCuringTypeLabel(subType) : "—";
};
