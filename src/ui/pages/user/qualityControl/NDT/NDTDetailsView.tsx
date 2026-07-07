import React from "react";
import {
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import { icons } from "../../../../../app/theme/icons";

const { radar: RadarRoundedIcon } = icons.approver.qualityControl.ndt;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const TH = {
  fontWeight: 700,
  fontSize: "0.62rem",
  color: BRAND.primary,
  px: 1.5,
  py: 0.8,
  whiteSpace: "nowrap" as const,
  borderBottom: `1px solid ${alpha(BRAND.primary, 0.15)}`,
};

const TD = {
  fontSize: "0.72rem",
  px: 1.5,
  py: 0.8,
  borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}`,
};

const DynamicTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <TableContainer sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.primary, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.primary, 0.08) }}>
            {cols.map((col) => (
              <TableCell key={col} sx={TH}>
                {col.replace(/_/g, " ")}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha("#F4F6F8", 0.5) }}>
              {cols.map((col) => (
                <TableCell key={col} sx={TD}>
                  {String(row[col] ?? "—")}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const MotorSessionCard = ({ motor }: { motor: any }) => {
  const hasExposure = motor.additionalExposureRows?.length > 0 && motor.additionalExposureRows.some((r: any) => r.sectionNumber || r.orientation || r.exposureCount);
  const hasObservation = motor.radiographyObservationRows?.length > 0 && motor.radiographyObservationRows.some((r: any) => r.section || r.orientation || r.observations);
  const hasVisual = motor.visualInspectionRows?.length > 0 && motor.visualInspectionRows.some((r: any) => r.section || r.orientation);
  const hasMedia = motor.visualInspectionMedia?.length > 0;
  const hasReport = motor.signedReport;
  const hasRemarks = motor.additionalRemarks?.trim();

  return (
    <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2, overflow: "hidden", mb: 2 }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BRAND.border}`, background: alpha(BRAND.primary, 0.04) }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: BRAND.primary }}>
          Motor: {motor.motorId}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {hasExposure && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Additional Exposure Details
            </Typography>
            <DynamicTable rows={motor.additionalExposureRows} />
          </Box>
        )}

        {hasObservation && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Radiography Observations
            </Typography>
            <TableContainer sx={{ border: `1px solid ${alpha(BRAND.primary, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: alpha(BRAND.primary, 0.08) }}>
                    <TableCell sx={TH}>Section</TableCell>
                    <TableCell sx={TH}>Orientation</TableCell>
                    <TableCell sx={TH}>Observations</TableCell>
                    <TableCell sx={TH}>Files</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {motor.radiographyObservationRows.map((row: any, ri: number) => (
                    <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha("#F4F6F8", 0.5) }}>
                      <TableCell sx={TD}>{row.section || "—"}</TableCell>
                      <TableCell sx={TD}>{row.orientation || "—"}</TableCell>
                      <TableCell sx={TD}>{row.observations || "—"}</TableCell>
                      <TableCell sx={TD}>
                        {row.files?.length > 0
                          ? row.files.map((f: any, fi: number) => (
                              <Typography key={fi} sx={{ fontSize: "0.65rem", color: BRAND.primaryLight }}>
                                {typeof f === "string" ? f : f.name}
                              </Typography>
                            ))
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {hasVisual && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Visual Inspection
            </Typography>
            <TableContainer sx={{ border: `1px solid ${alpha(BRAND.primary, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: alpha(BRAND.primary, 0.08) }}>
                    <TableCell sx={TH}>Observation</TableCell>
                    <TableCell sx={TH}>Section</TableCell>
                    <TableCell sx={TH}>Orientation</TableCell>
                    <TableCell sx={TH}>Files</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {motor.visualInspectionRows.map((row: any, ri: number) => {
                    if (!row.section && !row.orientation && !row.isPreset && !row.files?.length) return null;
                    return (
                      <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha("#F4F6F8", 0.5) }}>
                        <TableCell sx={TD}>{row.observation || "—"}</TableCell>
                        <TableCell sx={TD}>{row.section || "—"}</TableCell>
                        <TableCell sx={TD}>{row.orientation || "—"}</TableCell>
                        <TableCell sx={TD}>
                          {row.files?.length > 0
                            ? row.files.map((f: any, fi: number) => (
                                <Typography key={fi} sx={{ fontSize: "0.65rem", color: BRAND.primaryLight }}>
                                  {typeof f === "string" ? f : f.name}
                                </Typography>
                              ))
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {hasMedia && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Visual Inspection Media
            </Typography>
            <Stack gap={0.5}>
              {motor.visualInspectionMedia.map((f: any, fi: number) => (
                <Typography key={fi} sx={{ fontSize: "0.72rem", color: BRAND.primaryLight }}>
                  {typeof f === "string" ? f : f.name}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {hasReport && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Signed NDT Report
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.primaryLight }}>
              {typeof motor.signedReport === "string" ? motor.signedReport : motor.signedReport?.name || "Attached"}
            </Typography>
          </Box>
        )}

        {hasRemarks && (
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, mb: 0.5 }}>
              Additional Remarks
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.text }}>
              {motor.additionalRemarks}
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
};

type NDTDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const SetupSummaryCard = ({ formState }: { formState: any }) => {
  const equipment = formState?.equipment;
  const beamEnergies = formState?.beamEnergies;
  const radiographyPlan = formState?.radiographyPlan;
  const planRows = formState?.radiographyPlanRows;

  if (!equipment && !beamEnergies?.length && !radiographyPlan) return null;

  return (
    <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2, overflow: "hidden", mb: 2 }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${BRAND.border}`, background: alpha(BRAND.primary, 0.04) }}>
        <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: BRAND.primary }}>
          Radiography Setup
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: planRows?.length ? 2 : 0 }}>
          <Table size="small">
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.6, width: 220, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                  Equipment
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.6, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                  {equipment || "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.6, width: 220, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                  Beam Energies
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.6, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                  {beamEnergies?.length ? beamEnergies.join(", ") : "—"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.6, width: 220 }}>
                  Radiography Plan
                </TableCell>
                <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.6 }}>
                  {radiographyPlan || "—"}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {planRows?.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: "0.68rem", color: BRAND.textSub, mb: 0.5 }}>
              Plan Details
            </Typography>
            <DynamicTable rows={planRows} />
          </Box>
        )}
      </Box>
    </Card>
  );
};

const NDTDetailsView = ({ row, data, loading, onBack }: NDTDetailsViewProps) => {
  const formState = data?.data;
  const motors = formState?.motors ?? data?.motors ?? [];

  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ mb: 2, color: BRAND.primary, fontWeight: 600, fontSize: "0.82rem" }}
      >
        Back to List
      </Button>

      <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: alpha(BRAND.primary, 0.04) }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: `linear-gradient(135deg,${BRAND.primary},${BRAND.primaryLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <RadarRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                {row.batchId}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                {formState?.equipment || ""}{formState?.equipment && formState?.radiographyPlan ? " — " : ""}{formState?.radiographyPlan || ""}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Chip label={row.ndtStatus || data?.formStatus || formState?.formStatus} size="small" sx={{ height: 24, fontWeight: 700, fontSize: "0.68rem" }} />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <>
              <SetupSummaryCard formState={formState} />
              {motors.length > 0 ? (
                motors.map((motor: any, index: number) => (
                  <MotorSessionCard key={motor.motorId || index} motor={motor} />
                ))
              ) : (
                <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
                  No NDT form data available for preview.
                </Typography>
              )}
            </>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default NDTDetailsView;
