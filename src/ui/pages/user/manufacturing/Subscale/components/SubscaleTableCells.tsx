import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { TableCell, TableRow, Typography } from "@mui/material";
import FormInput, { type FormInputProps } from "../../../../../components/common/FormInput";
import { useDebouncedCallback } from "../../../../../../hooks/useDebouncedCallback";
import { uniformTableBodyCellSx } from "../../../../../../app/theme/custom_themes/shared/data_table_theme";
import type { ProcessParticularRow } from "../../../../../../hooks/user/manufacturing/subscaleBatchConfig";
import { registerSubscalePendingDraft } from "../utils/subscalePendingDrafts";
import { Control, Controller, useFormContext } from "react-hook-form";
import { SchemaFormValues } from "@/schema-engine";

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

const DEFERRED_COMMIT_MS = 120;

const PROCESS_PARTICULAR_FIELDS = [
  ["rpm", "RPM"],
  ["time", "Time"],
  ["temp", "Temp"],
  ["vacuum", "Vacuum"],
] as const;

/**
 * Deferred table text cell — local draft for instant typing; parent commits debounced + on blur.
 */
type SubscaleTableTextCellProps = Omit<FormInputProps, "value" | "onChange" | "defaultValue"> & {
  tableId: string;
  rowIndex: number;
  fieldId: string;
  value: string;
  onCellChange: SubscaleCellChangeHandler;
  errorMessage?: string; // Accepts the dynamic path error message directly
};

/**
 * Deferred table text cell — local draft for instant typing; parent commits debounced + on blur.
 * Completely independent of React Hook Form (RHF) and control props.
 */
export const SubscaleTableTextCell = memo(function SubscaleTableTextCell({
  tableId,
  rowIndex,
  fieldId,
  value,
  onCellChange,
  disabled,
  errorMessage,
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

  const hasError = Boolean(errorMessage);

  return (
    <FormInput
      inputRef={inputRef}
      value={draft}
      disabled={disabled}
      onChange={handleChange}
      onBlur={handleBlur}
      error={hasError}
      helperText={errorMessage || ""}
      {...rest}
    />
  );
});

type SubscaleProcessParticularRowProps = {
  row: ProcessParticularRow;
  rowIndex: number;
  cycleIndex: number;
  sectionKey: "premixParticulars" | "finalMixParticulars";
  onFieldChange: SubscaleProcessFieldChangeHandler;
  border: string;
  text: string;
  getFieldError?: SubscaleFieldErrorGetter;
  clearFieldError?: (path: string) => void; // <-- Add this
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
  field: "rpm" | "time" | "temp" | "vacuum";
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
  clearFieldError,
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
      clearFieldError?.(fieldName); // Clear the error for this field when user types
    },
    [debouncedCommit, clearFieldError, fieldName],
  );

  const handleBlur = useCallback(() => {
    debouncedCommit.cancel();
    commit(draftRef.current);
  }, [commit, debouncedCommit]);

  return (
    <TableCell sx={uniformTableBodyCellSx({ border, text })}>
      <FormInput
        inputRef={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        error={Boolean(errorMessage)}
        helperText={errorMessage}
      />
    </TableCell>
  );
});
