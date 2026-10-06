"use client";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="p-10 text-center"><h1 className="text-lg font-semibold">시세를 불러오지 못했습니다.</h1><button onClick={reset} className="mt-4 rounded-lg bg-primary px-4 py-2 text-white">다시 시도</button></main>;
}
