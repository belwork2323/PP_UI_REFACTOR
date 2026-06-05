// ─── GENERAL THEME ───────────────────────────────────────────────────────────
// Reusable layout & style primitives shared across all page themes.
// Import and spread/reference these anywhere instead of writing inline styles.
// ─────────────────────────────────────────────────────────────────────────────

const general = {

  // ─── SIZE ────────────────────────────────────────────────────
  fullWidth:       { width: "100%" },
  fullHeight:      { height: "100%" },
  fullSize:        { width: "100%", height: "100%" },
  fullViewHeight:  { height: "100vh" },
  fullViewWidth:   { width: "100vw" },
  fullViewSize:    { width: "100vw", height: "100vh" },

  // ─── OVERFLOW ────────────────────────────────────────────────
  overflowHidden:  { overflow: "hidden" },
  overflowAuto:    { overflow: "auto" },
  overflowScroll:  { overflow: "scroll" },

  // ─── FLEX ────────────────────────────────────────────────────
  flex1:           { flex: 1 },
  flexCenter: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
  },
  flexColumn: {
    display:       "flex",
    flexDirection: "column",
  },
  flexColumnCenter: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
  },
  flexRow: {
    display:       "flex",
    flexDirection: "row",
  },
  flexRowCenter: {
    display:        "flex",
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
  },
  flexWrap:        { flexWrap: "wrap" },
  noShrink:        { flexShrink: 0 },
  alignCenter:     { alignItems: "center" },
  alignStart:      { alignItems: "flex-start" },
  alignEnd:        { alignItems: "flex-end" },
  justifyCenter:   { justifyContent: "center" },
  justifyBetween:  { justifyContent: "space-between" },
  justifyEnd:      { justifyContent: "flex-end" },

  // ─── POSITION ────────────────────────────────────────────────
  positionFixed:    { position: "fixed" },
  positionAbsolute: { position: "absolute" },
  positionRelative: { position: "relative" },
  positionSticky:   { position: "sticky" },

  // ─── TEXT ────────────────────────────────────────────────────
  textCenter:  { textAlign: "center" },
  textLeft:    { textAlign: "left" },
  textRight:   { textAlign: "right" },
  noWrap:      { whiteSpace: "nowrap" },
  pointer:     { cursor: "pointer" },
  noSelect:    { userSelect: "none" },

  // ─── SHAPE ───────────────────────────────────────────────────
  borderCircle: { borderRadius: "50%" },

  // ─── OBJECT FIT ──────────────────────────────────────────────
  objectContain: { objectFit: "contain" },
  objectCover:   { objectFit: "cover" },

  // ─── MISC ────────────────────────────────────────────────────
  boxSizingBorder: { boxSizing: "border-box" },
  noMinWidth:      { minWidth: 0 },
  noOutline:       { outline: "none" },
  hiddenVisually: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0,0,0,0)",
    whiteSpace: "nowrap",
  },

  borderRadius: {
    sm: 2,
    md: 4,
    lg: 6,
    xl: 8,
  },

};

export default general;