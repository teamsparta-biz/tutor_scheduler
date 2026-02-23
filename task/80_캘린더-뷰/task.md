---
created: 2026-02-22
status: 진행중
---

# 캘린더 뷰

> 월간/주간 캘린더로 강사별 일정을 시각화한다

## 목표

- 월간 캘린더에서 전체 강사의 교육 배정 현황을 한눈에 볼 수 있음
- 주간 캘린더에서 상세 일정을 확인할 수 있음
- 강사별/교육별 필터링이 가능함

## 상세

- [x] 캘린더 API 백엔드: GET /api/calendar?start_date=&end_date= — 캘린더 데이터 API
- [ ] 캘린더 라이브러리 선택 및 설치 (FullCalendar, react-big-calendar 등)
- [ ] 월간 뷰: 날짜 셀에 교육명/강사명 표시, 색상으로 교육 구분
- [ ] 주간 뷰: 요일별 상세 일정
- [ ] 월/주 전환 토글
- [ ] 필터: 전체 / 특정 강사 / 특정 교육
- [ ] 강사 본인 로그인 시: 자기 일정만 기본 표시
- [ ] 이벤트 클릭 시 교육 상세 또는 배정 상세로 이동

## 참고

- 70_강사-배정 완료 후 착수
- react-big-calendar 또는 FullCalendar React 래퍼 사용 권장

## 완료 기록 (백엔드 API)

**완료일:** 2026-02-23

- `schemas/calendar.py` — CalendarEvent, CalendarResponse 추가
- `services/calendar_service.py` — 생성자 확장(4개 repo), get_calendar(start, end) — 다중 repo 조합, 메모리 매핑으로 N+1 회피
- `dependencies.py` — get_calendar_service() (4개 repo 의존)
- `routers/calendar.py` — GET /api/calendar?start_date=&end_date=
- `tests/test_calendar.py` — 3개 테스트 (빈 캘린더, 배정 포함, 날짜 필터)
