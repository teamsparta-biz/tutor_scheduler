---
created: 2026-02-22
status: 대기
---

# 강사 API

> 강사 CRUD FastAPI 엔드포인트를 구현한다

## 목표

- 강사 생성/조회/수정/삭제 API가 동작함
- API 문서(/docs)에서 테스트 가능함

## 상세

- [ ] Pydantic 스키마 정의 (InstructorCreate, InstructorUpdate, InstructorResponse)
- [ ] GET /api/instructors — 강사 목록 (검색, 페이지네이션)
- [ ] GET /api/instructors/{id} — 강사 상세
- [ ] POST /api/instructors — 강사 등록 (관리자 전용)
- [ ] PUT /api/instructors/{id} — 강사 수정 (관리자 전용)
- [ ] DELETE /api/instructors/{id} — 강사 삭제 (관리자 전용)
- [ ] Supabase 클라이언트로 DB 연동
- [ ] API 테스트 (Swagger UI 또는 curl)

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용
