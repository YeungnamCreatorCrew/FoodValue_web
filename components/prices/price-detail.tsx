"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { forecastRate, recommendationLabel, won } from "@/lib/prices/format";
import { mockPricesSource } from "@/lib/prices/mock";
import type { FactorKind, PriceItem, RecipeRecommendation } from "@/lib/prices/types";
import { PriceChart } from "./price-chart";
import { categoryLabels, FigmaIcon, PriceChange, RecommendationBadge, SampleNotice, SectionTitle } from "./ui";

const factorInfo: Record<FactorKind, { title: string; icon: string }> = {
  WEATHER: { title: "전국 날씨", icon: "imgCloudSun" },
  PRODUCTION: { title: "생산량 / 출하량", icon: "imgPackageOpen" },
  EVENT: { title: "명절 / 이벤트", icon: "imgCalendarDays" },
  SEASONAL: { title: "계절 요인", icon: "imgCalendarDays" },
  TREND: { title: "최근 가격 추세", icon: "imgTrendingUp" },
};

function RecipeSection({ item, initial }: { item: PriceItem; initial: RecipeRecommendation[] }) {
  const [recipes, setRecipes] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<RecipeRecommendation | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const refresh = async () => {
    setLoading(true); setError(false);
    try { setRecipes(await mockPricesSource.recommendations(item.id)); }
    catch { setError(true); }
    finally { setLoading(false); }
  };
  return <section>
    <SectionTitle icon="imgChefHat" title={`${item.id === 1 ? "흙대파" : item.name}로 만들 수 있어요`} description="냉장고 재료로 간단하게 활용해 보세요">
      <button disabled={loading} onClick={refresh} className="text-xs text-[#3377c9] disabled:opacity-40">{loading ? "추천 중…" : "다시 추천"}</button>
    </SectionTitle>
    {error ? <p role="alert" className="rounded-xl bg-white p-4 text-sm">레시피 추천을 불러오지 못했습니다. <button onClick={refresh} className="text-primary underline">다시 시도</button></p> : recipes.length === 0 ? <p className="text-sm text-muted">추천할 레시피가 없습니다.</p> : <div aria-busy={loading} className="flex gap-2.5 overflow-x-auto pb-2">
      {recipes.map((recipe, i) => <button key={recipe.title} onClick={() => { setSelected(recipe); dialog.current?.showModal(); }} className="flex w-[158px] shrink-0 flex-col gap-2 overflow-hidden rounded-xl border border-[#e1e9e5] bg-white p-1.5 text-left">
        {item.id === 1 ? <Image src={`/figma/prices/detail-imgRecipeImage${i === 0 ? "" : i}.png`} alt={recipe.title} width={146} height={96} className="h-24 w-[146px] rounded-[10px] object-cover" /> : <span className="flex h-24 w-full items-center justify-center rounded-[10px] bg-emerald-50"><FigmaIcon name="imgChefHat" detail size={18} /></span>}
        <span className="block w-full px-1 pb-[5px]"><strong className="block truncate text-[13px] font-semibold">{recipe.title}</strong><span className="mt-[3px] block text-xs leading-5 text-[#87948d]">{recipe.minutes}분 · 재료 보유율 {recipe.matchRate}%</span></span>
      </button>)}
    </div>}
    <dialog ref={dialog} aria-labelledby="recipe-preview-title" onClose={() => setSelected(null)} className="fixed inset-0 m-auto w-[calc(100%_-_32px)] max-w-[358px] rounded-2xl border border-border bg-white p-6 text-foreground shadow-xl backdrop:bg-black/40">
      {selected && <><div className="flex items-center justify-between gap-4"><h3 id="recipe-preview-title" className="text-lg font-semibold">{selected.title}</h3><button onClick={() => dialog.current?.close()} aria-label="레시피 추천 닫기" className="rounded px-2 py-1 text-sm text-muted">닫기</button></div><p className="mt-2 text-xs text-muted">{selected.minutes}분 · {selected.difficulty} · {selected.servings}인분</p><p className="mt-4 text-sm leading-6">{selected.description}</p><p className="mt-4 text-sm">사용 재료: {selected.ingredients.join(", ")}</p><p className="mt-2 text-sm text-muted">부족 재료: {selected.missingIngredients.join(", ") || "없음"}</p><p className="mt-4 text-[11px] text-muted">샘플 레시피 추천</p></>}
    </dialog>
  </section>;
}

export function PriceDetail({ item, recipes }: { item: PriceItem; recipes: RecipeRecommendation[] }) {
  const [allRegions, setAllRegions] = useState(false);
  const last = item.forecast.at(-1)!;
  const lowestRegionPrice = Math.min(...item.regions.map(region => region.price));
  const inventoryLow = item.inventory.some(entry => entry.initialQuantity > 0 && entry.quantity / entry.initialQuantity <= 0.3);
  const guide = item.recommendation === "BUY_LATER" ? `${item.buyAfterDays}일 뒤 구매 시 약 ${won(item.expectedSaving ?? 0)} 절약이 예상돼요.`
    : item.recommendation === "BUY_NOW" ? "가격 상승이 예상돼 지금 구매를 추천해요."
    : item.recommendation === "HOLD" ? "가격 변화를 지켜본 뒤 구매를 결정해 보세요."
    : "가격이 보합세예요. 필요한 시점에 구매하세요.";
  return <main id="main-content" className="flex w-full flex-col gap-[30px] bg-[#f7faf8] px-5 pt-4 pb-[calc(100px_+_env(safe-area-inset-bottom))] text-[#17251f]">
    <div className="flex min-w-0 flex-col gap-6">
      <section aria-label="품목과 가격 요약" className="flex flex-col gap-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-[#e1e9e5] bg-white p-3.5">
          {item.id === 1 ? <Image src="/figma/prices/detail-imgProductImage.png" alt="흙대파" width={84} height={84} priority className="size-[84px] rounded-xl object-cover" /> : <div className="flex size-[84px] shrink-0 items-center justify-center rounded-xl bg-emerald-50"><FigmaIcon name="imgPlaceholder" /></div>}
          <div className="flex min-w-0 flex-1 flex-col items-start gap-[5px]"><span className="rounded-full bg-[#ecf8f2] px-2 py-[3px] text-[11px] font-medium text-[#0f6d47]">{categoryLabels[item.category]}</span><h1 className="text-xl font-semibold leading-[26px] tracking-[-0.2px]">{item.name}</h1><p className="text-sm leading-5 text-[#607068]">{item.unitLabel}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#e1e9e5] bg-white p-4">
          <div className="flex flex-col gap-[5px]"><p className="text-sm text-[#607068]">오늘 전국 평균가</p><strong className="text-[25px] leading-8 tracking-[-0.5px]">{won(item.currentPrice)}</strong><p className="flex flex-wrap items-center gap-[5px]"><span className="text-[11px] text-[#87948d]">전주 대비</span><PriceChange rate={item.weeklyChangeRate} /></p></div>
          <div className="flex flex-col gap-[5px] border-l border-[#e1e9e5] pl-4"><p className="text-sm text-[#607068]">7일 뒤 AI 예상가</p><strong className="text-[25px] leading-8 tracking-[-0.5px] text-[#0f6d47]">{won(last.price)}</strong><p className="flex flex-wrap items-center gap-[5px]"><span className="text-[11px] text-[#87948d]">예상 등락률</span><PriceChange rate={forecastRate(item)} /></p></div>
        </div>
      </section>
      <PriceChart history={item.history} forecast={item.forecast} mape={item.mape} />
      <section className="flex flex-col gap-3" aria-label="구매 가이드와 냉장고 보유량">
        <div className="flex flex-col gap-2.5 rounded-2xl border border-[#c8e4e5] bg-[#eef7fa] p-4"><div className="flex items-center justify-between gap-2"><h2 className="flex items-center gap-[7px] text-sm font-semibold"><span className="flex size-[26px] items-center justify-center rounded-lg bg-[#1a8f8a]"><FigmaIcon name="imgSparkles" detail size={15} /></span>AI 구매 가이드</h2><RecommendationBadge item={item} /></div><p className="text-[15px] font-medium leading-[22px]">{guide}</p><p className="text-sm leading-5 text-[#607068]">{item.recommendation === "BUY_LATER" ? "단기 가격이 내려간 뒤 다시 오를 수 있어요. 예측 가격과 구매 시점을 함께 확인하세요." : `${recommendationLabel(item)} · 예측은 참고용으로 활용하세요.`}</p></div>
        <div className="flex items-center gap-[11px] rounded-xl bg-[#ecf8f2] px-3.5 py-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white"><FigmaIcon name="imgIconRefrigerator" detail size={21} /></span><div><h2 className="flex items-center gap-[7px] text-[13px] font-semibold">내 냉장고 보유량{inventoryLow && <span className="rounded-full bg-[#ffedeb] px-[7px] py-0.5 text-[10px] font-normal text-[#e14b4b]">부족 예상</span>}</h2><p className="mt-1 text-sm leading-5 text-[#607068]">{item.inventory.length ? item.inventory.map(entry => `잔여량 ${entry.quantity}${entry.unit}`).join(" · ") : "보관 중인 재료가 없어요."}</p></div></div>
      </section>
    </div>
    <div className="flex min-w-0 flex-col gap-6">
      <section><SectionTitle icon="imgScanSearch" title="AI 가격 결정 요인" description="가격 예측에 영향을 준 주요 요인이에요" />
        <div className="rounded-2xl border border-[#e1e9e5] bg-white px-3.5">{item.factors.map(factor => <div key={factor.kind} className="border-b border-[#e1e9e5] py-[11px] last:border-b-0"><div className="flex items-center gap-[9px]"><span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-[#ecf8f2]"><FigmaIcon name={factorInfo[factor.kind].icon} detail size={17} /></span><div className="min-w-0 flex-1"><h3 className="text-[13px] font-semibold">{factorInfo[factor.kind].title}</h3><p className="text-sm leading-5 text-[#607068]">{factor.description}</p></div><span className={`shrink-0 rounded-full px-2 py-[3px] text-[11px] ${factor.direction === "UP" ? "bg-[#fff0f0] text-[#e14b4b]" : "bg-[#edf5ff] text-[#3377c9]"}`}>{factor.direction === "UP" ? "상승" : "하락"} 영향</span></div><div className="mt-2 flex items-center gap-[9px]"><div role="meter" aria-label={`${factorInfo[factor.kind].title} 기여도`} aria-valuenow={factor.contribution} aria-valuemin={0} aria-valuemax={100} className="h-[7px] flex-1 overflow-hidden rounded-full bg-[#e9f0ec]"><div className="h-full rounded-full bg-primary" style={{ width: `${factor.contribution}%` }} /></div><span className="w-7 text-right text-[10px] text-[#607068]">{factor.contribution}%</span></div></div>)}</div>
        {item.mape !== null && <p className="mt-2 text-xs leading-[18px] text-[#87948d]">예측 오차 · MAPE {item.mape}% (샘플)</p>}
      </section>
      <section><SectionTitle icon="imgMapPin" title="지역별 가격" description="동일 규격 기준 지역 평균 가격"><button aria-expanded={allRegions} aria-controls="region-prices" onClick={() => setAllRegions(value => !value)} className="text-xs text-[#3377c9]">{allRegions ? "접기" : "전체보기 >"}</button></SectionTitle>
        <div id="region-prices" className="flex flex-col gap-1 rounded-2xl border border-[#e1e9e5] bg-white p-1.5">{(allRegions ? item.regions : item.regions.slice(0, 3)).map(region => { const lowest = region.price === lowestRegionPrice; const difference = region.price - item.currentPrice; return <div key={region.code} className={`flex items-center gap-[11px] rounded-xl px-3.5 py-3 ${lowest ? "bg-[#ecf8f2]" : "bg-white"}`}><span className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px]"><FigmaIcon name={lowest ? "imgStore1" : "imgStore"} detail size={17} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-[7px]"><h3 className="text-[13px] font-semibold">{region.name}</h3>{lowest && <span className="rounded-full bg-[#169b62] px-[7px] py-0.5 text-[9px] text-white">최저가</span>}</div><p className="text-xs leading-5 text-[#87948d]">전국 평균 대비 {difference > 0 ? "+" : difference < 0 ? "−" : ""}{won(Math.abs(difference))}</p></div><strong className={`text-[15px] ${lowest ? "text-[#0f6d47]" : ""}`}>{won(region.price)}</strong></div>; })}</div>
      </section>
      <RecipeSection item={item} initial={recipes} />
    </div>
    <footer className="flex flex-col gap-1 text-[11px] leading-[18px] text-[#87948d]"><p>데이터 기준: KAMIS · 7일 가격 예측</p><p>샘플 업데이트: {item.updatedAt.slice(0, 10)} 06:00 (KST)</p><SampleNotice date={item.baseDate} /></footer>
  </main>;
}
