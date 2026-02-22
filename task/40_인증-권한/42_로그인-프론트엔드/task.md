---
created: 2026-02-22
status: 대기
---

# 로그인 프론트엔드

> React에서 Google 로그인/로그아웃 UI를 구현한다

## 목표

- Google 로그인 버튼 클릭 → Supabase OAuth 플로우 → 로그인 완료
- 로그아웃 버튼 동작
- 인증 상태에 따라 라우트 보호 (미인증 → 로그인 페이지)

## 상세

- [ ] Supabase Auth 클라이언트로 `signInWithOAuth({ provider: 'google' })` 구현
- [ ] 로그인 페이지 컴포넌트 (30_UI-프로토타입 기반)
- [ ] 인증 상태 관리 (AuthContext 또는 hook)
- [ ] ProtectedRoute 컴포넌트 (미인증 시 리디렉트)
- [ ] 로그아웃 기능 구현
- [ ] 로그인 후 대시보드로 리디렉트

## 참고

- `@supabase/supabase-js`의 `onAuthStateChange` 활용
