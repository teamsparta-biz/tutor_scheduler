# Supabase 셋업 가이드

## 1. Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `instructor-scheduler`
4. 데이터베이스 비밀번호 설정 (안전한 곳에 보관)
5. Region: `Northeast Asia (Tokyo)` 선택

## 2. 테이블 생성

Supabase 대시보드 → SQL Editor에서 실행:

1. `migrations/001_initial_schema.sql` 전체 복사 → 실행
2. `migrations/002_rls_policies.sql` 전체 복사 → 실행

## 3. API 키 확인

대시보드 → Settings → API:

| 값 | 환경변수 | 용도 |
|----|---------|------|
| Project URL | `SUPABASE_URL` / `VITE_SUPABASE_URL` | API 엔드포인트 |
| anon public key | `VITE_SUPABASE_ANON_KEY` | 프론트엔드 (RLS 적용) |
| service_role key | `SUPABASE_KEY` | 백엔드 (RLS 우회) |

## 4. Google OAuth 설정

### 4.1 Google Cloud Console

1. [console.cloud.google.com](https://console.cloud.google.com) → 프로젝트 생성/선택
2. APIs & Services → Credentials → Create Credentials → OAuth client ID
3. Application type: Web application
4. Authorized redirect URIs: `https://<project-ref>.supabase.co/auth/v1/callback`
5. Client ID, Client Secret 복사

### 4.2 Supabase 대시보드

1. Authentication → Providers → Google
2. Enable 토글 ON
3. Client ID, Client Secret 입력
4. Save

## 5. 환경변수 설정

```bash
# backend/.env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_KEY=<service_role_key>
NOTION_TOKEN=<notion_integration_token>
NOTION_DB_LECTURE=<notion_database_id>

# frontend/.env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_public_key>
```
