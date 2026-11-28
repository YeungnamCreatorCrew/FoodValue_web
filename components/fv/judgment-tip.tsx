"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { IndicatorCard } from "@/lib/prices/model";
import { RULES, lift, noTrustText, pct, pooledTrust, trustOf, type Rule, type TrustLine } from "@/lib/prices/rules";
import { formatNumber } from "@/lib/prices/format";
import { FvIcon } from "./icons";
import { josa } from "./text";

/** 기준선 눈금자(그림 설명용 고정 값). */
export function RuleRuler({ rule }: { rule: Rule }) {
  const total = rule.widths.reduce((a, b) => a + b, 0);
  const at = (i: number) => `${(rule.widths.slice(0, i + 1).reduce((a, b) => a + b, 0) / total) * 100}%`;
  const cols = rule.widths.map(w => `${w}fr`).join(" ");
  return <div className={`tip-ruler${rule.colored ? "" : " is-plain"}`} role="img" aria-label={`${rule.zones[0]} | ${rule.cuts[0]} | ${rule.zones[1]} | ${rule.cuts[1]} | ${rule.zones[2]}`}>
    <div className="tip-ruler-cuts fv-num" aria-hidden="true"><span style={{ left: at(0) }}>{rule.cuts[0]}</span><span style={{ left: at(1) }}>{rule.cuts[1]}</span></div>
    <div className="tip-ruler-track" style={{ gridTemplateColumns: cols }} aria-hidden="true"><span className="is-low" /><span className="is-mid" /><span className="is-high" /></div>
    <div className="tip-ruler-zones" style={{ gridTemplateColumns: cols }} aria-hidden="true">{rule.zones.map(zone => <span key={zone}>{zone}</span>)}</div>
  </div>;
}

export function TrustList({ lines, ruleKey, scope }: { lines: TrustLine[]; ruleKey: string; scope: string }) {
  if (!lines.length) return <p className="tip-trust-none">{noTrustText(ruleKey)}</p>;
  return <>
    <ul className="tip-trust">{lines.map(line => <li key={line.when}>
      <span>{line.when} {line.then}</span>
      <span className="fv-num"><b>{pct(line.rate)}</b> <span className="tip-base">평소 {pct(line.base)}</span> <span className="tip-lift">{lift(line)}</span></span>
    </li>)}</ul>
    <p className="tip-foot">{scope}{lines[0].count != null && ` · 신호 ${formatNumber(lines.reduce((s, l) => s + (l.count ?? 0), 0))}번`}. ‘평소’는 신호가 없을 때도 그렇게 움직인 비율이에요.</p>
  </>;
}

/** 판단 기준 도움말 내용: 무엇을 보나 → 기준선 → 믿을 만한가요? */
export function RuleTipBody({ ruleKey, trust }: { ruleKey: string; trust: ReactNode }) {
  const rule = RULES[ruleKey];
  if (!rule) return null;
  return <>
    <p>{rule.what}</p>
    <RuleRuler rule={rule} />
    <p className="tip-rule"><b>판단 기준</b> {rule.rule}</p>
    {rule.note && <p className="tip-note">{rule.note}</p>}
    <div className="tip-trust-box"><p className="tip-sub">믿을 만한가요?</p>{trust}</div>
  </>;
}

/**
 * 지표 옆 (?) 도움말. 누르면 그 자리에 작은 창이 뜬다(다른 화면으로 가지 않는다).
 * 표·카드 안에서 잘리지 않게 body에 그리고, 버튼 아래에 붙인다(스크롤하면 따라 움직인다). Esc·바깥 누르기·닫기 버튼으로 닫힌다.
 */
export function InfoTip({ label, title, children, onOpen }: { label: string; title: string; children: ReactNode; onOpen?: () => void }) {
  const [open, setOpen] = useState(false);
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  /** 버튼 바로 아래에 붙인다. 화면 밖으로 나가지 않게 좌우를 맞춘다. */
  const place = useCallback(() => {
    const rect = button.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(360, window.innerWidth - 16);
    setAt({ top: rect.bottom + 8, left: Math.max(8, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - 8)) });
  }, []);
  const toggle = () => {
    if (open) return close();
    place(); setOpen(true); onOpen?.();
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { close(); button.current?.focus(); } };
    const onDown = (event: MouseEvent) => { if (!panel.current?.contains(event.target as Node) && !button.current?.contains(event.target as Node)) close(); };
    document.addEventListener("keydown", onKey); document.addEventListener("mousedown", onDown); window.addEventListener("scroll", place, { passive: true }); window.addEventListener("resize", place);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); window.removeEventListener("scroll", place); window.removeEventListener("resize", place); };
  }, [open, close, place]);
  return <>
    <button ref={button} type="button" className="info-tip" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={toggle}>
      <FvIcon name="help" size={16} />
    </button>
    {open && at && createPortal(<div ref={panel} id={id} role="dialog" aria-label={title} className="tip-panel" style={{ top: at.top, left: at.left }}>
      <div className="tip-head"><p className="tip-title">{title}</p><button type="button" className="tip-close" aria-label="닫기" onClick={() => { close(); button.current?.focus(); }}><FvIcon name="close" size={16} /></button></div>
      {children}
    </div>, document.body)}
  </>;
}

/** 지표 하나에 대한 도움말 버튼(카드·표 머리글 옆). cards가 있으면 그 카드의 검증을, loadCards가 있으면 열 때 받아 품목 합산 검증을 보여준다. */
export function RuleTip({ ruleKey, card, loadCards, scope }: { ruleKey: string; card?: IndicatorCard | null; loadCards?: () => Promise<IndicatorCard[]>; scope: string }) {
  const [pooled, setPooled] = useState<{ lines: TrustLine[] } | null | "loading">(null);
  const rule = RULES[ruleKey];
  const load = () => {
    if (!loadCards || pooled) return;
    setPooled("loading");
    loadCards().then(cards => setPooled({ lines: pooledTrust(cards.filter(c => c.key === ruleKey)) })).catch(() => setPooled({ lines: [] }));
  };
  if (!rule) return null;
  const trust = card !== undefined
    ? <TrustList lines={card ? trustOf(card) : []} ruleKey={ruleKey} scope={scope} />
    : pooled === "loading" || pooled === null ? <p className="tip-trust-none">과거 기록을 불러오는 중이에요.</p>
    : <TrustList lines={pooled.lines} ruleKey={ruleKey} scope={scope} />;
  return <InfoTip label={`${rule.name} 판단 기준`} title={`${josa(rule.name, "은", "는")} 이렇게 판단해요`} onOpen={load}>
    <RuleTipBody ruleKey={ruleKey} trust={trust} />
  </InfoTip>;
}
