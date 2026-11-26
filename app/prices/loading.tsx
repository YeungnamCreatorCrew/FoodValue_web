import { LoadingRegion, Skeleton } from "@/components/fv/state";

/** 상세로 넘어가는 동안 최종 화면과 같은 자리에 뼈대를 그린다. */
export default function Loading() {
  return <main id="main-content" className="fv-page detail-page">
    <LoadingRegion label="시세를 불러오는 중이에요">
      <div className="loading-stack"><Skeleton className="loading-crumb" /><Skeleton className="loading-summary" /><Skeleton className="loading-trend" /></div>
    </LoadingRegion>
  </main>;
}
