import type { IndicatorCardDto, PriceDetailDto, PriceForecastDto, PriceGuideDto, PriceIndicatorsDto, PriceSummaryDto } from "./dto";
import type { BuyingGuide, ForecastPoint, IndicatorCard, IndicatorSignal, IndicatorState, IndicatorVerdict, LevelEvidence, LivePrice, PriceIndicators } from "./model";
import { mapDataFactors } from "./factors";
import { mapAiSummary } from "./shap";
import { itemImage } from "./item-images";

const categories = { VEGETABLE: "채소류", GRAIN: "곡류", FRUIT: "과일류", MEAT: "육류", SEAFOOD: "수산물", ETC: "기타" };
export function priceChanges(current: number | null, forecast: number | null, percent?: number | null) {
  const delta = current === null || forecast === null ? null : forecast - current;
  return {
    forecastDelta: delta,
    forecastPercent: delta === null ? null : percent ?? (current ? delta / current * 100 : null),
    forecastDirection: delta === null ? null : delta > 0 ? "up" as const : delta < 0 ? "down" as const : "flat" as const,
  };
}
export function mapSummary(dto: PriceSummaryDto): LivePrice {
  if (!Number.isSafeInteger(dto.id) || dto.id < 1) throw new Error("지원하지 않는 품목 ID입니다.");
  return {
    id: String(dto.id), name: dto.name, category: categories[dto.category], categoryCode: dto.category,
    unit: dto.unitLabel ?? "단위 정보 없음", image: itemImage(dto.name, dto.aliases),
    source: dto.source, status: dto.status, quality: dto.quality,
    baseDate: dto.forecastBaseDate, priceDate: dto.priceDate,
    currentPrice: dto.currentPrice, weeklyChangeRate: dto.weeklyChangePercent,
    forecastDate: dto.forecastTargetDate, forecastPrice: dto.forecastPrice,
    ...priceChanges(dto.currentPrice, dto.forecastPrice, dto.forecastChangePercent),
    priceHistory: [], forecastPoints: [], guide: null, forecastStatus: null, dataFactors: [], aiSummary: null,
  };
}
export function mapForecast(dto: PriceForecastDto): ForecastPoint[] {
  return dto.points.map(point => ({ date: point.targetDate, price: point.predictedPrice, lower: point.lowerPrice, upper: point.upperPrice }))
    .toSorted((a, b) => a.date.localeCompare(b.date));
}
export function mapGuide(dto: PriceGuideDto | null): BuyingGuide | null {
  if (!dto) return null;
  const titles: Record<string, string> = { BUY_NOW: "지금 구매 추천", BUY_LATER: dto.buyAfterDays === null ? "조금 기다려보세요" : `${dto.buyAfterDays}일 뒤 구매 추천`, HOLD: "구매 판단 보류", STABLE: "가격 보합세" };
  return { title: titles[dto.recommendation] ?? "구매 가이드 확인",
    description: dto.expectedSaving === null ? "서버에서 제공한 구매 판단입니다." : `예상 절약액 ${dto.expectedSaving.toLocaleString("ko-KR")}원`,
    buyAfterDays: dto.buyAfterDays, expectedSaving: dto.expectedSaving, mape: dto.mape };
}
export function withForecast(item: LivePrice, points: ForecastPoint[], baseDate: string | null): LivePrice {
  const last = points.at(-1);
  // An empty successful forecast is absence, never a summary/demo fallback.
  return { ...item, baseDate, forecastPoints: points,
    forecastDate: last?.date ?? null, forecastPrice: last?.price ?? null,
    ...priceChanges(item.currentPrice, last?.price ?? null) };
}
export function mapDetail(dto: PriceDetailDto): LivePrice {
  return { ...withForecast(mapSummary(dto.item), mapForecast(dto.forecast), dto.forecast.baseDate), guide: mapGuide(dto.guide),
    forecastStatus: dto.forecast.status, dataFactors: mapDataFactors(dto.guide?.factors), aiSummary: mapAiSummary(dto.summary) };
}

// ---- Judgement-aid indicators (draft contract). All DTO field names are read here only, so a rename touches this block. ----
const num = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
const record = (value: unknown) => value && typeof value === "object" ? value as Record<string, unknown> : {};
const indicatorState = (value: string | null | undefined): IndicatorState | null => value === "UP" ? "up" : value === "DOWN" ? "down" : value === "NEUTRAL" ? "neutral" : null;
const levelEvidence = (evidence: Record<string, unknown> | null): LevelEvidence | null => evidence && evidence.lowAfterRate !== undefined ? {
  lowAfterRate: num(evidence.lowAfterRate), lowBaseRate: num(evidence.lowBaseRate), sampleLow: num(evidence.sampleLow),
  highAfterRate: num(evidence.highAfterRate), highBaseRate: num(evidence.highBaseRate), sampleHigh: num(evidence.sampleHigh),
  aheadWeeks: num(evidence.aheadWeeks), weakSide: evidence.weakSide === "low" || evidence.weakSide === "high" ? evidence.weakSide : null,
  periodStart: text(evidence.periodStart), periodEnd: text(evidence.periodEnd) } : null;
const verdicts: IndicatorVerdict[] = ["FACT", "PASS", "CONDITIONAL", "WEAK"];
/** Used only when the summary has no signal for a card; never derived from prices. */
const fallbackStateLabels: Record<IndicatorState, string> = { up: "상승 압력", neutral: "신호 없음", down: "하락 압력" };

function mapIndicatorCard(dto: IndicatorCardDto, labels: Map<string, string>): IndicatorCard | null {
  const verdict = verdicts.find(value => value === dto.verdict) ?? "WEAK";
  const state = verdict === "WEAK" ? null : indicatorState(dto.state);
  const base = { verdict, state, stateLabel: labels.get(dto.key) ?? (state ? fallbackStateLabels[state] : null) };
  const fact = record(dto.fact), evidence = dto.evidence ? record(dto.evidence) : null, chart = dto.chart ?? null;
  switch (dto.key) {
    case "SEASONAL": {
      const years = chart?.type === "SEASONAL_OVERLAY" && Array.isArray(chart.years) ? (chart.years as unknown[]).map(row => {
        const year = record(row);
        const points = (Array.isArray(year.points) ? year.points as unknown[] : []).flatMap(point => {
          const week = num(record(point).week), price = num(record(point).price);
          return week === null || price === null || week < 1 || week > 53 ? [] : [{ week, price }];
        }).toSorted((a, b) => a.week - b.week);
        return { year: num(year.year) ?? 0, points };
      }).filter(row => row.year > 0 && row.points.length > 0) : [];
      const currentYear = num(chart?.currentYear);
      return { ...base, key: "SEASONAL", evidenceText: text(evidence?.text),
        fact: { currentPrice: num(fact.currentPrice), windowDays: num(fact.windowDays), recentAvg: num(fact.recentAvg), normalAvg: num(fact.normalAvg),
          normalYears: Array.isArray(fact.normalYears) ? fact.normalYears.flatMap(year => num(year) ?? []) : [],
          diffRate: num(fact.diffRate), cheaperThanCount: num(fact.cheaperThanCount), historyYears: num(fact.historyYears) },
        chart: currentYear !== null && years.length ? { currentYear, years } : null };
    }
    case "WHOLESALE_LEAD": {
      const points = chart?.type === "INDEXED_LINES" && Array.isArray(chart.points) ? (chart.points as unknown[]).flatMap(row => {
        const point = record(row), date = text(point.date);
        return date ? [{ date, wholesale: num(point.wholesale), retail: num(point.retail) }] : [];
      }).toSorted((a, b) => a.date.localeCompare(b.date)) : [];
      return { ...base, key: "WHOLESALE_LEAD",
        fact: { wholesaleChange2w: num(fact.wholesaleChange2w), retailChange2w: num(fact.retailChange2w) },
        evidence: evidence && { upAfterRate: num(evidence.upAfterRate), baseUpRate: num(evidence.baseUpRate), downAfterRate: num(evidence.downAfterRate),
          baseDownRate: num(evidence.baseDownRate), threshold: num(evidence.threshold), sampleUp: num(evidence.sampleUp), sampleDown: num(evidence.sampleDown),
          periodStart: text(evidence.periodStart), periodEnd: text(evidence.periodEnd) },
        chart: points.length > 1 ? { baseDate: text(chart?.baseDate) ?? points[0].date, points } : null };
    }
    case "PRICE_POSITION":
      return { ...base, key: "PRICE_POSITION", evidenceText: text(evidence?.text),
        fact: { currentPrice: num(fact.currentPrice), low: num(fact.low), lowDate: text(fact.lowDate), high: num(fact.high), highDate: text(fact.highDate),
          avg: num(fact.avg), diffFromAvg: num(fact.diffFromAvg), percentile: num(fact.percentile), windowDays: num(fact.windowDays) },
        evidence: levelEvidence(evidence) };
    case "RETAIL_WHOLESALE_GAP":
      return { ...base, key: "RETAIL_WHOLESALE_GAP", state: null, stateLabel: null, evidenceText: text(evidence?.text),
        fact: { retailPrice: num(fact.retailPrice), wholesalePrice: num(fact.wholesalePrice), ratio: num(fact.ratio), normalRatio: num(fact.normalRatio),
          low: num(fact.low), high: num(fact.high), percentile: num(fact.percentile), windowDays: num(fact.windowDays) },
        evidence: (() => { const base = levelEvidence(evidence); return base && evidence ? { ...base, overlapsLead: evidence.overlapsLead === true,
          corrWithWholesaleChange: num(evidence.corrWithWholesaleChange), passed: evidence.validationVerdict === "PASS" } : null; })() };
    case "VOLATILITY":
      return { ...base, key: "VOLATILITY", state: null, stateLabel: null, evidenceText: text(evidence?.text),
        fact: { windowDays: num(fact.windowDays), recentRange: num(fact.recentRange), normalRange: num(fact.normalRange), percentile: num(fact.percentile) } };
    case "HARVEST_WEATHER":
      return { ...base, key: "HARVEST_WEATHER", available: dto.available !== false,
        fact: { region: text(fact.region), rain4w: num(fact.rain4w), normalRain4w: num(fact.normalRain4w) },
        evidence: evidence && { threshold: num(evidence.threshold), upRateWhenHeavy: num(evidence.upRateWhenHeavy), upRateOtherwise: num(evidence.upRateOtherwise) } };
    case "ARRIVALS":
      return { ...base, key: "ARRIVALS", state: null, stateLabel: null,
        fact: { market: text(fact.market), avgTon4w: num(fact.avgTon4w), normalTon: num(fact.normalTon), diffRate: num(fact.diffRate) } };
    default:
      return null; // Unknown card keys are skipped, not guessed.
  }
}

export function mapIndicators(dto: PriceIndicatorsDto): PriceIndicators {
  const signals: IndicatorSignal[] = (dto.summary?.signals ?? []).flatMap(signal => {
    const label = text(signal.label), stateLabel = text(signal.stateLabel);
    return label && stateLabel ? [{ key: signal.key, label, state: indicatorState(signal.state), stateLabel }] : [];
  });
  const labels = new Map(signals.map(signal => [signal.key, signal.stateLabel]));
  return { asOfDate: text(dto.asOfDate), stale: dto.status === "STALE", unavailableReason: text(dto.unavailableReason), headline: text(dto.summary?.headline), signals,
    cards: (dto.cards ?? []).flatMap(card => mapIndicatorCard(card, labels) ?? []),
    notices: (dto.notices ?? []).flatMap(notice => { const body = text(notice.text); return notice.key && body ? [{ key: notice.key, text: body }] : []; }) };
}
