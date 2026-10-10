"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

interface ReceiptScanViewProps {
  previewUrl: string | null;
}

function SkeletonRow({ widths }: { widths: [number, number, number] }) {
  return (
    <div className="flex h-[66px] shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5">
      <div className="size-[18px] shrink-0 rounded-[2px] bg-slate-100" />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="h-[14px] animate-pulse rounded-full bg-slate-100" style={{ width: widths[0] }} />
        <div className="h-3 animate-pulse rounded-full bg-slate-100" style={{ width: widths[1] }} />
        <div className="h-2.5 animate-pulse rounded-full bg-slate-100" style={{ width: widths[2] }} />
      </div>
    </div>
  );
}

/** 인식 중 화면: 사진 위에 스캔 효과, 진행 막대, 로딩 줄들 (FRG-03_영수증등록_인식중) */
export function ReceiptScanView({ previewUrl }: ReceiptScanViewProps) {
  // 진행 막대는 실제 진행률을 모르므로, 마운트 직후 90%까지 천천히 차오르게만 한다
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="영수증을 인식하는 중">
      <div className="relative h-[180px] shrink-0 overflow-hidden rounded-[10px] border border-slate-300 bg-slate-200">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="올린 영수증" className="size-full object-contain" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center">
            <Icon name="receipt" size={48} />
            <p className="text-sm leading-5 text-slate-400">영수증 이미지</p>
          </div>
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-[10px] bg-slate-900/45">
          <div className="flex items-center justify-center gap-1.5 rounded-[20px] border border-white/30 bg-white/15 px-3 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-green-400" />
            <span className="text-sm font-medium leading-5 whitespace-nowrap text-white">스캔 중…</span>
          </div>
          <div className="h-0.5 w-[280px] max-w-[80%] animate-pulse bg-gradient-to-r from-green-400/0 via-green-400 to-green-400/0" />
        </div>
      </div>

      <div className="h-4 overflow-hidden rounded-[40px] bg-slate-100">
        <div
          className="h-full rounded-[40px] bg-primary"
          style={{ width: started ? "90%" : "8%", transition: "width 4s ease-out" }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-base font-medium leading-6 text-slate-900">영수증에서 재료를 찾고 있어요</p>
        <p className="text-sm leading-5 text-slate-500">잠시 기다리면 재료 목록을 자동으로 불러올게요</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="flex-1 text-base font-medium leading-6 text-slate-700">인식 결과</p>
          <p className="text-sm font-medium leading-5 whitespace-nowrap text-slate-500">— 개 선택</p>
        </div>
        <SkeletonRow widths={[100, 140, 90]} />
        <SkeletonRow widths={[120, 150, 80]} />
        <SkeletonRow widths={[80, 130, 100]} />
      </div>
    </div>
  );
}
