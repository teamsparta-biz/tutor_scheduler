---
created: 2026-02-22
status: 완료
---

# 로그인 & 대시보드 화면

> 로그인 페이지와 대시보드 A/B안을 React 컴포넌트로 구현

## 목표

- Google 로그인 버튼이 포함된 로그인 페이지 완성
- 대시보드 A/B 레이아웃 비교 가능

## 상세

- [x] 로그인 페이지: Google 로그인 버튼, 서비스 로고/설명 (`/login`)
- [x] 대시보드 A안: 카드 그리드 4개 + 최근 배정 테이블
- [x] 대시보드 B안: 투패널 (통계 카드 세로 + 오늘의 일정 타임라인)
- [x] 공통 헤더: 사용자 정보, 로그아웃 버튼

## 참고

- 파일: `pages/Login.tsx`, `pages/Dashboard.tsx`, `components/layout/Header.tsx`
- mock 데이터: `mocks/data.ts` (공유)
