import type { ReactNode } from "react";
import { Box, Typography, type SxProps, type Theme } from "@mui/material";

type WorkflowEntitySelectorRowProps = {
  /** Optional field label above the control row (e.g. SELECT RAW MATERIAL). */
  label?: ReactNode;
  labelSx?: SxProps<Theme>;
  /** Select / input controls. In `inline` mode they share a row with `action`. */
  children: ReactNode;
  /** Primary CTA (Add to Form, Add, Load Form, …). */
  action?: ReactNode;
  /**
   * `inline` — label above; children + action on one center-aligned row.
   * `below` — children row, then action right-aligned underneath (multi-select flow bars).
   */
  actionPlacement?: "inline" | "below";
  /** Dashed / gradient panel styles for the outer wrapper. */
  containerSx?: SxProps<Theme>;
};

/**
 * Shared create-form selector shell: optional label, entity select(s), and add/load CTA.
 * Keeps the CTA height-aligned with the control row when `actionPlacement="inline"`.
 */
const WorkflowEntitySelectorRow = ({
  label,
  labelSx,
  children,
  action,
  actionPlacement = "inline",
  containerSx,
}: WorkflowEntitySelectorRowProps) => {
  const controls = (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        alignItems: { xs: "stretch", sm: actionPlacement === "inline" ? "center" : "flex-end" },
        flex: 1,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
          alignItems: { sm: "flex-end" },
        }}
      >
        {children}
      </Box>
      {actionPlacement === "inline" && action ? (
        <Box sx={{ flexShrink: 0, width: { xs: "100%", sm: "auto" } }}>{action}</Box>
      ) : null}
    </Box>
  );

  return (
    <Box sx={containerSx}>
      {label != null ? <Typography sx={labelSx}>{label}</Typography> : null}
      {controls}
      {actionPlacement === "below" && action ? (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.25 }}>{action}</Box>
      ) : null}
    </Box>
  );
};

export default WorkflowEntitySelectorRow;
