"use client";

import type { PriceModelTrack } from "@/lib/prices/dto";
import { TRACKS } from "@/lib/prices/track-meta";

/** 예측 모델 고르기(앙상블 / 구조식). 고른 쪽은 aria-pressed로 알린다. */
export function ModelSwitch({ value, onChange, className = "" }: { value: PriceModelTrack; onChange: (track: PriceModelTrack) => void; className?: string }) {
  return <div role="group" aria-label="예측 모델 고르기" className={`model-switch ${className}`}>
    {TRACKS.map(track => <button key={track.key} type="button" aria-pressed={value === track.key} title={track.about}
      onClick={() => { if (value !== track.key) onChange(track.key); }}>{track.label}</button>)}
  </div>;
}
