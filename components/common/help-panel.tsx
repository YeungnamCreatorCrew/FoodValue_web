"use client";

import { forwardRef, useCallback } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { FvIcon } from "@/components/fv/icons";

/** 화면 어디서나 여는 '지표 읽는 법'. 본문을 밀어내지 않고 오른쪽에서 겹쳐 열린다. Esc로 닫고, 닫으면 (?) 버튼으로 돌아간다. */
const TERMS: { term: string; text: string }[] = [
  { term: "평년 대비", text: "지난 5년 같은 시기 평균과 견준 값이에요. 홈의 판단(싼 편·평년 수준·비싼 편)은 이 지표로 해요." },
  { term: "1년 중 위치", text: "최근 1년 하루하루 가격 중 지금보다 싼 날의 비율로 정한 자리예요. 낮은 쪽·중간·높은 쪽으로 말해요." },
  { term: "지난주 대비", text: "일주일 전 가격보다 얼마나 오르고 내렸는지예요." },
  { term: "도매 흐름", text: "시장 도매가가 먼저 움직였는지 봐요. 소매가는 보통 도매가를 뒤따라요." },
  { term: "AI 7일 예측", text: "모델이 계산한 7일 뒤 가격이에요. 틀릴 수 있어 참고로만 보여드려요." },
];

/** 도움말 내용. (?)를 처음 누를 때 받는다(첫 화면 JS를 줄인다). */
export const HelpPanel = forwardRef<HTMLDivElement, { onClose: () => void }>(function HelpPanel({ onClose }, panel) {
  const setOpen = (value: false) => { if (!value) onClose(); };
  // 받아서 처음 그릴 때 패널로 포커스를 옮긴다(나중에 받는 코드라 여는 쪽에서는 아직 패널이 없다).
  const attach = useCallback((node: HTMLDivElement | null) => {
    if (typeof panel === "function") panel(node); else if (panel) panel.current = node;
    node?.focus();
  }, [panel]);
  // body에 직접 그린다. 헤더(sticky) 안에 두면 같은 높이의 모바일 탭바가 도움말을 덮는다.
  return createPortal(<div className="help-layer">
      <div className="help-backdrop" aria-hidden="true" onClick={() => setOpen(false)} />
      <div ref={attach} role="dialog" aria-modal="true" aria-labelledby="help-title" tabIndex={-1} className="help-panel">
        <div className="help-head">
          <h2 id="help-title" className="fv-h2">지표 읽는 법</h2>
          <button type="button" className="help-close" aria-label="닫기" onClick={() => setOpen(false)}><FvIcon name="close" size={22} /></button>
        </div>
        <dl className="help-terms">
          {TERMS.map(entry => <div key={entry.term}><dt>{entry.term}</dt><dd>{entry.text}</dd></div>)}
        </dl>
        <div className="help-colors">
          <p className="help-colors-title">색과 기호</p>
          <ul>
            <li><span className="fv-badge tone-down">↓ 싼 편</span>평년보다 싸요. 내린 값도 파랑이에요</li>
            <li><span className="fv-badge tone-flat">— 평년 수준</span>평년과 비슷해요. 자리·참고값도 회색이에요</li>
            <li><span className="fv-badge tone-up">↑ 비싼 편</span>평년보다 비싸요. 오른 값도 빨강이에요</li>
          </ul>
        </div>
        <Link href="/about" className="fv-link" prefetch={false} onClick={() => setOpen(false)}>판단 기준 자세히 보기 ›</Link>
      </div>
    </div>, document.body);
});
