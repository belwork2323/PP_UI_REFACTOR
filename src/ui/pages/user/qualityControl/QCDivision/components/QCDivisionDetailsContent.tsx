import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import getQualityControlTheme from "../../../../../../app/theme/custom_themes/user/qualityControl/qualityControl_theme";
import { getQcDivisionTheme } from "../../../../../../app/theme/custom_themes/user/qualityControl/qc_division_theme";
import { STRINGS } from "../../../../../../app/config/strings";
import type { QCDivisionDetailView } from "../../../../../../data/models/user/QualityControlFormModel";
import type { QualityControlFormState } from "../../../../../../data/models/user/QualityControlFormModel";
import { OPERATION_STATUS_UI_TO_API } from "../../../../../../hooks/operationStatus";
import QCDivisionFormBody from "../QCDivisionFormBody";

const BL = STRINGS.SOURCING.BATCH_LIST;
const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;

const API_OPERATION_STATUS_LABELS = Object.fromEntries(
  Object.entries(OPERATION_STATUS_UI_TO_API).map(([label, apiValue]) => [apiValue, label]),
);

const formatStatusLabel = (status?: string | null) => {
  const raw = String(status ?? "").trim();
  if (!raw) return "—";
  const normalized = raw.toUpperCase().replace(/\s+/g, "_");
  return API_OPERATION_STATUS_LABELS[normalized] ?? raw;
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const buildQcDivisionBatchMetaFields = (
  detailView: QCDivisionDetailView | null,
  row?: Record<string, unknown>,
) => [
  { label: BL.COL_BATCH_ID, value: detailView?.batchId || row?.batchId || "—" },
  { label: "Form ID", value: detailView?.formId || row?.formId || "—" },
  {
    label: "Status",
    value: formatStatusLabel(detailView?.status || String(row?.qcDivStatus ?? row?.status ?? "")),
  },
  { label: BL.COL_CREATED_BY, value: detailView?.createdBy || "—" },
  { label: BL.COL_CREATED_ON, value: formatDateTime(detailView?.createdAt) },
  { label: "Submitted By", value: detailView?.submittedBy || "—" },
  { label: "Submitted On", value: formatDateTime(detailView?.submittedAt) },
  {
    label: "Divisions",
    value: detailView?.divisionCount ? String(detailView.divisionCount) : "—",
  },
];

export type QCDivisionDetailsContentProps = {
  detailView: QCDivisionDetailView | null;
  row?: Record<string, unknown>;
  formData: QualityControlFormState;
  subDepartmentId?: number;
  loading: boolean;
  schemaLoading?: boolean;
  schemaError?: string | null;
  activeDivisionGroupIndex: number;
  activeDivisionSubIndex: number;
  onActiveDivisionGroupIndexChange: (index: number) => void;
  onActiveDivisionSubIndexChange: (index: number) => void;
  theme: ReturnType<typeof getQualityControlTheme>;
  resetOnFormId?: string | null;
  /** When false, omit the batch meta block (caller can render it elsewhere). */
  showBatchSection?: boolean;
  /** Match user QC form: catalog + partial nav own top-level switching. */
  hideEntryGroupNav?: boolean;
};

const QCDivisionDetailsContent = ({
  detailView,
  row,
  formData,
  subDepartmentId,
  loading,
  schemaLoading = false,
  schemaError = null,
  activeDivisionGroupIndex,
  activeDivisionSubIndex,
  onActiveDivisionGroupIndexChange,
  onActiveDivisionSubIndexChange,
  theme,
  resetOnFormId,
  showBatchSection = true,
  hideEntryGroupNav = false,
}: QCDivisionDetailsContentProps) => {
  const dt = getQcDivisionTheme(theme).details;
  const [navGroupIndex, setNavGroupIndex] = useState(activeDivisionGroupIndex);
  const [navSubIndex, setNavSubIndex] = useState(activeDivisionSubIndex);

  useEffect(() => {
    setNavGroupIndex(0);
    setNavSubIndex(0);
  }, [resetOnFormId]);

  useEffect(() => {
    setNavGroupIndex(activeDivisionGroupIndex);
  }, [activeDivisionGroupIndex]);

  useEffect(() => {
    setNavSubIndex(activeDivisionSubIndex);
  }, [activeDivisionSubIndex]);

  const handleGroupIndexChange = (index: number) => {
    setNavGroupIndex(index);
    onActiveDivisionGroupIndexChange(index);
  };

  const handleSubIndexChange = (index: number) => {
    setNavSubIndex(index);
    onActiveDivisionSubIndexChange(index);
  };

  const metaFields = buildQcDivisionBatchMetaFields(detailView, row);

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: theme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  const hasFormData = (formData.divisionEntries?.length ?? 0) > 0;

  return (
    <>
      {showBatchSection ? (
        <Box sx={dt.section}>
          <Typography sx={dt.sectionTitle}>
            <DescriptionRoundedIcon sx={{ fontSize: 18 }} />
            {S.DETAILS_BATCH_SECTION}
          </Typography>
          <Box sx={dt.metaGrid}>
            {metaFields.map((field) => (
              <Box key={field.label} sx={dt.metaItem}>
                <Typography sx={dt.metaLabel}>{field.label}</Typography>
                <Typography sx={dt.metaValue}>{String(field.value ?? "—")}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ ...dt.section, mb: 0 }}>
        <Typography sx={dt.sectionTitle}>
          <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
          {S.DETAILS_FORM_SECTION}
        </Typography>

        {hasFormData ? (
          <QCDivisionFormBody
            batch={{ batchId: detailView?.batchId || String(row?.batchId ?? "") }}
            formData={formData}
            subDepartmentId={subDepartmentId}
            activeDivisionGroupIndex={navGroupIndex}
            activeDivisionSubIndex={navSubIndex}
            readOnly
            schemaLoading={schemaLoading}
            schemaError={schemaError}
            hideEntryGroupNav={hideEntryGroupNav}
            onActiveDivisionGroupIndexChange={handleGroupIndexChange}
            onActiveDivisionSubIndexChange={handleSubIndexChange}
            onDivisionEntryValuesChange={() => {}}
            onDivisionEntryLiquidValuesChange={() => {}}
            onMixingFinalMixDetailsChange={() => {}}
            onRemoveDivisionEntry={() => {}}
            theme={theme}
          />
        ) : (
          <Typography sx={dt.emptyText}>{S.DETAILS_NO_DATA}</Typography>
        )}
      </Box>
    </>
  );
};

export default QCDivisionDetailsContent;
