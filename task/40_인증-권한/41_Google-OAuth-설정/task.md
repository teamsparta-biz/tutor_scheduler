---
created: 2026-02-22
status: 대기
---

# Google OAuth 설정

> Google Cloud Console과 Supabase에서 OAuth를 설정한다

## 목표

- Google Cloud Console에서 OAuth 클라이언트가 생성됨
- Supabase Authentication에 Google 제공자가 활성화됨
- 리디렉트 URL이 올바르게 설정됨

## 상세

- [ ] Google Cloud Console에서 프로젝트 생성
- [ ] OAuth 동의 화면 설정
- [ ] OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
- [ ] Supabase 대시보드 → Authentication → Providers → Google 활성화
- [ ] Client ID, Client Secret 입력
- [ ] 허용 리디렉트 URI 설정 (로컬 + 배포 URL)
- [ ] 테스트 로그인 확인

## 참고

- Google Cloud Console: console.cloud.google.com
- Supabase 리디렉트 URL 형식: `https://<project>.supabase.co/auth/v1/callback`
