---
created: 2026-02-22
status: 완료
completed: 2026-02-23
---

# 배정 API & 중복 방지

> 강사 배정 CRUD API와 같은 날 중복 배정 방지 로직을 구현한다

## 목표

- 강사 배정 생성/조회/삭제 API가 동작함
- 같은 날 같은 강사를 중복 배정하면 API에서 거부됨
- 특정 날짜의 가용 강사 목록 조회 API가 동작함

## 상세

- [x] Pydantic 스키마 정의 (AssignmentCreate, AssignmentResponse)
- [x] POST /api/assignments — 강사 배정
  - 중복 체크: 해당 날짜에 해당 강사가 이미 배정되어 있으면 400 에러
- [x] DELETE /api/assignments/{id} — 배정 해제
- [x] GET /api/assignments — 배정 목록
- [x] GET /api/instructors/available?date=YYYY-MM-DD — 특정 날짜 가용 강사 목록
- [x] DB 레벨 UNIQUE 제약: (instructor_id, date) 조합
- [x] 에러 응답에 중복 사유 포함
- [x] pytest 테스트 7개 통과 (정상 배정, 중복 차단 400, 다른 강사 같은 날 OK, 같은 강사 다른 날 OK, 목록, 삭제 후 재배정, 가용 강사)

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용
- DB UNIQUE 제약 + 애플리케이션 레벨 검증 이중 방어

## 완료 기록

- `exceptions.py` — DuplicateAssignmentError 신규 생성
- `schemas/assignment.py` — AssignmentCreate, AssignmentResponse 추가
- `repositories/impl/supabase_assignment_repository.py` — 3개 메서드 + UNIQUE 위반 → DuplicateAssignmentError 변환
- `services/assignment_service.py` — CRUD + 이중 방어 + get_available_instructors(date)
- `routers/assignments.py` — GET, POST, DELETE + DuplicateAssignmentError → 400
- `routers/instructors.py` — GET /available?date= 추가 (`/{instructor_id}` 앞에 선언)
- `tests/fakes/fake_assignment_repository.py` — DuplicateAssignmentError import를 exceptions.py로 변경, 필터 지원 추가
- `tests/test_assignments.py` — 7개 테스트
