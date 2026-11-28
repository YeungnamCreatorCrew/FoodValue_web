// Contract/adapter checks only. No browser, live WAS, database, or .env access.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";
import ts from "typescript";

// Compile the project's TS modules in memory; no extra runner or emitted files.
const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, filename) => {
  const result = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    fileName: filename,
  });
  module._compile(result.outputText, filename);
};
const { pricesApi, PriceApiError } = require("../lib/prices/api.ts");
const { itemImage } = require("../lib/prices/item-images.ts");
const { mapSummary, mapDetail, withForecast, mapIndicators } = require("../lib/prices/mapper.ts");
const { getPriceChart, resolveFavoriteId, resolvePriceRoute } = require("../lib/prices/service.ts");
const { forecastChart } = require("../lib/prices/forecast-chart.ts");
const { favoriteIdentity } = require("../lib/prices/identity.ts");
const { won } = require("../lib/prices/format.ts");
const { mapDataFactors } = require("../lib/prices/factors.ts");
const { mapShapAnalysis, mapAiSummary, unavailableText } = require("../lib/prices/shap.ts");
const { getPriceFactors, getFactorTrend } = require("../lib/prices/service.ts");

const summary = {
  id: 901, name: "대파", category: "VEGETABLE", market: "RETAIL", seriesId: 451,
  unitLabel: "1kg", source: "KAMIS", priceDate: "2026-11-09", currentPrice: 3000,
  weeklyChangePercent: -1.5, forecastPrice: 2800, forecastChangePercent: -6.67,
  forecastBaseDate: "2026-11-09", forecastTargetDate: "2026-11-16", quality: "VALIDATED", status: "READY",
};
const points = Array.from({ length: 7 }, (_, index) => ({
  targetDate: "2026-11-" + (10 + index), predictedPrice: [2990, 2910, 2950, 2900, 2870, 2820, 2800][index],
  lowerPrice: index === 0 ? null : 2700, upperPrice: 3200,
}));
const forecast = { itemId: 901, market: "RETAIL", seriesId: 451, status: "READY", baseDate: "2026-11-09", points };
const detail = { item: summary, forecast, guide: { recommendation: "BUY_NOW", buyAfterDays: null, expectedSaving: 0, mape: 2.5, factors: [{ name: "최근 가격", kind: "OBSERVATION", latestPrice: 3000 }] } };
const bounds = { left: 50, right: 350, top: 30, bottom: 200 };
const originalFetch = globalThis.fetch;
const calls = [];
function respond(body, status = 200) {
  globalThis.fetch = async (url, options) => {
    calls.push({ url: new URL(url), options });
    return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
  };
}

try {
  await test("list sends keyword, enum, sort and pagination; ALL is omitted", async () => {
    respond({ items: [summary], page: 2, size: 12, total: 20 });
    await pricesApi.list({ keyword: " 대파 ", category: "ALL", sort: "price-drop", page: 2, size: 12 });
    let params = calls.at(-1).url.searchParams;
    assert.equal(calls.at(-1).url.pathname, "/api/v1/prices/items");
    assert.equal(params.get("keyword"), "대파"); assert.equal(params.has("q"), false);
    assert.equal(params.has("category"), false); assert.equal(params.get("sort"), "change");
    assert.equal(params.get("page"), "2"); assert.equal(params.get("size"), "12");
    assert.equal(params.get("market"), "RETAIL"); assert.equal(calls.at(-1).options.cache, "no-store");
    await pricesApi.list({ category: "ETC", sort: "forecast-drop", size: 100 });
    params = calls.at(-1).url.searchParams;
    assert.equal(params.get("category"), "ETC"); assert.equal(params.get("sort"), "forecast"); assert.equal(params.get("size"), "50");
  });
  await test("nullable summary prices stay absent", () => {
    const item = mapSummary({ ...summary, currentPrice: null, forecastPrice: null, priceDate: null, forecastBaseDate: null, forecastTargetDate: null });
    assert.equal(item.currentPrice, null); assert.equal(item.forecastPrice, null);
    assert.equal(item.forecastDelta, null); assert.equal(item.forecastPercent, null); assert.equal(item.forecastDirection, null);
    assert.equal(item.baseDate, null); assert.equal(won(item.currentPrice), "-");
  });
  await test("nested detail uses seven daily points and the server guide; factors stay observations", () => {
    const item = mapDetail(detail);
    assert.equal(item.id, "901"); assert.equal(item.forecastPoints.length, 7);
    assert.equal(item.forecastPoints[1].price, 2910); assert.equal(item.forecastPoints[0].lower, null);
    assert.equal(item.guide.recommendation, "BUY_NOW"); assert.equal("title" in item.guide, false); // 서버 원값만 남기고 판정 문구는 만들지 않는다.
    assert.equal("factors" in item, false);
    assert.equal(item.forecastStatus, "READY"); assert.equal(item.dataFactors.length, 1);
    assert.deepEqual(item.dataFactors[0].facts, [{ label: "최근 가격", value: "3,000원" }]);
    assert.equal(item.forecastDirection, "down");
  });
  await test("empty forecast removes summary predictions instead of falling back", () => {
    const item = mapDetail({ ...detail, forecast: { ...forecast, points: [] }, guide: null });
    assert.equal(item.forecastPrice, null); assert.equal(item.forecastDate, null); assert.equal(item.guide, null);
    assert.deepEqual(item.forecastPoints, []); assert.equal(forecastChart(item, 30, bounds).forecastPath, "");
  });
  await test("WAS guide.factors map to observation cards without SHAP or direction", () => {
    const factors = mapDataFactors([
      { name: "최근 가격", kind: "OBSERVATION", latestPrice: 3004, dataDate: "2026-11-09", mean7Observed: 3051.43, description: "관측된 최근 가격 통계입니다." },
      { name: "도매가격", kind: "OBSERVATION", source: "KAMIS", market: "WHOLESALE", latestPrice: 2100, dataDate: "2026-11-08", usedByModel: true, modelWeight: 0.3123, description: "d" },
      { name: "주산지 기상", kind: "OBSERVATION", source: "KMA", days: 7, dataDate: "2026-11-08", meanTemperature7: 8.4, precipitationSum7: null, usedByModel: false },
      { name: "공휴일", kind: "CALENDAR", source: "KASI", usedByModel: true, holidays: [{ date: "2026-11-11", name: "테스트휴일" }] },
      { name: "외부변수 가중치", kind: "MODEL", method: "constrained_ridge_stacking", weights: [{ block: "MARKET", label: "상대 시장 가격", weight: 0.31 }, { block: "X", weight: 1.7 }, { block: "Y" }] },
      { kind: "OBSERVATION" }, null, "bad",
    ]);
    assert.equal(factors.length, 5);
    assert.deepEqual(factors[0].facts.map(fact => fact.value), ["3,004원", "3,051원"]);
    assert.equal(factors[1].usedByModel, true); assert.equal(factors[1].modelWeight, 0.3123);
    assert.deepEqual(factors[1].facts.find(fact => fact.label === "시장"), { label: "시장", value: "도매" });
    assert.deepEqual(factors[2].facts.map(fact => fact.label), ["7일 평균기온", "관측 일수"]); // null rain is omitted, not 0
    assert.equal(factors[3].facts[0].value, "11/11 테스트휴일");
    assert.deepEqual(factors[4].weights, [{ label: "상대 시장 가격", weight: 0.31 }, { label: "X", weight: 1 }]);
    for (const factor of factors) assert.equal("shapValue" in factor || "direction" in factor, false);
    assert.deepEqual(mapDataFactors(undefined), []); assert.deepEqual(mapDataFactors({}), []);
  });
  // 상태 안내 문구는 화면 컴포넌트(detail-hero, forecast-section)로 옮겨 화면 검사에서 확인한다.
  await test("detail without forecast maps empty factors and MERGED source reads as KAMIS", () => {
    const item = mapDetail({ ...detail, item: { ...summary, status: "NO_FORECAST", currentPrice: 3000, forecastPrice: null },
      forecast: { ...forecast, status: "INSUFFICIENT_DATA", points: [] }, guide: null });
    assert.deepEqual(item.dataFactors, []); assert.equal(item.forecastStatus, "INSUFFICIENT_DATA");
    assert.equal(mapDetail({ ...detail, item: { ...summary, source: "MERGED" } }).source, "KAMIS");
  });
  await test("history preserves nulls and passes each supported days value with the actual item ID", async () => {
    globalThis.fetch = async (url, options) => {
      const parsed = new URL(url); calls.push({ url: parsed, options });
      return new Response(JSON.stringify(parsed.pathname.endsWith("/forecast") ? forecast : {
        itemId: 901, market: "RETAIL", days: Number(parsed.searchParams.get("days")), endDate: "2026-11-09",
        points: [{ date: "2026-11-07", price: 3100 }, { date: "2026-11-08", price: null }, { date: "2026-11-09", price: 3000 }],
      }));
    };
    for (const days of [14, 30, 90, 180, 365]) {
      const data = await getPriceChart("901", days);
      assert.equal(data.priceHistory[1].price, null);
      const request = calls.at(-2).url;
      assert.equal(request.pathname, "/api/v1/prices/items/901/history"); assert.equal(request.searchParams.get("days"), String(days));
      const item = withForecast({ ...mapSummary(summary), priceHistory: data.priceHistory, historyEndDate: data.historyEndDate }, data.forecast, data.forecastBaseDate);
      const chart = forecastChart(item, days, bounds);
      assert.equal((chart.actualPath.match(/M/g) ?? []).length, 1); // Trading-day axis: days with a price are joined; the null day takes no slot.
      assert.equal(chart.actual.length, 2); assert.equal(chart.forecast.length, 7);
      assert.equal((chart.forecastPath.match(/L/g) ?? []).length, 7);
      assert.equal(/NaN|Infinity/.test(chart.actualPath + chart.forecastPath), false);
    }
  });
  await test("all-null history, missing dates and absent predictions produce no invented points", () => {
    const item = { ...mapSummary({ ...summary, currentPrice: null, forecastPrice: null, priceDate: null, forecastBaseDate: null, forecastTargetDate: null }),
      priceHistory: [{ date: "2026-11-09", price: null }], historyEndDate: "2026-11-09" };
    const chart = forecastChart(item, 14, bounds);
    assert.equal(chart.actual.length, 0); assert.equal(chart.actualPath.trim(), ""); assert.equal(chart.forecastPath, "");
    assert.ok(Number.isFinite(chart.min) && Number.isFinite(chart.max));
  });
  await test("legacy favorites and slugs use catalog-returned IDs; numeric routes are WAS IDs", async () => {
    respond({ items: [summary], page: 1, size: 50, total: 1 });
    assert.equal(await resolveFavoriteId("green-onion"), "901");
    assert.equal(await resolveFavoriteId("1"), "901");
    assert.equal(await resolveFavoriteId("was:777"), "777");
    assert.equal(await resolvePriceRoute("green-onion"), "901");
    assert.equal(await resolvePriceRoute("1"), "1");
    assert.deepEqual(favoriteIdentity(mapSummary(summary)), { id: "was:901", aliases: ["green-onion"] });
    respond({ items: [], page: 1, size: 50, total: 0 });
    assert.equal(await resolveFavoriteId("green-onion"), null);
  });
  await test("404, server failure and unavailable network remain errors", async () => {
    respond({}, 404); await assert.rejects(pricesApi.detail("901"), error => error instanceof PriceApiError && error.status === 404);
    respond({}, 500); await assert.rejects(pricesApi.forecast("901"), error => error.status === 500);
    globalThis.fetch = async () => { throw new TypeError("network unavailable"); };
    await assert.rejects(pricesApi.detail("901"), error => error.status === 0);
    assert.throws(() => pricesApi.detail("green-onion"), error => error.status === 404);
    assert.throws(() => pricesApi.detail("9007199254740993"), error => error.status === 404);
  });
  await test("cancelled requests carry the abort signal and cannot become fallback data", async () => {
    const controller = new AbortController(); controller.abort();
    globalThis.fetch = async (url, options) => { options.signal.throwIfAborted(); };
    await assert.rejects(pricesApi.detail("901", controller.signal), error => error.name === "AbortError");
    assert.equal(calls.some(call => call.url.pathname.includes("/factors")), false);
  });
  await test("model track: default calls stay unchanged, STRUCT adds model=STRUCT, an old WAS reply is refused", async () => {
    respond({ itemId: 901, market: "RETAIL", seriesId: 1, status: "SUCCESS", points: [] });
    await pricesApi.forecast("901");
    assert.equal(calls.at(-1).url.searchParams.get("model"), null);
    respond({ itemId: 901, market: "RETAIL", seriesId: 1, modelTrack: "STRUCT", status: "SUCCESS", points: [] });
    await pricesApi.forecast("901", undefined, "STRUCT");
    assert.equal(calls.at(-1).url.searchParams.get("model"), "STRUCT");
    respond({ itemId: 901, market: "RETAIL", seriesId: 1, status: "SUCCESS", points: [] });
    await assert.rejects(pricesApi.forecast("901", undefined, "STRUCT"), error => error.status === 501);
    respond({ itemId: 901, market: "RETAIL", factorId: "nat_temp_mean7", label: "x", unit: "", baseDate: "2026-11-09", days: 90, points: [] });
    await pricesApi.factorHistory("901", "nat_temp_mean7", 90);
    assert.equal(calls.at(-1).url.pathname, "/api/v1/prices/items/901/factors/nat_temp_mean7/history");
  });
  await test("factors: SHAP rows keep server order/values; category sentences come from the server summary", async () => {
    const summaryText = { headline: "현재 3,000원인 대파 소매가격은 7일 후 2,800원으로 약 6.7% 낮아질 것으로 예측되었습니다.",
      detail: "기상 조건은 하락 방향으로 작용했습니다.", categories: { WEATHER: "기상 조건은 가격을 낮추는 방향으로 작용했습니다." }, generator: "GEMINI" };
    respond({ itemId: 901, market: "RETAIL", baseDate: "2026-11-09", status: "READY", explained: true, unavailableReason: null,
      modelName: "XGBOOST_EXT", method: "XGBOOST_TREE_SHAP", horizonDays: 7, targetDate: "2026-11-16", currentPrice: 3000, basePrice: 2990, predictedPrice: 2800,
      summary: summaryText,
      categories: [{ category: "WEATHER", label: "기상 조건", contribution: -150, direction: "DOWN", description: null },
        { category: "MACRO", label: "생산량·환율", contribution: 0, direction: "NEUTRAL", description: null }],
      factors: [{ id: "tempMean7", label: "주산지 최근 7일 평균기온", category: "WEATHER", value: 18.2, unit: "℃", previousValue: 21, previousDate: "2026-11-02", contribution: -150, direction: "DOWN", hasHistory: true },
        { id: "targetSeason", label: "예측 대상일의 계절", category: "CALENDAR", value: null, unit: "", previousValue: null, previousDate: null, contribution: -40, direction: "DOWN", hasHistory: false }] });
    const analysis = await getPriceFactors("901");
    assert.equal(calls.at(-1).url.pathname, "/api/v1/prices/items/901/factors");
    assert.equal(calls.at(-1).url.searchParams.get("market"), "RETAIL");
    assert.equal(analysis.explained, true);
    assert.deepEqual(analysis.factors.map(f => [f.id, f.direction, f.categoryLabel]), [["tempMean7", "down", "날씨"], ["targetSeason", "down", "달력·계절"]]);
    assert.equal(analysis.categories[0].description, summaryText.categories.WEATHER);
    assert.match(analysis.categories[1].description, /중립/);
    assert.equal(analysis.summary.generator, "GEMINI");
  });
  await test("factors: baseline runs are not explained and keep a reason", () => {
    const analysis = mapShapAnalysis({ itemId: 60, market: "RETAIL", baseDate: "2026-11-05", status: "STALE", explained: false, unavailableReason: "BASELINE_MODEL",
      modelName: "LAST_PRICE", evaluationStart: "2026-09-07", evaluationEnd: "2026-10-29", method: null, horizonDays: null, targetDate: null, currentPrice: null, basePrice: null, predictedPrice: null, summary: null, categories: [], factors: [] });
    assert.equal(analysis.explained, false); assert.match(unavailableText(analysis.unavailableReason), /직전 가격/);
    assert.equal(analysis.evaluationStart, "2026-09-07"); assert.equal(analysis.evaluationEnd, "2026-10-29");
    assert.equal(mapAiSummary(null), null);
  });
  await test("factor history requests 90 days once and drops missing values without filling", async () => {
    respond({ itemId: 901, market: "RETAIL", factorId: "tempMean7", label: "기온", unit: "℃", baseDate: "2026-11-09", days: 90,
      points: [{ date: "2026-11-08", value: null }, { date: "2026-11-09", value: 18.2 }] });
    const trend = await getFactorTrend("901", "tempMean7", 90);
    assert.equal(calls.at(-1).url.pathname, "/api/v1/prices/items/901/factors/tempMean7/history");
    assert.equal(calls.at(-1).url.searchParams.get("days"), "90");
    assert.deepEqual(trend.points, [{ date: "2026-11-09", value: 18.2 }]);
    assert.throws(() => pricesApi.factorHistory("901", "../x", 30), error => error.status === 404);
  });
  await test("detail maps the server summary; absent summary stays null", () => {
    assert.equal(mapDetail({ ...detail, summary: { headline: "h", detail: "d", categories: {}, generator: "TEMPLATE" } }).aiSummary.headline, "h");
    assert.equal(mapDetail(detail).aiSummary, null);
  });
  await test("chart: trading-day axis — only days with a price get a slot, joined directly; tooltip previous skips the gap", () => {
    const history = [{ date: "2026-11-06", price: 1000 }, { date: "2026-11-07", price: null }, { date: "2026-11-08", price: null }, { date: "2026-11-09", price: 1100 }, { date: "2026-11-10", price: 1050 }];
    const chart = forecastChart({ baseDate: "2026-11-10", priceDate: "2026-11-10", currentPrice: 1050, forecastDate: "2026-11-11", forecastPrice: 1040,
      priceHistory: history, historyEndDate: "2026-11-10", forecastPoints: [{ date: "2026-11-11", price: 1040, lower: null, upper: null }] }, 5, bounds);
    assert.deepEqual(chart.points.map(p => [p.date, p.kind]), [["2026-11-06", "actual"], ["2026-11-09", "actual"], ["2026-11-10", "actual"], ["2026-11-11", "forecast"]]);
    assert.equal(chart.actualPath.split("M").length - 1, 1); // one continuous line, no break
    const gaps = chart.points.slice(1).map((p, i) => +(p.x - chart.points[i].x).toFixed(6));
    assert.equal(new Set(gaps).size, 1); // equal spacing: the weekend takes no space
    assert.equal(chart.points[1].previous.date, "2026-11-06"); // 11/09 compares with 11/06
    assert.equal(chart.points[3].previous.date, "2026-11-10"); // first forecast compares with the last actual
    assert.equal(chart.forecastPath.split("M").length - 1, 1);
  });
  await test("indicators (draft): unknown keys skipped, server state kept, WEAK has no direction, chart points sorted", () => {
    const result = mapIndicators({ itemId: 60, market: "RETAIL", asOfDate: "2026-10-30", unavailableReason: null,
      summary: { headline: "h", signals: [{ key: "SEASONAL", label: "같은 시기 대비", state: "DOWN", stateLabel: "싼 편" }] },
      cards: [
        { key: "NEW_THING", verdict: "PASS", state: "UP", fact: {} },
        { key: "SEASONAL", verdict: "FACT", state: "DOWN", fact: { currentPrice: 2658, diffRate: -0.149, normalYears: [2021] },
          chart: { type: "SEASONAL_OVERLAY", currentYear: 2026, years: [{ year: 2026, points: [{ week: 2, price: 10 }, { week: 1, price: null }, { week: 1, price: 9 }] }] } },
        { key: "WHOLESALE_LEAD", verdict: "PASS", state: "UP", fact: { wholesaleChange2w: 0.06 }, chart: { type: "UNKNOWN_CHART" } },
        { key: "ARRIVALS", verdict: "WEAK", state: "UP", fact: { avgTon4w: 325 } },
      ] });
    assert.deepEqual(result.cards.map(card => card.key), ["SEASONAL", "WHOLESALE_LEAD", "ARRIVALS"]);
    assert.equal(result.cards[0].state, "down"); assert.equal(result.cards[0].stateLabel, "싼 편");
    assert.deepEqual(result.cards[0].chart.years[0].points, [{ week: 1, price: 9 }, { week: 2, price: 10 }]);
    assert.equal(result.cards[1].state, "up"); assert.equal(result.cards[1].chart, null); assert.equal(result.cards[1].fact.retailChange2w, null);
    assert.equal(result.cards[2].state, null);
    assert.equal(mapIndicators({ itemId: 1, market: "RETAIL", asOfDate: null, unavailableReason: "준비 중", summary: null, cards: [] }).headline, null);
  });
  await test("item images resolve by WAS name or alias; unknown items fall back to the icon", () => {
    assert.equal(itemImage("대파"), "/images/items/green-onion.webp");
    assert.equal(itemImage("깐마늘"), "/images/items/peeled-garlic.webp");
    assert.equal(itemImage("배추(월동)"), "/images/items/napa-cabbage.webp");
    assert.equal(itemImage("국산 마늘", ["마늘"]), "/images/items/peeled-garlic.webp");
    assert.equal(itemImage("토마토"), null);
    assert.equal(mapSummary({ ...summary, name: "무" }).image, "/images/items/radish.webp");
    assert.equal(mapSummary({ ...summary, name: "양파", aliases: undefined }).image, "/images/items/onion.webp");
  });
} finally {
  globalThis.fetch = originalFetch;
}
