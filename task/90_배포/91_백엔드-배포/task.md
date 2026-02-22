---
created: 2026-02-22
status: 대기
---

# 백엔드 배포

> FastAPI 서버를 Railway에 배포한다

## 목표

- FastAPI 서버가 Railway에서 정상 기동됨
- /docs (Swagger UI)에 외부에서 접속 가능함
- 환경변수가 주입되어 Supabase 연결이 동작함

## 상세

- [ ] Procfile 작성 (web: uvicorn main:app --host 0.0.0.0 --port $PORT)
- [ ] requirements.txt 최종 정리
- [ ] Railway 프로젝트 생성
- [ ] GitHub 저장소 연결 또는 수동 배포
- [ ] 환경변수 설정 (SUPABASE_URL, SUPABASE_KEY 등)
- [ ] 배포 후 Health check 확인
- [ ] Google OAuth 리디렉트 URL에 Railway 도메인 추가

## 참고

- Procfile(Nixpacks) 사용 권장 (Dockerfile보다 Railway 호환성 우수)
- 첫 배포 시 환경변수 미주입 문제 주의 → 서버 먼저 기동 후 변수 등록
