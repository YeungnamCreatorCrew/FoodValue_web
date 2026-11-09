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
const { mapSummary, mapDetail, withForecast } = require("../lib/prices/mapper.ts");
const { getPriceChart, resolveFavoriteId, resolvePriceRoute } = require("../lib/prices/service.ts");
const { forecastChart } = require("../lib/prices/forecast-chart.ts");
const { favoriteIdentity } = require("../lib/prices/identity.ts");
const { priceChartStyle } = require("../lib/prices/chart-style.ts");
const { won } = require("../lib/prices/format.ts");

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
const detail = { item: summary, forecast, guide: { recommendation: "BUY_NOW", buyAfterDays: null, expectedSaving: 0, mape: 2.5, factors: [{ kind: "OBSERVATION", latestPrice: 3000 }] }, fridge: null };
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
  await test("nullable summary prices stay absent, with neutral chart color", () => {
    const item = mapSummary({ ...summary, currentPrice: null, forecastPrice: null, priceDate: null, forecastBaseDate: null, forecastTargetDate: null });
    assert.equal(item.currentPrice, null); assert.equal(item.forecastPrice, null);
    assert.equal(item.forecastDelta, null); assert.equal(item.forecastPercent, null); assert.equal(item.forecastDirection, null);
    assert.equal(item.baseDate, null); assert.equal(won(item.currentPrice), "-");
    assert.deepEqual(priceChartStyle(item), { "--price-chart-color": "var(--color-price-flat)" });
  });
  await test("nested detail uses seven daily points and the server guide, excluding factors/fridge", () => {
    const item = mapDetail(detail);
    assert.equal(item.id, "901"); assert.equal(item.forecastPoints.length, 7);
    assert.equal(item.forecastPoints[1].price, 2910); assert.equal(item.forecastPoints[0].lower, null);
    assert.equal(item.guide.title, "지금 구매 추천"); // Downward prices must not replace the server's guide.
    assert.equal("factors" in item, false); assert.equal("fridge" in item, false);
    assert.equal(item.forecastDirection, "down");
    assert.deepEqual(priceChartStyle(item), { "--price-chart-color": "var(--color-price-down)" });
  });
  await test("empty forecast removes summary predictions instead of falling back", () => {
    const item = mapDetail({ ...detail, forecast: { ...forecast, points: [] }, guide: null });
    assert.equal(item.forecastPrice, null); assert.equal(item.forecastDate, null); assert.equal(item.guide, null);
    assert.deepEqual(item.forecastPoints, []); assert.equal(forecastChart(item, 30, bounds).forecastPath, "");
  });
  await test("history preserves nulls and passes each supported days value with the actual item ID", async () => {
    globalThis.fetch = async (url, options) => {
      const parsed = new URL(url); calls.push({ url: parsed, options });
      return new Response(JSON.stringify(parsed.pathname.endsWith("/forecast") ? forecast : {
        itemId: 901, market: "RETAIL", days: Number(parsed.searchParams.get("days")), endDate: "2026-11-09",
        points: [{ date: "2026-11-07", price: 3100 }, { date: "2026-11-08", price: null }, { date: "2026-11-09", price: 3000 }],
      }));
    };
    for (const days of [14, 30, 90]) {
      const data = await getPriceChart("901", days);
      assert.equal(data.priceHistory[1].price, null);
      const request = calls.at(-2).url;
      assert.equal(request.pathname, "/api/v1/prices/items/901/history"); assert.equal(request.searchParams.get("days"), String(days));
      const item = withForecast({ ...mapSummary(summary), priceHistory: data.priceHistory, historyEndDate: data.historyEndDate }, data.forecast, data.forecastBaseDate);
      const chart = forecastChart(item, days, bounds);
      assert.equal((chart.actualPath.match(/M/g) ?? []).length, 2); // Gap breaks the solid line.
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
} finally {
  globalThis.fetch = originalFetch;
}
