import { createMixingData } from "../../../hooks/user/manufacturing/mixingConfig";

export type MixingRow = {
  id?: number;
  operation: string;
  rpm: string;
  time: string;
  temp: string;
  vacuum: string;
};

export type MixingFormState = {
  pre: {
    fixed: MixingRow[];
    dynamic: MixingRow[];
    sampling: MixingRow;
  };
  final: {
    tdi: MixingRow;
    viscosity: MixingRow;
  };
};

export type MixingDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  preMixing: {
    operations: Array<{
      rowIndex?: number;
      operationLabel: string;
      rpm: string;
      time: string;
      temp: string;
      vacuum: string;
    }>;
    sampling: {
      operationLabel: string;
      rpm: string;
      time: string;
      temp: string;
      vacuum: string;
    };
  };
  finalMixing: {
    tdiAddition: {
      operationLabel: string;
      rpm: string;
      time: string;
      temp: string;
      vacuum: string;
    };
    viscositySampling: {
      operationLabel: string;
      rpm: string;
      time: string;
      temp: string;
      vacuum: string;
    };
  };
};

const normalizeRow = (row: any, fallbackOperation = "", fallbackId?: number): MixingRow => ({
  id: fallbackId,
  operation: String(row?.operation ?? row?.operationLabel ?? fallbackOperation),
  rpm: String(row?.rpm ?? ""),
  time: String(row?.time ?? ""),
  temp: String(row?.temp ?? ""),
  vacuum: String(row?.vacuum ?? ""),
});

export const createDefaultMixingFormState = (): MixingFormState => {
  const defaults = createMixingData();
  return {
    pre: {
      fixed: defaults.pre.fixed.map((row, index) => normalizeRow(row, row.operation, index + 1)),
      dynamic: [],
      sampling: normalizeRow(defaults.pre.sampling, defaults.pre.sampling.operation),
    },
    final: {
      tdi: normalizeRow(defaults.final.tdi, defaults.final.tdi.operation),
      viscosity: normalizeRow(defaults.final.viscosity, defaults.final.viscosity.operation),
    },
  };
};

export const mapMixingDetailsToFormState = (details: Partial<MixingDetails>): MixingFormState => {
  const defaults = createDefaultMixingFormState();

  const operations = Array.isArray(details?.preMixing?.operations)
    ? details.preMixing!.operations
    : [];

  const fixed = defaults.pre.fixed.map((defaultRow, index) => {
    const apiRow = operations[index];
    return normalizeRow(apiRow, defaultRow.operation, index + 1);
  });

  const dynamic = operations.slice(4).map((row: any, index: number) =>
    normalizeRow(row, String(row?.operationLabel ?? ""), index + 1)
  );

  const sampling = normalizeRow(
    details?.preMixing?.sampling,
    defaults.pre.sampling.operation
  );

  const tdi = normalizeRow(
    details?.finalMixing?.tdiAddition,
    defaults.final.tdi.operation
  );

  const viscosity = normalizeRow(
    details?.finalMixing?.viscositySampling,
    defaults.final.viscosity.operation
  );

  return {
    pre: {
      fixed,
      dynamic,
      sampling,
    },
    final: {
      tdi,
      viscosity,
    },
  };
};

const toApiRow = (row: MixingRow) => ({
  operationLabel: String(row.operation ?? "").trim(),
  rpm: String(row.rpm ?? ""),
  time: String(row.time ?? ""),
  temp: String(row.temp ?? ""),
  vacuum: String(row.vacuum ?? ""),
});

export const mapMixingFormStateToPayload = (form: MixingFormState) => {
  const operations = [...(form.pre.fixed ?? []), ...(form.pre.dynamic ?? [])]
    .map(toApiRow)
    .filter((row) => row.operationLabel.length > 0);

  return {
    preMixing: {
      operations,
      sampling: toApiRow(form.pre.sampling),
    },
    finalMixing: {
      tdiAddition: toApiRow(form.final.tdi),
      viscositySampling: toApiRow(form.final.viscosity),
    },
  };
};

export const hasAnyMixingValue = (form: MixingFormState) => {
  const rows = [
    ...(form.pre.fixed ?? []),
    ...(form.pre.dynamic ?? []),
    form.pre.sampling,
    form.final.tdi,
    form.final.viscosity,
  ].filter(Boolean) as MixingRow[];

  return rows.some((row) =>
    [row.rpm, row.time, row.temp, row.vacuum].some((value) => String(value ?? "").trim().length > 0)
  );
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
  static fromApi(data: any): MixingDetails {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      preMixing: {
        operations: Array.isArray(payload?.preMixing?.operations)
          ? payload.preMixing.operations
          : [],
        sampling: payload?.preMixing?.sampling ?? {},
      },
      finalMixing: {
        tdiAddition: payload?.finalMixing?.tdiAddition ?? {},
        viscositySampling: payload?.finalMixing?.viscositySampling ?? {},
      },
    };
  }
}
