---
created: 2026-02-22
status: 대기
---

# 프론트엔드 배포

> React 앱을 빌드하고 배포한다

## 목표

- React 앱이 빌드되어 정적 파일이 생성됨
- 배포된 URL에서 정상 접속 가능
- API 엔드포인트가 배포된 백엔드를 가리킴

## 상세

- [ ] 프론트엔드 빌드 (npm run build)
- [ ] 배포 방식 결정: Railway에 함께 배포 또는 Vercel/Netlify 별도 배포
- [ ] 환경변수 설정 (VITE_API_URL, VITE_SUPABASE_URL 등)
- [ ] 배포 후 접속 테스트
- [ ] Google OAuth 리디렉트 URL에 프론트엔드 도메인 추가
- [ ] CORS 설정 확인 (백엔드에서 프론트엔드 도메인 허용)

## 참고

- React SPA는 Vercel/Netlify가 더 간편할 수 있음 (무료)
- Railway에서 프론트+백을 함께 호스팅할 수도 있음
