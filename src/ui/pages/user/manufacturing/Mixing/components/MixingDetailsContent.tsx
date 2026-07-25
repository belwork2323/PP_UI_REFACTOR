import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  alpha,
  Box,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import {
  getFinalMixNoLabel,
  getPremixNoLabel,
} from "../../../../../../hooks/user/manufacturing/mixingConfig";
import type {
  FinalMixEntry,
  MixingDetailView,
  PremixEntry,
} from "../../../../../../data/models/user/MixingFormModel";
import getMixingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import getManufacturingTheme from "../../../../../../app/theme/custom_themes/user/manufacturing/manufacturing_theme";
import MixingCardNavigation from "../MixingCardNavigation";
import MixingQualityChecksTable from "../MixingQualityChecksTable";

const BL = STRINGS.SOURCING.BATCH_LIST;
const S = STRINGS.MANUFACTURING.MIXING;
const BRAND = MIXING_BRAND;

const { blender: BlenderRoundedIcon, checklist: ChecklistRoundedIcon } =
  icons.user.manufacturing.mixing.form;

type CombinedStageKind = "PREMIX" | "FINAL_MIX";

type CombinedNavItem = {
  kind: CombinedStageKind;
  id: string;
  label: string;
  cardIndex: number;
};

export type MixingDetailsTheme = ReturnType<typeof getMixingTheme>["details"];

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const displayValue = (value?: string | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || "—";
};

const DetailField = ({
  label,
  value,
  dt,
  span,
}: {
  label: string;
  value: string;
  dt: MixingDetailsTheme;
  span?: boolean;
}) => (
  <Box sx={{ ...(span ? { gridColumn: { xs: "1 / -1", md: "span 2" } } : {}) }}>
    <Box sx={dt.metaItem}>
      <Typography sx={dt.metaLabel}>{label}</Typography>
      <Typography sx={dt.metaValue}>{displayValue(value)}</Typography>
    </Box>
  </Box>
);

const SectionCard = ({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof ChecklistRoundedIcon;
  children: ReactNode;
}) => (
  <Box
    sx={{
      borderRadius: 2,
      border: `1px solid ${alpha(BRAND.mx, 0.2)}`,
      background: "#fff",
      overflow: "hidden",
      boxShadow: `0 2px 12px ${alpha(BRAND.mx, 0.06)}`,
    }}
  >
    <Box
      sx={{
        px: 2,
        py: 1.25,
        background: `linear-gradient(135deg, ${alpha(BRAND.mx, 0.07)}, ${alpha(BRAND.mxLight, 0.03)})`,
        borderBottom: `1px solid ${alpha(BRAND.mx, 0.14)}`,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "10px",
          background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ color: "#fff", fontSize: 17 }} />
      </Box>
      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: BRAND.text }}>
        {title}
      </Typography>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Box>
);

const ProcessParticularsTable = ({
  rows,
  dt,
}: {
  rows: PremixEntry["processParticulars"];
  dt: MixingDetailsTheme;
}) => (
  <TableContainer sx={{ ...dt.tableContainer, mb: 2.5 }}>
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={dt.tableHeaderCell(true)}>{S.COL_OPERATION}</TableCell>
          <TableCell sx={dt.tableHeaderCell(false)}>{S.COL_ROTATION}</TableCell>
          <TableCell sx={dt.tableHeaderCell(false)}>{S.COL_TIME}</TableCell>
          <TableCell sx={dt.tableHeaderCell(false)}>{S.COL_TEMP}</TableCell>
          <TableCell sx={dt.tableHeaderCell(false)}>{S.COL_VACUUM}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} sx={dt.tableCell}>
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>
                {S.PROCESS_PARTICULARS_EMPTY}
              </Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIdx) => (
            <TableRow key={`${row.operationId}-${rowIdx}`} sx={dt.tableRow(rowIdx)}>
              <TableCell sx={{ ...dt.tableCell, fontWeight: 700 }}>
                {displayValue(row.operation || `Operation ${row.operationId}`)}
              </TableCell>
              <TableCell sx={dt.tableCell}>{displayValue(row.rpm)}</TableCell>
              <TableCell sx={dt.tableCell}>{displayValue(row.time)}</TableCell>
              <TableCell sx={dt.tableCell}>{displayValue(row.temp)}</TableCell>
              <TableCell sx={dt.tableCell}>{displayValue(row.vacuum)}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </TableContainer>
);

export const PremixDetailPanel = ({ premix, dt }: { premix: PremixEntry; dt: MixingDetailsTheme }) => (
  <SectionCard
    title={`${S.SECTION_PREMIX_STAGE} — ${getPremixNoLabel(Number(premix.premixNo))}`}
    icon={ChecklistRoundedIcon}
  >
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <DetailField label={S.DETAIL_LABEL_PREMIX_NO} value={premix.premixNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_MIXER} value={premix.mixerType} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_MIXER_BLDG} value={premix.bldgNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_BOWL_ID} value={premix.bowlId} dt={dt} />
      <DetailField label={S.LABEL_BOWL_TRIAL_DATE} value={premix.bowlTrialDate} dt={dt} />
      <DetailField
        label={S.LABEL_BOWL_TRIAL_OBS}
        value={premix.bowlTrialObservations}
        dt={dt}
        span
      />
      <DetailField label={S.LABEL_PREMIX_DATE} value={premix.premixDate} dt={dt} />
      <DetailField label={S.LABEL_PREMIX_QTY} value={premix.premixQuantity} dt={dt} />
      <DetailField
        label={S.DETAIL_LABEL_MIXING_CYCLE}
        value={premix.mixingCycle || premix.mixingCycleName || ""}
        dt={dt}
      />
    </Box>

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
      {S.SECTION_PROCESS_PARTICULARS}
    </Typography>
    <ProcessParticularsTable rows={premix.processParticulars ?? []} dt={dt} />

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
      {S.SECTION_QUALITY_CHECKS}
    </Typography>
    <MixingQualityChecksTable rows={premix.qualityChecks} readOnly />
  </SectionCard>
);

export const FinalMixDetailPanel = ({ entry, dt }: { entry: FinalMixEntry; dt: MixingDetailsTheme }) => (
  <SectionCard
    title={`${S.SECTION_FINAL_MIX_STAGE} — ${getFinalMixNoLabel(Number(entry.mixNo))}`}
    icon={BlenderRoundedIcon}
  >
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        gap: 1.5,
        mb: 2.5,
      }}
    >
      <DetailField label={S.DETAIL_LABEL_FINAL_MIX_NO} value={entry.mixNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_PREMIX_NO} value={entry.linkedPremixNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_MIXER} value={entry.mixerType} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_MIXER_BLDG} value={entry.bldgNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_BOWL_ID} value={entry.bowlId} dt={dt} />

      <DetailField
        label={S.DETAIL_LABEL_FINAL_MIX_CYCLE}
        value={entry.mixingCycle || entry.mixingCycleName || ""}
        dt={dt}
      />
    </Box>

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
      {S.SECTION_PROCESS_PARTICULARS}
    </Typography>
    <ProcessParticularsTable rows={entry.processParticulars ?? []} dt={dt} />

    {entry.qualityChecks && (
      <>
        <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
          {S.SECTION_QUALITY_CHECKS}
        </Typography>
        <MixingQualityChecksTable rows={entry.qualityChecks} readOnly />
      </>
    )}
  </SectionCard>
);

export type MixingDetailsContentProps = {
  detailView: MixingDetailView | null;
  row?: Record<string, unknown>;
  loading: boolean;
  manufacturingTheme: ReturnType<typeof getManufacturingTheme>;
  resetOnFormId?: string | null;
};

const MixingDetailsContent = ({
  detailView,
  row,
  loading,
  manufacturingTheme,
  resetOnFormId,
}: MixingDetailsContentProps) => {
  const dt = useMemo(() => getMixingTheme(manufacturingTheme).details, [manufacturingTheme]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const premixCards = detailView?.premixCards ?? [];
  const finalMixCards = detailView?.finalMixCards ?? [];

  const combinedNavItems = useMemo<CombinedNavItem[]>(() => {
    const premixItems = premixCards.map((premix, cardIndex) => ({
      kind: "PREMIX" as const,
      id: `premix-${premix.premixNo}`,
      label: getPremixNoLabel(Number(premix.premixNo)),
      cardIndex,
    }));
    const finalMixItems = finalMixCards.map((entry, cardIndex) => ({
      kind: "FINAL_MIX" as const,
      id: `final-mix-${entry.mixNo}`,
      label: getFinalMixNoLabel(Number(entry.mixNo)),
      cardIndex,
    }));
    return [...premixItems, ...finalMixItems];
  }, [premixCards, finalMixCards]);

  const activeCardIndexSafe =
    combinedNavItems.length > 0
      ? Math.min(activeCardIndex, combinedNavItems.length - 1)
      : 0;
  const activeNavItem = combinedNavItems[activeCardIndexSafe] ?? null;
  const activePremix =
    activeNavItem?.kind === "PREMIX" ? premixCards[activeNavItem.cardIndex] ?? null : null;
  const activeFinalMix =
    activeNavItem?.kind === "FINAL_MIX" ? finalMixCards[activeNavItem.cardIndex] ?? null : null;

  const combinedNavTabs = useMemo(
    () => combinedNavItems.map((item) => ({ id: item.id, label: item.label })),
    [combinedNavItems],
  );

  useEffect(() => {
    setActiveCardIndex(0);
  }, [resetOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || String(row?.batchId ?? "") },
    { label: "Form ID", value: detailView?.formId || String(row?.formId ?? "") },
    { label: "Batch Type", value: detailView?.batchType || String(row?.batchType ?? "") },
    { label: "Status", value: detailView?.status || String(row?.mxStatus ?? row?.status ?? "") },
    { label: BL.COL_CREATED_BY, value: detailView?.createdBy || BL.UNASSIGNED },
    {
      label: BL.COL_CREATED_ON,
      value: formatDate(detailView?.createdAt ?? (row?.createdOn as string | undefined)),
    },
    { label: "Submitted By", value: detailView?.submittedBy || "—" },
    { label: "Submitted On", value: formatDate(detailView?.submittedAt) },
  ];

  if (loading) {
    return (
      <Box sx={dt.loadingBox}>
        <CircularProgress size={36} sx={{ color: manufacturingTheme.palette.primaryLight }} />
        <Typography sx={dt.emptyText}>Loading details…</Typography>
      </Box>
    );
  }

  const hasStageData = combinedNavItems.length > 0;

  return (
    <>
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

      {hasStageData ? (
        <Box sx={{ ...dt.section, mb: 0 }}>
          <Typography sx={dt.sectionTitle}>
            <VisibilityRoundedIcon sx={{ fontSize: 18 }} />
            {S.DETAILS_FORM_SECTION}
          </Typography>

          {!activePremix && !activeFinalMix ? (
            <Typography sx={dt.emptyText}>{S.NO_STAGE_CARDS}</Typography>
          ) : (
            <MixingCardNavigation
              sectionTitle={S.STAGE_NAV_TITLE}
              sectionHint={S.STAGE_NAV_HINT}
              tabs={combinedNavTabs}
              activeIndex={activeCardIndexSafe}
              onActiveIndexChange={setActiveCardIndex}
            >
              {activePremix ? (
                <PremixDetailPanel premix={activePremix} dt={dt} />
              ) : activeFinalMix ? (
                <FinalMixDetailPanel entry={activeFinalMix} dt={dt} />
              ) : null}
            </MixingCardNavigation>
          )}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
    </>
  );
};

export default MixingDetailsContent;
