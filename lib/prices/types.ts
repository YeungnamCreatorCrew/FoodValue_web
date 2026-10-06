// Frontend view models. The API document defines endpoints, not JSON contracts.
export type Category = "VEGETABLE" | "GRAIN" | "FRUIT" | "MEAT" | "SEAFOOD" | "ETC";
export type Recommendation = "BUY_NOW" | "BUY_LATER" | "HOLD" | "STABLE";
export type PriceSort = "price-drop" | "forecast-drop" | "name";
export type Period = 14 | 30 | 90;
export type FactorKind = "WEATHER" | "PRODUCTION" | "EVENT" | "SEASONAL" | "TREND";
export interface DailyPrice { date: string; price: number }
export interface Forecast extends DailyPrice { lower: number; upper: number }
export interface PriceFactor {
  kind: FactorKind;
  direction: "UP" | "DOWN";
  contribution: number;
  description: string;
}
export interface PriceItem {
  id: number;
  name: string;
  aliases: string[];
  category: Category;
  unitLabel: string;
  currentPrice: number;
  weeklyChangeRate: number;
  baseDate: string;
  updatedAt: string;
  forecast: Forecast[];
  recommendation: Recommendation;
  buyAfterDays: number | null;
  expectedSaving: number | null;
  mape: number | null;
  factors: PriceFactor[];
  history: DailyPrice[];
  inventory: { quantity: number; initialQuantity: number; unit: string }[];
  regions: { code: string; name: string; price: number }[];
}
export interface RecipeRecommendation {
  title: string;
  minutes: number;
  difficulty: string;
  servings: number;
  description: string;
  ingredients: string[];
  matchRate: number;
  ownedCount: number;
  missingIngredients: string[];
  usesExpiringIngredient: boolean;
}
export interface PriceQuery {
  category: Category | "ALL";
  keyword: string;
  sort: PriceSort;
  page: number;
  size: number;
}
export interface PricePage { items: PriceItem[]; total: number }
export interface PricesDataSource {
  list(query: PriceQuery): Promise<PricePage>;
  detail(itemId: number): Promise<PriceItem | null>;
  chart(itemId: number, period: Period): Promise<{ history: DailyPrice[]; forecast: Forecast[] }>;
  regions(itemId: number): Promise<PriceItem["regions"]>;
  recommendations(itemId: number): Promise<RecipeRecommendation[]>;
}
