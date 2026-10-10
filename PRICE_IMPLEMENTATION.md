# 시세 화면 구현 범위

## 판단 기준

- UI: Figma PRC-01 `134:859`, PRC-02 `171:3313`.
- 현재 FE 규칙: `docs/FE_구현규칙.md`. 390px Mobile First이며, 초기 기획의 PC 1440px·상단 GNB 규칙은 적용하지 않는다.
- 기능 참고: `docs/AI 식자재 관리 서비스 화면명세서.md`, `docs/AI 스마트 냉장고 비서 기술명세서.md`.
- 지원 여부: 실제 파일명 `docs/FoodValue_ERD___API_명세.md`의 1단계 ERD/API 우선.
- 현재 모든 데이터는 고정 샘플이다. 모델 실행, KAMIS 수집, 인증 및 실제 HTTP 요청은 하지 않는다.

## 구현 기능과 API 대응

| 기능 | 명세의 엔드포인트 (base `/api/v1`) |
| --- | --- |
| 품목명·별칭 검색, 카테고리, 정렬, 페이지 처리 | `GET /prices?category=&keyword=&sort=&page=&size=` |
| 현재가·전주 등락·7일 예상가·구매 가이드·결정 요인 | `GET /prices/{itemId}` |
| 과거 14/30/90일 차트·7일 예측·95% 구간·툴팁 | `GET /prices/{itemId}/chart?period=` |
| 지역 가격 2줄 요약·전국 대비 차액·전체보기 대화상자 | `GET /prices/{itemId}/regions` |

PRC-02는 품목 정보 → 현재가·전주 등락·7일 예상가 → AI 구매 가이드 → 차트 → AI 가격 결정 요인 → 지역 가격 요약 순서로 구성한다. 지역 가격은 최저 지역과 전국 대비 차액을 보조 정보로 표시하며, 전체 목록은 작은 대화상자에서 확인한다. 별도 지역 상세 페이지는 없다.

레시피 추천과 냉장고 보유량은 API 지원 여부와 별개로 이번 PRC-02의 가격 분석·구매 판단 흐름에서 제외한다. `POST /recipes/recommendations`를 위한 UI와 PRC-02 전용 추천 타입·mock·로딩은 제거했다. 공통 컴포넌트와 원본 Figma 에셋은 유지한다.

## 제외 기능

| 제외 | 이유 |
| --- | --- |
| 관심 품목 등록·해제·필터 | `favorite_item` 및 관련 API는 2단계 |
| 가격 알림·최저가 알림·알림 패널·토글 동작 | 1단계에 가격 알림 API 없음 |
| 공유 | 명세에 없음 |
| 평균 소비주기·소진 예정일 | 시세 요약 API에 계산 결과가 정의되지 않음 |
| 근처 마트·위치 기반 최저가·참가격 연동 | 1단계는 `price_daily.region` 지역 평균만 제공 |
| 실시간 시세·실측 MAPE 주장 | 배치 조회 모델이며 현재 mock만 제공 |
| 별도 환율·동네 체감 요인 | 요인은 `WEATHER`, `PRODUCTION`, `EVENT`, `SEASONAL`, `TREND`로 제한 |

다른 화면은 초기 프로젝트에 아직 없다. 공통 내비게이션의 해당 항목은 준비 중으로 비활성 처리한다.

요청된 Figma 슬롯을 맞추기 위해 헤더 알림, 검색 옆 관심 필터, 카드 관심 아이콘, 상세 App Bar의 관심·공유 아이콘은 비활성 상태로 표시한다. 선택 상태, localStorage 저장, 관심 필터링, 알림 패널, 공유 실행 등 지원되지 않는 동작은 구현하지 않는다.

## 컴포넌트

- 공통: FigmaIcon, PriceNavigation, SectionTitle, SampleNotice, PriceChange, RecommendationBadge, UnsupportedAction.
- 목록: PriceList, PriceCard, 데이터로 그리는 Sparkline, 검색·카테고리·정렬·페이지 UI.
- 상세: PriceDetail, PriceChart, 구매 가이드·요인 UI, RegionPriceSummary.
- 상태: loading, error, not-found, 검색 빈 결과·지역 가격 빈 결과.

## Mock와 연결 준비

`lib/prices/types.ts`는 **프론트 내부 view model**이다. API 문서에는 JSON 응답 스키마, 정렬 enum, 페이지 번호 기준이 없으므로 실제 서버 계약으로 확정한 것이 아니다. `PricesDataSource` 구현을 교체하면서 실제 응답을 변환해야 한다. 새 API route나 DB 테이블은 추가하지 않았다.

- 샘플 기준일: 2026-10-06. 품목 13개, 별칭, API category 값, 가격 단위.
- 품목별 과거 90일 + 오늘, D+1~D+7 가격·하한·상한, 5개 지역 가격.
- 구매 상태 4종, 권장 시점·절약액·MAPE·요인 기여도.
- API 요약의 보유량 view model과 샘플은 유지하지만 PRC-02에는 표시하지 않는다.
- Figma 대파 구매 안내가 목록과 상세에서 다르므로 상세의 `BUY_LATER`, 3일 뒤 450원 절약으로 통일했다. 예측은 3일 뒤 2,800원, 7일 뒤 3,450원이다.
- MAPE 3.8%는 샘플 오차로만 표시하며, Figma의 별도 ±4.2% 값으로 신뢰구간을 계산하지 않는다.
- 차트와 스파크라인은 데이터 기반 SVG. Figma 차트의 고정 경로 이미지는 데이터 그래프에 사용하지 않는다.
- 모든 화면 폭에서 최대 390px 콘텐츠를 중앙에 배치한다. 목록은 1열, 상세는 위에서 아래로 이어지는 단일 열이다. PC 상단 GNB·3열 목록·2열 상세를 제거했다.
- Bottom Navigation은 중앙 모바일 콘텐츠와 같은 너비로 화면 하단에 고정하며, safe area를 반영한다.
- 차트는 실제 가격(회색 실선), AI 예측(초록 점선), 95% 구간(초록 음영), 오늘 D-Day(주황 점선), 현재가·7일 후 예상가 말풍선을 구분한다.
- Figma 원본 에셋은 `public/figma/prices`, 폰트와 라이선스는 `public/fonts`에 보관한다.

## 로컬 확인

`npm run dev` 후 `/prices`, `/prices/1`에서 확인한다. `/`는 `/prices`로 이동한다.

검증 항목: ESLint, TypeScript, 390px 렌더링, 넓은 화면의 390px 중앙 배치·1열 목록·하단 내비게이션, 검색·별칭·정렬·차트 기간 선택, 이미지·폰트 로딩, 가로 넘침. 임시 headless 검증 도구·스크린샷은 Git에서 제외되는 `.next/qa`에 둔다.
