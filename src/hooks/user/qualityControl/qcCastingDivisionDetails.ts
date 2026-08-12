import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  getFinalMixPremixesFromSheet,
  parseIdentificationSheetFromApi,
  type IdentificationSheet,
} from "../../../data/models/admin/BatchManagement/BatchManagementModel";
import { formatToUiDate } from "../../../utils/dateUtils";
import { QC_CASTING_SECTION_IDS, QC_CASTING_TYPE_OPTIONS } from "./qcCastingConfig";
import {
  calcWeightmentTotalWeight,
  createInitialCastingValues,
  hydrateCastingValuesFromSections,
  setCastingType,
  type QcCastingMandrelRow,
  type QcCastingPressurePlateRow,
  type QcCastingTableRow,
  type QcCastingWeightmentRow,
} from "./qcCastingTables";
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

const normalizeTimeValue = (value: unknown) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
};

/**
 * Normalize casting type for QC storage/display.
 * Batch identification-sheet motors use casing types (COMPOSITE / METALLIC).
 * Manufacturing setup may still use SINGLE / PAIR / TRIPLE.
 */
export const normalizeQcCastingType = (value: unknown): string => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const upper = raw.toUpperCase().replace(/[\s-]+/g, "_");
  if (upper === "BEM" || upper.includes("BEM")) return "";
  if (upper === "SINGLE" || upper.startsWith("SINGLE")) return "SINGLE";
  if (upper === "PAIR" || upper.startsWith("PAIR")) return "PAIR";
  if (upper === "TRIPLE" || upper.startsWith("TRIPLE")) return "TRIPLE";
  return upper;
};

export const getQcCastingTypeLabel = (value: unknown): string => {
  const normalized = normalizeQcCastingType(value);
  if (!normalized) {
    const fallback = String(value ?? "").trim();
    return fallback || "—";
  }
  const match = QC_CASTING_TYPE_OPTIONS.find((option) => option.value === normalized);
  if (match) return match.label;
  return normalized
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
};

const mergeField = (current: unknown, incoming: unknown, onlyIfEmpty: boolean) => {
  if (onlyIfEmpty && hasValue(current)) return String(current ?? "");
  return hasValue(incoming) ? String(incoming ?? "") : String(current ?? "");
};

const findCastingMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  if (!root) return null;

  const details = asRecord(root.castingCuringDetails) ?? asRecord(root.data) ?? root;
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  for (const motor of asArray(details.motors ?? root.motors)) {
    const rec = asRecord(motor);
    if (!rec) continue;
    const id = String(rec.motorId ?? rec.id ?? "").trim();
    if (id === normalizedMotorId) return rec;
  }
  return null;
};

const extractMotorSections = (motor: Record<string, unknown> | null): ManufacturingSection[] => {
  if (!motor) return [];
  const details = asRecord(motor.details) ?? motor;
  const sections = asArray(
    details.sections ?? details.castingSections ?? motor.sections ?? motor.castingSections,
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
  const match = sections.find(
    (section) =>
      section.sectionId.localeCompare(sectionId, undefined, { sensitivity: "accent" }) === 0,
  );
  return asRecord(asArray(match?.sectionData)[0]) ?? null;
};

const resolveIdentificationSheetFromPayload = (payload: unknown): IdentificationSheet | null => {
  const roots = [
    payload,
    asRecord(payload)?.__batchDetails,
    asRecord(asRecord(payload)?.__batchDetails)?.batch,
    asRecord(payload)?.batch,
    asRecord(payload)?.data,
    asRecord(asRecord(payload)?.data)?.batch,
  ];
  for (const root of roots) {
    const rec = asRecord(root);
    if (!rec) continue;
    if (rec.identificationSheet) {
      const sheet = rec.identificationSheet;
      // Already a parsed IdentificationSheet instance/object with metadata.
      if (asRecord(sheet)?.metadata || asRecord(sheet)?.materials) {
        return parseIdentificationSheetFromApi(sheet as Record<string, unknown>);
      }
      return parseIdentificationSheetFromApi(sheet as Record<string, unknown>);
    }
    if (rec.metadata || rec.numberOfPremix != null) {
      return parseIdentificationSheetFromApi(rec);
    }
  }
  return null;
};

/**
 * Type of Casting from batch identificationSheet.metadata.rocketMotorCasing.motors[].castingType
 * (e.g. COMPOSITE / METALLIC). Falls back to manufacturing setup when batch has no value.
 */
export const extractCastingTypeFromBatchMetadata = (
  batchPayload: unknown,
  motorId?: string | null,
): string => {
  const sheet = resolveIdentificationSheetFromPayload(batchPayload);
  const motors = sheet?.metadata?.rocketMotorCasing?.motors ?? [];
  const normalizedMotorId = String(motorId ?? "").trim();

  if (normalizedMotorId) {
    const motorMatch = motors.find(
      (motor) => String(motor.motorId ?? "").trim() === normalizedMotorId,
    );
    const fromMotor = normalizeQcCastingType(motorMatch?.castingType);
    if (fromMotor) return fromMotor;
  }

  for (const motor of motors) {
    const fromMotor = normalizeQcCastingType(motor.castingType);
    if (fromMotor) return fromMotor;
  }

  const root = asRecord(batchPayload);
  const nested =
    asRecord(root?.__batchDetails) ??
    asRecord(asRecord(root?.__batchDetails)?.batch) ??
    asRecord(root?.batch) ??
    root;
  const metadata =
    asRecord(nested?.metadata) ?? asRecord(asRecord(nested?.identificationSheet)?.metadata);
  return (
    normalizeQcCastingType(nested?.castingType) ||
    normalizeQcCastingType(metadata?.castingType) ||
    normalizeQcCastingType(asRecord(metadata?.casting)?.castingType) ||
    ""
  );
};

export const extractCastingTypeFromDivisionDetails = (
  payload: unknown,
  motorId: string,
): string => {
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  const details = asRecord(root?.castingCuringDetails) ?? asRecord(root?.data) ?? root;
  const motor = findCastingMotorRecord(payload, motorId);
  const motorDetails = asRecord(motor?.details) ?? motor;
  const motorSetup = asRecord(motor?.setup) ?? asRecord(motorDetails?.setup);
  const topSetup = asRecord(details?.setup) ?? asRecord(root?.setup);

  return (
    normalizeQcCastingType(motorSetup?.castingType) ||
    normalizeQcCastingType(motor?.castingType) ||
    normalizeQcCastingType(topSetup?.castingType) ||
    normalizeQcCastingType(details?.castingType) ||
    normalizeQcCastingType(root?.castingType) ||
    ""
  );
};

const extractTableRows = (sectionData: unknown, tableId: string): Record<string, unknown>[] => {
  const data = asRecord(asArray(sectionData)[0]);
  if (!data) return [];
  const tableValue = data[tableId];
  if (Array.isArray(tableValue)) {
    return tableValue.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  }
  const nested = asRecord(tableValue);
  if (nested && Array.isArray(nested.rows)) {
    return nested.rows.filter((row) => row && typeof row === "object") as Record<string, unknown>[];
  }
  return [];
};

const deepFindTableRows = (
  value: unknown,
  tableId: string,
  depth = 0,
): Record<string, unknown>[] => {
  if (depth > 6 || value == null) return [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = deepFindTableRows(item, tableId, depth + 1);
      if (found.length) return found;
    }
    return [];
  }
  const rec = asRecord(value);
  if (!rec) return [];
  if (tableId in rec) {
    const direct = extractTableRows([{ [tableId]: rec[tableId] }], tableId);
    if (direct.length) return direct;
  }
  for (const child of Object.values(rec)) {
    const found = deepFindTableRows(child, tableId, depth + 1);
    if (found.length) return found;
  }
  return [];
};

const mapMandrelRowsFromManufacturing = (sections: ManufacturingSection[]): QcCastingMandrelRow[] => {
  const assembly =
    firstSectionRecord(sections, "FINAL_ASSEMBLY_DETAILS") ??
    firstSectionRecord(sections, "FINAL_ASSEMBLY");
  const rows = deepFindTableRows(assembly ?? sections, "MANDREL_MEASUREMENTS");
  const mapped = rows
    .map((row, index) => {
      const withoutCup = String(row.A_FINAL ?? row.A_MOCK ?? row.READING_WITHOUT_CUP ?? "").trim();
      const withCup = String(
        row.B_FINAL ?? row.B_MOCK ?? row.READING_WITH_BOTTOM_CUP ?? "",
      ).trim();
      if (!withoutCup && !withCup) return null;
      return {
        SR_NO: index + 1,
        READING_WITHOUT_CUP: withoutCup,
        READING_WITH_BOTTOM_CUP: withCup,
      } satisfies QcCastingMandrelRow;
    })
    .filter(Boolean) as QcCastingMandrelRow[];
  return mapped;
};

const mapCastingTableFromManufacturing = (sections: ManufacturingSection[]): QcCastingTableRow[] => {
  const process =
    firstSectionRecord(sections, "CASTING_PROCESS") ??
    firstSectionRecord(sections, "PROPELLANT_CASTING");
  const slurrySection = firstSectionRecord(sections, "SLURRY_CAST_DETAILS");
  const bowlRows = deepFindTableRows(process ?? sections, "FINAL_MIX_BOWL_DETAILS");
  const fromBowlRows = deepFindTableRows(process ?? sections, "CASTING_FROM_BOWL_DETAILS");
  const slurryRows = deepFindTableRows(slurrySection ?? sections, "SLURRY_CAST_FROM_BOWLS");
  const castingRows = deepFindTableRows(process ?? sections, "CASTING_TABLE");

  if (castingRows.length) {
    return castingRows.map((row, index) => ({
      SR_NO: index + 1,
      FINAL_MIX_BOWL_NO: String(row.FINAL_MIX_BOWL_NO ?? row.BOWL_ID ?? row.BOWL_NO ?? "").trim(),
      PROPELLANT_QTY: String(row.PROPELLANT_QTY ?? "").trim(),
      INITIAL_UNLOADING_VISCOSITY: String(
        row.INITIAL_UNLOADING_VISCOSITY ?? row.VISCOSITY ?? "",
      ).trim(),
      CASTING_START_TIME: String(row.CASTING_START_TIME ?? "").trim(),
      CASTING_COMPLETION_TIME: String(row.CASTING_COMPLETION_TIME ?? "").trim(),
      SLURRY_CAST_FROM_EACH_BOWL: String(
        row.SLURRY_CAST_FROM_EACH_BOWL ?? row.SLURRY_CAST ?? "",
      ).trim(),
      REMARKS: String(row.REMARKS ?? "").trim(),
    }));
  }

  // Prefer FINAL_MIX_BOWL_DETAILS from CASTING_PROCESS (BOWL_ID like "FINAL_MIX 1 / Bowl No.1").
  const count = Math.max(bowlRows.length, fromBowlRows.length, 0);
  if (!count) return [];

  const slurryByLabel = new Map<string, string>();
  for (const row of slurryRows) {
    const label = String(row.FM_MOTOR_LABEL ?? row.BOWL_ID ?? "").trim();
    const rowKey = String(row.ROW_KEY ?? "").trim().toUpperCase();
    if (!label || rowKey === "TOTAL") continue;
    const slurry = String(row.SLURRY_CAST ?? "").trim();
    if (slurry) slurryByLabel.set(label, slurry);
  }

  return Array.from({ length: count }, (_, index) => {
    const bowl = asRecord(bowlRows[index]) ?? {};
    const fromBowl = asRecord(fromBowlRows[index]) ?? {};
    const bowlId = String(bowl.BOWL_ID ?? bowl.BOWL_NO ?? fromBowl.BOWL_ID ?? "").trim();
    return {
      SR_NO: index + 1,
      FINAL_MIX_BOWL_NO: bowlId,
      // Propellant qty is seeded from batch identificationSheet.batchSize.
      PROPELLANT_QTY: "",
      INITIAL_UNLOADING_VISCOSITY: String(fromBowl.VISCOSITY ?? "").trim(),
      CASTING_START_TIME: "",
      CASTING_COMPLETION_TIME: "",
      SLURRY_CAST_FROM_EACH_BOWL: String(
        fromBowl.SLURRY_CAST ?? slurryByLabel.get(bowlId) ?? "",
      ).trim(),
      REMARKS: "",
    } satisfies QcCastingTableRow;
  }).filter(
    (row) =>
      hasValue(row.FINAL_MIX_BOWL_NO) ||
      hasValue(row.PROPELLANT_QTY) ||
      hasValue(row.INITIAL_UNLOADING_VISCOSITY) ||
      hasValue(row.SLURRY_CAST_FROM_EACH_BOWL),
  );
};

const mapPropellantFieldsFromManufacturing = (sections: ManufacturingSection[]) => {
  const process =
    firstSectionRecord(sections, "CASTING_PROCESS") ??
    firstSectionRecord(sections, "PROPELLANT_CASTING");
  const fromBowl = deepFindTableRows(process ?? sections, "CASTING_FROM_BOWL_DETAILS");
  const vacuumTable = deepFindTableRows(process ?? sections, "CASTING_VACUUM_DETAILS");
  const firstFromBowl = asRecord(fromBowl[0]);
  const firstVacuum = asRecord(vacuumTable[0]);
  const data = process ?? {};

  return {
    DATE_OF_CASTING: formatToUiDate(
      String(data.DATE_OF_CASTING ?? data.dateOfCasting ?? "").trim(),
    ),
    RH_PERCENT: String(data.RH_PERCENT ?? firstFromBowl?.RH ?? "").trim(),
    VACUUM_MAINTAINED: String(
      data.VACUUM_MAINTAINED ??
        data.VACUUM_PRESSURE_CASTING ??
        data.INITIAL_VACUUM ??
        firstVacuum?.VACUUM_PRESSURE_CASTING ??
        firstVacuum?.INITIAL_VACUUM ??
        firstFromBowl?.VACUUM_LEVEL ??
        "",
    ).trim(),
  };
};

const mapWeightmentFromManufacturing = (
  sections: ManufacturingSection[],
): QcCastingWeightmentRow[] => {
  const weightment =
    firstSectionRecord(sections, "WEIGHTMENT_DETAILS") ??
    firstSectionRecord(sections, QC_CASTING_SECTION_IDS.WEIGHTMENT);
  const rows = deepFindTableRows(weightment ?? sections, "WEIGHTMENT_DETAILS");
  const mapped = rows
    .map((row) => ({
      LOAD_CELL_INITIAL: String(row.LOAD_CELL_INITIAL ?? "").trim(),
      LOAD_CELL_FINAL: String(row.LOAD_CELL_FINAL ?? "").trim(),
      TOTAL_WEIGHT: String(row.TOTAL_WEIGHT ?? "").trim(),
    }))
    .filter(
      (row) =>
        hasValue(row.LOAD_CELL_INITIAL) ||
        hasValue(row.LOAD_CELL_FINAL) ||
        hasValue(row.TOTAL_WEIGHT),
    );
  if (!mapped.length) return [];
  const first = mapped[0];
  return [
    {
      ...first,
      TOTAL_WEIGHT:
        first.TOTAL_WEIGHT ||
        calcWeightmentTotalWeight(first.LOAD_CELL_INITIAL, first.LOAD_CELL_FINAL),
    },
  ];
};

const mapPostCastFromManufacturing = (sections: ManufacturingSection[]) => {
  const post =
    firstSectionRecord(sections, "POST_CAST_OPERATIONS") ??
    firstSectionRecord(sections, QC_CASTING_SECTION_IDS.POST_CAST);
  const tableRows =
    deepFindTableRows(post ?? {}, "POST_CAST_TABLE").length > 0
      ? deepFindTableRows(post ?? {}, "POST_CAST_TABLE")
      : deepFindTableRows(sections, "POST_CAST_TABLE");

  const findActivityValue = (...matchers: Array<string | RegExp>) => {
    for (const row of tableRows) {
      const activity = String(row.ACTIVITY ?? row.activity ?? row.parameter ?? "").trim();
      if (!activity) continue;
      const matched = matchers.some((matcher) =>
        typeof matcher === "string"
          ? activity.localeCompare(matcher, undefined, { sensitivity: "accent" }) === 0
          : matcher.test(activity),
      );
      if (!matched) continue;
      return String(row.DETAILS ?? row.details ?? row.value ?? "").trim();
    }
    return "";
  };

  const soakingTime = normalizeTimeValue(
    post?.SOAKING_DURATION ??
      post?.SOAKING_TIME ??
      findActivityValue("Soaking Time", /^soaking\s*(time|duration)?$/i),
  );
  const pressureSensor = findActivityValue(
    "Pressure sensor details (If applicable)",
    /pressure sensor/i,
  );
  const initialPressure = findActivityValue(
    "Initial pressure reading (If applicable)",
    /initial pressure/i,
  );
  const pressureRequired =
    String(post?.PRESSURE_PLATE_ASSEMBLY_REQUIRED ?? "").trim() ||
    (hasValue(pressureSensor) || hasValue(initialPressure) ? "YES" : "");

  return {
    SOAKING_DURATION: soakingTime,
    PRESSURE_PLATE_ASSEMBLY_REQUIRED: pressureRequired,
    PRESSURE_SENSOR_USED: pressureSensor,
    INITIAL_PRESSURE_READING: initialPressure,
  };
};

const sectionsLookLikeQcCasting = (sections: ManufacturingSection[]) =>
  sections.some((section) =>
    Object.values(QC_CASTING_SECTION_IDS).includes(
      section.sectionId as (typeof QC_CASTING_SECTION_IDS)[keyof typeof QC_CASTING_SECTION_IDS],
    ),
  );

const extractBatchSizeFromPayload = (batchPayload: unknown): string => {
  const sheet = resolveIdentificationSheetFromPayload(batchPayload);
  const fromSheet = Number(sheet?.batchSize);
  if (Number.isFinite(fromSheet) && fromSheet > 0) return String(fromSheet);

  const roots = [
    batchPayload,
    asRecord(batchPayload)?.__batchDetails,
    asRecord(asRecord(batchPayload)?.__batchDetails)?.batch,
    asRecord(batchPayload)?.batch,
    asRecord(batchPayload)?.identificationSheet,
  ];
  for (const root of roots) {
    const rec = asRecord(root);
    if (!rec) continue;
    const size = Number(rec.batchSize ?? asRecord(rec.identificationSheet)?.batchSize);
    if (Number.isFinite(size) && size > 0) return String(size);
  }
  return "";
};

/** Qty of Propellant = identification sheet batchSize. */
const applyPropellantQtyFromBatchSize = (
  values: SchemaFormValues,
  batchPayload: unknown,
  onlyIfEmpty: boolean,
): SchemaFormValues => {
  const batchSize = extractBatchSizeFromPayload(batchPayload);
  if (!batchSize) return values;

  const key = formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE");
  const rows = asArray(values[key]) as QcCastingTableRow[];
  if (!rows.length) {
    return {
      ...values,
      [key]: [
        {
          SR_NO: 1,
          FINAL_MIX_BOWL_NO: "",
          PROPELLANT_QTY: batchSize,
          INITIAL_UNLOADING_VISCOSITY: "",
          CASTING_START_TIME: "",
          CASTING_COMPLETION_TIME: "",
          SLURRY_CAST_FROM_EACH_BOWL: "",
          REMARKS: "",
        },
      ],
    };
  }

  return {
    ...values,
    [key]: rows.map((row) => {
      const current = String(row.PROPELLANT_QTY ?? "").trim();
      if (onlyIfEmpty && hasValue(current) && current !== "0") return row;
      return { ...row, PROPELLANT_QTY: batchSize };
    }),
  };
};

const seedCastingTableFromBatchMixingMetadata = (
  values: SchemaFormValues,
  batchPayload: unknown,
): SchemaFormValues => {
  const currentKey = formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE");
  const currentRows = asArray(values[currentKey]) as QcCastingTableRow[];
  const hasExisting = currentRows.some((row) =>
    Object.entries(row ?? {}).some(([key, value]) => key !== "SR_NO" && hasValue(value)),
  );
  if (hasExisting) return values;

  const sheet = resolveIdentificationSheetFromPayload(batchPayload);
  const premixes = getFinalMixPremixesFromSheet(sheet);
  const batchSize = extractBatchSizeFromPayload(batchPayload);
  if (!premixes.length) return values;

  const rows: QcCastingTableRow[] = premixes.map((premix, index) => ({
    SR_NO: index + 1,
    FINAL_MIX_BOWL_NO: String(premix.bowlId ?? "").trim()
      ? `FINAL_MIX ${premix.premixNo} / ${String(premix.bowlId).trim()}`
      : "",
    PROPELLANT_QTY: batchSize,
    INITIAL_UNLOADING_VISCOSITY: "",
    CASTING_START_TIME: "",
    CASTING_COMPLETION_TIME: "",
    SLURRY_CAST_FROM_EACH_BOWL: "",
    REMARKS: "",
  }));

  return {
    ...values,
    [currentKey]: rows,
  };
};

const applyManufacturingCastingFieldSeed = (
  base: SchemaFormValues,
  sections: ManufacturingSection[],
  onlyIfEmpty: boolean,
): SchemaFormValues => {
  let next = { ...base };

  const assemblyDateKey = formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "ASSEMBLY_DATE");
  const assembly =
    firstSectionRecord(sections, "FINAL_ASSEMBLY_DETAILS") ??
    firstSectionRecord(sections, QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY);
  next[assemblyDateKey] = mergeField(
    next[assemblyDateKey],
    formatToUiDate(String(assembly?.ASSEMBLY_DATE ?? assembly?.DATE ?? "").trim()),
    onlyIfEmpty,
  );

  const mandrelKey = formKey(QC_CASTING_SECTION_IDS.FINAL_ASSEMBLY, "MANDREL_ASSEMBLY");
  const mandrelRows = mapMandrelRowsFromManufacturing(sections);
  if (mandrelRows.length) {
    const current = asArray(next[mandrelKey]) as QcCastingMandrelRow[];
    const currentHasData = current.some(
      (row) => hasValue(row.READING_WITHOUT_CUP) || hasValue(row.READING_WITH_BOTTOM_CUP),
    );
    if (!onlyIfEmpty || !currentHasData) {
      next[mandrelKey] = mandrelRows;
    }
  }

  const propellant = mapPropellantFieldsFromManufacturing(sections);
  (["DATE_OF_CASTING", "RH_PERCENT", "VACUUM_MAINTAINED"] as const).forEach((field) => {
    const key = formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, field);
    next[key] = mergeField(next[key], propellant[field], onlyIfEmpty);
  });

  const castingTableKey = formKey(QC_CASTING_SECTION_IDS.PROPELLANT_CASTING, "CASTING_TABLE");
  const castingRows = mapCastingTableFromManufacturing(sections);
  if (castingRows.length) {
    const current = asArray(next[castingTableKey]) as QcCastingTableRow[];
    const currentHasData = current.some((row) =>
      Object.entries(row ?? {}).some(([key, value]) => key !== "SR_NO" && hasValue(value)),
    );
    if (!onlyIfEmpty || !currentHasData) {
      next[castingTableKey] = castingRows;
    }
  }

  const weightmentKey = formKey(QC_CASTING_SECTION_IDS.WEIGHTMENT, "WEIGHTMENT_DETAILS");
  const weightmentRows = mapWeightmentFromManufacturing(sections);
  if (weightmentRows.length) {
    const current = asArray(next[weightmentKey]) as QcCastingWeightmentRow[];
    const currentHasData = current.some(
      (row) =>
        hasValue(row.LOAD_CELL_INITIAL) ||
        hasValue(row.LOAD_CELL_FINAL) ||
        hasValue(row.TOTAL_WEIGHT),
    );
    if (!onlyIfEmpty || !currentHasData) {
      next[weightmentKey] = weightmentRows;
    }
  }

  const post = mapPostCastFromManufacturing(sections);
  const soakingKey = formKey(QC_CASTING_SECTION_IDS.POST_CAST, "SOAKING_DURATION");
  const pressureKey = formKey(
    QC_CASTING_SECTION_IDS.POST_CAST,
    "PRESSURE_PLATE_ASSEMBLY_REQUIRED",
  );
  next[soakingKey] = mergeField(next[soakingKey], post.SOAKING_DURATION, onlyIfEmpty);
  next[pressureKey] = mergeField(
    next[pressureKey],
    post.PRESSURE_PLATE_ASSEMBLY_REQUIRED,
    onlyIfEmpty,
  );

  if (hasValue(post.PRESSURE_SENSOR_USED) || hasValue(post.INITIAL_PRESSURE_READING)) {
    const pressureRowsKey = formKey(QC_CASTING_SECTION_IDS.POST_CAST, "PRESSURE_PLATE_DETAILS");
    const current = asArray(next[pressureRowsKey]) as QcCastingPressurePlateRow[];
    const currentHasData = current.some(
      (row) =>
        hasValue(row.PRESSURE_SENSOR_USED) ||
        hasValue(row.INITIAL_PRESSURE_READING) ||
        hasValue(row.START_TIME) ||
        hasValue(row.END_TIME) ||
        hasValue(row.OBSERVATIONS),
    );
    if (!onlyIfEmpty || !currentHasData) {
      next[pressureRowsKey] = [
        {
          SR_NO: 1,
          START_TIME: "",
          END_TIME: "",
          PRESSURE_SENSOR_USED: post.PRESSURE_SENSOR_USED,
          INITIAL_PRESSURE_READING: post.INITIAL_PRESSURE_READING,
          OBSERVATIONS: "",
        },
      ];
    }
  }

  return next;
};

export const applyCastingDivisionDetailsSeed = (
  values: SchemaFormValues | null | undefined,
  divisionDetailsPayload: unknown,
  motorId: string,
  options?: {
    onlyIfEmpty?: boolean;
    batchPayload?: unknown;
  },
): SchemaFormValues => {
  const onlyIfEmpty = Boolean(options?.onlyIfEmpty);
  const base = { ...(values ?? createInitialCastingValues()) };
  const motor = findCastingMotorRecord(divisionDetailsPayload, motorId);
  const sections = extractMotorSections(motor);

  let next = base;

  if (sectionsLookLikeQcCasting(sections)) {
    const hydrated = hydrateCastingValuesFromSections(sections as SchemaSectionSubmission[]);
    if (onlyIfEmpty) {
      next = { ...next };
      Object.entries(hydrated).forEach(([key, value]) => {
        const current = next[key];
        const currentEmpty =
          current == null ||
          (typeof current === "string" && !String(current).trim()) ||
          (Array.isArray(current) &&
            !current.some(
              (row) =>
                row &&
                typeof row === "object" &&
                Object.entries(row as Record<string, unknown>).some(
                  ([field, fieldValue]) => field !== "SR_NO" && hasValue(fieldValue),
                ),
            ));
        if (currentEmpty) next[key] = value;
      });
    } else {
      next = hydrated;
    }
  } else if (sections.length) {
    next = applyManufacturingCastingFieldSeed(next, sections, onlyIfEmpty);
  }

  // Type of Casting: prefer batch identification-sheet motor castingType (COMPOSITE/METALLIC).
  const castingType =
    extractCastingTypeFromBatchMetadata(
      options?.batchPayload ?? divisionDetailsPayload,
      motorId,
    ) || extractCastingTypeFromDivisionDetails(divisionDetailsPayload, motorId);
  if (castingType) {
    const typeKey = formKey(QC_CASTING_SECTION_IDS.SELECTION, "CASTING_TYPE");
    if (!onlyIfEmpty || !hasValue(next[typeKey])) {
      next = setCastingType(next, castingType);
    }
  }

  // If manufacturing did not supply bowl rows, fall back to batch mixing metadata bowls.
  next = seedCastingTableFromBatchMixingMetadata(
    next,
    options?.batchPayload ?? divisionDetailsPayload,
  );

  // Qty of Propellant = batch identificationSheet.batchSize.
  next = applyPropellantQtyFromBatchSize(
    next,
    options?.batchPayload ?? divisionDetailsPayload,
    onlyIfEmpty,
  );

  return next;
};
