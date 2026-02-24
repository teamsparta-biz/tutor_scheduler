# instructor-scheduler / frontend

React + TypeScript + Vite 기반 프론트엔드

## 기술 스택

- React 19 + TypeScript
- Vite (빌드 도구)
- TailwindCSS (스타일링)
- TanStack Query (서버 상태 관리)
- Supabase Auth (Google OAuth)

## 실행

```bash
npm install
npm run dev
```

## 환경변수

`frontend/.env` 파일에 아래 값 설정:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 빌드

```bash
npm run build
```

## 디렉토리 구조

```
src/
├── api/          # API 클라이언트 함수
├── components/   # 재사용 컴포넌트
├── contexts/     # React Context (AuthContext)
├── lib/          # 외부 라이브러리 초기화 (Supabase)
├── pages/        # 페이지 컴포넌트
│   └── instructor/  # 강사 전용 페이지
├── types/        # TypeScript 타입 정의
└── utils/        # 공통 유틸리티 함수
```
