---
created: 2026-02-22
status: 완료
completed: 2026-02-23
---

# 강사 API

> 강사 CRUD FastAPI 엔드포인트를 구현한다

## 목표

- 강사 생성/조회/수정/삭제 API가 동작함
- API 문서(/docs)에서 테스트 가능함

## 상세

- [x] Pydantic 스키마 정의 (InstructorCreate, InstructorUpdate, InstructorResponse)
- [x] GET /api/instructors — 강사 목록 (is_active 필터)
- [x] GET /api/instructors/{id} — 강사 상세
- [x] POST /api/instructors — 강사 등록
- [x] PUT /api/instructors/{id} — 강사 수정
- [x] DELETE /api/instructors/{id} — 강사 삭제
- [x] Supabase 클라이언트로 DB 연동 (SupabaseInstructorRepository 구현)
- [x] pytest 테스트 9개 통과

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용

## 완료 기록

- `schemas/instructor.py` — InstructorCreate, InstructorUpdate, InstructorResponse 추가
- `repositories/impl/supabase_instructor_repository.py` — 5개 메서드 구현
- `services/instructor_service.py` — 5개 메서드 (repo 위임 + model_dump 변환)
- `dependencies.py` — get_instructor_repository, get_instructor_service 추가
- `routers/instructors.py` — 5개 엔드포인트
- `tests/test_instructors.py` — 9개 테스트 (생성, 목록, 필터, 상세, 404, 수정, 삭제)
