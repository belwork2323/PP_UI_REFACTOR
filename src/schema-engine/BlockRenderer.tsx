import { Box, Button, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type { SchemaBlock, SchemaFieldBlock, SchemaGroupBlock, SchemaSectionBlock } from "./types";
import type { SchemaApiContext } from "./rules/apiDependency";
import type { SchemaThemeTokens } from "./utils/schemaUtils";
import type { SchemaFormValues, SchemaChangeMeta } from "./state/formState";
import { setBlockValue, buildRepeatInstanceChildValues, buildTableRows, scopedFormKey } from "./state/formState";
import { isBlockVisible } from "./rules/visibility";
import { resolveSchemaCountToken, type SchemaSetupContext } from "./utils/setupContext";
import { resolveBlockLayoutSx, resolveFullWidthBlockLayoutSx, resolveGridGap } from "./utils/blockLayout";
import {
  createNextPrefixedTableColumn,
  isDeletablePrefixedColumn,
  resolveDeletableColumnIds,
  resolveTableDeletedColumnIds,
  resolveTableExtraColumns,
  resolveTableRows,
  resolveVisibleTableColumns,
  shouldWrapTableValue,
  wrapTableValue,
} from "./utils/tableRowUtils";
import FormInput from "../ui/components/common/FormInput";
import SchemaApiDropdown from "../ui/components/common/SchemaApiDropdown";
import DynamicTable from "../ui/components/common/DynamicTable";
import MatrixTable from "../ui/components/common/MatrixTable";
import GridFields from "../ui/components/common/GridFields";
import SchemaFileField from "../ui/components/common/SchemaFileField";
import { DateField, DateTimeField, TimeField } from "../ui/components/common/DateField";
import { FILE_PICKER_ACCEPT } from "../utils/FileUtils";
import type { CuringProjectStageMatrix } from "../data/models/user/curingProjectStageMatrix";
import { buildDefaultCuringProjectStageMatrix } from "../data/models/user/curingProjectStageMatrix";

export type BlockRenderContext = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues, meta?: SchemaChangeMeta) => void;
  readOnly?: boolean;
  /** Values stay editable; block Add/Remove row, repeat instance, and column mutations. */
  lockStructure?: boolean;
  theme?: SchemaThemeTokens;
  apiContext?: SchemaApiContext;
  setupContext?: SchemaSetupContext;
  visibilityContext: Record<string, unknown>;
  batch?: { batchId?: string; projectName?: string; projectId?: string };
  motorId?: string;
  /** Top-level or nested section id used to scope field values in form state. */
  valueScope?: string;
  /** When true, repeat-section instance titles (e.g. "Rocket Motor Casing 1") are hidden. */
  hideRepeatInstanceLabels?: boolean;
  /** Field path → message (keys match scopedFormKey / table cell paths). */
  errors?: Record<string, string>;
};

const FieldErrorText = ({ message }: { message?: string }) =>
  message ? (
    <Typography sx={{ fontSize: "0.68rem", color: "error.main", mt: 0.35, lineHeight: 1.3 }}>
      {message}
    </Typography>
  ) : null;

const renderField = (block: SchemaFieldBlock, ctx: BlockRenderContext) => {
  const path = scopedFormKey(ctx.valueScope, block.id);
  const value = String(ctx.values[path] ?? "");
  const errorMsg = ctx.errors?.[path];
  const onFieldChange = (next: string) =>
    ctx.onChange(setBlockValue(ctx.values, block.id, next, ctx.valueScope), {
      changedBlockId: block.id,
      changedScope: ctx.valueScope,
    });
  const disabled = ctx.readOnly || block.readonly;

  const withError = (node: ReactNode) => (
    <Box>
      {node}
      <FieldErrorText message={errorMsg} />
    </Box>
  );

  switch (block.fieldType) {
    case "textarea":
      return withError(
        <FormInput
          label={block.label}
          value={value}
          onChange={(e) => onFieldChange(e.target.value)}
          multiline
          minRows={2}
          disabled={disabled}
          required={block.validation?.required}
        />,
      );
    case "dropdown":
      // SchemaApiDropdown has no error/helperText props — red message via withError only.
      return withError(
        <SchemaApiDropdown
          label={block.label}
          value={value}
          onChange={onFieldChange}
          dataSource={block.dataSource}
          apiContext={ctx.apiContext}
          disabled={disabled}
          required={block.validation?.required}
        />,
      );
    case "date":
      return withError(
        <DateField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />,
      );
    case "time":
      return withError(
        <TimeField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />,
      );
    case "datetime":
      return withError(
        <DateTimeField label={block.label} value={value} onChange={onFieldChange} disabled={disabled} />,
      );
    case "file":
    case "image":
      return withError(
        <SchemaFileField
          label={block.label}
          value={value}
          onChange={onFieldChange}
          disabled={disabled}
          accept={
            block.fieldType === "image"
              ? FILE_PICKER_ACCEPT.IMAGE_VIDEO
              : FILE_PICKER_ACCEPT.IMAGE_VIDEO_PDF
          }
          helperText={block.ui?.placeholder}
          multiple
        />,
      );
    case "number":
    case "decimal":
      // Keep raw keystrokes (do not sanitize) so non-numeric input stays in state
      // and DRAFT validation can show red "must be numeric" under the field.
      return withError(
        <FormInput
          label={block.label ? `${block.label}${block.unit ? ` (${block.unit})` : ""}` : undefined}
          value={value}
          type="text"
          inputMode="decimal"
          onChange={(e) => onFieldChange(e.target.value)}
          disabled={disabled}
          required={block.validation?.required}
        />,
      );
    default:
      return withError(
        <FormInput
          label={block.label}
          value={value}
          onChange={(e) => onFieldChange(e.target.value)}
          disabled={disabled}
          required={block.validation?.required}
        />,
      );
  }
};

const renderRepeatSection = (block: SchemaSectionBlock, ctx: BlockRenderContext) => {
  const instances = (Array.isArray(ctx.values[block.id]) ? ctx.values[block.id] : []) as Record<string, unknown>[];
  const min = resolveSchemaCountToken(block.repeat?.min ?? 1, ctx.setupContext);
  const max = resolveSchemaCountToken(block.repeat?.max ?? 20, ctx.setupContext);
  const allowAdd = block.repeat?.allowAdd !== false && !ctx.readOnly && !ctx.lockStructure;
  const allowDelete = block.repeat?.allowDelete !== false && !ctx.readOnly && !ctx.lockStructure;

  const updateInstance = (index: number, instance: Record<string, unknown>) => {
    const next = [...instances];
    next[index] = instance;
    ctx.onChange(setBlockValue(ctx.values, block.id, next));
  };

  const addInstance = () => {
    if (instances.length >= max) return;
    ctx.onChange(
      setBlockValue(ctx.values, block.id, [
        ...instances,
        { _key: `${block.id}-${instances.length + 1}`, ...buildRepeatInstanceChildValues(block.children, ctx.setupContext) },
      ]),
    );
  };

  const removeInstance = (index: number) => {
    if (instances.length <= min) return;
    ctx.onChange(setBlockValue(ctx.values, block.id, instances.filter((_, i) => i !== index)));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", width: "100%" }}>
      {instances.map((instance, index) => {
        const label = (block.repeat?.label ?? block.title).replace("{index}", String(index + 1));
        const isLastInstance = index === instances.length - 1;
        const instanceCtx: BlockRenderContext = {
          ...ctx,
          valueScope: undefined,
          values: {
            ...ctx.values,
            ...Object.fromEntries(
              block.children.map((child) => [child.id, instance[child.id] ?? ctx.values[child.id]]),
            ),
          },
          onChange: (nextValues) => {
            const nextInstance = { ...instance, _key: instance._key ?? `${block.id}-${index + 1}` };
            block.children.forEach((child) => {
              if (nextValues[child.id] !== undefined) {
                nextInstance[child.id] = nextValues[child.id];
              }
            });
            updateInstance(index, nextInstance);
          },
        };

        return (
          <Box
            key={String(instance._key ?? index)}
            sx={{
              mb: isLastInstance ? 0 : 1.25,
              p: 1.25,
              width: "100%",
              border: `1px solid ${ctx.theme?.border}`,
              borderRadius: 2,
            }}
          >
            {!ctx.hideRepeatInstanceLabels ? (
              <Typography sx={{ fontWeight: 700, fontSize: "0.86rem", mb: 0.75, color: ctx.theme?.primary }}>
                {label}
              </Typography>
            ) : null}
            <GridFields
              direction={block.ui?.direction ?? "row"}
              wrap={block.ui?.wrap ?? true}
              gap={resolveGridGap(block.ui?.gap)}
              defaultChildFlex={block.ui?.direction === "row" ? "1 1 180px" : undefined}
            >
              {block.children.map((child) => (
                <BlockRenderer key={child.id} block={child} ctx={instanceCtx} />
              ))}
            </GridFields>
            {allowDelete && instances.length > min ? (
              <Typography
                component="button"
                onClick={() => removeInstance(index)}
                sx={{ fontSize: "0.76rem", color: "error.main", border: 0, background: "none", cursor: "pointer", mt: 1 }}
              >
                {block.repeat?.deleteLabel ?? "Remove"}
              </Typography>
            ) : null}
          </Box>
        );
      })}
      {allowAdd && instances.length < max ? (
        <Button
          size="small"
          onClick={addInstance}
          sx={{
            mt: instances.length > 0 ? 0.75 : 0,
            mb: 0,
            px: 0,
            minWidth: 0,
            textTransform: "none",
            fontWeight: 700,
            alignSelf: "flex-start",
          }}
        >
          {block.repeat?.addLabel ?? "Add"}
        </Button>
      ) : null}
    </Box>
  );
};

const renderGroup = (block: SchemaGroupBlock, ctx: BlockRenderContext) => {
  if (block.repeat) {
    return renderRepeatSection(
      { ...block, type: "section", title: block.label ?? block.id, children: block.children },
      ctx,
    );
  }

  return (
    <GridFields
      direction={block.ui?.direction ?? "row"}
      wrap={block.ui?.wrap ?? true}
      gap={resolveGridGap(block.ui?.gap)}
    >
      {block.children.map((child) => (
        <BlockRenderer key={child.id} block={child} ctx={ctx} />
      ))}
    </GridFields>
  );
};

export const BlockRenderer = ({ block, ctx }: { block: SchemaBlock; ctx: BlockRenderContext }) => {
  if (!isBlockVisible(block, ctx.visibilityContext)) return null;

  switch (block.type) {
    case "field": {
      const isTextarea = block.fieldType === "textarea";
      const isFileUpload = block.fieldType === "file" || block.fieldType === "image";
      const hasCustomLayout = Boolean(block.ui?.colSpan || block.ui?.flex || block.ui?.width);
      const layoutSx =
        (isTextarea || isFileUpload) && !hasCustomLayout
          ? resolveFullWidthBlockLayoutSx(block.ui)
          : resolveBlockLayoutSx(block.ui);

      return (
        <Box
          sx={layoutSx}
          {...(hasCustomLayout || isTextarea || isFileUpload ? { "data-custom-flex": true } : {})}
        >
          {renderField(block, ctx)}
        </Box>
      );
    }
    case "table": {
      const storedValue = ctx.values[scopedFormKey(ctx.valueScope, block.id)];
      const extraColumns = resolveTableExtraColumns(storedValue);
      const deletedColumnIds = resolveTableDeletedColumnIds(storedValue);
      const visibleColumns = resolveVisibleTableColumns(block.columns, deletedColumnIds);
      const mergedColumns = [...visibleColumns, ...extraColumns];
      const rows = resolveTableRows(storedValue, block, buildTableRows);
      const deletableColumnIds = resolveDeletableColumnIds(block, extraColumns, deletedColumnIds);

      const handleTableChange = (nextRows: Record<string, unknown>[]) => {
        const nextValue = shouldWrapTableValue(block, extraColumns, deletedColumnIds)
          ? wrapTableValue(nextRows, extraColumns, deletedColumnIds)
          : nextRows;
        ctx.onChange(setBlockValue(ctx.values, block.id, nextValue, ctx.valueScope), {
          changedBlockId: block.id,
          changedScope: ctx.valueScope,
        });
      };

      const handleAddColumn = () => {
        if (!block.allowAddColumn || ctx.lockStructure) return;
        const column = createNextPrefixedTableColumn(block, extraColumns, deletedColumnIds);
        const nextExtraColumns = [...extraColumns, column];
        const nextRows = rows.map((row) => ({ ...row, [column.id]: row[column.id] ?? "" }));
        ctx.onChange(
          setBlockValue(
            ctx.values,
            block.id,
            wrapTableValue(nextRows, nextExtraColumns, deletedColumnIds),
            ctx.valueScope,
          ),
          {
            changedBlockId: block.id,
            changedScope: ctx.valueScope,
          },
        );
      };

      const handleDeleteColumn = (columnId: string) => {
        if (!block.allowDeleteColumn || ctx.lockStructure) return;

        const isExtra = extraColumns.some((col) => col.id === columnId);
        let nextExtraColumns = extraColumns;
        let nextDeletedColumnIds = deletedColumnIds;

        if (isExtra) {
          nextExtraColumns = extraColumns.filter((col) => col.id !== columnId);
        } else if (isDeletablePrefixedColumn(block, columnId)) {
          nextDeletedColumnIds = deletedColumnIds.includes(columnId)
            ? deletedColumnIds
            : [...deletedColumnIds, columnId];
        } else {
          return;
        }

        const nextRows = rows.map((row) => {
          const { [columnId]: _removed, ...rest } = row;
          return rest;
        });
        ctx.onChange(
          setBlockValue(
            ctx.values,
            block.id,
            wrapTableValue(nextRows, nextExtraColumns, nextDeletedColumnIds),
            ctx.valueScope,
          ),
          {
            changedBlockId: block.id,
            changedScope: ctx.valueScope,
          },
        );
      };

      const canMutateColumns = Boolean(block.allowAddColumn || block.allowDeleteColumn) && !ctx.lockStructure;

      const tablePath = scopedFormKey(ctx.valueScope, block.id);
      const tableErrorList = ctx.errors
        ? Object.entries(ctx.errors)
            .filter(([k]) => k === tablePath || k.startsWith(`${tablePath}.`) || k === block.id || k.startsWith(`${block.id}.`))
            .map(([, msg]) => msg)
        : [];
      // de-dupe messages
      const uniqueTableErrors = [...new Set(tableErrorList)];

      return (
        <Box sx={resolveFullWidthBlockLayoutSx(block.ui)} data-custom-flex>
          <DynamicTable
            config={{ ...block, columns: mergedColumns }}
            rows={rows}
            onChange={handleTableChange}
            readOnly={ctx.readOnly}
            lockStructure={ctx.lockStructure}
            theme={ctx.theme}
            apiContext={ctx.apiContext}
            tablePath={tablePath}
            cellErrors={ctx.errors}
            allowAddColumn={canMutateColumns && Boolean(block.allowAddColumn)}
            onAddColumn={canMutateColumns && block.allowAddColumn ? handleAddColumn : undefined}
            allowDeleteColumn={canMutateColumns && Boolean(block.allowDeleteColumn)}
            deletableColumnIds={deletableColumnIds}
            onDeleteColumn={canMutateColumns && block.allowDeleteColumn ? handleDeleteColumn : undefined}
          />
          {uniqueTableErrors.length > 0 ? (
            <Box sx={{ mt: 0.75 }}>
              {uniqueTableErrors.slice(0, 8).map((msg, i) => (
                <Typography
                  key={`${msg}-${i}`}
                  sx={{ fontSize: "0.68rem", color: "error.main", lineHeight: 1.35 }}
                >
                  {msg}
                </Typography>
              ))}
              {uniqueTableErrors.length > 8 ? (
                <Typography sx={{ fontSize: "0.68rem", color: "error.main" }}>
                  +{uniqueTableErrors.length - 8} more…
                </Typography>
              ) : null}
            </Box>
          ) : null}
        </Box>
      );
    }
    case "matrix": {
      const matrixValue = (ctx.values[scopedFormKey(ctx.valueScope, block.id)] ?? { columns: [], rows: [] }) as CuringProjectStageMatrix;
      const resolved =
        matrixValue.rows?.length > 0
          ? matrixValue
          : buildDefaultCuringProjectStageMatrix(ctx.batch ?? {}, ctx.motorId ?? "", []);
      return (
        <Box sx={resolveFullWidthBlockLayoutSx(block.ui)} data-custom-flex>
          <MatrixTable
            config={block}
            value={resolved}
            onChange={(next) =>
              ctx.onChange(setBlockValue(ctx.values, block.id, next, ctx.valueScope), {
                changedBlockId: block.id,
                changedScope: ctx.valueScope,
              })
            }
            readOnly={ctx.readOnly}
            lockStructure={ctx.lockStructure}
            theme={ctx.theme}
            apiContext={ctx.apiContext}
            batch={ctx.batch}
            motorId={ctx.motorId}
          />
        </Box>
      );
    }
    case "section":
      if (block.repeat) return renderRepeatSection(block, ctx);
      return (
        <>
          {block.children.map((child) => (
            <BlockRenderer key={child.id} block={child} ctx={{ ...ctx, valueScope: block.id }} />
          ))}
        </>
      );
    case "group":
      return renderGroup(block, ctx);
    case "display": {
      const displayBlock = block as { displayType?: string; label?: string; value?: string };
      const isDescription = displayBlock.displayType === "description";
      const text = isDescription
        ? displayBlock.label ?? ""
        : `${displayBlock.label ?? ""}${displayBlock.value ? `: ${displayBlock.value}` : ""}`;

      return (
        <Typography
          sx={{
            fontSize: "0.84rem",
            mb: isDescription ? 0.5 : 1,
            color: isDescription ? ctx.theme?.textSub : ctx.theme?.text,
            fontWeight: isDescription ? 600 : 400,
          }}
        >
          {text}
        </Typography>
      );
    }
    default:
      return null;
  }
};

export default BlockRenderer;
