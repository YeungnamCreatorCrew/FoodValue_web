# FoodValue Frontend

1~2인 가구를 위한 식자재 관리 서비스입니다.

냉장고 재료를 관리하고, 보유한 재료를 기반으로 레시피를 추천하며,
식자재 시세 및 AI 가격 예측 정보를 제공합니다.

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
| `/about` | 판단 방식: 지표별 판단 기준과 예측 모델 |

- 화면 구성·표시 규칙: [`PRICE_IMPLEMENTATION.md`](PRICE_IMPLEMENTATION.md)
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
   ├─ feature/fridge
   ├─ feature/prices
   ├─ feature/recipes
   ├─ feature/community
   └─ feature/mypage
```

- `main` : 최종 배포 및 안정 버전 브랜치
- `dev` : 개발 내용을 통합하는 브랜치
- `feature/*` : 기능별 작업 브랜치

### 브랜치 생성 예시

```bash
git checkout dev
git pull origin dev
git checkout -b feature/community
```

작업이 끝난 후:

```bash
git add .
git commit -m "feat : 커뮤니티 목록 화면 구현"
git push origin feature/community
```

이후 GitHub에서 `dev` 브랜치를 대상으로 Pull Request를 생성합니다.