export type CasePrepMotorPair = {
  m1: string;
  m2: string;
};

export type CasePreparationFormState = {
  motorCaseIds: CasePrepMotorPair;
  motorNos: CasePrepMotorPair;
  ga: {
    r1: CasePrepMotorPair;
    r2: CasePrepMotorPair;
    r3: CasePrepMotorPair;
    r4a: CasePrepMotorPair;
    r4b: CasePrepMotorPair;
    r4c: CasePrepMotorPair;
    r5: CasePrepMotorPair;
    r6: CasePrepMotorPair;
  };
  lco: {
    r1: CasePrepMotorPair;
    r2: CasePrepMotorPair;
    r3a: CasePrepMotorPair;
    r3b: CasePrepMotorPair;
    r3c: CasePrepMotorPair;
    r4a: CasePrepMotorPair;
    r4b: CasePrepMotorPair;
    r5: CasePrepMotorPair;
  };
};

export type CasePreparationDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  generalActivities: Record<string, CasePrepMotorPair>;
  linearCoatingOperation: Record<string, CasePrepMotorPair>;
};

export const createEmptyMotorPair = (): CasePrepMotorPair => ({
  m1: "",
  m2: "",
});

const normalizePair = (pair: any): CasePrepMotorPair => ({
  m1: String(pair?.m1 ?? ""),
  m2: String(pair?.m2 ?? ""),
});

export const createDefaultCasePreparationFormState = (): CasePreparationFormState => ({
  motorCaseIds: createEmptyMotorPair(),
  motorNos: createEmptyMotorPair(),
  ga: {
    r1: createEmptyMotorPair(),
    r2: createEmptyMotorPair(),
    r3: createEmptyMotorPair(),
    r4a: createEmptyMotorPair(),
    r4b: createEmptyMotorPair(),
    r4c: createEmptyMotorPair(),
    r5: createEmptyMotorPair(),
    r6: createEmptyMotorPair(),
  },
  lco: {
    r1: createEmptyMotorPair(),
    r2: createEmptyMotorPair(),
    r3a: createEmptyMotorPair(),
    r3b: createEmptyMotorPair(),
    r3c: createEmptyMotorPair(),
    r4a: createEmptyMotorPair(),
    r4b: createEmptyMotorPair(),
    r5: createEmptyMotorPair(),
  },
});

export const mapCasePreparationDetailsToFormState = (details: Partial<CasePreparationDetails>) => {
  const state = createDefaultCasePreparationFormState();
  const ga = details?.generalActivities ?? {};
  const lco = details?.linearCoatingOperation ?? {};

  return {
    motorCaseIds: normalizePair(ga.motorCaseIds),
    motorNos: normalizePair(lco.motorNos),
    ga: {
      r1: normalizePair(ga.inspectInsulatorSurface),
      r2: normalizePair(ga.abrading),
      r3: normalizePair(ga.inspectAbrading),
      r4a: normalizePair(ga.bellowDateOfPreparation),
      r4b: normalizePair(ga.bellowDimension),
      r4c: normalizePair(ga.bellowBondingDate),
      r5: normalizePair(ga.surfaceCleaning),
      r6: normalizePair(ga.preheating),
    },
    lco: {
      r1: normalizePair(lco.inspection),
      r2: normalizePair(lco.insulationTemperature),
      r3a: normalizePair(lco.premixBatchNo),
      r3b: normalizePair(lco.measuredMoisture),
      r3c: normalizePair(lco.qualifiedPeelStrength),
      r4a: normalizePair(lco.coatingDuration),
      r4b: normalizePair(lco.coatingQuantity),
      r5: normalizePair(lco.visualInspection),
    },
  } as CasePreparationFormState;
};

export const mapCasePreparationFormStateToPayload = (form: CasePreparationFormState) => {
  return {
    generalActivities: {
      motorCaseIds: normalizePair(form.motorCaseIds),
      inspectInsulatorSurface: normalizePair(form.ga.r1),
      abrading: normalizePair(form.ga.r2),
      inspectAbrading: normalizePair(form.ga.r3),
      bellowDateOfPreparation: normalizePair(form.ga.r4a),
      bellowDimension: normalizePair(form.ga.r4b),
      bellowBondingDate: normalizePair(form.ga.r4c),
      surfaceCleaning: normalizePair(form.ga.r5),
      preheating: normalizePair(form.ga.r6),
    },
    linearCoatingOperation: {
      motorNos: normalizePair(form.motorNos),
      inspection: normalizePair(form.lco.r1),
      insulationTemperature: normalizePair(form.lco.r2),
      premixBatchNo: normalizePair(form.lco.r3a),
      measuredMoisture: normalizePair(form.lco.r3b),
      qualifiedPeelStrength: normalizePair(form.lco.r3c),
      coatingDuration: normalizePair(form.lco.r4a),
      coatingQuantity: normalizePair(form.lco.r4b),
      visualInspection: normalizePair(form.lco.r5),
    },
  };
};

export const hasAnyCasePreparationValue = (form: CasePreparationFormState) => {
  const fields = [
    form.motorCaseIds,
    form.motorNos,
    ...Object.values(form.ga),
    ...Object.values(form.lco),
  ];

  return fields.some((pair) => String(pair.m1).trim().length > 0 || String(pair.m2).trim().length > 0);
};

export class CasePreparationSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(data: any = {}) {
    this.formId = String(data.formId ?? "");
    this.batchId = String(data.batchId ?? "");
    this.status = String(data.status ?? "");
  }

  static fromApi(data: any) {
    return new CasePreparationSubmitResponseModel(data);
  }
}

export class CasePreparationDetailsModel {
  static fromApi(data: any): CasePreparationDetails {
    return {
      formId: String(data?.formId ?? ""),
      batchId: String(data?.batchId ?? ""),
      subDepartmentId: Number(data?.subDepartmentId ?? 0),
      formSubmissionType: String(data?.formSubmissionType ?? ""),
      generalActivities: data?.generalActivities ?? {},
      linearCoatingOperation: data?.linearCoatingOperation ?? {},
    };
  }
}
