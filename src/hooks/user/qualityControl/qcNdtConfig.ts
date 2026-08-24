import type { QcApiDivision } from "../../../schema-engine/adapters/qc.adapter";
import type { CasePrepFileRef } from "../../../data/models/user/CasePrepMotorDataModel";

export const QC_NDT_API_DIVISION = "NDT" as const satisfies QcApiDivision;

export const QC_NDT_SECTION_IDS = {
  RADIOGRAPHY_DETAILS: "RADIOGRAPHY_DETAILS",
  RADIOGRAPHY_OBSERVATIONS: "RADIOGRAPHY_OBSERVATIONS",
  VISUAL_INSPECTION: "VISUAL_INSPECTION",
  UPLOAD_MEDIA: "UPLOAD_MEDIA",
} as const;

export const QC_NDT_TABLE_IDS = {
  RADIOGRAPHY_DETAILS: "RADIOGRAPHY_DETAILS",
  RADIOGRAPHY_OBSERVATIONS: "RADIOGRAPHY_OBSERVATIONS",
  VISUAL_INSPECTION: "VISUAL_INSPECTION",
} as const;

export const QC_NDT_SECTION_TITLES: Record<string, string> = {
  [QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS]: "Radiography Details",
  [QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS]: "Radiography Observations",
  [QC_NDT_SECTION_IDS.VISUAL_INSPECTION]: "Visual Inspection",
  [QC_NDT_SECTION_IDS.UPLOAD_MEDIA]: "Upload Videos / Photos",
};

export const QC_NDT_FIELD_LABELS = {
  MACHINE_NO: "Machine No.",
  FROM_DATE: "From Date",
  TO_DATE: "To Date",
  NO_OF_SECTIONS: "No. of Sections",
  NO_OF_ORIENTATIONS: "No. of Orientations",
  NORMAL_EXPOSURES: "No. of Normal Exposures",
  TANGENTIAL_EXPOSURES: "No. of Tangential Exposures",
  SR_NO: "Sr. No.",
  TYPE_OF_DEFECT: "Type of Defect",
  OBSERVATIONS: "Observations",
  LOCATION: "Location",
  OBSERVATION_TYPE: "Observations",
  OBSERVATION: "Observation",
  UPLOAD_IMAGE: "Upload Image",
  UPLOAD_VIDEO_PHOTO: "Upload Videos / Photos",
} as const;

export type QcNdtRadiographyDetailRow = {
  MACHINE_NO: string;
  FROM_DATE: string;
  TO_DATE: string;
  NO_OF_SECTIONS: string;
  NO_OF_ORIENTATIONS: string;
  NORMAL_EXPOSURES: string;
  TANGENTIAL_EXPOSURES: string;
};

export type QcNdtRadiographyObservationRow = {
  SR_NO: number;
  TYPE_OF_DEFECT: string;
  OBSERVATIONS: string;
  LOCATION: string;
};

export type QcNdtVisualInspectionRow = {
  SR_NO: number;
  OBSERVATION_TYPE: string;
  OBSERVATION: string;
  LOCATION: string;
  UPLOAD_IMAGE: CasePrepFileRef[];
};

export const QC_NDT_RADIOGRAPHY_OBSERVATION_PRESET: Array<
  Pick<QcNdtRadiographyObservationRow, "SR_NO" | "TYPE_OF_DEFECT">
> = [
  { SR_NO: 1, TYPE_OF_DEFECT: "Cracks" },
  { SR_NO: 2, TYPE_OF_DEFECT: "Voids" },
  { SR_NO: 3, TYPE_OF_DEFECT: "De-bonds" },
  { SR_NO: 4, TYPE_OF_DEFECT: "Delamination" },
  { SR_NO: 5, TYPE_OF_DEFECT: "Porosity" },
  { SR_NO: 6, TYPE_OF_DEFECT: "Any Other Observation" },
];

export const QC_NDT_VISUAL_INSPECTION_PRESET: Array<
  Pick<QcNdtVisualInspectionRow, "SR_NO" | "OBSERVATION_TYPE">
> = [
  { SR_NO: 1, OBSERVATION_TYPE: "Surface Paint / Finish" },
  { SR_NO: 2, OBSERVATION_TYPE: "Dents/scratch/abnormalities on motor case" },
  { SR_NO: 3, OBSERVATION_TYPE: "Dents/scratch/abnormalities on propellant" },
  { SR_NO: 4, OBSERVATION_TYPE: "Nut & bolt grooves cleanliness" },
  { SR_NO: 5, OBSERVATION_TYPE: "Observation on nozzle end flange" },
  { SR_NO: 6, OBSERVATION_TYPE: "Observation on Head End Flange" },
  { SR_NO: 7, OBSERVATION_TYPE: "Port cleanliness" },
  { SR_NO: 8, OBSERVATION_TYPE: "Beading condition" },
];

/** Manufacturing /qc-division/division-details observationType → QC NDT preset label. */
export const QC_NDT_VISUAL_TYPE_BY_API: Record<string, string> = {
  SURFACE_PAINT_FINISH: "Surface Paint / Finish",
  DENTS_SCRATCHES_MOTOR_CASE: "Dents/scratch/abnormalities on motor case",
  DENTS_SCRATCHES_PROPELLANT: "Dents/scratch/abnormalities on propellant",
  NUT_BOLT_GROOVES_CLEANLINESS: "Nut & bolt grooves cleanliness",
  NOZZLE_END_FLANGE_OBSERVATION: "Observation on nozzle end flange",
  HEAD_END_FLANGE_OBSERVATION: "Observation on Head End Flange",
  PORT_CLEANLINESS: "Port cleanliness",
  BEADING_CONDITION: "Beading condition",
};

export const emptyNdtRadiographyDetailRow = (): QcNdtRadiographyDetailRow => ({
  MACHINE_NO: "",
  FROM_DATE: "",
  TO_DATE: "",
  NO_OF_SECTIONS: "",
  NO_OF_ORIENTATIONS: "",
  NORMAL_EXPOSURES: "",
  TANGENTIAL_EXPOSURES: "",
});

export const getQcNdtMotorLabel = (motorId?: string | null) =>
  motorId?.trim() ? `${motorId.trim()} — NDT` : "NDT";
