// 단위에 따른 도우미들
import type { Unit } from "@/types/fridge";

/** 단위 자체가 무게·부피인 단위. 이 외(개, 단, 모 ...)는 "개수 단위"라서 1개당 무게(gramsPerUnit)가 영양 계산에 필요하다. */
const MEASURE_UNITS: Unit[] = ["g", "kg", "ml", "L"];

export function isCountUnit(unit: Unit): boolean {
  return !MEASURE_UNITS.includes(unit);
}

/** [-] [+] 버튼이 한 번에 바꾸는 양. [확인 필요] 피그마에 값이 없어서 단위별로 임시로 정했다. */
export function stepOf(unit: Unit): number {
  switch (unit) {
    case "g":
    case "ml":
      return 10;
    case "kg":
    case "L":
      return 0.1;
    case "단":
    case "모":
    case "송이":
      return 0.5;
    default:
      return 1; // 개, 팩, 봉, 구
  }
}
