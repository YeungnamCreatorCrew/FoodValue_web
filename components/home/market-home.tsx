import Image from "next/image";
import Link from "next/link";
import type { LivePrice, PriceListPage } from "@/lib/prices/model";
import { formatNumber, formatPercent, longDate, won } from "@/lib/prices/format";
import { countByState, latestDate, seasonalState } from "@/components/board/board-model";
import { FvIcon } from "@/components/fv/icons";
import styles from "./market-home.module.css";

const seasonalRate = (item: LivePrice) => item.listIndicators?.seasonalDiffRate ?? null;
const rateOrder = (a: LivePrice, b: LivePrice) => (seasonalRate(a) ?? Infinity) - (seasonalRate(b) ?? Infinity);

function Price({ value, className }: { value: number | null; className?: string }) {
  return <strong className={className}><span>{value == null ? "확인 중" : formatNumber(value)}</span>{value != null && <small>원</small>}</strong>;
}

function FoodCard({ item, expensive = false }: { item: LivePrice; expensive?: boolean }) {
  const rate = seasonalRate(item);
  return <Link href={`/prices/${item.id}`} prefetch={false} className={styles.foodCard}>
    <div className={styles.foodPhoto}>
      {item.image && <Image src={item.image} alt="" fill sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 180px" />}
    </div>
    <div className={styles.foodInfo}><div className={styles.foodTitle}><h3>{item.name}</h3><span>{item.unit}</span></div><Price value={item.currentPrice} className={styles.foodPrice} /><p className={`${styles.comparison} ${expensive ? styles.expensive : styles.affordable}`}>{rate != null ? `평년 대비 ${formatPercent(rate * 100)}` : expensive ? "평년보다 비싼 편" : "평년보다 싼 편"}</p></div>
  </Link>;
}

export function MarketHome({ data }: { data: PriceListPage | null }) {
  if (!data) return <section className={styles.unavailable}><p className={styles.eyebrow}>오늘의 식널</p><h1>지금 가격을<br />불러오지 못했어요.</h1><p>잠시 뒤 다시 확인해 주세요.</p><Link href="/" className="fv-btn">다시 불러오기</Link><Link href="/prices" className="fv-link">전체 시세 보기</Link></section>;
  const items = data.items;
  const date = latestDate(items);
  // Headline deals only use current observations and a current indicator snapshot.
  // An older price is still available on the full board with its own date.
  const current = items.filter(item => item.currentPrice != null && item.priceDate === date && item.status !== "STALE" && !item.listIndicators?.stale);
  const counts = countByState(current);
  const comparable = counts.down + counts.neutral + counts.up;
  const cheap = current.filter(item => seasonalState(item) === "down").toSorted(rateOrder);
  const expensive = current.filter(item => seasonalState(item) === "up").toSorted((a, b) => -rateOrder(a, b));
  const featured = cheap[0] ?? expensive[0] ?? current[0];
  const rate = featured ? seasonalRate(featured) : null;
  const featuredState = featured ? seasonalState(featured) : null;
  const risers = current.filter(item => (item.weeklyChangeRate ?? 0) > 0).toSorted((a, b) => b.weeklyChangeRate! - a.weeklyChangeRate!).slice(0, 3);
  const category = (code: string) => items.filter(item => item.categoryCode === code);

  return <>
    <div className={styles.intro}>
      <div><p className={styles.eyebrow}>오늘의 식널</p><p className={styles.welcome}>장보기 전에, 지금 가격부터 확인해요.</p></div>
      <form action="/prices" method="get" className={styles.search} role="search">
        <FvIcon name="search" size={22} /><label htmlFor="home-item-search" className="sr-only">식재료 이름이나 별칭 검색</label>
        <input id="home-item-search" type="search" name="q" placeholder="어떤 식재료가 궁금하세요?" maxLength={50} />
        <button type="submit">검색</button>
      </form>
    </div>

    <p className={styles.date}>{date ? <><time dateTime={date}>{longDate(date)}</time> 조사 기준</> : "가격 기준일 확인 중"}<span>KAMIS 전국 소매가</span></p>

    <section className={styles.heroGrid} aria-label="오늘의 가격 요약">
      <div className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.heroEyebrow}>{featuredState === "down" ? "오늘 눈여겨볼 식재료" : "장보기 전 확인해 보세요"}</p>
          <h1>{featured ? <><span>{featured.name},</span>{featuredState === "down" || featuredState === "up" ? <>평년보다<br /><strong>{rate != null ? <>{formatNumber(Math.abs(rate * 100), 1)}<small>%</small> </> : ""}{featuredState === "down" ? "싸요." : "비싸요."}</strong></> : <>지금 가격을<br />살펴보세요.</>}</> : <>오늘의 가격을<br />준비하고 있어요.</>}</h1>
          <p className={styles.heroBasis}>최근 4주 평균 · 직전 5년 같은 시기와 비교</p>
          <Link href={featured ? `/prices/${featured.id}` : "/prices"} prefetch={false} className={styles.heroButton}>가격 흐름 살펴보기</Link>
        </div>
        {featured?.image && <div className={styles.heroProduct}><div className={styles.heroPhoto}><Image src={featured.image} alt={featured.name} fill sizes="(max-width: 600px) 42vw, 340px" preload /></div><div className={styles.productPrice}><span>현재 소매가 · {featured.unit}</span><Price value={featured.currentPrice} /></div></div>}
      </div>

      <aside className={styles.summary} aria-label="평년 대비 품목 수">
        <p className={styles.summaryTitle}>오늘의 장보기 신호</p>
        <p className={styles.summaryScope}>최신 가격 {current.length}개 · 평년 비교 {comparable}개</p>
        <div className={styles.signalCounts}><a href="#affordable" className={styles.cheapCount}><span>싼 편</span><strong>{counts.down}<small>개</small></strong></a><a href="#expensive" className={styles.highCount}><span>비싼 편</span><strong>{counts.up}<small>개</small></strong></a></div>
        <div className={styles.otherCounts}><span>평년 수준 <b>{counts.neutral}개</b></span><span>비교 정보 없음 <b>{current.length - comparable}개</b></span></div>
        <p className={styles.summaryRule}>평년 대비 −10% 이하 · +10% 이상 기준</p>
        <Link href="/prices" className={styles.allPrices}>전체 {items.length}개 시세 보기</Link>
      </aside>
    </section>

    <nav className={styles.quickLinks} aria-label="식재료 둘러보기">
      <Link href="/prices"><FvIcon name="search" size={20} />전체 품목 <span>{items.length}</span></Link>
      {category("VEGETABLE").length > 0 && <Link href="/prices?c=VEGETABLE">채소 <span>{category("VEGETABLE").length}</span></Link>}
      {category("FRUIT").length > 0 && <Link href="/prices?c=FRUIT">과일 <span>{category("FRUIT").length}</span></Link>}
      <Link href="/analysis">왜 이런 가격일까요?</Link>
    </nav>

    <section id="affordable" className={styles.section}>
      <div className={styles.sectionHead}><div><h2>평년보다 싼 식재료</h2><p>최근 4주 평균이 평년보다 10% 이상 낮아요.</p></div><Link href="/prices?f=down" className={styles.textLink}>전체 보기</Link></div>
      {cheap.length > 0 ? <div className={styles.foodGrid}>{cheap.slice(0, 6).map(item => <FoodCard key={item.id} item={item} />)}</div> : <div className={styles.empty}><h3>{comparable ? "지금은 평년보다 싼 편인 품목이 없어요." : "평년과 비교할 자료를 준비하고 있어요."}</h3><p>최신 가격과 비교 자료가 함께 확인된 품목을 보여드려요.</p></div>}
    </section>

    <div className={styles.lowerGrid}>
      <section id="expensive" className={styles.section}>
        <div className={styles.sectionHead}><div><h2>평년보다 비싼 식재료</h2><p>평년 대비 +10% 이상인지 확인해요.</p></div></div>
        {expensive.length > 0 ? <div className={styles.expensiveGrid}>{expensive.slice(0, 3).map(item => <FoodCard key={item.id} item={item} expensive />)}</div> : <div className={styles.noExpensive}><FvIcon name="info" size={24} /><h3>{comparable ? "지금은 비싼 편인 품목이 없어요." : "아직 평년과 비교하기 어려워요."}</h3><p>{comparable ? `비교 가능한 ${comparable}개 품목에서 평년 대비 +10% 이상인 품목은 없어요.` : "자료가 충분한 품목부터 알려드릴게요."}</p><Link href="/prices" className={styles.textLink}>다른 품목도 살펴보기</Link></div>}
      </section>

      <section className={styles.section} aria-labelledby="weekly-risers-title">
        <div className={styles.sectionHead}><div><h2 id="weekly-risers-title">지난주보다 오른 식재료</h2><p>평년 판단과 별도로, 지난주 가격과 비교해요.</p></div></div>
        <div className={styles.weeklyList}>{risers.length ? risers.map(item => <Link href={`/prices/${item.id}`} prefetch={false} className={styles.weeklyRow} key={item.id}>
          <div className={styles.weeklyPhoto}>{item.image && <Image src={item.image} alt="" fill sizes="68px" />}</div><div className={styles.weeklyName}><h3>{item.name}</h3><span>{item.unit} · {won(item.currentPrice)}</span></div><div className={styles.weeklyRate}><span>지난주 대비</span><strong>{formatPercent(item.weeklyChangeRate)}</strong></div>
        </Link>) : <div className={styles.empty}><h3>확인된 상승 품목이 없어요.</h3><p>자료가 확인되는 대로 가격 흐름을 보여드릴게요.</p></div>}</div>
      </section>
    </div>

    <div className={styles.bottomCta}><div><p>식재료별 가격을 더 자세히</p><h2>전체 시세에서 비교해 보세요.</h2></div><Link href="/prices" className="fv-btn">전체 시세 보기</Link></div>
    <footer className={styles.footer}><p>홈의 평년 판단은 최신 가격·지표가 함께 확인된 품목 기준이에요. 이전 날짜의 가격은 전체 시세에서 날짜와 함께 볼 수 있어요.</p><p>최근 4주 평균과 평년을 비교한 사실 정보이며, 향후 가격이나 절약을 보장하지 않아요. <Link href="/about">판단 기준</Link> · <a href="/images/items/credits.html">사진 출처</a></p></footer>
  </>;
}
