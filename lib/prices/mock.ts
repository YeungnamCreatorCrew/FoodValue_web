import { changeRate, forecastRate } from "./format";
import type { Category, PriceItem, PricesDataSource, RecipeRecommendation, Recommendation } from "./types";

// Fixed illustrative data, never presented as live prices or measured accuracy.
export const MOCK_BASE_DATE = "2026-10-06";
const day = (offset: number) => {
  const date = new Date(`${MOCK_BASE_DATE}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
type Seed = [number, string, Category, string, number, number, number, Recommendation, string[]];
const seeds: Seed[] = [
  [1, "흙대파", "VEGETABLE", "1단 · 800g", 3250, 3004, 3450, "BUY_LATER", ["대파", "파", "다진 파"]],
  [2, "양파", "VEGETABLE", "1.5kg", 4200, 4795, 3800, "BUY_LATER", ["깐양파"]],
  [3, "시금치", "VEGETABLE", "1단", 5400, 5702, 4900, "HOLD", []],
  [4, "삼겹살", "MEAT", "국산 냉장 · 100g", 2680, 2710, 2650, "STABLE", ["돼지고기"]],
  [5, "쌀", "GRAIN", "20kg", 58000, 58500, 59600, "BUY_NOW", ["백미"]],
  [6, "사과", "FRUIT", "10개", 22500, 23200, 21800, "BUY_LATER", []],
  [7, "감자", "VEGETABLE", "1kg", 3100, 3500, 2950, "BUY_LATER", []],
  [8, "배추", "VEGETABLE", "1포기", 6200, 5800, 6550, "BUY_NOW", []],
  [9, "한우 등심", "MEAT", "1등급 · 100g", 9800, 9950, 9700, "STABLE", ["소고기"]],
  [10, "배", "FRUIT", "10개", 32000, 33000, 31000, "HOLD", []],
  [11, "고구마", "GRAIN", "1kg", 4500, 4700, 4600, "BUY_NOW", []],
  [12, "오이", "VEGETABLE", "10개", 7800, 8200, 7200, "BUY_LATER", []],
  [13, "토마토", "VEGETABLE", "1kg", 6500, 6800, 6300, "HOLD", []],
];
export const mockPriceItems: PriceItem[] = seeds.map(([id, name, category, unitLabel, currentPrice, previous, end, recommendation, aliases]) => {
  const history = Array.from({ length: 91 }, (_, i) => {
    const offset = i - 90;
    const price = offset === 0 ? currentPrice : offset === -7 ? previous : Math.round((currentPrice + (previous - currentPrice) * Math.min(-offset / 14, 1) + Math.sin(i * 0.7 + id) * currentPrice * 0.025) / 10) * 10;
    return { date: day(offset), price };
  });
  const forecast = Array.from({ length: 7 }, (_, i) => {
    const n = i + 1;
    // Day-three dip supports the leek's purchase guide, then recovers.
    const price = id === 1 ? [3180, 2980, 2800, 3040, 3190, 3310, 3450][i] : Math.round((currentPrice + (end - currentPrice) * n / 7) / 10) * 10;
    const width = Math.round(currentPrice * (0.025 + n * 0.005));
    return { date: day(n), price, lower: price - width, upper: price + width };
  });
  return {
    id, name, category, unitLabel, aliases, currentPrice, history, forecast, recommendation,
    baseDate: MOCK_BASE_DATE, updatedAt: `${MOCK_BASE_DATE}T06:00:00+09:00`,
    weeklyChangeRate: changeRate(currentPrice, previous),
    buyAfterDays: recommendation === "BUY_LATER" ? (id === 1 ? 3 : 7) : null,
    expectedSaving: recommendation === "BUY_LATER" ? currentPrice - Math.min(...forecast.map(p => p.price)) : null,
    mape: 3.8,
    factors: [
      { kind: "WEATHER", direction: "UP", contribution: 34, description: "전국 평균 강수량 증가" },
      { kind: "PRODUCTION", direction: "DOWN", contribution: 28, description: "출하량 회복" },
      { kind: "SEASONAL", direction: "UP", contribution: 22, description: "계절 수요 증가" },
      { kind: "TREND", direction: "DOWN", contribution: 16, description: "단기 이동평균 하락" },
    ],
    inventory: id === 1 ? [{ quantity: 0.2, initialQuantity: 1, unit: "단" }] : [],
    regions: [
      { code: "SEOUL", name: "서울", price: currentPrice + 30 },
      { code: "DAEGU", name: "대구", price: currentPrice - 100 },
      { code: "BUSAN", name: "부산", price: currentPrice + 60 },
      { code: "DAEJEON", name: "대전", price: currentPrice - 40 },
      { code: "GWANGJU", name: "광주", price: currentPrice + 10 },
    ],
  };
});
function recipesFor(item: PriceItem): RecipeRecommendation[] {
  const ingredient = item.id === 1 ? "대파" : item.name;
  const titles = item.id === 1 ? ["대파 계란볶음", "대파 제육볶음", "대파 파스타"] : [`${ingredient} 볶음`, `${ingredient} 덮밥`, `${ingredient} 곁들임`];
  const otherIngredients = ["달걀", "돼지고기", "파스타면"];
  return titles.map((title, i) => ({ title, minutes: [10, 20, 15][i], difficulty: "쉬움", servings: 2,
    description: `${ingredient}를 활용해 간편하게 만드는 ${title}입니다.`,
    ingredients: [ingredient, otherIngredients[i]],
    ownedCount: item.inventory.length ? 1 : 0, matchRate: item.inventory.length ? 50 : 0,
    missingIngredients: item.inventory.length ? [otherIngredients[i]] : [ingredient, otherIngredients[i]],
    usesExpiringIngredient: false,
  }));
}
// No backend routes added. Replace this provider when response contracts are agreed.
export const mockPricesSource: PricesDataSource = {
  async list(query) {
    const keyword = query.keyword.trim().toLocaleLowerCase("ko-KR");
    const filtered = mockPriceItems.filter(item => (query.category === "ALL" || item.category === query.category)
      && [item.name, ...item.aliases].some(name => name.toLocaleLowerCase("ko-KR").includes(keyword)));
    filtered.sort((a, b) => query.sort === "name" ? a.name.localeCompare(b.name, "ko")
      : query.sort === "forecast-drop" ? forecastRate(a) - forecastRate(b)
      : a.weeklyChangeRate - b.weeklyChangeRate);
    const start = (query.page - 1) * query.size;
    return { items: filtered.slice(start, start + query.size), total: filtered.length };
  },
  async detail(id) { return mockPriceItems.find(item => item.id === id) ?? null; },
  async chart(id, period) {
    const item = await this.detail(id);
    if (!item) throw new Error("품목을 찾을 수 없습니다.");
    return { history: item.history.slice(-(period + 1)), forecast: item.forecast };
  },
  async regions(id) { return (await this.detail(id))?.regions ?? []; },
  async recommendations(id) { const item = await this.detail(id); return item ? recipesFor(item) : []; },
};
