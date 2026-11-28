import type { ShapAnalysis } from "@/lib/prices/shap";
import { formatNumber } from "@/lib/prices/format";
import { squarify, type Rect } from "@/lib/analysis/compute";

const W = 100, H = 62; // 가로:세로 비율(퍼센트로 그린다)
const HEAD = 5.5; // 묶음 이름 줄 높이
const won = (value: number) => { const r = Math.round(value); return r === 0 ? "0원" : `${r > 0 ? "+" : "−"}${formatNumber(Math.abs(r))}원`; };
const dir = (value: number) => Math.round(value) > 0 ? "is-up" : Math.round(value) < 0 ? "is-down" : "is-flat";
const box = (r: Rect) => ({ left: `${(r.x / W) * 100}%`, top: `${(r.y / H) * 100}%`, width: `${(r.w / W) * 100}%`, height: `${(r.h / H) * 100}%` });

/**
 * 요인 지도: 네모 넓이 = 영향 크기(|원|), 굵은 테두리 = 묶음, 색 = 방향(옅은 빨강 높임 · 옅은 파랑 낮춤).
 * 묶음 색을 따로 쓰지 않는다(판단 색과 섞이지 않게). 0.5원 미만 요인은 그리지 않는다.
 */
export function FactorMap({ factors }: { factors: ShapAnalysis }) {
  const shown = factors.factors.filter(f => Math.abs(f.contribution) >= 0.5);
  const hidden = factors.factors.length - shown.length;
  const groups = new Map<string, { category: string; label: string; size: number; items: typeof shown }>();
  for (const f of shown) {
    const g = groups.get(f.category) ?? { category: f.category, label: factors.categories.find(c => c.category === f.category)?.label ?? f.categoryLabel, size: 0, items: [] };
    g.size += Math.abs(f.contribution); g.items.push(f); groups.set(f.category, g);
  }
  const placed = squarify([...groups.values()], { x: 0, y: 0, w: W, h: H });
  if (!placed.length) return <p className="fv-notice">영향이 1원 이상인 요인이 없어요.</p>;
  const total = shown.reduce((s, f) => s + Math.abs(f.contribution), 0);
  return <figure className="an-map">
    <div className="an-map-plot" role="img" aria-label={`요인 지도: ${placed.map(g => `${g.label} ${formatNumber((g.size / total) * 100, 0)}%`).join(", ")}`}>
      {placed.map(group => {
        const head = group.rect.h > HEAD * 2 && group.rect.w > 14;
        const inner = { x: group.rect.x, y: group.rect.y + (head ? HEAD : 0), w: group.rect.w, h: group.rect.h - (head ? HEAD : 0) };
        const tiles = squarify(group.items.map(f => ({ ...f, size: Math.abs(f.contribution) })), inner);
        return <div key={group.category} className="an-map-group-wrap">
          {tiles.map(tile => {
            const big = tile.rect.w > 13 && tile.rect.h > 9;
            return <div key={tile.id} className={`an-map-tile ${dir(tile.contribution)}`} style={box(tile.rect)} title={`${group.label} · ${tile.label}: ${won(tile.contribution)}`}>
              {big && <><span className="an-map-name">{tile.label}</span><span className="an-map-val fv-num">{won(tile.contribution)}</span></>}
            </div>;
          })}
          <div className="an-map-group" style={box(group.rect)}>
            {head && <span className="an-map-head">{group.label} <b className="fv-num">{formatNumber((group.size / total) * 100, 0)}%</b></span>}
          </div>
        </div>;
      })}
    </div>
    <figcaption className="fv-cap">네모 넓이 = 영향 크기, 굵은 테두리 = 묶음, 색 = 방향(옅은 빨강 높임 · 옅은 파랑 낮춤). 작은 네모는 마우스를 올리면 이름이 보여요.{hidden > 0 && ` 영향이 1원 미만인 ${hidden}개는 뺐어요.`}</figcaption>
    <ul className="sr-only">{shown.map(f => <li key={f.id}>{f.label}: {won(f.contribution)}</li>)}</ul>
  </figure>;
}
