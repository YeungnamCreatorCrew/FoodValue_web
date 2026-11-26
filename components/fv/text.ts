/** 화면 문구 도구. 서버 문장은 뜻을 바꾸지 않고 끝맺음만 해요체로 맞춘다. */

const hasBatchim = (char: string) => {
  const code = char.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
};

/** 이름 뒤 조사: josa("소매가", "은", "는") → "소매가는". 한글이 아니면 "은(는)". */
export function josa(word: string, withBatchim: string, without: string) {
  // 괄호 덧말("12,150원(1kg)")은 건너뛰고 본말의 끝 글자로 고른다. 로/으로는 ㄹ받침이면 '로'.
  const last = word.trim().replace(/\([^)]*\)$/, "").at(-1) ?? "";
  if (/[0-9]/.test(last)) {
    // 숫자 읽기: 영·일·삼·육·칠·팔은 받침, 일·칠·팔은 ㄹ받침
    const rieul = "178".includes(last), batchim = "013678".includes(last);
    if (withBatchim === "으로") return word + (batchim && !rieul ? withBatchim : without);
    return word + (batchim ? withBatchim : without);
  }
  if (last === "%" || last === "C") return word + (withBatchim === "으로" ? without : without);
  if (!/[가-힣]/.test(last)) return `${word}${withBatchim}(${without})`;
  if (withBatchim === "으로" && (last.charCodeAt(0) - 0xac00) % 28 === 8) return word + without;
  return word + (hasBatchim(last) ? withBatchim : without);
}

/** 화면에 보이는 지표 이름. 서버 라벨과 상관없이 세 화면이 같은 말을 쓴다. */
export const SIGNAL_LABEL: Record<string, string> = { PRICE_POSITION: "1년 중 위치", SEASONAL: "평년 대비", WHOLESALE_LEAD: "도매 흐름" };

/** 오류 안내. 상태 코드 같은 기술 정보는 보여주지 않는다. */
export function friendlyError(message: string | undefined) {
  if (message?.includes("찾을 수 없")) return "품목을 찾을 수 없어요. 주소를 확인해 주세요.";
  return "가격 정보를 받지 못했어요. 잠시 뒤 다시 시도해 주세요.";
}
