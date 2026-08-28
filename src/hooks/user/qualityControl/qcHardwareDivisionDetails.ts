import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import {
  parseFileRefs,
  type FileRef,
} from "../../../data/models/common/FileUploadModel";
import { mergeQcDivisionFileRefsForSeed } from "./qcDivisionFileUpload";
import { formatToUiDate, UI_DATETIME_FORMAT } from "../../../utils/dateUtils";
import type { QcDivisionEntry } from "./qcDivisionEntryTypes";
import type { QcHardwareProcessSubType } from "./qcHardwareConfig";
import {
  QC_HARDWARE_ATTACHMENTS_SECTION_ID,
  QC_HARDWARE_SECTION_IDS,
  resolveHardwareUploadAnchorEntry,
} from "./qcHardwareConfig";
import {
  QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID,
  QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID,
  QC_HARDWARE_LINEAR_COATING_TABLE_ID,
  QC_HARDWARE_PREHEATING_TABLE_ID,
  QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID,
  QC_HARDWARE_UPLOAD_GRAPH_KEY,
  QC_HARDWARE_UPLOAD_PHOTO_KEY,
  QC_HARDWARE_UPLOAD_REPORT_KEY,
  collectHardwareMotorSections,
  createInitialHardwareProcessValues,
  findHardwareMotorDetailInData,
  getHardwareDispatchVisualObservationRows,
  getHardwareUploadValues,
  hydrateHardwareUploadValuesFromSections,
  hydrateHardwareValuesFromMotorDetail,
  mapAbradingDetailsToFirstAndSecondCut,
  hardwareAbradingCutsHaveData,
  mergeHardwareUploadValuesIntoEntryValues,
  resolveAbradingCutsFromRecord,
  sliceHardwareEntrySchemaValues,
  type QcHardwareCutRow,
  type QcHardwareLinearCoatingRow,
  type QcHardwarePreheatingRow,
  type QcHardwareUploadValues,
  type QcHardwareVisualObservationRow,
} from "./qcHardwareTables";

export const QC_HARDWARE_MANUFACTURING_SECTION_IDS = {
  ABRADING: "abradingOperation",
  PREHEATING: "preHeating",
  LINEAR_COATING: "linerCoatingOperation",
  DISPATCH: "dispatchToCasting",
  TCE_CLEANING: "tceCleaning",
} as const;

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

export const resolveManufacturingDivisionDetailsPayload = (
  payload: unknown,
): Record<string, unknown> | null => {
  const root = asRecord(payload);
  if (!root) return null;
  return asRecord(root.__manufacturingDivisionData) ?? root;
};

type HardwareMotorManufacturingMeta = {
  ovenNo: string;
  buildingNo: string;
};

const emptyHardwareMotorMeta = (): HardwareMotorManufacturingMeta => ({
  ovenNo: "",
  buildingNo: "",
});

const findHardwareMotorRecord = (
  payload: unknown,
  motorId: string,
): Record<string, unknown> | null => {
  const roots = [
    resolveManufacturingDivisionDetailsPayload(payload),
    asRecord(payload),
    asRecord(asRecord(payload)?.__qcFormDivisionData),
    asRecord(asRecord(payload)?.__manufacturingDivisionData),
  ].filter(Boolean) as Record<string, unknown>[];

  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  for (const root of roots) {
    const data = asRecord(root.data) ?? root;
    const casePrep = asRecord(data.casePreparationDetails) ?? asRecord(root.casePreparationDetails);
    for (const motor of [
      ...asArray(data.motors),
      ...asArray(data.motorDetails),
      ...asArray(casePrep?.motors),
    ]) {
      const rec = asRecord(motor);
      if (!rec) continue;
      const details = asRecord(rec.details);
      const recordMotorId = String(
        rec.motorId ?? rec.motorIdNo ?? rec.id ?? details?.motorId ?? "",
      ).trim();
      if (recordMotorId === normalizedMotorId) return rec;
    }
  }

  return null;
};

export const extractHardwareMotorMetaFromDivisionDetails = (
  payload: unknown,
  motorId: string,
): HardwareMotorManufacturingMeta => {
  const rec = findHardwareMotorRecord(payload, motorId);
  if (!rec) return emptyHardwareMotorMeta();

  return {
    ovenNo: String(rec.ovenNo ?? rec.ovenNumber ?? rec.OVEN_NUMBER ?? "").trim(),
    buildingNo: String(rec.buildingNo ?? rec.buildingNumber ?? rec.BUILDING_NO ?? "").trim(),
  };
};

const mapLegacyHardwareMotorSections = (sections: unknown[]): ManufacturingSection[] =>
  sections
    .map((section) => asRecord(section))
    .filter(Boolean)
    .map((section) => ({
      sectionId: String(section!.sectionId ?? "").trim(),
      sectionData: asArray(section!.sectionData),
    }))
    .filter((section) => section.sectionId);

const mapNestedHardwareMotorSections = (
  details: Record<string, unknown>,
): ManufacturingSection[] => {
  const sections: ManufacturingSection[] = [];

  for (const sectionId of Object.values(QC_HARDWARE_MANUFACTURING_SECTION_IDS)) {
    const block = asRecord(details[sectionId]);
    if (!block) continue;
    sections.push({
      sectionId,
      sectionData: [block],
    });
  }

  return sections;
};

const mapFlatHardwareMotorToManufacturingSections = (
  motor: Record<string, unknown>,
): ManufacturingSection[] => {
  const sections: ManufacturingSection[] = [];
  const push = (sectionId: string, block: unknown) => {
    const rec = asRecord(block);
    if (!rec || !Object.keys(rec).length) return;
    sections.push({ sectionId, sectionData: [rec] });
  };

  const abradingOperation = asRecord(motor.abradingOperation);
  const abrading = asRecord(motor.abrading);
  if (abradingOperation) {
    push(QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING, abradingOperation);
  } else if (abrading && asArray(abrading.abradingDetails).length) {
    push(QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING, abrading);
  }

  push(
    QC_HARDWARE_MANUFACTURING_SECTION_IDS.PREHEATING,
    motor.preHeating ?? motor.preheating,
  );
  push(
    QC_HARDWARE_MANUFACTURING_SECTION_IDS.LINEAR_COATING,
    motor.linerCoatingOperation ?? motor.linerCoating,
  );
  push(
    QC_HARDWARE_MANUFACTURING_SECTION_IDS.DISPATCH,
    motor.dispatchToCasting ?? motor.dispatch,
  );
  push(QC_HARDWARE_MANUFACTURING_SECTION_IDS.TCE_CLEANING, motor.tceCleaning);

  return sections;
};

export const extractHardwareMotorSectionsFromDivisionDetails = (
  payload: unknown,
  motorId: string,
): ManufacturingSection[] => {
  const rec = findHardwareMotorRecord(payload, motorId);
  if (!rec) return [];

  const details = asRecord(rec.details);
  const legacySections = asArray(details?.sections ?? rec.sections);
  if (legacySections.length) {
    return mapLegacyHardwareMotorSections(legacySections);
  }

  if (details) {
    return mapNestedHardwareMotorSections(details);
  }

  return mapFlatHardwareMotorToManufacturingSections(rec);
};

const firstSectionRecord = (
  sections: ManufacturingSection[],
  sectionId: string,
): Record<string, unknown> | null => {
  const match = sections.find((section) => section.sectionId === sectionId);
  return asRecord(asArray(match?.sectionData)[0]) ?? null;
};

const splitDateTimeValue = (value: unknown): { date: string; time: string; dateTime: string } => {
  const raw = String(value ?? "").trim();
  if (!raw) return { date: "", time: "", dateTime: "" };

  if (raw.includes("T") || /^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const parsed = dayjs(raw);
    if (parsed.isValid()) {
      return {
        date: parsed.format("DD-MM-YYYY"),
        time: parsed.format("HH:mm"),
        dateTime: parsed.format(UI_DATETIME_FORMAT),
      };
    }
  }

  const timeMatch = raw.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    return {
      date: "",
      time: `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`,
      dateTime: "",
    };
  }

  return { date: formatToUiDate(raw), time: "", dateTime: "" };
};

const findLogEntry = (
  rows: unknown[],
  matcher: string | RegExp,
): { value: string; remarks: string } => {
  for (const row of rows) {
    const rec = asRecord(row);
    if (!rec) continue;
    const label = String(rec.parameter ?? rec.operation ?? "").trim();
    if (!label) continue;
    const matches =
      typeof matcher === "string"
        ? label.localeCompare(matcher, undefined, { sensitivity: "accent" }) === 0
        : matcher.test(label);
    if (!matches) continue;
    return {
      value: String(rec.value ?? "").trim(),
      remarks: String(rec.remarks ?? rec.remarksObservations ?? rec.observations ?? "").trim(),
    };
  }
  return { value: "", remarks: "" };
};

const mapAbradingValues = (
  sections: ManufacturingSection[],
  base: SchemaFormValues,
): SchemaFormValues => {
  const section = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING);
  if (!section) return base;

  let { firstCut, secondCut } = resolveAbradingCutsFromRecord(section);
  if (!hardwareAbradingCutsHaveData(firstCut, secondCut)) {
    const legacy = mapAbradingDetailsToFirstAndSecondCut(asArray(section.abradingDetails));
    firstCut = legacy.firstCut;
    secondCut = legacy.secondCut;
  }
  const sectionId = QC_HARDWARE_SECTION_IDS.ABRADING;
  const uploads = mapHardwareUploadsFromDivisionDetails(sections);
  const firstKey = formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID);
  const secondKey = formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID);
  const baseUploads = getHardwareUploadValues(base);

  return mergeHardwareUploadValuesIntoEntryValues(
    {
      ...base,
      [firstKey]: firstCut.length > 0 ? firstCut : (base[firstKey] as QcHardwareCutRow[] | undefined),
      [secondKey]:
        secondCut.length > 0 ? secondCut : (base[secondKey] as QcHardwareCutRow[] | undefined),
    },
    {
      [QC_HARDWARE_UPLOAD_REPORT_KEY]: mergeHardwareUploadFiles(
        baseUploads[QC_HARDWARE_UPLOAD_REPORT_KEY],
        uploads[QC_HARDWARE_UPLOAD_REPORT_KEY],
        true,
      ),
      [QC_HARDWARE_UPLOAD_GRAPH_KEY]: mergeHardwareUploadFiles(
        baseUploads[QC_HARDWARE_UPLOAD_GRAPH_KEY],
        uploads[QC_HARDWARE_UPLOAD_GRAPH_KEY],
        true,
      ),
      [QC_HARDWARE_UPLOAD_PHOTO_KEY]: mergeHardwareUploadFiles(
        baseUploads[QC_HARDWARE_UPLOAD_PHOTO_KEY],
        uploads[QC_HARDWARE_UPLOAD_PHOTO_KEY],
        true,
      ),
    },
  );
};

const mapHardwareUploadsFromDivisionDetails = (
  sections: ManufacturingSection[],
): QcHardwareUploadValues => {
  const abrading = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING);
  const tceCleaning = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.TCE_CLEANING);

  const photoFiles = [
    ...asArray(abrading?.abradingDetails).flatMap((row) => {
      const rec = asRecord(row);
      if (!rec?.attachments) return [];
      return parseFileRefs(rec.attachments);
    }),
    ...asArray(abrading?.firstCut).flatMap((row) => parseFileRefs(asRecord(row)?.attachments)),
    ...asArray(abrading?.secondCut).flatMap((row) => parseFileRefs(asRecord(row)?.attachments)),
  ];

  const reportFiles = parseFileRefs(tceCleaning?.testReport);

  // Dedupe by fileId / fileName so the same attachment is not listed twice.
  const dedupe = (refs: ReturnType<typeof parseFileRefs>) => {
    const seen = new Set<string>();
    return refs.filter((ref) => {
      const key = String(ref.fileId ?? ref.fileName ?? "").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  return {
    [QC_HARDWARE_UPLOAD_REPORT_KEY]: dedupe(reportFiles),
    [QC_HARDWARE_UPLOAD_GRAPH_KEY]: [],
    [QC_HARDWARE_UPLOAD_PHOTO_KEY]: dedupe(photoFiles),
  };
};

const mapPreheatingValues = (
  sections: ManufacturingSection[],
  base: SchemaFormValues,
  motorMeta: HardwareMotorManufacturingMeta = emptyHardwareMotorMeta(),
): SchemaFormValues => {
  const section = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.PREHEATING);
  const hasMotorMeta = hasValue(motorMeta.ovenNo) || hasValue(motorMeta.buildingNo);
  if (!section && !hasMotorMeta) return base;

  const monitoring = asArray(section?.preHeatingMonitoring);
  const monitoringDate = findLogEntry(monitoring, "Date");
  const ovenStart = findLogEntry(monitoring, "Oven Start Time");
  const cycleStart = findLogEntry(monitoring, "Cycle Start Time");
  const cycleEnd = findLogEntry(monitoring, "Cycle End Time");
  const visual = findLogEntry(monitoring, /Visual Observation/i);

  const temperatureRows = asArray(section?.temperatureDuration);
  const lastTemp = asRecord(temperatureRows[temperatureRows.length - 1]);
  const firstTemp = asRecord(temperatureRows[0]);
  const peakTemp = temperatureRows.reduce<number>((max, row) => {
    const raw = Number(asRecord(row)?.value);
    if (!Number.isFinite(raw)) return max;
    return Math.max(max, raw);
  }, Number.NaN);
  const temperature = String(
    lastTemp?.value ?? firstTemp?.value ?? (Number.isFinite(peakTemp) ? peakTemp : ""),
  ).trim();

  const row: QcHardwarePreheatingRow = {
    SR_NO: 1,
    DATE: formatToUiDate(monitoringDate.value),
    START_TIME: cycleStart.value || ovenStart.value,
    END_TIME: cycleEnd.value,
    OVEN_NUMBER: motorMeta.ovenNo,
    BUILDING_NO: motorMeta.buildingNo,
    TEMPERATURE: temperature,
    VACUUM_LEVEL: String(section?.vacuumApplied ?? "").trim(),
    // Visual Observation only — do not join cycle start/end remarks.
    OBSERVATIONS: String(visual.value || visual.remarks || "").trim(),
  };

  const sectionId = QC_HARDWARE_SECTION_IDS.PREHEATING;
  return {
    ...base,
    [formKey(sectionId, QC_HARDWARE_PREHEATING_TABLE_ID)]: [row],
  };
};

const mapLinearCoatingValues = (
  sections: ManufacturingSection[],
  base: SchemaFormValues,
): SchemaFormValues => {
  const section = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.LINEAR_COATING);
  if (!section) return base;

  const log = asArray(section.linerApplicationLog);
  const logDate = findLogEntry(log, "Date");
  const start = findLogEntry(log, "Start Time");
  const end = findLogEntry(log, "End Time");
  const insulation = findLogEntry(log, /Insulation Temp/i);
  const linerQty = findLogEntry(log, /Liner Applied/i);

  const row: QcHardwareLinearCoatingRow = {
    SR_NO: 1,
    DATE: formatToUiDate(logDate.value),
    START_TIME: start.value,
    END_TIME: end.value,
    LINER_QTY: linerQty.value,
    INSULATION_TEMP: insulation.value,
    RH: String(section.rh ?? section.RH ?? "").trim(),
    // No clear visual/observation field in Case Prep liner log — leave empty.
    OBSERVATIONS: "",
  };

  const sectionId = QC_HARDWARE_SECTION_IDS.LINEAR_COATING;
  return {
    ...base,
    [formKey(sectionId, QC_HARDWARE_LINEAR_COATING_TABLE_ID)]: [row],
  };
};

const mapDispatchValues = (
  sections: ManufacturingSection[],
  base: SchemaFormValues,
): SchemaFormValues => {
  const section = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.DISPATCH);
  if (!section) return base;

  const details = asArray(section.dispatchToCastingDetails);

  const he = findLogEntry(details, /Puncturing at HE/i);
  const ne = findLogEntry(details, /Puncturing at NE/i);
  const lf = findLogEntry(details, /LF Extension/i);
  const dispatchTime = findLogEntry(details, /Dispatch Time/i);

  const visualRows = asArray(section.dispatchVisualObservations).map((row, index) => {
    const rec = asRecord(row);
    return {
      SR_NO: index + 1,
      PARAMETER: String(rec?.parameter ?? "").trim(),
      OBSERVATIONS: String(rec?.observations ?? rec?.value ?? "").trim(),
      REMARKS: String(rec?.remarks ?? "").trim(),
    };
  });

  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const { dateTime } = splitDateTimeValue(dispatchTime.value);

  return {
    ...base,
    [formKey(sectionId, "HE_PUNCTURES")]: he.value,
    [formKey(sectionId, "NE_PUNCTURES")]: ne.value,
    [formKey(sectionId, "LF_PUNCTURES")]: lf.value,
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: dateTime,
    [formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)]: visualRows.length
      ? visualRows
      : base[formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID)],
  };
};

const mergeHardwareField = (
  current: unknown,
  incoming: unknown,
  onlyIfEmpty: boolean,
): string => {
  const next = String(incoming ?? "").trim();
  if (!next) return String(current ?? "");
  const existing = String(current ?? "").trim();
  if (onlyIfEmpty && existing) return existing;
  return next;
};

/** Merge FileRef lists — never String() arrays (that yields "[object Object]"). */
const mergeHardwareUploadFiles = (
  current: unknown,
  incoming: unknown,
  onlyIfEmpty: boolean,
): FileRef[] => mergeQcDivisionFileRefsForSeed(current, incoming, onlyIfEmpty);

const mergeCutRows = (
  currentRows: QcHardwareCutRow[],
  incomingRows: QcHardwareCutRow[],
  onlyIfEmpty: boolean,
): QcHardwareCutRow[] => {
  const maxLen = Math.max(currentRows.length, incomingRows.length, 1);
  return Array.from({ length: maxLen }, (_, index) => {
    const current = currentRows[index] ?? { SR_NO: index + 1 };
    const incoming = incomingRows[index];
    if (!incoming) return { ...current, SR_NO: index + 1 };
    return {
      SR_NO: index + 1,
      DATE: mergeHardwareField(current.DATE, incoming.DATE, onlyIfEmpty),
      START_TIME: mergeHardwareField(current.START_TIME, incoming.START_TIME, onlyIfEmpty),
      END_TIME: mergeHardwareField(current.END_TIME, incoming.END_TIME, onlyIfEmpty),
      DUST_QTY: mergeHardwareField(current.DUST_QTY, incoming.DUST_QTY, onlyIfEmpty),
      OBSERVATIONS: mergeHardwareField(current.OBSERVATIONS, incoming.OBSERVATIONS, onlyIfEmpty),
    };
  });
};

const mergePreheatingRows = (
  currentRows: QcHardwarePreheatingRow[],
  incomingRows: QcHardwarePreheatingRow[],
  onlyIfEmpty: boolean,
): QcHardwarePreheatingRow[] => {
  const current = currentRows[0] ?? { SR_NO: 1 };
  const incoming = incomingRows[0];
  if (!incoming) return currentRows.length ? currentRows : [{ SR_NO: 1 }];
  return [
    {
      SR_NO: 1,
      DATE: mergeHardwareField(current.DATE, incoming.DATE, onlyIfEmpty),
      START_TIME: mergeHardwareField(current.START_TIME, incoming.START_TIME, onlyIfEmpty),
      END_TIME: mergeHardwareField(current.END_TIME, incoming.END_TIME, onlyIfEmpty),
      OVEN_NUMBER: mergeHardwareField(current.OVEN_NUMBER, incoming.OVEN_NUMBER, onlyIfEmpty),
      BUILDING_NO: mergeHardwareField(current.BUILDING_NO, incoming.BUILDING_NO, onlyIfEmpty),
      TEMPERATURE: mergeHardwareField(current.TEMPERATURE, incoming.TEMPERATURE, onlyIfEmpty),
      VACUUM_LEVEL: mergeHardwareField(current.VACUUM_LEVEL, incoming.VACUUM_LEVEL, onlyIfEmpty),
      OBSERVATIONS: mergeHardwareField(current.OBSERVATIONS, incoming.OBSERVATIONS, onlyIfEmpty),
    },
  ];
};

const mergeLinearCoatingRows = (
  currentRows: QcHardwareLinearCoatingRow[],
  incomingRows: QcHardwareLinearCoatingRow[],
  onlyIfEmpty: boolean,
): QcHardwareLinearCoatingRow[] => {
  const current = currentRows[0] ?? { SR_NO: 1 };
  const incoming = incomingRows[0];
  if (!incoming) return currentRows.length ? currentRows : [{ SR_NO: 1 }];
  return [
    {
      SR_NO: 1,
      DATE: mergeHardwareField(current.DATE, incoming.DATE, onlyIfEmpty),
      START_TIME: mergeHardwareField(current.START_TIME, incoming.START_TIME, onlyIfEmpty),
      END_TIME: mergeHardwareField(current.END_TIME, incoming.END_TIME, onlyIfEmpty),
      LINER_QTY: mergeHardwareField(current.LINER_QTY, incoming.LINER_QTY, onlyIfEmpty),
      INSULATION_TEMP: mergeHardwareField(current.INSULATION_TEMP, incoming.INSULATION_TEMP, onlyIfEmpty),
      RH: mergeHardwareField(current.RH, incoming.RH, onlyIfEmpty),
      OBSERVATIONS: mergeHardwareField(current.OBSERVATIONS, incoming.OBSERVATIONS, onlyIfEmpty),
    },
  ];
};

const normalizeIncomingVisualRows = (value: unknown): QcHardwareVisualObservationRow[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((row, index): QcHardwareVisualObservationRow | null => {
      const rec = asRecord(row);
      if (!rec) return null;
      return {
        SR_NO: Number(rec.SR_NO ?? rec.srNo) || index + 1,
        PARAMETER: String(rec.PARAMETER ?? rec.parameter ?? "").trim(),
        OBSERVATIONS: String(rec.OBSERVATIONS ?? rec.observations ?? "").trim(),
        REMARKS: String(rec.REMARKS ?? rec.remarks ?? "").trim(),
      };
    })
    .filter((row): row is QcHardwareVisualObservationRow => row != null);
};

const mergeVisualObservationRows = (
  currentRows: QcHardwareVisualObservationRow[],
  incomingRows: QcHardwareVisualObservationRow[],
  onlyIfEmpty: boolean,
): QcHardwareVisualObservationRow[] => {
  if (!incomingRows.length) return currentRows;
  const maxLen = Math.max(currentRows.length, incomingRows.length, 1);
  return Array.from({ length: maxLen }, (_, index) => {
    const current = currentRows[index] ?? { SR_NO: index + 1 };
    const incoming = incomingRows[index];
    if (!incoming) return { ...current, SR_NO: index + 1 };
    return {
      SR_NO: index + 1,
      PARAMETER: mergeHardwareField(current.PARAMETER, incoming.PARAMETER, onlyIfEmpty),
      OBSERVATIONS: mergeHardwareField(current.OBSERVATIONS, incoming.OBSERVATIONS, onlyIfEmpty),
      REMARKS: mergeHardwareField(current.REMARKS, incoming.REMARKS, onlyIfEmpty),
    };
  });
};

const mergeHardwareProcessValues = (
  current: SchemaFormValues,
  incoming: SchemaFormValues,
  subType: QcHardwareProcessSubType,
  onlyIfEmpty: boolean,
): SchemaFormValues => {
  switch (subType) {
    case "ABRADING": {
      const sectionId = QC_HARDWARE_SECTION_IDS.ABRADING;
      const firstKey = formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID);
      const secondKey = formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID);
      return mergeHardwareUploadValuesIntoEntryValues(
        {
          ...current,
          [firstKey]: mergeCutRows(
            asArray(current[firstKey]) as QcHardwareCutRow[],
            asArray(incoming[firstKey]) as QcHardwareCutRow[],
            onlyIfEmpty,
          ),
          [secondKey]: mergeCutRows(
            asArray(current[secondKey]) as QcHardwareCutRow[],
            asArray(incoming[secondKey]) as QcHardwareCutRow[],
            onlyIfEmpty,
          ),
        },
        {
          [QC_HARDWARE_UPLOAD_REPORT_KEY]: mergeHardwareUploadFiles(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_REPORT_KEY)],
            incoming[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_REPORT_KEY)],
            onlyIfEmpty,
          ),
          [QC_HARDWARE_UPLOAD_GRAPH_KEY]: mergeHardwareUploadFiles(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_GRAPH_KEY)],
            incoming[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_GRAPH_KEY)],
            onlyIfEmpty,
          ),
          [QC_HARDWARE_UPLOAD_PHOTO_KEY]: mergeHardwareUploadFiles(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_PHOTO_KEY)],
            incoming[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_PHOTO_KEY)],
            onlyIfEmpty,
          ),
        },
      );
    }
    case "PREHEATING": {
      const sectionId = QC_HARDWARE_SECTION_IDS.PREHEATING;
      const key = formKey(sectionId, QC_HARDWARE_PREHEATING_TABLE_ID);
      return {
        ...current,
        [key]: mergePreheatingRows(
          asArray(current[key]) as QcHardwarePreheatingRow[],
          asArray(incoming[key]) as QcHardwarePreheatingRow[],
          onlyIfEmpty,
        ),
      };
    }
    case "LINEAR_COATING": {
      const sectionId = QC_HARDWARE_SECTION_IDS.LINEAR_COATING;
      const key = formKey(sectionId, QC_HARDWARE_LINEAR_COATING_TABLE_ID);
      return {
        ...current,
        [key]: mergeLinearCoatingRows(
          asArray(current[key]) as QcHardwareLinearCoatingRow[],
          asArray(incoming[key]) as QcHardwareLinearCoatingRow[],
          onlyIfEmpty,
        ),
      };
    }
    case "DISPATCH": {
      const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
      const visualKey = formKey(sectionId, QC_HARDWARE_DISPATCH_VISUAL_OBSERVATIONS_TABLE_ID);
      const currentVisual = getHardwareDispatchVisualObservationRows(current);
      const incomingVisual = normalizeIncomingVisualRows(incoming[visualKey]);
      return {
        ...current,
        [formKey(sectionId, "HE_PUNCTURES")]: mergeHardwareField(
          current[formKey(sectionId, "HE_PUNCTURES")],
          incoming[formKey(sectionId, "HE_PUNCTURES")],
          onlyIfEmpty,
        ),
        [formKey(sectionId, "NE_PUNCTURES")]: mergeHardwareField(
          current[formKey(sectionId, "NE_PUNCTURES")],
          incoming[formKey(sectionId, "NE_PUNCTURES")],
          onlyIfEmpty,
        ),
        [formKey(sectionId, "LF_PUNCTURES")]: mergeHardwareField(
          current[formKey(sectionId, "LF_PUNCTURES")],
          incoming[formKey(sectionId, "LF_PUNCTURES")],
          onlyIfEmpty,
        ),
        [formKey(sectionId, "DISPATCH_DATE_TIME")]: mergeHardwareField(
          current[formKey(sectionId, "DISPATCH_DATE_TIME")],
          incoming[formKey(sectionId, "DISPATCH_DATE_TIME")],
          onlyIfEmpty,
        ),
        [visualKey]: mergeVisualObservationRows(currentVisual, incomingVisual, onlyIfEmpty),
      };
    }
    default:
      return current;
  }
};

export const buildHardwareProcessValuesFromPayload = (
  payload: unknown,
  motorId: string,
  subType: QcHardwareProcessSubType,
): SchemaFormValues => {
  let values = createInitialHardwareProcessValues(subType);

  const uiMotor = findHardwareMotorDetailInData(payload, motorId);
  if (uiMotor) {
    values = sliceHardwareEntrySchemaValues(
      hydrateHardwareValuesFromMotorDetail(uiMotor),
      subType,
    );
  }

  const payloadSources = [
    payload,
    resolveManufacturingDivisionDetailsPayload(payload),
    asRecord(payload)?.__manufacturingDivisionData,
    asRecord(payload)?.__qcFormDivisionData,
  ].filter((source, index, list) => source != null && list.indexOf(source) === index);

  for (const source of payloadSources) {
    const sections = extractHardwareMotorSectionsFromDivisionDetails(source, motorId);
    const motorMeta = extractHardwareMotorMetaFromDivisionDetails(source, motorId);
    const hasMotorMeta = hasValue(motorMeta.ovenNo) || hasValue(motorMeta.buildingNo);
    if (!sections.length && !(subType === "PREHEATING" && hasMotorMeta)) continue;

    let sectionValues = createInitialHardwareProcessValues(subType);
    switch (subType) {
      case "ABRADING":
        sectionValues = mapAbradingValues(sections, sectionValues);
        break;
      case "PREHEATING":
        sectionValues = mapPreheatingValues(sections, sectionValues, motorMeta);
        break;
      case "LINEAR_COATING":
        sectionValues = mapLinearCoatingValues(sections, sectionValues);
        break;
      case "DISPATCH":
        sectionValues = mapDispatchValues(sections, sectionValues);
        break;
      default:
        break;
    }
    values = mergeHardwareProcessValues(values, sectionValues, subType, true);
  }

  return values;
};

export const hydrateHardwareProcessValuesFromDivisionDetails = buildHardwareProcessValuesFromPayload;

export const applyHardwareDivisionDetailsSeed = (
  values: SchemaFormValues | null | undefined,
  payload: unknown,
  motorId: string,
  subType: QcHardwareProcessSubType,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const onlyIfEmpty = options?.onlyIfEmpty !== false;
  const seeded = buildHardwareProcessValuesFromPayload(payload, motorId, subType);
  const current = values ?? createInitialHardwareProcessValues(subType);
  if (!onlyIfEmpty) return seeded;
  return mergeHardwareProcessValues(current, seeded, subType, true);
};

export const applyHardwareSharedUploadsToEntryValues = <
  T extends { schemaValues?: SchemaFormValues },
>(
  entries: QcDivisionEntry[],
  entryValues: Record<string, T>,
  savedSections?: SchemaSectionSubmission[] | null,
): Record<string, T> => {
  const hardwareEntries = entries.filter((entry) => entry.kind === "HARDWARE_PROCESS");
  const motorsSeen = new Set<string>();
  let nextValues = { ...entryValues };

  for (const entry of hardwareEntries) {
    const motorId = String(entry.motorId ?? "").trim();
    if (!motorId || motorsSeen.has(motorId)) continue;
    motorsSeen.add(motorId);

    const anchor = resolveHardwareUploadAnchorEntry(hardwareEntries, motorId);
    if (!anchor) continue;

    const motorSections = collectHardwareMotorSections(motorId, hardwareEntries, savedSections);
    const uploads = hydrateHardwareUploadValuesFromSections(motorSections);
    const hasUploadData = Object.values(uploads).some(
      (value) => Array.isArray(value) && value.length > 0,
    );
    if (!hasUploadData) continue;

    const anchorValues =
      nextValues[anchor.entryId]?.schemaValues ??
      createInitialHardwareProcessValues("ABRADING");
    // onlyIfEmpty per type — never replace live Graph/Report/Photo temps with empty/partial server lists.
    const currentUploads = getHardwareUploadValues(anchorValues);
    nextValues = {
      ...nextValues,
      [anchor.entryId]: {
        ...(nextValues[anchor.entryId] ?? {}),
        schemaValues: mergeHardwareUploadValuesIntoEntryValues(anchorValues, {
          [QC_HARDWARE_UPLOAD_REPORT_KEY]: mergeHardwareUploadFiles(
            currentUploads[QC_HARDWARE_UPLOAD_REPORT_KEY],
            uploads[QC_HARDWARE_UPLOAD_REPORT_KEY],
            true,
          ),
          [QC_HARDWARE_UPLOAD_GRAPH_KEY]: mergeHardwareUploadFiles(
            currentUploads[QC_HARDWARE_UPLOAD_GRAPH_KEY],
            uploads[QC_HARDWARE_UPLOAD_GRAPH_KEY],
            true,
          ),
          [QC_HARDWARE_UPLOAD_PHOTO_KEY]: mergeHardwareUploadFiles(
            currentUploads[QC_HARDWARE_UPLOAD_PHOTO_KEY],
            uploads[QC_HARDWARE_UPLOAD_PHOTO_KEY],
            true,
          ),
        }),
      },
    } as Record<string, T>;
  }

  return nextValues;
};
