import { USER_DISPATCH_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const DISPATCH_SCHEMA_FUNCTIONALITY = "CREATE_DISPATCH_FORM";
export const DISPATCH_SCHEMA_TYPE = "DISPATCH";
export const DISPATCH_SCHEMA_VERSION = "1.0";

export type DispatchSetupInput = {
  motorStage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: string;
  ndtMomNo: string;
  finalAcceptanceClearance: string;
  finalAcceptanceMomNo: string;
};

export type DispatchDetailsSchemaPayload = {
  projectName: string;
  stage: string;
  castingDate: string;
  dispatchDate: string;
  dispatchLocation: string;
  ndtClearance: { accorded: string; momNo: string };
  finalAcceptanceCommitteeClearance: { accorded: string; momNo: string };
  propellantProperties: unknown[];
  waiverDetails: { available: boolean; details: string; uploadedDocuments: string[] };
  rocketMotorInspection: unknown[];
  vehicleDetails: unknown[];
  rocketMotorPackingDetails: unknown[];
  uploadDispatchPhotos: string[];
  safetyClearance: { accorded: string; clearanceCertificate: string };
  dispatchTeam: {
    qaRepresentative: string;
    safetyRepresentative: string;
    projectRepresentative: string;
  };
};

export const dispatchSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_DISPATCH_ENDPOINTS.SCHEMA,
};

export const buildDispatchSchemaRequest = (params: { subDepartmentId: number }) => ({
  schemaVersion: DISPATCH_SCHEMA_VERSION,
  schemaType: DISPATCH_SCHEMA_TYPE,
  layout: { type: "flat" },
  subDepartmentId: params.subDepartmentId,
  functionality: DISPATCH_SCHEMA_FUNCTIONALITY,
});

export const createDispatchInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateDispatchValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildDispatchSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

const toFilePathList = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object" && "name" in item) {
          return String((item as { name?: string }).name ?? "").trim();
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
};

const toFilePathValue = (value: unknown): string => toFilePathList(value).join(", ");

const asTableRows = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray((value as { rows?: unknown[] }).rows)) {
    return (value as { rows: unknown[] }).rows;
  }
  return [];
};

const buildSectionMap = (schema: SchemaDocumentV2, values: SchemaFormValues) => {
  const submissions = toSectionSubmissions(schema, values);
  return Object.fromEntries(
    submissions.map((section) => [section.sectionId, section.sectionData?.[0] ?? {}]),
  ) as Record<string, Record<string, unknown>>;
};

const PACKING_SUPPLEMENTARY_LABELS = new Set([
  "Nitrogen gas purging",
  "Nitrogen purging pressure",
  "Labelling of motor",
]);

const splitPackingDetails = (rows: unknown[]) => {
  const tableRows: Record<string, unknown>[] = [];
  let nitrogenPurging = "";
  let nitrogenPressure = "";
  let labelling = "";

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    if (!row || typeof row !== "object") return;
    const record = row as Record<string, unknown>;
    const label = String(record.NOMENCLATURE ?? "").trim();
    if (PACKING_SUPPLEMENTARY_LABELS.has(label)) {
      const observation = String(record.OBSERVATION ?? "").trim();
      if (label === "Nitrogen gas purging") nitrogenPurging = observation;
      if (label === "Nitrogen purging pressure") nitrogenPressure = observation;
      if (label === "Labelling of motor") labelling = observation;
      return;
    }
    tableRows.push(record);
  });

  return { tableRows, nitrogenPurging, nitrogenPressure, labelling };
};

const buildPackingSupplementaryRows = (packing: Record<string, unknown>) => {
  const rows: Record<string, unknown>[] = [];
  const nitrogen = String(packing.NITROGEN_GAS_PURGING ?? "").trim();
  if (nitrogen) {
    rows.push({ NOMENCLATURE: "Nitrogen gas purging", OBSERVATION: nitrogen });
    const pressure = String(packing.NITROGEN_PURGING_PRESSURE ?? "").trim();
    if (nitrogen === "YES" && pressure) {
      rows.push({ NOMENCLATURE: "Nitrogen purging pressure", OBSERVATION: pressure });
    }
  }
  const labelling = String(packing.LABELLING_OF_MOTOR ?? "").trim();
  if (labelling) {
    rows.push({ NOMENCLATURE: "Labelling of motor", OBSERVATION: labelling });
  }
  return rows;
};

/** Maps flat dispatch API details into schema section submissions for hydration. */
const buildDispatchSectionsFromDetails = (
  details: Record<string, unknown>,
): SchemaSectionSubmission[] => {
  const packing = splitPackingDetails(
    Array.isArray(details.rocketMotorPackingDetails) ? details.rocketMotorPackingDetails : [],
  );

  return [
    {
      sectionId: "PROPELLANT_PROPERTIES",
      sectionData: [{ PROPELLANT_PROPERTIES_TABLE: details.propellantProperties ?? [] }],
    },
    {
      sectionId: "WAIVER_DETAILS",
      sectionData: [
        {
          WAIVER_AVAILABLE:
            (details.waiverDetails as { details?: string } | undefined)?.details ?? "",
        },
      ],
    },
    {
      sectionId: "ROCKET_MOTOR_INSPECTION",
      sectionData: [{ ROCKET_MOTOR_INSPECTION_TABLE: details.rocketMotorInspection ?? [] }],
    },
    {
      sectionId: "VEHICLE_DETAILS",
      sectionData: [{ VEHICLE_DETAILS_TABLE: details.vehicleDetails ?? [] }],
    },
    {
      sectionId: "ROCKET_MOTOR_PACKING",
      sectionData: [
        {
          ROCKET_MOTOR_PACKING_TABLE: packing.tableRows,
          DISPATCH_PHOTOS: toFilePathValue(details.uploadDispatchPhotos),
          NITROGEN_GAS_PURGING: packing.nitrogenPurging,
          NITROGEN_PURGING_PRESSURE: packing.nitrogenPressure,
          LABELLING_OF_MOTOR: packing.labelling,
        },
      ],
    },
    {
      sectionId: "SAFETY_CLEARANCE",
      sectionData: [
        {
          SAFETY_CLEARANCE_STATUS:
            (details.safetyClearance as { accorded?: string } | undefined)?.accorded ?? "NO",
          CLEARANCE_CERTIFICATE: toFilePathValue(
            (details.safetyClearance as { clearanceCertificate?: unknown } | undefined)
              ?.clearanceCertificate,
          ),
        },
      ],
    },
    {
      sectionId: "DISPATCH_TEAM",
      sectionData: [
        {
          QA_REPRESENTATIVE:
            (details.dispatchTeam as { qaRepresentative?: string } | undefined)?.qaRepresentative ??
            "",
          SAFETY_REPRESENTATIVE:
            (details.dispatchTeam as { safetyRepresentative?: string } | undefined)
              ?.safetyRepresentative ?? "",
          PROJECT_REPRESENTATIVE:
            (details.dispatchTeam as { projectRepresentative?: string } | undefined)
              ?.projectRepresentative ?? "",
        },
      ],
    },
  ];
};

export const mapDispatchSchemaValuesToDispatchDetails = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
  setup: DispatchSetupInput,
): DispatchDetailsSchemaPayload => {
  const sectionMap = buildSectionMap(schema, values);
  const packing = sectionMap.ROCKET_MOTOR_PACKING ?? {};
  const waiverSection = sectionMap.WAIVER_DETAILS ?? {};
  const safety = sectionMap.SAFETY_CLEARANCE ?? {};
  const team = sectionMap.DISPATCH_TEAM ?? {};
  const waiverText = String(waiverSection.WAIVER_AVAILABLE ?? "").trim();

  return {
    projectName: String(values.projectName ?? ""),
    stage: setup.motorStage ? `STAGE_${setup.motorStage}` : "",
    castingDate: setup.castingDate || "",
    dispatchDate: setup.dispatchDate || "",
    dispatchLocation: setup.dispatchLocation || "",
    ndtClearance: {
      accorded: setup.ndtClearance || "NO",
      momNo: setup.ndtClearance === "YES" ? setup.ndtMomNo || "" : "",
    },
    finalAcceptanceCommitteeClearance: {
      accorded: setup.finalAcceptanceClearance || "NO",
      momNo: setup.finalAcceptanceClearance === "YES" ? setup.finalAcceptanceMomNo || "" : "",
    },
    propellantProperties: asTableRows(sectionMap.PROPELLANT_PROPERTIES?.PROPELLANT_PROPERTIES_TABLE),
    waiverDetails: {
      available: waiverText.length > 0,
      details: waiverText,
      uploadedDocuments: [],
    },
    rocketMotorInspection: asTableRows(
      sectionMap.ROCKET_MOTOR_INSPECTION?.ROCKET_MOTOR_INSPECTION_TABLE,
    ),
    vehicleDetails: asTableRows(sectionMap.VEHICLE_DETAILS?.VEHICLE_DETAILS_TABLE),
    rocketMotorPackingDetails: [
      ...asTableRows(packing.ROCKET_MOTOR_PACKING_TABLE),
      ...buildPackingSupplementaryRows(packing),
    ],
    uploadDispatchPhotos: toFilePathList(packing.DISPATCH_PHOTOS),
    safetyClearance: {
      accorded: String(safety.SAFETY_CLEARANCE_STATUS ?? "NO"),
      clearanceCertificate: toFilePathValue(safety.CLEARANCE_CERTIFICATE),
    },
    dispatchTeam: {
      qaRepresentative: String(team.QA_REPRESENTATIVE ?? ""),
      safetyRepresentative: String(team.SAFETY_REPRESENTATIVE ?? ""),
      projectRepresentative: String(team.PROJECT_REPRESENTATIVE ?? ""),
    },
  };
};

export const mapDispatchDetailsToSchemaValues = (
  schema: SchemaDocumentV2,
  details: Record<string, unknown> | undefined,
): SchemaFormValues => {
  if (!details) return createDispatchInitialValues(schema);
  return hydrateDispatchValuesFromSections(schema, buildDispatchSectionsFromDetails(details));
};

export const fetchDispatchSchema = async (params: { subDepartmentId: number }) => {
  const request = buildDispatchSchemaRequest(params);
  return schemaEngineController.fetchSchema(dispatchSchemaFetchConfig, request);
};
