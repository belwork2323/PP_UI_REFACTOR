import type { ReactNode } from "react";
import {
  Box,
  Typography,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import LayersRoundedIcon from "@mui/icons-material/LayersRounded";

import { STRINGS } from "../../../app/config/strings";
import fonts from "../../../app/theme/fonts";

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// e.g. getVal(row, "assignedTo.fullName") → row.assignedTo.fullName
const getVal = (obj: any, key: string) => key.split(".").reduce((acc, k) => acc?.[k], obj);

export type BatchTableColumn = {
  key: string;
  label: ReactNode;
  align?: "left" | "center" | "right";
  width?: number | string;
  render?: (value: any, row: any) => ReactNode;
};

type BatchTableProps = {
  rows: any[];
  columns: BatchTableColumn[];
  startIndex: number;
  isLoading: boolean;
  tableLabel: string;
  emptyText: string;
  headerCellSx: Record<string, unknown>;
  bodyCellSx: Record<string, unknown>;
  emptySx: { wrap: unknown; icon: unknown; title: unknown; subtitle: unknown };
  stripedRowEven?: string;
  stripedRowOdd?: string;
  hoverColor: string;
  textSub?: string;
  highlightRow?: (row: any) => boolean;
  highlightColor: string;
  renderAction?: (row: any) => ReactNode;
};

/** Table header from subdepartment columns, numbered rows, data cells, action cell and empty state. */
const BatchTable = ({
  rows,
  columns,
  startIndex,
  isLoading,
  tableLabel,
  emptyText,
  headerCellSx,
  bodyCellSx,
  emptySx,
  stripedRowEven,
  stripedRowOdd,
  hoverColor,
  textSub,
  highlightRow,
  highlightColor,
  renderAction,
}: BatchTableProps) => {
  const showActionCol = Boolean(renderAction);

  return (
    <TableContainer>
      <Table aria-label={tableLabel}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ ...headerCellSx, width: 40, textAlign: "center" }}>
              {STRINGS.USER_BATCH_LIST.COL_HASH}
            </TableCell>
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{ ...headerCellSx, textAlign: col.align ?? "left", width: col.width }}
              >
                {col.label}
              </TableCell>
            ))}
            {showActionCol && (
              <TableCell
                sx={{ ...headerCellSx, textAlign: "center", minWidth: 200, whiteSpace: "nowrap" }}
              >
                {STRINGS.USER_BATCH_LIST.COL_ACTION}
              </TableCell>
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {!isLoading && rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={(columns?.length ?? 0) + (showActionCol ? 1 : 0) + 1}
                sx={{ p: 0, borderBottom: "none" }}
              >
                <Box sx={emptySx.wrap as any}>
                  <LayersRoundedIcon sx={emptySx.icon as any} />
                  <Typography sx={emptySx.title as any}>{emptyText}</Typography>
                  <Typography sx={emptySx.subtitle as any}>
                    {STRINGS.USER_BATCH_LIST.EMPTY_SUBTITLE}
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => {
              const isHighlighted = highlightRow?.(row) ?? false;

              return (
                <TableRow
                  key={row.id ?? idx}
                  sx={{
                    background: isHighlighted
                      ? alpha(highlightColor, 0.02)
                      : idx % 2 === 0
                        ? stripedRowEven
                        : stripedRowOdd,
                    borderLeft: isHighlighted
                      ? `3px solid ${highlightColor}`
                      : "3px solid transparent",
                    "&:hover": { background: alpha(hoverColor, 0.04) },
                    "&:last-child td": { borderBottom: "none" },
                    animation: `${fadeUp} 0.25s ease both`,
                    animationDelay: `${idx * 0.03}s`,
                    transition: "background 0.15s",
                  }}
                >
                  <TableCell sx={{ ...bodyCellSx, textAlign: "center" }}>
                    <Typography
                      sx={{
                        fontSize: fonts.size.xs,
                        fontWeight: fonts.weight.bold,
                        color: textSub,
                      }}
                    >
                      {startIndex + idx + 1}
                    </Typography>
                  </TableCell>

                  {columns.map((col) => {
                    const rawValue = getVal(row, col.key);
                    return (
                      <TableCell key={col.key} sx={{ ...bodyCellSx, textAlign: col.align ?? "left" }}>
                        {col.render ? (
                          col.render(rawValue, row)
                        ) : (
                          <Typography sx={{ fontSize: fonts.size.sm }}>{rawValue ?? "—"}</Typography>
                        )}
                      </TableCell>
                    );
                  })}

                  {showActionCol && (
                    <TableCell
                      sx={{ ...bodyCellSx, textAlign: "center", minWidth: 200, whiteSpace: "nowrap" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100%",
                          flexWrap: "nowrap",
                        }}
                      >
                        {renderAction?.(row)}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default BatchTable;
