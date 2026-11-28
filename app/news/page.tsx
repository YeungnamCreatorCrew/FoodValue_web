import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getFoodNews, newsSources } from "@/lib/news/food-news";
import { longDate } from "@/lib/prices/format";
import { NewsThumbnail } from "./news-thumbnail";
import styles from "./news.module.css";

export const metadata: Metadata = { title: "주요 뉴스 | FoodValue" };

// 각 사진은 해당 농림축산식품부 보도자료의 현장 사진 첨부본에서 가져왔습니다.
const articlePhotos = new Map([
  ["https://www.mafra.go.kr/bbs/home/792/582393/artclView.do", "/images/news/fruit-expo.webp"],
  ["https://www.mafra.go.kr/bbs/home/792/582386/artclView.do", "/images/news/tomato-growers.webp"],
  ["https://www.mafra.go.kr/bbs/home/792/582372/artclView.do", "/images/news/domestic-soybeans.webp"],
]);

const pageSize = 24;

function newsHref(source?: string, page = 1) {
  const query = new URLSearchParams();
  if (source) query.set("source", source);
  if (page > 1) query.set("page", String(page));
  return query.size ? `/news?${query}` : "/news";
}

async function NewsList({ source, requestedPage }: { source?: string; requestedPage: number }) {
  const { items, unavailable } = await getFoodNews(source);
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, lastPage);
  const visible = items.slice((page - 1) * pageSize, page * pageSize);

  return <>
    {unavailable > 0 && <p className="fv-notice">
      {items.length > 0 ? "일부 출처의 최신 소식을 가져오지 못했어요." : "지금은 최신 소식을 불러오지 못했어요. 잠시 뒤 다시 확인해 주세요."}
    </p>}
    {items.length > 0 ? (
      <ul className={`fv-card ${styles.list}`} aria-label="최신 식자재 뉴스">
        {visible.map(item => {
          const article = new URL(item.url);
          const id = article.searchParams.get("idxno");
          const photo = articlePhotos.get(item.url) ?? (
            item.source.articlePreview && article.pathname === "/news/articleView.html" && id && /^\d{1,10}$/.test(id)
              ? `/news/preview?${new URLSearchParams({ source: item.source.id, id })}`
              : undefined
          );
          return (
            <li className={styles.item} key={item.url}>
              <a className={styles.article} href={item.url} target="_blank" rel="noopener noreferrer">
                {photo && <NewsThumbnail src={photo} />}
                <div className={styles.copy}>
                  <h2>{item.title}</h2>
                  <p className="fv-cap">{item.source.name} · <time dateTime={item.date}>{longDate(item.date)}</time></p>
                </div>
                <span className={styles.original}>원문 <span aria-hidden="true">↗</span><span className="sr-only"> (새 탭)</span></span>
              </a>
            </li>
          );
        })}
      </ul>
    ) : unavailable === 0 && <p className="fv-notice">가져온 최신 식자재 소식이 없어요.</p>}
    {lastPage > 1 && <nav className={styles.pagination} aria-label="뉴스 페이지">
      {page > 1 && <Link className="fv-link" href={newsHref(source, page - 1)} prefetch={false}>이전</Link>}
      <span className="fv-cap">{page} / {lastPage} 페이지</span>
      {page < lastPage && <Link className="fv-link" href={newsHref(source, page + 1)} prefetch={false}>다음</Link>}
    </nav>}
  </>;
}

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const query = await searchParams;
  const source = newsSources.find(entry => entry.id === query.source)?.id;
  const page = typeof query.page === "string" && /^\d{1,6}$/.test(query.page) ? Math.max(1, Number(query.page)) : 1;
  return <main id="main-content" className={`fv-page ${styles.page}`}>
    <header>
      <h1 className="fv-h1">주요 뉴스</h1>
      <p className="fv-cap">식자재 생산·유통·수급과 식품 안전 소식을 최신순으로 모았어요.</p>
    </header>
    <nav className={styles.sources} aria-label="뉴스 출처">
      <Link href={newsHref()} aria-current={source ? undefined : "page"} prefetch={false}>전체</Link>
      {newsSources.map(entry => (
        <Link key={entry.id} href={newsHref(entry.id)} aria-current={source === entry.id ? "page" : undefined} prefetch={false}>
          {entry.name}
        </Link>
      ))}
    </nav>
    <Suspense key={newsHref(source, page)} fallback={<p className="fv-notice" role="status">최신 소식을 불러오는 중이에요.</p>}>
      <NewsList source={source} requestedPage={page} />
    </Suspense>
  </main>;
}
