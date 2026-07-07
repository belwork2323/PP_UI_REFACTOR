import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from "@mui/material";
import DescriptionRoundedIcon from "@mui/icons-material/DescriptionRounded";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import {
  canAddNDTMotors,
  canLoadNDTForm,
  type NDTAddedMotor,
  type NDTMotorOption,
} from "../../../../../hooks/user/qualityControl/ndtFlowConfig";
import type { NDTFormState, NDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import { normalizeNDTMotorSession } from "../../../../../data/models/user/NDTFormModel";
import type { NDTBatch } from "../../../../../hooks/user/qualityControl/useNDTHook";
import NDTFlowBar from "./NDTFlowBar";
import NDTMotorNavigation from "./NDTMotorNavigation";
import NDTMotorTables from "./NDTMotorTables";

const { warning: WarningAmberRoundedIcon, biotech: BiotechRoundedIcon } = icons.user.qualityControl.ndt.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  text: "#1C2833",
  textSub: "#5D6D7E",
  danger: "#C0392B",
  border: "#D5D8DC",
};

type Props = {
  activeBatch?: NDTBatch | null;
  formData: NDTFormState;
  addedMotors: NDTAddedMotor[];
  motorCount: number | "";
  draftMotorIds: string[];
  availableMotorOptions: NDTMotorOption[];
  maxMotorCount: number;
  isEditMode?: boolean;
  flowBarTheme: any;
  onSetupChange: (patch: Partial<NDTFormState>) => void;
  onMotorSessionChange: (motorId: string, patch: Partial<NDTMotorSession>) => void;
  onMotorCountChange: (count: number | "") => void;
  onDraftMotorIdChange: (index: number, motorId: string) => void;
  onLoadNDTForm: () => void;
  onAddMotors: () => void;
};

const NDTForm = ({
  activeBatch = null,
  formData,
  addedMotors,
  motorCount,
  draftMotorIds,
  availableMotorOptions,
  maxMotorCount,
  isEditMode = false,
  flowBarTheme,
  onSetupChange,
  onMotorSessionChange,
  onMotorCountChange,
  onDraftMotorIdChange,
  onLoadNDTForm,
  onAddMotors,
}: Props) => {
  const strings = STRINGS.QUALITY_CONTROL.NDT;
  const [activeMotorIndex, setActiveMotorIndex] = useState(0);
  const prevMotorCountRef = useRef(0);

  const motorCards = Array.isArray(addedMotors) ? addedMotors : [];
  const usedMotorIds = motorCards.map((motor) => motor.motorId);

  const safeBeamEnergies = Array.isArray(formData.beamEnergies) ? formData.beamEnergies : [];
  const safePlanRows = Array.isArray(formData.radiographyPlanRows) ? formData.radiographyPlanRows : [];

  const canLoad = canLoadNDTForm({
    equipment: formData.equipment ?? "",
    beamEnergies: safeBeamEnergies,
    radiographyPlan: formData.radiographyPlan,
    motorCount,
    draftMotorIds,
    usedMotorIds,
    ndtFormLoaded: formData.formLoaded,
    availableMotorOptions,
    maxMotorCount,
  });

  const canAdd = canAddNDTMotors({
    equipment: formData.equipment ?? "",
    beamEnergies: safeBeamEnergies,
    radiographyPlan: formData.radiographyPlan,
    motorCount,
    draftMotorIds,
    usedMotorIds,
    ndtFormLoaded: formData.formLoaded,
    availableMotorOptions,
    maxMotorCount,
  });

  useEffect(() => {
    if (motorCards.length === 0) {
      setActiveMotorIndex(0);
      prevMotorCountRef.current = 0;
      return;
    }
    if (motorCards.length > prevMotorCountRef.current) {
      setActiveMotorIndex(motorCards.length - 1);
    } else {
      setActiveMotorIndex((prev) => Math.min(prev, motorCards.length - 1));
    }
    prevMotorCountRef.current = motorCards.length;
  }, [motorCards.length]);

  const activeMotorEntry = useMemo(
    () => (motorCards.length > 0 ? motorCards[activeMotorIndex] : null),
    [motorCards, activeMotorIndex],
  );

  const activeMotorSession = useMemo(() => {
    if (!activeMotorEntry) return null;
    const found = (formData.motors ?? []).find((motor) => motor.motorId === activeMotorEntry.motorId);
    return found ? normalizeNDTMotorSession(found) : null;
  }, [activeMotorEntry, formData.motors]);

  const navTabs = motorCards.map((motor) => ({ id: motor.motorId, label: motor.motorId }));

  return (
    <Box sx={{ fontFamily: "'DM Sans',sans-serif" }}>
      {isEditMode ? (
        <Box
          sx={{
            mb: 1.5,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background: alpha(BRAND.danger, 0.05),
            border: `1.5px solid ${alpha(BRAND.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 16, color: BRAND.danger }} />
          <Typography sx={{ fontSize: "0.76rem", color: BRAND.danger, fontWeight: 600 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      ) : null}

      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(BRAND.primary, 0.14)}`,
          background: "#fff",
          px: 1.5,
          py: 1.25,
          mb: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" gap={1} mb={1}>
          <BiotechRoundedIcon sx={{ color: BRAND.primaryLight, fontSize: 18 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.88rem", color: BRAND.text }}>
              NDT setup
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub }}>
              {activeBatch?.batchId ? `Batch ${activeBatch.batchId}` : "Select radiography details and motors"}
            </Typography>
          </Box>
        </Stack>

        <NDTFlowBar
          equipment={formData.equipment ?? ""}
          beamEnergies={safeBeamEnergies}
          radiographyPlan={formData.radiographyPlan ?? ""}
          motorCount={motorCount}
          draftMotorIds={draftMotorIds}
          availableMotorOptions={availableMotorOptions}
          usedMotorIds={usedMotorIds}
          ndtFormLoaded={formData.formLoaded}
          maxMotorCount={maxMotorCount}
          onEquipmentChange={(equipment) => onSetupChange({ equipment })}
          onBeamEnergiesChange={(beamEnergies) => onSetupChange({ beamEnergies })}
          onRadiographyPlanChange={(radiographyPlan) => onSetupChange({ radiographyPlan })}
          onMotorCountChange={onMotorCountChange}
          onDraftMotorIdChange={onDraftMotorIdChange}
          onLoadNDTForm={onLoadNDTForm}
          onAddMotors={onAddMotors}
          canLoad={canLoad}
          canAdd={canAdd}
          theme={flowBarTheme}
        />
      </Box>

      {formData.formLoaded && safePlanRows.length > 0 ? (
        <Box
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(BRAND.primary, 0.14)}`,
            background: "#fff",
            overflow: "hidden",
            mb: 1.5,
          }}
        >
          <Stack direction="row" alignItems="center" gap={0.75} sx={{ px: 1, py: 0.75, borderBottom: `1px solid ${alpha(BRAND.primary, 0.1)}` }}>
            <DescriptionRoundedIcon sx={{ fontSize: 15, color: BRAND.primaryLight }} />
            <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.text }}>
              Radiography plan details
            </Typography>
          </Stack>
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 640 }}>
              <TableHead>
                <TableRow>
                  {["Sr.", "Sections", "Orientations", "SFD", "Normal", "Tangential", "Detector"].map((label) => (
                    <TableCell
                      key={label}
                      sx={{
                        background: "linear-gradient(135deg,#1B4F72,#2E86C1)",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.6rem",
                        padding: "5px 8px",
                        borderBottom: "none",
                      }}
                    >
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {safePlanRows.map((row, index) => (
                  <TableRow key={row.srNo} sx={{ background: index % 2 === 0 ? "#fff" : "rgba(244,246,248,0.55)" }}>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.srNo}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.sections}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.orientations}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.sfd}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.normalExposures}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.tangentialExposures}</TableCell>
                    <TableCell sx={{ fontSize: "0.72rem", py: 0.5, px: 1 }}>{row.detectorType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : null}

      {formData.formLoaded && activeMotorEntry && activeMotorSession ? (
        <NDTMotorNavigation
          tabs={navTabs}
          activeIndex={activeMotorIndex}
          onActiveIndexChange={setActiveMotorIndex}
        >
          <Box
            sx={{
              borderRadius: 2,
              border: `1px solid ${BRAND.border}`,
              background: "#fff",
              px: 1,
              py: 0.75,
            }}
          >
            <Typography sx={{ fontSize: "0.76rem", fontWeight: 700, color: BRAND.primary, mb: 0.75 }}>
              Motor {activeMotorEntry.motorId}
            </Typography>
            <NDTMotorTables
              motor={activeMotorSession}
              onChange={(patch) => onMotorSessionChange(activeMotorEntry.motorId, patch)}
            />
          </Box>
        </NDTMotorNavigation>
      ) : null}
    </Box>
  );
};

export default NDTForm;
