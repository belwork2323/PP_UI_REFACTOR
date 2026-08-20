import { USER_QC_DIVISION_ENDPOINTS } from "../../data/api/endPoints";
import type { SchemaFetchConfig } from "../controller/schemaEngineController";
import schemaEngineController from "../controller/schemaEngineController";
import {
  buildInitialFormValues,
  mergeSectionDataIntoValues,
  toSectionSubmissions,
} from "../state/formState";
import type { SchemaDocumentV2, SchemaFormValues, SchemaSectionSubmission } from "../types";

export const QC_SCHEMA_FUNCTIONALITY = "CREATE_QC_FORM";
export const QC_SCHEMA_TYPE = "QC";
export const QC_SCHEMA_VERSION = "1.0";

export const MIXING_SCHEMA_FUNCTIONALITY = "CREATE_MIXING_FORM";
export const HARDWARE_SCHEMA_FUNCTIONALITY = "CREATE_HARDWARE_FORM";
export const DE_CORING_SCHEMA_FUNCTIONALITY = "CREATE_DE_CORING_FORM";
export const TRIMMING_SCHEMA_FUNCTIONALITY = "CREATE_TRIMMING_FORM";
export const POST_CURE_SCHEMA_FUNCTIONALITY = "CREATE_POST_CURE_FORM";
export const NDT_SCHEMA_FUNCTIONALITY = "CREATE_NDT_FORM";
export const PROPELLANT_SCHEMA_FUNCTIONALITY = "CREATE_QC_PROPELLANT_FORM";

export type QcInhibitorType = "IR1" | "HEMCOAT-3K" | "NOT_APPLICABLE";

export type QcApiDivision =
  | "RAW_MATERIAL"
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING"
  | "MIXING"
  | "HARDWARE"
  | "CASTING"
  | "CURING"
  | "DE_CORING"
  | "TRIMMING"
  | "POST_CURE"
  | "POST_CURE_OPERATION"
  | "NDT"
  | "PROPELLANT_PROPERTIES"
  | "WEIGHTMENT"
  | "QC"
  | "STATIC_TEST_FACILITY";

export type QcApiSubType =
  | "RAW_MATERIAL_REVALIDATION"
  | "RAW_MATERIAL_PROCESSING"
  | "SOLID_PROCESSING"
  | "LIQUID_PROCESSING"
  | "BEM"
  | "MAIN_MOTOR"
  | "PREMIX"
  | "FINAL_MIX"
  | "ABRADING"
  | "PREHEATING"
  | "LINEAR_COATING"
  | "DISPATCH"
  | "NORMAL"
  | "CONFINED"
  | "N2_PRESSURE"
  | "MAIN_BATCH"
  | "SUBSCALE"
  | "LOOSE_FLAP_FILLING"
  | "INHIBITION"
  | "MECHANICAL_PROPERTIES"
  | "INTERFACE_PROPERTIES"
  | "SSBR_UBR_BURN_RATE"
  | "BALLISTIC_EVALUATION"
  | null;

export type QcSchemaRequest = {
  schemaVersion: string;
  schemaType: string;
  layout: { type: "flat" };
  division: QcApiDivision;
  subType: QcApiSubType;
  subDepartmentId: number;
  functionality: string;
  inhibitorType?: QcInhibitorType | null;
};

export const qcSchemaFetchConfig: SchemaFetchConfig = {
  endpoint: USER_QC_DIVISION_ENDPOINTS.SCHEMA,
};

export const resolveQcSchemaMeta = (
  division: QcApiDivision,
): { schemaType: string; functionality: string } => {
  if (division === "MIXING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: MIXING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "HARDWARE") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: HARDWARE_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "DE_CORING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: DE_CORING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "TRIMMING") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: TRIMMING_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "POST_CURE") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: POST_CURE_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "NDT") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: NDT_SCHEMA_FUNCTIONALITY,
    };
  }

  if (division === "PROPELLANT_PROPERTIES") {
    return {
      schemaType: QC_SCHEMA_TYPE,
      functionality: PROPELLANT_SCHEMA_FUNCTIONALITY,
    };
  }

  return {
    schemaType: QC_SCHEMA_TYPE,
    functionality: QC_SCHEMA_FUNCTIONALITY,
  };
};

export const buildQcSchemaRequest = (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
  inhibitorType?: QcInhibitorType | null;
}): QcSchemaRequest => {
  const { schemaType, functionality } = resolveQcSchemaMeta(params.division);

  const request: QcSchemaRequest = {
    schemaVersion: QC_SCHEMA_VERSION,
    schemaType,
    layout: { type: "flat" },
    division: params.division,
    subType: params.subType ?? null,
    subDepartmentId: params.subDepartmentId,
    functionality,
  };

  if (
    params.division === "POST_CURE" &&
    params.subType === "INHIBITION" &&
    params.inhibitorType
  ) {
    request.inhibitorType = params.inhibitorType;
  }

  return request;
};

export const getQcSchemaTypeForDivision = (division: QcApiDivision) =>
  resolveQcSchemaMeta(division).schemaType;

export const createQcInitialValues = (schema: SchemaDocumentV2) =>
  buildInitialFormValues(schema);

export const hydrateQcValuesFromSections = (
  schema: SchemaDocumentV2,
  sections: SchemaSectionSubmission[],
): SchemaFormValues => mergeSectionDataIntoValues(schema, sections);

export const buildQcSectionPayload = (
  schema: SchemaDocumentV2,
  values: SchemaFormValues,
): SchemaSectionSubmission[] => toSectionSubmissions(schema, values);

type SchemaNode = Record<string, unknown>;

const asSchemaNodes = (value: unknown): SchemaNode[] =>
  Array.isArray(value)
    ? value.filter((item): item is SchemaNode => Boolean(item) && typeof item === "object")
    : [];

const walkSchemaNodes = (nodes: SchemaNode[], visit: (node: SchemaNode) => void) => {
  nodes.forEach((node) => {
    visit(node);
    walkSchemaNodes(asSchemaNodes(node.children), visit);
  });
};

/**
 * Align QC Loose Flap Filling schema with Post Cure manufacturing layout:
 * - Bellow Bonding Details title (replaces Bellow Removal)
 * - Loose Flap Epoxy Details group + Qualification table title
 * - Batch No and Date of Preparation as separate fields
 * - Single QC report upload (not per-row)
 */
export const normalizeQcLooseFlapFillingSchema = (
  schema: SchemaDocumentV2,
): SchemaDocumentV2 => {
  const sections = asSchemaNodes(schema.data?.sections);
  if (!sections.length) return schema;

  walkSchemaNodes(sections, (node) => {
    const id = String(node.id ?? "").trim();
    const type = String(node.type ?? "").trim();

    if (
      id === "BELLOW_REMOVAL_GROUP" ||
      id === "BELLOW_BONDING_GROUP" ||
      id === "BELLOW_REMOVAL_DETAILS" ||
      id === "BELLOW_BONDING_DETAILS"
    ) {
      if (type === "group" || node.label != null) node.label = "Bellow Bonding Details";
      if (type === "table" || node.title != null || id.includes("DETAILS")) {
        node.title = "Bellow Bonding Details";
      }
    }

    if (
      id === "LF_EPOXY_QUALIFICATION_GROUP" ||
      id === "LF_EPOXY_DETAILS_GROUP"
    ) {
      node.label = "Loose Flap Epoxy Details";
    }

    if (id === "LF_EPOXY_QUALIFICATION" && (type === "table" || Array.isArray(node.columns))) {
      node.title = "Qualification Details";
      const columns = asSchemaNodes(node.columns).filter(
        (column) => String(column.id ?? "").trim() !== "QC_REPORT",
      );
      node.columns = columns;
    }

    if (id === "LF_EPOXY_FILLING_DETAILS" || id === "LF_EPOXY_FILLING_GROUP") {
      if (type === "group" || node.label != null) node.label = "LF Epoxy Filling Details";
      if (type === "table" || Array.isArray(node.columns)) {
        node.title = "LF Epoxy Filling Details";
      }
    }
  });

  walkSchemaNodes(sections, (node) => {
    if (!Array.isArray(node.children)) return;
    const children = asSchemaNodes(node.children);
    const batchIndex = children.findIndex(
      (child) => String(child.id ?? "").trim() === "LF_EPOXY_BATCH_PREPARATION",
    );

    let nextChildren = children;
    if (batchIndex >= 0) {
      nextChildren = [
        ...children.slice(0, batchIndex),
        {
          type: "group",
          id: "LF_EPOXY_BATCH_FIELDS",
          ui: {
            direction: "row",
            wrap: true,
            gap: "md",
            alignItems: "flex-end",
          },
          children: [
            {
              type: "field",
              id: "LF_EPOXY_BATCH_NO",
              fieldType: "text",
              label: "Batch No",
              ui: {
                colSpan: { xs: 12, sm: 6, md: 4 },
                maxWidth: "280px",
              },
            },
            {
              type: "field",
              id: "LF_EPOXY_PREPARATION_DATE",
              fieldType: "date",
              label: "Date of Preparation",
              ui: {
                colSpan: { xs: 12, sm: 6, md: 4 },
                maxWidth: "280px",
              },
            },
          ],
        },
        ...children.slice(batchIndex + 1),
      ];
    }

    const hasQcReportField = nextChildren.some(
      (child) => String(child.id ?? "").trim() === "LF_EPOXY_QC_REPORT",
    );
    const qualificationIndex = nextChildren.findIndex(
      (child) => String(child.id ?? "").trim() === "LF_EPOXY_QUALIFICATION",
    );
    if (!hasQcReportField && qualificationIndex >= 0) {
      nextChildren = [
        ...nextChildren.slice(0, qualificationIndex + 1),
        {
          type: "field",
          id: "LF_EPOXY_QC_REPORT",
          fieldType: "file",
          label: "Upload QC Report",
          ui: { colSpan: { xs: 12, sm: 8, md: 6 } },
        },
        ...nextChildren.slice(qualificationIndex + 1),
      ];
    }

    node.children = nextChildren;
  });

  return {
    ...schema,
    data: {
      ...schema.data,
      sections: sections as SchemaDocumentV2["data"]["sections"],
    },
  };
};

const QC_INHIBITION_NOT_APPLICABLE_SECTION = {
  id: "INHIBITION_NOT_APPLICABLE",
  title: "Inhibition Not Applicable",
  ui: { variant: "card", padding: "md" },
  children: [
    {
      type: "group",
      id: "DISPATCH_STATION_FIELDS",
      ui: {
        direction: "row",
        wrap: true,
        gap: "md",
        alignItems: "flex-end",
      },
      children: [
        {
          type: "field",
          id: "DISPATCH_DATE",
          fieldType: "date",
          label: "Dispatch Time",
          ui: {
            colSpan: { xs: 12, sm: 6, md: 4 },
            maxWidth: "280px",
          },
        },
        {
          type: "field",
          id: "DISPATCH_STATION",
          fieldType: "text",
          label: "Station",
          ui: {
            colSpan: { xs: 12, sm: 6, md: 4 },
            maxWidth: "280px",
          },
        },
      ],
    },
    {
      type: "field",
      id: "REMARKS",
      fieldType: "textarea",
      label: "Remarks",
      ui: { colSpan: { xs: 12 } },
    },
  ],
} as const;

/**
 * Ensure QC Inhibition NOT_APPLICABLE schema has Dispatch Time (date) + Station fields.
 * Backend may still return empty sections.
 */
export const normalizeQcInhibitionNotApplicableSchema = (
  schema: SchemaDocumentV2,
): SchemaDocumentV2 => {
  const sections = asSchemaNodes(schema.data?.sections);
  const hasDispatchDate = (() => {
    let found = false;
    walkSchemaNodes(sections, (node) => {
      if (String(node.id ?? "").trim() === "DISPATCH_DATE") found = true;
    });
    return found;
  })();
  const hasStation = (() => {
    let found = false;
    walkSchemaNodes(sections, (node) => {
      if (String(node.id ?? "").trim() === "DISPATCH_STATION") found = true;
    });
    return found;
  })();

  if (hasDispatchDate && hasStation) {
    return schema;
  }

  const targetIndex = sections.findIndex(
    (section) => String(section.id ?? "").trim() === "INHIBITION_NOT_APPLICABLE",
  );

  if (targetIndex >= 0) {
    const target = sections[targetIndex];
    const children = asSchemaNodes(target.children);
    const nextChildren = [...children];

    if (!hasDispatchDate || !hasStation) {
      const groupIndex = nextChildren.findIndex(
        (child) => String(child.id ?? "").trim() === "DISPATCH_STATION_FIELDS",
      );
      if (groupIndex >= 0) {
        nextChildren[groupIndex] = {
          ...QC_INHIBITION_NOT_APPLICABLE_SECTION.children[0],
        } as SchemaNode;
      } else {
        nextChildren.unshift({
          ...QC_INHIBITION_NOT_APPLICABLE_SECTION.children[0],
        } as SchemaNode);
      }
    }

    const hasRemarks = nextChildren.some(
      (child) => String(child.id ?? "").trim() === "REMARKS",
    );
    if (!hasRemarks) {
      nextChildren.push({
        ...QC_INHIBITION_NOT_APPLICABLE_SECTION.children[1],
      } as SchemaNode);
    }

    sections[targetIndex] = {
      ...target,
      title: String(target.title ?? "").trim() || "Inhibition Not Applicable",
      children: nextChildren,
    };
  } else {
    sections.push({ ...QC_INHIBITION_NOT_APPLICABLE_SECTION } as SchemaNode);
  }

  return {
    ...schema,
    data: {
      ...schema.data,
      meta: {
        ...(schema.data?.meta ?? {}),
        title: schema.data?.meta?.title || "Inhibition Not Applicable",
        description:
          schema.data?.meta?.description ||
          "Dispatch and station details when inhibition is not applicable",
      },
      sections: sections as SchemaDocumentV2["data"]["sections"],
    },
  };
};

const IR1_BATCH_FIELDS_GROUP = {
  type: "group",
  id: "IR1_BATCH_FIELDS",
  ui: {
    direction: "row",
    wrap: true,
    gap: "md",
    alignItems: "flex-end",
  },
  children: [
    {
      type: "field",
      id: "IR1_BATCH_NO",
      fieldType: "text",
      label: "Batch No",
      ui: {
        colSpan: { xs: 12, sm: 6, md: 4 },
        maxWidth: "280px",
      },
    },
    {
      type: "field",
      id: "IR1_PREPARATION_DATE",
      fieldType: "date",
      label: "Date of Preparation",
      ui: {
        colSpan: { xs: 12, sm: 6, md: 4 },
        maxWidth: "280px",
      },
    },
  ],
} as const;

/**
 * Split IR1 combined "Batch No. with date of preparation" into:
 * Batch No (text) + Date of Preparation (date picker).
 * Move per-row QC Report column to a single shared upload field.
 */
export const normalizeQcInhibitionIr1Schema = (
  schema: SchemaDocumentV2,
): SchemaDocumentV2 => {
  const sections = asSchemaNodes(schema.data?.sections);
  if (!sections.length) return schema;

  walkSchemaNodes(sections, (node) => {
    const id = String(node.id ?? "").trim();
    if (id === "IR1_QUALIFICATION" && Array.isArray(node.columns)) {
      node.columns = asSchemaNodes(node.columns).filter(
        (column) => String(column.id ?? "").trim() !== "QC_REPORT",
      );
    }
  });

  walkSchemaNodes(sections, (node) => {
    if (!Array.isArray(node.children)) return;
    const children = asSchemaNodes(node.children);
    const combinedIndex = children.findIndex((child) => {
      const childId = String(child.id ?? "").trim();
      return childId === "IR1_BATCH_PREPARATION" || childId === "IR1_BATCH_DATE_PREPARATION";
    });
    const alreadySplit = children.some(
      (child) => String(child.id ?? "").trim() === "IR1_BATCH_FIELDS",
    );
    const hasBatchNo = (() => {
      let found = false;
      walkSchemaNodes(children, (child) => {
        if (String(child.id ?? "").trim() === "IR1_BATCH_NO") found = true;
      });
      return found;
    })();
    const hasPrepDate = (() => {
      let found = false;
      walkSchemaNodes(children, (child) => {
        if (String(child.id ?? "").trim() === "IR1_PREPARATION_DATE") found = true;
      });
      return found;
    })();

    let nextChildren = children;

    if (!(alreadySplit && hasBatchNo && hasPrepDate)) {
      if (combinedIndex >= 0) {
        nextChildren = [
          ...children.slice(0, combinedIndex),
          { ...IR1_BATCH_FIELDS_GROUP } as SchemaNode,
          ...children.slice(combinedIndex + 1),
        ];
      } else if (!hasBatchNo || !hasPrepDate) {
        const qualificationIndex = children.findIndex(
          (child) => String(child.id ?? "").trim() === "IR1_QUALIFICATION",
        );
        if (qualificationIndex >= 0) {
          nextChildren = [
            ...children.slice(0, qualificationIndex),
            { ...IR1_BATCH_FIELDS_GROUP } as SchemaNode,
            ...children.slice(qualificationIndex),
          ];
        } else if (String(node.id ?? "").trim() === "INHIBITOR_QUALIFICATION_DETAILS") {
          nextChildren = [{ ...IR1_BATCH_FIELDS_GROUP } as SchemaNode, ...children];
        }
      }
    }

    const hasQcReportField = nextChildren.some(
      (child) => String(child.id ?? "").trim() === "IR1_QC_REPORT",
    );
    const qualificationIndex = nextChildren.findIndex(
      (child) => String(child.id ?? "").trim() === "IR1_QUALIFICATION",
    );
    if (!hasQcReportField && qualificationIndex >= 0) {
      nextChildren = [
        ...nextChildren.slice(0, qualificationIndex + 1),
        {
          type: "field",
          id: "IR1_QC_REPORT",
          fieldType: "file",
          label: "Upload QC Report",
          ui: { colSpan: { xs: 12, sm: 8, md: 6 } },
        },
        ...nextChildren.slice(qualificationIndex + 1),
      ];
    }

    node.children = nextChildren;
  });

  return {
    ...schema,
    data: {
      ...schema.data,
      sections: sections as SchemaDocumentV2["data"]["sections"],
    },
  };
};

export const fetchQcSchema = async (params: {
  subDepartmentId: number;
  division: QcApiDivision;
  subType?: QcApiSubType;
  inhibitorType?: QcInhibitorType | null;
}) => {
  const request = buildQcSchemaRequest(params);
  const response = await schemaEngineController.fetchSchema(qcSchemaFetchConfig, request);
  if (response.success && response.data) {
    if (params.division === "POST_CURE" && params.subType === "LOOSE_FLAP_FILLING") {
      response.data = normalizeQcLooseFlapFillingSchema(response.data);
    }
    if (
      params.division === "POST_CURE" &&
      params.subType === "INHIBITION" &&
      params.inhibitorType === "IR1"
    ) {
      response.data = normalizeQcInhibitionIr1Schema(response.data);
    }
    if (
      params.division === "POST_CURE" &&
      params.subType === "INHIBITION" &&
      params.inhibitorType === "NOT_APPLICABLE"
    ) {
      response.data = normalizeQcInhibitionNotApplicableSchema(response.data);
    }
  }
  return response;
};
