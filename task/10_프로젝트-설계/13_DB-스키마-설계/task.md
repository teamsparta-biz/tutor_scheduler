---
created: 2026-02-22
status: 완료
---

# DB 스키마 설계

> 강사, 교육, 배정 등 핵심 테이블의 스키마를 설계한다

## 목표

- 모든 핵심 엔티티의 테이블 구조가 정의됨
- 테이블 간 관계(FK, 제약조건)가 설계됨
- 중복 배정 방지를 위한 DB 레벨 제약이 포함됨

## 상세

- [ ] 핵심 테이블 설계
  - `users`: 사용자 (Supabase Auth 연동)
  - `instructors`: 강사 프로필
  - `courses`: 교육 과정
  - `course_dates`: 교육 날짜 (하루/며칠 지원)
  - `assignments`: 강사 배정 (교육-날짜-강사-반 매핑)
- [ ] 관계 및 제약조건 정의
  - 강사-날짜 UNIQUE 제약 (같은 날 중복 배정 방지)
- [ ] 역할(role) 관리 방식 설계 (관리자/강사 구분)
- [ ] ERD 다이어그램 작성

## 참고

- 결과물 위치: `output/db-schema.md`
- Supabase는 PostgreSQL 기반 — 표준 SQL 제약조건 사용 가능
