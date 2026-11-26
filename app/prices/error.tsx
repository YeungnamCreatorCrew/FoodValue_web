"use client";

import { ErrorState } from "@/components/fv/state";

/** 시세 화면을 그리지 못했을 때. '다시 시도'(retry)는 서버에서 다시 불러와 그린다(Next 16.3). */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main id="main-content" className="fv-page">
    <ErrorState message="잠시 뒤 다시 시도해 주세요. 계속 안 되면 인터넷 연결을 확인해 주세요." onRetry={() => retry()} />
  </main>;
}
