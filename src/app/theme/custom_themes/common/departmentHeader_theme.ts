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
      pt: { xs: spacing.sm, md: spacing.md },
      pb: { xs: spacing.sm, md: spacing.md },
    },

    // ─── CARD ────────────────────────────────────────────────────
    card: {
      ...general.positionRelative,
      borderRadius:   `${(layout.cardBorderRadius ?? 4) * 3}px`,
      background:     d.cardBg,
      border:         `1px solid ${d.cardBorder}`,
      boxShadow:      d.cardShadow,
      backdropFilter: d.backdropFilter,
      ...general.overflowHidden,
      p: { xs: spacing.sm, sm: spacing.md, md: spacing.md },
    },

    // ─── DECORATIVE CIRCLES ──────────────────────────────────────
    decorCircle: {
      ...general.positionAbsolute,
      top:           -40,
      right:         -40,
      width:         160,
      height:        160,
      ...general.borderCircle,
      background:    d.decorBg,
      pointerEvents: "none",
    },

    decorCircleSmall: {
      ...general.positionAbsolute,
      bottom:        -20,
      left:          "30%",
      width:         80,
      height:        80,
      ...general.borderCircle,
      background:    d.decorBgSmall,
      pointerEvents: "none",
    },

    // ─── TOP ROW ─────────────────────────────────────────────────
    topRow: {
      display:        "flex",
      flexWrap:       "wrap",
      alignItems:     "flex-start",
      justifyContent: "space-between",
      gap:            { xs: spacing.md, md: spacing.lg },
    },

    // ─── LEFT: identity block ─────────────────────────────────────
    identityBlock: {
      ...general.flexRow,
      alignItems: "flex-start",
      gap:        spacing.md ?? 2,
      ...general.noShrink,
    },

    iconBadge: {
      width:        52,
      height:       52,
      borderRadius: "14px",
      bgcolor:      d.iconBadgeBg,
      border:       `1.5px solid ${d.cardBorder}`,
      ...general.flexCenter,
      ...general.noShrink,
      color:        d.iconColor,
    },

    identityText: {
      ...general.flexColumn,
      gap: "4px",
    },

    subDeptName: {
      fontSize:      fonts.size?.lg     ?? "1.25rem",
      fontWeight:    fonts.weight?.bold ?? 700,
      color:         d.valueColor,
      lineHeight:    fonts.lineHeight?.tight ?? 1.2,
      letterSpacing: "-0.01em",
    },

    deptName: {
      fontSize:   fonts.size?.sm         ?? "0.875rem",
      color:      d.labelColor,
      fontWeight: fonts.weight?.medium   ?? 500,
      lineHeight: fonts.lineHeight?.normal ?? 1.5,
    },

    divider: {
      ...general.fullWidth,
      height: "1px",
      bgcolor: d.dividerColor,
      my:     { xs: spacing.xs, md: spacing.sm },
    },

    // ─── USER ROW ────────────────────────────────────────────────
    userRow: {
      ...general.flexRow,
      ...general.alignCenter,
      flexWrap: "wrap",
      gap:      { xs: spacing.sm, md: spacing.md },
      mt:       "2px",
    },

    userChip: {
      ...general.flexRow,
      ...general.alignCenter,
      gap:          "6px",
      px:           "12px",
      py:           "5px",
      borderRadius: "999px",
      bgcolor:      d.chipBg,
      border:       `1px solid ${d.chipBorder}`,
    },

    userChipLabel: {
      fontSize:   fonts.size?.xs         ?? "0.75rem",
      color:      d.labelColor,
      fontWeight: fonts.weight?.medium   ?? 500,
      lineHeight: 1,
    },

    userChipValue: {
      fontSize:   fonts.size?.sm         ?? "0.875rem",
      color:      d.chipText,
      fontWeight: fonts.weight?.bold     ?? 700,
      lineHeight: 1,
    },

    userIcon: {
      fontSize: 14,
      color:    d.iconColor,
      opacity:  0.7,
    },

    // ─── RIGHT: BATCH STATS GRID ──────────────────────────────────
    statsGrid: {
      display:             "grid",
      gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
      gap:                 { xs: spacing.sm, md: spacing.md },
      ...general.noShrink,
      minWidth:            { sm: 420 },
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
        gap:          "4px",
        px:           { xs: "12px", md: "16px" },
        py:           { xs: "10px", md: "12px" },
        minHeight:    { xs: "68px", md: "84px" },
        borderRadius: "12px",
        bgcolor:      d.chipBg,
        border:       `1px solid ${d.chipBorder}`,
        ...general.overflowHidden,
        // Left accent bar
        "&::before": {
          content:      '""',
          ...general.positionAbsolute,
          left:         0,
          top:          "20%",
          height:       "60%",
          width:        "3px",
          borderRadius: "0 3px 3px 0",
          background:   accentMap[accentKey] ?? d.chipText,
        },
      };
    },

    statTileValue: {
      fontSize:   { xs: fonts.size?.xl ?? "1.5rem", md: fonts.size?.["2xl"] ?? "1.8rem" },
      fontWeight: fonts.weight?.bold ?? 700,
      color:      d.valueColor,
      lineHeight: 1,
    },

    statTileLabel: {
      fontSize:      fonts.size?.xs         ?? "0.72rem",
      color:         d.labelColor,
      fontWeight:    fonts.weight?.medium   ?? 500,
      lineHeight:    fonts.lineHeight?.normal ?? 1.5,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
      minHeight:     "2.25em",
      display:       "block",
    },
  };
};

export default getDepartmentHeaderTheme;