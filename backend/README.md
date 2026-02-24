# instructor-scheduler / backend

FastAPI 기반 백엔드 API 서버

## 기술 스택

- Python 3.13 + FastAPI
- Supabase (PostgreSQL + Auth)
- Notion API (데이터 동기화)
- httpx (비동기 HTTP 클라이언트)

## 실행

```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

개발 서버 (FakeRepository + JWT 인증):

```bash
uvicorn dev_main:app --reload --port 8000
```

## 환경변수

`backend/.env` 파일에 아래 값 설정:

```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-service-role-key
NOTION_TOKEN=your-notion-integration-token
NOTION_DB_LECTURE=notion-database-id
NOTION_DB_SCHEDULE=notion-database-id
NOTION_DB_TUTOR=notion-database-id
```

## 테스트

```bash
pytest
```

## 디렉토리 구조

```
backend/
├── clients/          # 외부 API 클라이언트 (Notion, Supabase)
│   └── impl/         # 클라이언트 구현체
├── repositories/     # 데이터 접근 계층
│   └── impl/         # Repository 구현체 (Supabase, Fake)
├── services/         # 비즈니스 로직
├── routers/          # API 엔드포인트
├── schemas/          # Pydantic 스키마
├── tests/            # 테스트
├── main.py           # 프로덕션 앱 (Supabase 연동)
├── dev_main.py       # 개발 서버 (FakeRepository)
└── dependencies.py   # FastAPI DI 설정
```
