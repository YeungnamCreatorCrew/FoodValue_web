import { useEffect, useState } from "react";

/** 값이 바뀐 뒤 delayMs 동안 가만히 있으면 그때 값을 넘겨준다 (검색어를 칠 때마다 서버를 부르지 않으려고) */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
