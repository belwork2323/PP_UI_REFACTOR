/**
 * fonts.js
 * ─────────────────────────────────────────────────────────────
 * Typography scale — family, size, weight, line-height.
 * Import in theme files for consistent type tokens.
 * ─────────────────────────────────────────────────────────────
 */

const fonts = {
  family: {
    primary:   "Roboto, Arial, sans-serif",
    monospace: "monospace",   // ← added: used by captcha input field
  },

  size: {
    xs:  "0.75rem",
    sm:  "0.875rem",
    md:  "1rem",
    lg:  "1.25rem",
    xl:  "1.5rem",
    "2xl": "1.8rem",
    "3xl": "2.2rem",
    "4xl": "2.8rem",
    "5xl": "3.2rem",
  },

  weight: {
    light:     300,
    regular:   400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
  },

  lineHeight: {
    tight:  1.2,   // headings
    normal: 1.5,   // body / descriptions
    loose:  1.8,
  },
};

export default fonts;