"use client";

import { useEffect, useState } from "react";
import { BrushWriting } from "./brush-writing";

const SEEN_KEY = "siknal-brush-splash-seen-v3";
const SHOW_MS = 3600;
const SHOW_MS_REDUCED = 600;
const LEAVE_MS = 550;

type Phase = "show" | "leave" | "done";

// 사이트를 처음 열 때(브라우저 탭 세션당 한 번) 화면 전체를 덮었다가 위로 걷히며 사라지는 시작 화면.
// 이미 본 세션이면 layout의 인라인 스크립트가 html[data-splash="off"]를 먼저 붙여 깜빡임 없이 숨긴다.
export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("show");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // SVG image load events may finish before React hydrates (especially from cache).
    // An HTML image loader with an explicit complete check handles both cases.
    const image = new window.Image();
    const loaded = () => setReady(true);
    const failed = () => setPhase("leave");
    image.onload = loaded;
    image.onerror = failed;
    image.src = "/brand/siknal-brush-v1.png";
    if (image.complete) {
      if (image.naturalWidth > 0) loaded();
      else failed();
    }
    return () => { image.onload = null; image.onerror = null; };
  }, []);

  useEffect(() => {
    // 이미 본 세션: CSS로 숨겨진 채 남아 있어도 화면에 영향이 없다.
    if (document.documentElement.dataset.splash === "off") return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  useEffect(() => {
    if (!ready || phase !== "show") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setPhase("leave"), reduced ? SHOW_MS_REDUCED : SHOW_MS);
    return () => window.clearTimeout(timer);
  }, [ready, phase]);

  useEffect(() => {
    if (phase !== "leave") return;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch { /* 저장소는 선택 사항 */ }
    const timer = window.setTimeout(() => setPhase("done"), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => setPhase(p => p === "show" ? "leave" : p), 4000);
    return () => window.clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (phase === "done") document.body.style.overflow = "";
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`splash${ready ? " splash-writing" : ""}${phase === "leave" ? " splash-leave" : ""}`}
      role="status"
      aria-label="붓으로 식널을 쓰며 시작합니다"
    >
      <div className="splash-brand">
        <div>
          <BrushWriting />
          <p className="splash-tagline">식자재, 살 때를 알다.</p>
        </div>
      </div>
    </div>
  );
}
