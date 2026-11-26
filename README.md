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
