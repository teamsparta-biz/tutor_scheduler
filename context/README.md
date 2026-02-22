# context/

프로젝트 맥락과 세션 기록을 관리합니다.

## 참조

| 주제 | 문서 |
|------|------|
| 상위 폴더 | [../README.md](../README.md) |

## 구조

```
context/
└── session/          → 세션 기록 관리
    ├── raw/          → 대화 흐름 기록
    ├── decisions/    → 결정사항 추출
    └── digest/       → 통합 요약
        ├── task/
        ├── milestone/
        └── project/
```

## 관련 스킬

| 스킬 | 역할 |
|------|------|
| /save-session | session/raw/, session/decisions/에 세션 파일 생성 |
| /digest | session/digest/에 통합 요약 생성 |

## session/ 하위 폴더

| 폴더 | 용도 |
|------|------|
| `raw/` | 대화 흐름 기록 |
| `decisions/` | 결정사항 추출 |
| `digest/task/` | 태스크별 요약 |
| `digest/milestone/` | 마일스톤 요약 (태스크 8개 이상 시) |
| `digest/project/` | 프로젝트 전체 요약 |
