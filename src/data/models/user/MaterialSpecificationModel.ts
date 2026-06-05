export type ReferenceRangeModel = {
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
};

export class MaterialSpecificationItemModel {
  specificationCode: string;
  specificationName: string;
  referenceRange: ReferenceRangeModel;

  constructor(payload: {
    specificationCode?: string;
    specificationName?: string;
    referenceRange?: Partial<ReferenceRangeModel>;
  }) {
    const raw = payload as Record<string, unknown>;
    this.specificationCode = String(
      payload.specificationCode ??
        raw.specCode ??
        raw.code ??
        raw.specification_code ??
        raw.specificationId ??
        ""
    ).trim();
    this.specificationName = String(
      payload.specificationName ?? raw.specification_name ?? raw.name ?? ""
    ).trim();
    this.referenceRange = {
      minValue: payload.referenceRange?.minValue ?? null,
      maxValue: payload.referenceRange?.maxValue ?? null,
      unit: payload.referenceRange?.unit ?? null,
    };
  }

  get formattedReferenceRange(): string {
    const { minValue, maxValue, unit } = this.referenceRange;
    const unitSuffix = unit ? ` ${unit}` : "";

    if (minValue != null && maxValue != null) {
      return `${minValue} - ${maxValue}${unitSuffix}`;
    }

    if (minValue != null) {
      return `>= ${minValue}${unitSuffix}`;
    }

    if (maxValue != null) {
      return `<= ${maxValue}${unitSuffix}`;
    }

    return "N/A";
  }
}

export class MaterialSpecificationListModel {
  materialCode: string;
  specifications: MaterialSpecificationItemModel[];

  constructor(payload: { materialCode?: string; specifications?: MaterialSpecificationItemModel[] }) {
    this.materialCode = payload.materialCode ?? "";
    this.specifications = payload.specifications ?? [];
  }

  static fromApi(apiResponse: any): MaterialSpecificationListModel {
    const data = apiResponse?.data ?? {};
    const specs = Array.isArray(data?.specifications)
      ? data.specifications
      : Array.isArray((data as any)?.specificationList)
        ? (data as any).specificationList
        : Array.isArray(apiResponse?.specifications)
          ? apiResponse.specifications
          : [];

    return new MaterialSpecificationListModel({
      materialCode: data?.materialCode ?? apiResponse?.materialCode ?? "",
      specifications: specs.map((item: any) => new MaterialSpecificationItemModel(item)),
    });
  }
}
