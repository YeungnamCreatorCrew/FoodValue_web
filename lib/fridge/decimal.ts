// 수량 계산 도구. 서버가 수량을 "0.5" 같은 문자열(소수 3자리까지)로 주고받기 때문에,
// 0.1 + 0.2 같은 계산 오차를 피하려고 1000배 한 정수로 바꿔서 계산한다.
import type { Decimal } from "@/types/fridge";

/** "0.8" → 800 */
export function toMilli(value: Decimal): number {
  return Math.round(Number(value) * 1000);
}

/** 800 → "0.8" */
export function fromMilli(milli: number): Decimal {
  return String(milli / 1000);
}
