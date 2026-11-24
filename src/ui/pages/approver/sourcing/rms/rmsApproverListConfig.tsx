import { useMemo } from "react";
import { Paper, alpha } from "@mui/material";

import { STRINGS } from "@app/config/strings";
import fonts from "@app/theme/fonts";
import { useThemeStore } from "@app/store/themeStore";
import {
  uniformTableBodyCellSx,
  uniformTableHeaderCellSx,
} from "@app/theme/custom_themes/shared/data_table_theme";
import { getListLayoutTheme } from "@app/theme/custom_themes/shared/listLayout_theme";
import { getRawMaterialSourcingApproverTheme } from "@app/theme/custom_themes/approver/sourcing/rms/rawMaterialSourcingApprover_theme";
import { getRawMaterialSourcingPageTheme } from "@app/theme/custom_themes/user/sourcing/rms/rawMaterialSourcing_theme";
import { OPERATION_STATUS } from "@hooks/operationStatus";
import { useRawMaterialSourcingApproverList } from "@hooks/approver/sourcing/rms/useRawMaterialSourcingApproverList";
import type { ApproverWorkflowListConfig } from "@ui/pages/approver/components/approverWorkflowTypes";
import { getLotFilterFields } from "@ui/pages/user/sourcing/rms/components/lotFilterFields";
import {
  buildRmsApproverStatusConfig,
  getRmsApproverListColumns,
  renderRmsApproverRowAction,
} from "./rmsApproverListColumns";

const SEARCH_KEYS = [
  "lotId",
  "sourcingId",
  "materialCode",
  "materialName",
  "supplyOrderNo",
  "receiptDate",
  "manufacturerName",
  "status",
  "submittedBy",
  "createdOn",
];

/** Same field-row layout as User RMS lot list filter panel. */
const FILTER_FIELD_ROW_PROPS = {
  direction: "row",
  spacing: 1.25,
  alignItems: "flex-end",
  flexWrap: { xs: "wrap", lg: "nowrap" },
  useFlexGap: true,
};

/** Builds the RMS Approver list config against shared ApproverWorkflowListPage + BatchTable. */
export const useRmsApproverListConfig = (): ApproverWorkflowListConfig => {
  const mode = useThemeStore((state) => state.mode);
  const approverTheme = useMemo(() => getRawMaterialSourcingApproverTheme(mode), [mode]);
  const pageTheme = useMemo(() => getRawMaterialSourcingPageTheme(mode), [mode]);

  /** Same batchList tokens as user RMS lot list (columns + stripes + status chips). */
  const listTheme = useMemo(
    () => ({
      palette: pageTheme.palette,
      batchList: {
        ...pageTheme.batchList,
        chips: {
          ...pageTheme.batchList.chips,
          reasonText: approverTheme.batchList.chips.reasonText,
        },
      },
    }),
    [pageTheme, approverTheme],
  );

  return useMemo(() => {
    const p = listTheme.palette;
    const t = listTheme.batchList;
    const listShell = getListLayoutTheme(
      {
        primary: p.primary,
        primaryLight: p.primaryLight,
        border: p.border,
        text: p.text,
        textSub: p.textSub,
        surface: p.surface,
      },
      { filterInputBg: t.filterInputBg },
    );

    const headerCellSx = {
      ...uniformTableHeaderCellSx(p.primary ?? "#1B4F72", p.primaryLight ?? "#2E86C1", {
        headerFontSize: fonts.size.xs,
        headerLetterSpacing: "0.08em",
        headerPaddingY: "11px",
        headerPaddingX: "14px",
      }),
      ...(t.tableHeaderBg ? { background: t.tableHeaderBg } : {}),
      ...(t.tableHeaderText ? { color: t.tableHeaderText } : {}),
      ...(t.tableHeaderBorder && t.tableHeaderBorder !== "transparent"
        ? { borderBottom: `2px solid ${t.tableHeaderBorder}` }
        : {}),
    };

    const bodyCellSx = uniformTableBodyCellSx(
      { border: p.border || "#D5D8DC", text: p.text || "#000" },
      {
        bodyFontSize: fonts.size.sm,
        bodyPaddingY: "10px",
        bodyPaddingX: "14px",
      },
    );

    return {
      department: "sourcing",
      subDepartment: "raw-material",
      statusField: "status",
      searchKeys: SEARCH_KEYS,
      searchPlaceholder: STRINGS.APPROVER.LIST.SEARCH_PLACEHOLDER([
        "lot ID",
        "sourcing ID",
        "material",
        "manufacturer",
        "status",
        "created by",
      ]),
      filterTitle: STRINGS.SOURCING.BATCH_LIST.FILTERS_TITLE,
      filterPalette: listTheme.palette,
      filterFieldsTheme: pageTheme,
      filterFieldRowProps: FILTER_FIELD_ROW_PROPS,
      filterApplyButtonSx: pageTheme.sourcing.rawMaterial.lotList.applyButton,
      useListState: useRawMaterialSourcingApproverList,
      getFilterFields: getLotFilterFields,
      getColumns: () => {
        const statusConfig = buildRmsApproverStatusConfig(listTheme);
        return getRmsApproverListColumns({ theme: listTheme, statusConfig });
      },
      getRowKey: (row, index) => row.lotId ?? row.id ?? row.formId ?? index,
      batchTable: {
        headerCellSx,
        bodyCellSx,
        emptySx: {
          wrap: listShell.sections.emptyWrap,
          icon: listShell.empty.icon,
          title: listShell.empty.title,
          subtitle: listShell.empty.subtitle,
        },
        stripedRowEven: t.stripedRowEven,
        stripedRowOdd: t.stripedRowOdd,
        hoverColor: p.primaryLight || "#2E86C1",
        textSub: p.textSub,
        highlightColor: p.danger,
        highlightRow: (row) => row.status === OPERATION_STATUS.REJECTED,
        tableLabel: STRINGS.SOURCING.BATCH_LIST.RM_TITLE,
        emptyText: STRINGS.APPROVER.LIST.EMPTY_TITLE,
      },
      renderAction: (row, onViewDetails) =>
        renderRmsApproverRowAction(row, onViewDetails, {
          button: approverTheme.table.actionButton,
          icon: approverTheme.table.actionButtonIcon,
        }),
      renderTableChrome: (table) => (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: p.surface,
            border: `1.5px solid ${p.border}`,
            boxShadow: `0 2px 16px ${alpha(p.primary || "#000", 0.07)}`,
          }}
        >
          {table}
        </Paper>
      ),
    };
  }, [listTheme, pageTheme, approverTheme]);
};

export default useRmsApproverListConfig;
