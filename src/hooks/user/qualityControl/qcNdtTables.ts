import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";
import { formatToUiDate } from "../../../utils/dateUtils";
import {
  mapNdtBeamEnergiesFromApi,
  mapNdtEquipmentFromApi,
  mapNdtObservationTypeFromApi,
  mapNdtOrientationFromApi,
} from "./ndtApiMappings";
import {
  QC_NDT_RADIOGRAPHY_OBSERVATION_PRESET,
  QC_NDT_SECTION_IDS,
  QC_NDT_TABLE_IDS,
  QC_NDT_VISUAL_INSPECTION_PRESET,
  QC_NDT_VISUAL_TYPE_BY_API,
  emptyNdtRadiographyDetailRow,
  type QcNdtRadiographyDetailRow,
  type QcNdtRadiographyObservationRow,
  type QcNdtVisualInspectionRow,
} from "./qcNdtConfig";

const formKey = (sectionId: string, blockId: string) => `${sectionId}::${blockId}`;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && value.toLowerCase() !== "null") return value;
  }
  return "";
};

const pickEditableString = (...candidates: unknown[]): string => {
  for (const candidate of candidates) {
    if (candidate == null) continue;
    const value = String(candidate);
    if (value.toLowerCase() === "null") continue;
    return value;
  }
  return "";
};

const omitEmpty = <T extends Record<string, unknown>>(record: T): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(record).filter(([, value]) => {
      if (value === undefined || value === null || value === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }),
  );

const toUiDate = (value: unknown) => formatToUiDate(String(value ?? "").trim());

const normalizeDefectKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

const defectsMatch = (a: unknown, b: unknown) => {
  const left = normalizeDefectKey(a);
  const right = normalizeDefectKey(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
};

const splitObservationLocation = (raw: unknown): { observations: string; location: string } => {
  const text = pickEditableString(raw).trim();
  if (!text) return { observations: "", location: "" };
  const parts = text.split(/\s*[|;/]\s*|\s+[-–—]\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return { observations: parts[0], location: parts.slice(1).join(" — ") };
  }
  return { observations: text, location: "" };
};

const emptyObservationRows = (): QcNdtRadiographyObservationRow[] =>
  QC_NDT_RADIOGRAPHY_OBSERVATION_PRESET.map((row) => ({
    SR_NO: row.SR_NO,
    TYPE_OF_DEFECT: row.TYPE_OF_DEFECT,
    OBSERVATIONS: "",
    LOCATION: "",
  }));

const emptyVisualRows = (): QcNdtVisualInspectionRow[] =>
  QC_NDT_VISUAL_INSPECTION_PRESET.map((row) => ({
    SR_NO: row.SR_NO,
    OBSERVATION_TYPE: row.OBSERVATION_TYPE,
    OBSERVATION: "",
    LOCATION: "",
    UPLOAD_IMAGE: "",
  }));

const normalizeRadiographyDetailRows = (value: unknown): QcNdtRadiographyDetailRow[] => {
  const rows = asArray(value)
    .map((item) => asRecord(item))
    .filter(Boolean)
    .map((row) => ({
      MACHINE_NO: pickString(row?.MACHINE_NO, row?.machineNo),
      FROM_DATE: toUiDate(pickString(row?.FROM_DATE, row?.fromDate)),
      TO_DATE: toUiDate(pickString(row?.TO_DATE, row?.toDate)),
      NO_OF_SECTIONS: pickString(row?.NO_OF_SECTIONS, row?.noOfSections),
      NO_OF_ORIENTATIONS: pickString(row?.NO_OF_ORIENTATIONS, row?.noOfOrientations),
      NORMAL_EXPOSURES: pickString(row?.NORMAL_EXPOSURES, row?.normalExposures),
      TANGENTIAL_EXPOSURES: pickString(row?.TANGENTIAL_EXPOSURES, row?.tangentialExposures),
    }));
  return rows.length ? rows : [emptyNdtRadiographyDetailRow()];
};

const normalizeObservationRows = (value: unknown): QcNdtRadiographyObservationRow[] => {
  const defaults = emptyObservationRows();
  const rows = asArray(value);
  if (!rows.length) return defaults;
  return defaults.map((fallback, index) => {
    const row =
      asRecord(rows[index]) ??
      asRecord(
        rows.find((item) => {
          const rec = asRecord(item);
          return rec ? defectsMatch(rec.TYPE_OF_DEFECT ?? rec.typeOfDefect, fallback.TYPE_OF_DEFECT) : false;
        }),
      );
    const split = splitObservationLocation(
      row?.OBSERVATION_LOCATION ?? row?.observationLocation ?? row?.observationAndLocation,
    );
    return {
      SR_NO: fallback.SR_NO,
      TYPE_OF_DEFECT: fallback.TYPE_OF_DEFECT,
      OBSERVATIONS:
        pickEditableString(row?.OBSERVATIONS, row?.observations, row?.OBSERVATION, row?.observation) ||
        split.observations,
      LOCATION: pickEditableString(row?.LOCATION, row?.location) || split.location,
    };
  });
};

const fileRefToName = (value: unknown): string => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === "null") return "";
    if (trimmed.toLowerCase().startsWith("pending-upload://")) {
      const encoded = trimmed.slice("pending-upload://".length);
      try {
        return decodeURIComponent(encoded);
      } catch {
        return encoded;
      }
    }
    return trimmed;
  }
  const rec = asRecord(value);
  if (!rec) return "";
  return fileRefToName(rec.documentId ?? rec.fileName ?? rec.name ?? rec.fileUrl ?? rec.url);
};

const joinFileRefs = (...candidates: unknown[]): string => {
  const names: string[] = [];
  const pushName = (item: unknown) => {
    const name = fileRefToName(item);
    if (name && !names.includes(name)) names.push(name);
  };
  candidates.forEach((candidate) => {
    if (Array.isArray(candidate)) {
      candidate.forEach(pushName);
      return;
    }
    pushName(candidate);
  });
  return names.join(", ");
};

const formatNdtSectionLocation = (sectionNumber: unknown, orientation: unknown) => {
  const section = pickString(sectionNumber);
  const orientRaw = pickString(orientation);
  const orient = mapNdtOrientationFromApi(orientRaw) || orientRaw;
  if (section && orient) return `${section} / ${orient}`;
  return section || orient;
};

const resolveQcVisualPresetType = (raw: unknown): string => {
  const text = String(raw ?? "").trim();
  if (!text) return "";
  const enumKey = text
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (QC_NDT_VISUAL_TYPE_BY_API[enumKey]) return QC_NDT_VISUAL_TYPE_BY_API[enumKey];
  const fromManufacturing = mapNdtObservationTypeFromApi(text);
  if (fromManufacturing === "Rocket motor external surface") {
    return QC_NDT_VISUAL_TYPE_BY_API.SURFACE_PAINT_FINISH;
  }
  if (fromManufacturing === "Nut & bolt groves cleanliness") {
    return QC_NDT_VISUAL_TYPE_BY_API.NUT_BOLT_GROOVES_CLEANLINESS;
  }
  const match = QC_NDT_VISUAL_INSPECTION_PRESET.find(
    (preset) =>
      defectsMatch(preset.OBSERVATION_TYPE, text) ||
      defectsMatch(preset.OBSERVATION_TYPE, fromManufacturing),
  );
  return match?.OBSERVATION_TYPE ?? "";
};

const isManufacturingRadiographyDetails = (value: unknown) => {
  const rec = asRecord(value);
  if (!rec) return false;
  return (
    rec.equipmentUtilized != null ||
    rec.xrayBeamEnergies != null ||
    rec.radiographyPlanDetails != null ||
    rec.radiographyPlanId != null
  );
};

const isManufacturingNdtDetails = (data: Record<string, unknown>) =>
  Boolean(
    isManufacturingRadiographyDetails(data.radiographyDetails) ||
      data.additionalExposureDetails != null ||
      data.uploadedVideos != null ||
      data.signedNdtReport != null ||
      data.additionalRemarks != null ||
      asArray(data.radiographyObservations).some((row) => {
        const rec = asRecord(row);
        return Boolean(rec && (rec.sectionNumber != null || rec.orientation != null));
      }) ||
      asArray(data.visualInspectionDetails).some((row) => {
        const rec = asRecord(row);
        return Boolean(rec && rec.sectionNumber != null);
      }),
  );

const normalizeVisualRows = (value: unknown): QcNdtVisualInspectionRow[] => {
  const defaults = emptyVisualRows();
  const rows = asArray(value);
  if (!rows.length) return defaults;
  return defaults.map((fallback, index) => {
    const row =
      asRecord(
        rows.find((item) => {
          const rec = asRecord(item);
          if (!rec) return false;
          const presetType = resolveQcVisualPresetType(
            rec.OBSERVATION_TYPE ?? rec.observationType,
          );
          return (
            defectsMatch(rec.OBSERVATION_TYPE ?? rec.observationType, fallback.OBSERVATION_TYPE) ||
            defectsMatch(presetType, fallback.OBSERVATION_TYPE)
          );
        }),
      ) ?? asRecord(rows[index]);
    const location =
      pickEditableString(row?.LOCATION, row?.location) ||
      formatNdtSectionLocation(row?.sectionNumber, row?.orientation);
    return {
      SR_NO: fallback.SR_NO,
      OBSERVATION_TYPE: fallback.OBSERVATION_TYPE,
      OBSERVATION: pickEditableString(row?.OBSERVATION, row?.observation, row?.OBSERVATIONS),
      LOCATION: location,
      UPLOAD_IMAGE: pickString(
        row?.UPLOAD_IMAGE,
        row?.uploadImage,
        joinFileRefs(row?.uploadedImages),
      ),
    };
  });
};

const applyManufacturingNdtDetails = (
  values: SchemaFormValues,
  data: Record<string, unknown>,
): SchemaFormValues => {
  const radiography = asRecord(data.radiographyDetails) ?? {};
  const equipment = mapNdtEquipmentFromApi(
    (radiography.equipmentUtilized as string[] | string | null | undefined) ?? [],
  );
  const beamEnergies = mapNdtBeamEnergiesFromApi(
    asArray(radiography.xrayBeamEnergies).map((item) => String(item)),
  );
  const machineNo = [equipment.join(", "), beamEnergies.length ? `(${beamEnergies.join(", ")})` : ""]
    .filter(Boolean)
    .join(" ");

  const planRows = asArray(radiography.radiographyPlanDetails)
    .map((item) => asRecord(item))
    .filter(Boolean);
  values[formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS, QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS)] =
    planRows.length
      ? planRows.map((row) => ({
          MACHINE_NO: machineNo,
          FROM_DATE: "",
          TO_DATE: "",
          NO_OF_SECTIONS: pickString(row?.numberOfSections, row?.NO_OF_SECTIONS, row?.noOfSections),
          NO_OF_ORIENTATIONS: pickString(
            row?.numberOfOrientations,
            row?.NO_OF_ORIENTATIONS,
            row?.noOfOrientations,
          ),
          NORMAL_EXPOSURES: pickString(
            row?.numberOfNormalExposures,
            row?.NORMAL_EXPOSURES,
            row?.normalExposures,
          ),
          TANGENTIAL_EXPOSURES: pickString(
            row?.numberOfTangentialExposures,
            row?.TANGENTIAL_EXPOSURES,
            row?.tangentialExposures,
          ),
        }))
      : machineNo
        ? [{ ...emptyNdtRadiographyDetailRow(), MACHINE_NO: machineNo }]
        : [emptyNdtRadiographyDetailRow()];

  const visualRows = emptyVisualRows();
  asArray(data.visualInspectionDetails).forEach((item) => {
    const rec = asRecord(item);
    if (!rec) return;
    const presetType = resolveQcVisualPresetType(rec.observationType ?? rec.OBSERVATION_TYPE);
    const index = visualRows.findIndex((row) => defectsMatch(row.OBSERVATION_TYPE, presetType));
    if (index < 0) return;
    visualRows[index] = {
      ...visualRows[index],
      OBSERVATION: pickEditableString(rec.observation, rec.OBSERVATION, rec.observations),
      LOCATION:
        pickEditableString(rec.LOCATION, rec.location) ||
        formatNdtSectionLocation(rec.sectionNumber, rec.orientation),
      UPLOAD_IMAGE: joinFileRefs(rec.uploadedImages, rec.UPLOAD_IMAGE, rec.uploadImage),
    };
  });
  values[formKey(QC_NDT_SECTION_IDS.VISUAL_INSPECTION, QC_NDT_TABLE_IDS.VISUAL_INSPECTION)] =
    visualRows;

  const media = joinFileRefs(
    data.uploadedVideos,
    data.UPLOAD_VIDEO_PHOTO,
    data.uploadVideoPhoto,
    asRecord(data.signedNdtReport)?.documentId,
    data.signedNdtReport,
  );
  if (media) {
    values[formKey(QC_NDT_SECTION_IDS.UPLOAD_MEDIA, "UPLOAD_VIDEO_PHOTO")] = media;
  }
  return values;
};

/** True when NDT form values contain user/API data beyond presets. */
export const ndtFormValuesHaveUserData = (values: SchemaFormValues | null | undefined) => {
  if (!values) return false;
  return Object.values(values).some((value) => {
    if (value == null || value === "") return false;
    if (!Array.isArray(value)) return String(value).trim().length > 0;
    return value.some((row) => {
      if (!row || typeof row !== "object") return false;
      return Object.entries(row as Record<string, unknown>).some(([field, fieldValue]) => {
        if (field === "SR_NO" || field === "TYPE_OF_DEFECT" || field === "OBSERVATION_TYPE") {
          return false;
        }
        return String(fieldValue ?? "").trim().length > 0;
      });
    });
  });
};

export const createInitialNdtValues = (): SchemaFormValues => ({
  [formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS, QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS)]: [
    emptyNdtRadiographyDetailRow(),
  ],
  [formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS, QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS)]:
    emptyObservationRows(),
  [formKey(QC_NDT_SECTION_IDS.VISUAL_INSPECTION, QC_NDT_TABLE_IDS.VISUAL_INSPECTION)]: emptyVisualRows(),
  [formKey(QC_NDT_SECTION_IDS.UPLOAD_MEDIA, "UPLOAD_VIDEO_PHOTO")]: "",
});

export const getNdtRadiographyDetailRows = (values: SchemaFormValues | null | undefined) =>
  normalizeRadiographyDetailRows(
    values?.[formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS, QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS)],
  );

export const setNdtRadiographyDetailRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcNdtRadiographyDetailRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS, QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS)]: rows,
});

export const getNdtObservationRows = (values: SchemaFormValues | null | undefined) =>
  normalizeObservationRows(
    values?.[
      formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS, QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS)
    ],
  );

export const setNdtObservationRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcNdtRadiographyObservationRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS, QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS)]:
    rows,
});

export const getNdtVisualRows = (values: SchemaFormValues | null | undefined) =>
  normalizeVisualRows(
    values?.[formKey(QC_NDT_SECTION_IDS.VISUAL_INSPECTION, QC_NDT_TABLE_IDS.VISUAL_INSPECTION)],
  );

export const setNdtVisualRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcNdtVisualInspectionRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_NDT_SECTION_IDS.VISUAL_INSPECTION, QC_NDT_TABLE_IDS.VISUAL_INSPECTION)]: rows,
});

export const getNdtUploadMedia = (values: SchemaFormValues | null | undefined) =>
  String(values?.[formKey(QC_NDT_SECTION_IDS.UPLOAD_MEDIA, "UPLOAD_VIDEO_PHOTO")] ?? "");

export const setNdtUploadMedia = (
  values: SchemaFormValues | null | undefined,
  value: string,
): SchemaFormValues => ({
  ...(values ?? {}),
  [formKey(QC_NDT_SECTION_IDS.UPLOAD_MEDIA, "UPLOAD_VIDEO_PHOTO")]: value,
});

const hydrateFromSectionData = (values: SchemaFormValues, sectionId: string, data: Record<string, unknown>) => {
  if (isManufacturingNdtDetails(data)) {
    applyManufacturingNdtDetails(values, data);
    return;
  }

  const normalized = sectionId.trim().toUpperCase().replace(/-/g, "_");
  if (
    normalized === QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS ||
    data.RADIOGRAPHY_DETAILS != null ||
    data.radiographyDetails != null
  ) {
    const rows =
      data[QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS] ?? data.radiographyDetails ?? data.RADIOGRAPHY_DETAILS;
    if (rows != null) {
      values[formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS, QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS)] =
        normalizeRadiographyDetailRows(rows);
    }
  }
  if (
    normalized === QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS ||
    data.RADIOGRAPHY_OBSERVATIONS != null ||
    data.radiographyObservations != null
  ) {
    const rows =
      data[QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS] ??
      data.radiographyObservations ??
      data.RADIOGRAPHY_OBSERVATIONS;
    const looksLikeManufacturingObservations = asArray(rows).some((item) => {
      const rec = asRecord(item);
      return Boolean(
        rec &&
          (rec.sectionNumber != null || rec.orientation != null) &&
          rec.TYPE_OF_DEFECT == null &&
          rec.typeOfDefect == null,
      );
    });
    // Division-details radiographyObservations is a different shape — do not seed QC rows.
    if (rows != null && !looksLikeManufacturingObservations) {
      values[
        formKey(QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS, QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS)
      ] = normalizeObservationRows(rows);
    }
  }
  if (
    normalized === QC_NDT_SECTION_IDS.VISUAL_INSPECTION ||
    data.VISUAL_INSPECTION != null ||
    data.visualInspection != null ||
    data.visualInspectionDetails != null
  ) {
    const rows =
      data[QC_NDT_TABLE_IDS.VISUAL_INSPECTION] ??
      data.visualInspection ??
      data.visualInspectionDetails ??
      data.VISUAL_INSPECTION;
    if (rows != null) {
      values[formKey(QC_NDT_SECTION_IDS.VISUAL_INSPECTION, QC_NDT_TABLE_IDS.VISUAL_INSPECTION)] =
        normalizeVisualRows(rows);
    }
  }
  if (
    normalized === QC_NDT_SECTION_IDS.UPLOAD_MEDIA ||
    data.UPLOAD_VIDEO_PHOTO != null ||
    data.uploadVideoPhoto != null ||
    data.uploadedVideos != null
  ) {
    const media = pickString(
      data.UPLOAD_VIDEO_PHOTO,
      data.uploadVideoPhoto,
      joinFileRefs(data.uploadedVideos),
    );
    if (media) values[formKey(QC_NDT_SECTION_IDS.UPLOAD_MEDIA, "UPLOAD_VIDEO_PHOTO")] = media;
  }
};

export const hydrateNdtValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const values = createInitialNdtValues();
  for (const section of sections ?? []) {
    const sectionId = String(section.sectionId ?? "").trim();
    const data = asRecord(asArray(section.sectionData)[0]);
    if (!data) continue;
    hydrateFromSectionData(values, sectionId, data);
  }
  return values;
};

export const hydrateNdtValuesFromRecord = (rec: Record<string, unknown>): SchemaFormValues => {
  const details = asRecord(rec.details) ?? rec;
  if (isNdtNestedMotorDetail(rec) || isNdtNestedMotorDetail(details)) {
    return hydrateNdtValuesFromSections(
      ndtMotorDetailToSections(rec, pickString(rec.motorIdNo, rec.motorId) || "MOTOR"),
    );
  }
  const values = createInitialNdtValues();
  hydrateFromSectionData(values, "", details);
  return values;
};

const toApiNumber = (value: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  const numeric = Number(trimmed);
  return Number.isFinite(numeric) ? numeric : trimmed;
};

const splitFileList = (value: string) =>
  String(value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

export type QcNdtMotorSubmissionType = "DRAFT" | "SUBMIT";

export const isNdtNestedMotorDetail = (rec: Record<string, unknown> | null | undefined) =>
  Boolean(rec && Array.isArray(rec.processDetails));

export const ndtMotorDetailToSections = (
  rec: Record<string, unknown>,
  motorId: string,
): SchemaSectionSubmission[] => {
  const source = asRecord(rec.details) ?? rec;
  const processes = asArray(source.processDetails);
  const sections: SchemaSectionSubmission[] = [];
  const trimmedMotorId = String(motorId ?? "").trim();

  const withMotor = (section: SchemaSectionSubmission): SchemaSectionSubmission =>
    (trimmedMotorId ? { ...section, motorId: trimmedMotorId } : section) as SchemaSectionSubmission;

  processes.forEach((item) => {
    const process = asRecord(item);
    if (!process) return;
    const kind = String(process.process ?? "").trim().toUpperCase();

    if (kind === "RADIOGRAPHY" || process.radiographyDetails != null || process.radiographyObservations != null) {
      sections.push(
        withMotor({
          sectionId: QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS,
          sectionData: [
            {
              radiographyDetails: process.radiographyDetails ?? [],
            },
          ],
        }),
      );
      sections.push(
        withMotor({
          sectionId: QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS,
          sectionData: [
            {
              radiographyObservations: process.radiographyObservations ?? [],
            },
          ],
        }),
      );
    }

    if (kind === "VISUAL_INSPECTION" || process.visualInspectionDetails != null) {
      sections.push(
        withMotor({
          sectionId: QC_NDT_SECTION_IDS.VISUAL_INSPECTION,
          sectionData: [
            {
              visualInspectionDetails: process.visualInspectionDetails ?? [],
            },
          ],
        }),
      );
    }

    if (kind === "UPLOAD_MEDIA" || process.mediaDetails != null) {
      const media = asRecord(process.mediaDetails) ?? {};
      sections.push(
        withMotor({
          sectionId: QC_NDT_SECTION_IDS.UPLOAD_MEDIA,
          sectionData: [
            omitEmpty({
              UPLOAD_VIDEO_PHOTO: joinFileRefs(
                media.uploadVideoPhoto,
                media.UPLOAD_VIDEO_PHOTO,
                process.uploadVideoPhoto,
              ),
            }),
          ],
        }),
      );
    }
  });

  return sections;
};

export const buildNdtMotorDetailPayload = (
  values: SchemaFormValues | null | undefined,
  motorId: string,
  motorSubmissionType: QcNdtMotorSubmissionType = "DRAFT",
): Record<string, unknown> => ({
  motorId,
  motorSubmissionType,
  processDetails: [
    {
      process: "RADIOGRAPHY",
      radiographyDetails: getNdtRadiographyDetailRows(values).map((row, index) =>
        omitEmpty({
          srNo: index + 1,
          machineNo: row.MACHINE_NO || undefined,
          noOfSections: toApiNumber(row.NO_OF_SECTIONS),
          noOfOrientations: toApiNumber(row.NO_OF_ORIENTATIONS),
          normalExposures: toApiNumber(row.NORMAL_EXPOSURES),
          tangentialExposures: toApiNumber(row.TANGENTIAL_EXPOSURES),
        }),
      ),
      radiographyObservations: getNdtObservationRows(values).map((row) =>
        omitEmpty({
          srNo: row.SR_NO,
          typeOfDefect: row.TYPE_OF_DEFECT,
          observations: String(row.OBSERVATIONS ?? "").trim() || undefined,
          location: String(row.LOCATION ?? "").trim() || undefined,
        }),
      ),
    },
    {
      process: "VISUAL_INSPECTION",
      visualInspectionDetails: getNdtVisualRows(values).map((row) =>
        omitEmpty({
          srNo: row.SR_NO,
          observationType: row.OBSERVATION_TYPE,
          observation: String(row.OBSERVATION ?? "").trim() || undefined,
          location: String(row.LOCATION ?? "").trim() || undefined,
          uploadImage: splitFileList(row.UPLOAD_IMAGE),
        }),
      ),
    },
    {
      process: "UPLOAD_MEDIA",
      mediaDetails: {
        uploadVideoPhoto: splitFileList(getNdtUploadMedia(values)),
      },
    },
  ],
});

export const buildNdtSectionPayload = (
  values: SchemaFormValues | null | undefined,
  motorId?: string | null,
): SchemaSectionSubmission[] => {
  const sections: SchemaSectionSubmission[] = [
    {
      sectionId: QC_NDT_SECTION_IDS.RADIOGRAPHY_DETAILS,
      sectionData: [
        {
          [QC_NDT_TABLE_IDS.RADIOGRAPHY_DETAILS]: getNdtRadiographyDetailRows(values).map((row) =>
            omitEmpty({
              MACHINE_NO: row.MACHINE_NO || undefined,
              NO_OF_SECTIONS: row.NO_OF_SECTIONS || undefined,
              NO_OF_ORIENTATIONS: row.NO_OF_ORIENTATIONS || undefined,
              NORMAL_EXPOSURES: row.NORMAL_EXPOSURES || undefined,
              TANGENTIAL_EXPOSURES: row.TANGENTIAL_EXPOSURES || undefined,
            }),
          ),
        },
      ],
    },
    {
      sectionId: QC_NDT_SECTION_IDS.RADIOGRAPHY_OBSERVATIONS,
      sectionData: [
        {
          [QC_NDT_TABLE_IDS.RADIOGRAPHY_OBSERVATIONS]: getNdtObservationRows(values).map((row) =>
            omitEmpty({
              SR_NO: row.SR_NO,
              TYPE_OF_DEFECT: row.TYPE_OF_DEFECT,
              OBSERVATIONS: String(row.OBSERVATIONS ?? "").trim() || undefined,
              LOCATION: String(row.LOCATION ?? "").trim() || undefined,
            }),
          ),
        },
      ],
    },
    {
      sectionId: QC_NDT_SECTION_IDS.VISUAL_INSPECTION,
      sectionData: [
        {
          [QC_NDT_TABLE_IDS.VISUAL_INSPECTION]: getNdtVisualRows(values).map((row) =>
            omitEmpty({
              SR_NO: row.SR_NO,
              OBSERVATION_TYPE: row.OBSERVATION_TYPE,
              OBSERVATION: String(row.OBSERVATION ?? "").trim() || undefined,
              LOCATION: String(row.LOCATION ?? "").trim() || undefined,
              UPLOAD_IMAGE: row.UPLOAD_IMAGE || undefined,
            }),
          ),
        },
      ],
    },
    {
      sectionId: QC_NDT_SECTION_IDS.UPLOAD_MEDIA,
      sectionData: [
        omitEmpty({
          UPLOAD_VIDEO_PHOTO: getNdtUploadMedia(values) || undefined,
        }),
      ],
    },
  ];

  const trimmedMotorId = String(motorId ?? "").trim();
  if (!trimmedMotorId) return sections;
  return sections.map((section) => ({
    ...section,
    motorId: trimmedMotorId,
  })) as SchemaSectionSubmission[];
};
