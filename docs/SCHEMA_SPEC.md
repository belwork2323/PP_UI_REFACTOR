# PP-Schema UI Standard v2

**Version:** 2.0  
**Status:** Specification (schema-engine implementation pending)  
**Audience:** Backend schema builders, frontend `schema-engine` module  
**TypeScript types:** [`src/schema-engine/types/schema.types.ts`](../src/schema-engine/types/schema.types.ts)

This document defines the **single canonical format** for schema-driven manufacturing forms in PP-UI. All modules (raw material prep, case preparation, casting, curing, mock trial, etc.) use this structure.

**v2 changes from v1:**

- Nested `sections[]` with recursive `children[]` — no flat `data.nodes[]`
- No `repeatable` block type — `repeat` is a property on nested `section` blocks
- `ui`, `context`, and `sections` live inside root `data` (identification fields stay at root)
- Four explicit layers: definition / UI / rules / submission
- All UI maps to **one** component library: [`src/ui/components/common/`](../src/ui/components/common/)
- **No v1 normalizer** — backend emits v2 JSON directly

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [Root document](#2-root-document)
3. [Four layers](#3-four-layers)
4. [Section model](#4-section-model)
5. [Child block types](#5-child-block-types)
6. [Component catalog](#6-component-catalog)
7. [UI metadata reference](#7-ui-metadata-reference)
8. [Rules reference](#8-rules-reference)
9. [Submission model](#9-submission-model)
10. [Backend contract](#10-backend-contract)
11. [TypeScript types](#11-typescript-types)
12. [Naming conventions](#12-naming-conventions)
13. [Examples](#13-examples)
14. [Changelog](#14-changelog)

---

## 1. Design principles

| Principle | Description |
|-----------|-------------|
| **Nested sections** | Top-level `sections[]` contain `children[]`. Repeatable cycles are nested `section` blocks with a `repeat` property — not a separate component type. |
| **Four layers** | Definition (`id`, `type`, structure), UI (`ui`, `meta`, `designSystem`), rules (`validation`, `visibleWhen`, `formula`, `dataSource`, `repeat`, `action`), submission (`data` — primitives only). |
| **Single UI library** | Every block type maps to one component in `ui/components/common`. The schema engine registry imports from common only — no duplicate component tree. |
| **Semantic tokens** | Colors, spacing, icons use named tokens from `ui.designSystem`. Raw hex/px only via `ui.sx`. |
| **Stable IDs** | `id` is the persistence key in saved form data. Titles and labels may change freely. |
| **Domain-neutral engine** | No `CastingForm`, `CuringForm`, `MixingForm`. Page shells fetch schema and pass `apiContext` / `setupContext`. |
| **Declarative behavior** | Add/delete rows, cycles, and columns are JSON configuration — not hardcoded per module. |

```
Backend (MongoDB versioned schemas)
        │
        ▼
   PP-Schema v2 JSON
        │
        ▼
  schema-engine/SchemaRenderer
        │
        ├── registry/  (prop mapping only)
        └── imports ui/components/common
```

---

## 2. Root document

### Schema envelope

```json
{
  "schemaVersion": "2.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "meta": {
    "title": "Curing Form",
    "description": "Record curing cycles and post-curing observations."
  },
  "data": {
    "ui": {
      "layout": "accordion",
      "gap": "md",
      "sectionVariant": "card",
      "sectionBorderRadius": "sm",
      "designSystem": { },
      "accordion": {
        "defaultExpanded": true,
        "allowMultipleExpanded": true,
        "expandIcon": "expand_more"
      }
    },
    "context": {
      "subDepartmentId": "{{subDepartmentId}}",
      "motorId": "{{motorId}}",
      "motorStage": 1
    },
    "sections": [ ]
  }
}
```

### HTTP response wrapper (API fetch)

```json
{
  "success": true,
  "statusCode": 200,
  "schemaVersion": "2.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "message": "Schema fetched successfully",
  "timestamp": "2026-06-13T10:00:00Z",
  "meta": { "title": "Curing Form" },
  "data": {
    "ui": { "layout": "accordion" },
    "context": { "motorStage": 1 },
    "sections": [ ]
  }
}
```

When nested in a standard API wrapper, identification fields (`schemaVersion`, `schemaType`, `functionality`, `meta`) may appear at the HTTP root alongside `data`. The engine reads `data.sections[]`, `data.ui`, and `data.context` after unwrapping the API response.

### Root properties

| Property | Required | Layer | Description |
|----------|----------|-------|-------------|
| `schemaVersion` | Yes | Definition | Must be `"2.0"`. |
| `schemaType` | Yes | Definition | Domain: `RAW_MATERIALS`, `CASE_PREPARATION`, `CASTING`, `CURING`, `MOCK_TRIAL`, etc. |
| `functionality` | Yes | Definition | Action key, e.g. `CREATE_CURING_FORM`. |
| `meta` | No | UI | Page title and description. |
| `data` | Yes | — | Payload object — see below. |

### `data` payload properties

| Property | Required | Layer | Description |
|----------|----------|-------|-------------|
| `data.ui` | No | UI | Layout, design tokens, accordion config. |
| `data.context` | No | Rules | Non-UI metadata for `{{token}}` injection. |
| `data.sections` | Yes | Definition | Top-level section array. |

---

## 3. Four layers

| Layer | Lives in schema JSON | Never in submitted `data` |
|-------|----------------------|---------------------------|
| **Definition** | `id`, `type`, `fieldType`, `columns`, `children`, `data.sections` | |
| **UI metadata** | `ui`, `meta`, `data.ui.designSystem` | |
| **Business rules** | `validation`, `visibleWhen`, `formula`, `dataSource`, `repeat`, `rows`, `action` | |
| **Submission** | | `{ "TEMPERATURE": 120 }` — primitives only |

---

## 4. Section model

Top-level and nested sections share the same shape. A section is a titled container with optional repeat behavior.

```json
{
  "id": "curingCycles",
  "title": "Section A: Curing Cycle",
  "ui": {
    "variant": "card",
    "icon": "thermostat",
    "iconColor": "primary",
    "padding": "md",
    "expanded": true
  },
  "visibleWhen": {
    "when": [{ "field": "STATION", "op": "NOT_EMPTY" }],
    "logic": "AND"
  },
  "repeat": {
    "defaultCount": 1,
    "min": 1,
    "max": 20,
    "allowAdd": true,
    "allowDelete": true,
    "label": "Cycle {index}",
    "addLabel": "Add Cycle",
    "deleteLabel": "Remove Cycle"
  },
  "children": [ ]
}
```

### Section properties

| Property | Required | Layer | Description |
|----------|----------|-------|-------------|
| `id` | Yes | Definition | Stable persistence key. |
| `title` | Yes | UI | Section heading. Supports `{index}` when `repeat` is set. |
| `ui` | No | UI | Card variant, icon, padding, grid layout for field children. |
| `repeat` | No | Rules | Makes this section repeatable (replaces v1 `repeatable` component). |
| `visibleWhen` | No | Rules | Conditional show/hide for entire section. |
| `children` | Yes | Definition | Array of child blocks ([§5](#5-child-block-types)). |

### Repeatable pattern (replaces v1 `repeatable`)

v1:
```
section → repeatable → table
```

v2:
```
section → section [repeat] → table
```

**Curing cycles example:**

```json
{
  "id": "curingCycles",
  "title": "Curing Cycles",
  "ui": { "variant": "card", "icon": "thermostat" },
  "children": [
    {
      "type": "section",
      "id": "cycle",
      "title": "Cycle {index}",
      "repeat": {
        "defaultCount": 1,
        "min": 1,
        "max": 20,
        "allowAdd": true,
        "allowDelete": true,
        "label": "Cycle {index}"
      },
      "children": [
        {
          "type": "table",
          "id": "CURING_TABLE",
          "rows": { "defaultCount": 10, "allowAdd": true, "allowDelete": true },
          "columns": [ ]
        }
      ]
    }
  ]
}
```

**Fixed mix count from setup context:**

```json
"repeat": {
  "defaultCount": "{{finalMixCount}}",
  "min": "{{finalMixCount}}",
  "max": "{{finalMixCount}}",
  "allowAdd": false,
  "allowDelete": false,
  "label": "Final Mix {index}"
}
```

Supported context tokens: `finalMixCount`, `motorId`, `castingType`, `castingStation`, `subDepartmentId`, `batchId`.

When resolved `min === max`, add/remove controls are hidden regardless of `allowAdd` / `allowDelete`.

---

## 5. Child block types

Child blocks appear in `section.children[]` (or nested `section.children[]` inside a repeat).

| `type` | Purpose |
|--------|---------|
| `section` | Nested titled container; may have `repeat`. |
| `field` | Single input control. |
| `table` | Editable data table with `columns[]`. |
| `group` | Repeatable flat field rows (replaces v1 `dynamicGroup` / `nestedGroup`). |
| `matrix` | Fixed row metadata + API-driven dynamic columns (curing project × stage). |
| `button` | Action trigger. |
| `display` | Read-only label, heading, badge, alert. |

### Block tree patterns

**Form section (flat fields):**
```
section
  └── field (text)
  └── field (dropdown)
  └── field (date)
```

**Table with column groups:**
```
section
  └── table
        ├── column (serial)
        ├── group
        │     ├── column (number)
        │     └── column (number)
        ├── column (number)          ← standalone between groups preserves order
        └── group
              └── column (formula)
```

**Repeatable + sibling table (Casting Section B):**
```
section [CASTING_PROCESS]
  ├── section [FINAL_MIX]  repeat
  │     └── table [BOWL_DETAILS]
  └── table [CASTING_FROM_BOWL_DETAILS]
```

**Project × stage matrix (curing):**
```
section [CURING_SETUP]
  └── matrix [PROJECT_STAGE_MATRIX]
```

---

## 6. Component catalog

Each entry lists the **common component** the schema engine registry imports. Components marked *planned* are added to `ui/components/common/` during Phase 2 implementation.

---

### 6.1 Field blocks — `type: "field"`

#### `fieldType: "text"`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | yes | Data key |
| `type` | `"field"` | yes | |
| `fieldType` | `"text"` | yes | |
| `label` | string | yes | |
| `validation.pattern` | string | no | Regex |
| `ui.colSpan` | object | no | Grid span `{ xs, sm, md, lg }` |

**JSON sample:**
```json
{
  "type": "field",
  "id": "MOTOR_ID",
  "fieldType": "text",
  "label": "Motor Id No.",
  "validation": { "required": true, "pattern": "^[A-Z0-9-]+$", "message": "Enter a valid motor ID" },
  "ui": { "colSpan": { "xs": 12, "sm": 6, "md": 4 }, "width": "200px" }
}
```

**Maps to:** [`FormInput`](../src/ui/components/common/FormInput.tsx) (existing)

---

#### `fieldType: "number"` / `"decimal"`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `unit` | string | no | Shown as suffix, e.g. `"°C"`, `"kg"` |
| `validation.min` / `max` | number | no | |

**JSON sample:**
```json
{
  "type": "field",
  "id": "TEMPERATURE",
  "fieldType": "number",
  "label": "Temperature",
  "unit": "°C",
  "validation": { "required": true, "min": 0, "max": 2000 }
}
```

**Maps to:** [`FormInput`](../src/ui/components/common/FormInput.tsx) with `type="number"` (existing)

---

#### `fieldType: "textarea"`

**JSON sample:**
```json
{
  "type": "field",
  "id": "OTHER_OBSERVATIONS",
  "fieldType": "textarea",
  "label": "Any Other Observations",
  "ui": { "colSpan": { "xs": 12 }, "flex": "1 1 100%" }
}
```

**Maps to:** [`FormInput`](../src/ui/components/common/FormInput.tsx) `multiline` (existing)

---

#### `fieldType: "password"`

**Maps to:** [`FormInput`](../src/ui/components/common/FormInput.tsx) `type="password"` (existing)

---

#### `fieldType: "date"` / `"time"` / `"datetime"`

| Stored format | Example |
|---------------|---------|
| date | `DD-MM-YYYY` |
| time | `HH:mm` |
| datetime | `DD-MM-YYYY HH:mm` |

**JSON sample:**
```json
{
  "type": "field",
  "id": "DECORING_DATE",
  "fieldType": "date",
  "label": "Date Of De-Coring",
  "validation": { "required": true }
}
```

**Maps to:** `DateField`, `TimeField`, `DateTimeField` in common (*planned*)

---

#### `fieldType: "dropdown"`

**Static options:**
```json
{
  "type": "field",
  "id": "CASE_CONDITION",
  "fieldType": "dropdown",
  "label": "Case Condition",
  "dataSource": {
    "type": "static",
    "options": [
      { "label": "Acceptable", "value": "ACCEPTABLE" },
      { "label": "Rejected", "value": "REJECTED" }
    ]
  }
}
```

**API options:**
```json
{
  "type": "field",
  "id": "BUILDING_NO",
  "fieldType": "dropdown",
  "label": "Building No",
  "dataSource": {
    "type": "api",
    "api": {
      "endpoint": "BUILDING_MASTER",
      "method": "POST",
      "requestBody": { "subDepartmentId": "{{subDepartmentId}}" },
      "responsePath": "data.buildings",
      "displayKey": "buildingName",
      "valueKey": "buildingId"
    }
  }
}
```

**Maps to:** [`Dropdown`](../src/ui/components/common/Dropdown.tsx) (existing)

---

#### `fieldType: "radio"` / `"checkbox"` / `"switch"`

**Maps to:** `RadioGroupField`, `CheckboxField`, `SwitchField` in common (*planned*; may use MUI directly via registry glue)

---

#### `fieldType: "file"` / `"image"`

**Maps to:** [`FileUploadButton`](../src/ui/components/common/FileUploadButton.tsx), [`MediaUpload`](../src/ui/components/common/MediaUpload.tsx) (existing)

Stored value: comma-separated filenames.

---

#### `fieldType: "formula"` (field-level, rare)

Read-only computed value outside a table.

```json
{
  "type": "field",
  "id": "TOTAL_WEIGHT",
  "fieldType": "formula",
  "label": "Total Weight",
  "formula": { "expression": "INITIAL + ADDED", "dependencies": ["INITIAL", "ADDED"] },
  "readonly": true
}
```

**Maps to:** `FormulaCell` in common (*planned*)

---

### 6.2 Table block — `type: "table"`

Editable grid with column definitions and row behavior.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | yes | Data key for row array |
| `type` | `"table"` | yes | |
| `label` | string | no | Table caption |
| `rows` | object | no | Row count rules ([§8.3](#83-rows-config)) |
| `columns` | array | yes | Column or group slots |

**JSON sample:**
```json
{
  "type": "table",
  "id": "CURING_TABLE",
  "label": "Curing Cycle Readings",
  "rows": {
    "defaultCount": 10,
    "min": 1,
    "max": 50,
    "allowAdd": true,
    "allowDelete": true,
    "autoIncrementKey": "srNo"
  },
  "columns": [
    {
      "type": "column",
      "id": "srNo",
      "fieldType": "serial",
      "label": "S.No",
      "readonly": true,
      "ui": { "width": "60px" }
    },
    {
      "type": "column",
      "id": "TEMPERATURE",
      "fieldType": "number",
      "label": "Temperature",
      "unit": "°C",
      "validation": { "min": 0, "max": 200 }
    },
    {
      "type": "group",
      "id": "PRESSURE_GROUP",
      "label": "Pressure Readings",
      "columns": [
        { "type": "column", "id": "INITIAL", "fieldType": "number", "label": "Initial", "unit": "bar" },
        { "type": "column", "id": "FINAL", "fieldType": "number", "label": "Final", "unit": "bar" }
      ]
    }
  ]
}
```

**Maps to:** `DynamicTable` in common (*planned*)

#### Table column — `type: "column"`

Same field types as field blocks. Additional column-only types:

| `fieldType` | Purpose | Maps to |
|-------------|---------|---------|
| `serial` | Auto-increment row number (key: `srNo` or `rows.autoIncrementKey`) | inline in DynamicTable |
| `static` | Read-only label from `defaultValues[rowIndex]` | typography cell in DynamicTable |
| `formula` | Computed cell from row fields | `FormulaCell` |
| `dynamic` | Type resolved per row (from `presetRows`) | cell renderer in DynamicTable |

**Static activity column example:**
```json
{
  "type": "column",
  "id": "ACTIVITY",
  "fieldType": "static",
  "label": "Activity",
  "defaultValues": [
    "Soaking Time",
    "Time of removal from pit",
    "Fixtures assembled for curing"
  ]
}
```

**Formula column example:**
```json
{
  "type": "column",
  "id": "C_MOCK",
  "fieldType": "formula",
  "label": "Mock assy.",
  "formula": { "expression": "A_MOCK-B_MOCK", "dependencies": ["A_MOCK", "B_MOCK"] },
  "readonly": true
}
```

---

### 6.3 Matrix block — `type: "matrix"`

Fixed row identity columns + dynamically loaded stage columns. Replaces the bespoke `CuringProjectStageMatrix` page component.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | yes | Data key |
| `type` | `"matrix"` | yes | |
| `rowFields` | array | yes | Read-only or editable row metadata columns |
| `columns` | dataSource | yes | API source for dynamic column headers |
| `rows` | object | no | Row add/delete rules |
| `allowAddColumn` | boolean | no | User can add custom stage columns |
| `allowDeleteColumn` | boolean | no | User can remove custom columns |

**JSON sample:**
```json
{
  "type": "matrix",
  "id": "PROJECT_STAGE_MATRIX",
  "title": "Curing Time Per Stage (minutes)",
  "rowFields": [
    { "id": "projectName", "label": "Project", "readonly": true },
    { "id": "batchId", "label": "Batch", "readonly": true },
    { "id": "motorId", "label": "Motor", "readonly": true }
  ],
  "columns": {
    "type": "api",
    "api": {
      "endpoint": "MOTORS_STAGE_LIST",
      "method": "GET",
      "requestBody": { "subDepartmentId": "{{subDepartmentId}}" },
      "responsePath": "data",
      "displayKey": "motorStage",
      "valueKey": "motorStage"
    }
  },
  "rows": { "defaultCount": 1, "allowAdd": true, "allowDelete": true },
  "allowAddColumn": true,
  "allowDeleteColumn": true
}
```

**Runtime data shape:**
```json
{
  "PROJECT_STAGE_MATRIX": {
    "columns": [
      { "columnKey": "stage-Stage_1-0", "stage": "Stage 1" },
      { "columnKey": "stage-Stage_2-1", "stage": "Stage 2", "isCustom": true }
    ],
    "rows": [
      {
        "_rowKey": "row-1",
        "projectName": "Project Alpha",
        "batchId": "BATCH-123",
        "motorId": "MTR-001",
        "cells": { "stage-Stage_1-0": "60", "stage-Stage_2-1": "45" }
      }
    ]
  }
}
```

**Maps to:** `MatrixTable` in common (*planned*)

---

### 6.4 Group block — `type: "group"`

Repeatable flat field rows. Replaces v1 `dynamicGroup` and `nestedGroup`.

```json
{
  "type": "group",
  "id": "LOT_ROWS",
  "label": "Lot",
  "groupKey": "lots",
  "repeat": {
    "defaultCount": 1,
    "min": 1,
    "max": 10,
    "allowAdd": true,
    "allowDelete": true,
    "label": "Lot {index}"
  },
  "ui": { "direction": "row", "wrap": true, "gap": "md" },
  "children": [
    { "type": "field", "id": "LOT_ID", "fieldType": "dropdown", "label": "Lot ID", "dataSource": { "type": "api", "api": { "endpoint": "material-lots" } } },
    { "type": "field", "id": "QUANTITY_USED", "fieldType": "number", "label": "Quantity Used", "unit": "kg" }
  ]
}
```

**Maps to:** [`FormCard`](../src/ui/components/common/FormCard.tsx) + field children from common (existing)

---

### 6.5 Button block — `type: "button"`

```json
{
  "type": "button",
  "id": "SAVE_DRAFT",
  "label": "Save Draft",
  "variant": "secondary",
  "action": { "type": "save_draft" }
}
```

**Action types:** `submit`, `save_draft`, `reset`, `cancel`, `api`, `navigate`, `custom`

**Maps to:** [`Button`](../src/ui/components/common/Button.tsx) (existing)

---

### 6.6 Display block — `type: "display"`

```json
{
  "type": "display",
  "id": "STATUS_BADGE",
  "displayType": "badge",
  "label": "Status",
  "value": "In Progress"
}
```

| `displayType` | Maps to |
|---------------|---------|
| `badge` | [`StatusChip`](../src/ui/components/common/StatusChip.tsx) |
| `alert` | [`GlobalAlert`](../src/ui/components/common/GlobalAlert.tsx) |
| `label`, `heading`, `description` | MUI Typography via registry |

---

### 6.7 Layout components (common — used by schema-engine layout/)

| Purpose | Common component | Status |
|---------|------------------|--------|
| Section card shell | [`FormCard`](../src/ui/components/common/FormCard.tsx), [`Card`](../src/ui/components/common/Card.tsx) | existing |
| Section title | [`SectionHeader`](../src/ui/components/common/SectionHeader.tsx) | existing |
| Accordion panel | `AccordionSection` | planned |
| Responsive field grid | `GridFields` | planned |
| Horizontal field row | [`StackRow`](../src/ui/components/common/StackRow.tsx) | existing |
| Inline errors | [`ErrorMessage`](../src/ui/components/common/ErrorMessage.tsx) | existing |
| Confirm dialog | [`ConfirmAlertDialog`](../src/ui/components/common/ConfirmAlertDialog.tsx) | existing |

---

### 6.8 Future types (spec now — add to common + registry when needed)

Document in backend schema builder; one new common component + one registry line each:

**Input:** `currency`, `multi_select`, `autocomplete`, `search`, `color`, `signature`  
**Layout:** `tabs`, `stepper`, `wizard`, `divider`, `panel`, `row`, `column`  
**Display:** `kpi`, `pdf_viewer`, `timeline`, `audit`  
**Buttons:** `approve`, `reject`, `download`, `print`  
**Table variants:** `paginated_table`, `master_detail`, `tree_table`  
**Manufacturing:** `weightment`, `temperature`, `pressure`, `timer`, `process_step`, `machine_select`, `qc_result`, `accept_reject`, `sign_off`

---

## 7. UI metadata reference

### Root `ui` (`data.ui`)

| Property | Values | Default | Description |
|----------|--------|---------|-------------|
| `layout` | `flat`, `accordion`, `tabs`, `wizard` | `flat` | Page layout mode |
| `gap` | spacing token | `md` | Gap between section cards |
| `sectionVariant` | `card`, `plain`, `outlined` | `card` | Default section container style |
| `sectionBorderRadius` | `sm`, `md`, `lg` | `md` | Default corner radius token |
| `designSystem` | object | — | Document-level design tokens |
| `accordion` | object | — | Accordion behaviour when `layout` is `accordion` |

### `ui.designSystem`

```json
{
  "colors": {
    "primary": "#1565C0",
    "surface": "#F4F6F8",
    "border": "#D5D8DC",
    "text": "#1C2833",
    "textSub": "#5D6D7E",
    "danger": "#C62828",
    "success": "#2E7D32"
  },
  "typography": {
    "fontFamily": "'DM Sans', sans-serif",
    "scale": { "xs": "0.68rem", "sm": "0.78rem", "md": "0.86rem", "lg": "0.98rem" },
    "label": { "size": "xs", "weight": 700, "transform": "uppercase", "letterSpacing": "0.04em" }
  },
  "spacing": { "xs": 4, "sm": 8, "md": 12, "lg": 16, "xl": 24 },
  "radius": { "sm": 7, "md": 11, "lg": 16 },
  "icons": { "sectionDefault": "description", "curing": "thermostat" }
}
```

### Section / block `ui`

| Property | Values | Description |
|----------|--------|-------------|
| `variant` | `card`, `plain`, `outlined` | Container style |
| `density` | `compact`, `comfortable` | Input/row padding |
| `icon` | Material icon name | Section icon |
| `iconColor` | color token | Icon color |
| `borderRadius` | `sm`, `md`, `lg` | Overrides `ui.sectionBorderRadius` |
| `colSpan` | `{ xs, sm, md, lg }` | 12-column grid span for fields |
| `width` / `minWidth` / `maxWidth` | CSS width | Column or field width |
| `direction` | `row`, `column` | Flex direction for child fields |
| `wrap` | boolean | Flex wrap |
| `expanded` | boolean | Initial accordion panel state |
| `sx` | object | MUI sx escape hatch |

**Border radius resolution chain:**
```
block.ui.borderRadius  →  ui.sectionBorderRadius  →  "md"  →  designSystem.radius[token]
```

---

## 8. Rules reference

### 8.1 Validation

```json
{
  "validation": {
    "required": true,
    "min": 0,
    "max": 200,
    "pattern": "^[A-Z0-9-]+$",
    "message": "Enter a valid motor ID"
  }
}
```

| Property | Applies to |
|----------|------------|
| `required` | All field types |
| `min` / `max` | `number`, `decimal` |
| `pattern` | `text` (regex) |
| `message` | Custom error message |

### 8.2 Visibility — `visibleWhen`

```json
{
  "visibleWhen": {
    "when": [
      { "field": "CASTING_TYPE", "op": "EQ", "value": "Pair" },
      { "field": "STATION", "op": "NOT_EMPTY" }
    ],
    "logic": "AND"
  }
}
```

| `op` | Aliases | True when |
|------|---------|-----------|
| `EQ` | `EQUAL`, `EQUALS` | Field equals `value` |
| `NEQ` | `NOT_EQUAL` | Field does not equal `value` |
| `EMPTY` | `IS_EMPTY` | Field is blank |
| `NOT_EMPTY` | `IS_NOT_EMPTY` | Field is not blank |
| `IN` | — | Field value in `value` array |

Hidden field values are cleared when the condition becomes false.

### 8.3 Rows config — `rows` on tables and matrices

| Property | Description |
|----------|-------------|
| `defaultCount` | Initial row count. When `presetRows` is present, the engine uses `max(defaultCount, presetRows.length)`. |
| `min` / `max` | Row count limits |
| `allowAdd` / `allowDelete` | Row add/delete controls |
| `autoIncrementKey` | Serial column key (default `srNo`) |
| `presetRows` | Seed one or more rows with column values and optional row metadata (see below) |

#### `presetRows` — seeding and readonly rules

Each entry in `presetRows` is a **partial row object**. Keys must match table **column `id`** values (e.g. `OPERATION`, `SET_PARAMETER`, `RESULT`). The following **metadata keys** are reserved and are not column ids:

| Key | Purpose |
|-----|---------|
| `type: "header"` | Renders a full-width section header row (uses `label`) — not a data row |
| `readonly: true` | Locks **only the columns listed in that preset object** (excluding metadata keys) |
| `label` | Header text when `type` is `"header"` |

**Initialization (engine):**

1. Row count = `max(defaultCount, presetRows.length)`.
2. For each row index, merge `presetRows[i]` into the row by column id.
3. Columns not present in the preset fall back to `defaultValue` / `defaultValues[rowIndex]` on the column definition.
4. `autoIncrementKey` (default `srNo`) is set to `rowIndex + 1` unless the preset provides it.
5. When `readonly: true`, the engine stores runtime metadata on the row:
   - `_readonly: true`
   - `_readonlyColumns: ["OPERATION", "SET_PARAMETER", ...]` — column ids from the preset object only

**UI rendering (engine):**

| Condition | Rendered as |
|-----------|-------------|
| Column `fieldType` is `static`, `serial`, or `formula` | Read-only display text (`FormulaCell`) — always |
| Column `readonly: true` on column definition | Read-only display text — always |
| Column id is in `_readonlyColumns` for that row | Read-only display text — **not** a `TextField` |
| All other columns | Normal editor for `fieldType` (`TextField`, `number`, `datetime`, etc.) |

**Important:** `readonly: true` on a preset row does **not** lock the entire row. Columns omitted from the preset (e.g. `ACTUAL_PARAMETER`, `RESULT`) remain editable.

**Row add/delete:**

| Action | Behaviour |
|--------|-----------|
| User adds a row | New row starts empty; preset metadata is **not** copied |
| User deletes a row | Allowed unless `allowDelete: false` or row count ≤ `min` |
| Preset row with `readonly: true` | **Remove** button disabled for that row |

**Multiline preset text:** newline characters in preset values (e.g. `"Temp:65±2°C\nDuration:90 min"`) are preserved and displayed with line breaks.

**Blending table example (preset labels + editable actuals):**

```json
"rows": {
  "defaultCount": 2,
  "allowAdd": true,
  "allowDelete": true,
  "autoIncrementKey": "srNo",
  "presetRows": [
    {
      "readonly": true,
      "OPERATION": "Hot Water Circulation Temperature Set",
      "SET_PARAMETER": "75±5°C"
    },
    {
      "readonly": true,
      "OPERATION": "Material Quantity",
      "SET_PARAMETER": "Total Quantity from various lots"
    }
  ]
},
"columns": [
  { "type": "column", "id": "srNo", "fieldType": "serial", "label": "Sr No." },
  { "type": "column", "id": "OPERATION", "fieldType": "text", "label": "Operation" },
  { "type": "column", "id": "SET_PARAMETER", "fieldType": "text", "label": "Set Parameter" },
  { "type": "column", "id": "ACTUAL_PARAMETER", "fieldType": "text", "label": "Actual Parameter" }
]
```

- `OPERATION` and `SET_PARAMETER` → read-only display (from preset, `readonly: true`)
- `ACTUAL_PARAMETER` → editable `TextField` (not in preset)

**PSD table example (static preset labels + editable result):**

```json
"presetRows": [
  { "readonly": true, "PSD_REQUIREMENT": "Above 500 µm, % max", "SPECIFICATION": "5" },
  { "readonly": true, "PSD_REQUIREMENT": "500-355 µm, %", "SPECIFICATION": "27±5" }
],
"columns": [
  { "id": "PSD_REQUIREMENT", "fieldType": "static", "label": "PSD/PS Required" },
  { "id": "SPECIFICATION", "fieldType": "static", "label": "Specification" },
  { "id": "RESULT", "fieldType": "number", "label": "Result" }
]
```

- `PSD_REQUIREMENT` / `SPECIFICATION` → read-only (static `fieldType` **and** preset `readonly`)
- `RESULT` → editable number input (not listed in preset)

**Header row example:**

```json
"presetRows": [
  { "type": "header", "label": "Important Measurements" },
  { "readonly": true, "OPERATION": "Drying", "SET_PARAMETER": "65±2°C" }
]
```

#### `presetRows` vs column `defaultValues`

| Mechanism | Use when |
|-----------|----------|
| `presetRows` | Multi-column row templates, optional per-row `readonly`, header rows |
| Column `defaultValues[]` | Single-column static labels per row index (`fieldType: "static"`) |

Both can coexist; `presetRows` values take precedence for columns present in the preset object.

#### Runtime-only table row keys (not submitted)

| Key | Purpose |
|-----|---------|
| `_rowType` | `"header"` for header rows |
| `_headerLabel` | Header row display text |
| `_readonly` | Row originated from a `readonly: true` preset |
| `_readonlyColumns` | Column ids locked by preset `readonly` |

These keys are stripped from submission payloads. Repeat-instance `_key` **is** submitted.

### 8.4 Repeat config — `repeat` on sections and groups

| Property | Description |
|----------|-------------|
| `defaultCount` | Initial instance count. Accepts numbers or `{{token}}`. |
| `min` / `max` | Instance limits. Accepts numbers or `{{token}}`. |
| `allowAdd` / `allowDelete` | Add/remove instance controls |
| `label` | Instance label. `{index}` is 1-based. |
| `addLabel` / `deleteLabel` | Button labels |

### 8.5 Formula — `formula`

```json
{
  "formula": {
    "expression": "A_MOCK-B_MOCK",
    "dependencies": ["A_MOCK", "B_MOCK"]
  }
}
```

Expression uses row field keys. Recalculated on dependency change. Read-only in UI.

### 8.6 DataSource — `dataSource`

**Static:**
```json
{ "type": "static", "options": ["ON", "OFF", "NOT_APPLICABLE"] }
```

**API:**
```json
{
  "type": "api",
  "api": {
    "endpoint": "BUILDING_MASTER",
    "method": "POST",
    "requestBody": { "subDepartmentId": "{{subDepartmentId}}" },
    "responsePath": "data.buildings",
    "displayKey": "buildingName",
    "valueKey": "buildingId"
  }
}
```

**Known endpoint aliases:**

| Alias | Resolves to |
|-------|-------------|
| `casting-station` | Casting station list (GET) |
| `material-lots` | Post-cure material lots (`POST /user/post-cure/material-lots`, body: `{ batchId }`) |
| `BUILDING_MASTER` | Building master |
| `MOTORS_STAGE_LIST` | Motor stage list for matrix columns (GET) |

`{{subDepartmentId}}`, `{{batchId}}`, `{{motorId}}` replaced from form `apiContext`.

---

## 9. Submission model

### Runtime form state

Values keyed by block `id`:

```json
{
  "OTHER_OBSERVATIONS": "None",
  "SHORE_A_HARDNESS": "72",
  "cycle": [
    {
      "_key": "cycle-1",
      "CURING_TABLE": [
        { "srNo": 1, "TEMPERATURE": "65", "DURATION": "120", "START_DATE": "05-06-2026" }
      ]
    }
  ],
  "PROJECT_STAGE_MATRIX": {
    "columns": [ ],
    "rows": [ ]
  }
}
```

### Value shape by block type

| Block | Runtime shape |
|-------|---------------|
| `field` | `{ [fieldId]: primitive }` |
| `table` | `{ [tableId]: [ row, row, ... ] }` |
| `section` + `repeat` | `{ [sectionId]: [ { _key, ...childData }, ... ] }` |
| `group` + `repeat` | `{ [groupId]: [ { _key, ...fields }, ... ] }` |
| `matrix` | `{ [matrixId]: { columns: [...], rows: [...] } }` |

**Static column values:** stored under column `id` in each row, seeded from `defaultValues` or `presetRows`, readonly in UI when `fieldType` is `static` or column is in `_readonlyColumns`.

**Table row runtime metadata:** keys `_rowType`, `_headerLabel`, `_readonly`, `_readonlyColumns` may exist in form state but are stripped on submit (see §8.3).

### Submission payload

```json
POST /submission
{
  "schemaId": "curing_001",
  "schemaVersion": "2.0",
  "batchId": "BATCH-123",
  "motorId": "MTR-001",
  "data": {
    "OTHER_OBSERVATIONS": "None",
    "cycle": [
      { "_key": "cycle-1", "CURING_TABLE": [ { "srNo": 1, "TEMPERATURE": "65" } ] }
    ]
  }
}
```

Only **primitives** in `data` — no `ui`, `validation`, or `designSystem`.

### Per-motor wrapping (case preparation)

```json
{
  "motors": [
    {
      "motorId": "MTR-A-001",
      "data": {
        "LINEAR_COATING": [ { "srNo": 1, "actualValue": "12.5" } ]
      }
    }
  ]
}
```

---

## 10. Backend contract

### MongoDB `schemas` collection

```json
{
  "_id": "curing_001",
  "version": 3,
  "status": "ACTIVE",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "schema": {
    "schemaVersion": "2.0",
    "schemaType": "CURING",
    "functionality": "CREATE_CURING_FORM",
    "meta": { "title": "Curing Form" },
    "data": {
      "ui": { "layout": "accordion" },
      "context": { },
      "sections": [ ]
    }
  }
}
```

Never overwrite — append version, mark old `DEPRECATED`.

### Schema fetch request

```json
{
  "schemaVersion": "2.0",
  "schemaType": "CURING",
  "functionality": "CREATE_CURING_FORM",
  "subdepartmentId": 111,
  "motorStage": 1
}
```

| Module | Extra request fields |
|--------|---------------------|
| Raw material | `materialId`, `gradeId`, `materialCode` |
| Case preparation | `batchType` |
| Casting / curing | `motorStage`, `subdepartmentId` |

---

## 11. TypeScript types

Canonical types live in [`src/schema-engine/types/`](../src/schema-engine/types/). Key interfaces:

```typescript
export type SchemaPayload = {
  ui?: SchemaRootUi;
  context?: SchemaContext;
  sections: SchemaSection[];
};

export type SchemaDocumentV2 = {
  schemaVersion: "2.0";
  schemaType: string;
  functionality: string;
  meta?: SchemaMeta;
  data: SchemaPayload;
};

export type SchemaSection = {
  id: string;
  title: string;
  ui?: SchemaUiConfig;
  repeat?: SchemaRepeatConfig;
  visibleWhen?: SchemaVisibleWhen;
  children: SchemaBlock[];
};

export type SchemaBlock =
  | SchemaFieldBlock
  | SchemaTableBlock
  | SchemaMatrixBlock
  | SchemaButtonBlock
  | SchemaDisplayBlock
  | SchemaGroupBlock
  | SchemaSectionBlock;

export type SchemaFieldBlock = {
  type: "field";
  id: string;
  fieldType: SchemaFieldType;
  label: string;
  unit?: string;
  ui?: SchemaUiConfig;
  validation?: SchemaValidation;
  visibleWhen?: SchemaVisibleWhen;
  dataSource?: SchemaDataSource;
  formula?: SchemaFormula;
  readonly?: boolean;
};

export type SchemaTableBlock = {
  type: "table";
  id: string;
  label?: string;
  rows?: SchemaRowsConfig;
  columns: SchemaTableColumnSlot[];
};

export type SchemaMatrixBlock = {
  type: "matrix";
  id: string;
  rowFields: SchemaMatrixRowField[];
  columns: SchemaDataSource;
  rows?: SchemaRowsConfig;
  allowAddColumn?: boolean;
  allowDeleteColumn?: boolean;
};
```

Full definitions: [`schema.types.ts`](../src/schema-engine/types/schema.types.ts), submission shapes: [`formData.types.ts`](../src/schema-engine/types/formData.types.ts).

---

## 12. Naming conventions

| Rule | Example |
|------|---------|
| Section / block `id` | `SCREAMING_SNAKE_CASE` — `CURING_CYCLES`, `POST_CURING_DETAILS` |
| Nested repeat section `id` | Short camelCase OK — `cycle`, `finalMix` |
| Field keys in table rows | `SCREAMING_SNAKE_CASE` |
| Serial number key | `srNo` (or `rows.autoIncrementKey`) |
| Date / time / datetime | `DD-MM-YYYY`, `HH:mm`, `DD-MM-YYYY HH:mm` |
| Dropdown stored value | Option `value`, not display label |
| `schemaType` | `SCREAMING_SNAKE_CASE` |
| `functionality` | `CREATE_<MODULE>_FORM` |

---

## 13. Examples

Full v2 JSON examples in [`docs/examples/`](examples/):

| File | Description |
|------|-------------|
| [`curing-schema.v2.json`](examples/curing-schema.v2.json) | Curing cycles (nested repeat section + table), post-curing fields, de-coring, project×stage matrix |
| [`casting-form.v2.json`](examples/casting-form.v2.json) | Accordion layout, grouped measurement table with formulas, repeatable mix cycles + sibling bowl table, static activity column |
| [`case-prep-form.v2.json`](examples/case-prep-form.v2.json) | Form fields, repeatable lot group, coating table, drum nested group |
| [`rmp-schema.v2.json`](examples/rmp-schema.v2.json) | Raw material prep: premix repeat sections, solid/liquid process tables |

The engine reads v2 only. All examples use the `data` wrapper for `ui`, `context`, and `sections`.

---

## 14. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 2.0.1 | 2026-06-13 | `ui`, `context`, `sections` wrapped in root `data`; v1 examples removed |
| 2.0 | 2026-06-13 | Nested `sections[]`, four layers, single common component library, `matrix` block, no v1 normalizer |
| 1.0 | 2026-06-12 | Initial PP-Schema v1 (`data.nodes[]`, `SchemaNode`, `repeatable` component) — **superseded** |
