import dayjs from "dayjs";
import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
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
  QC_HARDWARE_UPLOAD_GRAPH_KEY,
  QC_HARDWARE_UPLOAD_PHOTO_KEY,
  QC_HARDWARE_UPLOAD_REPORT_KEY,
  collectHardwareMotorSections,
  createInitialHardwareProcessValues,
  hydrateHardwareUploadValuesFromSections,
  mergeHardwareUploadValuesIntoEntryValues,
  type QcHardwareCutRow,
  type QcHardwareLinearCoatingRow,
  type QcHardwarePreheatingRow,
  type QcHardwareUploadValues,
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
  const root = resolveManufacturingDivisionDetailsPayload(payload);
  if (!root) return null;

  const data = asRecord(root.data) ?? root;
  const normalizedMotorId = String(motorId ?? "").trim();
  if (!normalizedMotorId) return null;

  for (const motor of asArray(data.motors)) {
    const rec = asRecord(motor);
    if (!rec) continue;
    if (String(rec.motorId ?? rec.id ?? "").trim() !== normalizedMotorId) continue;
    return rec;
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

export const extractHardwareMotorSectionsFromDivisionDetails = (
  payload: unknown,
  motorId: string,
): ManufacturingSection[] => {
  const rec = findHardwareMotorRecord(payload, motorId);
  if (!rec) return [];

  const details = asRecord(rec.details);
  const sections = asArray(details?.sections ?? rec.sections);
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
      value: String(rec.value ?? rec.observations ?? "").trim(),
      remarks: String(rec.remarks ?? rec.remarksObservations ?? rec.observations ?? "").trim(),
    };
  }
  return { value: "", remarks: "" };
};

const joinObservations = (...parts: Array<string | undefined>) =>
  parts.map((part) => String(part ?? "").trim()).filter(Boolean).join(" — ");

const cutRowHasData = (row: Partial<QcHardwareCutRow>) =>
  hasValue(row.DATE) ||
  hasValue(row.START_TIME) ||
  hasValue(row.END_TIME) ||
  hasValue(row.DUST_QTY) ||
  hasValue(row.OBSERVATIONS);

const mapAbradingDetailsToCutRows = (abradingDetails: unknown[]): QcHardwareCutRow[] => {
  const rows: QcHardwareCutRow[] = [];
  let current: Partial<QcHardwareCutRow> = {};

  const flush = () => {
    if (!cutRowHasData(current)) {
      current = {};
      return;
    }
    rows.push({
      SR_NO: rows.length + 1,
      DATE: String(current.DATE ?? ""),
      START_TIME: String(current.START_TIME ?? ""),
      END_TIME: String(current.END_TIME ?? ""),
      DUST_QTY: String(current.DUST_QTY ?? ""),
      OBSERVATIONS: String(current.OBSERVATIONS ?? ""),
    });
    current = {};
  };

  for (const item of abradingDetails) {
    const rec = asRecord(item);
    if (!rec) continue;
    const operation = String(rec.operation ?? "").trim();
    const value = String(rec.value ?? "").trim();
    const remarks = String(rec.remarksObservations ?? rec.remarks ?? "").trim();

    if (/^Start Date & Time$/i.test(operation)) {
      flush();
      const { date, time } = splitDateTimeValue(value);
      current.DATE = date;
      current.START_TIME = time;
      if (remarks) current.OBSERVATIONS = remarks;
      continue;
    }

    if (/^End Date & Time$/i.test(operation)) {
      const { date, time } = splitDateTimeValue(value);
      if (!current.DATE && date) current.DATE = date;
      current.END_TIME = time;
      if (remarks && !current.OBSERVATIONS) current.OBSERVATIONS = remarks;
      continue;
    }

    if (/Dust Weight/i.test(operation) && !/Total/i.test(operation)) {
      current.DUST_QTY = value;
      if (remarks) current.OBSERVATIONS = remarks;
    }
  }

  flush();
  return rows;
};

const collectAttachmentNames = (...values: unknown[]): string[] => {
  const names = new Set<string>();
  for (const value of values) {
    String(value ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => names.add(entry));
  }
  return Array.from(names);
};

const mapHardwareUploadsFromDivisionDetails = (
  sections: ManufacturingSection[],
): QcHardwareUploadValues => {
  const abrading = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING);
  const tceCleaning = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.TCE_CLEANING);

  const abradingAttachments = asArray(abrading?.abradingDetails).flatMap((row) => {
    const rec = asRecord(row);
    return rec?.attachments ? [String(rec.attachments)] : [];
  });

  const reportFiles = collectAttachmentNames(tceCleaning?.testReport);
  const photoFiles = collectAttachmentNames(...abradingAttachments);

  return {
    [QC_HARDWARE_UPLOAD_REPORT_KEY]: reportFiles.join(", "),
    [QC_HARDWARE_UPLOAD_GRAPH_KEY]: "",
    [QC_HARDWARE_UPLOAD_PHOTO_KEY]: photoFiles.join(", "),
  };
};

const mapAbradingValues = (
  sections: ManufacturingSection[],
  base: SchemaFormValues,
): SchemaFormValues => {
  const section = firstSectionRecord(sections, QC_HARDWARE_MANUFACTURING_SECTION_IDS.ABRADING);
  if (!section) return base;

  const cutRows = mapAbradingDetailsToCutRows(asArray(section.abradingDetails));
  const sectionId = QC_HARDWARE_SECTION_IDS.ABRADING;
  const uploads = mapHardwareUploadsFromDivisionDetails(sections);

  return mergeHardwareUploadValuesIntoEntryValues(
    {
      ...base,
      [formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID)]:
        cutRows[0] != null ? [cutRows[0]] : base[formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID)],
      [formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID)]:
        cutRows[1] != null ? [cutRows[1]] : base[formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID)],
    },
    uploads,
  );
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
  const ovenStart = findLogEntry(monitoring, "Oven Start Time");
  const cycleStart = findLogEntry(monitoring, "Cycle Start Time");
  const cycleEnd = findLogEntry(monitoring, "Cycle End Time");
  const visual = findLogEntry(monitoring, /Visual Observation/i);

  const firstTemp = asRecord(asArray(section?.temperatureDuration)[0]);
  const row: QcHardwarePreheatingRow = {
    SR_NO: 1,
    DATE: "",
    START_TIME: cycleStart.value || ovenStart.value,
    END_TIME: cycleEnd.value,
    OVEN_NUMBER: motorMeta.ovenNo,
    BUILDING_NO: motorMeta.buildingNo,
    TEMPERATURE: String(firstTemp?.value ?? "").trim(),
    VACUUM_LEVEL: String(section?.vacuumApplied ?? "").trim(),
    OBSERVATIONS: joinObservations(visual.value, visual.remarks, cycleStart.remarks, cycleEnd.remarks),
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
  const start = findLogEntry(log, "Start Time");
  const end = findLogEntry(log, "End Time");
  const insulation = findLogEntry(log, /Insulation Temp/i);
  const linerQty = findLogEntry(log, /Liner Applied/i);

  const row: QcHardwareLinearCoatingRow = {
    SR_NO: 1,
    DATE: "",
    START_TIME: start.value,
    END_TIME: end.value,
    LINER_QTY: linerQty.value,
    INSULATION_TEMP: insulation.value,
    RH: String(section.rh ?? section.RH ?? "").trim(),
    OBSERVATIONS: joinObservations(start.remarks, end.remarks, linerQty.remarks, insulation.remarks),
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
  const visualRows = asArray(section.dispatchVisualObservations);

  const he = findLogEntry(details, /Puncturing at HE/i);
  const ne = findLogEntry(details, /Puncturing at NE/i);
  const dispatchTime = findLogEntry(details, /Dispatch Time/i);

  const visualObservations = visualRows
    .map((row) => {
      const rec = asRecord(row);
      if (!rec) return "";
      const parameter = String(rec.parameter ?? "").trim();
      const observation = String(rec.observations ?? rec.value ?? "").trim();
      if (!parameter && !observation) return "";
      if (parameter && observation) return `${parameter}: ${observation}`;
      return parameter || observation;
    })
    .filter(Boolean)
    .join("\n");

  const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
  const { dateTime } = splitDateTimeValue(dispatchTime.value);

  return {
    ...base,
    [formKey(sectionId, "HE_PUNCTURES")]: he.value,
    [formKey(sectionId, "NE_PUNCTURES")]: ne.value,
    [formKey(sectionId, "DISPATCH_DATE_TIME")]: dateTime,
    [formKey(sectionId, "OBSERVATIONS")]: visualObservations,
  };
};

export const hydrateHardwareProcessValuesFromDivisionDetails = (
  payload: unknown,
  motorId: string,
  subType: QcHardwareProcessSubType,
): SchemaFormValues => {
  const sections = extractHardwareMotorSectionsFromDivisionDetails(payload, motorId);
  const motorMeta = extractHardwareMotorMetaFromDivisionDetails(payload, motorId);
  const base = createInitialHardwareProcessValues(subType);
  const hasMotorMeta = hasValue(motorMeta.ovenNo) || hasValue(motorMeta.buildingNo);
  if (!sections.length && !(subType === "PREHEATING" && hasMotorMeta)) return base;

  switch (subType) {
    case "ABRADING":
      return mapAbradingValues(sections, base);
    case "PREHEATING":
      return mapPreheatingValues(sections, base, motorMeta);
    case "LINEAR_COATING":
      return mapLinearCoatingValues(sections, base);
    case "DISPATCH":
      return mapDispatchValues(sections, base);
    default:
      return base;
  }
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

export const applyHardwareDivisionDetailsSeed = (
  values: SchemaFormValues | null | undefined,
  payload: unknown,
  motorId: string,
  subType: QcHardwareProcessSubType,
  options?: { onlyIfEmpty?: boolean },
): SchemaFormValues => {
  const onlyIfEmpty = options?.onlyIfEmpty !== false;
  const seeded = hydrateHardwareProcessValuesFromDivisionDetails(payload, motorId, subType);
  const current = values ?? createInitialHardwareProcessValues(subType);
  if (!onlyIfEmpty) return seeded;

  switch (subType) {
    case "ABRADING": {
      const sectionId = QC_HARDWARE_SECTION_IDS.ABRADING;
      const firstKey = formKey(sectionId, QC_HARDWARE_ABRADING_FIRST_CUT_TABLE_ID);
      const secondKey = formKey(sectionId, QC_HARDWARE_ABRADING_SECOND_CUT_TABLE_ID);
      const seededFirst = asArray(seeded[firstKey]) as QcHardwareCutRow[];
      const seededSecond = asArray(seeded[secondKey]) as QcHardwareCutRow[];
      return mergeHardwareUploadValuesIntoEntryValues(
        {
          ...current,
          [firstKey]: mergeCutRows(asArray(current[firstKey]) as QcHardwareCutRow[], seededFirst, true),
          [secondKey]: mergeCutRows(
            asArray(current[secondKey]) as QcHardwareCutRow[],
            seededSecond,
            true,
          ),
        },
        {
          [QC_HARDWARE_UPLOAD_REPORT_KEY]: mergeHardwareField(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_REPORT_KEY)],
            seeded[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_REPORT_KEY)],
            true,
          ),
          [QC_HARDWARE_UPLOAD_GRAPH_KEY]: mergeHardwareField(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_GRAPH_KEY)],
            seeded[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_GRAPH_KEY)],
            true,
          ),
          [QC_HARDWARE_UPLOAD_PHOTO_KEY]: mergeHardwareField(
            current[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_PHOTO_KEY)],
            seeded[formKey(QC_HARDWARE_ATTACHMENTS_SECTION_ID, QC_HARDWARE_UPLOAD_PHOTO_KEY)],
            true,
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
          asArray(seeded[key]) as QcHardwarePreheatingRow[],
          true,
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
          asArray(seeded[key]) as QcHardwareLinearCoatingRow[],
          true,
        ),
      };
    }
    case "DISPATCH": {
      const sectionId = QC_HARDWARE_SECTION_IDS.DISPATCH;
      return {
        ...current,
        [formKey(sectionId, "HE_PUNCTURES")]: mergeHardwareField(
          current[formKey(sectionId, "HE_PUNCTURES")],
          seeded[formKey(sectionId, "HE_PUNCTURES")],
          true,
        ),
        [formKey(sectionId, "NE_PUNCTURES")]: mergeHardwareField(
          current[formKey(sectionId, "NE_PUNCTURES")],
          seeded[formKey(sectionId, "NE_PUNCTURES")],
          true,
        ),
        [formKey(sectionId, "DISPATCH_DATE_TIME")]: mergeHardwareField(
          current[formKey(sectionId, "DISPATCH_DATE_TIME")],
          seeded[formKey(sectionId, "DISPATCH_DATE_TIME")],
          true,
        ),
        [formKey(sectionId, "OBSERVATIONS")]: mergeHardwareField(
          current[formKey(sectionId, "OBSERVATIONS")],
          seeded[formKey(sectionId, "OBSERVATIONS")],
          true,
        ),
      };
    }
    default:
      return current;
  }
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
    const hasUploadData = Object.values(uploads).some((value) => hasValue(value));
    if (!hasUploadData) continue;

    const anchorValues =
      nextValues[anchor.entryId]?.schemaValues ??
      createInitialHardwareProcessValues("ABRADING");
    nextValues = {
      ...nextValues,
      [anchor.entryId]: {
        ...(nextValues[anchor.entryId] ?? {}),
        schemaValues: mergeHardwareUploadValuesIntoEntryValues(anchorValues, uploads),
      },
    };
  }

  return nextValues;
};
