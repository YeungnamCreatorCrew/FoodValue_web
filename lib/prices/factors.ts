// WAS guide.factors (= GET /prices/items/{id}/factors) is a loosely typed list of observation/model records.
// It never carries SHAP values or price directions, so none are derived here.
export interface DataFactorFact { label: string; value: string }
export interface DataFactorWeight { label: string; weight: number }
export interface DataFactor {
  key: string;
  name: string;
  kind: "OBSERVATION" | "CALENDAR" | "MODEL" | "OTHER";
  source: string | null;
  dataDate: string | null;
  usedByModel: boolean | null;
  modelWeight: number | null;
  facts: DataFactorFact[];
  weights: DataFactorWeight[];
  description: string | null;
}

type Raw = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const group = (value: number, decimals: number) => {
  const [integer, fraction] = value.toFixed(decimals).split(".");
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction === undefined ? "" : `.${fraction}`);
};
const kinds = ["OBSERVATION", "CALENDAR", "MODEL"] as const;
const sources: Record<string, string> = { KAMIS: "KAMIS 가격", KMA: "기상청", KASI: "한국천문연구원" };
const markets: Record<string, string> = { RETAIL: "소매", WHOLESALE: "도매" };

export function sourceLabel(source: string | null) { return source ? sources[source] ?? source : null; }

function facts(raw: Raw): DataFactorFact[] {
  const result: DataFactorFact[] = [];
  const add = (label: string, value: string | null) => { if (value !== null) result.push({ label, value }); };
  const latest = number(raw.latestPrice), mean7 = number(raw.mean7Observed);
  const temperature = number(raw.meanTemperature7), rain = number(raw.precipitationSum7), days = number(raw.days);
  add("최근 가격", latest === null ? null : `${group(Math.round(latest), 0)}원`);
  add("최근 7일 관측 평균", mean7 === null ? null : `${group(Math.round(mean7), 0)}원`);
  add("시장", text(raw.market) ? markets[raw.market as string] ?? (raw.market as string) : null);
  add("7일 평균기온", temperature === null ? null : `${group(temperature, 1)}℃`);
  add("7일 강수량 합계", rain === null ? null : `${group(rain, 1)}mm`);
  add("관측 일수", days === null ? null : `${group(days, 0)}일`);
  if (Array.isArray(raw.holidays)) {
    const holidays = raw.holidays.flatMap(entry => {
      const value = entry as Raw; const date = text(value?.date), name = text(value?.name);
      return date && name ? [`${date.slice(5).replace("-", "/")} ${name}`] : [];
    });
    add("예측 기간 공휴일", holidays.length ? holidays.join(", ") : null);
  }
  return result;
}

function weights(raw: Raw): DataFactorWeight[] {
  if (!Array.isArray(raw.weights)) return [];
  return raw.weights.flatMap(entry => {
    const value = entry as Raw; const weight = number(value?.weight);
    const label = text(value?.label) ?? text(value?.block);
    return label && weight !== null ? [{ label, weight: Math.min(1, Math.max(0, weight)) }] : [];
  });
}

export function mapDataFactors(list: unknown): DataFactor[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const raw = entry as Raw;
    const name = text(raw.name);
    if (!name) return [];
    const kind = kinds.find(value => value === raw.kind) ?? "OTHER";
    return [{
      key: `${index}-${name}`, name, kind, source: text(raw.source), dataDate: text(raw.dataDate),
      usedByModel: typeof raw.usedByModel === "boolean" ? raw.usedByModel : null,
      modelWeight: number(raw.modelWeight), facts: facts(raw), weights: weights(raw), description: text(raw.description),
    }];
  });
}
