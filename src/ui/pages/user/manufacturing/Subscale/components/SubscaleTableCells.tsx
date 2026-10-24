import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Box, TableCell, TableRow } from "@mui/material";
import FormInput, { type FormInputProps } from "../../../../../components/common/FormInput";
import FieldErrorText from "../../../../../components/validation/FieldErrorText";
import { useDebouncedCallback } from "../../../../../../hooks/useDebouncedCallback";
import { uniformTableBodyCellSx } from "../../../../../../app/theme/custom_themes/shared/data_table_theme";
import type { ProcessParticularRow } from "../../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import { getSubscaleFieldFormatError } from "../../../../../../data/validation/configs/subscale.validation.config";
import { registerSubscalePendingDraft } from "../utils/subscalePendingDrafts";

export type SubscaleCellChangeHandler = (
  tableId: string,
  rowIndex: number,
  fieldId: string,
  value: string,
) => void;

export type SubscaleProcessFieldChangeHandler = (
  cycleIndex: number,
  sectionKey: "premixParticulars" | "finalMixParticulars",
  rowIndex: number,
  field: keyof ProcessParticularRow,
  raw: string,
) => void;

export type SubscaleFieldErrorGetter = (
  cycleIndex: number,
  sectionKey: "premixParticulars" | "finalMixParticulars",
  rowIndex: number,
  field: keyof ProcessParticularRow,
) => string | undefined;

/** Parent form commit delay — keep short; live format errors use local draft (no wait). */
const DEFERRED_COMMIT_MS = 200;

/**
 * Deferred table text cell — local draft for instant typing; parent commits debounced + on blur.
 */
type SubscaleTableTextCellProps = Omit<FormInputProps, "value" | "onChange" | "defaultValue"> & {
  tableId: string;
  rowIndex: number;
  fieldId: string;
  value: string;
  onCellChange: SubscaleCellChangeHandler;
  errorMessage?: string;
};

/**
 * Deferred table text cell — local draft for instant typing; parent commits debounced + on blur.
 * Live FORMAT errors render via FieldErrorText (same pattern as Trimming / Mixing).
 * `type="number"` is coerced to text + inputMode=decimal so invalid chars can be typed and flagged.
 */
export const SubscaleTableTextCell = memo(function SubscaleTableTextCell({
  tableId,
  rowIndex,
  fieldId,
  value,
  onCellChange,
  disabled,
  errorMessage,
  type,
  inputMode,
  ...rest
}: SubscaleTableTextCellProps) {
  const [draft, setDraft] = useState(value ?? "");
  const draftRef = useRef(draft);
  const committedRef = useRef(value ?? "");
  const inputRef = useRef<HTMLInputElement | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    const next = value ?? "";
    setDraft(next);
    committedRef.current = next;
  }, [value]);

  const commit = useCallback(
    (nextValue: string) => {
      if (disabled) return;
      if (nextValue === committedRef.current) return;
      committedRef.current = nextValue;
      onCellChange(tableId, rowIndex, fieldId, nextValue);
    },
    [disabled, onCellChange, tableId, rowIndex, fieldId],
  );

  const debouncedCommit = useDebouncedCallback(
    (nextValue: string) => commit(nextValue),
    DEFERRED_COMMIT_MS,
  );

  useEffect(() => {
    const flush = () => {
      debouncedCommit.cancel();
      commit(draftRef.current);
    };
    return registerSubscalePendingDraft(flush);
  }, [commit, debouncedCommit]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setDraft(nextValue);
      debouncedCommit(nextValue);
    },
    [debouncedCommit],
  );

  const handleBlur = useCallback(() => {
    debouncedCommit.cancel();
    commit(draftRef.current);
  }, [commit, debouncedCommit]);

  const liveFormatError = getSubscaleFieldFormatError(fieldId, draft);
  const displayError = liveFormatError || errorMessage;
  const hasError = Boolean(displayError);
  const fieldPath = `${tableId}.${rowIndex}.${fieldId}`;

  // Match Trimming: prefer text + inputMode=decimal over native type=number.
  const isNumeric = type === "number";
  const resolvedType = isNumeric ? undefined : type;
  const resolvedInputMode = isNumeric ? inputMode ?? "decimal" : inputMode;

  return (
    <Box data-ss-field={fieldPath} sx={{ minWidth: 0 }}>
      <FormInput
        {...rest}
        inputRef={inputRef}
        value={draft}
        disabled={disabled}
        type={resolvedType}
        inputMode={resolvedInputMode}
        onChange={handleChange}
        onBlur={handleBlur}
        error={hasError}
        helperText=""
      />
      <FieldErrorText message={displayError} />
    </Box>
  );
});

const PROCESS_PARTICULAR_FIELDS = [
  ["rpm", "RPM"],
  ["time", "Time"],
  ["temp", "Temp"],
  ["vacuum", "Vacuum"],
] as const;

type SubscaleProcessParticularRowProps = {
  row: ProcessParticularRow;
  rowIndex: number;
  cycleIndex: number;
  sectionKey: "premixParticulars" | "finalMixParticulars";
  onFieldChange: SubscaleProcessFieldChangeHandler;
  border: string;
  text: string;
  getFieldError?: SubscaleFieldErrorGetter;
  clearFieldError?: (path: string) => void;
};

/** Memoized process particulars row — only re-renders when its row data changes. */
export const SubscaleProcessParticularRow = memo(function SubscaleProcessParticularRow({
  row,
  rowIndex,
  cycleIndex,
  sectionKey,
  onFieldChange,
  border,
  text,
  getFieldError,
  clearFieldError,
}: SubscaleProcessParticularRowProps) {
  return (
    <TableRow key={`${sectionKey}-${row.operationId}-${rowIndex}`}>
      <TableCell
        sx={{
          ...uniformTableBodyCellSx({ border, text }),
          fontSize: "0.78rem",
          fontWeight: 600,
        }}
      >
        {row.operation}
      </TableCell>
      {PROCESS_PARTICULAR_FIELDS.map(([field, placeholder]) => (
        <ProcessParticularFieldCell
          key={field}
          field={field}
          placeholder={placeholder}
          value={String(row[field] ?? "")}
          cycleIndex={cycleIndex}
          sectionKey={sectionKey}
          rowIndex={rowIndex}
          onFieldChange={onFieldChange}
          border={border}
          text={text}
          errorMessage={
            getFieldError ? getFieldError(cycleIndex, sectionKey, rowIndex, field) : undefined
          }
          clearFieldError={clearFieldError}
        />
      ))}
    </TableRow>
  );
});

type ProcessParticularFieldCellProps = {
  field: (typeof PROCESS_PARTICULAR_FIELDS)[number][0];
  placeholder: string;
  value: string;
  cycleIndex: number;
  sectionKey: "premixParticulars" | "finalMixParticulars";
  rowIndex: number;
  onFieldChange: SubscaleProcessFieldChangeHandler;
  border: string;
  text: string;
  errorMessage?: string | undefined;
  clearFieldError?: (path: string) => void;
};

const ProcessParticularFieldCell = memo(function ProcessParticularFieldCell({
  field,
  placeholder,
  value,
  cycleIndex,
  sectionKey,
  rowIndex,
  onFieldChange,
  border,
  text,
  errorMessage,
}: ProcessParticularFieldCellProps) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  const committedRef = useRef(value);
  const inputRef = useRef<HTMLInputElement | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setDraft(value);
    committedRef.current = value;
  }, [value]);

  const commit = useCallback(
    (nextValue: string) => {
      if (nextValue === committedRef.current) return;
      committedRef.current = nextValue;
      onFieldChange(cycleIndex, sectionKey, rowIndex, field, nextValue);
    },
    [cycleIndex, sectionKey, rowIndex, field, onFieldChange],
  );

  const debouncedCommit = useDebouncedCallback(
    (nextValue: string) => commit(nextValue),
    DEFERRED_COMMIT_MS,
  );

  useEffect(() => {
    const flush = () => {
      debouncedCommit.cancel();
      commit(draftRef.current);
    };
    return registerSubscalePendingDraft(flush);
  }, [commit, debouncedCommit]);

  const fieldName = `SUBSCALE_MIXING_CYCLES.${cycleIndex}.${sectionKey}.${rowIndex}.${field}`;

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value;
      setDraft(nextValue);
      debouncedCommit(nextValue);
    },
    [debouncedCommit],
  );

  const handleBlur = useCallback(() => {
    debouncedCommit.cancel();
    commit(draftRef.current);
  }, [commit, debouncedCommit]);

  const liveFormatError = getSubscaleFieldFormatError(field, draft);
  const displayError = liveFormatError || errorMessage;

  return (
    <TableCell sx={uniformTableBodyCellSx({ border, text })}>
      <Box data-ss-field={fieldName} sx={{ minWidth: 0 }}>
        <FormInput
          inputRef={inputRef}
          value={draft}
          placeholder={placeholder}
          inputMode="decimal"
          onChange={handleChange}
          onBlur={handleBlur}
          error={Boolean(displayError)}
          helperText=""
        />
        <FieldErrorText message={displayError} />
      </Box>
    </TableCell>
  );
});
