import {
  createProcessParticularRows,
  createQualityCheckRows,
  getMixingCycleByValue,
  isQuadObservedLayout,
  normalizeQualityCheckParameterKey,
  type QualityObservedLayout,
} from "../../../hooks/user/manufacturing/mixingConfig";
import { normalizeApproverBatchStatus } from "../approver/ApproverBatchListModel";
import { formatSubdepartmentBatchTypeLabel } from "./SubdepartmentBatchModel";

export type ProcessParticularRow = {
  id: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type QualityCheckRow = {
  parameter: string;
  specification: string;
  observedLayout: QualityObservedLayout;
  observed1: string;
  observed2: string;
  observed3: string;
  observed4: string;
};

export type PremixEntry = {
  premixNo: string;
  mixerBldgNo: string;
  bowlId: string;
  bowlTrialDate: string;
  bowlTrialObservations: string;
  premixDate: string;
  premixQuantity: string;
  mixingCycle: string;
  processParticulars: ProcessParticularRow[];
  qualityChecks: QualityCheckRow[];
};

export type FinalMixEntry = {
  mixNo: string;
  linkedPremixNo: string;
  mixerBldgNo: string;
  bowlId: string;
  finalMixCycle: string;
  qualityChecks: QualityCheckRow[];
};

export type MixingFormState = {
  premixCards: PremixEntry[];
  finalMixCards: FinalMixEntry[];
};
export type MixingStage = {
  stageType: string;
  premixes: any[];
};
export type MixingDetails = {
  formId: string;
  batchId: string;
  batchType?: string;
  subDepartmentId: number;
  formSubmissionType: string;
  status?: string;
  createdBy?: unknown;
  createdAt?: string;
  submittedBy?: unknown;
  submittedAt?: string | null;
  mixingDetails?: {
    stages: MixingStage[];
  };
};

const coerceFieldValue = (value: unknown) => String(value ?? "").trim();

const mapApiProcessRows = (
  sections: any[]
): ProcessParticularRow[] => {

  const rows: ProcessParticularRow[] = [];

  sections.forEach(section => {
    const row: ProcessParticularRow = {
      id: rows.length + 1,
      operation: section.sectionName ?? "",
      rpm: "",
      time: "",
      temp: "",
      vacuum: "",
    };

    section.rows?.forEach((field: any) => {
      const value = coerceFieldValue(field.value);
      switch (field.fieldLabel) {
        case "RPM":
          row.rpm = value;
          break;

        case "Time":
          row.time = value;
          break;

        case "Temperature":
          row.temp = value;
          break;

        case "Vacuum Applied":
          row.vacuum = value;
          break;
      }
    });

    rows.push(row);
  });

  return rows;
};
const normalizeProcessRow = (row: any, fallbackOperation = "", fallbackId?: number): ProcessParticularRow => ({
  id: Number(row?.id ?? fallbackId ?? 0),
  operation: String(row?.operation ?? row?.operationLabel ?? fallbackOperation),
  rpm: String(row?.rpm ?? ""),
  time: String(row?.time ?? ""),
  temp: String(row?.temp ?? ""),
  vacuum: String(row?.vacuum ?? ""),
});

const normalizeQualityRow = (row: any, fallback: QualityCheckRow): QualityCheckRow => ({
  parameter: String(row?.parameter ?? fallback.parameter),
  specification: String(row?.specification ?? fallback.specification),
  observedLayout: row?.observedLayout ?? fallback.observedLayout,
  observed1: String(row?.observed1 ?? ""),
  observed2: String(row?.observed2 ?? ""),
  observed3: String(row?.observed3 ?? ""),
  observed4: String(row?.observed4 ?? ""),
});

export const createEmptyPremixEntry = (premixNo: number): PremixEntry => ({
  premixNo: String(premixNo),
  mixerBldgNo: "",
  bowlId: "",
  bowlTrialDate: "",
  bowlTrialObservations: "",
  premixDate: "",
  premixQuantity: "",
  mixingCycle: "",
  processParticulars: [],
  qualityChecks: createQualityCheckRows(),
});

export const createEmptyFinalMixEntry = (mixNo: number): FinalMixEntry => ({
  mixNo: String(mixNo),
  linkedPremixNo: "",
  mixerBldgNo: "",
  bowlId: "",
  finalMixCycle: "",
  qualityChecks: createQualityCheckRows(),
});

/** Resolves linked premix from FINAL_MIX API entry (premixNo when linkedPremixNo is omitted). */
const resolveApiLinkedPremixNo = (entry: Record<string, unknown> | null | undefined): string => {
  const explicit =
    entry?.linkedPremixNo ??
    (entry?.linkedPremix as { premixNo?: unknown } | undefined)?.premixNo ??
    entry?.linkedPremixNumber ??
    entry?.parentPremixNo;

  if (explicit != null && String(explicit).trim() !== "") {
    return coerceFieldValue(explicit);
  }

  return coerceFieldValue(entry?.premixNo);
};

const normalizeFinalMixEntry = (entry: Partial<FinalMixEntry>, fallbackNo: number): FinalMixEntry => {
  const qualityChecks = mapApiQualityChecksToRows(
  entry.qualityChecks
);
  return {
    mixNo: coerceFieldValue(entry.mixNo ?? fallbackNo),
    linkedPremixNo: coerceFieldValue(entry.linkedPremixNo ?? ""),
    mixerBldgNo: String(entry.mixerBldgNo ?? ""),
    bowlId: String(entry.bowlId ?? ""),
    finalMixCycle: String(entry.finalMixCycle ?? ""),
    qualityChecks,
  };
};

export const createDefaultMixingFormState = (): MixingFormState => ({
  premixCards: [],
  finalMixCards: [],
});

const resolveProcessParticulars = (premix: Partial<PremixEntry>): ProcessParticularRow[] => {
  if (Array.isArray(premix.processParticulars) && premix.processParticulars.length > 0) {
    return premix.processParticulars.map((row, index) =>
      normalizeProcessRow(row, row.operation, index + 1),
    );
  }

  const cycle = getMixingCycleByValue(String(premix.mixingCycle ?? ""));
  if (cycle) {
    return createProcessParticularRows(cycle.operations);
  }

  return [];
};

type QualityCheckApiKind = "homogeneity" | "moisture" | "viscosity" | "temperature";

const QUALITY_CHECK_KIND_BY_KEY: Record<string, QualityCheckApiKind> = {
  homogeneity: "homogeneity",
  moisture: "moisture",
  moisturepercent: "moisture",
  eomviscosity: "viscosity",
  eomtemperature: "temperature",
};

const getQualityCheckKind = (parameter: string): QualityCheckApiKind | null =>
  QUALITY_CHECK_KIND_BY_KEY[normalizeQualityCheckParameterKey(parameter)] ?? null;

const findQualityCheckRow = (rows: QualityCheckRow[], kind: QualityCheckApiKind) =>
  rows.find((row) => getQualityCheckKind(row.parameter) === kind);

const findHomogeneitySampleValue = (samples: any[], sampleNo: number) => {
  const match = (samples ?? []).find((sample) => Number(sample?.sampleNo) === sampleNo);
  return coerceFieldValue(match?.observedValue);
};

const mapApiQualityChecksToRows = (qualityChecks: any): QualityCheckRow[] => {
  const defaults = createQualityCheckRows();

  return defaults.map((row) => {
    switch (getQualityCheckKind(row.parameter)) {
      case "homogeneity": {
        const h = qualityChecks?.homogeneity ?? [];

        return {
          ...row,
          observed1: findHomogeneitySampleValue(h, 1),
          observed2: findHomogeneitySampleValue(h, 2),
          observed3: findHomogeneitySampleValue(h, 3),
          observed4: findHomogeneitySampleValue(h, 4),
        };
      }

      case "moisture": {
        const m = qualityChecks?.moisturePercentage;

        return {
          ...row,
          specification: coerceFieldValue(m?.specification ?? row.specification),
          observed1: coerceFieldValue(m?.observedValues?.[0]),
          observed2: coerceFieldValue(m?.observedValues?.[1]),
          observed3: coerceFieldValue(m?.observedValues?.[2]),
          observed4: coerceFieldValue(m?.observedValues?.[3]),
        };
      }

      case "viscosity": {
        const v = qualityChecks?.eomViscosity;

        return {
          ...row,
          specification: coerceFieldValue(v?.specification ?? row.specification),
          observed1: coerceFieldValue(v?.observedValues?.[0]),
          observed2: coerceFieldValue(v?.observedValues?.[1]),
          observed3: coerceFieldValue(v?.observedValues?.[2]),
          observed4: coerceFieldValue(v?.observedValues?.[3]),
        };
      }

      case "temperature": {
        const t = qualityChecks?.eomTemperature;

        return {
          ...row,
          specification: coerceFieldValue(t?.specification ?? row.specification),
          observed1: coerceFieldValue(t?.observedValues?.[0]),
          observed2: coerceFieldValue(t?.observedValues?.[1]),
          observed3: coerceFieldValue(t?.observedValues?.[2]),
          observed4: coerceFieldValue(t?.observedValues?.[3]),
        };
      }

      default:
        return row;
    }
  });
};

const normalizePremixEntry = (premix: Partial<PremixEntry>, fallbackNo: number): PremixEntry => {
  const qualityChecks = mapApiQualityChecksToRows(
    premix.qualityChecks
);

  return {
    premixNo: coerceFieldValue(premix.premixNo ?? fallbackNo),
    mixerBldgNo: String(premix.mixerBldgNo ?? ""),
    bowlId: String(premix.bowlId ?? ""),
    bowlTrialDate: String(premix.bowlTrialDate ?? ""),
    bowlTrialObservations: String(premix.bowlTrialObservations ?? ""),
    premixDate: String(premix.premixDate ?? ""),
    premixQuantity: String(premix.premixQuantity ?? ""),
    mixingCycle: String(premix.mixingCycle ?? ""),
    processParticulars: resolveProcessParticulars(premix),
    qualityChecks,
  };
};

export const mapMixingDetailsToFormState = (
  details: Partial<MixingDetails>,
): MixingFormState => {

  const stages = details?.mixingDetails?.stages ?? [];

  const premixStage = stages.find(
    (stage) => stage.stageType === "PREMIX",
  );

  const finalMixStage = stages.find(
    (stage) => stage.stageType === "FINAL_MIX",
  );

  const apiPremixes = premixStage?.premixes ?? [];
  const apiFinalMixes = finalMixStage?.premixes ?? [];

  return {
    premixCards: apiPremixes.map((premix: any, index: number) =>
      normalizePremixEntry(
        {
          premixNo: premix.premixNo,

          mixerBldgNo:
            premix?.mixerConfiguration?.mixerId ?? "",

          bowlId:
            premix?.mixerConfiguration?.bowlId ?? "",

          bowlTrialDate:
            premix?.trialDetails?.trialDate ?? "",

          bowlTrialObservations:
            premix?.trialDetails?.observations ?? "",

          premixDate:
            premix?.mixDetails?.mixDate ?? "",

          premixQuantity:
            coerceFieldValue(premix?.mixDetails?.mixQuantity),

          mixingCycle:
            premix?.mixingCycle?.cycleId ?? "",

          processParticulars:
            mapApiProcessRows(
              premix?.processParticulars ?? []
            ),

          qualityChecks:
            premix?.qualityChecks ?? {},
        },
        Number(premix?.premixNo) || index + 1,
      ),
    ),

    finalMixCards: apiFinalMixes.map((entry: any, index: number) =>
      normalizeFinalMixEntry(
        {
          mixNo: entry?.finalMixNo ?? entry?.mixNo ?? index + 1,

          linkedPremixNo: resolveApiLinkedPremixNo(entry),

          mixerBldgNo:
            entry?.mixerConfiguration?.mixerId ?? "",

          bowlId:
            entry?.mixerConfiguration?.bowlId ?? "",

          finalMixCycle:
            entry?.mixingCycle?.cycleId ?? "",

          qualityChecks:
            entry?.qualityChecks ?? {},
        },
        index + 1,
      ),
    ),
  };
};
const mapProcessRowsToApi = (
  rows: ProcessParticularRow[]
) => {
  return rows.map((row, index) => ({
    sectionId: `SEC-${index + 1}`,
    sectionName: row.operation,

    rows: [
      {
        fieldId: `RPM-${index + 1}`,
        fieldLabel: "RPM",
        value: row.rpm ?? "",
      },
      {
        fieldId: `TIME-${index + 1}`,
        fieldLabel: "Time",
        value: row.time ?? "",
      },
      {
        fieldId: `TEMP-${index + 1}`,
        fieldLabel: "Temperature",
        value: row.temp ?? "",
      },
      {
        fieldId: `VAC-${index + 1}`,
        fieldLabel: "Vacuum Applied",
        value: row.vacuum ?? "",
      },
    ],
  }));
};
const mapQualityChecksToApi = (rows: QualityCheckRow[]) => {
  const homogeneity = findQualityCheckRow(rows, "homogeneity");
  const moisture = findQualityCheckRow(rows, "moisture");
  const viscosity = findQualityCheckRow(rows, "viscosity");
  const temperature = findQualityCheckRow(rows, "temperature");

  const collectObservedValues = (row: QualityCheckRow | undefined) =>
    row
      ? [row.observed1, row.observed2, row.observed3, row.observed4].filter((value) =>
          String(value ?? "").trim() !== "",
        )
      : [];

  return {
    homogeneity: homogeneity
      ? [
          homogeneity.observed1 && {
            sampleNo: 1,
            observedValue: homogeneity.observed1,
          },
          homogeneity.observed2 && {
            sampleNo: 2,
            observedValue: homogeneity.observed2,
          },
          homogeneity.observed3 && {
            sampleNo: 3,
            observedValue: homogeneity.observed3,
          },
          homogeneity.observed4 && {
            sampleNo: 4,
            observedValue: homogeneity.observed4,
          },
        ].filter(Boolean)
      : [],

    moisturePercentage: moisture
      ? {
          specification: moisture.specification,
          observedValues: collectObservedValues(moisture),
        }
      : null,

    eomViscosity: viscosity
      ? {
          specification: viscosity.specification,
          observedValues: collectObservedValues(viscosity),
        }
      : null,

    eomTemperature: temperature
      ? {
          specification: temperature.specification,
          observedValues: collectObservedValues(temperature),
        }
      : null,
  };
};
export const mapMixingFormStateToPayload = (
  form: MixingFormState,
) => ({
  mixingDetails: {
    stages: [
      {
        stageType: "PREMIX",

        premixes: (form.premixCards ?? []).map(
          (premix) => ({
            premixNo:
              Number(premix.premixNo) || 0,

            mixerConfiguration: {
              mixerId:
                premix.mixerBldgNo,

              bowlId:
                premix.bowlId,
            },

            trialDetails: {
              trialDate:
                premix.bowlTrialDate || null,

              observations:
                premix.bowlTrialObservations,
            },

            mixDetails: {
              mixDate:
                premix.premixDate || null,

              mixQuantity:
                premix.premixQuantity || null,
            },

            mixingCycle: {
              cycleId:
                premix.mixingCycle,

              cycleName:
                premix.mixingCycle,
            },

            processParticulars:
              mapProcessRowsToApi(
                premix.processParticulars ?? []
              ),
            qualityChecks:
              mapQualityChecksToApi(premix.qualityChecks),
          }),
        ),
      },

      {
        stageType: "FINAL_MIX",

        premixes: (form.finalMixCards ?? []).map(
          (entry) => ({
            premixNo:
              Number(entry.mixNo) || 0,

            linkedPremixNo:
              Number(entry.linkedPremixNo) || null,

            mixerConfiguration: {
              mixerId:
                entry.mixerBldgNo,

              bowlId:
                entry.bowlId,
            },

            mixingCycle: {
              cycleId:
                entry.finalMixCycle,

              cycleName:
                entry.finalMixCycle,
            },

            qualityChecks:
              mapQualityChecksToApi(entry.qualityChecks),
          }),
        ),
      },
    ],
  },
});

const hasValue = (value: unknown) => String(value ?? "").trim().length > 0;

const premixHasValue = (premix: PremixEntry) => {
  const headerFilled =
    hasValue(premix.mixerBldgNo) ||
    hasValue(premix.bowlId) ||
    hasValue(premix.bowlTrialDate) ||
    hasValue(premix.bowlTrialObservations) ||
    hasValue(premix.premixDate) ||
    hasValue(premix.premixQuantity) ||
    hasValue(premix.mixingCycle);

  const processFilled = (premix.processParticulars ?? []).some((row) =>
    [row.rpm, row.time, row.temp, row.vacuum].some(hasValue),
  );

  const qualityFilled = (premix.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || processFilled || qualityFilled;
};

const finalMixHasValue = (entry: FinalMixEntry) => {
  const headerFilled =
    hasValue(entry.linkedPremixNo) ||
    hasValue(entry.mixerBldgNo) ||
    hasValue(entry.bowlId) ||
    hasValue(entry.finalMixCycle);

  const qualityFilled = (entry.qualityChecks ?? []).some((row) => {
    if (isQuadObservedLayout(row.observedLayout)) {
      return [row.observed1, row.observed2, row.observed3, row.observed4].some(hasValue);
    }
    return hasValue(row.observed1);
  });

  return headerFilled || qualityFilled;
};

export const hasAnyMixingValue = (form: MixingFormState) =>
  (form.premixCards ?? []).some(premixHasValue) ||
  (form.finalMixCards ?? []).some(finalMixHasValue);

export type MixingDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  formSubmissionType: string;
  status: string;
  submittedBy: string;
  submittedAt: string;
  createdBy: string;
  createdAt: string;
  premixCards: PremixEntry[];
  finalMixCards: FinalMixEntry[];
};

export const formatMixingPersonDisplay = (value: unknown): string => {
  if (!value) return "—";
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || "—";
  }
  if (typeof value === "object") {
    const person = value as { fullName?: string; name?: string; id?: string };
    const name = String(person.fullName ?? person.name ?? "").trim();
    const id = String(person.id ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id || "—";
  }
  return "—";
};

const formatMixingSubmissionType = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (raw === "DRAFT") return "Draft";
  if (raw === "SUBMIT") return "Submitted";
  return raw.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

export const mapMixingDetailsForDisplay = (
  data: Record<string, unknown> | null | undefined,
): MixingDetailView | null => {
  if (!data) return null;

  const formState = mapMixingDetailsToFormState(data as Partial<MixingDetails>);

  return {
    formId: String(data.formId ?? ""),
    batchId: String(data.batchId ?? ""),
    batchType: formatSubdepartmentBatchTypeLabel(String(data.batchType ?? "")),
    formSubmissionType: formatMixingSubmissionType(data.formSubmissionType),
    status: normalizeApproverBatchStatus(data.status),
    submittedBy: formatMixingPersonDisplay(data.submittedBy),
    submittedAt: String(data.submittedAt ?? ""),
    createdBy: formatMixingPersonDisplay(data.createdBy),
    createdAt: String(data.createdAt ?? data.createdOn ?? ""),
    premixCards: formState.premixCards,
    finalMixCards: formState.finalMixCards,
  };
};

export class MixingSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    const payload = data?.data ?? data;
    this.formId = String(payload?.formId ?? "");
    this.batchId = String(payload?.batchId ?? "");
    this.status = String(payload?.status ?? "");
  }

  static fromApi(data: any) {
    return new MixingSubmitResponseModel(data);
  }
}

export class MixingDetailsModel {
  static fromApi(data: any): MixingDetails & Record<string, unknown> {
    const payload = data?.data ?? data ?? {};

    return {
      ...payload,
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      batchType: String(payload?.batchType ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      status: String(payload?.status ?? ""),
      createdBy: payload?.createdBy,
      createdAt: payload?.createdAt ?? payload?.createdOn,
      submittedBy: payload?.submittedBy,
      submittedAt: payload?.submittedAt,
      mixingDetails: payload?.mixingDetails ?? {
        stages: [],
      },
    };
  }
}
