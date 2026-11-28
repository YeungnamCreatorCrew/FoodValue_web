// 시세 품목 카드 이미지. WAS 품목 이름(또는 별칭) → public/images/items 의 정사각형 사진.
// DB ID는 환경(개인·공용 DB)마다 달라서 이름으로 연결한다. 출처: public/images/items/CREDITS.md
const imagesByName: Record<string, string> = {
  대파: "/images/items/green-onion.webp",
  양파: "/images/items/onion.webp",
  깐마늘: "/images/items/peeled-garlic.webp",
  마늘: "/images/items/peeled-garlic.webp",
  배추: "/images/items/napa-cabbage.webp",
  무: "/images/items/radish.webp",
  양배추: "/images/items/cabbage.webp",
  시금치: "/images/items/spinach.webp",
  상추: "/images/items/lettuce.webp",
  청상추: "/images/items/lettuce.webp",
  오이: "/images/items/cucumber.webp",
  다다기오이: "/images/items/cucumber.webp",
  애호박: "/images/items/aehobak.webp",
  토마토: "/images/items/tomato.webp",
  당근: "/images/items/carrot.webp",
  청양고추: "/images/items/green-chili.webp",
  깻잎: "/images/items/perilla.webp",
  파프리카: "/images/items/bell-pepper.webp",
  감자: "/images/items/potato.webp",
  수미감자: "/images/items/potato.webp",
  고구마: "/images/items/sweet-potato.webp",
  밤고구마: "/images/items/sweet-potato.webp",
  방울토마토: "/images/items/cherry-tomato.webp",
  대추방울토마토: "/images/items/cherry-tomato.webp",
  사과: "/images/items/fuji-apple.webp",
  부사: "/images/items/fuji-apple.webp",
  후지사과: "/images/items/fuji-apple.webp",
  배: "/images/items/asian-pear.webp",
  신고배: "/images/items/asian-pear.webp",
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
