"use client";

import type { PriceModelTrack } from "@/lib/prices/dto";
import { TRACKS } from "@/lib/prices/track-meta";
import { useCallback, useId, useRef, useState } from "react";
import { Modal } from "@/components/common/modal";
import Image from "next/image";

const guides = {
  ENSEMBLE: {
    image: "/images/models/machine-learning.webp", title: "세 모델이 함께 살펴봐요", subtitle: "머신러닝 · 여러 예측의 평균",
    description: "서로 다른 방식으로 가격을 살펴보는 세 모델이 각각 예측하고, 그 값을 평균 내요.",
    steps: [
      ["가격의 패턴 찾기", "XGBoost와 LightGBM이 과거 가격, 도매 흐름, 전국 날씨와 명절 정보를 함께 살펴봐요."],
      ["시간의 흐름 읽기", "AutoARIMA가 과거 가격의 흐름과 요일·명절 정보를 살펴봐요."],
      ["세 예측 모으기", "세 모델의 예측을 같은 비중으로 평균 내서 7일 뒤 가격을 보여줘요."],
    ],
    inputs: ["과거 소매·도매 가격", "전국 관측 날씨", "요일·명절"],
    takeaway: "세 가지 예측을 평균 내 서로 다른 모델의 관점을 함께 반영해요.",
  },
  STRUCT: {
    image: "/images/models/structural.webp", title: "가격 변화를 하나씩 더해 봐요", subtitle: "자체모델 · 요인별 계산",
    description: "현재 가격에서 출발해 도매 흐름, 평소 소매·도매 관계, 계절과 명절 효과를 식으로 계산해요.",
    steps: [
      ["도매 흐름 살피기", "최근 도매가격 변화가 소매가격에 얼마나 이어졌는지 과거 자료로 학습해요."],
      ["평소 관계와 시기 비교", "소매·도매 배수가 평소 수준으로 돌아가는 흐름, 과거 같은 시기와 명절의 변화를 살펴봐요."],
      ["요인별 변화 합치기", "각 요인의 계산 결과를 합쳐 7일 뒤 가격을 구해요. 자세히에서 요인별 기여를 확인할 수 있어요."],
    ],
    inputs: ["도매가격 변화", "소매·도매 배수", "계절·명절"],
    takeaway: "각 요인이 예측에 보탠 값을 나눠 볼 수 있도록 설계한 食널 모델이에요.",
  },
};

function ModelGuide({ initial, onSelect }: { initial: PriceModelTrack; onSelect: (track: PriceModelTrack) => void }) {
  const [selected, setSelected] = useState(initial);
  const id = useId();
  const guide = guides[selected];
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  return <div className="model-guide">
    <div className="model-guide-tabs" role="tablist" aria-label="모델 설명">
      {TRACKS.map((track, index) => <button key={track.key} ref={node => { tabs.current[index] = node; }}
        type="button" role="tab" id={`${id}-${track.key}`} aria-selected={selected === track.key}
        aria-controls={`${id}-panel`} tabIndex={selected === track.key ? 0 : -1}
        onClick={() => setSelected(track.key)} onKeyDown={event => {
          const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
          if (!keys.includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? TRACKS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + TRACKS.length) % TRACKS.length;
          setSelected(TRACKS[next].key);
          tabs.current[next]?.focus();
        }}><Image src={guides[track.key].image} alt="" width={64} height={48} /><span>{track.label}<small>{track.key === "ENSEMBLE" ? "세 예측을 모아서" : "요인을 하나씩 계산"}</small></span></button>)}
    </div>
    <section role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${selected}`} tabIndex={0}>
      <div className="model-guide-intro">
        <Image className="model-guide-illustration" src={guide.image} alt={selected === "ENSEMBLE" ? "세 계산기가 함께 예측을 모으는 모습" : "계산기가 가격 요인 타일을 조합하는 모습"} width={210} height={160} />
        <div><p className="fv-cap">{guide.subtitle}</p><h3>{guide.title}</h3></div>
      </div>
      <p>{guide.description}</p>
      <div className="model-guide-inputs"><h4>어떤 정보를 보나요?</h4><ul>{guide.inputs.map(input => <li key={input}>{input}</li>)}</ul></div>
      <div className="model-guide-flow" aria-label={selected === "ENSEMBLE" ? "XGBoost, LightGBM, AutoARIMA의 예측을 평균 내 7일 예측을 만들어요" : "현재 가격에서 도매 흐름, 배수, 계절과 명절에 따른 변화를 계산해 7일 예측을 만들어요"}>
        {selected === "ENSEMBLE" ? <>
          <div className="model-guide-members">{["XGBoost", "LightGBM", "AutoARIMA"].map(name => <span key={name}>{name}</span>)}</div>
          <span className="model-guide-arrow" aria-hidden="true">→</span><strong>같은 비중으로 평균</strong>
        </> : <>
          <strong>현재 가격</strong><span className="model-guide-arrow" aria-hidden="true">→</span><div className="model-guide-members"><span>도매 흐름</span><span>평소 배수</span><span>계절·명절</span></div>
        </>}
        <span className="model-guide-arrow" aria-hidden="true">→</span><strong className="model-guide-result">7일 예측</strong>
      </div>
      <h4 className="model-guide-heading">이렇게 계산해요</h4>
      <dl className="model-guide-steps">{guide.steps.map(([title, detail]) =>
        <div key={title}><dt>{title}</dt><dd>{detail}</dd></div>)}</dl>
      <p className="model-guide-takeaway">{guide.takeaway}</p>
    </section>
    <div className="model-guide-questions">
      <h4>두 가격이 다르면 어떻게 보나요?</h4>
      <p>입력 정보와 계산 방식이 달라 예측값도 달라질 수 있어요. 두 모델을 번갈아 보며 예상 방향과 범위를 비교해 보세요.</p>
      <h4>어느 쪽이 더 잘 맞나요?</h4>
      <p>품목과 시기에 따라 달라요. 예측의 ‘자세히’에서 해당 품목의 과거 평균 오차를 확인할 수 있어요. 오차가 작을수록 과거 실제 가격에 더 가까웠다는 뜻이에요.</p>
    </div>
    <button type="button" className="model-guide-select" onClick={() => onSelect(selected)}>
      {initial === selected ? "현재 모델로 돌아가기" : `${TRACKS.find(track => track.key === selected)?.label} 예측 보기`} <span aria-hidden="true">→</span>
    </button>
  </div>;
}

/** 예측 모델 고르기(앙상블 / 구조식). 고른 쪽은 aria-pressed로 알린다. */
export function ModelSwitch({ value, onChange, className = "" }: { value: PriceModelTrack; onChange: (track: PriceModelTrack) => void; className?: string }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  const id = useId();
  return <div className={`model-picker ${className}`}>
    <div role="group" aria-label="예측 모델 고르기" className="model-switch">
    {TRACKS.map(track => <button key={track.key} type="button" aria-pressed={value === track.key} title={track.about}
      onClick={() => { if (value !== track.key) onChange(track.key); }}>{track.label}</button>)}
    </div>
    <button ref={button} className="model-guide-open" type="button" aria-haspopup="dialog" onClick={() => setOpen(true)}>두 모델 알아보기 <span aria-hidden="true">ⓘ</span></button>
    {open && <Modal titleId={id} title="나란히 보는 두 가지 예측" onClose={close} returnTo={button}><ModelGuide initial={value} onSelect={track => {
      if (track !== value) onChange(track);
      close();
    }} /></Modal>}
  </div>;
}
