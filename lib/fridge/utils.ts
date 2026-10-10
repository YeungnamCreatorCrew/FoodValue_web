// 냉장고 화면에서 쓰는 작은 계산·표시 함수들
import type { FridgeItem, ItemCategory, StorageType, UsageReason } from "@/types/fridge";

export const STORAGE_LABEL: Record<StorageType, string> = {
  FRIDGE: "냉장",
  FREEZER: "냉동",
  ROOM: "실온",
};

export const USAGE_REASON_LABEL: Record<UsageReason, string> = {
  USE: "사용",
  FINISH: "다 먹음",
  DISCARD: "폐기",
};

/** "2026-09-28" → "9/28" (사용 기록용) */
export function formatShortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

// [확인 필요] 곡류·기타 표기는 피그마에 없어서 임시로 정했다 (채소류·과일류·축산물·수산물은 피그마 기준)
export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  VEGETABLE: "채소류",
  GRAIN: "곡류",
  FRUIT: "과일류",
  MEAT: "축산물",
  SEAFOOD: "수산물",
  ETC: "기타",
};

/** 남은 양 비율 (0~1). 서버가 문자열로 주므로 숫자로 바꿔 계산한다. */
export function remainingRatio(item: Pick<FridgeItem, "quantity" | "initialQuantity">): number {
  const initial = Number(item.initialQuantity);
  if (!(initial > 0)) return 0;
  return Math.min(Math.max(Number(item.quantity) / initial, 0), 1);
}

/** 화면에 보이는 % (소수점은 버림: 55.5% → 55%) */
export function remainingPercent(item: Pick<FridgeItem, "quantity" | "initialQuantity">): number {
  return Math.floor(remainingRatio(item) * 100 + 1e-9);
}

/** "180g", "1모" 처럼 수량과 단위를 붙여서 보여 준다. "180.000" 같은 뒷자리 0은 지운다. */
export function formatQuantity(item: Pick<FridgeItem, "quantity" | "unit">): string {
  return `${Number(item.quantity)}${item.unit}`;
}

/** 이름 뒤에 알맞은 조사를 붙인다: "대파" → "대파를", "냉동 닭가슴살" → "냉동 닭가슴살을" */
export function withObjectParticle(word: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinalConsonant = isHangul && (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? "을" : "를"}`;
}

/** 이름 뒤에 알맞은 조사를 붙인다: "단백질" → "단백질이", "철" → "철이", "비타민" → "비타민이" (받침 없으면 "가") */
export function withSubjectParticle(word: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinalConsonant = isHangul && (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? "이" : "가"}`;
}

/** 이름 뒤에 은/는을 붙인다: "지방" → "지방은", "나트륨" → "나트륨은", "철분" → "철분은", "비타민" → "비타민은" (받침 없으면 "는") */
export function withTopicParticle(word: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const hasFinalConsonant = isHangul && (code - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? "은" : "는"}`;
}

/** 이름 뒤에 으로/로를 붙인다: "계란" → "계란으로", "두부" → "두부로", "대파, 계란" → "대파, 계란으로" (ㄹ 받침은 "로") */
export function withMeansParticle(word: string): string {
  const code = word.trim().charCodeAt(word.trim().length - 1);
  const isHangul = code >= 0xac00 && code <= 0xd7a3;
  const finalIndex = isHangul ? (code - 0xac00) % 28 : 0;
  const useEu = finalIndex !== 0 && finalIndex !== 8; // 받침이 있고 ㄹ이 아니면 "으로"
  return `${word}${useEu ? "으로" : "로"}`;
}

/** "2026-09-28" → "09.28" */
export function formatPurchaseDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${month}.${day}`;
}
