import type { IndicatorState, LivePrice, PriceIndicators, SeasonalCard, WholesaleLeadCard } from "@/lib/prices/model";
import { getSupplyFactors, type SupplyFactor } from "@/lib/prices/supply-factors";
import { classifyNews, synthesis } from "@/lib/prices/why";
import { formatNumber, longDate, won } from "@/lib/prices/format";
import { josa } from "@/components/fv/text";

type Force = { key: string; title: string; detail: string; why: string | null; source: { name: string; date: string | null; url: string | null } };
const signed = (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value * 100), 1)}%`;

function ForceList({ items, empty }: { items: Force[]; empty: string }) {
  if (!items.length) return <p className="why-empty">{empty}</p>;
  return <ul className="why-list">{items.map(item => <li key={item.key}>
    <p className="why-item-title">{item.title}</p>
    <p className="why-item-detail">{item.detail}</p>
    {item.why && <p className="why-item-why">→ {item.why}</p>}
    <p className="why-item-source">
      {item.source.url ? <a className="fv-inline-link" href={item.source.url} target="_blank" rel="noopener noreferrer">{item.source.name} <span aria-hidden="true">↗</span><span className="sr-only"> (새 탭)</span></a> : <span>{item.source.name}</span>}
      {item.source.date && <time dateTime={item.source.date}> · {longDate(item.source.date)}</time>}
    </p>
  </li>)}</ul>;
}

/**
 * "왜 이렇게 나왔을까요?": 지금 상태(평년 대비) → 값을 내리는 쪽·올리는 쪽(도매가 움직임 + 수급 소식) → 그래서.
 * 수급 소식은 lib/prices/supply-factors(뉴스·정부 발표)를 일반적인 수요·공급 관계로 나눈다. 원인을 확정하지 않는다.
 */
export async function PriceWhy({ item, indicators }: { item: LivePrice; indicators: PriceIndicators | null }) {
  const news: readonly SupplyFactor[] = await getSupplyFactors(item.name).catch(() => []);
  const seasonal = indicators?.cards.find((card): card is SeasonalCard => card.key === "SEASONAL") ?? null;
  const lead = indicators?.cards.find((card): card is WholesaleLeadCard => card.key === "WHOLESALE_LEAD") ?? null;
  if (!seasonal && !lead && !news.length) return null;

  const down: Force[] = [], up: Force[] = [], other: Force[] = [];
  // 도매가 움직임은 KAMIS 숫자라 소식보다 먼저 둔다.
  const leadState: IndicatorState | null = lead?.verdict === "WEAK" ? null : lead?.state ?? null;
  const w = lead?.fact.wholesaleChange2w ?? null;
  if (lead && w !== null && Math.abs(w) >= (lead.evidence?.threshold ?? 0.05)) {
    const ev = lead.evidence;
    const rate = w > 0 ? ev?.upAfterRate : ev?.downAfterRate, base = w > 0 ? ev?.baseUpRate : ev?.baseDownRate;
    (w > 0 ? up : down).push({ key: "lead", title: `도매가가 2주 새 ${signed(w)} ${w > 0 ? "올랐어요" : "내렸어요"}`,
      detail: rate != null && base != null ? `과거에 이렇게 움직인 뒤 2주 안에 소매가도 ${w > 0 ? "오른" : "내린"} 적이 ${Math.round(rate * 100)}%였어요(평소 ${Math.round(base * 100)}%).` : "소매가는 보통 도매가를 1~2주 늦게 따라가요.",
      why: null, source: { name: "KAMIS 도매가", date: indicators?.asOfDate ?? null, url: null } });
  }
  news.forEach((factor, index) => {
    const { push, why } = classifyNews(factor.label, factor.detail);
    const force = { key: `n${index}`, title: factor.label, detail: factor.detail, why, source: factor.source };
    (push === "down" ? down : push === "up" ? up : other).push(force);
  });
  const newsDown = down.filter(f => f.key !== "lead").length, newsUp = up.filter(f => f.key !== "lead").length;
  const state = seasonal?.verdict === "WEAK" ? null : seasonal?.state ?? null;
  const d = seasonal?.fact.diffRate ?? null;

  return <section aria-labelledby="why-title" className="why">
    <div className="section-head"><h2 id="why-title" className="fv-h2">왜 이렇게 나왔을까요?<span className="section-sub">판단 근거 숫자와 최근 수급 소식을 함께 묶었어요</span></h2></div>
    <div className="fv-card why-card">
      {seasonal && seasonal.fact.recentAvg !== null && seasonal.fact.normalAvg !== null && d !== null && <p className="why-now">
        <span className="why-step">지금</span>
        <span>최근 4주 평균 <b className="fv-num">{won(seasonal.fact.recentAvg)}</b>, 평년 같은 시기 <b className="fv-num">{won(seasonal.fact.normalAvg)}</b>보다 <b className={`fv-num ${d < 0 ? "tone-down" : d > 0 ? "tone-up" : ""}`}>{formatNumber(Math.abs(d * 100), 1)}% {d < 0 ? "낮아요" : "높아요"}</b>.</span>
      </p>}
      <div className="why-forces">
        <div className="why-col is-down"><h3><span aria-hidden="true">↓</span> 값을 내리는 쪽<span className="fv-num">{down.length}</span></h3>
          <ForceList items={down} empty="최근에 값을 내리는 쪽 소식은 없어요." /></div>
        <div className="why-col is-up"><h3><span aria-hidden="true">↑</span> 값을 올리는 쪽<span className="fv-num">{up.length}</span></h3>
          <ForceList items={up} empty="최근에 값을 올리는 쪽 소식은 없어요." /></div>
      </div>
      {other.length > 0 && <details className="why-other"><summary>함께 볼 소식 {other.length}개</summary><ForceList items={other} empty="" /></details>}
      <p className="why-so"><span className="why-step">그래서</span><span>{synthesis(state, leadState, newsDown, newsUp, josa(item.name, "은", "는"))}</span></p>
      <p className="why-note">소식은 보도·정부 발표를 물량이 늘거나 줄어드는 쪽으로 나눈 거예요. 가격의 원인을 확정하는 것은 아니에요.</p>
    </div>
  </section>;
}
