import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import { STRINGS } from "../../../../../app/config/strings";
import FormInput from "../../../../components/common/FormInput";
import { schemaFieldSx } from "../../../../components/common/fieldStyles";
import {
  createEmptyWeightmentDetail,
  type RawMaterialPrepWeightmentDetail,
  type RawMaterialPrepWeightmentSheet,
} from "../../../../../data/models/user/RawMaterialPreparationModel";

const RM = STRINGS.MANUFACTURING.RAW_MATERIAL_PREP;
const CONTAINER_TYPES = ["Drum", "Bin", "Bag", "Other"];

const checkboxLabelSx = {
  m: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: "0.78rem",
    lineHeight: 1.35,
  },
};

const tableFieldSx = {
  ...schemaFieldSx,
  mb: 0,
  minWidth: 0,
};

type RawMaterialWeightmentSheetPanelProps = {
  value: RawMaterialPrepWeightmentSheet;
  onChange: (next: RawMaterialPrepWeightmentSheet) => void;
  theme: any;
};

const RawMaterialWeightmentSheetPanel = ({
  value,
  onChange,
  theme,
}: RawMaterialWeightmentSheetPanelProps) => {
  const updateSheet = (patch: Partial<RawMaterialPrepWeightmentSheet>) => {
    onChange({ ...value, ...patch });
  };

  const updateRow = (index: number, patch: Partial<RawMaterialPrepWeightmentDetail>) => {
    const nextRows = value.weightmentDetails.map((row, rowIndex) =>
      rowIndex === index ? { ...row, ...patch } : row
    );
    updateSheet({ weightmentDetails: nextRows });
  };

  const addRow = () => {
    updateSheet({
      weightmentDetails: [...value.weightmentDetails, createEmptyWeightmentDetail()],
    });
  };

  const removeRow = (index: number) => {
    updateSheet({
      weightmentDetails: value.weightmentDetails.filter((_, rowIndex) => rowIndex !== index),
    });
  };

  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.border}`,
        background: theme.palette.surface,
        px: 1.5,
        py: 1.25,
        mt: 2,
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: theme.palette.text, mb: 0.25 }}>
        {RM.WEIGHTMENT_SHEET_TITLE}
      </Typography>
      <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mb: 1.5 }}>
        {RM.WEIGHTMENT_SHEET_SUBTITLE}
      </Typography>

      <FormInput
        fullWidth
        label={RM.WEIGHTMENT_MIXER_BUILDING}
        value={value.mixerBuildingNumber}
        onChange={(event) => updateSheet({ mixerBuildingNumber: event.target.value })}
        sx={{ mb: 1.5, maxWidth: 360 }}
      />

      {value.weightmentDetails.length === 0 ? (
        <Box
          sx={{
            border: `1px dashed ${theme.palette.border}`,
            borderRadius: 2,
            py: 3,
            px: 2,
            textAlign: "center",
            mb: 1.5,
          }}
        >
          <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: theme.palette.text }}>
            {RM.WEIGHTMENT_EMPTY_TITLE}
          </Typography>
          <Typography sx={{ fontSize: "0.72rem", color: theme.palette.textSub, mt: 0.5 }}>
            {RM.WEIGHTMENT_EMPTY_SUBTITLE}
          </Typography>
        </Box>
      ) : (
        <TableContainer
          sx={{
            borderRadius: 2,
            border: `1px solid ${theme.palette.border}`,
            mb: 1.5,
            overflowX: "auto",
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                {[
                  "Material Code",
                  "Material Name",
                  "Percentage",
                  "Weight Transferred (Kg)",
                  "Container Type",
                  "Container No.",
                  "Weigh Scale No.",
                  "Weighing Date & Time",
                  "",
                ].map((header) => (
                  <TableCell
                    key={header || "actions"}
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.68rem",
                      whiteSpace: "nowrap",
                      background: theme.palette.surface,
                    }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {value.weightmentDetails.map((row, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ minWidth: 120, py: 0.75 }}>
                    <FormInput
                      value={row.materialCode}
                      onChange={(event) => updateRow(index, { materialCode: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160, py: 0.75 }}>
                    <FormInput
                      value={row.materialName}
                      onChange={(event) => updateRow(index, { materialName: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 100, py: 0.75 }}>
                    <FormInput
                      type="number"
                      value={row.percentage}
                      onChange={(event) => updateRow(index, { percentage: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 130, py: 0.75 }}>
                    <FormInput
                      type="number"
                      value={row.weightTransferred}
                      onChange={(event) => updateRow(index, { weightTransferred: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 130, py: 0.75 }}>
                    <FormInput
                      select
                      value={row.containerType}
                      onChange={(event) => updateRow(index, { containerType: event.target.value })}
                      sx={tableFieldSx}
                    >
                      <MenuItem value="">—</MenuItem>
                      {CONTAINER_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </FormInput>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120, py: 0.75 }}>
                    <FormInput
                      value={row.containerNumber}
                      onChange={(event) => updateRow(index, { containerNumber: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 120, py: 0.75 }}>
                    <FormInput
                      value={row.weighScaleNumber}
                      onChange={(event) => updateRow(index, { weighScaleNumber: event.target.value })}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 190, py: 0.75 }}>
                    <FormInput
                      type="datetime-local"
                      value={row.weighingDateTime}
                      onChange={(event) => updateRow(index, { weighingDateTime: event.target.value })}
                      InputLabelProps={{ shrink: true }}
                      sx={tableFieldSx}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" onClick={() => removeRow(index)}>
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Button
        size="small"
        variant="outlined"
        startIcon={<AddRoundedIcon fontSize="small" />}
        onClick={addRow}
        sx={{ mb: 1.5, textTransform: "none", fontWeight: 700, fontSize: "0.78rem" }}
      >
        {RM.WEIGHTMENT_ADD_ROW}
      </Button>

      <Stack spacing={0.5}>
        <FormControlLabel
          sx={checkboxLabelSx}
          control={
            <Checkbox
              size="small"
              checked={value.validation.compareWithIdentificationSheet}
              onChange={(event) =>
                updateSheet({
                  validation: {
                    ...value.validation,
                    compareWithIdentificationSheet: event.target.checked,
                  },
                })
              }
            />
          }
          label={RM.WEIGHTMENT_COMPARE_LABEL}
        />
        <FormControlLabel
          sx={checkboxLabelSx}
          control={
            <Checkbox
              size="small"
              checked={value.validation.deviationFound}
              onChange={(event) =>
                updateSheet({
                  validation: {
                    ...value.validation,
                    deviationFound: event.target.checked,
                  },
                })
              }
            />
          }
          label={RM.WEIGHTMENT_DEVIATION_FOUND}
        />
        {value.validation.deviationFound ? (
          <FormInput
            fullWidth
            label={RM.WEIGHTMENT_DEVIATION_MESSAGE}
            value={value.validation.deviationMessage}
            onChange={(event) =>
              updateSheet({
                validation: {
                  ...value.validation,
                  deviationMessage: event.target.value,
                },
              })
            }
            sx={{ maxWidth: 480 }}
          />
        ) : null}
      </Stack>
    </Box>
  );
};

export default RawMaterialWeightmentSheetPanel;
