---
created: 2026-02-22
status: 완료
---

# 백엔드 셋업

> FastAPI 프로젝트를 생성하고 기본 구조를 구축한다

## 목표

- FastAPI 서버가 로컬에서 정상 기동됨
- 프로젝트 디렉토리 구조가 아키텍처 설계에 맞게 구성됨
- Supabase 연결이 설정됨

## 상세

- [ ] Python 가상환경 생성 및 의존성 설치 (FastAPI, uvicorn, supabase-py 등)
- [ ] 디렉토리 구조 생성 (routers, models, schemas, services 등)
- [ ] FastAPI 앱 엔트리포인트 작성
- [ ] 환경변수 관리 설정 (.env, python-dotenv)
- [ ] Supabase 클라이언트 초기화 코드 작성
- [ ] Health check 엔드포인트 추가
- [ ] 로컬 실행 확인 (uvicorn 기동 → /docs 접속)

## 참고

- requirements.txt 또는 pyproject.toml로 의존성 관리
- .env.example 파일 작성 (Supabase URL, Key 등)
