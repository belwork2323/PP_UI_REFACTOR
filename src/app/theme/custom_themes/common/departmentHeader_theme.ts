import colors  from "../../colors";
import fonts   from "../../fonts";
import spacing from "../../spacing";
import layout  from "../../layout";
import general from "./common_css_theme";

// ─────────────────────────────────────────────────────────────────────────────
// getDepartmentHeaderTheme(mode)
//
//   "light" →  BLUE GLASS card  — branded, matches header/footer light
//              White text on blue gradient glass
//
//   "dark"  →  WHITE / neutral card — standard dark-theme page, clean card
//              Dark text on white
//
// All colour values come from colors.deptHeader[mode] — no magic strings here.
// All reusable layout primitives come from `general`.
// ─────────────────────────────────────────────────────────────────────────────

const getDepartmentHeaderTheme = (mode = "light") => {
  const d = colors.deptHeader?.[mode] ?? colors.deptHeader.light;

  return {

    // ─── OUTER WRAPPER ───────────────────────────────────────────
    wrapper: {
      px: { xs: spacing.sm, md: spacing.md },
      pt: { xs: 0.75, md: 1 },
      pb: { xs: 0.75, md: 1 },
    },

    // ─── CARD (compact — shared across all user subdepartments) ──
    card: {
      ...general.positionRelative,
      borderRadius:   `${(layout.cardBorderRadius ?? 4) * 2.5}px`,
      background:     d.cardBg,
      border:         `1px solid ${d.cardBorder}`,
      boxShadow:      d.cardShadow,
      backdropFilter: d.backdropFilter,
      ...general.overflowHidden,
      p: { xs: "8px 10px", sm: "8px 12px", md: "9px 14px" },
    },

    // ─── DECORATIVE CIRCLES ──────────────────────────────────────
    decorCircle: {
      ...general.positionAbsolute,
      top:           -36,
      right:         -36,
      width:         120,
      height:        120,
      ...general.borderCircle,
      background:    d.decorBg,
      pointerEvents: "none",
    },

    decorCircleSmall: {
      ...general.positionAbsolute,
      bottom:        -16,
      left:          "30%",
      width:         64,
      height:        64,
      ...general.borderCircle,
      background:    d.decorBgSmall,
      pointerEvents: "none",
    },

    // ─── TOP ROW ─────────────────────────────────────────────────
    topRow: {
      display:        "flex",
      flexWrap:       "wrap",
      alignItems:     "center",
      justifyContent: "space-between",
      gap:            { xs: 1, md: 1.5 },
    },

    // ─── LEFT: identity block ─────────────────────────────────────
    identityBlock: {
      ...general.flexRow,
      alignItems: "center",
      gap:        1.25,
      ...general.noShrink,
    },

    iconBadge: {
      width:        34,
      height:       34,
      borderRadius: "9px",
      bgcolor:      d.iconBadgeBg,
      border:       `1px solid ${d.cardBorder}`,
      ...general.flexCenter,
      ...general.noShrink,
      color:        d.iconColor,
      "& .MuiSvgIcon-root": { fontSize: 20 },
    },

    identityText: {
      ...general.flexColumn,
      gap: 0,
    },

    subDeptName: {
      fontSize:      { xs: "0.95rem", md: "1.05rem" },
      fontWeight:    fonts.weight?.bold ?? 700,
      color:         d.valueColor,
      lineHeight:    1.2,
      letterSpacing: "-0.01em",
    },

    deptName: {
      fontSize:   "0.72rem",
      color:      d.labelColor,
      fontWeight: fonts.weight?.medium ?? 500,
      lineHeight: 1.35,
    },

    // ─── RIGHT: BATCH STATS GRID ──────────────────────────────────
    statsGrid: {
      display:             "grid",
      gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
      gap:                 { xs: 0.75, md: 0.75 },
      ...general.noShrink,
      minWidth:            { sm: 360 },
    },

    // Individual stat tile — receives accentKey string
    statTile: (accentKey) => {
      const accentMap = {
        allocated: d.accentAllocated,
        completed: d.accentCompleted,
        draft:     d.accentDraft,
        pending:   d.accentPending,
        approved:  d.accentCompleted,
        rejected:  d.accentPending,
        createdLots: d.accentAllocated,
        pendingLots: d.accentPending,
        waitingForApprovalLots: d.accentDraft,
        approvedLots: d.accentCompleted,
        rejectedLots: d.accentPending,
      };

      return {
        ...general.positionRelative,
        ...general.flexColumn,
        justifyContent: "center",
        gap:          "1px",
        px:           { xs: "8px", md: "10px" },
        py:           { xs: "5px", md: "5px" },
        minHeight:    { xs: "40px", md: "42px" },
        borderRadius: "8px",
        bgcolor:      d.chipBg,
        border:       `1px solid ${d.chipBorder}`,
        ...general.overflowHidden,
        // Left accent bar
        "&::before": {
          content:      '""',
          ...general.positionAbsolute,
          left:         0,
          top:          "22%",
          height:       "56%",
          width:        "3px",
          borderRadius: "0 3px 3px 0",
          background:   accentMap[accentKey] ?? d.chipText,
        },
      };
    },

    statTileValue: {
      fontSize:   { xs: "1rem", md: "1.1rem" },
      fontWeight: fonts.weight?.bold ?? 700,
      color:      d.valueColor,
      lineHeight: 1,
    },

    statTileLabel: {
      fontSize:      "0.62rem",
      color:         d.labelColor,
      fontWeight:    fonts.weight?.medium ?? 500,
      lineHeight:    1.25,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      minHeight:     "unset",
      display:       "block",
    },
  };
};

export default getDepartmentHeaderTheme;