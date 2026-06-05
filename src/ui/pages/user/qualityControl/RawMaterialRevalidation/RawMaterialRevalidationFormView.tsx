import React, { useEffect, useRef, useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { keyframes, styled } from "@mui/material/styles";
import { icons } from "../../../../../app/theme/icons";
import { STRINGS } from "../../../../../app/config/strings";
import ConfirmAlertDialog from "../../../../components/common/ConfirmAlertDialog";
import {
  ALL_RAW_MATERIAL_INGREDIENTS,
  createRawMaterialRevalidationBlock,
} from "../../../../../data/models/user/QCRawMaterialRevalidationModel";

const {
  add: AddRoundedIcon,
  delete: DeleteOutlineRoundedIcon,
  science: ScienceRoundedIcon,
  info: InfoOutlinedIcon,
  save: SaveOutlinedIcon,
  send: SendRoundedIcon,
  warning: WarningAmberRoundedIcon,
  checkCircleOutline: CheckCircleOutlineRoundedIcon,
  verified: VerifiedRoundedIcon,
} = icons.user.qualityControl.rawMaterialRevalidation.form;

const BRAND = {
  primary: "#1B4F72",
  primaryLight: "#2E86C1",
  accent: "#148F77",
  warn: "#D4AC0D",
  danger: "#C0392B",
  surface: "#F4F6F8",
  border: "#D5D8DC",
  text: "#1C2833",
  textSub: "#5D6D7E",
};

const slideIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const FieldLabel = styled(Typography)({
  fontSize: "0.7rem",
  fontWeight: 700,
  letterSpacing: "0.07em",
  textTransform: "uppercase",
  color: BRAND.textSub,
  marginBottom: 5,
});

const styledTF = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 7,
    background: BRAND.surface,
    fontSize: "0.83rem",
    transition: "all 0.2s",
    "& fieldset": { borderColor: BRAND.border },
    "&:hover fieldset": { borderColor: BRAND.primaryLight },
    "&.Mui-focused fieldset": { borderColor: BRAND.primaryLight, borderWidth: 2 },
    "&.Mui-focused": { background: "#fff", boxShadow: `0 0 0 3px ${alpha(BRAND.primaryLight, 0.1)}` },
  },
  "& .MuiInputBase-input": { fontWeight: 500, color: BRAND.text },
};

const TH = styled(TableCell)({
  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
  color: "#fff",
  fontWeight: 700,
  fontSize: "0.7rem",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "10px 14px",
  whiteSpace: "nowrap",
  borderBottom: "none",
});

const TD = styled(TableCell)({
  padding: "8px 14px",
  fontSize: "0.82rem",
  borderBottom: `1px solid ${alpha(BRAND.border, 0.6)}`,
  color: BRAND.text,
});

const BlockCard = styled(Box)({
  borderRadius: 14,
  border: `1px solid ${BRAND.border}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: `0 2px 14px ${alpha(BRAND.primary, 0.07)}`,
  animation: `${slideIn} 0.3s ease both`,
});

const BlockHeader = styled(Box)({
  padding: "12px 18px",
  background: `linear-gradient(135deg, ${alpha(BRAND.primary, 0.06)}, ${alpha(BRAND.primaryLight, 0.04)})`,
  borderBottom: `1px solid ${BRAND.border}`,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
});

function hasMinimumData(blocks) {
  if (blocks.length === 0) return false;
  return blocks.every((block) => block.rows.some((row) => row.result.trim() !== ""));
}

const IngredientBlock = ({ block, index, onUpdate, onRemove, strings }) => {
  const filledCount = block.rows.filter((row) => row.result.trim() !== "").length;
  const totalCount = block.rows.length;
  const allFilled = filledCount === totalCount;

  const handleCellChange = (rowIdx, field, value) => {
    const updatedRows = block.rows.map((row, idx) =>
      idx !== rowIdx ? row : { ...row, [field]: value },
    );
    onUpdate(index, { ...block, rows: updatedRows });
  };

  return (
    <BlockCard sx={{ animationDelay: `${index * 0.06}s` }}>
      <BlockHeader>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: "8px",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 3px 8px ${alpha(BRAND.primary, 0.3)}`,
            }}
          >
            <ScienceRoundedIcon sx={{ color: "#fff", fontSize: 16 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.9rem", color: BRAND.text }}>
              {block.ingredient}
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: BRAND.textSub }}>
              {block.rows.length} {strings.PARAMETER_LABEL.toLowerCase()}
              {block.rows.length !== 1 ? "s" : ""} · {strings.BLOCK_LABEL} #{index + 1}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" gap={1} alignItems="center">
          <Chip
            icon={
              allFilled ? (
                <CheckCircleOutlineRoundedIcon
                  sx={{ fontSize: "13px !important", color: `${BRAND.accent} !important` }}
                />
              ) : undefined
            }
            label={`${filledCount}/${totalCount} filled`}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.65rem",
              fontWeight: 700,
              background: allFilled ? alpha(BRAND.accent, 0.1) : alpha(BRAND.warn, 0.1),
              color: allFilled ? BRAND.accent : "#7D6608",
              border: `1px solid ${allFilled ? alpha(BRAND.accent, 0.25) : alpha(BRAND.warn, 0.3)}`,
            }}
          />
          <Tooltip title={strings.REMOVE_BLOCK_TOOLTIP}>
            <IconButton
              size="small"
              onClick={() => onRemove(index)}
              sx={{ color: BRAND.danger, "&:hover": { background: alpha(BRAND.danger, 0.08) } }}
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </BlockHeader>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TH sx={{ minWidth: 80 }}>Ingredient</TH>
              <TH sx={{ minWidth: 150 }}>Lot / Batch No.</TH>
              <TH sx={{ minWidth: 200 }}>{strings.PARAMETER_LABEL}</TH>
              <TH sx={{ minWidth: 150 }}>Result</TH>
              <TH sx={{ minWidth: 150 }}>Validity</TH>
            </TableRow>
          </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              <TableRow
                key={`${row.specificationCode}-${rowIndex}`}
                sx={{
                  "&:hover": { background: alpha(BRAND.primaryLight, 0.03) },
                  "&:last-child td": { borderBottom: "none" },
                  background: rowIndex % 2 === 0 ? "#fff" : alpha(BRAND.surface, 0.6),
                }}
              >
                <TD>
                  {rowIndex === 0 && (
                    <Chip
                      label={block.ingredient}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.72rem",
                        background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
                        color: "#fff",
                        height: 22,
                      }}
                    />
                  )}
                </TD>

                <TD>
                  {rowIndex === 0 && (
                    <TextField
                      size="small"
                      value={block.lotNo}
                      onChange={(event) => onUpdate(index, { ...block, lotNo: event.target.value })}
                      placeholder={strings.LOT_PLACEHOLDER}
                      sx={{ ...styledTF, minWidth: 130 }}
                      inputProps={{ style: { fontSize: "0.78rem", padding: "5px 10px" } }}
                    />
                  )}
                </TD>

                <TD>
                  <Typography sx={{ fontSize: "0.8rem", color: BRAND.text, fontWeight: 500 }}>
                    {row.parameter}
                  </Typography>
                </TD>

                <TD>
                  <TextField
                    size="small"
                    value={row.result}
                    onChange={(event) => handleCellChange(rowIndex, "result", event.target.value)}
                    placeholder={strings.RESULT_PLACEHOLDER}
                    sx={{ ...styledTF, width: 130 }}
                    inputProps={{ style: { fontSize: "0.78rem", padding: "5px 10px" } }}
                  />
                </TD>

                <TD>
                  <TextField
                    size="small"
                    value={row.validity}
                    onChange={(event) => handleCellChange(rowIndex, "validity", event.target.value)}
                    placeholder={strings.VALIDITY_PLACEHOLDER}
                    sx={{ ...styledTF, width: 140 }}
                    inputProps={{ style: { fontSize: "0.78rem", padding: "5px 10px" } }}
                  />
                </TD>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </BlockCard>
  );
};

const RawMaterialRevalidationFormView = ({
  initialBlocks = [],
  isEditMode = false,
  onBlocksChange,
  onSaveDraft,
  onSubmit,
  actionLoading = false,
}) => {
  const strings = STRINGS.QUALITY_CONTROL.RAW_MATERIAL_REVALIDATION;
  const [blocks, setBlocks] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [submitConfirm, setSubmitConfirm] = useState(false);
  const [draftConfirm, setDraftConfirm] = useState(false);
  const onBlocksChangeRef = useRef(onBlocksChange);

  useEffect(() => {
    onBlocksChangeRef.current = onBlocksChange;
  }, [onBlocksChange]);

  useEffect(() => {
    setBlocks(initialBlocks?.length > 0 ? initialBlocks : []);
  }, [initialBlocks]);

  const totalRows = blocks.flatMap((block) => block.rows).length;
  const filledRows = blocks.flatMap((block) => block.rows).filter((row) => row.result.trim() !== "").length;
  const canSubmit = hasMinimumData(blocks);

  const handleAdd = () => {
    if (!selectedIngredient) return;

    setBlocks((prev) => {
      const next = [...prev, createRawMaterialRevalidationBlock(selectedIngredient)];
      onBlocksChangeRef.current?.(next);
      return next;
    });
    setSelectedIngredient("");
  };

  const handleUpdateBlock = (index, updated) => {
    setBlocks((prev) => {
      const next = prev.map((block, idx) => (idx === index ? updated : block));
      onBlocksChangeRef.current?.(next);
      return next;
    });
  };

  const handleRemoveBlock = (index) => {
    setBlocks((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      onBlocksChangeRef.current?.(next);
      return next;
    });
  };

  const handleConfirmDraft = async () => {
    setDraftConfirm(false);
    await onSaveDraft?.(blocks);
  };

  const handleConfirmSubmit = async () => {
    setSubmitConfirm(false);
    await onSubmit?.(blocks);
  };

  return (
    <Box sx={{ fontFamily: "'DM Sans', sans-serif" }}>
      {isEditMode && (
        <Box
          sx={{
            mb: 2.5,
            px: 2,
            py: 1.5,
            borderRadius: 2,
            background: alpha(BRAND.danger, 0.05),
            border: `1.5px solid ${alpha(BRAND.danger, 0.2)}`,
            display: "flex",
            alignItems: "center",
            gap: 1.2,
          }}
        >
          <WarningAmberRoundedIcon sx={{ fontSize: 18, color: BRAND.danger, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.8rem", color: BRAND.danger, fontWeight: 600, lineHeight: 1.5 }}>
            {strings.EDIT_MODE_BANNER}
          </Typography>
        </Box>
      )}

      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={2.5} flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 10px ${alpha(BRAND.primary, 0.3)}`,
            }}
          >
            <VerifiedRoundedIcon sx={{ color: "#fff", fontSize: 17 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: "0.95rem", color: BRAND.text }}>
              {strings.TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, mt: 0.2 }}>
              {strings.SUBTITLE}
            </Typography>
          </Box>
        </Stack>

        {blocks.length > 0 && (
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip
              label={`${blocks.length} ${blocks.length > 1 ? strings.BLOCK_SUFFIX_PLURAL : strings.BLOCK_SUFFIX}`}
              size="small"
              sx={{ fontWeight: 700, fontSize: "0.7rem", background: alpha(BRAND.primaryLight, 0.12), color: BRAND.primary }}
            />
            <Chip
              label={`${filledRows} / ${totalRows} ${strings.RESULTS_FILLED_SUFFIX}`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.7rem",
                background: filledRows === totalRows && totalRows > 0 ? alpha(BRAND.accent, 0.12) : alpha(BRAND.warn, 0.12),
                color: filledRows === totalRows && totalRows > 0 ? BRAND.accent : "#7D6608",
              }}
            />
          </Stack>
        )}
      </Stack>

      <Box
        sx={{
          p: "14px 18px",
          borderRadius: 3,
          mb: 2.5,
          background: `linear-gradient(135deg, ${alpha(BRAND.primary, 0.04)}, ${alpha(BRAND.primaryLight, 0.03)})`,
          border: `1.5px dashed ${alpha(BRAND.primaryLight, 0.35)}`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} gap={2} alignItems="flex-end">
          <Box flex={1}>
            <FieldLabel>{strings.SELECT_INGREDIENT_LABEL}</FieldLabel>
            <TextField
              fullWidth
              select
              size="small"
              value={selectedIngredient}
              onChange={(event) => setSelectedIngredient(event.target.value)}
              sx={styledTF}
              SelectProps={{ displayEmpty: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ScienceRoundedIcon sx={{ fontSize: 16, color: selectedIngredient ? BRAND.primaryLight : BRAND.border }} />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="" disabled>
                <Typography color="text.disabled" fontSize="0.85rem">
                  {strings.SELECT_INGREDIENT_PLACEHOLDER}
                </Typography>
              </MenuItem>
              {ALL_RAW_MATERIAL_INGREDIENTS.map((ingredient) => (
                <MenuItem key={ingredient} value={ingredient} sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {ingredient}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!selectedIngredient || actionLoading}
            startIcon={<AddRoundedIcon />}
            sx={{
              borderRadius: 2.5,
              fontWeight: 800,
              fontSize: "0.8rem",
              textTransform: "none",
              px: 3,
              py: "9px",
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryLight})`,
              boxShadow: `0 4px 14px ${alpha(BRAND.primary, 0.35)}`,
              whiteSpace: "nowrap",
              minWidth: 140,
              "&:hover": { boxShadow: `0 6px 18px ${alpha(BRAND.primary, 0.45)}`, transform: "translateY(-1px)" },
              "&:disabled": { background: BRAND.border, boxShadow: "none", color: "#fff" },
              transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            {strings.ADD_TO_FORM}
          </Button>
        </Stack>
      </Box>

      <Stack spacing={2.5}>
        {blocks.length === 0 && (
          <Box
            sx={{
              textAlign: "center",
              py: 5,
              borderRadius: 3,
              border: `1px dashed ${BRAND.border}`,
              background: alpha(BRAND.surface, 0.6),
            }}
          >
            <ScienceRoundedIcon sx={{ fontSize: 36, color: BRAND.border, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 600, color: BRAND.textSub, fontSize: "0.88rem" }}>
              {strings.NO_INGREDIENTS_TITLE}
            </Typography>
            <Typography sx={{ fontSize: "0.75rem", color: alpha(BRAND.textSub, 0.7), mt: 0.5 }}>
              {strings.NO_INGREDIENTS_SUBTITLE}
            </Typography>
          </Box>
        )}

        {blocks.map((block, index) => (
          <IngredientBlock
            key={`${block.ingredient}-${index}`}
            block={block}
            index={index}
            onUpdate={handleUpdateBlock}
            onRemove={handleRemoveBlock}
            strings={strings}
          />
        ))}
      </Stack>

      {blocks.length > 0 && (
        <Stack
          direction="row"
          alignItems="center"
          gap={1}
          mt={2.5}
          px={2}
          py={1.2}
          sx={{ borderRadius: 2, background: alpha(BRAND.primaryLight, 0.06), border: `1px dashed ${alpha(BRAND.primaryLight, 0.3)}` }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 15, color: BRAND.primaryLight, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.72rem", color: BRAND.textSub, lineHeight: 1.5 }}>
            {strings.INFO_NOTE}
          </Typography>
        </Stack>
      )}

      <Box
        sx={{
          mt: 3,
          p: "16px 20px",
          borderRadius: 3,
          background: "#fff",
          border: `1.5px solid ${BRAND.border}`,
          boxShadow: `0 -2px 16px ${alpha(BRAND.primary, 0.06)}`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: BRAND.text }}>
              {blocks.length === 0
                ? strings.EMPTY_STATE_ACTION
                : `${blocks.length} ingredient${blocks.length > 1 ? "s" : ""} · ${filledRows}/${totalRows} results entered`}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", color: BRAND.textSub, mt: 0.3 }}>
              {canSubmit ? strings.READY_TO_SUBMIT : strings.NOT_READY_TO_SUBMIT}
            </Typography>
          </Box>

          <Stack direction="row" gap={1.5} flexShrink={0}>
            <Tooltip title={blocks.length === 0 ? strings.EMPTY_FORM_ERROR : strings.DRAFT_CONFIRM_MESSAGE} arrow placement="top">
              <span>
                <Button
                  variant="outlined"
                  startIcon={<SaveOutlinedIcon />}
                  disabled={blocks.length === 0 || actionLoading}
                  onClick={() => setDraftConfirm(true)}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    borderColor: BRAND.primaryLight,
                    color: BRAND.primaryLight,
                    "&:hover": { background: alpha(BRAND.primaryLight, 0.06) },
                    "&:disabled": { borderColor: BRAND.border, color: BRAND.border },
                  }}
                >
                  {strings.SAVE_DRAFT_LABEL}
                </Button>
              </span>
            </Tooltip>

            <Tooltip title={!canSubmit ? strings.EMPTY_FORM_ERROR : ""} arrow placement="top">
              <span>
                <Button
                  variant="contained"
                  startIcon={<SendRoundedIcon />}
                  disabled={!canSubmit || actionLoading}
                  onClick={() => setSubmitConfirm(true)}
                  sx={{
                    borderRadius: 2.5,
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    px: 2.5,
                    py: 1,
                    background: `linear-gradient(135deg, ${BRAND.accent}, #1aaf8f)`,
                    boxShadow: `0 4px 14px ${alpha(BRAND.accent, 0.35)}`,
                    "&:hover": { boxShadow: `0 6px 18px ${alpha(BRAND.accent, 0.45)}`, transform: "translateY(-1px)" },
                    "&:disabled": { background: BRAND.border, boxShadow: "none", color: "#fff" },
                    transition: "all 0.2s",
                  }}
                >
                  {isEditMode ? strings.RESUBMIT_LABEL : strings.SUBMIT_LABEL}
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Stack>
      </Box>

      <ConfirmAlertDialog
        open={draftConfirm}
        severity="info"
        title={strings.DRAFT_CONFIRM_TITLE}
        message={strings.DRAFT_CONFIRM_MESSAGE}
        confirmLabel={strings.DRAFT_CONFIRM_LABEL}
        cancelLabel={strings.CONFIRM_CANCEL_LABEL}
        onConfirm={handleConfirmDraft}
        onCancel={() => setDraftConfirm(false)}
      />

      <ConfirmAlertDialog
        open={submitConfirm}
        severity="warning"
        title={isEditMode ? strings.RESUBMIT_CONFIRM_TITLE : strings.SUBMIT_CONFIRM_TITLE}
        message={isEditMode ? strings.RESUBMIT_CONFIRM_MESSAGE : strings.SUBMIT_CONFIRM_MESSAGE}
        confirmLabel={isEditMode ? strings.RESUBMIT_CONFIRM_LABEL : strings.SUBMIT_CONFIRM_LABEL}
        cancelLabel={strings.CONFIRM_GO_BACK_LABEL}
        onConfirm={handleConfirmSubmit}
        onCancel={() => setSubmitConfirm(false)}
      />
    </Box>
  );
};

export default RawMaterialRevalidationFormView;
