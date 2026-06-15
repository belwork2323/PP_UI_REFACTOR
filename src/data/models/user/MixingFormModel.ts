import {
  createProcessParticularRows,
  createQualityCheckRows,
  getMixingCycleByValue,
  isQuadObservedLayout,
  type QualityObservedLayout,
} from "../../../hooks/user/manufacturing/mixingConfig";

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

export type MixingDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  premixes?: PremixEntry[];
  finalMixes?: FinalMixEntry[];
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

const normalizeFinalMixEntry = (entry: Partial<FinalMixEntry>, fallbackNo: number): FinalMixEntry => {
  const qualityChecks = createQualityCheckRows().map((row) =>
    normalizeQualityRow(
      (entry.qualityChecks ?? []).find((item) => item.parameter === row.parameter),
      row,
    ),
  );

  return {
    mixNo: String(entry.mixNo ?? fallbackNo),
    linkedPremixNo: String(entry.linkedPremixNo ?? ""),
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

const normalizePremixEntry = (premix: Partial<PremixEntry>, fallbackNo: number): PremixEntry => {
  const qualityChecks = createQualityCheckRows().map((row) =>
    normalizeQualityRow(
      (premix.qualityChecks ?? []).find((item) => item.parameter === row.parameter),
      row,
    ),
  );

  return {
    premixNo: String(premix.premixNo ?? fallbackNo),
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

export const mapMixingDetailsToFormState = (details: Partial<MixingDetails>): MixingFormState => {
  const apiPremixes = Array.isArray(details?.premixes) ? details.premixes : [];
  const apiFinalMixes = Array.isArray(details?.finalMixes) ? details.finalMixes : [];

  return {
    premixCards: apiPremixes.map((premix, index) =>
      normalizePremixEntry(premix, Number(premix.premixNo) || index + 1),
    ),
    finalMixCards: apiFinalMixes.map((entry, index) =>
      normalizeFinalMixEntry(entry, Number(entry.mixNo) || index + 1),
    ),
  };
};

const toApiProcessRow = (row: ProcessParticularRow) => ({
  operationLabel: String(row.operation ?? "").trim(),
  rpm: String(row.rpm ?? ""),
  time: String(row.time ?? ""),
  temp: String(row.temp ?? ""),
  vacuum: String(row.vacuum ?? ""),
});

export const mapMixingFormStateToPayload = (form: MixingFormState) => ({
  premixes: (form.premixCards ?? []).map((premix) => ({
    premixNo: Number(premix.premixNo) || 0,
    mixerBldgNo: premix.mixerBldgNo,
    bowlId: premix.bowlId,
    bowlTrialDate: premix.bowlTrialDate,
    bowlTrialObservations: premix.bowlTrialObservations,
    premixDate: premix.premixDate,
    premixQuantity: premix.premixQuantity,
    mixingCycle: premix.mixingCycle,
    processParticulars: (premix.processParticulars ?? []).map(toApiProcessRow),
    qualityChecks: (premix.qualityChecks ?? []).map((row) => ({
      parameter: row.parameter,
      specification: row.specification,
      observedLayout: row.observedLayout,
      observed1: row.observed1,
      observed2: isQuadObservedLayout(row.observedLayout) ? row.observed2 : "",
      observed3: isQuadObservedLayout(row.observedLayout) ? row.observed3 : "",
      observed4: isQuadObservedLayout(row.observedLayout) ? row.observed4 : "",
    })),
  })),
  finalMixes: (form.finalMixCards ?? []).map((entry) => ({
    mixNo: Number(entry.mixNo) || 0,
    linkedPremixNo: Number(entry.linkedPremixNo) || 0,
    mixerBldgNo: entry.mixerBldgNo,
    bowlId: entry.bowlId,
    finalMixCycle: entry.finalMixCycle,
    qualityChecks: (entry.qualityChecks ?? []).map((row) => ({
      parameter: row.parameter,
      specification: row.specification,
      observedLayout: row.observedLayout,
      observed1: row.observed1,
      observed2: isQuadObservedLayout(row.observedLayout) ? row.observed2 : "",
      observed3: isQuadObservedLayout(row.observedLayout) ? row.observed3 : "",
      observed4: isQuadObservedLayout(row.observedLayout) ? row.observed4 : "",
    })),
  })),
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
  static fromApi(data: any): MixingDetails {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      premixes: Array.isArray(payload?.premixes) ? payload.premixes : [],
      finalMixes: Array.isArray(payload?.finalMixes) ? payload.finalMixes : [],
    };
  }
}
