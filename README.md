# FoodValue Frontend

FoodValue는 식자재 시세, 7일 가격 예측, 구매 판단 지표를 제공합니다.

---

## 기술 스택

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router

---

## 시세 화면

판단은 지난 가격 지표로 하고, AI 7일 예측은 참고로만 따로 보여 줍니다.

| 경로 | 화면 |
| --- | --- |
| `/` | 홈: 품목 표(현재가·지난주 대비·평년 대비·최근 8주·1년 중 위치) |
| `/prices/[itemId]` | 품목 상세: 결론·기준 가격 → 판단 근거 / 가격 흐름·AI 7일 예측(팝업) |
| `/analysis?item=ID` | 분석실: 품목 한눈에 · 데이터 흐름도 · 판단 계산 단계 · "만약에" 슬라이더 · 판단 달력/성적표 · AI 예측 영수증형 분해 |
| `/about` | 판단 방식(규칙서): 지표 기준 눈금자 · 기준의 과거 검증 · AI 모델 구조/이번 예측 모델별 비교/품목별 성적/모델 선정 과정 · 데이터 출처표 |

- 화면 구성·표시 규칙: [`PRICE_IMPLEMENTATION.md`](PRICE_IMPLEMENTATION.md)
- 분석실은 WAS를 고치지 않고 지금 API(목록·상세·지표·요인·365일 이력)만 씁니다. 다시 계산하는 식은 `lib/analysis/compute.ts`에 있고, 기준 숫자는 WAS `app/core/constants.py`와 같습니다. 판단 달력·성적표는 연도별 주 평균으로 다시 계산한 근사치입니다(이번 주 칸만 서버 값).
- WAS API 연결·실행·검증: [`PRICE_API_INTEGRATION.md`](PRICE_API_INTEGRATION.md)

### 실행

```powershell
# WAS (C:\FoodValue_was): http://localhost:8000
uv run uvicorn app.main:app --reload --port 8000

# WEB (이 저장소): http://localhost:3000
npm install
npm run dev
```

WAS 주소가 다르면 `.env.local`에 `NEXT_PUBLIC_API_BASE_URL`을 넣습니다(`.env.example` 참고). WAS는 기본으로 `localhost:3000`의 요청만 허용합니다.

---

## 커밋 · PR 규칙

### 커밋 메시지

커밋 메시지는 `타입 : 설명` 형식으로 작성합니다.

예:

```text
feat : 커뮤니티 목록 화면 구현
fix : 시세 카드 레이아웃 수정
docs : README 수정
```

| 타입 | 설명 |
| --- | --- |
| feat | 새로운 기능 추가 및 기존 기능 수정 |
| fix | 버그 수정 |
| docs | 문서 및 주석 수정 |
| style | 코드 스타일 및 포맷팅 수정 |
| refact | 기능 변화 없는 코드 리팩터링 |
| test | 테스트 코드 추가/수정 |
| chore | 패키지 및 기타 설정 변경 |
| merge | 브랜치 병합 |

### Pull Request

- 작업 브랜치는 `dev`에서 분기합니다.
- PR 대상(base)은 `dev`로 지정합니다.
- PR 제목은 커밋 메시지와 동일한 `타입 : 설명` 형식으로 작성합니다.
- PR 본문은 `.github/pull_request_template.md` 양식에 맞춰 작성합니다.

예:

```text
feat : 커뮤니티 목록 화면 구현
```

---

## 브랜치 규칙

```text
main
└─ dev
   ├─ feature/home
   ├─ feature/prices
```

- `main` : 최종 배포 및 안정 버전 브랜치
- `dev` : 개발 내용을 통합하는 브랜치
- `feature/*` : 기능별 작업 브랜치

### 브랜치 생성 예시

```bash
git checkout dev
git pull origin dev
git checkout -b feature/prices
```

작업이 끝난 후:

```bash
git add .
git commit -m "feat : 커뮤니티 목록 화면 구현"
git push origin feature/prices
```

이후 GitHub에서 `dev` 브랜치를 대상으로 Pull Request를 생성합니다.
