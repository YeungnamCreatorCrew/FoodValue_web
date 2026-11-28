"use client";

import { useId, type CSSProperties } from "react";

// Follow the strokes in the original 1536 × 1024 logo, preserving its ink edges.
const STROKES = [
  ["M588 72 Q555 161 502 240 Q419 352 332 424", 108, 150, 420],
  ["M565 150 Q690 294 928 386", 116, 530, 380],
  ["M562 275 L604 309", 82, 920, 140],
  ["M506 389 Q503 545 495 676 L478 748 L571 688", 106, 1090, 360],
  ["M510 386 Q575 354 656 358 L647 487 L520 548", 102, 1460, 300],
  ["M551 458 L641 423", 67, 1740, 150],
  ["M697 535 Q665 580 580 606", 94, 1900, 190],
  ["M566 581 Q663 632 750 730", 108, 2090, 230],
  ["M888 580 Q871 651 887 706 L972 677", 66, 2380, 230],
  ["M956 614 L1065 579", 48, 2600, 140],
  ["M1094 530 L1074 649", 45, 2750, 160],
  ["M1028 724 Q1140 668 1090 748 L1042 801 L1104 788 Q1141 768 1105 823 L1063 891 L1190 839", 66, 2910, 350],
] as const;

export function BrushWriting() {
  const id = useId().replace(/:/g, "");
  return <svg className="splash-calligraphy" viewBox="0 0 1536 1024" aria-hidden="true">
    <defs>
      {/* Separate black and red ink from the white background at render time. */}
      <filter id={`${id}-ink`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" values="0 0 0 0 .06  0 0 0 0 .06  0 0 0 0 .06  -6 0 0 0 2" />
      </filter>
      <filter id={`${id}-red`} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feColorMatrix type="matrix" values="0 0 0 0 .65  0 0 0 0 .24  0 0 0 0 .20  2 -2 0 0 0" />
      </filter>
      <mask id={`${id}-writing`} maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024" style={{ maskType: "luminance" }}>
        {STROKES.map(([d, width, at, ms], i) => <path key={i} d={d} pathLength="1" strokeWidth={width} className="splash-ink-stroke" style={{ "--stroke-at": `${at}ms`, "--stroke-ms": `${ms}ms` } as CSSProperties} />)}
      </mask>
      <mask id={`${id}-signal`} maskUnits="userSpaceOnUse" x="0" y="0" width="1536" height="1024" style={{ maskType: "luminance" }}>
        <path d="M280 891 C690 1050 885 632 1340 573" pathLength="1" strokeWidth="115" className="splash-ink-stroke" style={{ "--stroke-at": "3320ms", "--stroke-ms": "530ms" } as CSSProperties} />
      </mask>
    </defs>
    <image href="/brand/siknal-brush-v1.png" width="1536" height="1024" filter={`url(#${id}-ink)`} mask={`url(#${id}-writing)`} />
    <image href="/brand/siknal-brush-v1.png" width="1536" height="1024" filter={`url(#${id}-red)`} mask={`url(#${id}-signal)`} />
    <image className="splash-finished-logo" href="/brand/siknal-brush-v1.png" width="1536" height="1024" />
  </svg>;
}
