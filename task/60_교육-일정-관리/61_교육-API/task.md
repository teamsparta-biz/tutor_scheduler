---
created: 2026-02-22
status: 완료
completed: 2026-02-23
---

# 교육 API

> 교육 과정 CRUD FastAPI 엔드포인트를 구현한다

## 목표

- 교육 생성/조회/수정/삭제 API가 동작함
- 교육 날짜(단일/범위)와 반 정보가 관리됨

## 상세

- [x] Pydantic 스키마 정의 (CourseCreate, CourseUpdate, CourseResponse, CourseDateResponse, CourseDetailResponse, SyncResultResponse)
- [x] GET /api/courses — 교육 목록
- [x] GET /api/courses/{id} — 교육 상세 (날짜 포함)
- [x] POST /api/courses — 교육 등록
  - 시작일/종료일로 course_dates 자동 생성
- [x] PUT /api/courses/{id} — 교육 수정
- [x] DELETE /api/courses/{id} — 교육 삭제
- [x] POST /api/courses/sync — Notion → Supabase 동기화
- [x] Notion 클라이언트 구현 (페이지네이션 포함)
- [x] pytest 테스트 7개 통과

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용
- CourseRepository ABC에 create, update, delete, upsert 메서드 추가
- `/sync` 엔드포인트를 `/{id}` 앞에 선언하여 라우트 충돌 방지

## 완료 기록

- `repositories/course_repository.py` — ABC에 create/update/delete/upsert 추가
- `schemas/course.py` — 6개 스키마 추가
- `repositories/impl/supabase_course_repository.py` — 6개 메서드 구현 (upsert 포함)
- `repositories/impl/supabase_course_date_repository.py` — 3개 메서드 구현
- `clients/impl/notion_client_impl.py` — query_database(페이지네이션), get_page 구현
- `repositories/impl/notion_course_repository.py` — list/get + _parse_page 구현
- `services/course_service.py` — CRUD + _generate_dates(start, end)
- `services/course_sync_service.py` — sync_courses() Notion→Supabase upsert
- `dependencies.py` — course/date repo + service + sync DI 5개 함수 추가
- `routers/courses.py` — CRUD 5개 + POST /sync (총 6개 엔드포인트)
- `tests/test_courses.py` — 7개 테스트
