// 가짜 서버들(냉장고, 레시피)이 같이 쓰는 도구
// - 진짜 서버처럼 잠깐 기다려서 로딩 화면을 볼 수 있게 한다.
// - 주소 뒤에 ?mock=empty 를 붙이면 빈 목록, ?mock=error 를 붙이면 모든 호출이 실패한다.
import { ApiError } from "@/lib/api/error";

export type MockMode = "normal" | "empty" | "error";

const DELAY_MS = 400;

export function getMockMode(): MockMode {
  if (typeof window === "undefined") return "normal";
  const value = new URLSearchParams(window.location.search).get("mock");
  return value === "empty" || value === "error" ? value : "normal";
}

/** 지연을 흉내 내고, error 모드면 실패시킨다. LLM처럼 오래 걸리는 호출은 extraDelayMs로 더 기다린다. */
export async function simulateRequest(extraDelayMs = 0): Promise<MockMode> {
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS + extraDelayMs));
  const mode = getMockMode();
  if (mode === "error") {
    throw new ApiError(500, "서버에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
  }
  return mode;
}
