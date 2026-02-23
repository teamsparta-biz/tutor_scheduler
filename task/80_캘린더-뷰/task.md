---
created: 2026-02-22
status: 완료
completed: 2026-02-23
---

# 캘린더 뷰

> 월간/주간 캘린더로 강사별 일정을 시각화한다

## 목표

- 월간 캘린더에서 전체 강사의 교육 배정 현황을 한눈에 볼 수 있음
- 주간 캘린더에서 상세 일정을 확인할 수 있음
- 강사별/교육별 필터링이 가능함

## 상세

- [x] 캘린더 API 백엔드: GET /api/calendar?start_date=&end_date= — 캘린더 데이터 API
- [x] 월간 뷰: 커스텀 구현 (외부 라이브러리 없이), 날짜 셀에 교육명/강사명 표시, 상태별 색상 구분
- [x] 분할 뷰: 좌측 캘린더 + 우측 날짜별 상세 일정
- [x] 필터: 전체 / 특정 강사
- [x] 미배정 교육 경고 표시
- [ ] ~~주간 뷰~~ — 분할 뷰로 대체
- [ ] ~~이벤트 클릭 시 이동~~ — 우측 패널에서 직접 확인

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
