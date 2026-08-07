import type { SchemaFormValues, SchemaSectionSubmission } from "../../../schema-engine";

export const QC_REVALIDATION_SECTION_ID = "RAW_MATERIAL_DETAILS";
export const QC_REVALIDATION_TABLE_ID = "RAW_MATERIAL_DETAILS";
export const QC_REVALIDATION_FORM_KEY = `${QC_REVALIDATION_SECTION_ID}::${QC_REVALIDATION_TABLE_ID}`;

export const QC_REVALIDATION_COLUMNS = [
  { id: "SR_NO", label: "Sr No" },
  { id: "INGREDIENT", label: "Ingredient" },
  { id: "LOT_BATCH_NUMBER", label: "Lot / Batch Number" },
  { id: "PARAMETER", label: "Parameter" },
  { id: "SPECIFICATION", label: "Specs" },
  { id: "RESULT", label: "Analysed Result" },
  { id: "ACEM_QC_RESULT", label: "ACEM QC Result" },
  { id: "VALIDITY", label: "Validity" },
  { id: "REMARKS", label: "Remarks" },
] as const;

/** Columns visually merged across parameter rows for the same ingredient group. */
export const QC_REVALIDATION_MERGE_COLUMNS = ["SR_NO", "INGREDIENT", "LOT_BATCH_NUMBER"] as const;

export type QcRevalidationColumnId = (typeof QC_REVALIDATION_COLUMNS)[number]["id"];

export type QcRevalidationRow = {
  SR_NO?: number | string;
  INGREDIENT?: string;
  LOT_BATCH_NUMBER?: string;
  PARAMETER?: string;
  SPECIFICATION?: string;
  RESULT?: string;
  ACEM_QC_RESULT?: string;
  VALIDITY?: string;
  REMARKS?: string;
  QC_CERTIFICATE?: string;
  _rowRole?: "picker" | "expanded";
  _groupId?: string;
  [key: string]: unknown;
};

export const createEmptyRevalidationPickerRow = (srNo = 1): QcRevalidationRow => ({
  SR_NO: srNo,
  INGREDIENT: "",
  LOT_BATCH_NUMBER: "",
  PARAMETER: "",
  SPECIFICATION: "",
  RESULT: "",
  ACEM_QC_RESULT: "",
  VALIDITY: "",
  REMARKS: "",
  QC_CERTIFICATE: "",
  _rowRole: "picker",
});

export const createInitialRevalidationSchemaValues = (): SchemaFormValues => ({
  [QC_REVALIDATION_FORM_KEY]: [createEmptyRevalidationPickerRow(1)],
});

export const getRevalidationRows = (values: SchemaFormValues | null | undefined): QcRevalidationRow[] => {
  const raw = values?.[QC_REVALIDATION_FORM_KEY];
  if (!Array.isArray(raw)) return [];
  return raw.filter((row) => row && typeof row === "object") as QcRevalidationRow[];
};

export const setRevalidationRows = (
  values: SchemaFormValues | null | undefined,
  rows: QcRevalidationRow[],
): SchemaFormValues => ({
  ...(values ?? {}),
  [QC_REVALIDATION_FORM_KEY]: rows,
});

/** Number expanded groups (same ingredient) once; picker rows continue the sequence. */
export const renumberRevalidationRows = (rows: QcRevalidationRow[]): QcRevalidationRow[] => {
  let nextSr = 1;
  let lastGroupId: string | null = null;
  return rows.map((row) => {
    if (row._rowRole === "expanded") {
      const groupId = String(row._groupId ?? "");
      if (groupId && groupId === lastGroupId) {
        return { ...row, SR_NO: nextSr - 1 };
      }
      lastGroupId = groupId || null;
      const sr = nextSr;
      nextSr += 1;
      return { ...row, SR_NO: sr };
    }
    lastGroupId = null;
    const sr = nextSr;
    nextSr += 1;
    return { ...row, SR_NO: sr };
  });
};

const RUNTIME_KEYS = new Set(["_rowRole", "_groupId", "_rowType"]);

const isEmptyRevalidationRow = (row: QcRevalidationRow): boolean =>
  Object.entries(row).every(([key, value]) => {
    if (RUNTIME_KEYS.has(key) || key === "SR_NO") return true;
    if (value == null) return true;
    if (typeof value === "string") return value.trim() === "";
    return false;
  });

const sanitizeRevalidationRow = (row: QcRevalidationRow): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    if (RUNTIME_KEYS.has(key)) return;
    out[key] = value;
  });
  return out;
};

/** Build API section payload without a schema document. */
export const buildRevalidationSectionPayload = (
  values: SchemaFormValues | null | undefined,
): SchemaSectionSubmission[] => {
  const rows = getRevalidationRows(values)
    .filter((row) => row._rowRole !== "picker")
    .filter((row) => !isEmptyRevalidationRow(row))
    .map(sanitizeRevalidationRow);

  if (!rows.length) return [];

  return [
    {
      sectionId: QC_REVALIDATION_SECTION_ID,
      sectionData: [
        {
          [QC_REVALIDATION_TABLE_ID]: {
            rows,
          },
        },
      ],
    },
  ];
};

const extractRowsFromSectionData = (sectionData: unknown): QcRevalidationRow[] => {
  if (!Array.isArray(sectionData)) return [];

  for (const item of sectionData) {
    if (!item || typeof item !== "object") continue;
    const tableValue = (item as Record<string, unknown>)[QC_REVALIDATION_TABLE_ID];
    if (Array.isArray(tableValue)) {
      return tableValue.filter((row) => row && typeof row === "object") as QcRevalidationRow[];
    }
    if (tableValue && typeof tableValue === "object") {
      const nested = tableValue as Record<string, unknown>;
      const nestedRows = nested.rows;
      if (Array.isArray(nestedRows)) {
        const tableCertificate = readQcCertificateValue(nested);
        return nestedRows
          .filter((row) => row && typeof row === "object")
          .map((row) => {
            const record = row as Record<string, unknown>;
            const rowCert = readQcCertificateValue(record);
            return {
              ...(row as QcRevalidationRow),
              QC_CERTIFICATE: rowCert || tableCertificate,
            };
          });
      }
    }
  }
  return [];
};

export const hydrateRevalidationValuesFromSections = (
  sections: SchemaSectionSubmission[] | null | undefined,
): SchemaFormValues => {
  const section = (sections ?? []).find(
    (entry) => String(entry.sectionId ?? "").trim() === QC_REVALIDATION_SECTION_ID,
  );
  const rows = extractRowsFromSectionData(section?.sectionData);
  if (!rows.length) return createInitialRevalidationSchemaValues();

  const expanded = syncGroupCertificates(
    rows.map((row) => {
      const record = row as Record<string, unknown>;
      const ingredient = String(row.INGREDIENT ?? "").trim();
      const lotId = String(row.LOT_BATCH_NUMBER ?? "").trim();
      const fallbackGroupId = ingredient || lotId ? `${ingredient}::${lotId}` : "group";
      return {
        ...row,
        RESULT: String(row.RESULT ?? row.ANALYSED_RESULT ?? "").trim(),
        ACEM_QC_RESULT: String(row.ACEM_QC_RESULT ?? row.acemQcResult ?? "").trim(),
        QC_CERTIFICATE: readQcCertificateValue(record),
        _rowRole: "expanded" as const,
        _groupId: String(row._groupId ?? fallbackGroupId),
      };
    }),
  );

  return setRevalidationRows(
    {},
    renumberRevalidationRows([...expanded, createEmptyRevalidationPickerRow(expanded.length + 1)]),
  );
};

export type QcRevalidationSpecOption = {
  specificationName: string;
  specificationCode?: string;
  specsLabel: string;
};

export const expandRevalidationIngredient = (
  rows: QcRevalidationRow[],
  specs: QcRevalidationSpecOption[],
): QcRevalidationRow[] | null => {
  const pickerIndex = [...rows].map((row) => row._rowRole).lastIndexOf("picker");
  const picker = pickerIndex >= 0 ? rows[pickerIndex] : null;
  const ingredient = String(picker?.INGREDIENT ?? "").trim();
  const lot = String(picker?.LOT_BATCH_NUMBER ?? "").trim();
  if (!picker || !ingredient || !specs.length) return null;

  const groupId = `${ingredient}-${Date.now()}`;
  const expanded = specs.map((spec) => ({
    SR_NO: 0,
    INGREDIENT: ingredient,
    LOT_BATCH_NUMBER: lot,
    PARAMETER: spec.specificationName,
    SPECIFICATION: spec.specsLabel,
    RESULT: "",
    ACEM_QC_RESULT: "",
    VALIDITY: "",
    REMARKS: "",
    QC_CERTIFICATE: "",
    _rowRole: "expanded" as const,
    _groupId: groupId,
  }));

  const withoutPicker = rows.filter((_, index) => index !== pickerIndex);
  return renumberRevalidationRows([
    ...withoutPicker,
    ...expanded,
    createEmptyRevalidationPickerRow(withoutPicker.length + expanded.length + 1),
  ]);
};

export const removeRevalidationGroup = (
  rows: QcRevalidationRow[],
  groupId: string,
): QcRevalidationRow[] => {
  const next = rows.filter((row) => String(row._groupId ?? "") !== groupId);
  const hasPicker = next.some((row) => row._rowRole === "picker");
  return renumberRevalidationRows(
    hasPicker ? next : [...next, createEmptyRevalidationPickerRow(next.length + 1)],
  );
};

export const hasRevalidationTableData = (values: SchemaFormValues | null | undefined): boolean =>
  getRevalidationRows(values).some(
    (row) => row._rowRole === "expanded" && !isEmptyRevalidationRow(row),
  );

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const formatReferenceRangeLabel = (range: unknown): string => {
  const record = asRecord(range);
  if (!record) return "N/A";
  const minValue = record.minValue ?? record.min ?? null;
  const maxValue = record.maxValue ?? record.max ?? null;
  const unit = String(record.unit ?? "").trim();
  const unitSuffix = unit ? ` ${unit}` : "";
  if (minValue != null && maxValue != null) return `${minValue} - ${maxValue}${unitSuffix}`;
  if (minValue != null) return `>= ${minValue}${unitSuffix}`;
  if (maxValue != null) return `<= ${maxValue}${unitSuffix}`;
  return "N/A";
};

const readAnalysedResult = (record: Record<string, unknown>): string =>
  String(
    record.RESULT ??
      record.result ??
      record.ANALYSED_RESULT ??
      record.analysedResult ??
      record.analyzedResult ??
      "",
  ).trim();

const readAcemQcResult = (record: Record<string, unknown>): string =>
  String(
    record.ACEM_QC_RESULT ??
      record.acemQcResult ??
      record.acemQCResult ??
      record.ACEM_QC ??
      "",
  ).trim();

const fileNameFromCertificateEntry = (entry: unknown): string => {
  if (typeof entry === "string") return entry.trim();
  const record = asRecord(entry);
  if (!record) return "";
  const direct = String(
    record.fileName ??
      record.filename ??
      record.name ??
      record.originalFileName ??
      record.originalName ??
      "",
  ).trim();
  if (direct) return direct;
  const url = String(record.fileUrl ?? record.url ?? record.path ?? "").trim();
  if (!url) return "";
  try {
    const path = url.includes("://") ? new URL(url).pathname : url;
    const segment = path.split("/").filter(Boolean).pop() ?? "";
    return decodeURIComponent(segment).trim();
  } catch {
    return url.split("/").filter(Boolean).pop()?.trim() ?? "";
  }
};

/** Map API `certificates` / `QC_CERTIFICATE` into SchemaFileField's comma-separated names. */
export const readQcCertificateValue = (record: Record<string, unknown> | null | undefined): string => {
  if (!record) return "";
  const direct = String(record.QC_CERTIFICATE ?? record.qcCertificate ?? "").trim();
  if (direct) return direct;

  const certs =
    record.certificates ??
    record.Certificates ??
    record.QC_CERTIFICATES ??
    record.qcCertificates ??
    record.certificate;

  if (Array.isArray(certs)) {
    return certs.map(fileNameFromCertificateEntry).filter(Boolean).join(", ");
  }
  return fileNameFromCertificateEntry(certs);
};

/** Prefer a non-empty certificate already found for the group; otherwise read from the row. */
const syncGroupCertificates = (rows: QcRevalidationRow[]): QcRevalidationRow[] => {
  const certByGroup = new Map<string, string>();
  for (const row of rows) {
    if (row._rowRole !== "expanded") continue;
    const groupId = String(row._groupId ?? "");
    if (!groupId || certByGroup.has(groupId)) continue;
    const cert = readQcCertificateValue(row);
    if (cert) certByGroup.set(groupId, cert);
  }
  return rows.map((row) => {
    if (row._rowRole !== "expanded") return row;
    const groupId = String(row._groupId ?? "");
    const cert = certByGroup.get(groupId) ?? readQcCertificateValue(row);
    return { ...row, QC_CERTIFICATE: cert };
  });
};

const normalizeSpecRows = (
  ingredient: string,
  lotId: string,
  specs: unknown[],
  groupId: string,
): QcRevalidationRow[] =>
  specs
    .map((spec) => {
      const record = asRecord(spec);
      if (!record) return null;
      const parameter = String(
        record.PARAMETER ??
          record.parameter ??
          record.specificationName ??
          record.specification_name ??
          record.name ??
          "",
      ).trim();
      if (!parameter) return null;
      return {
        SR_NO: 0,
        INGREDIENT: ingredient,
        LOT_BATCH_NUMBER: lotId,
        PARAMETER: parameter,
        SPECIFICATION: String(
          record.SPECIFICATION ??
            record.specification ??
            record.specs ??
            formatReferenceRangeLabel(record.referenceRange) ??
            "",
        ).trim(),
        RESULT: readAnalysedResult(record),
        ACEM_QC_RESULT: readAcemQcResult(record),
        VALIDITY: String(record.VALIDITY ?? record.validity ?? "").trim(),
        REMARKS: String(record.REMARKS ?? record.remarks ?? "").trim(),
        QC_CERTIFICATE: readQcCertificateValue(record),
        _rowRole: "expanded" as const,
        _groupId: groupId,
      } satisfies QcRevalidationRow;
    })
    .filter(Boolean) as QcRevalidationRow[];

const extractRowsFromMaterials = (materials: unknown[]): QcRevalidationRow[] => {
  const rows: QcRevalidationRow[] = [];
  materials.forEach((material, index) => {
    const record = asRecord(material);
    if (!record) return;
    const ingredient = String(
      record.INGREDIENT ??
        record.materialCode ??
        record.materialName ??
        record.ingredient ??
        "",
    ).trim();
    if (!ingredient) return;
    const lotId = String(
      record.LOT_BATCH_NUMBER ?? record.lotId ?? record.lotNo ?? record.lotBatchNumber ?? "",
    ).trim();
    const groupId = `${ingredient}-${index}`;
    const materialCertificate = readQcCertificateValue(record);
    const specs = Array.isArray(record.specifications)
      ? record.specifications
      : Array.isArray(record.parameters)
        ? record.parameters
        : Array.isArray(record.rows)
          ? record.rows
          : [];

    if (specs.length) {
      rows.push(
        ...normalizeSpecRows(ingredient, lotId, specs, groupId).map((row) => ({
          ...row,
          QC_CERTIFICATE: row.QC_CERTIFICATE || materialCertificate,
        })),
      );
      return;
    }

    // Only seed a standalone row when it already looks like a filled table row.
    const parameter = String(record.PARAMETER ?? record.parameter ?? "").trim();
    if (!parameter) return;

    rows.push({
      SR_NO: 0,
      INGREDIENT: ingredient,
      LOT_BATCH_NUMBER: lotId,
      PARAMETER: parameter,
      SPECIFICATION: String(record.SPECIFICATION ?? record.specification ?? "").trim(),
      RESULT: readAnalysedResult(record),
      ACEM_QC_RESULT: readAcemQcResult(record),
      VALIDITY: String(record.VALIDITY ?? record.validity ?? "").trim(),
      REMARKS: String(record.REMARKS ?? record.remarks ?? "").trim(),
      QC_CERTIFICATE: materialCertificate,
      _rowRole: "expanded",
      _groupId: groupId,
    });
  });
  return syncGroupCertificates(rows);
};

const extractFlatTableRows = (rows: unknown[]): QcRevalidationRow[] => {
  const expanded: QcRevalidationRow[] = [];
  const groupOrdinalByKey = new Map<string, number>();
  rows.forEach((row, index) => {
    const record = asRecord(row);
    if (!record) return;
    const ingredient = String(
      record.INGREDIENT ?? record.materialCode ?? record.ingredient ?? "",
    ).trim();
    if (!ingredient) return;
    const lotId = String(
      record.LOT_BATCH_NUMBER ?? record.lotId ?? record.lotNo ?? "",
    ).trim();
    const groupKey = `${ingredient}::${lotId}`;
    if (!groupOrdinalByKey.has(groupKey)) {
      groupOrdinalByKey.set(groupKey, groupOrdinalByKey.size);
    }
    const groupId = String(
      record._groupId ?? `${ingredient}-${groupOrdinalByKey.get(groupKey)}`,
    );
    expanded.push({
      SR_NO: Number(record.SR_NO ?? index + 1),
      INGREDIENT: ingredient,
      LOT_BATCH_NUMBER: lotId,
      PARAMETER: String(record.PARAMETER ?? record.parameter ?? record.specificationName ?? "").trim(),
      SPECIFICATION: String(
        record.SPECIFICATION ??
          record.specification ??
          formatReferenceRangeLabel(record.referenceRange) ??
          "",
      ).trim(),
      RESULT: readAnalysedResult(record),
      ACEM_QC_RESULT: readAcemQcResult(record),
      VALIDITY: String(record.VALIDITY ?? record.validity ?? "").trim(),
      REMARKS: String(record.REMARKS ?? record.remarks ?? "").trim(),
      QC_CERTIFICATE: readQcCertificateValue(record),
      _rowRole: "expanded",
      _groupId: groupId,
    });
  });
  return syncGroupCertificates(expanded);
};

const collectSectionsFromPayload = (payload: unknown): SchemaSectionSubmission[] => {
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const sections: SchemaSectionSubmission[] = [];

  const pushSections = (value: unknown) => {
    if (!Array.isArray(value)) return;
    for (const entry of value) {
      if (entry && typeof entry === "object") {
        sections.push(entry as SchemaSectionSubmission);
      }
    }
  };

  pushSections(data.sections);
  pushSections(root.sections);

  const divisionDetails = Array.isArray(data.divisionDetails)
    ? data.divisionDetails
    : Array.isArray(root.divisionDetails)
      ? root.divisionDetails
      : [];
  for (const detail of divisionDetails) {
    const detailRecord = asRecord(detail);
    const detailData = asRecord(detailRecord?.data) ?? detailRecord;
    pushSections(detailData?.sections);
  }

  return sections;
};

const wrapExpandedRows = (expanded: QcRevalidationRow[]): SchemaFormValues | null => {
  if (!expanded.length) return null;
  return setRevalidationRows(
    {},
    renumberRevalidationRows([
      ...expanded,
      createEmptyRevalidationPickerRow(expanded.length + 1),
    ]),
  );
};

/**
 * Map `/qc-division/division-details` auto-populate payload into revalidation table values.
 * Returns null when the payload has no usable initial rows (UI should fall back to empty picker).
 */
export const mapDivisionDetailsToRevalidationValues = (
  payload: unknown,
): SchemaFormValues | null => {
  if (payload == null) return null;

  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;

  // 1) Form-style sections (incl. nested under divisionDetails)
  const sections = collectSectionsFromPayload(payload);
  if (sections.length) {
    const hydrated = hydrateRevalidationValuesFromSections(sections);
    if (hasRevalidationTableData(hydrated)) return hydrated;
  }

  // 2) Materials / ingredients collections
  const materials = Array.isArray(data.materials)
    ? data.materials
    : Array.isArray(data.ingredients)
      ? data.ingredients
      : Array.isArray(root.materials)
        ? root.materials
        : Array.isArray(root.ingredients)
          ? root.ingredients
          : [];
  if (materials.length) {
    const wrapped = wrapExpandedRows(extractRowsFromMaterials(materials));
    if (wrapped) return wrapped;
  }

  // 3) Flat rows array
  const flatRows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(root.rows)
      ? root.rows
      : Array.isArray(data.RAW_MATERIAL_DETAILS)
        ? data.RAW_MATERIAL_DETAILS
        : Array.isArray(root.RAW_MATERIAL_DETAILS)
          ? root.RAW_MATERIAL_DETAILS
          : [];
  if (flatRows.length) {
    const nested = asRecord(flatRows[0]);
    const maybeWrappedRows = Array.isArray(nested?.rows) ? (nested.rows as unknown[]) : flatRows;
    const wrapped = wrapExpandedRows(extractFlatTableRows(maybeWrappedRows));
    if (wrapped) return wrapped;
  }

  return null;
};

/** Seed values for a new revalidation card: API rows when present, otherwise empty picker UI. */
export const createRevalidationSchemaValuesFromAutoPopulate = (
  payload: unknown,
): SchemaFormValues =>
  mapDivisionDetailsToRevalidationValues(payload) ?? createInitialRevalidationSchemaValues();

export type QcRevalidationMaterialSeed = {
  materialCode: string;
  lotId: string;
};

/** Ingredient/lot pairs from division-details when nested specs are not included. */
export const extractRevalidationMaterialSeeds = (
  payload: unknown,
): QcRevalidationMaterialSeed[] => {
  if (payload == null) return [];
  const root = asRecord(payload) ?? {};
  const data = asRecord(root.data) ?? root;
  const materials = Array.isArray(data.materials)
    ? data.materials
    : Array.isArray(data.ingredients)
      ? data.ingredients
      : Array.isArray(root.materials)
        ? root.materials
        : Array.isArray(root.ingredients)
          ? root.ingredients
          : [];

  const seeds: QcRevalidationMaterialSeed[] = [];
  const seen = new Set<string>();
  for (const material of materials) {
    const record = asRecord(material);
    if (!record) continue;
    const materialCode = String(
      record.INGREDIENT ??
        record.materialCode ??
        record.materialName ??
        record.ingredient ??
        "",
    ).trim();
    if (!materialCode) continue;
    const lotId = String(
      record.LOT_BATCH_NUMBER ?? record.lotId ?? record.lotNo ?? record.lotBatchNumber ?? "",
    ).trim();
    const key = `${materialCode}::${lotId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    seeds.push({ materialCode, lotId });
  }
  return seeds;
};

/**
 * Build seeded revalidation values from division-details.
 * Prefers fully formed rows; otherwise expands material seeds via the provided specs loader.
 */
export const buildRevalidationValuesFromDivisionDetails = async (
  payload: unknown,
  loadSpecs: (materialCode: string) => Promise<QcRevalidationSpecOption[]>,
): Promise<SchemaFormValues> => {
  const mapped = mapDivisionDetailsToRevalidationValues(payload);
  if (mapped) return mapped;

  const seeds = extractRevalidationMaterialSeeds(payload);
  if (!seeds.length) return createInitialRevalidationSchemaValues();

  const expanded: QcRevalidationRow[] = [];
  for (const [index, seed] of seeds.entries()) {
    try {
      const specs = await loadSpecs(seed.materialCode);
      if (!specs.length) continue;
      const groupId = `${seed.materialCode}-${index}`;
      for (const spec of specs) {
        expanded.push({
          SR_NO: 0,
          INGREDIENT: seed.materialCode,
          LOT_BATCH_NUMBER: seed.lotId,
          PARAMETER: spec.specificationName,
          SPECIFICATION: spec.specsLabel,
          RESULT: "",
          ACEM_QC_RESULT: "",
          VALIDITY: "",
          REMARKS: "",
          QC_CERTIFICATE: "",
          _rowRole: "expanded",
          _groupId: groupId,
        });
      }
    } catch {
      // Skip materials that fail spec lookup; fall through to empty UI if all fail.
    }
  }

  return wrapExpandedRows(expanded) ?? createInitialRevalidationSchemaValues();
};

