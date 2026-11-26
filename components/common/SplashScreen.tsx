"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "fv-splash-seen";
const SHOW_MS = 1200;
const SHOW_MS_REDUCED = 600;
const LEAVE_MS = 700;

type Phase = "show" | "leave" | "done";

// 사이트를 처음 열 때(브라우저 탭 세션당 한 번) 화면 전체를 덮었다가 위로 걷히며 사라지는 시작 화면.
// 이미 본 세션이면 layout의 인라인 스크립트가 html[data-splash="off"]를 먼저 붙여 깜빡임 없이 숨긴다.
export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("show");

  useEffect(() => {
    // 이미 본 세션: CSS로 숨겨진 채 남아 있어도 화면에 영향이 없다.
    if (document.documentElement.dataset.splash === "off") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* 저장소를 못 쓰면 매번 보여 준다 */ }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const showMs = reduced ? SHOW_MS_REDUCED : SHOW_MS;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const leave = window.setTimeout(() => setPhase("leave"), showMs);
    const done = window.setTimeout(() => setPhase("done"), showMs + LEAVE_MS);
    const key = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === "Escape" || event.key === " ") setPhase((p) => (p === "show" ? "leave" : p));
    };
    window.addEventListener("keydown", key);
    return () => {
      window.clearTimeout(leave);
      window.clearTimeout(done);
      window.removeEventListener("keydown", key);
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (phase === "done") document.body.style.overflow = "";
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`splash${phase === "leave" ? " splash-leave" : ""}`}
      role="status"
      aria-label="FoodValue를 여는 중"
      onClick={() => setPhase((p) => (p === "show" ? "leave" : p))}
      onAnimationEnd={(event) => { if (event.animationName === "splash-out" || event.animationName === "splash-fade-out") setPhase("done"); }}
    >
      <div className="splash-progress" aria-hidden="true" />
      <svg className="splash-chart" viewBox="0 0 1440 400" preserveAspectRatio="none" aria-hidden="true">
        <path className="splash-chart-band" d="M1040 210 C1160 180 1300 150 1440 120 L1440 300 C1300 280 1160 250 1040 210 Z" />
        <path className="splash-chart-line" d="M0 300 C120 290 180 320 280 300 S440 250 540 270 S720 310 820 250 S960 220 1040 210" />
        <path className="splash-chart-forecast" d="M1040 210 C1160 200 1300 186 1440 176" />
      </svg>
      <div className="splash-brand">
        <svg className="splash-mark" viewBox="0 0 96 96" aria-hidden="true">
          <rect width="96" height="96" rx="26" fill="#ffffff" />
          <path className="splash-mark-line" d="M22 62 L40 44 L54 54 L74 32" stroke="#14532d" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle className="splash-mark-dot" cx="74" cy="32" r="7" fill="var(--fv-brand)" />
        </svg>
        <div>
          <p className="splash-word" aria-hidden="true">
            {"FoodValue".split("").map((char, index) => (
              <span key={index} style={{ animationDelay: `${0.35 + index * 0.035}s` }}>{char}</span>
            ))}
          </p>
          <p className="splash-tagline">장바구니 시세, 한눈에 보세요</p>
        </div>
      </div>
      <div className="splash-footer" aria-hidden="true">
        <span>KAMIS 시세 · 7일 가격 예측(참고)</span>
        <span className="splash-skip">클릭하거나 Enter를 누르면 바로 시작</span>
      </div>
    </div>
  );
}
