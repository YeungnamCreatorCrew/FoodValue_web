import { getSupplyFactors } from "@/lib/prices/supply-factors";
import { longDate } from "@/lib/prices/format";

export async function SupplyFactors({ itemName }: { itemName: string }) {
  const factors = await getSupplyFactors(itemName);
  if (!factors.length) return null;

  return (
    <section aria-labelledby="supply-factors-title">
      <h2 id="supply-factors-title" className="fv-h2">가격 관련 수급 요인</h2>
      <ul className="fv-card supply-factor-list">
        {factors.map(({ label, detail, source }) => (
          <li key={`${source.url}#${label}`} className="supply-factor">
            <div>
              <h3>{label}</h3>
              <p>{detail}</p>
              <time dateTime={source.date}>{longDate(source.date)}</time>
            </div>
            <a className="fv-link" href={source.url} target="_blank" rel="noopener noreferrer"
              aria-label={`${label} 원문, ${source.name} (새 탭)`}>
              {source.name} <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
