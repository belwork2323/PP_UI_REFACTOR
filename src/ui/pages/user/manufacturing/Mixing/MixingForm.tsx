import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Typography,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { styled, keyframes } from "@mui/material/styles";

import { STRINGS } from "../../../../../app/config/strings";
import { icons } from "../../../../../app/theme/icons";
import { MIXING_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/mixing_theme";
import {
  BOWL_ID_OPTIONS,
  FINAL_MIX_CYCLE_OPTIONS,
  MIXER_BLDG_OPTIONS,
  MIXING_CYCLE_OPTIONS,
  PREMIX_NO_OPTIONS,
  getFinalMixNoLabel,
  getPremixNoLabel,
} from "../../../../../hooks/user/manufacturing/mixingConfig";
import { createDefaultMixingFormState } from "../../../../../data/models/user/MixingFormModel";
import type { FinalMixEntry, PremixEntry } from "../../../../../data/models/user/MixingFormModel";
import { useMixingFormHook } from "../../../../../hooks/user/manufacturing/useMixingFormHook";
import MixingDateField from "./MixingDateField";
import MixingFlowBar from "./MixingFlowBar";
import MixingCardNavigation from "./MixingCardNavigation";
import MixingQualityChecksTable from "./MixingQualityChecksTable";
import { MixingSelectField, MixingTableInput, MixingTextField } from "./MixingFormFields";

type MixingSectionTab = "PREMIX" | "FINAL_MIX";

type PendingCardNav = {
  section: MixingSectionTab;
  cardNo: number;
};

const formatCounter = (template: string, current: number, total: number) =>
  template.replace("{current}", String(current)).replace("{total}", String(total));

const {
  blender: BlenderRoundedIcon,
  checklist: ChecklistRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
} = icons.user.manufacturing.mixing.form;

const BRAND = MIXING_BRAND;
const S = STRINGS.MANUFACTURING.MIXING;

const slideIn = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;

const SectionCard = styled(Box)({
  borderRadius: 16,
  border: "1px solid rgba(21,101,192,0.2)",
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 18px rgba(21,101,192,0.07)",
  animation: `${slideIn} 0.35s ease both`,
});

const SectionHeader = styled(Box)({
  padding: "13px 20px",
  background: "linear-gradient(135deg, rgba(21,101,192,0.07), rgba(25,118,210,0.03))",
  borderBottom: "1px solid rgba(21,101,192,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

const TH = styled(TableCell)({
  background: "linear-gradient(135deg, #1565C0, #1976D2)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  padding: "11px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
  verticalAlign: "middle",
});

const TD = styled(TableCell)({
  padding: "10px 12px",
  borderBottom: "1px solid rgba(213,216,220,0.5)",
  verticalAlign: "middle",
});

const tableShellSx = {
  overflowX: "auto" as const,
  border: `1px solid ${alpha(BRAND.border, 0.85)}`,
  borderRadius: 2,
  background: "#fff",
};

const PROCESS_PLACEHOLDERS = {
  rpm: S.PLACEHOLDER_RPM,
  time: S.PLACEHOLDER_TIME,
  temp: S.PLACEHOLDER_TEMP,
  vacuum: S.PLACEHOLDER_VACUUM,
} as const;

const EmptySectionState = ({ message }: { message: string }) => (
  <Box
    sx={{
      border: `1px dashed ${alpha(BRAND.mx, 0.25)}`,
      borderRadius: 2,
      p: 2.5,
      background: alpha(BRAND.surface, 0.45),
    }}
  >
    <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub }}>{message}</Typography>
  </Box>
);

type PremixStageCardProps = {
  premix: PremixEntry;
  onRemove: (premixNo: string) => void;
  onPremixFieldChange: (
    premixNo: string,
    field: keyof Omit<PremixEntry, "premixNo" | "processParticulars" | "qualityChecks">,
    value: string,
  ) => void;
  onProcessChange: (
    premixNo: string,
    rowId: number,
    field: "rpm" | "time" | "temp" | "vacuum",
    value: string,
  ) => void;
  onQualityChange: (
    premixNo: string,
    parameter: string,
    field: "observed1" | "observed2" | "observed3" | "observed4",
    value: string,
  ) => void;
};

const PremixStageCard = ({
  premix,
  onRemove,
  onPremixFieldChange,
  onProcessChange,
  onQualityChange,
}: PremixStageCardProps) => (
  <SectionCard>
    <SectionHeader>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            background: "linear-gradient(135deg,#1565C0,#1976D2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 10px rgba(21,101,192,0.3)",
          }}
        >
          <ChecklistRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
          {S.SECTION_PREMIX_STAGE} — {getPremixNoLabel(Number(premix.premixNo))}
        </Typography>
      </Stack>
      <Tooltip title={S.REMOVE_CARD_TOOLTIP} arrow>
        <IconButton size="small" onClick={() => onRemove(premix.premixNo)} sx={{ color: BRAND.danger }}>
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </SectionHeader>

    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <MixingSelectField
          label={S.LABEL_MIXER_BLDG}
          value={premix.mixerBldgNo}
          placeholder={S.PLACEHOLDER_MIXER_BLDG}
          options={MIXER_BLDG_OPTIONS}
          onChange={(value) => onPremixFieldChange(premix.premixNo, "mixerBldgNo", value)}
        />
        <MixingSelectField
          label={S.LABEL_BOWL_ID}
          value={premix.bowlId}
          placeholder={S.PLACEHOLDER_BOWL_ID}
          options={BOWL_ID_OPTIONS}
          onChange={(value) => onPremixFieldChange(premix.premixNo, "bowlId", value)}
        />
        <MixingDateField
          label={S.LABEL_BOWL_TRIAL_DATE}
          value={premix.bowlTrialDate}
          placeholder="DD-MM-YYYY"
          onChange={(value) => onPremixFieldChange(premix.premixNo, "bowlTrialDate", value)}
        />
        <Box sx={{ gridColumn: { xs: "1 / -1", md: "span 2" } }}>
          <MixingTextField
            label={S.LABEL_BOWL_TRIAL_OBS}
            value={premix.bowlTrialObservations}
            placeholder={S.PLACEHOLDER_BOWL_TRIAL_OBS}
            multiline
            minRows={2}
            onChange={(value) => onPremixFieldChange(premix.premixNo, "bowlTrialObservations", value)}
          />
        </Box>
        <MixingDateField
          label={S.LABEL_PREMIX_DATE}
          value={premix.premixDate}
          placeholder="DD-MM-YYYY"
          onChange={(value) => onPremixFieldChange(premix.premixNo, "premixDate", value)}
        />
        <MixingTextField
          label={S.LABEL_PREMIX_QTY}
          value={premix.premixQuantity}
          placeholder={S.PLACEHOLDER_PREMIX_QTY}
          type="number"
          onChange={(value) => onPremixFieldChange(premix.premixNo, "premixQuantity", value)}
        />
        <MixingSelectField
          label={S.LABEL_MIXING_CYCLE}
          value={premix.mixingCycle}
          placeholder={S.PLACEHOLDER_MIXING_CYCLE}
          options={MIXING_CYCLE_OPTIONS.map((cycle) => ({ value: cycle.value, label: cycle.label }))}
          onChange={(value) => onPremixFieldChange(premix.premixNo, "mixingCycle", value)}
        />
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 0.4 }}>
        {S.SECTION_PROCESS_PARTICULARS}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mb: 1.2 }}>
        {S.SECTION_PROCESS_PARTICULARS_HINT}
      </Typography>

      <TableContainer sx={{ ...tableShellSx, mb: 2.5 }}>
        <Table size="small" sx={{ minWidth: 760 }}>
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 240 }}>{S.COL_OPERATION}</TH>
              <TH>{S.COL_ROTATION}</TH>
              <TH>{S.COL_TIME}</TH>
              <TH>{S.COL_TEMP}</TH>
              <TH>{S.COL_VACUUM}</TH>
            </TableRow>
          </TableHead>
          <TableBody>
            {premix.processParticulars.length === 0 ? (
              <TableRow>
                <TD colSpan={5}>
                  <Typography sx={{ fontSize: "0.78rem", color: BRAND.textSub, py: 1 }}>
                    {S.PROCESS_PARTICULARS_EMPTY}
                  </Typography>
                </TD>
              </TableRow>
            ) : (
              premix.processParticulars.map((row, rowIdx) => (
                <TableRow
                  key={row.id}
                  sx={{ background: rowIdx % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.55) }}
                >
                  <TD>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text }}>
                      {row.operation}
                    </Typography>
                  </TD>
                  {(["rpm", "time", "temp", "vacuum"] as const).map((field) => (
                    <TD key={field}>
                      <MixingTableInput
                        value={row[field]}
                        placeholder={PROCESS_PLACEHOLDERS[field]}
                        onChange={(value) => onProcessChange(premix.premixNo, row.id, field, value)}
                      />
                    </TD>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
        {S.SECTION_QUALITY_CHECKS}
      </Typography>

      <MixingQualityChecksTable
        rows={premix.qualityChecks}
        onChange={(parameter, field, value) =>
          onQualityChange(premix.premixNo, parameter, field, value)
        }
      />
    </Box>
  </SectionCard>
);

const FinalMixStageCard = ({
  entry,
  linkedPremixOptions,
  onRemove,
  onFieldChange,
  onQualityChange,
}: {
  entry: FinalMixEntry;
  linkedPremixOptions: string[];
  onRemove: (mixNo: string) => void;
  onFieldChange: (
    mixNo: string,
    field: keyof Omit<FinalMixEntry, "mixNo" | "qualityChecks">,
    value: string,
  ) => void;
  onQualityChange: (
    mixNo: string,
    parameter: string,
    field: "observed1" | "observed2" | "observed3" | "observed4",
    value: string,
  ) => void;
}) => (
  <SectionCard>
    <SectionHeader>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            background: "linear-gradient(135deg,#1565C0,#1976D2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 3px 10px rgba(21,101,192,0.3)",
          }}
        >
          <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontWeight: 800, fontSize: "0.92rem", color: BRAND.text }}>
          {S.SECTION_FINAL_MIX_STAGE} — {getFinalMixNoLabel(Number(entry.mixNo))}
        </Typography>
      </Stack>
      <Tooltip title={S.REMOVE_CARD_TOOLTIP} arrow>
        <IconButton size="small" onClick={() => onRemove(entry.mixNo)} sx={{ color: BRAND.danger }}>
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </SectionHeader>

    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(2, 1fr)" },
          gap: 2,
          mb: 2.5,
        }}
      >
        <MixingSelectField
          label={S.LABEL_PREMIX_NO}
          value={entry.linkedPremixNo}
          placeholder={S.STAGE_NO_PLACEHOLDER}
          options={linkedPremixOptions}
          onChange={(value) => onFieldChange(entry.mixNo, "linkedPremixNo", value)}
        />
        <MixingSelectField
          label={S.LABEL_MIXER_BLDG}
          value={entry.mixerBldgNo}
          placeholder={S.PLACEHOLDER_MIXER_BLDG}
          options={MIXER_BLDG_OPTIONS}
          onChange={(value) => onFieldChange(entry.mixNo, "mixerBldgNo", value)}
        />
        <MixingSelectField
          label={S.LABEL_BOWL_ID}
          value={entry.bowlId}
          placeholder={S.PLACEHOLDER_BOWL_ID}
          options={BOWL_ID_OPTIONS}
          onChange={(value) => onFieldChange(entry.mixNo, "bowlId", value)}
        />
        <MixingSelectField
          label={S.LABEL_FINAL_MIX_CYCLE}
          value={entry.finalMixCycle}
          placeholder={S.PLACEHOLDER_FINAL_MIX_CYCLE}
          options={FINAL_MIX_CYCLE_OPTIONS.map((cycle) => ({
            value: cycle.value,
            label: cycle.label,
          }))}
          onChange={(value) => onFieldChange(entry.mixNo, "finalMixCycle", value)}
        />
      </Box>

      <Typography sx={{ fontWeight: 800, fontSize: "0.84rem", color: BRAND.text, mb: 1 }}>
        {S.SECTION_QUALITY_CHECKS}
      </Typography>

      <MixingQualityChecksTable
        rows={entry.qualityChecks}
        onChange={(parameter, field, value) =>
          onQualityChange(entry.mixNo, parameter, field, value)
        }
      />
    </Box>
  </SectionCard>
);

type MixingFormProps = {
  initialData?: ReturnType<typeof createDefaultMixingFormState>;
  numberOfPremix?: number;
  onBlocksChange?: (payload: ReturnType<typeof createDefaultMixingFormState>) => void;
};

const MixingForm = ({
  initialData,
  numberOfPremix = 4,
  onBlocksChange,
}: MixingFormProps) => {
  const {
    premixCards,
    finalMixCards,
    selectedMixingStage,
    selectedStageNo,
    availableStageNumbers,
    canAddStageCard,
    handleMixingStageChange,
    handleStageNoChange,
    handleAddStageCard,
    removePremixCard,
    removeFinalMixCard,
    updatePremixField,
    updateProcessParticular,
    updateQualityCheck,
    updateFinalMixField,
    updateFinalMixQualityCheck,
  } = useMixingFormHook(
    initialData ?? createDefaultMixingFormState(),
    onBlocksChange,
    numberOfPremix,
  );

  const [activeSectionTab, setActiveSectionTab] = useState<MixingSectionTab>("PREMIX");
  const [activePremixIndex, setActivePremixIndex] = useState(0);
  const [activeFinalMixIndex, setActiveFinalMixIndex] = useState(0);
  const pendingCardNavRef = useRef<PendingCardNav | null>(null);

  useEffect(() => {
    if (premixCards.length === 0) {
      setActivePremixIndex(0);
      return;
    }
    setActivePremixIndex((prev) => Math.min(prev, premixCards.length - 1));
  }, [premixCards.length]);

  useEffect(() => {
    if (finalMixCards.length === 0) {
      setActiveFinalMixIndex(0);
      return;
    }
    setActiveFinalMixIndex((prev) => Math.min(prev, finalMixCards.length - 1));
  }, [finalMixCards.length]);

  useEffect(() => {
    const pending = pendingCardNavRef.current;
    if (!pending) return;

    if (pending.section === "PREMIX") {
      const idx = premixCards.findIndex((entry) => entry.premixNo === String(pending.cardNo));
      if (idx >= 0) {
        setActiveSectionTab("PREMIX");
        setActivePremixIndex(idx);
        pendingCardNavRef.current = null;
      }
      return;
    }

    const idx = finalMixCards.findIndex((entry) => entry.mixNo === String(pending.cardNo));
    if (idx >= 0) {
      setActiveSectionTab("FINAL_MIX");
      setActiveFinalMixIndex(idx);
      pendingCardNavRef.current = null;
    }
  }, [premixCards, finalMixCards]);

  const handleAddWithNavigation = useCallback(() => {
    if (selectedMixingStage === "PREMIX" && selectedStageNo !== "") {
      pendingCardNavRef.current = { section: "PREMIX", cardNo: selectedStageNo };
    } else if (selectedMixingStage === "FINAL_MIX" && selectedStageNo !== "") {
      pendingCardNavRef.current = { section: "FINAL_MIX", cardNo: selectedStageNo };
    }
    handleAddStageCard();
  }, [handleAddStageCard, selectedMixingStage, selectedStageNo]);

  const handleRemovePremix = useCallback(
    (premixNo: string) => {
      const removedIndex = premixCards.findIndex((entry) => entry.premixNo === premixNo);
      removePremixCard(premixNo);
      if (removedIndex >= 0) {
        setActivePremixIndex((prev) => {
          if (prev > removedIndex) return prev - 1;
          if (prev === removedIndex) return Math.max(0, prev - 1);
          return prev;
        });
      }
    },
    [premixCards, removePremixCard],
  );

  const handleRemoveFinalMix = useCallback(
    (mixNo: string) => {
      const removedIndex = finalMixCards.findIndex((entry) => entry.mixNo === mixNo);
      removeFinalMixCard(mixNo);
      if (removedIndex >= 0) {
        setActiveFinalMixIndex((prev) => {
          if (prev > removedIndex) return prev - 1;
          if (prev === removedIndex) return Math.max(0, prev - 1);
          return prev;
        });
      }
    },
    [finalMixCards, removeFinalMixCard],
  );

  const activePremix = useMemo(
    () => (premixCards.length > 0 ? premixCards[activePremixIndex] : null),
    [premixCards, activePremixIndex],
  );

  const activeFinalMix = useMemo(
    () => (finalMixCards.length > 0 ? finalMixCards[activeFinalMixIndex] : null),
    [finalMixCards, activeFinalMixIndex],
  );

  const premixNavTabs = useMemo(
    () =>
      premixCards.map((entry) => ({
        id: entry.premixNo,
        label: getPremixNoLabel(Number(entry.premixNo)),
      })),
    [premixCards],
  );

  const finalMixNavTabs = useMemo(
    () =>
      finalMixCards.map((entry) => ({
        id: entry.mixNo,
        label: getFinalMixNoLabel(Number(entry.mixNo)),
      })),
    [finalMixCards],
  );

  const linkedPremixOptions = useMemo(() => {
    if (premixCards.length > 0) {
      return premixCards.map((entry) => entry.premixNo);
    }
    return PREMIX_NO_OPTIONS;
  }, [premixCards]);

  const sectionToggleSx = {
    width: "100%",
    mb: 2,
    display: "flex",
    "& .MuiToggleButtonGroup-grouped": {
      flex: 1,
    },
    "& .MuiToggleButton-root": {
      flex: 1,
      px: 2.5,
      py: 0.9,
      fontWeight: 700,
      fontSize: "0.82rem",
      textTransform: "none" as const,
      borderColor: alpha(BRAND.mx, 0.35),
      "&.Mui-selected": {
        background: `linear-gradient(135deg, ${alpha(BRAND.mx, 0.14)}, ${alpha(BRAND.mxLight, 0.1)})`,
        color: BRAND.mx,
        borderColor: BRAND.mx,
      },
    },
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Stack direction="row" alignItems="center" gap={1.5} mb={2.5}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "11px",
            background: "linear-gradient(135deg,#1565C0,#1976D2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(21,101,192,0.3)",
          }}
        >
          <BlenderRoundedIcon sx={{ color: "#fff", fontSize: 19 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: "0.98rem", color: BRAND.text }}>{S.FORM_TITLE}</Typography>
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.15 }}>{S.FORM_SUBTITLE}</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 2 }}>
        <MixingFlowBar
          selectedMixingStage={selectedMixingStage}
          selectedStageNo={selectedStageNo}
          availableStageNumbers={availableStageNumbers}
          canAddStageCard={canAddStageCard}
          onMixingStageChange={handleMixingStageChange}
          onStageNoChange={handleStageNoChange}
          onAddStageCard={handleAddWithNavigation}
        />
      </Box>

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
            <EmptySectionState message={S.NO_PREMIX_CARDS} />
          ) : (
            <MixingCardNavigation
              sectionTitle={S.PREMIX_NAV_TITLE}
              sectionHint={S.PREMIX_NAV_HINT}
              counterLabel={formatCounter(
                S.PREMIX_COUNTER,
                activePremixIndex + 1,
                premixCards.length,
              )}
              tabs={premixNavTabs}
              activeIndex={activePremixIndex}
              onActiveIndexChange={setActivePremixIndex}
            >
              <PremixStageCard
                key={`premix-card-${activePremix.premixNo}`}
                premix={activePremix}
                onRemove={handleRemovePremix}
                onPremixFieldChange={updatePremixField}
                onProcessChange={updateProcessParticular}
                onQualityChange={updateQualityCheck}
              />
            </MixingCardNavigation>
          )}
        </>
      )}

      {activeSectionTab === "FINAL_MIX" && (
        <>
          {finalMixCards.length === 0 || !activeFinalMix ? (
            <EmptySectionState message={S.NO_FINAL_MIX_CARDS} />
          ) : (
            <MixingCardNavigation
              sectionTitle={S.FINAL_MIX_NAV_TITLE}
              sectionHint={S.FINAL_MIX_NAV_HINT}
              counterLabel={formatCounter(
                S.FINAL_MIX_COUNTER,
                activeFinalMixIndex + 1,
                finalMixCards.length,
              )}
              tabs={finalMixNavTabs}
              activeIndex={activeFinalMixIndex}
              onActiveIndexChange={setActiveFinalMixIndex}
            >
              <FinalMixStageCard
                key={`final-mix-card-${activeFinalMix.mixNo}`}
                entry={activeFinalMix}
                linkedPremixOptions={linkedPremixOptions}
                onRemove={handleRemoveFinalMix}
                onFieldChange={updateFinalMixField}
                onQualityChange={updateFinalMixQualityCheck}
              />
            </MixingCardNavigation>
          )}
        </>
      )}
    </Box>
  );
};

export default MixingForm;
