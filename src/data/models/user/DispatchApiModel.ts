import {
  mapDispatchDetailsToFormState,
  mapDispatchFormStateToPayload,
  type DispatchFormState,
  type DispatchMotorSetup,
} from "./DispatchFormModel";
import type { SchemaSectionSubmission } from "../../../schema-engine";
import { mapCastingCuringPersonLabel } from "./CastingCuringFormModel";
import {
  formatCasePrepCellValue,
  formatCasePrepSectionLabel,
  type CasePrepDetailSection,
  type CasePrepDetailTable,
} from "./CasePreparationFormModel";

export type DispatchSubmissionType = "DRAFT" | "SUBMIT";

const extractDispatchMotorSetup = (
  details: Record<string, unknown> | undefined,
): import("./DispatchFormModel").DispatchMotorSetup => ({
  motorStage: details?.stage ? String(details.stage).replace("STAGE_", "") : "",
  castingDate: String(details?.castingDate ?? ""),
  dispatchDate: String(details?.dispatchDate ?? ""),
  dispatchLocation: String(details?.dispatchLocation ?? ""),
  ndtClearance: String((details?.ndtClearance as { accorded?: string })?.accorded ?? "NO"),
  ndtMomNo: String((details?.ndtClearance as { momNo?: string })?.momNo ?? ""),
  finalAcceptanceClearance: String(
    (details?.finalAcceptanceCommitteeClearance as { accorded?: string })?.accorded ?? "NO",
  ),
  finalAcceptanceMomNo: String(
    (details?.finalAcceptanceCommitteeClearance as { momNo?: string })?.momNo ?? "",
  ),
});

const extractDispatchSchemaValues = (details: Record<string, unknown> | undefined) => ({
  projectName: details?.projectName ?? "",
  propellantProperties: details?.propellantProperties ?? [],
  waiverDetails: details?.waiverDetails ?? null,
  rocketMotorInspection: details?.rocketMotorInspection ?? [],
  vehicleDetails: details?.vehicleDetails ?? [],
  rocketMotorPackingDetails: details?.rocketMotorPackingDetails ?? [],
  uploadDispatchPhotos: details?.uploadDispatchPhotos ?? [],
  safetyClearance: details?.safetyClearance ?? null,
  dispatchTeam: details?.dispatchTeam ?? null,
});

export class DispatchSubmitResponseModel {
  formId: string;
  batchId: string;
  status: string;

  constructor(payload: { formId?: string; batchId?: string; status?: string }) {
    this.formId = payload.formId ?? "";
    this.batchId = payload.batchId ?? "";
    this.status = payload.status ?? "";
  }

  static fromApi(apiResponse: any): DispatchSubmitResponseModel {
    return new DispatchSubmitResponseModel(apiResponse?.data ?? {});
  }
}

export class DispatchDetailsModel {
  formId: string;
  batchId: string;
  batchType: string;
  subDepartmentId: number;
  formSubmissionType: string;
  motorStage: string;
  motorId: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
  motors: Array<{
    motorId: string;
    dispatchDetails: Record<string, unknown>;
    schemaValues: Record<string, unknown>;
    setup: import("./DispatchFormModel").DispatchMotorSetup;
  }>;
  createdBy: unknown;
  createdAt: string | null;
  submittedBy: unknown;
  submittedAt: string | null;
  lastUpdatedBy: unknown;
  lastUpdatedAt: string | null;
  workflowInsights: {
    currentStatus: string;
    rejectionReason: string | null;
  };

  constructor(payload: any) {
    this.formId = payload?.formId ?? "";
    this.batchId = payload?.batchId ?? "";
    this.batchType = payload?.batchType ?? "";
    this.subDepartmentId = Number(payload?.subDepartmentId ?? 0);
    this.formSubmissionType = payload?.formSubmissionType ?? payload?.formStatus ?? "";

    const motorEntries = Array.isArray(payload?.motors) ? payload.motors : [];
    const firstMotor = motorEntries[0] ?? null;
    const details = (firstMotor?.dispatchDetails ?? {}) as Record<string, unknown>;

    this.motorId = String(firstMotor?.motorId ?? "");
    this.motorStage = details?.stage ? String(details.stage).replace("STAGE_", "") : "";
    this.castingDate = String(details?.castingDate ?? "");
    this.dispatchDate = String(details?.dispatchDate ?? "");
    this.dispatchLocation = String(details?.dispatchLocation ?? "");

    this.ndtClearance = String((details?.ndtClearance as { accorded?: string })?.accorded ?? "NO");
    this.ndtMomNo = String((details?.ndtClearance as { momNo?: string })?.momNo ?? "");

    this.finalAcceptanceClearance = String(
      (details?.finalAcceptanceCommitteeClearance as { accorded?: string })?.accorded ?? "NO",
    );
    this.finalAcceptanceMomNo = String(
      (details?.finalAcceptanceCommitteeClearance as { momNo?: string })?.momNo ?? "",
    );

    this.motors = motorEntries
      .map((motor: { motorId?: string; dispatchDetails?: Record<string, unknown> }) => {
        const motorDetails = (motor?.dispatchDetails ?? {}) as Record<string, unknown>;
        return {
          motorId: String(motor?.motorId ?? "").trim(),
          dispatchDetails: motorDetails,
          schemaValues: extractDispatchSchemaValues(motorDetails),
          setup: extractDispatchMotorSetup(motorDetails),
        };
      })
      .filter((motor) => motor.motorId.length > 0);

    this.createdBy = payload?.createdBy ?? null;
    this.createdAt = payload?.createdAt ?? payload?.createdOn ?? null;
    this.submittedBy = payload?.submittedBy ?? null;
    this.submittedAt = payload?.submittedAt ?? payload?.submittedOn ?? null;
    this.lastUpdatedBy = payload?.lastUpdatedBy ?? payload?.updatedBy ?? null;
    this.lastUpdatedAt =
      payload?.lastUpdatedAt ?? payload?.updatedAt ?? payload?.updatedOn ?? null;

    this.workflowInsights = {
      currentStatus:
        payload?.workflowInsights?.currentStatus ??
        payload?.formStatus ??
        payload?.formSubmissionType ??
        "",
      rejectionReason: payload?.workflowInsights?.rejectionReason ?? payload?.rejectionReason ?? null,
    };
  }

  static fromApi(apiResponse: any): DispatchDetailsModel {
    return new DispatchDetailsModel(apiResponse?.data ?? {});
  }

  static toFormState(model: DispatchDetailsModel): DispatchFormState {
    return mapDispatchDetailsToFormState({
      formId: model.formId,
      batchId: model.batchId,
      subDepartmentId: model.subDepartmentId,
      formSubmissionType: model.formSubmissionType,
      motorStage: model.motorStage,
      motorId: model.motorId,
      castingDate: model.castingDate,
      dispatchDate: model.dispatchDate,
      dispatchLocation: model.dispatchLocation,
      ndtClearance: model.ndtClearance,
      ndtMomNo: model.ndtMomNo,
      finalAcceptanceClearance: model.finalAcceptanceClearance,
      finalAcceptanceMomNo: model.finalAcceptanceMomNo,
      motors: model.motors.map((motor) => ({
        motorId: motor.motorId,
        schemaValues: motor.schemaValues,
        setup: motor.setup,
      })),
    });
  }
}

export const mapDispatchPayload = (form: DispatchFormState) =>
  mapDispatchFormStateToPayload(form);

export type DispatchMotorDetailView = {
  motorId: string;
  setup: DispatchMotorSetup;
  setupFields: CasePrepDetailSection["fields"];
  sections: CasePrepDetailSection[];
};

export type DispatchDetailView = {
  formId: string;
  batchId: string;
  batchType: string;
  status?: string;
  createdBy?: string | null;
  createdAt?: string | null;
  submittedBy?: string | null;
  submittedAt?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  motors: DispatchMotorDetailView[];
};

const formatDispatchStageLabel = (stage: string) => {
  const trimmed = String(stage ?? "").trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/^STAGE[_\s-]*/i, "");
  return normalized.toLowerCase().startsWith("stage") ? normalized : `Stage ${normalized}`;
};

const toDetailFields = (
  entries: Array<{ key: string; label: string; value: unknown }>,
): CasePrepDetailSection["fields"] =>
  entries
    .filter((entry) => {
      const value = entry.value;
      if (value === null || value === undefined) return false;
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "boolean") return true;
      return true;
    })
    .map((entry) => ({
      key: entry.key,
      label: entry.label,
      value: formatCasePrepCellValue(entry.value),
    }));

const toDetailTable = (
  blockId: string,
  label: string,
  rows: unknown,
): CasePrepDetailTable | null => {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const recordRows = rows
    .filter((row) => row && typeof row === "object")
    .map((row) => row as Record<string, unknown>)
    .filter((row) =>
      Object.entries(row).some(([key, value]) => {
        if (key.startsWith("_") || key === "type" || key === "readonly") return false;
        if (value === null || value === undefined) return false;
        return String(value).trim().length > 0;
      }),
    );

  if (!recordRows.length) return null;

  const columnKeys = [
    ...new Set(recordRows.flatMap((row) => Object.keys(row).filter((key) => !key.startsWith("_")))),
  ];

  return {
    blockId,
    label,
    columnLabels: Object.fromEntries(
      columnKeys.map((key) => [key, formatCasePrepSectionLabel(key)]),
    ),
    rows: recordRows,
  };
};

const buildDispatchSetupFields = (setup: DispatchMotorSetup) =>
  toDetailFields([
    { key: "motorStage", label: "Stage", value: formatDispatchStageLabel(setup.motorStage) },
    { key: "castingDate", label: "Date of Casting", value: setup.castingDate },
    { key: "dispatchDate", label: "Dispatch Date", value: setup.dispatchDate },
    { key: "dispatchLocation", label: "Dispatch Location", value: setup.dispatchLocation },
    { key: "ndtClearance", label: "NDT Clearance Accorded", value: setup.ndtClearance },
    ...(setup.ndtClearance === "YES"
      ? [{ key: "ndtMomNo", label: "NDT MOM No.", value: setup.ndtMomNo }]
      : []),
    {
      key: "finalAcceptanceClearance",
      label: "Final Acceptance Committee Clearance Accorded",
      value: setup.finalAcceptanceClearance,
    },
    ...(setup.finalAcceptanceClearance === "YES"
      ? [
          {
            key: "finalAcceptanceMomNo",
            label: "Final Acceptance MOM No.",
            value: setup.finalAcceptanceMomNo,
          },
        ]
      : []),
  ]);

const formatFileList = (value: unknown) => {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (typeof entry === "string") return entry.trim();
        if (entry && typeof entry === "object" && "name" in entry) {
          return String((entry as { name?: string }).name ?? "").trim();
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "string") return value.trim();
  return String(value);
};

const buildDispatchMotorSections = (details: Record<string, unknown>): CasePrepDetailSection[] => {
  const sections: CasePrepDetailSection[] = [];

  const projectName = String(details.projectName ?? "").trim();
  if (projectName) {
    sections.push({
      sectionId: "PROJECT",
      label: "Project",
      fields: [{ key: "projectName", label: "Project Name", value: projectName }],
      tables: [],
    });
  }

  const propellantTable = toDetailTable(
    "PROPELLANT_PROPERTIES_TABLE",
    "Propellant Properties",
    details.propellantProperties,
  );
  if (propellantTable) {
    sections.push({
      sectionId: "PROPELLANT_PROPERTIES",
      label: "Propellant Properties Details",
      fields: [],
      tables: [propellantTable],
    });
  }

  const waiver = (details.waiverDetails ?? {}) as Record<string, unknown>;
  const waiverFields = toDetailFields([
    { key: "available", label: "Waiver Available", value: waiver.available ? "YES" : "NO" },
    { key: "details", label: "Waiver Details", value: waiver.details },
    {
      key: "uploadedDocuments",
      label: "Uploaded Documents",
      value: formatFileList(waiver.uploadedDocuments),
    },
  ]);
  if (waiverFields.length) {
    sections.push({
      sectionId: "WAIVER_DETAILS",
      label: "Waiver Details",
      fields: waiverFields,
      tables: [],
    });
  }

  const inspectionTable = toDetailTable(
    "ROCKET_MOTOR_INSPECTION_TABLE",
    "Rocket Motor Inspection",
    details.rocketMotorInspection,
  );
  if (inspectionTable) {
    sections.push({
      sectionId: "ROCKET_MOTOR_INSPECTION",
      label: "Rocket Motor Inspection",
      fields: [],
      tables: [inspectionTable],
    });
  }

  const vehicleTable = toDetailTable(
    "VEHICLE_DETAILS_TABLE",
    "Vehicle Details",
    details.vehicleDetails,
  );
  if (vehicleTable) {
    sections.push({
      sectionId: "VEHICLE_DETAILS",
      label: "Vehicle Details",
      fields: [],
      tables: [vehicleTable],
    });
  }

  const packingTable = toDetailTable(
    "ROCKET_MOTOR_PACKING_TABLE",
    "Rocket Motor Packing",
    details.rocketMotorPackingDetails,
  );
  const packingFields = toDetailFields([
    {
      key: "uploadDispatchPhotos",
      label: "Dispatch Photos",
      value: formatFileList(details.uploadDispatchPhotos),
    },
  ]);
  if (packingTable || packingFields.length) {
    sections.push({
      sectionId: "ROCKET_MOTOR_PACKING",
      label: "Rocket Motor Packing",
      fields: packingFields,
      tables: packingTable ? [packingTable] : [],
    });
  }

  const safety = (details.safetyClearance ?? {}) as Record<string, unknown>;
  const safetyFields = toDetailFields([
    { key: "accorded", label: "Safety Clearance Status", value: safety.accorded },
    {
      key: "clearanceCertificate",
      label: "Clearance Certificate",
      value: formatFileList(safety.clearanceCertificate),
    },
  ]);
  if (safetyFields.length) {
    sections.push({
      sectionId: "SAFETY_CLEARANCE",
      label: "Safety Clearance",
      fields: safetyFields,
      tables: [],
    });
  }

  const team = (details.dispatchTeam ?? {}) as Record<string, unknown>;
  const teamFields = toDetailFields([
    { key: "qaRepresentative", label: "QA Representative", value: team.qaRepresentative },
    { key: "safetyRepresentative", label: "Safety Representative", value: team.safetyRepresentative },
    {
      key: "projectRepresentative",
      label: "Project Representative",
      value: team.projectRepresentative,
    },
  ]);
  if (teamFields.length) {
    sections.push({
      sectionId: "DISPATCH_TEAM",
      label: "Dispatch Team",
      fields: teamFields,
      tables: [],
    });
  }

  return sections;
};

export const mapDispatchDetailsForDisplay = (
  data: Record<string, unknown> | DispatchDetailsModel | null | undefined,
): DispatchDetailView | null => {
  if (!data) return null;

  const model =
    data instanceof DispatchDetailsModel ? data : new DispatchDetailsModel(data as Record<string, unknown>);

  const motors: DispatchMotorDetailView[] = model.motors.map((motor) => {
    const motorDetails = motor.dispatchDetails ?? {};
    const setup = motor.setup;
    const setupFields = buildDispatchSetupFields(setup);
    const sections = buildDispatchMotorSections(motorDetails);

    if (setupFields.length) {
      sections.unshift({
        sectionId: "DISPATCH_SETUP",
        label: "Dispatch setup",
        fields: setupFields,
        tables: [],
      });
    }

    return {
      motorId: motor.motorId,
      setup,
      setupFields,
      sections,
    };
  });

  return {
    formId: model.formId,
    batchId: model.batchId,
    batchType: model.batchType,
    status: model.workflowInsights.currentStatus || model.formSubmissionType,
    createdBy: mapCastingCuringPersonLabel(model.createdBy),
    createdAt: model.createdAt,
    submittedBy: mapCastingCuringPersonLabel(model.submittedBy),
    submittedAt: model.submittedAt,
    lastUpdatedBy: mapCastingCuringPersonLabel(model.lastUpdatedBy),
    lastUpdatedAt: model.lastUpdatedAt,
    motors,
  };
};
