export type QCDivisionFormState = {
  rm_particleSize: string;
  rm_moisture: string;
  mx_pre_homogeneity: string;
  mx_pre_moisture: string;
  mx_fin_viscosity: string;
  lp_moisture: string;
  cast_flowRate: string;
  cast_viscosity: string;
  dc_load: string;
  tr_dimension: string;
  lf_mechProps: string;
  ir_mechProps: string;
};

export const createDefaultQCDivisionFormState = (): QCDivisionFormState => ({
  rm_particleSize: "",
  rm_moisture: "",
  mx_pre_homogeneity: "",
  mx_pre_moisture: "",
  mx_fin_viscosity: "",
  lp_moisture: "",
  cast_flowRate: "",
  cast_viscosity: "",
  dc_load: "",
  tr_dimension: "",
  lf_mechProps: "",
  ir_mechProps: "",
});

export const hasAnyQCDivisionValue = (form: QCDivisionFormState) =>
  Object.values(form).some((value) => String(value).trim().length > 0);
