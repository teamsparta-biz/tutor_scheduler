---
created: 2026-02-22
status: 대기
---

# 배정 API & 중복 방지

> 강사 배정 CRUD API와 같은 날 중복 배정 방지 로직을 구현한다

## 목표

- 강사 배정 생성/조회/삭제 API가 동작함
- 같은 날 같은 강사를 중복 배정하면 API에서 거부됨
- 특정 날짜의 가용 강사 목록 조회 API가 동작함

## 상세

- [ ] Pydantic 스키마 정의 (AssignmentCreate, AssignmentResponse)
- [ ] POST /api/assignments — 강사 배정 (관리자 전용)
  - 요청: course_date_id, instructor_id, section(반)
  - 중복 체크: 해당 날짜에 해당 강사가 이미 배정되어 있으면 400 에러
- [ ] DELETE /api/assignments/{id} — 배정 해제
- [ ] GET /api/assignments?course_id=X — 교육별 배정 현황
- [ ] GET /api/instructors/available?date=YYYY-MM-DD — 특정 날짜 가용 강사 목록
- [ ] DB 레벨 UNIQUE 제약: (instructor_id, date) 조합
- [ ] 에러 응답에 중복 사유 포함 ("해당 강사는 이 날짜에 이미 [교육명]에 배정되어 있습니다")
- [ ] API 테스트 (정상 배정, 중복 배정 시도)

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용
- DB UNIQUE 제약 + 애플리케이션 레벨 검증 이중 방어
