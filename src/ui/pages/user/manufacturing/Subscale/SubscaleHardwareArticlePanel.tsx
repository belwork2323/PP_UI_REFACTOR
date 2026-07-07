import {
  Box,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import TableChartRoundedIcon from "@mui/icons-material/TableChartRounded";
import FormInput from "../../../../components/common/FormInput";
import { STRINGS } from "../../../../../app/config/strings";
import { SUBSCALE_BRAND } from "../../../../../app/theme/custom_themes/user/manufacturing/subscale_theme";
import {
  ARTICLE_TYPE_DROPDOWN_OPTIONS,
  ARTICLE_TYPE_TABLE_ID,
  HARDWARE_COUNT_FIELDS,
  LINER_TYPE_FIELD,
  RUBBER_MATERIAL_OPTIONS,
  type ArticleTypeRow,
  isHardwarePreparationComplete,
  syncHardwareArticleTable,
} from "../../../../../hooks/user/manufacturing/subscaleHardwareConfig";
import type { SchemaFormValues } from "../../../../../schema-engine";

const S = STRINGS.MANUFACTURING.SUBSCALE.HARDWARE;

export const sectionCardSx = {
  borderRadius: 2.5,
  border: `1px solid ${SUBSCALE_BRAND.border}`,
  background: "#fff",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(28,40,51,0.04)",
};

export const sectionHeaderSx = {
  px: 2,
  py: 1.25,
  background: `linear-gradient(135deg, ${SUBSCALE_BRAND.ss}, ${SUBSCALE_BRAND.ssLight})`,
  color: "#fff",
  display: "flex",
  alignItems: "center",
  gap: 1,
};

type SubscaleHardwareArticlePanelProps = {
  values: SchemaFormValues;
  onChange: (values: SchemaFormValues) => void;
  hardwareFieldsDisabled?: boolean;
};

const SubscaleHardwareArticlePanel = ({
  values,
  onChange,
  hardwareFieldsDisabled = false,
}: SubscaleHardwareArticlePanelProps) => {
  const hardwareComplete = isHardwarePreparationComplete(values);
  const articleRows = (Array.isArray(values[ARTICLE_TYPE_TABLE_ID])
    ? values[ARTICLE_TYPE_TABLE_ID]
    : []) as ArticleTypeRow[];

  const updateCountField = (fieldId: string, raw: string) => {
    onChange(syncHardwareArticleTable({ ...values, [fieldId]: raw }));
  };

  const updateLinerField = (raw: string) => {
    onChange(syncHardwareArticleTable({ ...values, [LINER_TYPE_FIELD.id]: raw }));
  };

  const updateArticleRow = (rowIndex: number, patch: Partial<ArticleTypeRow>) => {
    const nextRows = articleRows.map((row, index) =>
      index === rowIndex ? { ...row, ...patch } : row,
    );
    onChange({ ...values, [ARTICLE_TYPE_TABLE_ID]: nextRows });
  };

  return (
    <Stack spacing={2.5}>
      <Box
        sx={{
          ...sectionCardSx,
          ...(hardwareFieldsDisabled ? { opacity: 0.55, pointerEvents: "none" } : {}),
        }}
      >
        <Box sx={sectionHeaderSx}>
          <BuildRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.02em" }}>
            {S.PREPARATION_TITLE}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 2,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {HARDWARE_COUNT_FIELDS.map((field) => (
            <FormInput
              key={field.id}
              label={field.label}
              type="number"
              inputProps={{ min: 0, step: 1 }}
              value={values[field.id] ?? ""}
              onChange={(event) => updateCountField(field.id, event.target.value)}
            />
          ))}
          <FormInput
            label={LINER_TYPE_FIELD.label}
            value={values[LINER_TYPE_FIELD.id] ?? ""}
            onChange={(event) => updateLinerField(event.target.value)}
            sx={{ gridColumn: { lg: "span 3" } }}
          />
        </Box>
      </Box>

      <Box sx={sectionCardSx}>
        <Box sx={sectionHeaderSx}>
          <TableChartRoundedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", letterSpacing: "0.02em" }}>
            {S.ARTICLE_TABLE_TITLE}
          </Typography>
        </Box>
        <Box sx={{ p: 2, ...(hardwareComplete ? {} : { opacity: 0.55 }) }}>
          <Typography sx={{ fontSize: "0.75rem", color: SUBSCALE_BRAND.textSub, mb: 1.5 }}>
            {hardwareFieldsDisabled
              ? S.HARDWARE_LOCKED
              : hardwareComplete
                ? S.ARTICLE_TABLE_HINT
                : S.ARTICLE_TABLE_LOCKED}
          </Typography>
          <TableContainer
            sx={{
              border: `1px solid ${SUBSCALE_BRAND.border}`,
              borderRadius: 2,
              pointerEvents: hardwareComplete && !hardwareFieldsDisabled ? "auto" : "none",
              "& .MuiTableCell-root": { borderColor: `${SUBSCALE_BRAND.border}99` },
            }}
          >
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.7rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      background: "rgba(21,101,192,0.1)",
                      color: SUBSCALE_BRAND.ss,
                    }}
                  >
                    {S.COL_ARTICLE_TYPE}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}>
                    {S.COL_RUBBER_MATERIAL}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}>
                    {S.COL_SLEEVE_NO}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}>
                    {S.COL_MOULD_NO}
                  </TableCell>
                  <TableCell
                    align="center"
                    colSpan={2}
                    sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}
                  >
                    {S.COL_DIMENSION}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}>
                    {S.COL_LINER_APPLIED}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.7rem", background: "rgba(21,101,192,0.1)", color: SUBSCALE_BRAND.ss }}>
                    {S.COL_OBSERVATIONS}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", background: "rgba(21,101,192,0.05)" }}>
                    {S.COL_LENGTH}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: "0.68rem", background: "rgba(21,101,192,0.05)" }}>
                    {S.COL_THICKNESS}
                  </TableCell>
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                  <TableCell sx={{ background: "rgba(21,101,192,0.05)" }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {articleRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Typography
                        sx={{
                          fontSize: "0.78rem",
                          color: SUBSCALE_BRAND.textSub,
                          py: 2.5,
                          textAlign: "center",
                        }}
                      >
                        {hardwareFieldsDisabled
                          ? S.HARDWARE_LOCKED
                          : hardwareComplete
                            ? S.ARTICLE_TABLE_EMPTY
                            : S.ARTICLE_TABLE_LOCKED}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  articleRows.map((row, rowIndex) => (
                    <TableRow
                      key={`${row._articleKey}-${row._articleIndex}-${row.SR_NO}`}
                      sx={{
                        "&:nth-of-type(even)": { background: "rgba(244,246,248,0.7)" },
                        "&:hover": { background: "rgba(21,101,192,0.04)" },
                      }}
                    >
                      <TableCell sx={{ minWidth: 160 }}>
                        <FormInput
                          select
                          disabled={!hardwareComplete}
                          value={row.ARTICLE_TYPE ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { ARTICLE_TYPE: event.target.value })
                          }
                        >
                          <MenuItem value="">—</MenuItem>
                          {ARTICLE_TYPE_DROPDOWN_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </FormInput>
                      </TableCell>
                      <TableCell>
                        <FormInput
                          select
                          disabled={!hardwareComplete}
                          value={row.RUBBER_MATERIAL ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { RUBBER_MATERIAL: event.target.value })
                          }
                        >
                          <MenuItem value="">—</MenuItem>
                          {RUBBER_MATERIAL_OPTIONS.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </FormInput>
                      </TableCell>
                      <TableCell>
                        <FormInput
                          disabled={!hardwareComplete}
                          value={row.SLEEVE_NO ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { SLEEVE_NO: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormInput
                          disabled={!hardwareComplete}
                          value={row.MOULD_NO ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { MOULD_NO: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormInput
                          type="number"
                          disabled={!hardwareComplete}
                          value={row.LENGTH_MM ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { LENGTH_MM: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormInput
                          type="number"
                          disabled={!hardwareComplete}
                          value={row.THICKNESS_MM ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { THICKNESS_MM: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormInput
                          disabled={!hardwareComplete}
                          value={row.LINER_APPLIED ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { LINER_APPLIED: event.target.value })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <FormInput
                          disabled={!hardwareComplete}
                          value={row.OBSERVATIONS ?? ""}
                          onChange={(event) =>
                            updateArticleRow(rowIndex, { OBSERVATIONS: event.target.value })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Stack>
  );
};

export default SubscaleHardwareArticlePanel;
