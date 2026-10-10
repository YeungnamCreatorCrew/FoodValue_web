export default function Loading() {
  return <main id="main-content" aria-busy="true" className="px-5 py-8"><p role="status" className="text-sm text-muted">시세를 불러오고 있습니다.</p><div className="mt-4 flex animate-pulse flex-col gap-3">{[1, 2, 3, 4].map(n => <div key={n} className="h-[134px] rounded-xl bg-slate-200" />)}</div></main>;
}
