/**
 * Utility for resolving field paths to DOM elements in rendered forms
 * This handles paths like "rows.0.RESULT", "hardwareValues.OPTION_SELECTED", etc.
 */

interface FieldResolverOptions {
  /** Root element to search within (typically the form container) */
  root: HTMLElement;
  /** Optional callback to validate if an element is the correct field */
  validator?: (element: HTMLElement, path: string) => boolean;
}

/**
 * Creates a resolver function that can find DOM elements for given field paths
 * @param options Configuration options
 * @returns Function that takes a field path and returns the matching DOM element or null
 */
export function createFieldPathResolver(options: FieldResolverOptions) {
  const { root, validator } = options;

  return (fieldPath: string): HTMLElement | null => {
    if (!fieldPath || !root) return null;

    try {
      // Split the path into parts
      const parts = fieldPath.split('.');
      let currentElements: HTMLElement[] = [root];

      // Process each part of the path
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isIndexPart = /^\d+$/.test(part);
        const nextElements: HTMLElement[] = [];

        for (const element of currentElements) {
          if (isIndexPart) {
            // Handle array indices like "rows.0" -> find the nth child that matches a pattern
            const index = parseInt(part, 10);
            const children = Array.from(element.children) as HTMLElement[];

            // Look for elements that might represent array items
            // This is heuristic-based since we don't have direct mapping from schema to DOM
            const potentialItems = children.filter(child =>
              child.classList.contains('schema-repeat-item') ||
              child.classList.contains('schema-table-row') ||
              child.getAttribute('data-index') !== null
            );

            if (potentialItems[index]) {
              nextElements.push(potentialItems[index]);
            } else {
              // Fallback: assume regular children
              if (children[index]) {
                nextElements.push(children[index]);
              }
            }
          } else {
            // Handle field/property names
            // Look for elements with name attributes, data-field attributes, or labels
            const candidates = Array.from(element.querySelectorAll<HTMLElement>(
              `[name="${part}"], [data-field="${part}"], [data-key="${part}"]`
            ));

            // Also look for label elements that might point to the field
            const labelElements = Array.from(element.querySelectorAll<HTMLElement>(
              `label:not([data-ignore])`
            )).filter(label =>
              label.textContent?.trim() === part ||
              label.getAttribute('data-field-label') === part
            );

            // Get the actual input elements associated with these labels
            const labeledInputs = labelElements.flatMap(label => {
              const inputId = label.getAttribute('for');
              if (inputId) {
                const input = element.querySelector<HTMLElement>(`#${inputId}`);
                return input ? [input] : [];
              }
              return [];
            });

            nextElements.push(...candidates, ...labeledInputs);
          }
        }

        // Filter elements with validator if provided
        if (validator) {
          currentElements = nextElements.filter(el => validator(el, parts.slice(0, i + 1).join('.')));
        } else {
          currentElements = nextElements;
        }

        // If we have no more elements to process, break
        if (currentElements.length === 0) {
          return null;
        }
      }

      // Return the first matching element (or we could return all and let caller decide)
      return currentElements[0] || null;
    } catch (error) {
      console.error('Error resolving field path:', fieldPath, error);
      return null;
    }
  };
}

/**
 * Tries to focus a field and scroll it into view
 * @param fieldPath The path to the field (e.g., "rows.0.RESULT")
 * @param rootElement The root element to search within (usually the form container)
 * @returns True if field was found and focused, false otherwise
 */
export function focusFieldByPath(
  fieldPath: string,
  rootElement: HTMLElement,
  options: { validator?: (element: HTMLElement, path: string) => boolean } = {}
): boolean {
  if (!fieldPath || !rootElement) return false;

  const resolver = createFieldPathResolver({
    root: rootElement,
    validator: options.validator
  });

  const element = resolver(fieldPath);
  if (!element) {
    console.warn('Could not find element for field path:', fieldPath);
    return false;
  }

  try {
    // Focus the element
    element.focus();

    // Scroll into view if needed
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Optional: add a brief highlight to indicate this is the field with error
    element.style.boxShadow = '0 0 0 2px #ff9800';
    element.style.borderRadius = '4px';

    // Remove highlight after a brief period
    setTimeout(() => {
      element.style.boxShadow = '';
      element.style.borderRadius = '';
    }, 1500);

    return true;
  } catch (error) {
    console.error('Error focusing field:', fieldPath, error);
    return false;
  }
}

/**
 * Finds all fields with validation errors and focuses the first one
 * @param errorsByEntryId Validation errors object from useQCDivisionHook
 * @param containerRef Ref to the form container element
 * @returns True if a field was focused, false otherwise
 */
export function focusFirstInvalidField(
  errorsByEntryId: Record<string, Record<string, string>> | undefined | null,
  containerRef: React.RefObject<HTMLElement> | null,
  getEntryContainer?: (entryId: string) => HTMLElement | null
): boolean {
  if (!errorsByEntryId || !containerRef?.current) return false;

  const container = containerRef.current;

  // Find the first entry with errors
  for (const entryId in errorsByEntryId) {
    const entryErrors = errorsByEntryId[entryId];
    if (entryErrors && Object.keys(entryErrors).length > 0) {
      // Find the first field with an error in this entry
      const firstErrorField = Object.keys(entryErrors)[0];
      if (firstErrorField) {
        // Determine which container to search in
        let searchContainer = container;
        if (getEntryContainer) {
          const entryContainer = getEntryContainer(entryId);
          if (entryContainer) {
            searchContainer = entryContainer;
          }
        }

        // Try to focus the field
        const focused = focusFieldByPath(firstErrorField, searchContainer);
        if (focused) {
          return true;
        }
      }
    }
  }

  return false;
}