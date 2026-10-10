# HOM-01 홈 구현

## 범위와 실행

- `/`는 인증 없이 열리는 홈입니다. Backend/API/DB 연결은 없습니다.
- `npm run dev` 후 `/`에서 비로그인 상태를 확인합니다.
- 개발 모드의 `/?mockAuth=member`에서 프로필, 보유 재료 8개, 부족 예상 2개와 개인 CTA를 확인합니다.
- mock 상태는 URL로만 선택하며 cookie/localStorage/JWT를 사용하지 않습니다. 운영 빌드에서는 해당 query를 무시합니다.

## 기존 코드 확인

작업 시작 시 `feature/home`에는 초기 Next.js 템플릿만 있었습니다. 공통 컴포넌트 및 시세·커뮤니티 화면이 없어 다른 브랜치의 `components/prices/ui.tsx`, `app/globals.css`, `components/community/ui.tsx`, `app/community/community.css`를 읽기 전용으로 확인했습니다. 기능 페이지를 복제하지 않았습니다.

- Primary `#14532d`, 본문 `#0f172a`, 보조 텍스트 `#64748b`, 테두리 `#e2e8f0`를 맞췄습니다.
- Pretendard 폰트 및 라이선스는 기존 `feature/prices`의 공용 정적 파일을 재사용합니다.
- 홈/냉장고/시세/레시피/커뮤니티의 기존 5개 메뉴 구성을 따릅니다.

## Figma 반영

[HOM-01 프레임](https://www.figma.com/design/ZfhfS2BlJxlazYa2Y8g38C?node-id=198-2551)을 Figma MCP의 디자인 컨텍스트와 스크린샷으로 확인했습니다.

- 390px 중앙 정렬, 56px 헤더, 좌우 16px 패딩, 22px 섹션 간격
- 262px 시세 카드, 48px 품목 이미지, 14px 카드 모서리, 가로 스크롤
- 21px 헤드라인, 17px 섹션 제목, 26px 가격, Pretendard 위계
- 10px 냉장고/커뮤니티 카드 모서리, 연한 초록색 레시피 카드
- 68px 고정 하단 메뉴와 safe-area, 최소 44px 클릭 영역

`public/figma/home/`의 에셋은 원본을 수정하지 않고 다운로드했습니다. 흙대파/양파/한우 이미지는 각각 `202:552`, `202:588`, `202:624` 슬롯, 냉장고 아이콘은 `198:2668`, 댓글 아이콘은 커뮤니티 댓글 수, 아바타는 `198:2557`, 5개 메뉴 아이콘은 `198:2745`의 슬롯에 대응합니다. SVG 원본 크기는 유지하고 필요한 경우 래퍼 안에서 비율을 맞춥니다. 임시 Figma URL을 런타임에서 사용하지 않습니다.

최종 명세에 따라 관심 품목, 알림, 좋아요, 상세 차트, 날짜 필터를 제외하고 인기글을 최신글로 변경했습니다. 로그인 CTA와 간단한 구매 가이드로 홈의 사용자 흐름을 구성했습니다.

## 파일과 데이터 연결

| 파일 | 역할 |
| --- | --- |
| `app/page.tsx` | mock 사용자 선택 및 홈 데이터 전달, 향후 API 연결 지점 |
| `app/layout.tsx`, `app/globals.css` | 한국어 메타데이터, 로컬 Pretendard, 공통 색상 토큰 |
| `components/home/home-screen.tsx` | 헤더, 냉장고, 레시피 진입, 최신글 및 로그인 상태별 CTA |
| `components/home/price-carousel.tsx` | 주요 품목 가격/예측과 카드 전환 |
| `components/home/figma-icon.tsx` | 로컬 Figma SVG와 원본 비율 |
| `components/layout/bottom-navigation.tsx` | 홈 활성화 및 공개/개인 기능 진입 |
| `lib/home/types.ts` | `HomePriceSummary`, `HomeFridgeSummary`, `HomeCommunityPost`, `HomeData`, `HomeUser` |
| `lib/home/mock.ts` | 고정 기준일 시세 3개, 로그인 시에만 제공하는 냉장고 요약, 최신순 게시글 3개 |
| `lib/home/routes.ts` | 기능 브랜치 통합 시 확인할 링크 경로 |

`app/page.tsx`의 `getMockHomeData()` 호출을 실제 데이터 로딩으로 교체하면 됩니다. `GET /api/v1/home`의 주요 시세와 냉장고 요약, 필요 시 `GET /api/v1/fridge/summary`, `GET /api/v1/posts?page=0&size=3`의 최신순 결과를 UI 타입에 매핑합니다. `HomeData`는 화면용 모델이며 아직 정해지지 않은 응답 필드를 서버 계약으로 가정하지 않습니다.

레시피 CTA는 화면 진입만 담당합니다. 향후 `POST /api/v1/recipes/generate`는 레시피 화면에서 사용자 입력을 받은 후 연결해야 합니다.

## 연결 대상의 현재 상태

`/auth/login`, `/prices`, `/community`, `/community/[id]`, `/fridge`, `/recipes`, `/mypage` 페이지는 현재 홈 브랜치에 없습니다. 의도된 링크만 지정했으며 이 브랜치 단독으로 이동하면 404가 표시됩니다. 관련 페이지, 인증 처리 또는 placeholder 페이지를 새로 만들지 않았습니다. 커뮤니티 공개 목록/상세의 실제 열람은 `feature/community` 통합 후 검증해야 합니다.

## 검증

- `npm run lint` 통과
- `npx next typegen` 후 `npx tsc --noEmit` 통과 (이전 브랜치의 생성 타입에 auth 라우트가 남아 있어 재생성 필요)
- `npm run build` 통과 (Next.js 16.3.8 / Turbopack)
- headless Chrome에서 비로그인/로그인 분기, 모든 CTA 경로, 홈 활성 탭, 3개 시세 카드 선택, 새로고침과 상태 초기화 확인
- 280/320/390/768/1440px 가로 넘침 없음, 중앙 정렬, 마지막 콘텐츠와 고정 메뉴 간 여백 확인
- 로컬 이미지 전체 로딩 및 렌더 크기, 런타임 오류 없음, `/api/v1/` 호출 없음 확인
- 390px 양쪽 상태의 스크린샷을 Figma와 비교

commit/push는 수행하지 않습니다.
