import { getFoodNews } from "../news/food-news";

type Source = { name: string; date: string; url: string };
type SupplyFactor = { label: string; detail: string; source: Source };

const kimchiSupply: Source = {
  name: "농림축산식품부",
  date: "2026-11-03",
  url: "https://www.mafra.go.kr/bbs/home/792/582116/artclView.do",
};

const cabbageMeasures: Source = {
  name: "농림축산식품부",
  date: "2026-11-11",
  url: "https://www.mafra.go.kr/bbs/home/792/582233/artclView.do",
};

const exportSupport: Source = {
  name: "농림축산식품부",
  date: "2026-11-13",
  url: "https://www.mafra.go.kr/bbs/home/792/582260/artclView.do",
};

const wholesaleReport: Source = {
  name: "농민신문",
  date: "2026-11-19",
  url: "https://nongmin.com/article/20261118500602",
};

const storedSupplyReport: Source = {
  name: "연합뉴스",
  date: "2026-11-03",
  url: "https://www.yna.co.kr/view/AKR20261102131700030?section=news",
};

const radishShipment: Source = {
  name: "YTN",
  date: "2026-11-09",
  url: "https://www.ytn.co.kr/_ln/0102_202611090721532154",
};

const garlicStock: Source = {
  name: "한국농어민신문",
  date: "2026-11-13",
  url: "https://www.agrinet.co.kr/news/articleView.html?idxno=408831",
};

const plantingReport: Source = {
  name: "한국농어민신문",
  date: "2026-11-26",
  url: "https://www.agrinet.co.kr/news/articleView.html?idxno=409206",
};

const itemMentions = {
  배추: /(?<!양)배추/,
  무: /(?:^|[^가-힣])(?:(?:가을|월동|겨울|고랭지|여름|봄|김장)\s*)?무(?=$|[^가-힣]|값|가격|농가|재배|출하|수급|(?:와|과|는|가|도|를|의)(?=[^가-힣]|$))/,
  양파: /양파/,
  깐마늘: /마늘/,
  대파: /대파/,
};

type TrackedItem = keyof typeof itemMentions;

const eventRules = [
  { label: "산지 재배 동향", pattern: /(?:정식|파종|수확).{0,14}(?:지연|차질|늦|앞당|시작|확대|감소)|(?:늦|지연|잦은 비).{0,22}(?:정식|파종)|재배면적.{0,10}(?:증가|감소|확대|축소)/ },
  { label: "작황·기상 피해", pattern: /녹아내리|썩고|작황.{0,12}(?:피해|부진|호조)|(?:가뭄|폭우|폭염|한파|장마|병해충|바이러스).{0,24}(?:피해|차질|방제)|작황 회복|풍작|흉작/ },
  { label: "수급 정책", pattern: /수매\s*비축|시장\s*격리|출하\s*정지|비축.{0,16}(?:방출|공급|확대)|할당\s*관세/ },
  { label: "출하·생산량 동향", pattern: /(?:출하|반입|생산|공급)(?:량|물량)?.{0,14}(?:증가|감소|확대|축소|지연|차질|과잉|부족|본격)|(?:늘어난|줄어든).{0,10}(?:출하량|반입량|생산량)/ },
  { label: "저장·재고 동향", pattern: /(?:저장량|재고량|재고).{0,14}(?:증가|감소|확대|축소|부족|과잉)/ },
  { label: "수출입 동향", pattern: /(?:수출|수입).{0,12}(?:증가|감소|확대|축소|중단|재개|제한)/ },
  { label: "소비·수요 동향", pattern: /(?:수요|소비).{0,12}(?:증가|감소|확대|축소|위축|부진)/ },
];

const factors: Readonly<Record<TrackedItem, readonly SupplyFactor[]>> = {
  배추: [
    { label: "수출 지원 계획", detail: "정부가 연말 수출 확대를 추진하는 김치 업체에 비축 배추를 공급할 계획을 밝혔어요.", source: exportSupport },
    { label: "수매비축 확대", detail: "정부가 가을배추 공급 과잉에 대응해 수매비축 확대와 산지 출하 조절 계획을 발표했어요.", source: cabbageMeasures },
    { label: "김장 수요 감소 전망", detail: "올해 김장용 배추 수요가 지난해보다 9.1% 줄어들 것으로 추정됐어요.", source: cabbageMeasures },
    { label: "가을배추 생산량 증가 전망", detail: "양호한 재배 여건으로 가을배추 생산량이 전년보다 18.5% 늘어날 것으로 전망됐어요.", source: kimchiSupply },
  ],
  무: [
    { label: "수출 지원 계획", detail: "정부가 신선 무 수출 조직을 대상으로 해외 판촉과 바이어 발굴을 지원할 계획을 밝혔어요.", source: exportSupport },
    { label: "가을무 생산량 증가 전망", detail: "양호한 재배 여건으로 가을무 생산량이 전년보다 11.1% 늘어날 것으로 전망됐어요.", source: kimchiSupply },
    { label: "강원 가을무 출하 지연", detail: "강원 지역에 비가 잦았고 생육기에 가뭄도 이어져 가을무 출하가 늦어졌다고 보도됐어요.", source: radishShipment },
    { label: "수급 대응 물량 확보 계획", detail: "정부가 비축·계약재배로 무 9천 톤을 확보해 수급 상황에 맞춰 운용할 계획을 발표했어요.", source: kimchiSupply },
  ],
  양파: [
    { label: "저장 물량 감소", detail: "김장철을 앞두고 양파 저장량이 감소했다고 보도됐어요.", source: storedSupplyReport },
    { label: "정부 비축분 공급 계획", detail: "정부가 김장철 공급을 위해 비축 양파 1,500톤을 가공·유통업체에 공급할 계획을 발표했어요.", source: kimchiSupply },
  ],
  깐마늘: [
    { label: "원료 마늘 파종 지연", detail: "전남·광주 지역의 잦은 가을비로 파종이 늦어진 마늘 농가를 위해 재해보험 가입 기한이 연장됐어요.", source: plantingReport },
    { label: "원료 마늘 저장 재고 감소", detail: "농업관측센터가 집계한 10월 말 난지형 마늘 재고량은 전년보다 8.3% 적었어요.", source: garlicStock },
    { label: "원료 마늘 공급 계획", detail: "정부가 비축 마늘 515톤을 가공·유통업체에 공급할 계획을 발표했어요.", source: kimchiSupply },
    { label: "원료 마늘 생산량 감소", detail: "김장철 수급 대책에서 지난해보다 생산량이 줄어든 양념류에 마늘이 포함됐어요.", source: kimchiSupply },
  ],
  대파: [
    { label: "산지 출하 대기 물량", detail: "가락시장 경매사는 산지에 출하를 기다리는 대파 물량이 많다고 전했어요.", source: wholesaleReport },
    { label: "대파 소비 부진", detail: "농민신문은 김장철 대파 시장에서 공급 과잉과 소비 부진이 겹쳤다고 보도했어요.", source: wholesaleReport },
    { label: "산지 생육 지원 계획", detail: "정부가 생육 중인 대파에 재배 기술 지도와 병해충 방제를 지원할 계획을 발표했어요.", source: kimchiSupply },
  ],
};

export async function getSupplyFactors(itemName: string): Promise<readonly SupplyFactor[]> {
  const name = itemName.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const key = name === "마늘" ? "깐마늘" : name;
  if (!Object.hasOwn(itemMentions, key)) return [];

  const item = key as TrackedItem;
  const cutoff = new Date(Date.now() - 45 * 86400000).toISOString().slice(0, 10);
  const verified = factors[item].filter(factor => factor.source.date >= cutoff);
  const knownUrls = new Set(verified.map(factor => factor.source.url));
  const { items } = await getFoodNews();
  const recent: SupplyFactor[] = [];

  for (const article of items) {
    if (article.date < cutoff || knownUrls.has(article.url) || !itemMentions[item].test(article.title)) continue;
    const event = eventRules.find(rule => rule.pattern.test(article.title));
    if (!event) continue;
    recent.push({
      label: item === "깐마늘" && !article.title.includes("깐마늘") ? `원료 마늘 · ${event.label}` : event.label,
      detail: article.title,
      source: { name: article.source.name, date: article.date, url: article.url },
    });
  }

  return [...recent, ...verified].sort((a, b) => b.source.date.localeCompare(a.source.date)).slice(0, 8);
}
