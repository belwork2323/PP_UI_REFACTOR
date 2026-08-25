import { useEffect, useState } from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { fetchCastingStationsApi } from "../../../../../data/api/users/operationsApi";
import type {
  InhibitionHemcoatMotorData,
  InhibitionIr1MotorData,
  InhibitionNotApplicableMotorData,
  IngredientQuantityRow,
  IngredientTakenRow,
  LocationAppliedRow,
  LocationDateRow,
  LocationQtyRow,
  LooseFlapMotorData,
  PostCureMotorData,
  QualificationRow,
} from "../../../../../data/models/user/PostCureMotorDataModel";
import { recomputeIngredientTotal } from "../../../../../data/models/user/PostCureMotorDataModel";
import type { FileRef } from "../../../../../data/models/common/FileUploadModel";
import { DateField } from "../../../../components/common/DateField";
import PostCureFileField from "./PostCureFileField";
import {
  FieldGrid,
  FieldLabel,
  SectionCard,
  TableSelectInput,
  TableTextInput,
  postCureTableCellSx,
  postCureTableContainerSx,
  postCureTableHeaderCellSx,
  postCureTableInputSx,
  postCureTableRowSx,
} from "./PostCureFormPrimitives";

type Props = {
  value: PostCureMotorData;
  onChange: (next: PostCureMotorData) => void;
  disabled?: boolean;
  readOnly?: boolean;
  theme?: any;
  subDepartmentId?: number;
  batchId?: string;
  motorId?: string;
};

const formatLocation = (location: string) => {
  if (location === "HE_SIDE") return "HE Side";
  if (location === "NE_SIDE") return "NE Side";
  return location.replace(/_/g, " ");
};

const CompactDate = ({
  value,
  onChange,
  disabled,
  readOnly,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <DateField value={value} onChange={onChange} disabled={disabled} readOnly={readOnly} compact inputSx={postCureTableInputSx} />
);

const LocationDateTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
}: {
  rows: LocationDateRow[];
  onChange: (rows: LocationDateRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {["Location", "From Date", "To Date", "Observations"].map((label, idx) => (
            <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`loc-date-${row.LOCATION}-${index}`} sx={postCureTableRowSx(index)}>
            <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
              {formatLocation(row.LOCATION)}
            </TableCell>
            <TableCell sx={postCureTableCellSx}>
              <CompactDate
                value={row.FROM_DATE}
                onChange={(next) =>
                  onChange(rows.map((entry, i) => (i === index ? { ...entry, FROM_DATE: next } : entry)))
                }
                disabled={disabled} readOnly={readOnly}
              />
            </TableCell>
            <TableCell sx={postCureTableCellSx}>
              <CompactDate
                value={row.TO_DATE}
                onChange={(next) =>
                  onChange(rows.map((entry, i) => (i === index ? { ...entry, TO_DATE: next } : entry)))
                }
                disabled={disabled} readOnly={readOnly}
              />
            </TableCell>
            <TableCell sx={postCureTableCellSx}>
              <TableTextInput
                value={row.OBSERVATIONS}
                onChange={(next) =>
                  onChange(
                    rows.map((entry, i) => (i === index ? { ...entry, OBSERVATIONS: next } : entry)),
                  )
                }
                disabled={disabled} readOnly={readOnly}
                multiline
                minRows={2}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const LocationQtyTable = ({
  rows,
  onChange,
  disabled,
  qtyLabel,
  qtyKey,
  readOnly,
}: {
  rows: LocationQtyRow[] | LocationAppliedRow[];
  onChange: (rows: LocationQtyRow[] | LocationAppliedRow[]) => void;
  disabled?: boolean;
  qtyLabel: string;
  qtyKey: "QTY_FILLED" | "QTY_APPLIED";
  readOnly?: boolean;
}) => (
    <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Location", "From Date", "To Date", qtyLabel, "Observations"].map((label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`loc-qty-${row.LOCATION}-${index}`} sx={postCureTableRowSx(index)}>
              <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>
                {formatLocation(row.LOCATION)}
              </TableCell>
              <TableCell sx={postCureTableCellSx}>
                <CompactDate
                  value={row.FROM_DATE}
                  onChange={(next) =>
                    onChange(
                      rows.map((entry, i) => (i === index ? { ...entry, FROM_DATE: next } : entry)),
                    )
                  }
                  disabled={disabled} readOnly={readOnly}
                />
              </TableCell>
              <TableCell sx={postCureTableCellSx}>
                <CompactDate
                  value={row.TO_DATE}
                  onChange={(next) =>
                    onChange(
                      rows.map((entry, i) => (i === index ? { ...entry, TO_DATE: next } : entry)),
                    )
                  }
                  disabled={disabled} readOnly={readOnly}
                />
              </TableCell>
              <TableCell sx={postCureTableCellSx}>
                <TableTextInput
                  value={String((row as Record<string, string>)[qtyKey] ?? "")}
                  onChange={(next) =>
                    onChange(
                      rows.map((entry, i) =>
                        i === index ? { ...entry, [qtyKey]: next } : entry,
                      ),
                    )
                  }
                  disabled={disabled} readOnly={readOnly}
                  type="number"
                />
              </TableCell>
              <TableCell sx={postCureTableCellSx}>
                <TableTextInput
                  value={row.OBSERVATIONS}
                  onChange={(next) =>
                    onChange(
                      rows.map((entry, i) =>
                        i === index ? { ...entry, OBSERVATIONS: next } : entry,
                      ),
                    )
                  }
                  disabled={disabled} readOnly={readOnly}
                  multiline
                  minRows={2}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
    </Table>
  </TableContainer>
);

const IngredientQuantityTable = ({
  rows,
  onChange,
  disabled,
  qtyKey,
  readOnly,
}: {
  rows: IngredientQuantityRow[] | IngredientTakenRow[];
  onChange: (rows: IngredientQuantityRow[] | IngredientTakenRow[]) => void;
  disabled?: boolean;
  qtyKey: "QUANTITY" | "QTY_TAKEN";
  readOnly?: boolean;
}) => (
  <TableContainer sx={{ ...postCureTableContainerSx, overflowX: "auto" }}>
    <Table size="small" sx={{ minWidth: 720 }}>
      <TableHead>
        <TableRow>
          {["Sr No.", "Ingredient", "Mfg Lot", "Parts By Weight", qtyKey === "QUANTITY" ? "Quantity (g)" : "Qty Taken (g)"].map(
            (label, idx) => (
              <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
                {label}
              </TableCell>
            ),
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => {
          const isTotal = String(row.srNo).toUpperCase() === "TOTAL";
          return (
            <TableRow key={`ing-${row.srNo}-${index}`} sx={postCureTableRowSx(index)}>
              <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{row.srNo}</TableCell>
              <TableCell sx={{ ...postCureTableCellSx, fontWeight: isTotal ? 700 : 500 }}>
                {row.INGREDIENT}
              </TableCell>
              <TableCell sx={postCureTableCellSx}>
                {isTotal ? (
                  <Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>—</Typography>
                ) : (
                  <TableTextInput
                    value={row.MFG_LOT}
                    onChange={(next) => {
                      const nextRows = rows.map((entry, i) =>
                        i === index ? { ...entry, MFG_LOT: next } : entry,
                      );
                      onChange(recomputeIngredientTotal(nextRows, qtyKey));
                    }}
                    disabled={disabled} readOnly={readOnly}
                  />
                )}
              </TableCell>
              <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>{row.PARTS_BY_WEIGHT}</TableCell>
              <TableCell sx={postCureTableCellSx}>
                <TableTextInput
                  value={String((row as Record<string, string>)[qtyKey] ?? "")}
                  onChange={(next) => {
                    const nextRows = rows.map((entry, i) =>
                      i === index ? { ...entry, [qtyKey]: next } : entry,
                    );
                    onChange(recomputeIngredientTotal(nextRows, qtyKey));
                  }}
                  disabled={disabled || isTotal} readOnly={readOnly}
                  type="number"
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const QualificationTable = ({
  rows,
  onChange,
  disabled,
  readOnly,
}: {
  rows: QualificationRow[];
  onChange: (rows: QualificationRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <TableContainer sx={postCureTableContainerSx}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {["Parameter", "Specification", "Result"].map((label, idx) => (
            <TableCell key={label} sx={postCureTableHeaderCellSx(idx === 0)}>
              {label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={`qual-${row.PARAMETER}`} sx={postCureTableRowSx(index)}>
            <TableCell sx={{ ...postCureTableCellSx, fontWeight: 600 }}>{row.PARAMETER}</TableCell>
            <TableCell sx={{ ...postCureTableCellSx, fontWeight: 500 }}>{row.SPECIFICATION}</TableCell>
            <TableCell sx={postCureTableCellSx}>
              <TableTextInput
                value={row.RESULT}
                onChange={(next) =>
                  onChange(rows.map((entry, i) => (i === index ? { ...entry, RESULT: next } : entry)))
                }
                disabled={disabled} readOnly={readOnly}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const QualificationSection = ({
  batchNo,
  prepDate,
  qcReport,
  rows,
  onBatchNoChange,
  onPrepDateChange,
  onQcReportChange,
  onRowsChange,
  disabled,
  readOnly,
}: {
  batchNo: string;
  prepDate: string;
  qcReport: FileRef[];
  rows: QualificationRow[];
  onBatchNoChange: (value: string) => void;
  onPrepDateChange: (value: string) => void;
  onQcReportChange: (value: FileRef[]) => void;
  onRowsChange: (rows: QualificationRow[]) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <>
    <FieldGrid columns={2}>
      <Box>
        <FieldLabel>Batch No</FieldLabel>
        <TableTextInput value={batchNo} onChange={onBatchNoChange} disabled={disabled} readOnly={readOnly} />
      </Box>
      <Box>
        <FieldLabel>Date of Preparation</FieldLabel>
        <DateField value={prepDate} onChange={onPrepDateChange} disabled={disabled} readOnly={readOnly} compact />
      </Box>
    </FieldGrid>
    <QualificationTable rows={rows} onChange={onRowsChange} disabled={disabled} readOnly={readOnly} />
    <Box sx={{ mt: 1.5 }}>
      <FieldLabel>QC Report</FieldLabel>
      <PostCureFileField
        files={qcReport ?? []}
        onChange={onQcReportChange}
        multiple
        acceptMode="imageVideoPdf"
        disabled={disabled}
        readOnly={readOnly}
      />
    </Box>
  </>
);

const DispatchFields = ({
  dispatchDate,
  dispatchStation,
  stationOptions,
  onDateChange,
  onStationChange,
  disabled,
  readOnly,
}: {
  dispatchDate: string;
  dispatchStation: string;
  stationOptions: Array<{ value: string; label: string }>;
  onDateChange: (value: string) => void;
  onStationChange: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) => (
  <FieldGrid columns={2}>
    <Box>
      <FieldLabel>Date Of Dispatch</FieldLabel>
      <DateField value={dispatchDate} onChange={onDateChange} disabled={disabled} readOnly={readOnly} compact />
    </Box>
    <Box>
      <FieldLabel>Dispatch Station</FieldLabel>
      <TableSelectInput
        value={dispatchStation}
        onChange={onStationChange}
        options={stationOptions}
        placeholder="Select station"
        disabled={disabled} readOnly={readOnly}
      />
    </Box>
  </FieldGrid>
);

const LooseFlapPanel = ({
  data,
  onChange,
  disabled,
  theme,
  readOnly,
}: {
  data: LooseFlapMotorData;
  onChange: (next: LooseFlapMotorData) => void;
  disabled?: boolean;
  theme?: any;
  readOnly?: boolean;
}) => (
  <Box>
    <SectionCard title="Bellow Removal Details" theme={theme}>
      <LocationDateTable
        rows={data.BELLOW_REMOVAL_DETAILS.BELLOW_REMOVAL_TABLE}
        onChange={(rows) =>
          onChange({
            ...data,
            BELLOW_REMOVAL_DETAILS: { BELLOW_REMOVAL_TABLE: rows as LocationDateRow[] },
          })
        }
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Loose Flap Epoxy Preparation Details" theme={theme}>
      <FieldGrid columns={2}>
        <Box>
          <FieldLabel>Batch No</FieldLabel>
          <TableTextInput
            value={data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_BATCH_NO}
            onChange={(next) =>
              onChange({
                ...data,
                LOOSE_FLAP_EPOXY_PREPARATION: {
                  ...data.LOOSE_FLAP_EPOXY_PREPARATION,
                  EPOXY_BATCH_NO: next,
                },
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>Date of Preparation</FieldLabel>
          <DateField
            value={data.LOOSE_FLAP_EPOXY_PREPARATION.EPOXY_PREPARATION_DATE}
            onChange={(next) =>
              onChange({
                ...data,
                LOOSE_FLAP_EPOXY_PREPARATION: {
                  ...data.LOOSE_FLAP_EPOXY_PREPARATION,
                  EPOXY_PREPARATION_DATE: next,
                },
              })
            }
            disabled={disabled} readOnly={readOnly}
            compact
          />
        </Box>
      </FieldGrid>
      <IngredientQuantityTable
        rows={data.LOOSE_FLAP_EPOXY_PREPARATION.PREPARATION_DETAILS}
        qtyKey="QUANTITY"
        onChange={(rows) =>
          onChange({
            ...data,
            LOOSE_FLAP_EPOXY_PREPARATION: {
              ...data.LOOSE_FLAP_EPOXY_PREPARATION,
              PREPARATION_DETAILS: rows as IngredientQuantityRow[],
            },
          })
        }
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Qualification Details" theme={theme}>
      <QualificationSection
        batchNo={data.QUALIFICATION_DETAILS.QUALIFICATION_BATCH_NO}
        prepDate={data.QUALIFICATION_DETAILS.QUALIFICATION_PREPARATION_DATE}
        qcReport={data.QUALIFICATION_DETAILS.QUALIFICATION_QC_REPORT}
        rows={data.QUALIFICATION_DETAILS.QUALIFICATION_TABLE}
        onBatchNoChange={(value) =>
          onChange({
            ...data,
            QUALIFICATION_DETAILS: { ...data.QUALIFICATION_DETAILS, QUALIFICATION_BATCH_NO: value },
          })
        }
        onPrepDateChange={(value) =>
          onChange({
            ...data,
            QUALIFICATION_DETAILS: {
              ...data.QUALIFICATION_DETAILS,
              QUALIFICATION_PREPARATION_DATE: value,
            },
          })
        }
        onQcReportChange={(value) =>
          onChange({
            ...data,
            QUALIFICATION_DETAILS: { ...data.QUALIFICATION_DETAILS, QUALIFICATION_QC_REPORT: value },
          })
        }
        onRowsChange={(rows) =>
          onChange({
            ...data,
            QUALIFICATION_DETAILS: { ...data.QUALIFICATION_DETAILS, QUALIFICATION_TABLE: rows },
          })
        }
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="LF Epoxy Filling Details" theme={theme}>
      <LocationQtyTable
        rows={data.LF_EPOXY_FILLING_DETAILS.LF_FILLING_TABLE}
        qtyLabel="Quantity Filled"
        qtyKey="QTY_FILLED"
        onChange={(rows) =>
          onChange({
            ...data,
            LF_EPOXY_FILLING_DETAILS: { LF_FILLING_TABLE: rows as LocationQtyRow[] },
          })
        }
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>
  </Box>
);

const InhibitionSharedSections = ({
  batch,
  application,
  dispatch,
  stationOptions,
  onBatchChange,
  onApplicationChange,
  onDispatchChange,
  disabled,
  theme,
  readOnly,
}: {
  batch: InhibitionIr1MotorData["INHIBITION_BATCH_DETAILS"];
  application: InhibitionIr1MotorData["INHIBITION_APPLICATION_DETAILS"];
  dispatch: InhibitionIr1MotorData["DISPATCH_DETAILS"];
  stationOptions: Array<{ value: string; label: string }>;
  onBatchChange: (next: InhibitionIr1MotorData["INHIBITION_BATCH_DETAILS"]) => void;
  onApplicationChange: (next: InhibitionIr1MotorData["INHIBITION_APPLICATION_DETAILS"]) => void;
  onDispatchChange: (next: InhibitionIr1MotorData["DISPATCH_DETAILS"]) => void;
  disabled?: boolean;
  theme?: any;
  readOnly?: boolean;
}) => (
  <>
    <SectionCard title="Inhibitor Batch Information" theme={theme}>
      <FieldGrid columns={2}>
        <Box>
          <FieldLabel>Batch No</FieldLabel>
          <TableTextInput
            value={batch.INHIBITOR_BATCH_NO}
            onChange={(value) => onBatchChange({ ...batch, INHIBITOR_BATCH_NO: value })}
            disabled={disabled} readOnly={readOnly}
          />
        </Box>
        <Box>
          <FieldLabel>Batch Size (g)</FieldLabel>
          <TableTextInput
            value={batch.INHIBITOR_BATCH_SIZE}
            onChange={(value) => onBatchChange({ ...batch, INHIBITOR_BATCH_SIZE: value })}
            disabled={disabled} readOnly={readOnly}
            type="number"
          />
        </Box>
      </FieldGrid>
    </SectionCard>

    <SectionCard title="Inhibition Application Details" theme={theme}>
      <LocationQtyTable
        rows={application.INHIBITION_APPLICATION_TABLE}
        qtyLabel="Qty Applied (g)"
        qtyKey="QTY_APPLIED"
        onChange={(rows) =>
          onApplicationChange({
            INHIBITION_APPLICATION_TABLE: rows as LocationAppliedRow[],
          })
        }
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>

    <SectionCard title="Dispatch Details" theme={theme}>
      <DispatchFields
        dispatchDate={dispatch.DISPATCH_DATE}
        dispatchStation={dispatch.DISPATCH_STATION}
        stationOptions={stationOptions}
        onDateChange={(value) => onDispatchChange({ ...dispatch, DISPATCH_DATE: value })}
        onStationChange={(value) => onDispatchChange({ ...dispatch, DISPATCH_STATION: value })}
        disabled={disabled} readOnly={readOnly}
      />
    </SectionCard>
  </>
);

const PostCureMotorPanel = ({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  theme,
  subDepartmentId,
  batchId,
  motorId,
}: Props) => {
  const [stationOptions, setStationOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    let active = true;
    void fetchCastingStationsApi()
      .then((response: unknown) => {
        if (!active) return;
        const res = response as { data?: unknown[] };
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(response) ? response : [];
        setStationOptions(
          list
            .map((item) => {
              const rec = item as Record<string, unknown>;
              const stationValue = String(
                rec.stationCode ?? rec.stationId ?? rec.stationName ?? rec.code ?? "",
              );
              const label = String(rec.stationName ?? rec.stationCode ?? stationValue);
              return { value: stationValue, label };
            })
            .filter((item) => item.value),
        );
      })
      .catch(() => {
        if (active) setStationOptions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const variant = value.variant;

  if (variant === "loose-flap-filling") {
    return (
      <LooseFlapPanel
        data={value}
        onChange={onChange}
        disabled={disabled} readOnly={readOnly}
        theme={theme}
      />
    );
  }

  if (variant === "inhibition-not-applicable") {
    const data = value as InhibitionNotApplicableMotorData;
    return (
      <SectionCard title="Inhibition" theme={theme}>
        <FieldLabel>Remarks</FieldLabel>
        <TableTextInput
          value={data.INHIBITION_NOT_APPLICABLE.REMARKS}
          onChange={(next) =>
            onChange({
              ...data,
              INHIBITION_NOT_APPLICABLE: { REMARKS: next },
            })
          }
          disabled={disabled} readOnly={readOnly}
          multiline
          minRows={4}
        />
      </SectionCard>
    );
  }

  if (variant === "inhibition-ir1") {
    const data = value as InhibitionIr1MotorData;
    return (
      <Box>
        <SectionCard title="IR-1 Premix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabel>Batch No</FieldLabel>
              <TableTextInput
                value={data.IR1_PREMIX.IR1_PREMIX_BATCH_NO}
                onChange={(next) =>
                  onChange({
                    ...data,
                    IR1_PREMIX: { ...data.IR1_PREMIX, IR1_PREMIX_BATCH_NO: next },
                  })
                }
                disabled={disabled} readOnly={readOnly}
              />
            </Box>
            <Box>
              <FieldLabel>Premix Date</FieldLabel>
              <DateField
                value={data.IR1_PREMIX.IR1_PREMIX_DATE}
                onChange={(next) =>
                  onChange({
                    ...data,
                    IR1_PREMIX: { ...data.IR1_PREMIX, IR1_PREMIX_DATE: next },
                  })
                }
                disabled={disabled} readOnly={readOnly}
                compact
              />
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            rows={data.IR1_PREMIX.IR1_PREMIX_TABLE}
            qtyKey="QTY_TAKEN"
            onChange={(rows) =>
              onChange({
                ...data,
                IR1_PREMIX: { ...data.IR1_PREMIX, IR1_PREMIX_TABLE: rows as IngredientTakenRow[] },
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Final Mix" theme={theme}>
          <FieldGrid columns={2}>
            <Box>
              <FieldLabel>Batch No</FieldLabel>
              <TableTextInput
                value={data.IR1_FINAL_MIX.IR1_FINAL_MIX_BATCH_NO}
                onChange={(next) =>
                  onChange({
                    ...data,
                    IR1_FINAL_MIX: { ...data.IR1_FINAL_MIX, IR1_FINAL_MIX_BATCH_NO: next },
                  })
                }
                disabled={disabled} readOnly={readOnly}
              />
            </Box>
            <Box>
              <FieldLabel>Final Mix Date</FieldLabel>
              <DateField
                value={data.IR1_FINAL_MIX.IR1_FINAL_MIX_DATE}
                onChange={(next) =>
                  onChange({
                    ...data,
                    IR1_FINAL_MIX: { ...data.IR1_FINAL_MIX, IR1_FINAL_MIX_DATE: next },
                  })
                }
                disabled={disabled} readOnly={readOnly}
                compact
              />
            </Box>
          </FieldGrid>
          <IngredientQuantityTable
            rows={data.IR1_FINAL_MIX.IR1_FINAL_MIX_TABLE}
            qtyKey="QTY_TAKEN"
            onChange={(rows) =>
              onChange({
                ...data,
                IR1_FINAL_MIX: {
                  ...data.IR1_FINAL_MIX,
                  IR1_FINAL_MIX_TABLE: rows as IngredientTakenRow[],
                },
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </SectionCard>

        <SectionCard title="Qualification Details" theme={theme}>
          <QualificationSection
            batchNo={data.IR1_QUALIFICATION.QUALIFICATION_BATCH_NO}
            prepDate={data.IR1_QUALIFICATION.QUALIFICATION_PREPARATION_DATE}
            qcReport={data.IR1_QUALIFICATION.QUALIFICATION_QC_REPORT}
            rows={data.IR1_QUALIFICATION.QUALIFICATION_TABLE}
            onBatchNoChange={(next) =>
              onChange({
                ...data,
                IR1_QUALIFICATION: { ...data.IR1_QUALIFICATION, QUALIFICATION_BATCH_NO: next },
              })
            }
            onPrepDateChange={(next) =>
              onChange({
                ...data,
                IR1_QUALIFICATION: {
                  ...data.IR1_QUALIFICATION,
                  QUALIFICATION_PREPARATION_DATE: next,
                },
              })
            }
            onQcReportChange={(next) =>
              onChange({
                ...data,
                IR1_QUALIFICATION: { ...data.IR1_QUALIFICATION, QUALIFICATION_QC_REPORT: next },
              })
            }
            onRowsChange={(rows) =>
              onChange({
                ...data,
                IR1_QUALIFICATION: { ...data.IR1_QUALIFICATION, QUALIFICATION_TABLE: rows },
              })
            }
            disabled={disabled} readOnly={readOnly}
          />
        </SectionCard>

        <InhibitionSharedSections
          batch={data.INHIBITION_BATCH_DETAILS}
          application={data.INHIBITION_APPLICATION_DETAILS}
          dispatch={data.DISPATCH_DETAILS}
          stationOptions={stationOptions}
          onBatchChange={(next) => onChange({ ...data, INHIBITION_BATCH_DETAILS: next })}
          onApplicationChange={(next) => onChange({ ...data, INHIBITION_APPLICATION_DETAILS: next })}
          onDispatchChange={(next) => onChange({ ...data, DISPATCH_DETAILS: next })}
          disabled={disabled} readOnly={readOnly}
          theme={theme}
        />
      </Box>
    );
  }

  const data = value as InhibitionHemcoatMotorData;
  return (
    <Box>
      <SectionCard title="Hemcoat-3K IR - Preparation Details" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabel>Batch No</FieldLabel>
            <TableTextInput
              value={data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_BATCH_NO}
              onChange={(next) =>
                onChange({
                  ...data,
                  HEMCOAT_3K_PREPARATION: {
                    ...data.HEMCOAT_3K_PREPARATION,
                    HEMCOAT_PREMIX_BATCH_NO: next,
                  },
                })
              }
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <Box>
            <FieldLabel>Premix Date</FieldLabel>
            <DateField
              value={data.HEMCOAT_3K_PREPARATION.HEMCOAT_PREMIX_DATE}
              onChange={(next) =>
                onChange({
                  ...data,
                  HEMCOAT_3K_PREPARATION: {
                    ...data.HEMCOAT_3K_PREPARATION,
                    HEMCOAT_PREMIX_DATE: next,
                  },
                })
              }
              disabled={disabled} readOnly={readOnly}
              compact
            />
          </Box>
        </FieldGrid>
        <IngredientQuantityTable
          rows={data.HEMCOAT_3K_PREPARATION.PREMIX_PREPARATION_TABLE}
          qtyKey="QTY_TAKEN"
          onChange={(rows) =>
            onChange({
              ...data,
              HEMCOAT_3K_PREPARATION: {
                ...data.HEMCOAT_3K_PREPARATION,
                PREMIX_PREPARATION_TABLE: rows as IngredientTakenRow[],
              },
            })
          }
          disabled={disabled} readOnly={readOnly}
        />
      </SectionCard>

      <SectionCard title="Final Mix" theme={theme}>
        <FieldGrid columns={2}>
          <Box>
            <FieldLabel>Batch No</FieldLabel>
            <TableTextInput
              value={data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_BATCH_NO}
              onChange={(next) =>
                onChange({
                  ...data,
                  HEMCOAT_3K_FINAL_MIX: {
                    ...data.HEMCOAT_3K_FINAL_MIX,
                    HEMCOAT_FINAL_MIX_BATCH_NO: next,
                  },
                })
              }
              disabled={disabled} readOnly={readOnly}
            />
          </Box>
          <Box>
            <FieldLabel>Final Mix Date</FieldLabel>
            <DateField
              value={data.HEMCOAT_3K_FINAL_MIX.HEMCOAT_FINAL_MIX_DATE}
              onChange={(next) =>
                onChange({
                  ...data,
                  HEMCOAT_3K_FINAL_MIX: {
                    ...data.HEMCOAT_3K_FINAL_MIX,
                    HEMCOAT_FINAL_MIX_DATE: next,
                  },
                })
              }
              disabled={disabled} readOnly={readOnly}
              compact
            />
          </Box>
        </FieldGrid>
        <IngredientQuantityTable
          rows={data.HEMCOAT_3K_FINAL_MIX.FINAL_MIX_TABLE}
          qtyKey="QTY_TAKEN"
          onChange={(rows) =>
            onChange({
              ...data,
              HEMCOAT_3K_FINAL_MIX: {
                ...data.HEMCOAT_3K_FINAL_MIX,
                FINAL_MIX_TABLE: rows as IngredientTakenRow[],
              },
            })
          }
          disabled={disabled} readOnly={readOnly}
        />
      </SectionCard>

      <SectionCard title="Qualification Details" theme={theme}>
        <QualificationSection
          batchNo={data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_BATCH_NO}
          prepDate={data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_PREPARATION_DATE}
          qcReport={data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_QC_REPORT}
          rows={data.HEMCOAT_3K_QUALIFICATION.QUALIFICATION_TABLE}
          onBatchNoChange={(next) =>
            onChange({
              ...data,
              HEMCOAT_3K_QUALIFICATION: {
                ...data.HEMCOAT_3K_QUALIFICATION,
                QUALIFICATION_BATCH_NO: next,
              },
            })
          }
          onPrepDateChange={(next) =>
            onChange({
              ...data,
              HEMCOAT_3K_QUALIFICATION: {
                ...data.HEMCOAT_3K_QUALIFICATION,
                QUALIFICATION_PREPARATION_DATE: next,
              },
            })
          }
          onQcReportChange={(next) =>
            onChange({
              ...data,
              HEMCOAT_3K_QUALIFICATION: {
                ...data.HEMCOAT_3K_QUALIFICATION,
                QUALIFICATION_QC_REPORT: next,
              },
            })
          }
          onRowsChange={(rows) =>
            onChange({
              ...data,
              HEMCOAT_3K_QUALIFICATION: {
                ...data.HEMCOAT_3K_QUALIFICATION,
                QUALIFICATION_TABLE: rows,
              },
            })
          }
          disabled={disabled} readOnly={readOnly}
        />
      </SectionCard>

      <InhibitionSharedSections
        batch={data.INHIBITION_BATCH_DETAILS}
        application={data.INHIBITION_APPLICATION_DETAILS}
        dispatch={data.DISPATCH_DETAILS}
        stationOptions={stationOptions}
        onBatchChange={(next) => onChange({ ...data, INHIBITION_BATCH_DETAILS: next })}
        onApplicationChange={(next) => onChange({ ...data, INHIBITION_APPLICATION_DETAILS: next })}
        onDispatchChange={(next) => onChange({ ...data, DISPATCH_DETAILS: next })}
        disabled={disabled} readOnly={readOnly}
        theme={theme}
      />
    </Box>
  );
};

export default PostCureMotorPanel;
