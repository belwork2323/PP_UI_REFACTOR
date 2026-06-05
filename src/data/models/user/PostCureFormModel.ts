import { createPostCureData } from "../../../hooks/user/manufacturing/postCureConfig";

export type PostCureFormState = ReturnType<typeof createPostCureData>;

export type PostCureDetails = {
  formId: string;
  batchId: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorId: string;
  decoring: {
    decoringLoad: string;
  };
  trimming: {
    trimmedZoneDimension: string;
  };
  lfFilling: {
    inspection: string;
    weight: {
      heSideAndDate: string;
      neSideAndDate: string;
      total: string;
    };
  };
  inhibitionResin: {
    irType: string;
    weight: {
      heSideAndDate: string;
      neSideAndDate: string;
      total: string;
    };
  };
};

export const createDefaultPostCureFormState = (): PostCureFormState => {
  return createPostCureData();
};

export const mapPostCureDetailsToFormState = (details: Partial<PostCureDetails>): PostCureFormState => {
  const defaults = createDefaultPostCureFormState();

  return {
    motorId: String(details?.motorId ?? defaults.motorId),
    r1: String(details?.decoring?.decoringLoad ?? defaults.r1),
    r2: String(details?.trimming?.trimmedZoneDimension ?? defaults.r2),
    r3a: String(details?.lfFilling?.inspection ?? defaults.r3a),
    r3b1: String(details?.lfFilling?.weight?.heSideAndDate ?? defaults.r3b1),
    r3b2: String(details?.lfFilling?.weight?.neSideAndDate ?? defaults.r3b2),
    r3b3: String(details?.lfFilling?.weight?.total ?? defaults.r3b3),
    r4a: String(details?.inhibitionResin?.irType ?? defaults.r4a),
    r4b1: String(details?.inhibitionResin?.weight?.heSideAndDate ?? defaults.r4b1),
    r4b2: String(details?.inhibitionResin?.weight?.neSideAndDate ?? defaults.r4b2),
    r4b3: String(details?.inhibitionResin?.weight?.total ?? defaults.r4b3),
  };
};

export const mapPostCureFormStateToPayload = (form: PostCureFormState) => ({
  motorId: String(form.motorId ?? ""),
  decoring: {
    decoringLoad: String(form.r1 ?? ""),
  },
  trimming: {
    trimmedZoneDimension: String(form.r2 ?? ""),
  },
  lfFilling: {
    inspection: String(form.r3a ?? ""),
    weight: {
      heSideAndDate: String(form.r3b1 ?? ""),
      neSideAndDate: String(form.r3b2 ?? ""),
      total: String(form.r3b3 ?? ""),
    },
  },
  inhibitionResin: {
    irType: String(form.r4a ?? ""),
    weight: {
      heSideAndDate: String(form.r4b1 ?? ""),
      neSideAndDate: String(form.r4b2 ?? ""),
      total: String(form.r4b3 ?? ""),
    },
  },
});

export const hasAnyPostCureValue = (form: PostCureFormState) => {
  return Object.values(form).some((value) => String(value ?? "").trim().length > 0);
};

export class PostCureSubmitResponseModel {
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
    return new PostCureSubmitResponseModel(data);
  }
}

export class PostCureDetailsModel {
  static fromApi(data: any): PostCureDetails {
    const payload = data?.data ?? data ?? {};
    return {
      formId: String(payload?.formId ?? ""),
      batchId: String(payload?.batchId ?? ""),
      subDepartmentId: Number(payload?.subDepartmentId ?? 0),
      formSubmissionType: String(payload?.formSubmissionType ?? ""),
      motorId: String(payload?.motorId ?? ""),
      decoring: payload?.decoring ?? { decoringLoad: "" },
      trimming: payload?.trimming ?? { trimmedZoneDimension: "" },
      lfFilling: payload?.lfFilling ?? {
        inspection: "",
        weight: { heSideAndDate: "", neSideAndDate: "", total: "" },
      },
      inhibitionResin: payload?.inhibitionResin ?? {
        irType: "",
        weight: { heSideAndDate: "", neSideAndDate: "", total: "" },
      },
    };
  }
}
