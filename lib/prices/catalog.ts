import { mockPriceItems } from "./mock";
import { greenOnionPoc } from "./poc-data";
import { forecastMetrics, type PriceRecord } from "./poc-types";

const categories = { VEGETABLE: "채소류", GRAIN: "곡류", FRUIT: "과일류", MEAT: "육류", SEAFOOD: "수산물", ETC: "기타" };
// Legacy fixture adapters: deliberately exclude the obsolete green-onion record.
const demoItems: PriceRecord[] = mockPriceItems.filter(item => item.id !== 1).map(item => {
  const last = item.forecast.at(-1)!;
  return {
    id: String(item.id), name: item.name, aliases: item.aliases,
    category: categories[item.category], categoryCode: item.category, unit: item.unitLabel,
    image: item.id === 2 ? "/figma/home/onion.png" : null,
    isPoc: false, isDemo: true, baseDate: item.baseDate, currentPrice: item.currentPrice,
    forecastDate: last.date, forecastPrice: last.price,
    ...forecastMetrics(item.currentPrice, last.price), factors: [],
    priceHistory: item.history, factorHistory: [],
  };
});
export const priceCatalog = [greenOnionPoc, ...demoItems];
export const featuredPrices = [greenOnionPoc, ...demoItems.filter(item => item.id === "2" || item.id === "13")];
export function findPrice(id: string) {
  return priceCatalog.find(item => item.id === (id === "1" ? greenOnionPoc.id : id));
}
export function filterPrices(keyword: string, category: string) {
  const query = keyword.trim().toLocaleLowerCase("ko-KR");
  return priceCatalog.filter(item => (category === "ALL" || item.categoryCode === category)
    && [item.name, ...item.aliases].some(name => name.toLocaleLowerCase("ko-KR").includes(query)));
}
