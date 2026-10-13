export default function PricesLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col bg-slate-50"><a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:z-50 focus:bg-white focus:p-2">본문 바로가기</a>{children}</div>;
}
