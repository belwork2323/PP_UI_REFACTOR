# QC Division API Contract

**Case Prep / RMP partial-approval style**

---

## Aligned with

- Endpoints the UI already calls
- Frontend create payload: `divisionDetails[].data.sections[]` (`mapQualityControlPayload`) with `motorId` / `premixNo` / `subType` on sections
- Case Prep pattern: unit `DRAFT` / `SUBMIT` while root `formSubmissionType` stays `DRAFT` until final proceed
- Extra QC layer: **unit -> division -> batch**

---

## Endpoints (current UI)

| Action  | Method | Path                                   |
|---------|--------|----------------------------------------|
| Create  | POST   | `/api/v1/user/qc-division/create`      |
| Update  | PUT    | `/api/v1/user/qc-division/update`      |
| Details | POST   | `/api/v1/user/qc-division/details`     |

---

## Enums

| Field | Values |
|-------|--------|
| `formSubmissionType` | `DRAFT`, `SUBMIT` |
| `motorSubmissionType` | `DRAFT`, `SUBMIT` |
| `premixSubmissionType` | `DRAFT`, `SUBMIT` |
| `divisionSubmissionType` | `DRAFT`, `SUBMIT` (only for division-scoped flows, e.g. revalidation) |
| `motorSubmissionStatus` / `premixSubmissionStatus` / `divisionStatus` | `TO_BE_INITIATED`, `IN_PROGRESS`, `WAITING_FOR_APPROVAL`, `APPROVED`, `REJECTED` |
| Form/batch `status` | `DRAFT`, `IN_PROGRESS`, `WAITING_FOR_PARTIAL_APPROVAL`, `WAITING_FOR_COMPLETE_APPROVAL`, `APPROVED`, `REJECTED`, `FINAL_APPROVAL_COMPLETED` |

**Do not use** `FINAL_SUBMIT` / `SUBMITTED` - match RMP/Case Prep (`DRAFT` / `SUBMIT`).

---

## Approval hierarchy

| Level | Approved when |
|-------|---------------|
| **Unit** (motor / premix / final-mix card) | Approver accepts that unit |
| **Division** | Every unit in that division is `APPROVED` |
| **Batch (QC form)** | Every division on the form is `APPROVED`, then user does final `formSubmissionType: "SUBMIT"` |

- `formSubmissionType` stays **`DRAFT`** for all unit draft/submit calls.
- Final proceed uses `formSubmissionType: "SUBMIT"` only when `allDivisionsApproved === true`.

---

## Payload model (important)

Frontend today builds:

```ts
divisionDetails: [{
  division,           // QcApiDivision
  subType,            // QcApiSubType | null
  data: { sections }  // SchemaSectionSubmission[] (+ motorId | premixNo | subType on each section)
}]
```

`SchemaSectionSubmission`:

```ts
{ sectionId: string; sectionData: unknown[]; motorId?: string; premixNo?: number; subType?: string; ... }
```

**Recommended wire format (Case Prep mirror):** wrap units explicitly under `data`, keep sections identical to schema-engine output.

```json
"data": {
  "motors": [
    {
      "motorId": "MOTOR-01",
      "motorSubmissionType": "DRAFT",
      "sections": [
        { "sectionId": "CASTING_SELECTION", "sectionData": [{ "...": "..." }] }
      ]
    }
  ]
}
```

- Premix divisions use `premixes[]` + `premixSubmissionType`.
- Backend may still accept the current flat `data.sections[]` (with `motorId`/`premixNo` on sections) during migration; **details must return the wrapped shape** so partial nav can hydrate cleanly.
- **Send only the division + unit being acted on.**

---

## Division -> unit matrix

| division | subType (examples) | Unit key | Submission field |
|----------|-------------------|----------|------------------|
| `RAW_MATERIAL_REVALIDATION` | `null` | Division itself | `divisionSubmissionType` |
| `RAW_MATERIAL_PROCESSING` | `SOLID_PROCESSING` / `LIQUID_PROCESSING` / `null` | `premixNo` | `premixSubmissionType` |
| `MIXING` | `PREMIX` / `FINAL_MIX` | `premixNo` (+ stage) | `premixSubmissionType` |
| `HARDWARE` | `ABRADING` / `PREHEATING` / `LINEAR_COATING` / `DISPATCH` | `motorId` | `motorSubmissionType` |
| `CASTING` | `null` | `motorId` | `motorSubmissionType` |
| `CURING` | `NORMAL` / `CONFINED` / `N2_PRESSURE` | `motorId` | `motorSubmissionType` |
| `DE_CORING` | `null` | `motorId` | `motorSubmissionType` |
| `TRIMMING` | `MAIN_BATCH` / `SUBSCALE` | `motorId` | `motorSubmissionType` |
| `POST_CURE` | `LOOSE_FLAP_FILLING` / `INHIBITION` | `motorId` | `motorSubmissionType` |
| `NDT` | `null` | `motorId` | `motorSubmissionType` |
| `PROPELLANT_PROPERTIES` | `MECHANICAL_PROPERTIES` / … | `motorId` | `motorSubmissionType` |
| `WEIGHTMENT` | `null` | `motorId` | `motorSubmissionType` |

---

# 1. Create Form

**`POST /api/v1/user/qc-division/create`**

## Motor division - Save Motor Draft / Submit Motor

- `formSubmissionType` stays `DRAFT` until final proceed.
- Send only the motor being acted on.

### Create - CASTING motor DRAFT

```json
{
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "CASTING",
      "subType": null,
      "data": {
        "motors": [
          {
            "motorId": "MOTOR-01",
            "motorSubmissionType": "DRAFT",
            "sections": [
              {
                "sectionId": "CASTING_SELECTION",
                "sectionData": [
                  { "CASTING_TYPE": "SINGLE" }
                ]
              },
              {
                "sectionId": "FINAL_ASSEMBLY",
                "sectionData": [
                  {
                    "ASSEMBLY_DATE": "2026-06-15",
                    "MANDREL_ASSEMBLY": {
                      "rows": [
                        {
                          "SR_NO": 1,
                          "READING_WITHOUT_CUP": "10.5",
                          "READING_WITH_BOTTOM_CUP": "12.2"
                        }
                      ]
                    }
                  }
                ]
              },
              {
                "sectionId": "PROPELLANT_CASTING",
                "sectionData": [{ "...": "schema fields / tables" }]
              },
              {
                "sectionId": "WEIGHTMENT_DETAILS",
                "sectionData": [{ "...": "..." }]
              },
              {
                "sectionId": "POST_CAST_OPERATIONS",
                "sectionData": [{ "...": "..." }]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

**Submit Motor** - same body, only change:

```json
"motorSubmissionType": "SUBMIT"
```

### Create - MIXING premix SUBMIT

```json
{
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "MIXING",
      "subType": "PREMIX",
      "data": {
        "premixes": [
          {
            "premixNo": 1,
            "premixSubmissionType": "SUBMIT",
            "sections": [
              {
                "sectionId": "PREMIX_DETAILS",
                "sectionData": [
                  {
                    "PREMIX_DETAILS": {
                      "rows": [
                        {
                          "PARAMETER": "Homogeneity",
                          "BOWL_NO": "PM-001",
                          "DATE_OF_PREMIX": "2026-06-15",
                          "VALUE": "",
                          "REMARKS": ""
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Create - RAW_MATERIAL_PROCESSING premix DRAFT

```json
{
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "RAW_MATERIAL_PROCESSING",
      "subType": "SOLID_PROCESSING",
      "data": {
        "premixes": [
          {
            "premixNo": 1,
            "premixSubmissionType": "DRAFT",
            "sections": [
              {
                "sectionId": "SOLID_PROCESSING_DETAILS",
                "sectionData": [{ "...": "solid schema sections" }],
                "subType": "SOLID_PROCESSING"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

For BOTH solid+liquid on same premix, either:

1. one create/update with two section groups (`subType` per section), or
2. two calls with `subType: "SOLID_PROCESSING"` / `"LIQUID_PROCESSING"` (UI already builds both section sets for `BOTH_PREMIX`).

### Create - RAW_MATERIAL_REVALIDATION (division-scoped, no motors/premixes)

```json
{
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "RAW_MATERIAL_REVALIDATION",
      "subType": null,
      "divisionSubmissionType": "SUBMIT",
      "data": {
        "sections": [
          {
            "sectionId": "RAW_MATERIAL_DETAILS",
            "sectionData": [
              {
                "RAW_MATERIAL_DETAILS": {
                  "rows": [
                    {
                      "INGREDIENT": "HTPB",
                      "LOT_BATCH_NUMBER": "LOT-HTPB-001",
                      "PARAMETER": "OH Value, mg KOH/g",
                      "SPECIFICATION": "40-50",
                      "RESULT": "45"
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### Proceed for Final Approval (all divisions already APPROVED)

```json
{
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "SUBMIT",
  "divisionDetails": []
}
```

(Or resend full saved `divisionDetails` from details - same as RMP/Case Prep final submit.)

---

## Create - Success response

```json
{
  "success": true,
  "statusCode": 201,
  "message": "QC division form saved successfully",
  "timestamp": "2026-06-01T20:00:00Z",
  "data": {
    "formId": "QC-F-2026-0001",
    "batchId": "BATCH-2026-001",
    "subDepartmentId": 115,
    "formSubmissionType": "DRAFT",
    "status": "IN_PROGRESS",
    "division": "CASTING",
    "subType": null,
    "motorId": "MOTOR-01",
    "motorSubmissionType": "DRAFT",
    "motorSubmissionStatus": "IN_PROGRESS",
    "divisionStatuses": [
      {
        "division": "CASTING",
        "subType": null,
        "status": "IN_PROGRESS",
        "allUnitsApproved": false,
        "pendingUnitCount": 0,
        "approvedUnitCount": 0,
        "rejectedUnitCount": 0,
        "waitingForApprovalUnitCount": 0,
        "inProgressUnitCount": 1,
        "totalUnitCount": 2
      }
    ],
    "motorStatuses": [
      {
        "division": "CASTING",
        "motorId": "MOTOR-01",
        "motorSubmissionType": "DRAFT",
        "motorSubmissionStatus": "IN_PROGRESS"
      },
      {
        "division": "CASTING",
        "motorId": "MOTOR-02",
        "motorSubmissionType": null,
        "motorSubmissionStatus": "TO_BE_INITIATED"
      }
    ],
    "premixStatuses": [],
    "allDivisionsApproved": false,
    "pendingDivisionCount": 1,
    "approvedDivisionCount": 0,
    "totalDivisionCount": 1,
    "allMotorsApproved": false,
    "pendingMotorCount": 0,
    "approvedMotorCount": 0,
    "rejectedMotorCount": 0,
    "totalMotorCount": 2,
    "submittedBy": "EMP001",
    "submittedAt": "2026-06-01T20:00:00Z"
  }
}
```

After motor **SUBMIT** ->

- `status: "WAITING_FOR_PARTIAL_APPROVAL"`
- `motorSubmissionStatus: "WAITING_FOR_APPROVAL"`
- division `status: "WAITING_FOR_PARTIAL_APPROVAL"`

For premix calls, echo `premixNo` / `premixSubmissionType` / `premixStatuses` instead of motor fields.

---

## Create - Errors

Keep existing `400` / `401` / `403` / `404` batch / `404` schema / `422` / `500`. Soften 409:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "QC division form already exists",
  "error": {
    "code": "QC_FORM_ALREADY_EXISTS",
    "details": "Use update API. Form QC-F-2026-0001 already exists for this batch"
  },
  "data": null
}
```

---

# 2. Update Form

**`PUT /api/v1/user/qc-division/update`**

Same `divisionDetails` shape as create. Identify form by `formId`.

```json
{
  "formId": "QC-F-2026-0001",
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "CASTING",
      "subType": null,
      "data": {
        "motors": [
          {
            "motorId": "MOTOR-01",
            "motorSubmissionType": "SUBMIT",
            "sections": [
              { "sectionId": "CASTING_SELECTION", "sectionData": [{ "...": "..." }] },
              { "sectionId": "FINAL_ASSEMBLY", "sectionData": [{ "...": "..." }] }
            ]
          }
        ]
      }
    }
  ]
}
```

### HARDWARE (process subType per motor)

```json
{
  "formId": "QC-F-2026-0001",
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "DRAFT",
  "divisionDetails": [
    {
      "division": "HARDWARE",
      "subType": "ABRADING",
      "data": {
        "motors": [
          {
            "motorId": "MOTOR-01",
            "motorSubmissionType": "SUBMIT",
            "sections": [
              {
                "sectionId": "ABRADING_DETAILS",
                "sectionData": [
                  {
                    "FIRST_CUT": { "rows": [] },
                    "SECOND_CUT": { "rows": [] }
                  }
                ],
                "subType": "ABRADING"
              }
            ]
          }
        ]
      }
    }
  ]
}
```

### CURING / TRIMMING / POST_CURE / NDT / WEIGHTMENT / PROPELLANT

Same motor wrapper; keep schema `sectionId`s from that division's schema. Extra metadata the UI already attaches on sections can live on the motor object:

```json
{
  "motorId": "MOTOR-01",
  "motorSubmissionType": "DRAFT",
  "motorReceivedDate": "2026-06-28",
  "motorCount": 2,
  "inhibitorType": "IR1",
  "weighscaleNo": "WS-01",
  "calibrationDueDate": "2026-12-31",
  "sections": []
}
```

### Final proceed

```json
{
  "formId": "QC-F-2026-0001",
  "batchId": "BATCH-2026-001",
  "subDepartmentId": 115,
  "formSubmissionType": "SUBMIT",
  "divisionDetails": []
}
```

Allowed only if every division is `APPROVED` (i.e. all units in all divisions approved).

---

## Update - Rules

1. Upsert by `(division, subType?, motorId | premixNo)`.
2. Locked units (`WAITING_FOR_APPROVAL` / `APPROVED`) reject section edits -> `UNIT_NOT_EDITABLE`.
3. First create for a batch only; later units use update (`QC_FORM_ALREADY_EXISTS` if create repeated).
4. `formSubmissionType: "SUBMIT"` only when `allDivisionsApproved === true`.
5. Approving all units in a division flips that division to `APPROVED` automatically.
6. Rejected unit becomes editable again; division/batch leave `APPROVED` until fixed.

---

## Update - Success response

```json
{
  "success": true,
  "statusCode": 200,
  "message": "QC division form updated successfully",
  "timestamp": "2026-06-01T20:30:00Z",
  "data": {
    "formId": "QC-F-2026-0001",
    "batchId": "BATCH-2026-001",
    "subDepartmentId": 115,
    "formSubmissionType": "DRAFT",
    "status": "WAITING_FOR_PARTIAL_APPROVAL",
    "division": "CASTING",
    "subType": null,
    "motorId": "MOTOR-01",
    "motorSubmissionType": "SUBMIT",
    "motorSubmissionStatus": "WAITING_FOR_APPROVAL",
    "divisionStatuses": [
      {
        "division": "CASTING",
        "subType": null,
        "status": "WAITING_FOR_PARTIAL_APPROVAL",
        "allUnitsApproved": false,
        "pendingUnitCount": 1,
        "approvedUnitCount": 0,
        "rejectedUnitCount": 0,
        "waitingForApprovalUnitCount": 1,
        "inProgressUnitCount": 0,
        "totalUnitCount": 2
      }
    ],
    "motorStatuses": [
      {
        "division": "CASTING",
        "motorId": "MOTOR-01",
        "motorSubmissionType": "SUBMIT",
        "motorSubmissionStatus": "WAITING_FOR_APPROVAL"
      },
      {
        "division": "CASTING",
        "motorId": "MOTOR-02",
        "motorSubmissionType": null,
        "motorSubmissionStatus": "TO_BE_INITIATED"
      }
    ],
    "premixStatuses": [],
    "allDivisionsApproved": false,
    "allMotorsApproved": false,
    "pendingMotorCount": 1,
    "approvedMotorCount": 0,
    "rejectedMotorCount": 0,
    "totalMotorCount": 2,
    "submittedBy": "EMP001",
    "submittedAt": "2026-06-01T20:30:00Z"
  }
}
```

---

## Update - Extra errors

### Form not found

```json
{
  "success": false,
  "statusCode": 404,
  "message": "QC division form not found",
  "error": {
    "code": "QC_FORM_NOT_FOUND",
    "details": "No QC form exists for formId QC-F-2026-0001"
  },
  "data": null
}
```

### Unit not editable

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Unit already submitted for approval",
  "error": {
    "code": "UNIT_NOT_EDITABLE",
    "details": "Motor MOTOR-01 in CASTING is WAITING_FOR_APPROVAL and cannot be updated"
  },
  "data": null
}
```

### Final approval not ready

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Final approval not ready",
  "error": {
    "code": "FINAL_APPROVAL_NOT_READY",
    "details": {
      "message": "All divisions must be APPROVED before formSubmissionType SUBMIT",
      "pendingDivisions": [
        { "division": "CASTING", "pendingMotorIds": ["MOTOR-02"] },
        { "division": "MIXING", "pendingPremixNos": [2] }
      ]
    }
  },
  "data": null
}
```

---

# 3. Details Form

**`POST /api/v1/user/qc-division/details`**

## Request

UI currently sends:

```json
{
  "formId": "QC-F-2026-0001",
  "subDepartmentId": 115
}
```

(`subDepartmentId` is required by current FE.)

---

## Success - multi-division form with partial statuses

- `divisionDetails` must match create/update (units + sections), plus status fields.
- Always include `motorStatuses` / `premixStatuses` and `divisionStatuses` (UI partial nav + division chips).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "QC division form details fetched successfully",
  "timestamp": "2026-06-01T21:00:00Z",
  "data": {
    "formId": "QC-F-2026-0001",
    "batchId": "BATCH-2026-001",
    "subDepartmentId": 115,
    "formSubmissionType": "DRAFT",
    "status": "WAITING_FOR_PARTIAL_APPROVAL",
    "allDivisionsApproved": false,
    "pendingDivisionCount": 1,
    "approvedDivisionCount": 1,
    "totalDivisionCount": 2,
    "allMotorsApproved": false,
    "pendingMotorCount": 1,
    "approvedMotorCount": 1,
    "rejectedMotorCount": 0,
    "inProgressMotorCount": 0,
    "totalMotorCount": 2,
    "divisionStatuses": [
      {
        "division": "MIXING",
        "subType": null,
        "status": "APPROVED",
        "allUnitsApproved": true,
        "approvedUnitCount": 2,
        "totalUnitCount": 2
      },
      {
        "division": "CASTING",
        "subType": null,
        "status": "WAITING_FOR_PARTIAL_APPROVAL",
        "allUnitsApproved": false,
        "pendingUnitCount": 1,
        "approvedUnitCount": 1,
        "waitingForApprovalUnitCount": 1,
        "totalUnitCount": 2
      }
    ],
    "motorStatuses": [
      {
        "division": "CASTING",
        "motorId": "MOTOR-01",
        "motorSubmissionType": "SUBMIT",
        "motorSubmissionStatus": "APPROVED",
        "remarks": "Approved",
        "rejectionReason": null,
        "actionBy": "APR001",
        "actionAt": "2026-06-01T20:45:00Z"
      },
      {
        "division": "CASTING",
        "motorId": "MOTOR-02",
        "motorSubmissionType": "SUBMIT",
        "motorSubmissionStatus": "WAITING_FOR_APPROVAL",
        "remarks": null,
        "rejectionReason": null,
        "actionBy": null,
        "actionAt": null
      }
    ],
    "premixStatuses": [
      {
        "division": "MIXING",
        "stageType": "PREMIX",
        "premixNo": 1,
        "premixSubmissionType": "SUBMIT",
        "premixSubmissionStatus": "APPROVED"
      },
      {
        "division": "MIXING",
        "stageType": "FINAL_MIX",
        "premixNo": 1,
        "premixSubmissionType": "SUBMIT",
        "premixSubmissionStatus": "APPROVED"
      }
    ],
    "createdBy": "EMP001",
    "createdAt": "2026-06-01T18:00:00Z",
    "submittedBy": "EMP001",
    "submittedAt": "2026-06-01T20:00:00Z",
    "divisionDetails": [
      {
        "division": "MIXING",
        "subType": null,
        "status": "APPROVED",
        "data": {
          "premixes": [
            {
              "premixNo": 1,
              "stageType": "PREMIX",
              "premixSubmissionType": "SUBMIT",
              "premixSubmissionStatus": "APPROVED",
              "sections": [
                { "sectionId": "PREMIX_DETAILS", "sectionData": [{ "...": "..." }] }
              ]
            },
            {
              "premixNo": 1,
              "stageType": "FINAL_MIX",
              "premixSubmissionType": "SUBMIT",
              "premixSubmissionStatus": "APPROVED",
              "sections": [
                { "sectionId": "FINAL_MIX_DETAILS", "sectionData": [{ "...": "..." }] },
                { "sectionId": "VISCOSITY_BUILD_UP", "sectionData": [{ "...": "..." }] }
              ]
            }
          ]
        }
      },
      {
        "division": "CASTING",
        "subType": null,
        "status": "WAITING_FOR_PARTIAL_APPROVAL",
        "data": {
          "motors": [
            {
              "motorId": "MOTOR-01",
              "motorSubmissionType": "SUBMIT",
              "motorSubmissionStatus": "APPROVED",
              "remarks": "Approved",
              "rejectionReason": null,
              "actionBy": "APR001",
              "actionAt": "2026-06-01T20:45:00Z",
              "sections": [
                { "sectionId": "CASTING_SELECTION", "sectionData": [{ "...": "same as create" }] },
                { "sectionId": "FINAL_ASSEMBLY", "sectionData": [{ "...": "same as create" }] },
                { "sectionId": "PROPELLANT_CASTING", "sectionData": [{ "...": "..." }] },
                { "sectionId": "WEIGHTMENT_DETAILS", "sectionData": [{ "...": "..." }] },
                { "sectionId": "POST_CAST_OPERATIONS", "sectionData": [{ "...": "..." }] }
              ]
            },
            {
              "motorId": "MOTOR-02",
              "motorSubmissionType": "SUBMIT",
              "motorSubmissionStatus": "WAITING_FOR_APPROVAL",
              "remarks": null,
              "rejectionReason": null,
              "actionBy": null,
              "actionAt": null,
              "sections": []
            }
          ]
        }
      }
    ]
  }
}
```

### After final proceed (`formSubmissionType: "SUBMIT"`)

```json
"formSubmissionType": "SUBMIT",
"status": "WAITING_FOR_COMPLETE_APPROVAL",
"allDivisionsApproved": true,
"allMotorsApproved": true
```

### After form-level approver approve

```json
"status": "APPROVED"
```

(or `FINAL_APPROVAL_COMPLETED` if that is your batch terminal status - same as Case Prep).

---

## Details - Errors

Keep `400` / `401` / `403` / `404` / `500`. Validation example:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Invalid request",
  "error": {
    "code": "INVALID_REQUEST",
    "fieldErrors": [
      { "field": "formId", "message": "Form Id is required" }
    ]
  },
  "data": null
}
```

---

## Section ID checklist (by division)

Use schema `section.id` values as `sectionId`. Examples from current QC schema docs:

| Division | Typical sectionIds |
|----------|-------------------|
| `RAW_MATERIAL_REVALIDATION` | `RAW_MATERIAL_DETAILS` |
| `RAW_MATERIAL_PROCESSING` | solid/liquid processing section ids from schema |
| `MIXING` + `PREMIX` | `PREMIX_DETAILS` |
| `MIXING` + `FINAL_MIX` | final-mix details + viscosity sections |
| `HARDWARE` + `ABRADING` | `ABRADING_DETAILS` |
| `HARDWARE` + `PREHEATING` | preheating section ids |
| `HARDWARE` + `LINEAR_COATING` | liner coating section ids |
| `HARDWARE` + `DISPATCH` | dispatch section ids |
| `CASTING` | `CASTING_SELECTION`, `FINAL_ASSEMBLY`, propellant/weightment/post-cast ids |
| `CURING` | curing selection + cycle sections (per `NORMAL`/`CONFINED`/`N2_PRESSURE`) |
| `DE_CORING` | de-coring section ids |
| `TRIMMING` | trimming measurement section ids |
| `POST_CURE` | loose-flap / inhibition section ids |
| `NDT` | radiography / visual / media section ids |
| `PROPELLANT_PROPERTIES` | mechanical / interface / burn-rate / ballistic section ids |
| `WEIGHTMENT` | weighscale + motor weight section ids |

**No `motorNo` arrays inside sections** - one motor/premix = one unit entry with its own `sections[]`.

---

## Flow summary (Case Prep / RMP mirror + division)

| Action | Unit status | Division status | Form status |
|--------|-------------|-----------------|-------------|
| Create/Update unit `DRAFT` | `IN_PROGRESS` | `IN_PROGRESS` | `DRAFT` / `IN_PROGRESS` |
| Update unit `SUBMIT` | `WAITING_FOR_APPROVAL` | `WAITING_FOR_PARTIAL_APPROVAL` | `WAITING_FOR_PARTIAL_APPROVAL` |
| Approver unit approve | `APPROVED` | stays partial until all units done | stays partial |
| All units in division approved | - | `APPROVED` | still partial if other divisions pending |
| All divisions approved + Update `formSubmissionType: SUBMIT` | - | all `APPROVED` | `WAITING_FOR_COMPLETE_APPROVAL` |
| Approver form approve | - | - | `APPROVED` / `FINAL_APPROVAL_COMPLETED` |

---

## FE <-> API notes (for backend implementers)

1. Today FE create/update still sends flat `data: { sections }` without `motorSubmissionType`. Contract above is the target; FE should add unit wrappers + `*SubmissionType` (same as Case Prep `motors[].motorSubmissionType`).
2. Details must return unit lists under each division so `mapDivisionDetailsToPartialNav` can build motor/premix nav.
3. Always stamp `division` on every `motorStatuses` / `premixStatuses` row - same `MOTOR-01` can exist under CASTING and CURING independently.
4. Create once per batch; every later unit save is update.

---

*Document generated for QC Division partial-approval API contract.*
