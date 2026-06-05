export type StaticTestFacilityFormState = {
  motorNo: string;
  a_emptyMotor: string;
  b_rubberDust: string;
  c_linearCoating: string;
  d_looseFlapFill: string;
  e_extraRubber: string;
  f_inhibition: string;
  g_finalWeight: string;
  h_propellent?: string;
};

export const createDefaultStaticTestFacilityFormState = (): StaticTestFacilityFormState => ({
  motorNo: "",
  a_emptyMotor: "",
  b_rubberDust: "",
  c_linearCoating: "",
  d_looseFlapFill: "",
  e_extraRubber: "",
  f_inhibition: "",
  g_finalWeight: "",
});

export const calculateStaticTestFacilityPropellant = (
  form: Partial<StaticTestFacilityFormState>
) => {
  const toNumber = (value: string | undefined) => parseFloat(value ?? "") || 0;
  const a = toNumber(form.a_emptyMotor);
  const b = toNumber(form.b_rubberDust);
  const c = toNumber(form.c_linearCoating);
  const d = toNumber(form.d_looseFlapFill);
  const e = toNumber(form.e_extraRubber);
  const f = toNumber(form.f_inhibition);
  const g = toNumber(form.g_finalWeight);
  const result = g - (a - b + c + d - e + f);

  if (!a && !b && !c && !d && !e && !f && !g) return "";
  return Number.isNaN(result) ? "" : result.toFixed(4).replace(/\.?0+$/, "");
};

export const hasAnyStaticTestFacilityValue = (form: StaticTestFacilityFormState) =>
  Object.values(form).some((value) => String(value ?? "").trim().length > 0);
