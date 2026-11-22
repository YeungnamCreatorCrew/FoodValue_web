# 가격 API 시험 연동

## 연결 범위와 계약

`C:\FoodValue_was`의 `app/routers/prices.py`, `app/schemas/price.py`,
`app/schemas/common.py`, 가격 service/repository를 읽고 맞췄다. 백엔드는 수정하지 않는다.
응답은 camelCase, query는 아래 이름을 그대로 사용한다. 가격 조회는 비로그인 가능하며
이번 프론트 요청은 소매(`market=RETAIL`)로 통일한다.

| GET 경로 | 사용 파라미터 / 응답 |
| --- | --- |
| `/api/v1/prices/items` | `keyword`(최대 50자), `category`, `sort`, `page`(1부터), `size`(최대 50), `market`. `{items,page,size,total}` |
| `/api/v1/prices/items/{item_id}` | `market`. `{item,forecast,guide,fridge}` 중 가격·예측·가이드만 사용 |
| `/api/v1/prices/items/{item_id}/history` | `days=14/30/90/180/365`(180·365는 WAS `feature/history-long-periods`에서 추가), `market`. `{points:[{date,price}],startDate,endDate,...}` |
| `/api/v1/prices/items/{item_id}/forecast` | `market`. `{points:[{targetDate,predictedPrice,lowerPrice,upperPrice}],...}` |
| `/api/v1/prices/items/{item_id}/factors` | `market`. 7일 후 예측의 변수별 SHAP 기여(원)·분류 합계·서버 문장. `{explained,unavailableReason,factors,categories,summary,...}` |
| `/api/v1/prices/items/{item_id}/factors/{factorId}/history` | `days=90`(한 번 받아 14/30일은 화면에서 자름), `market`. `{points:[{date,value}],unit,baseDate}` |

카테고리: `VEGETABLE/GRAIN/FRUIT/MEAT/SEAFOOD/ETC`.
UI의 `ALL`은 query에서 생략한다. 검색 `q`는 API에서 `keyword`로,
정렬 `price-drop/forecast-drop/name`은 `change/forecast/name`으로 변환한다.
`WHOLESALE`도 백엔드 계약에는 있지만 이번 UI에는 추가하지 않는다.

현재가·주간 변화율·예측 요약·가격 날짜·예측 기준일/목표일·단위·품질은 nullable이다.
이력 `price: null`은 그대로 보존하고 차트의 실선을 끊는다. 예측 상하한도 null을 유지한다.
상세 가이드는 서버의 `recommendation`, `buyAfterDays`, `expectedSaving`, `mape`를 변환하며
가격 방향으로 구매 추천을 다시 계산하지 않는다. `guide.factors`는 관측값 요약이라 SHAP으로 쓰지 않는다.

## 예측 요인(SHAP)과 AI 요약

- 상세 "예측에 영향을 준 요인"과 홈 AI INSIGHT는 `/factors`를 쓴다(`components/prices/shap-factors.tsx`, `lib/prices/shap.ts`).
  요인은 서버 순서(기여 절댓값 순) 그대로, 상위 8개를 먼저 보이고 나머지는 "더 보기". 분류 필터는 응답에 있는 분류(가격·날씨·달력·계절·생산량·환율)만.
- 요인을 펼치면 `/factors/{id}/history`를 한 번(90일) 받아 14/30/90일을 화면에서 자른다. 값이 없는 날은 선을 만들지 않는다.
  `hasHistory=false`(예측 대상일의 계절)는 추이를 그리지 않는다.
- `explained=false`(학습 모델이 기준 모델을 이기지 못해 기준 모델로 공개, 예측 없음 등)면 기존 `guide.factors` 관측값 카드를 보여준다.
- AI 예측 요약은 상세 응답의 `summary.headline`(서버 고정 문장)과 `summary.detail`(Gemini가 다듬은 요인 요약, 숫자 없음)을 쓰고,
  `summary`가 없을 때만 화면에서 숫자로 문장을 만든다. 분류별 설명은 `categories[].description` → `summary.categories` → 고정 문장 순.
- SHAP은 모델 예측에 대한 기여이며 인과관계가 아니라는 안내를 유지한다.

## 판단 보조 지표 카드 (프로토타입, 계약 초안)

가격 예측이 직전 가격 유지(naive)를 안정적으로 이기지 못해, 상세 화면의 메인을 "데이터로 검증된 근거"로 바꿨다.
기존 7일 예측(`/forecast`)과 요인(`/factors`)은 아래 "모델 의견"으로 그대로 둔다.
디자인 참고: 대파 프로토타입(https://claude.ai/artifact/WaxwFErFMB83aUWeggUcWr). 구성과 문구만 따르고 스타일은 기존 가격 화면에 맞췄다.

### 계약 초안 (팀 합의 전, 필드 이름 바뀔 수 있음)

`GET /api/v1/prices/items/{item_id}/indicators?market=RETAIL` (camelCase)

| 필드 | 의미 |
| --- | --- |
| `asOfDate` | 지표 기준일. 화면 제목 옆에 표시(현재가 기준일과 다를 수 있다) |
| `unavailableReason` | 카드가 없을 때 보여줄 서버 문장. `cards: []`와 함께 온다 |
| `summary.headline` / `summary.signals[]` | 한 줄 요약과 칩. 칩 문구(`stateLabel`)는 카드 머리 칩에도 같은 `key`로 쓴다 |
| `cards[].key` | `SEASONAL` / `WHOLESALE_LEAD` / `HARVEST_WEATHER` / `ARRIVALS`. 모르는 key는 건너뛴다 |
| `cards[].state` | `UP`(상승 압력, Red) / `NEUTRAL`(Gray) / `DOWN`(하락 압력·싼 편, Blue) / `null`(방향 없음) |
| `cards[].verdict` | `FACT`(사실) / `PASS`(검증된 근거) / `CONDITIONAL`(조건부 · 추가 확인 필요) / `WEAK`(참고 사실, 방향 없음 — state가 와도 무시) |
| `cards[].fact` / `evidence` | 숫자 근거. 비율은 소수(`-0.149` = -14.9%) |
| `cards[].chart` | `SEASONAL_OVERLAY`(연도별 주차 1~52 소매가) / `INDEXED_LINES`(최근 26주 도매·소매 지수, 기준일=100). 모르는 type이면 차트 없이 카드만 |

- 계층: `dto.ts`(`PriceIndicatorsDto`, key·state·type은 string) → `mapper.ts`의 `mapIndicators`(필드 이름은 여기서만 읽는다) → `model.ts`(`PriceIndicators`) → `service.getPriceIndicators` → `usePriceIndicators`.
- 실제 API가 생기면 `api.ts`의 `pricesApi.indicators` 본문만 `get<PriceIndicatorsDto>(`${itemPath(id)}/indicators`, marketParams(), signal)`로 바꾼다.
  mock은 함수 안에서 동적 import 하므로 서버 번들과 `scripts/check-prices.mjs`에 섞이지 않는다.

### mock 사용법

- `mocks/priceIndicatorsServer.ts`가 응답을 만든다. 대파(id 60)는 위 계약의 숫자, 차트 원자료는 `mocks/priceIndicatorsData.ts`(프로토타입 스냅샷, 비어 있는 주차는 비워 둠).
- 대파 외 품목: `unavailableReason: "이 품목은 아직 지표를 준비 중입니다"`, `cards: []`.
- `?mock=empty`: `cards: []` + unavailableReason. `?mock=error`: 호출 실패 → 기존 가격 화면의 오류 + "다시 시도".
- 예: `http://localhost:3000/prices/60?mock=empty`

### 화면 규칙

- 상세 순서(결론 먼저): 상단 히어로 카드에 상품·현재가와 한 줄 요약·칩을 함께 둔다 → 바로 아래 탭으로 "판단 근거"(기본) / "모델 의견"을 전환한다.
  탭은 `role="tablist"`이고 좌우 화살표·Home·End로 옮겨 다닌다. 칩은 해당 카드가 있으면 판단 근거 탭으로 바꾼 뒤 그 카드로 이동한다.
  모델 의견 탭은 참고용 안내와 기준값 안내, 그 아래 예상가·방향·구매 가이드, 예측 차트, AI 예측 요약, 요인 패널을 펼쳐 보여주며,
  처음 선택할 때 그린다(그때 차트·`/factors` 요청).
- 요약 아래 고정 안내: "예측이 아니라 지금 상황을 정리한 것입니다. 판단은 직접 내려 주세요."
- 칩 색과 문장은 서버 state를 그대로 쓴다. 화면에서 가격으로 방향을 다시 계산하지 않는다. 근거 문장은 숫자 필드로만 만든다
  (예: "도매가가 2주 새 5% 넘게 오른 뒤 2주 안에 소매가가 오른 경우 72% (평소 44%, 193번)").
- 차트 선 색은 상승/하락색(Red/Blue)을 피해 브랜드 초록(올해·소매)과 갈색(도매)·회색(평균·지난 해)을 쓴다.
  SEASONAL: 올해 굵은 선, 직전 5년(`fact.normalYears`) 범위 띠와 평균 점선, 그 이전 해 옅은 선, 커서 툴팁(주차·올해 가격·직전 5년 평균).
  WHOLESALE_LEAD: 도매·소매 지수 두 선, 끝점 이름 라벨, 커서 툴팁. 툴팁은 `ChartHover`의 `tooltip` prop으로 재사용한다.
- 모델 의견: `/factors`가 `explained=false` + `BASELINE_MODEL`이면 탭 맨 위 안내 아래 "모델이 직전 가격 유지보다 낫지 않아 기준값을 보여줍니다."를 표시한다.
  탭을 숨길지는 팀 결정 전이라 둔다. `/factors`는 탭에서 한 번만 요청해 요인 패널과 공유한다.
- 모바일(375px)은 카드 한 열, 가로 스크롤 없음. 1024px 미만부터 한 열.

### 확인 시 주의 (포트)

WAS 기본 CORS는 `localhost:3000`, `localhost:5173`만 허용한다. 다른 포트(예: 8080)로 띄우면 서버에서 받는 상세는 보이지만
브라우저에서 부르는 가격 차트(`/history`)와 `/factors`는 CORS로 실패한다. 다른 포트에서 보려면 WAS를 `CORS_ORIGINS`에 그 주소를 넣어 실행한다.

### 가격 흐름 차트 기간

상세 모델 의견 탭과 홈의 "가격 흐름 및 7일 예측" 차트는 90일(기본) / 180일 / 1년을 고른다(`PRICE_CHART_PERIODS`).
14·30일은 짧아 미조사일이 많을 때 선이 거의 없어 뺐다. 180일·1년은 날짜 점을 그리지 않고 첫 날짜 라벨에 연도를 붙인다.
WAS `/history`가 180·365를 받아야 하므로, 그 변경이 머지되기 전 WAS로는 180일·1년이 400 오류가 난다.
요인 과거 추이(`/factors/{id}/history`)는 그대로 14/30/90일이다.

## 프론트 구조

`UI → service.ts / mapper.ts / model.ts → api.ts / dto.ts → WAS`.
`use-prices.ts`는 요청 취소, 변경된 검색/품목/기간에 대한 이전 응답 차단, 재시도를 담당한다.
Home·Prices·Detail은 같은 계층을 사용한다. 예측 `points: []`는 데이터 없음으로 표시한다.
실제 가격은 실선, 일별 예측은 점선이며 상승 Red / 하락 Blue / 보합 Gray를 유지한다.

숫자 상세 URL은 실제 목록 응답의 정수 ID를 사용한다. 임의 ID 매핑은 없다.
`green-onion` 등 기존 문자 slug는 기존 메타데이터의 이름으로 목록 API를 검색해
유일하게 식별한 실제 ID로 이동한다. 찾을 수 없거나 모호하면 품목 없음으로 처리한다.
백엔드는 BIGINT를 허용하지만 JS 정밀도를 넘는 ID는 잘못된 품목을 조회하지 않도록 거절한다.

즐겨찾기 키 `foodvalue-favorite-ingredients`와 `useFavorites`는 유지한다.
신규 값은 `was:<실제 ID>`로 저장해 기존 데모 숫자 ID와 충돌을 피한다.
기존 숫자/slug 값은 이름을 통해 실제 API의 ID로 연결하며 저장값은 자동 변경·삭제하지 않는다.
기존 품목이 미제공/모호하면 홈에 안내하며 나머지 즐겨찾기는 계속 표시한다.
관심 식재료 탭 전환 시 선택한 14/30/90일 기간은 유지한다.

기존 PoC JSON과 demo/mock 파일은 보존한다. 인기 검색어도 기존 정적 목록이다.

## 실행

프론트 공개 환경변수는 `.env.example`의 `NEXT_PUBLIC_API_BASE_URL`이다.
기본값은 `http://localhost:8000`이고 다른 WAS 주소를 쓰면 dev/build 전에 설정한다.
브라우저 번들에 포함되므로 변경 후 개발 서버 재시작 또는 재빌드가 필요하다.
실제 `.env`나 비밀값은 읽거나 추가하지 않는다.

WEB (`C:\foodvalue_web`):

```powershell
npm.cmd run dev
```

WAS (`C:\FoodValue_was`, 기존 의존성과 환경이 준비된 뒤):

```powershell
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

백엔드 프로젝트는 Python >=3.12를 요구하며 API 서버의 별도 포트 설정은 없다.
8000은 Uvicorn 기본 포트로, 위 명령에서 명시한다.
필수 변수 이름은 `DATABASE_URL`, `JWT_SECRET_KEY`(최소 32자), `S3_ENDPOINT_URL`,
`S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_BASE_URL`이다.
이들은 가격 API만 조회하더라도 앱 기동 단계에서 요구된다. PostgreSQL과 적용된 기존 스키마,
품목·가격 계열·관측 데이터가 필요하다. 7개 예측과 가이드가 같은 성공 실행으로
공개되어야 예측을 반환하며, 없으면 `NO_FORECAST/INSUFFICIENT_DATA` 및 빈 points가 정상이다.

기본 CORS는 `http://localhost:3000`, `http://localhost:5173`이다.
WEB은 `http://localhost:3000`으로 접속한다. `127.0.0.1:3000`이나 다른 origin이면
백엔드 실행 환경의 `CORS_ORIGINS` 설정이 필요하다. 백엔드 코드/CORS 설정은 변경하지 않았다.

작업 환경에서 WAS의 `.env`와 `.venv`가 없고 localhost:8000이 응답하지 않는 것을 확인했다.
실제 비밀값이나 DB를 만들지 않고 서버 실행·실데이터 호출은 하지 않았다.

## 검증

```powershell
npx.cmd tsc --noEmit
npx.cmd eslint app components lib mocks types scripts next.config.ts eslint.config.mjs postcss.config.mjs
node scripts/check-prices.mjs
npm.cmd run build
```

계약 검사는 네트워크를 mock하여 query/실제 ID 전달, nullable 가격, 결측 차트,
7개 일별 예측, 빈 예측, 서버 가이드 유지, 기존 즐겨찾기 해석, HTTP 오류·요청 취소를 확인한다.
브라우저 자동 조작은 실행하지 않는다. 실제 API·화면 검증은 WAS 환경 준비 후 별도로 필요하다.
전체 `npm.cmd run lint`는 기존 `.tmp-figma`의 브라우저 확장 JS 때문에 실패한다.
해당 임시 자료를 변경하거나 삭제하지 않고 위 소스 디렉터리 대상으로 별도 검사한다.
