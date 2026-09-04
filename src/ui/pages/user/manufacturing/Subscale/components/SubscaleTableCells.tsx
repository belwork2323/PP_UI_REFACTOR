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

type SubscaleTableTextCellProps = Omit<FormInputProps, "value" | "onChange" | "defaultValue"> & {
  tableId: string;
  rowIndex: number;
  fieldId: string;
  value: string;
  onCellChange: SubscaleCellChangeHandler;
  control?: Control<SchemaFormValues>; // <-- Type for control
};

/**
 * Deferred table text cell — local draft for instant typing; parent commits debounced + on blur.
 */
export const SubscaleTableTextCell = memo(function SubscaleTableTextCell({
  tableId,
  rowIndex,
  fieldId,
  value,
  onCellChange,
  disabled,
  control: propControl,
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
  const contextControl = useFormContext()?.control;
  const control = propControl || contextControl;
  const fieldName = `schemaFormValues.${tableId}.${rowIndex}.${fieldId}`;
  return control ? (
    // If control is available, wrap with Controller to handle validation errors
    <Controller
      name={fieldName}
      control={control}
      render={({ field: { onChange: rhfOnChange, value: rhfValue }, fieldState: { error } }) => {
        // Keep your draft state synchronization working inside the controller
        const currentVal = rhfValue ?? value ?? "";

        return (
          <FormInput
            {...({
              inputRef,
              value: currentVal,
              onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const nextValue = event.target.value;
                rhfOnChange(nextValue); // Update React Hook Form state
                onCellChange(tableId, rowIndex, fieldId, nextValue); // Sync with existing custom cell handler
              },
              disabled,
              error: !!error,
              helperText: error?.message || "",
              ...rest,
            } as any)}
          />
        );
      }}
    />
  ) : (
    <UncontrolledSubscaleTableTextCell
      tableId={tableId}
      rowIndex={rowIndex}
      fieldId={fieldId}
      value={value}
      onCellChange={onCellChange}
      disabled={disabled}
      inputRef={inputRef}
      {...rest}
    />
  );
});
const UncontrolledSubscaleTableTextCell = ({
  tableId,
  rowIndex,
  fieldId,
  value,
  onCellChange,
  disabled,
  inputRef,
  ...rest
}: any) => {
  const [draft, setDraft] = useState(value ?? "");
  const draftRef = useRef(draft);
  const committedRef = useRef(value ?? "");
  draftRef.current = draft;

  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    const next = value ?? "";
    setDraft(next);
    committedRef.current = next;
  }, [value, inputRef]);

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

  return (
    <FormInput
      {...({
        inputRef,
        value: draft,
        onChange: handleChange,
        onBlur: handleBlur,
        disabled,
        ...rest,
      } as any)}
    />
  );
};
type SubscaleProcessParticularRowProps = {
  row: ProcessParticularRow;
  rowIndex: number;
  cycleIndex: number;
  sectionKey: "premixParticulars" | "finalMixParticulars";
  onFieldChange: SubscaleProcessFieldChangeHandler;
  border: string;
  text: string;
  getFieldError?: SubscaleFieldErrorGetter;
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
  const contextControl = useFormContext()?.control;
  const control = contextControl;
  const fieldName = `schemaFormValues.SUBSCALE_MIXING_CYCLES.${cycleIndex}.${sectionKey}.${rowIndex}.${field}`;

  return control ? (
    <TableCell sx={uniformTableBodyCellSx({ border, text })}>
      <Controller
        name={fieldName}
        control={control}
        render={({ field: { onChange: rhfOnChange, value: rhfValue }, fieldState: { error } }) => {
          const currentVal = rhfValue ?? draft ?? "";
          return (
            <FormInput
              inputRef={inputRef}
              value={currentVal}
              placeholder={placeholder}
              onChange={(e) => {
                const next = e.target.value;
                rhfOnChange(next);
                setDraft(next);
                debouncedCommit(next);
              }}
              onBlur={() => {
                debouncedCommit.cancel();
                commit(draftRef.current);
              }}
              error={!!error}
              helperText={error?.message || errorMessage}
            />
          );
        }}
      />
    </TableCell>
  ) : (
    <TableCell sx={uniformTableBodyCellSx({ border, text })}>
      <FormInput
        inputRef={inputRef}
        value={draft}
        placeholder={placeholder}
        onChange={handleChange}
        onBlur={handleBlur}
        error={hasError}
        helperText={errorMessage}
      />
    </TableCell>
  );
});
