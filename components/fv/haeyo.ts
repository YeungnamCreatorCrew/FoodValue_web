/** 서버 문장의 끝맺음만 해요체로 맞춘다(뜻은 바꾸지 않는다). 상세 화면에서만 쓰여 홈 JS에 들어가지 않게 따로 둔다. */
const hasBatchim = (char: string) => {
  const code = char.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

const ENDINGS: [RegExp, string][] = [
  [/되었습니다/g, "됐어요"], [/하였습니다/g, "했어요"], [/했습니다/g, "했어요"], [/않습니다/g, "않아요"], [/없습니다/g, "없어요"],
  [/있습니다/g, "있어요"], [/보입니다/g, "보여요"], [/됩니다/g, "돼요"], [/합니다/g, "해요"], [/줍니다/g, "줘요"],
];

/** "…싼 편입니다." → "…싼 편이에요." 서버 요약·AI 요약 문장의 끝맺음만 바꾼다. */
export function toHaeyo(text: string) {
  let result = text;
  for (const [pattern, next] of ENDINGS) result = result.replace(pattern, next);
  return result.replace(/([가-힣])입니다/g, (_, char: string) => char + (hasBatchim(char) ? "이에요" : "예요"));
}

