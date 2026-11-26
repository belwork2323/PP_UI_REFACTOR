import type { MasterDataFormState } from "@data/models/admin/MasterData/MasterDataModel";

export const SUBSCALE_ARTICLES_TYPE = "subscale-articles";
/** Preferred initial unit when Unit Master has a Kg entry. */
export const DEFAULT_BEM_UNIT = "Kg";

export const composeBemArticleName = (size: number | string, unit: string): string =>
  `${Number(size)} ${unit} BEM`;

export const isSubscaleBemArticle = (form: MasterDataFormState): boolean =>
  form.attributes?.isBem === true;

const composeNameFromAttrs = (
  attributes: MasterDataFormState["attributes"],
): string => {
  const size = attributes.bemSize;
  const unit = String(attributes.bemUnit ?? "").trim();
  if (size === "" || size == null || size === false || !unit) return "";
  return composeBemArticleName(size as number | string, unit);
};

export const applySubscaleArticleAttributeChange = (
  form: MasterDataFormState,
  key: string,
  value: string | number | boolean,
): MasterDataFormState => {
  const attributes: MasterDataFormState["attributes"] = {
    ...form.attributes,
    [key]: value,
  };
  let name = form.name;

  if (key === "isBem") {
    if (value === true) {
      attributes.bemUnit = DEFAULT_BEM_UNIT;
      name = composeNameFromAttrs(attributes);
    } else {
      attributes.bemSize = "";
      attributes.bemUnit = "";
      name = "";
    }
  } else if (attributes.isBem === true && key === "bemUnit") {
    attributes.bemUnit = DEFAULT_BEM_UNIT;
    name = composeNameFromAttrs(attributes);
  } else if (attributes.isBem === true && key === "bemSize") {
    name = composeNameFromAttrs(attributes);
  }

  return { ...form, name, attributes };
};
