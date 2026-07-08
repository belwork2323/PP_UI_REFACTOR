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
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import { icons } from "../../../../../../app/theme/icons";
import { STRINGS } from "../../../../../../app/config/strings";
import { MIXING_BRAND } from "../../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import {
  FINAL_MIX_CYCLE_OPTIONS,
  getFinalMixNoLabel,
  getMixingCycleByValue,
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

type MixingSectionTab = "PREMIX" | "FINAL_MIX";

export type MixingDetailsTheme = ReturnType<typeof getMixingTheme>["details"];

const formatCounter = (template: string, current: number, total: number) =>
  template.replace("{current}", String(current)).replace("{total}", String(total));

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

const resolveMixingCycleLabel = (value: string) => {
  const cycle = getMixingCycleByValue(value);
  return cycle?.label ?? displayValue(value);
};

const resolveFinalMixCycleLabel = (value: string) => {
  const match = FINAL_MIX_CYCLE_OPTIONS.find((cycle) => cycle.value === value);
  return match?.label ?? displayValue(value);
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
      <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: BRAND.text }}>{title}</Typography>
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
              <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{S.PROCESS_PARTICULARS_EMPTY}</Typography>
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, rowIdx) => (
            <TableRow key={row.id} sx={dt.tableRow(rowIdx)}>
              <TableCell sx={{ ...dt.tableCell, fontWeight: 700 }}>{row.operation}</TableCell>
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

const PremixDetailPanel = ({ premix, dt }: { premix: PremixEntry; dt: MixingDetailsTheme }) => (
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
      <DetailField label={S.DETAIL_LABEL_MIXER_BLDG} value={premix.mixerBldgNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_BOWL_ID} value={premix.bowlId} dt={dt} />
      <DetailField label={S.LABEL_BOWL_TRIAL_DATE} value={premix.bowlTrialDate} dt={dt} />
      <DetailField label={S.LABEL_BOWL_TRIAL_OBS} value={premix.bowlTrialObservations} dt={dt} span />
      <DetailField label={S.LABEL_PREMIX_DATE} value={premix.premixDate} dt={dt} />
      <DetailField label={S.LABEL_PREMIX_QTY} value={premix.premixQuantity} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_MIXING_CYCLE} value={resolveMixingCycleLabel(premix.mixingCycle)} dt={dt} />
    </Box>

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
      {S.SECTION_PROCESS_PARTICULARS}
    </Typography>
    <ProcessParticularsTable rows={premix.processParticulars} dt={dt} />

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
      {S.SECTION_QUALITY_CHECKS}
    </Typography>
    <MixingQualityChecksTable rows={premix.qualityChecks} readOnly />
  </SectionCard>
);

const FinalMixDetailPanel = ({ entry, dt }: { entry: FinalMixEntry; dt: MixingDetailsTheme }) => (
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
      <DetailField label={S.DETAIL_LABEL_MIXER_BLDG} value={entry.mixerBldgNo} dt={dt} />
      <DetailField label={S.DETAIL_LABEL_BOWL_ID} value={entry.bowlId} dt={dt} />
      <DetailField
        label={S.DETAIL_LABEL_FINAL_MIX_CYCLE}
        value={resolveFinalMixCycleLabel(entry.finalMixCycle)}
        dt={dt}
      />
    </Box>

    <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
      {S.SECTION_QUALITY_CHECKS}
    </Typography>
    <MixingQualityChecksTable rows={entry.qualityChecks} readOnly />
  </SectionCard>
);

const sectionToggleSx = {
  mb: 2,
  "& .MuiToggleButton-root": {
    textTransform: "none",
    fontWeight: 700,
    fontSize: "0.78rem",
    color: BRAND.textSub,
    borderColor: alpha(BRAND.border, 0.85),
    "&.Mui-selected": {
      color: "#fff",
      background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})`,
      borderColor: BRAND.mx,
      "&:hover": { background: `linear-gradient(135deg, ${BRAND.mx}, ${BRAND.mxLight})` },
    },
  },
};

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
  const [activeSectionTab, setActiveSectionTab] = useState<MixingSectionTab>("PREMIX");
  const [activePremixIndex, setActivePremixIndex] = useState(0);
  const [activeFinalMixIndex, setActiveFinalMixIndex] = useState(0);

  const premixCards = detailView?.premixCards ?? [];
  const finalMixCards = detailView?.finalMixCards ?? [];

  const activePremixIndexSafe =
    premixCards.length > 0 ? Math.min(activePremixIndex, premixCards.length - 1) : 0;
  const activeFinalMixIndexSafe =
    finalMixCards.length > 0 ? Math.min(activeFinalMixIndex, finalMixCards.length - 1) : 0;

  const activePremix = premixCards[activePremixIndexSafe] ?? null;
  const activeFinalMix = finalMixCards[activeFinalMixIndexSafe] ?? null;

  const premixNavTabs = useMemo(
    () =>
      premixCards.map((premix) => ({
        id: `premix-${premix.premixNo}`,
        label: getPremixNoLabel(Number(premix.premixNo)),
      })),
    [premixCards],
  );

  const finalMixNavTabs = useMemo(
    () =>
      finalMixCards.map((entry) => ({
        id: `final-mix-${entry.mixNo}`,
        label: getFinalMixNoLabel(Number(entry.mixNo)),
      })),
    [finalMixCards],
  );

  useEffect(() => {
    setActiveSectionTab("PREMIX");
    setActivePremixIndex(0);
    setActiveFinalMixIndex(0);
  }, [resetOnFormId]);

  const metaFields = [
    { label: BL.COL_BATCH_ID, value: detailView?.batchId || String(row?.batchId ?? "") },
    { label: "Form ID", value: detailView?.formId || String(row?.formId ?? "") },
    { label: "Batch Type", value: detailView?.batchType || String(row?.batchType ?? "") },
    { label: "Status", value: detailView?.status || String(row?.mxStatus ?? row?.status ?? "") },
    { label: BL.COL_CREATED_BY, value: detailView?.createdBy || BL.UNASSIGNED },
    { label: BL.COL_CREATED_ON, value: formatDate(detailView?.createdAt ?? (row?.createdOn as string | undefined)) },
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

  const hasStageData = premixCards.length > 0 || finalMixCards.length > 0;

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

          <ToggleButtonGroup
            exclusive
            fullWidth
            size="small"
            value={activeSectionTab}
            onChange={(_, value: MixingSectionTab | null) => value && setActiveSectionTab(value)}
            sx={sectionToggleSx}
          >
            <ToggleButton value="PREMIX">
              {S.SECTION_TAB_PREMIX}
              {premixCards.length > 0 ? ` (${premixCards.length})` : ""}
            </ToggleButton>
            <ToggleButton value="FINAL_MIX">
              {S.SECTION_TAB_FINAL_MIX}
              {finalMixCards.length > 0 ? ` (${finalMixCards.length})` : ""}
            </ToggleButton>
          </ToggleButtonGroup>

          {activeSectionTab === "PREMIX" && (
            <>
              {premixCards.length === 0 || !activePremix ? (
                <Typography sx={dt.emptyText}>{S.NO_PREMIX_CARDS}</Typography>
              ) : premixCards.length === 1 ? (
                <PremixDetailPanel premix={activePremix} dt={dt} />
              ) : (
                <MixingCardNavigation
                  sectionTitle={S.PREMIX_NAV_TITLE}
                  sectionHint={S.PREMIX_NAV_HINT}
                  counterLabel={formatCounter(S.PREMIX_COUNTER, activePremixIndexSafe + 1, premixCards.length)}
                  tabs={premixNavTabs}
                  activeIndex={activePremixIndexSafe}
                  onActiveIndexChange={setActivePremixIndex}
                >
                  <PremixDetailPanel premix={activePremix} dt={dt} />
                </MixingCardNavigation>
              )}
            </>
          )}

          {activeSectionTab === "FINAL_MIX" && (
            <>
              {finalMixCards.length === 0 || !activeFinalMix ? (
                <Typography sx={dt.emptyText}>{S.NO_FINAL_MIX_CARDS}</Typography>
              ) : finalMixCards.length === 1 ? (
                <FinalMixDetailPanel entry={activeFinalMix} dt={dt} />
              ) : (
                <MixingCardNavigation
                  sectionTitle={S.FINAL_MIX_NAV_TITLE}
                  sectionHint={S.FINAL_MIX_NAV_HINT}
                  counterLabel={formatCounter(
                    S.FINAL_MIX_COUNTER,
                    activeFinalMixIndexSafe + 1,
                    finalMixCards.length,
                  )}
                  tabs={finalMixNavTabs}
                  activeIndex={activeFinalMixIndexSafe}
                  onActiveIndexChange={setActiveFinalMixIndex}
                >
                  <FinalMixDetailPanel entry={activeFinalMix} dt={dt} />
                </MixingCardNavigation>
              )}
            </>
          )}
        </Box>
      ) : (
        <Typography sx={dt.emptyText}>No form data recorded</Typography>
      )}
    </>
  );
};

export default MixingDetailsContent;
