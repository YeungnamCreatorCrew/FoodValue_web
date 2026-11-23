// 시세 품목 카드 이미지. WAS 품목 이름(또는 별칭) → public/images/items 의 정사각형 사진.
// DB ID는 환경(개인·공용 DB)마다 달라서 이름으로 연결한다. 출처: public/images/items/CREDITS.md
const imagesByName: Record<string, string> = {
  대파: "/images/items/green-onion.webp",
  양파: "/images/items/onion.webp",
  깐마늘: "/images/items/peeled-garlic.webp",
  마늘: "/images/items/peeled-garlic.webp",
  배추: "/images/items/napa-cabbage.webp",
  무: "/images/items/radish.webp",
};

/** "배추(월동)"처럼 괄호 설명이 붙은 이름도 기본 품목 사진을 쓴다. 없으면 null(기본 아이콘). */
export function itemImage(name: string, aliases: readonly string[] = []): string | null {
  for (const candidate of [name, ...aliases]) {
    const trimmed = candidate.trim();
    const found = imagesByName[trimmed] ?? imagesByName[trimmed.replace(/\s*\(.*\)\s*$/, "")];
    if (found) return found;
  }
  return null;
}
