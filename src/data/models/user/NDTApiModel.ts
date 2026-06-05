import {
  createDefaultNDTFormState,
  type NDTFileValue,
  type NDTFormState,
} from "./NDTFormModel";

export type NDTSubmissionType = "DRAFT" | "SUBMIT" | "UPDATE";

const normalizeFilePaths = (files: NDTFileValue[] = []): string[] => {
  return files
    .map((file) => (typeof file === "string" ? file : ""))
    .filter((path) => path.trim().length > 0);
};

export class NDTSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): NDTSubmitResponseModel {
    return new NDTSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class NDTDetailsModel {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  data: NDTFormState;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    const base = createDefaultNDTFormState();

    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? "";

    this.data = {
      defects: {
        cracks: {
          observation: payload?.defects?.cracks?.observation ?? base.defects.cracks.observation,
          files: payload?.defects?.cracks?.filePaths ?? [],
        },
        voids: {
          observation: payload?.defects?.voids?.observation ?? base.defects.voids.observation,
          files: payload?.defects?.voids?.filePaths ?? [],
        },
        debonds: {
          observation: payload?.defects?.debonds?.observation ?? base.defects.debonds.observation,
          files: payload?.defects?.debonds?.filePaths ?? [],
        },
        delamination: {
          observation: payload?.defects?.delamination?.observation ?? base.defects.delamination.observation,
          files: payload?.defects?.delamination?.filePaths ?? [],
        },
        porosity: {
          observation: payload?.defects?.porosity?.observation ?? base.defects.porosity.observation,
          files: payload?.defects?.porosity?.filePaths ?? [],
        },
        other: {
          observation: payload?.defects?.other?.observation ?? base.defects.other.observation,
          files: payload?.defects?.other?.filePaths ?? [],
        },
      },
      mechRows: Array.isArray(payload?.mechRows)
        ? payload.mechRows.map((row: any) => ({
            uts: row?.uts ?? "",
            elongation: row?.elongation ?? "",
            eModulus: row?.eModulus ?? "",
            files: row?.filePaths ?? [],
          }))
        : base.mechRows,
      mechMean: {
        uts: payload?.mechMean?.uts ?? base.mechMean.uts,
        elongation: payload?.mechMean?.elongation ?? base.mechMean.elongation,
        eModulus: payload?.mechMean?.eModulus ?? base.mechMean.eModulus,
      },
      mechStdDev: {
        uts: payload?.mechStdDev?.uts ?? base.mechStdDev.uts,
        elongation: payload?.mechStdDev?.elongation ?? base.mechStdDev.elongation,
        eModulus: payload?.mechStdDev?.eModulus ?? base.mechStdDev.eModulus,
      },
      ifaceRows: Array.isArray(payload?.ifaceRows)
        ? payload.ifaceRows.map((row: any) => ({
            peelStrength: row?.peelStrength ?? "",
            tbs: row?.tbs ?? "",
            sbs: row?.sbs ?? "",
            files: row?.filePaths ?? [],
          }))
        : base.ifaceRows,
      ifaceAvg: {
        peelStrength: payload?.ifaceAvg?.peelStrength ?? base.ifaceAvg.peelStrength,
        tbs: payload?.ifaceAvg?.tbs ?? base.ifaceAvg.tbs,
        sbs: payload?.ifaceAvg?.sbs ?? base.ifaceAvg.sbs,
      },
      ifaceStdDev: {
        peelStrength: payload?.ifaceStdDev?.peelStrength ?? base.ifaceStdDev.peelStrength,
        tbs: payload?.ifaceStdDev?.tbs ?? base.ifaceStdDev.tbs,
        sbs: payload?.ifaceStdDev?.sbs ?? base.ifaceStdDev.sbs,
      },
      burnRows: Array.isArray(payload?.burnRows)
        ? payload.burnRows.map((row: any) => ({
            burnRate: row?.burnRate ?? "",
            density: row?.density ?? "",
            files: row?.filePaths ?? [],
          }))
        : base.burnRows,
      burnAvg: {
        burnRate: payload?.burnAvg?.burnRate ?? base.burnAvg.burnRate,
        density: payload?.burnAvg?.density ?? base.burnAvg.density,
      },
    };

    this.workflowInsights = {
      currentStatus: payload?.workflowInsights?.currentStatus ?? "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): NDTDetailsModel {
    return new NDTDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: NDTDetailsModel): NDTFormState {
    return model.data;
  }
}

export const mapNDTPayload = (form: NDTFormState) => ({
  defects: {
    cracks: {
      observation: form?.defects?.cracks?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.cracks?.files ?? []),
    },
    voids: {
      observation: form?.defects?.voids?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.voids?.files ?? []),
    },
    debonds: {
      observation: form?.defects?.debonds?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.debonds?.files ?? []),
    },
    delamination: {
      observation: form?.defects?.delamination?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.delamination?.files ?? []),
    },
    porosity: {
      observation: form?.defects?.porosity?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.porosity?.files ?? []),
    },
    other: {
      observation: form?.defects?.other?.observation ?? "",
      filePaths: normalizeFilePaths(form?.defects?.other?.files ?? []),
    },
  },
  mechRows: (form?.mechRows ?? []).map((row) => ({
    uts: row.uts ?? "",
    elongation: row.elongation ?? "",
    eModulus: row.eModulus ?? "",
    filePaths: normalizeFilePaths(row.files ?? []),
  })),
  mechMean: {
    uts: form?.mechMean?.uts ?? "",
    elongation: form?.mechMean?.elongation ?? "",
    eModulus: form?.mechMean?.eModulus ?? "",
  },
  mechStdDev: {
    uts: form?.mechStdDev?.uts ?? "",
    elongation: form?.mechStdDev?.elongation ?? "",
    eModulus: form?.mechStdDev?.eModulus ?? "",
  },
  ifaceRows: (form?.ifaceRows ?? []).map((row) => ({
    peelStrength: row.peelStrength ?? "",
    tbs: row.tbs ?? "",
    sbs: row.sbs ?? "",
    filePaths: normalizeFilePaths(row.files ?? []),
  })),
  ifaceAvg: {
    peelStrength: form?.ifaceAvg?.peelStrength ?? "",
    tbs: form?.ifaceAvg?.tbs ?? "",
    sbs: form?.ifaceAvg?.sbs ?? "",
  },
  ifaceStdDev: {
    peelStrength: form?.ifaceStdDev?.peelStrength ?? "",
    tbs: form?.ifaceStdDev?.tbs ?? "",
    sbs: form?.ifaceStdDev?.sbs ?? "",
  },
  burnRows: (form?.burnRows ?? []).map((row) => ({
    burnRate: row.burnRate ?? "",
    density: row.density ?? "",
    filePaths: normalizeFilePaths(row.files ?? []),
  })),
  burnAvg: {
    burnRate: form?.burnAvg?.burnRate ?? "",
    density: form?.burnAvg?.density ?? "",
  },
});