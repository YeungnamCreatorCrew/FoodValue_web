# 커뮤니티 기본 화면

## 실행 및 확인

`npm run dev` 실행 후 다음 경로를 확인합니다.

- `/community`: 카테고리, 제목·전체 본문 검색, 최신순, 페이지 처리, 이미지 존재 표시
- `/community/1`: 내 게시글과 내 댓글 수정·삭제
- `/community/4`: 이미지가 포함된 상세
- `/community/write`: 공통 글쓰기와 이미지 선택·미리보기·제거
- `/community/1/edit`: 기존 값을 채운 공통 수정 폼
- `/community/5`: 다른 사용자의 게시글 (수정·삭제 없음)
- `/community/5/edit`: 작성자가 아닌 경우 접근 안내

## 구현 파일

- `app/community/`: 네 개 경로, 커뮤니티 레이아웃, 범위가 제한된 CSS
- `components/community/`: 목록, 상세, 공통 작성·수정 폼, 댓글, App Bar·Bottom Navigation
- `lib/community/types.ts`: 공통 카테고리, 목록·상세·댓글 타입, 확인된 입력 제한
- `lib/community/mock-data.ts`: 예시 게시글·댓글과 mock currentUser
- `lib/community/mock-service.ts`: 메모리 상태, 검색·페이지 처리, 게시글·댓글 CRUD, 작성자 검사
- `lib/community/images.ts`: 이미지 검증 및 mock 미리보기 준비
- `public/community/`: Figma에서 받은 아이콘과 상세 예시 이미지
- `public/fonts/`: Pretendard Variable 및 OFL 라이선스
- `scripts/check-community.mjs`: 실제 브라우저 기반 흐름 검수

기존 루트 화면, 레이아웃, 글로벌 스타일은 수정하지 않았습니다. 이 브랜치에는 기존 FoodValue 공통 UI와 시세 경로가 없으므로 공통 UI를 새로 구성했습니다. 아직 없는 냉장고·시세·레시피 메뉴는 준비 중 상태이며 404로 이동시키지 않습니다.

## Mock 범위 및 API 전환

실제 HTTP 요청, JWT 인증, 업로드, DB 접근, Next.js API Route는 없습니다. 변경사항은 클라이언트 메모리에만 존재하며, 화면 이동 중 유지되고 전체 새로고침하면 초기화됩니다. `currentUser`는 `오늘도집밥`입니다.

목록 서비스 결과에는 `id`, `category`, `title`, `contentPreview`, `author`, `createdAt`, `commentCount`, `hasImage`만 있습니다. `imageUrls`는 상세에만 있으며 목록별 추가 상세 호출은 없습니다. 검색은 preview로 자르기 전 전체 본문을 대상으로 합니다. 카테고리별 전용 필드는 없습니다.

실제 연결 시 다음 어댑터를 교체합니다.

1. `mock-service.ts` 조회/변경 메서드를 명세의 `/api/v1/posts`, `/api/v1/posts/{id}`, `/api/v1/posts/{id}/comments`, `/api/v1/comments/{id}` 요청으로 교체합니다. 서버의 페이지 처리와 댓글 수를 사용합니다.
2. `prepareMockImage`의 FileReader 처리를 `POST /api/v1/images`의 multipart `file` 업로드로 교체하고 반환 URL을 `PostInput.imageUrls`에 넣습니다. 현재 data URL은 서버에 전송하지 않습니다.
3. mock currentUser를 실제 인증 사용자로 교체합니다. 비로그인 조회, 쓰기 JWT, 서버의 소유자 검증 및 실패 응답을 연결합니다.
4. 이 저장소에는 Backend 소스/응답 DTO가 없습니다. 사용자 제공 계약과 ERD를 기준으로 구성했으며, `author` 내부의 `{ id, nickname }` 및 목록의 `{ items, total, page, pageCount }`는 mock UI용 표현입니다. 실제 DTO의 작성자 필드와 페이지 응답 envelope를 확인해 매핑해야 합니다. 새 API 계약을 제안한 것이 아닙니다.

본문 10,000자, 댓글 1,000자, 이미지 PNG/JPEG/GIF/WEBP 및 파일당 5MB를 검증합니다. 제목과 본문은 공백만 입력할 수 없습니다. 제목 길이·사진 장수 등 확정되지 않은 제한은 추가하지 않았습니다.

## Figma 적용

참고 프레임: `252:575`, `255:635`, `261:743` (파일 `ZfhfS2BlJxlazYa2Y8g38C`). Pretendard, primary `#14532d`, 16px 좌우 여백, 흰색 App Bar, 카드·입력 테두리 및 radius, 하단 내비게이션을 적용했습니다. 390px 모바일 1열, 큰 화면 최대 480px 중앙 정렬입니다.

계약에 따라 좋아요·저장·공유·답글·인기순·동네 필터·모집 상태/참여·결제·채팅·지도·실시간 알림·구조화된 레시피/모집 전용 필드·AI 연동을 제외했습니다. 목록 사진은 `hasImage` 표시로 변경했습니다. 이미지 첨부는 모든 카테고리에서 선택 사항입니다.

## 검증

- ESLint 및 TypeScript 통과
- 프로덕션 빌드 통과 (기존 루트의 Google Fonts 다운로드를 위한 네트워크 접근 필요)
- Chrome headless에서 목록/필터/검색/페이지 처리, 글·댓글 CRUD, 작성자 권한, 없는 글, 파일 형식/크기 제한 및 미리보기/제거 확인
- 320px, 390px, 1440px 가로 overflow 없음; Pretendard 로딩, 이미지 디코딩, 브라우저 오류 없음, Backend 요청 없음 확인
- 390px 목록·상세·글쓰기·수정 화면 캡처 검수

브라우저 검수 스크립트는 Playwright와 Chrome이 있는 환경에서 `node scripts/check-community.mjs`로 실행합니다. 외부 Playwright 설치를 사용할 때 `PLAYWRIGHT_MODULE`에 해당 `index.mjs`의 file URL을 지정할 수 있습니다. 캡처는 git 제외 경로 `node_modules/.cache/community-qa/`에 저장합니다.

커밋과 push는 수행하지 않았습니다.
