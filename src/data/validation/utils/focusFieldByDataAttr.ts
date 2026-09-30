/**
 * Shared DOM focus/scroll for validation error targets.
 * Used by RMS (`data-rms-field`), RMP (`data-rmp-field`), RMC (`data-rmc-field`),
 * Case Prep (`data-cp-field`).
 */

const escapeAttrValue = (value: string) => value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/**
 * Scroll to and focus the control tagged with `data-{attrName}="{fieldPath}"`.
 * @param attrName data attribute without the `data-` prefix (e.g. `rms-field`)
 */
export function focusFieldByDataAttr(
  attrName: string,
  fieldPath: string,
  root: ParentNode = document,
): boolean {
  if (!attrName || !fieldPath) return false;
  const selector = `[data-${attrName}="${escapeAttrValue(fieldPath)}"]`;
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = el.matches(
    "input, select, textarea, button, [tabindex], [role='combobox'], [role='button']",
  )
    ? el
    : el.querySelector<HTMLElement>(
        "input, select, textarea, button, [tabindex], [role='combobox'], [role='button']",
      );
  if (focusable) {
    try {
      focusable.focus({ preventScroll: true });
    } catch {
      focusable.focus?.();
    }
  }
  return true;
}
