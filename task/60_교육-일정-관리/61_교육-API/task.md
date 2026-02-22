---
created: 2026-02-22
status: 대기
---

# 교육 API

> 교육 과정 CRUD FastAPI 엔드포인트를 구현한다

## 목표

- 교육 생성/조회/수정/삭제 API가 동작함
- 교육 날짜(단일/범위)와 반 정보가 관리됨

## 상세

- [ ] Pydantic 스키마 정의 (CourseCreate, CourseUpdate, CourseResponse)
- [ ] GET /api/courses — 교육 목록 (필터: 진행중/예정/완료)
- [ ] GET /api/courses/{id} — 교육 상세 (날짜, 반, 배정 현황 포함)
- [ ] POST /api/courses — 교육 등록 (관리자 전용)
  - 시작일/종료일로 course_dates 자동 생성
  - 반(section) 정보 저장
- [ ] PUT /api/courses/{id} — 교육 수정 (관리자 전용)
- [ ] DELETE /api/courses/{id} — 교육 삭제 (관리자 전용, 배정 있으면 경고)
- [ ] API 테스트

## 참고

- ABC 인터페이스 + 구현체 주입 패턴 적용
- 교육 삭제 시 연관 배정 데이터 처리 방식 주의
