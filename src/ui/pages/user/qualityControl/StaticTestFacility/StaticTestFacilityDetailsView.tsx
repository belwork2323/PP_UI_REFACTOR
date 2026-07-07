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

const { rocketLaunch: RocketLaunchRoundedIcon } = icons.user.qualityControl.staticTestFacility.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  qc: "#1565C0",
  qcLight: "#1976D2",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const sectionName = (id: string) =>
  id
    .replace(/_/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const fieldLabel = (key: string) =>
  key.replace(/_/g, " ");

const DynamicTable = ({ rows }: { rows: Record<string, any>[] }) => {
  if (!rows?.length) return null;
  const cols = Object.keys(rows[0]).filter((k) => !k.startsWith("_"));
  return (
    <TableContainer sx={{ mt: 1, mb: 1.5, border: `1px solid ${alpha(BRAND.qc, 0.2)}`, borderRadius: 1.5, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background: alpha(BRAND.qc, 0.08) }}>
            {cols.map((col) => (
              <TableCell
                key={col}
                sx={{ fontWeight: 700, fontSize: "0.62rem", color: BRAND.qc, px: 1.5, py: 0.8, whiteSpace: "nowrap" }}
              >
                {fieldLabel(col)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ri) => (
            <TableRow key={ri} sx={{ background: ri % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.5) }}>
              {cols.map((col) => (
                <TableCell key={col} sx={{ fontSize: "0.72rem", px: 1.5, py: 0.8 }}>
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

const SectionRenderer = ({ section }: { section: { sectionId: string; sectionData: Record<string, any>[] } }) => {
  const entries = section.sectionData ?? [];

  if (!entries.length) return null;

  const value = entries[0];
  const allKeys = Object.keys(value).filter((k) => !k.startsWith("_"));
  const simpleKeys = allKeys.filter((k) => !Array.isArray(value[k]) && (typeof value[k] !== "object" || value[k] === null));
  const tableKeys = allKeys.filter((k) => Array.isArray(value[k]));

  return (
    <Box sx={{ mb: 2.5 }}>
      <Box
        sx={{
          px: 1.5, py: 1, mb: 1,
          background: alpha(BRAND.qc, 0.06),
          borderRadius: 1,
          borderLeft: `3px solid ${BRAND.qc}`,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "0.78rem", color: BRAND.qc }}>
          {sectionName(section.sectionId)}
        </Typography>
      </Box>

      {simpleKeys.length > 0 && (
        <TableContainer sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 1, mb: 1 }}>
          <Table size="small">
            <TableBody>
              {simpleKeys.map((key) => (
                <TableRow key={key}>
                  <TableCell sx={{ fontWeight: 600, fontSize: "0.7rem", color: BRAND.textSub, px: 1.5, py: 0.6, width: 220, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                    {fieldLabel(key)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", fontWeight: 600, color: BRAND.text, px: 1.5, py: 0.6, borderBottom: `1px solid ${alpha(BRAND.border, 0.5)}` }}>
                    {String(value[key] ?? "—")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {tableKeys.map((key) => {
        const data = value[key];
        if (!Array.isArray(data) || !data.length) return null;
        return (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography sx={{ fontWeight: 600, fontSize: "0.68rem", color: BRAND.textSub, mb: 0.5 }}>
              {fieldLabel(key)}
            </Typography>
            <DynamicTable rows={data} />
          </Box>
        );
      })}
    </Box>
  );
};

type STFDetailsViewProps = {
  row: any;
  data: any;
  loading: boolean;
  onBack: () => void;
};

const StaticTestFacilityDetailsView = ({ row, data, loading, onBack }: STFDetailsViewProps) => {
  const sections = data?.sections ?? [];

  return (
    <Box sx={{ py: 3, px: 2 }}>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={onBack}
        sx={{ mb: 2, color: BRAND.qc, fontWeight: 600, fontSize: "0.82rem" }}
      >
        Back to List
      </Button>

      <Card elevation={0} sx={{ border: `1px solid ${BRAND.border}`, borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${BRAND.border}`, background: BRAND.surface }}>
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: `linear-gradient(135deg,${BRAND.qc},${BRAND.qcLight})`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <RocketLaunchRoundedIcon sx={{ color: "#fff", fontSize: 18 }} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
                {row.batchId}
              </Typography>
              <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub }}>
                {row.motorId}
              </Typography>
            </Box>
            <Box sx={{ ml: "auto" }}>
              <Chip label={row.stfStatus} size="small" sx={{ height: 24, fontWeight: 700, fontSize: "0.68rem" }} />
            </Box>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          {loading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : sections.length > 0 ? (
            sections.map((section: any) => (
              <SectionRenderer key={section.sectionId} section={section} />
            ))
          ) : (
            <Typography sx={{ fontSize: "0.82rem", color: BRAND.textSub }}>
              No saved STF form details available for preview.
            </Typography>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default StaticTestFacilityDetailsView;
