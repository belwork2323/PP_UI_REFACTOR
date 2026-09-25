import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  alpha,
} from "@mui/material";
import { QC_DIVISION_BRAND } from "../../../../../app/theme/custom_themes/user/qualityControl/tokens";
import type { SchemaFormValues } from "../../../../../schema-engine";
import {
  createInhibitionDataForType,
} from "../../../../../data/models/user/PostCureFormModel";
import {
  isPostCureInhibitionDetailsRequired,
  type PostCureMotorData,
} from "../../../../../data/models/user/PostCureMotorDataModel";
import { POST_CURE_INHIBITOR_TYPE_OPTIONS } from "../../../../../hooks/user/manufacturing/postCureConfig";
import {
  getPostCureSessionFromValues,
  setPostCureSessionValues,
  toPostCureUiInhibitorType,
} from "../../../../../hooks/user/qualityControl/qcPostCureTables";
import { getQcPostCureMotorLabel } from "../../../../../hooks/user/qualityControl/qcPostCureConfig";
import CasePrepSelect from "../../manufacturing/CasePreparation/CasePrepSelect";
import PostCureMotorPanel from "../../manufacturing/PostCure/PostCureMotorPanel";
import { STRINGS } from "../../../../../app/config/strings";

const S = STRINGS.QUALITY_CONTROL.QC_DIVISION;
const MFG = STRINGS.MANUFACTURING.POST_CURE;
const BRAND = QC_DIVISION_BRAND;

type MotorProcessTab = "LOOSE_FLAP" | "INHIBITION";

const isLooseFlapErrorKey = (key: string) => {
  const path = String(key ?? "").toLowerCase();
  return (
    path.includes("looseflap") ||
    path.includes("loose_flap") ||
    path.includes("bellow") ||
    path.includes("lfepoxy") ||
    path.includes("qualificationdetails")
  );
};

const isInhibitionErrorKey = (key: string) => {
  const path = String(key ?? "").toLowerCase();
  return (
    path.includes("inhibitor") ||
    path.includes("inhibition") ||
    path.includes("ir1") ||
    path.includes("hemcoat") ||
    path.includes("dispatch") ||
    path.includes("notapplicable")
  );
};

const resolveProcessTabForErrors = (
  errors: Record<string, string> | null | undefined,
  currentTab: MotorProcessTab,
): MotorProcessTab => {
  if (!errors || !Object.keys(errors).length) return currentTab;
  const paths = Object.keys(errors);
  const hasLoose = paths.some(isLooseFlapErrorKey);
  const hasInhibition = paths.some(isInhibitionErrorKey);
  if (currentTab === "LOOSE_FLAP" && hasLoose) return "LOOSE_FLAP";
  if (currentTab === "INHIBITION" && hasInhibition) return "INHIBITION";
  if (hasLoose) return "LOOSE_FLAP";
  if (hasInhibition) return "INHIBITION";
  return currentTab;
};

type QCPostCureMotorPanelProps = {
  motorId?: string | null;
  subType?: string | null;
  inhibitorType?: string | null;
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues | ((prev: SchemaFormValues) => SchemaFormValues)) => void;
  readOnly?: boolean;
  disabled?: boolean;
  headerActions?: ReactNode;
  validationErrors?: Record<string, string> | null;
};

const QCPostCureMotorPanel = ({
  motorId,
  inhibitorType: entryInhibitorType,
  values,
  onChange,
  readOnly = false,
  disabled = false,
  headerActions,
  validationErrors = null,
}: QCPostCureMotorPanelProps) => {
  const inputsLocked = Boolean(disabled || readOnly);
  const [activeProcessTab, setActiveProcessTab] = useState<MotorProcessTab>("LOOSE_FLAP");
  const [inhibitionTypeEditing, setInhibitionTypeEditing] = useState(false);

  const session = useMemo(
    () => getPostCureSessionFromValues(values, entryInhibitorType),
    [values, entryInhibitorType],
  );

  const panelTheme = useMemo(
    () => ({
      palette: {
        primary: BRAND.primary,
        primaryLight: BRAND.primaryLight,
        border: BRAND.border,
        surface: BRAND.surface,
        text: BRAND.text,
        textSub: BRAND.textSub,
        danger: BRAND.danger,
        pageBg: "#fff",
      },
      manufacturing: {
        casePreparation: {
          flowBar: {
            primary: BRAND.primary,
            primaryLight: BRAND.primaryLight,
            border: BRAND.border,
            surface: BRAND.surface,
            text: BRAND.text,
            textSub: BRAND.textSub,
          },
        },
      },
    }),
    [],
  );

  useEffect(() => {
    setActiveProcessTab(resolveProcessTabForErrors(validationErrors, activeProcessTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to new validation errors
  }, [validationErrors]);

  const persistSession = useCallback(
    (next: typeof session) => {
      if (inputsLocked) return;
      onChange(setPostCureSessionValues(next));
    },
    [inputsLocked, onChange],
  );

  const clearFieldError = useCallback((_path: string) => {
    // Entry-level validation errors are owned by the QC hook; panel clears happen on re-validate.
  }, []);

  const handleInhibitorTypeChange = (nextInhibitorType: string) => {
    if (inputsLocked) return;
    persistSession({
      ...session,
      inhibitorType: nextInhibitorType,
      inhibitionData: createInhibitionDataForType(nextInhibitorType),
    });
    setInhibitionTypeEditing(false);
  };

  const handleClearInhibitionSetup = () => {
    if (inputsLocked) return;
    persistSession({
      ...session,
      inhibitorType: "",
      inhibitionData: null,
    });
    setInhibitionTypeEditing(false);
  };

  const inhibitionTypeSelected = Boolean(String(session.inhibitorType ?? "").trim());
  const inhibitionTypeLocked = inhibitionTypeSelected && !inhibitionTypeEditing;
  const canChangeInhibitionSetup = inhibitionTypeSelected && !inputsLocked;
  const showInhibitionEdit = canChangeInhibitionSetup;
  const showInhibitionDelete = canChangeInhibitionSetup;
  const showInhibitionPanel =
    inhibitionTypeSelected && isPostCureInhibitionDetailsRequired(session.inhibitorType);

  const sectionToggleSx = {
    width: "100%",
    mb: 1.5,
    display: "flex",
    "& .MuiToggleButtonGroup-grouped": { flex: 1 },
    "& .MuiToggleButton-root": {
      flex: 1,
      px: 2.5,
      py: 0.9,
      fontWeight: 700,
      fontSize: "0.82rem",
      textTransform: "none" as const,
      borderColor: alpha(BRAND.primary, 0.35),
      "&.Mui-selected": {
        background: alpha(BRAND.primary, 0.12),
        color: BRAND.primary,
      },
    },
  };

  const errors = validationErrors ?? {};

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${BRAND.border}`,
        background: BRAND.surface,
        px: 1.5,
        py: 1.25,
        ...(inputsLocked && !readOnly
          ? { pointerEvents: "none", userSelect: "none", opacity: 0.92 }
          : null),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.25} gap={1}>
        <Typography sx={{ fontSize: "0.84rem", fontWeight: 800, color: BRAND.primary }}>
          {getQcPostCureMotorLabel(motorId)}
        </Typography>
        {headerActions}
      </Stack>

      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={activeProcessTab}
        onChange={(_, value: MotorProcessTab | null) => {
          if (!value) return;
          setActiveProcessTab(value);
        }}
        sx={sectionToggleSx}
      >
        <ToggleButton
          value="LOOSE_FLAP"
          sx={
            Object.keys(errors).some(isLooseFlapErrorKey)
              ? { color: `${BRAND.danger} !important`, borderColor: `${BRAND.danger} !important` }
              : undefined
          }
        >
          {S.POST_CURE_PROCESS_LOOSE_FLAP ?? MFG.OPERATION_LOOSE_FLAP_FILLING}
        </ToggleButton>
        <ToggleButton
          value="INHIBITION"
          sx={
            Object.keys(errors).some(isInhibitionErrorKey)
              ? { color: `${BRAND.danger} !important`, borderColor: `${BRAND.danger} !important` }
              : undefined
          }
        >
          {S.POST_CURE_PROCESS_INHIBITION ?? MFG.OPERATION_INHIBITION}
        </ToggleButton>
      </ToggleButtonGroup>

      {activeProcessTab === "LOOSE_FLAP" ? (
        <PostCureMotorPanel
          value={session.looseFlapData}
          onChange={(looseFlapData: PostCureMotorData) =>
            persistSession({
              ...session,
              looseFlapData: looseFlapData as typeof session.looseFlapData,
            })
          }
          validationErrors={errors}
          clearFieldError={clearFieldError}
          disabled={inputsLocked}
          readOnly={readOnly}
          theme={panelTheme}
          useQcDivisionFileField
        />
      ) : null}

      {activeProcessTab === "INHIBITION" ? (
        <Stack spacing={1.25}>
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${BRAND.border}`,
              background: alpha(BRAND.primary, 0.03),
              px: 1.25,
              py: 1.25,
            }}
          >
            <Stack
              direction="row"
              alignItems="flex-start"
              justifyContent="space-between"
              gap={1}
              mb={1.25}
            >
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.primary }}>
                {MFG.INHIBITION_SECTION_TITLE}
              </Typography>
              <Stack direction="row" spacing={0.75}>
                {showInhibitionEdit ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setInhibitionTypeEditing(true)}
                    sx={{ textTransform: "none", fontWeight: 700, minWidth: 64 }}
                  >
                    {MFG.EDIT_INHIBITION_TYPE}
                  </Button>
                ) : null}
                {showInhibitionDelete ? (
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={handleClearInhibitionSetup}
                    sx={{ textTransform: "none", fontWeight: 700, minWidth: 64 }}
                  >
                    {MFG.DELETE_INHIBITION_SETUP}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
            <CasePrepSelect
              label={MFG.INHIBITOR_TYPE_LABEL}
              value={toPostCureUiInhibitorType(session.inhibitorType) || session.inhibitorType}
              placeholder={MFG.INHIBITOR_TYPE_PLACEHOLDER}
              options={POST_CURE_INHIBITOR_TYPE_OPTIONS}
              width={260}
              theme={panelTheme}
              disabled={!inputsLocked && inhibitionTypeLocked}
              readOnly={inputsLocked}
              onChange={handleInhibitorTypeChange}
            />
            {errors.inhibitorType ? (
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.danger, mt: 0.75 }}>
                {String(errors.inhibitorType)}
              </Typography>
            ) : null}
          </Box>

          {showInhibitionPanel && session.inhibitionData ? (
            <PostCureMotorPanel
              value={session.inhibitionData}
              onChange={(inhibitionData: PostCureMotorData) =>
                persistSession({
                  ...session,
                  inhibitionData,
                })
              }
              validationErrors={errors}
              clearFieldError={clearFieldError}
              disabled={inputsLocked}
              readOnly={readOnly}
              theme={panelTheme}
              useQcDivisionFileField
            />
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
};

export default QCPostCureMotorPanel;
