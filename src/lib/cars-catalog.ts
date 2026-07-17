import catalogRaw from "@/data/cars-catalog.json";

export type CatalogModification = {
  raw: string;
  chassis_code: string | null;
  engine_code: string | null;
  displacement_cc: number | null;
  horsepower: number | null;
  fuel: string | null;
  hybrid: boolean;
  steering: string | null;
  note: string | null;
  body_code: string | null;
};

export type CatalogModel = { name: string; modifications: CatalogModification[] };
export type CatalogYear = { year: number; models: CatalogModel[] };
export type CatalogBrand = { name: string; available_years: number[]; years: CatalogYear[] };

type CatalogRoot = {
  brands: CatalogBrand[];
  catalog_brands: string[];
};

const catalog = catalogRaw as unknown as CatalogRoot;

// Приоритет "популярных" марок (как на референсе). Оставляем только те, что есть в каталоге.
const POPULAR_ORDER = [
  "Honda",
  "Hyundai",
  "Kia",
  "Lexus",
  "Mazda",
  "Mitsubishi",
  "Nissan",
  "Subaru",
  "Suzuki",
  "Toyota",
];

const brandMap = new Map<string, CatalogBrand>();
catalog.brands.forEach((b) => brandMap.set(b.name.toLowerCase(), b));

export const getAllCatalogBrandNames = (): string[] => catalog.catalog_brands ?? [];

export const getLoadedBrands = (): CatalogBrand[] => catalog.brands;

export const popularBrands = (): string[] =>
  POPULAR_ORDER.filter((n) => brandMap.has(n.toLowerCase()));

export const getBrand = (name: string): CatalogBrand | null =>
  brandMap.get(name.toLowerCase()) ?? null;

export const getYearsForBrand = (name: string): number[] => {
  const b = getBrand(name);
  if (!b) return [];
  return b.years.map((y) => y.year);
};

export const getModelsForBrandYear = (
  brand: string,
  year: number,
): CatalogModel[] => {
  const b = getBrand(brand);
  return b?.years.find((y) => y.year === year)?.models ?? [];
};

export const getModifications = (
  brand: string,
  year: number,
  model: string,
): CatalogModification[] => {
  const models = getModelsForBrandYear(brand, year);
  return models.find((m) => m.name === model)?.modifications ?? [];
};

export const searchBrandNames = (query: string): string[] => {
  const q = query.trim().toLowerCase();
  const all = getAllCatalogBrandNames();
  if (!q) return all;
  return all.filter((n) => n.toLowerCase().includes(q));
};

export const isBrandLoaded = (name: string): boolean => brandMap.has(name.toLowerCase());
