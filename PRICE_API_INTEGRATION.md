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
| `/api/v1/prices/items/{item_id}/history` | `days=14/30/90`, `market`. `{points:[{date,price}],startDate,endDate,...}` |
| `/api/v1/prices/items/{item_id}/forecast` | `market`. `{points:[{targetDate,predictedPrice,lowerPrice,upperPrice}],...}` |

카테고리: `VEGETABLE/GRAIN/FRUIT/MEAT/SEAFOOD/ETC`.
UI의 `ALL`은 query에서 생략한다. 검색 `q`는 API에서 `keyword`로,
정렬 `price-drop/forecast-drop/name`은 `change/forecast/name`으로 변환한다.
`WHOLESALE`도 백엔드 계약에는 있지만 이번 UI에는 추가하지 않는다.

현재가·주간 변화율·예측 요약·가격 날짜·예측 기준일/목표일·단위·품질은 nullable이다.
이력 `price: null`은 그대로 보존하고 차트의 실선을 끊는다. 예측 상하한도 null을 유지한다.
상세 가이드는 서버의 `recommendation`, `buyAfterDays`, `expectedSaving`, `mape`를 변환하며
가격 방향으로 구매 추천을 다시 계산하지 않는다. `guide.factors`와 `/factors`는 SHAP으로 쓰지 않는다.

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

SHAP / AI Insight는 기존 fixture를 별도 `mock-analysis.ts`에서 조회하고 화면에 mock으로 명시한다.
실제 가격 모델에는 SHAP·기상·가중치·냉장고 데이터를 합치지 않는다.
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
