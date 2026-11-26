/**
 * 보기 좋은 세로축(1·2·5 단위). 눈금이 데이터 범위를 감싸도록 축의 위아래를 눈금에 맞춘다.
 * 반환한 min·max를 그래프 축 범위로 쓰면 맨 아래·맨 위 선이 눈금이 된다. 음수 가격은 floor로 막는다.
 */
export function niceScale(low: number, high: number, target = 4, floor = -Infinity) {
  let lo = low, hi = high;
  if (!(hi > lo)) { const pad = Math.max(Math.abs(hi) * 0.05, 1); lo -= pad; hi += pad; }
  const raw = (hi - lo) / target;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map(n => n * power).find(n => n >= raw) ?? raw;
  const min = Math.max(floor, Math.floor(lo / step) * step), max = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let value = min; value <= max + step * 1e-6; value += step) ticks.push(Number(value.toFixed(6)));
  return { min, max, ticks };
}

