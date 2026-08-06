import React from "react";
import { Box, Button, CircularProgress } from "@mui/material";
import CasePrepDateField from "../manufacturing/CasePreparation/CasePrepDateField";
import CasePrepTextField from "../manufacturing/CasePreparation/CasePrepTextField";
import CasePrepSelect from "../manufacturing/CasePreparation/CasePrepSelect";
import {
  DISPATCH_FLOW_LABELS,
  DISPATCH_YES_NO_OPTIONS,
  DispatchSharedSetup,
  canLoadDispatchMotor,
} from "../../../../hooks/user/dispatch/dispatchFlowConfig";
import type getDispatchTheme from "../../../../app/theme/custom_themes/user/dispatch/dispatch_theme";

type DispatchFlowBarProps = {
  setup: DispatchSharedSetup;
  draftMotorId: string;
  usedMotorIds?: string[];
  hasMotors?: boolean;
  schemaLoading?: boolean;
  onSetupChange: <K extends keyof DispatchSharedSetup>(
    field: K,
    value: DispatchSharedSetup[K],
  ) => void;
  onLoadForm: () => void;
  theme: any;
  dispatchTheme: ReturnType<typeof getDispatchTheme>;
};

const DispatchFlowBar: React.FC<DispatchFlowBarProps> = ({
  setup,
  draftMotorId,
  usedMotorIds = [],
  hasMotors = false,
  schemaLoading = false,
  onSetupChange,
  onLoadForm,
  theme,
  dispatchTheme,
}) => {
  const flowBar = dispatchTheme.flowBar;
  const casePrepFlowBar = theme.manufacturing?.casePreparation?.flowBar ?? {};
  const L = DISPATCH_FLOW_LABELS;

  const canLoad = canLoadDispatchMotor({
    setup,
    draftMotorId,
    usedMotorIds,
    hasMotors,
  });

  const selectTheme = {
    ...theme,
    manufacturing: theme.manufacturing ?? { casePreparation: { flowBar: casePrepFlowBar } },
  };

  return (
    <Box sx={flowBar.container}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Row 1: Dates & Location */}
        <Box sx={flowBar.topRow}>
          <CasePrepDateField
            label={L.castingDate}
            value={setup.castingDate ?? ""}
            onChange={(val) => onSetupChange("castingDate", val)}
            theme={selectTheme}
          />

          <CasePrepDateField
            label={L.dispatchDate}
            value={setup.dispatchDate ?? ""}
            onChange={(val) => onSetupChange("dispatchDate", val)}
            theme={selectTheme}
          />

          <CasePrepTextField
            label={L.dispatchLocation}
            value={setup.dispatchLocation ?? ""}
            placeholder={L.dispatchLocationPlaceholder}
            width={240}
            theme={selectTheme}
            onChange={(val) => onSetupChange("dispatchLocation", val)}
          />
        </Box>

        {/* Row 2: Clearances & Action */}
        <Box sx={flowBar.topRow}>
          <CasePrepSelect
            label={L.ndtClearance}
            value={setup.ndtClearance ?? ""}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={200}
            theme={selectTheme}
            onChange={(val) => onSetupChange("ndtClearance", val)}
          />

          {setup.ndtClearance === "YES" && (
            <CasePrepTextField
              label={L.ndtMomNo}
              value={setup.ndtMomNo ?? ""}
              placeholder={L.ndtMomNoPlaceholder}
              theme={selectTheme}
              onChange={(val) => onSetupChange("ndtMomNo", val)}
            />
          )}

          <CasePrepSelect
            label={L.finalAcceptanceClearance}
            value={setup.finalAcceptanceClearance ?? ""}
            placeholder="Select"
            options={DISPATCH_YES_NO_OPTIONS}
            width={240}
            theme={selectTheme}
            onChange={(val) => onSetupChange("finalAcceptanceClearance", val)}
          />

          {setup.finalAcceptanceClearance === "YES" && (
            <CasePrepTextField
              label={L.finalAcceptanceMomNo}
              value={setup.finalAcceptanceMomNo ?? ""}
              placeholder={L.finalAcceptanceMomNoPlaceholder}
              theme={selectTheme}
              onChange={(val) => onSetupChange("finalAcceptanceMomNo", val)}
            />
          )}

          <Box sx={{ ...flowBar.actionRow, ml: "auto" }}>
            <Button
              variant="contained"
              size="medium"
              disabled={!canLoad || schemaLoading}
              onClick={onLoadForm}
              startIcon={schemaLoading ? <CircularProgress size={14} color="inherit" /> : undefined}
              sx={flowBar.primaryAction}
            >
              {schemaLoading ? L.loadingSchema : L.loadForm}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default DispatchFlowBar;
