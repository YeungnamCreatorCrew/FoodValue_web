import { XMLParser } from "fast-xml-parser";

export const newsSources = [
  { id: "amnews", name: "농축유통신문", host: "www.amnews.co.kr", articlePreview: true, feeds: ["/rss/allArticle.xml"] },
  { id: "aflnews", name: "농수축산신문", host: "www.aflnews.co.kr", articlePreview: true, feeds: ["/rss/allArticle.xml"] },
  { id: "ikpnews", name: "한국농정신문", host: "www.ikpnews.net", articlePreview: true, feeds: ["/rss/allArticle.xml"] },
  { id: "agrinet", name: "한국농어민신문", host: "www.agrinet.co.kr", articlePreview: true, feeds: ["/rss/allArticle.xml"] },
  { id: "foodnews", name: "식품저널", host: "www.foodnews.co.kr", articlePreview: true, feeds: ["/rss/allArticle.xml"] },
  { id: "mafra", name: "농림축산식품부", host: "www.mafra.go.kr", articlePreview: false,
    feeds: ["/bbs/home/792/rssList.do?row=50", "/bbs/home/793/rssList.do?row=50"] },
  { id: "mfds", name: "식품의약품안전처", host: "www.mfds.go.kr", articlePreview: false,
    feeds: ["/www/rss/brd.do?brdId=ntc0021"] },
] as const;

const supplyTopics = /농산물|농축산물|축산물|수산물|농수산물|식자재|식재료|식품|밥상\s*물가|장바구니|수급|출하|도매시장|경락|반입량|비축|할당관세|농작물|작황|병해충|조류인플루엔자|구제역|돼지열병/;
const ingredients = /채소|과일|곡물|쌀|벼|콩|대두|배추|가을무|월동무|양파|마늘|대파|고추|토마토|감자|고구마|딸기|사과|감귤|양계|달걀|계란|우유|한우|돼지고기|닭고기|오리고기|육용오리/;
const nonFood = /건강기능식품|반려동물|의약품|의료기기|화장품|동물복지|농촌체험/;
const agencyNames = /농림축산식품부|농식품부|식품의약품안전처|식약처/g;
const parser = new XMLParser({ parseTagValue: false, isArray: (_name, path) => path === "rss.channel.item" });
const koreanDate = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;

type NewsSource = (typeof newsSources)[number];
type NewsItem = { title: string; url: string; source: NewsSource; publishedAt: number; date: string };

async function loadFeed(source: NewsSource, path: string): Promise<NewsItem[]> {
  const response = await fetch(`https://${source.host}${path}`, {
    next: { revalidate: 1800 }, signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error(`RSS HTTP ${response.status}`);

  const rss = parser.parse(await response.text())?.rss;
  if (!rss?.channel) throw new Error("RSS channel is missing");
  const items: { title?: unknown; link?: unknown; pubDate?: unknown }[] = rss.channel.item ?? [];
  return items.flatMap(item => {
    if (typeof item.title !== "string" || typeof item.link !== "string" || typeof item.pubDate !== "string") return [];
    const title = item.title.replace(/\s+/g, " ").trim();
    const subject = title.replace(agencyNames, "");
    if (nonFood.test(subject) || !(supplyTopics.test(subject) || ingredients.test(subject))) return [];

    const url = URL.parse(item.link.trim());
    if (!url || url.host !== source.host || url.username || url.password || !["https:", "http:"].includes(url.protocol)) return [];
    url.protocol = "https:";
    const dateTime = item.pubDate.trim();
    const publishedAt = Date.parse(koreanDate.test(dateTime) ? dateTime.replace(" ", "T") + "+09:00" : dateTime);
    if (!Number.isFinite(publishedAt)) return [];
    const date = new Date(publishedAt + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    return [{ title, url: url.href, source, publishedAt, date }];
  });
}

export async function getFoodNews(sourceId?: string) {
  const sources = sourceId ? newsSources.filter(source => source.id === sourceId) : newsSources;
  const results = await Promise.allSettled(sources.flatMap(source => source.feeds.map(path => loadFeed(source, path))));
  const articles = results.flatMap(result => result.status === "fulfilled" ? result.value : []);
  articles.sort((a, b) => b.publishedAt - a.publishedAt);
  const urls = new Set<string>();
  const titles = new Set<string>();
  const items = articles.filter(article => {
    if (urls.has(article.url) || titles.has(article.title)) return false;
    urls.add(article.url);
    titles.add(article.title);
    return true;
  });
  return { items, unavailable: results.filter(result => result.status === "rejected").length };
}
