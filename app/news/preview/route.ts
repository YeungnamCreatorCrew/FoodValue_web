import { newsSources } from "@/lib/news/food-news";

function readOpenGraphImage(html: string) {
  const head = html.split(/<\/head\s*>/i, 1)[0];
  for (const [tag] of head.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/\bproperty=["']og:image["']/i.test(tag)) continue;
    return tag.match(/\bcontent=["']([^"']+)["']/i)?.[1]?.replaceAll("&amp;", "&");
  }
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const source = newsSources.find(source => source.id === params.get("source") && source.articlePreview);
  const id = params.get("id");
  if (!source || !id || !/^\d{1,10}$/.test(id)) return new Response(null, { status: 400 });

  try {
    const article = `https://${source.host}/news/articleView.html?idxno=${id}`;
    const response = await fetch(article, { redirect: "error", next: { revalidate: 86400 }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return new Response(null, { status: 502 });

    const image = readOpenGraphImage(await response.text());
    const url = image ? URL.parse(image, article) : null;
    const matchingPhoto = new RegExp(`^/news/(thumbnail|photo)/[0-9]{6}/${id}_[a-z0-9_.-]+\\.(jpe?g|png|webp)$`, "i");
    const allowedHosts = [source.host, source.host.replace(/^www\./, "cdn.")];
    if (!url || !["https:", "http:"].includes(url.protocol) || !allowedHosts.includes(url.host)
      || url.username || url.password || !matchingPhoto.test(url.pathname)) {
      return new Response(null, { status: 404, headers: { "Cache-Control": "public, max-age=3600" } });
    }

    url.protocol = "https:";
    return new Response(null, { status: 307, headers: { Location: url.href, "Cache-Control": "public, max-age=86400" } });
  } catch {
    return new Response(null, { status: 502 });
  }
}
