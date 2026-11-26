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
| `/api/v1/prices/items/{item_id}/history` | `days=14/30/90/180/365`(180·365는 WAS `feature/service-view`에서 추가), `market`. `{points:[{date,price}],startDate,endDate,...}` |
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

- 상세 예측 팝업의 "예측에 영향을 준 요인"은 `/factors`를 쓴다(`components/prices/shap-factors.tsx`, `lib/prices/shap.ts`).
  요인은 서버 순서(기여 절댓값 순) 그대로, 상위 몇 개를 먼저 보이고 나머지는 "더 보기". 처음에는 모두 접어 둔다. 분류 필터는 응답에 있는 분류(가격·날씨·달력·계절·생산량·환율)만.
- 요인을 펼치면 `/factors/{id}/history`를 한 번(90일) 받아 14/30/90일을 화면에서 자른다. 값이 없는 날은 선을 만들지 않는다.
  `hasHistory=false`(예측 대상일의 계절, 시계열 추세 등)는 추이를 그리지 않고 이유를 한 줄로 적는다. 반올림해 0원인 영향은 "중립"으로 둔다.
- `explained=false`(학습 모델이 기준 모델을 이기지 못해 기준 모델로 공개, 예측 없음 등)면 요인 표 대신 그 이유를 안내한다.
- AI 예측 요약은 상세 응답의 `summary.headline`(서버 고정 문장)과 `summary.detail`(Gemini가 다듬은 요인 요약, 숫자 없음)을 쓰고,
  `summary`가 없을 때만 화면에서 숫자로 문장을 만든다. 분류별 설명은 `categories[].description` → `summary.categories` → 고정 문장 순.
- SHAP은 모델 예측에 대한 기여이며 인과관계가 아니라는 안내를 유지한다.

## 판단 보조 지표 카드

**현재 상태**: WAS `GET /prices/items/{id}/indicators`에 실제로 연결되어 있다(WAS `docs/INDICATORS_API_DESIGN.md`, 별도 DB에서 `python -m app.indicator_batch --item-id 60`으로 생성).
주소에 `?mock=indicators|empty|error`를 붙이면 프로토타입 mock을 쓴다(WAS 없이 화면 확인용). 아래 계약 표는 초안이며 실제와 다른 점은 이 박스가 우선한다.
- 응답에 `status`(READY·STALE·NO_DATA·INSUFFICIENT_HISTORY)와 `specVersion`이 있다. STALE이고 가격일과 기준일이 다르면 상세 기준일 줄에 "지표는 ○.○ 기준" 꼬리표를 붙인다.
- 카드 key: `PRICE_POSITION`(1년 중 위치), `SEASONAL`(같은 시기 대비: 최근 28일 vs 과거 5년 같은 구간), `WHOLESALE_LEAD`, `RETAIL_WHOLESALE_GAP`(소매÷도매 배수), `VOLATILITY`(최근 4주 변동폭). `ARRIVALS`는 검증에서 방향이 반대로 나와 서버가 보내지 않는다.
- 검증 통과 여부는 verdict로 표시한다: `PASS`(도매→소매), `CONDITIONAL`(1년 위치: 싼 쪽만 강함), `FACT`(방향을 주장하지 않는 사실. 배수는 도매 흐름과 겹쳐 FACT로 둠).
- 상세는 질문형 카드(같은 시기 평년보다 싼가요? 등)로 보여 준다. 주요 3개(평년 대비·1년 중 위치·도매 흐름)는 바로, 나머지는 "다른 지표 더 보기". 카드를 펼치면 숫자·그래프·과거 기록·읽는 법(`components/prices/indicator-help.ts`)이 나온다(`components/detail/evidence-cards.tsx`).

### 초안 계약 (프로토타입 시점, 필드 이름 일부 바뀜)

가격 예측이 직전 가격 유지(naive)를 안정적으로 이기지 못해, 상세 화면의 메인을 "데이터로 검증된 근거"로 바꿨다.
기존 7일 예측(`/forecast`)과 요인(`/factors`)은 상세의 "AI 7일 예측" 칸과 팝업으로 그대로 둔다.
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

화면 구성과 표시 규칙은 `PRICE_IMPLEMENTATION.md`에 정리했다. API와 관련된 것만 적는다.

- 칩·답 문장의 방향은 서버 `state`를 그대로 쓴다. 화면에서 가격으로 판단을 다시 계산하지 않는다.
- `/factors`가 `explained=false` + `BASELINE_MODEL`이면 직전 가격 유지 품목으로 보고 팝업 대신 안내 한 줄을 둔다.
- `/factors`는 팝업을 처음 열 때 한 번만 요청하고, 다시 열어도 같은 응답을 쓴다(`use-prices.ts`의 캐시).
- v2 앙상블(WAS #70)의 `validation`이 있으면 팝업에 검증 실적 한 줄(직전 가격 대비 개선율, ±5% 안 비율)을 보여 주고,
  "과거 평균 오차"도 `validation.mape`를 먼저 쓴다. 없으면(예전 모델) 가이드의 `mape`를 쓴다.
- 값이 없는 것이 정상인 요인(`arima_trend`, `seriesProfile`, `targetSeason`)은 "정보 없음" 대신 이름(모델 추세 등)으로,
  `…여부` 요인은 예/아니요, `target_weekday`는 요일 이름으로 보여 준다.
- 계열 출처 `MERGED`(배추·무 이어 붙인 계열, WAS #68)는 화면에 원래 출처인 KAMIS로 쓴다.

### 확인 시 주의 (포트)

WAS 기본 CORS는 `localhost:3000`, `localhost:5173`만 허용한다. 다른 포트(예: 8080)로 띄우면 서버에서 받는 상세는 보이지만
브라우저에서 부르는 가격 차트(`/history`)와 `/factors`는 CORS로 실패한다. 다른 포트에서 보려면 WAS를 `CORS_ORIGINS`에 그 주소를 넣어 실행한다.

### 가격 흐름 차트 기간

상세 가격 흐름 그래프는 1개월 / 3개월(기본) / 6개월 / 1년(`/history?days=30|90|180|365`)을 고르고, 기간은 주소(`?period=`)에 남긴다.
상세 첫 화면은 서버에서 365일 이력을 한 번 받아 기준 가격 4칸과 그래프에 함께 쓴다.
홈 "최근 8주" 흐름선은 보이는 품목마다 `/history?days=90`을 한 번씩 받는다.
요인 과거 추이(`/factors/{id}/history`)는 그대로 14/30/90일이다.

## 프론트 구조

`UI → service.ts / mapper.ts / model.ts → api.ts / dto.ts → WAS`.
홈 목록과 상세(상세·지표·365일 이력)는 서버 컴포넌트에서 먼저 받아 그린다. WAS 오류는 화면을 깨지 않고 오류 안내와 다시 시도 버튼으로 보여 준다.
브라우저에서 부르는 것은 홈 흐름선(`/history`), 그래프 기간 변경(`/history`), 예측 팝업(`/factors`, 요인 추이)뿐이다.
`use-prices.ts`는 요청 취소, 이전 응답 차단, 같은 요청 캐시를 맡는다.

숫자 상세 URL은 실제 목록 응답의 정수 ID를 쓴다. 임의 ID 매핑은 없다. 품목이 없으면 404 화면을 보여 준다.

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

v2 앙상블 예측(대파·양파·깐마늘·배추·무)을 보려면 WAS `.env`에 `FOODVALUE_PRICE_MODEL=v2`를 두고
WAS 쪽 배치(`app.merged_series`, `app.price_pipeline --predict-only`, `app.indicator_batch --item-id <id>`)를 먼저 돌린다.
WAS 명령은 `python`이 아니라 `uv run --extra prices python -m ...`으로 실행해야 필요한 패키지가 잡힌다.

## 검증

```powershell
npx.cmd tsc --noEmit
npx.cmd eslint app components lib mocks types scripts next.config.ts eslint.config.mjs postcss.config.mjs
node scripts/check-prices.mjs
npm.cmd run build
```

계약 검사(`scripts/check-prices.mjs`)는 네트워크를 mock하여 query/실제 ID 전달, nullable 가격, 결측 차트,
7개 일별 예측, 빈 예측, 서버 가이드 유지, MERGED 출처 표시, HTTP 오류·요청 취소를 확인한다.
`.tmp-figma`는 eslint 대상에서 뺐다(`eslint.config.mjs`).
