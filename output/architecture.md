# 아키텍처 설계: instructor-scheduler

> FastAPI + React(Vite) + Supabase + Railway. ABC 인터페이스 + 구현체 주입 패턴.

## 1. 기술 스택

| 영역 | 기술 | 버전 | 비고 |
|------|------|------|------|
| **프론트엔드** | React + Vite | React 18, Vite 5 | TypeScript |
| **백엔드** | Python + FastAPI | Python 3.11+, FastAPI 0.110+ | |
| **DB / 인증** | Supabase | PostgreSQL 15 | Google OAuth, RLS |
| **배포** | Railway | | 백엔드 앱 코드 |
| **교육 데이터** | Notion API | 2022-06-28 | 읽기 전용 연동 |

### 주요 라이브러리

**백엔드:**
| 패키지 | 용도 |
|--------|------|
| `fastapi` | 웹 프레임워크 |
| `uvicorn` | ASGI 서버 |
| `pydantic` | 데이터 검증/직렬화 |
| `supabase-py` | Supabase 클라이언트 |
| `requests` | Notion API HTTP 호출 |
| `python-dotenv` | 환경변수 로딩 |
| `pytest` | 테스트 |
| `httpx` | 테스트용 비동기 HTTP 클라이언트 |

**프론트엔드:**
| 패키지 | 용도 |
|--------|------|
| `react` + `react-dom` | UI |
| `react-router-dom` | 라우팅 |
| `@supabase/supabase-js` | Supabase 클라이언트 (인증) |
| `@tanstack/react-query` | 서버 상태 관리 |
| `tailwindcss` | 스타일링 |

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                       Client (Browser)                       │
│  React + Vite + TypeScript                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ 강사관리  │ │ 교육일정  │ │ 강사배정  │ │  캘린더 뷰     │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│       │             │            │              │             │
│       └─────────────┴────────────┴──────────────┘             │
│                         │                                     │
│                  Supabase Auth (Google OAuth)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP (REST)
┌─────────────────────────┴───────────────────────────────────┐
│                    Backend (FastAPI on Railway)               │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      API Router Layer                    │ │
│  │  /api/instructors  /api/courses  /api/assignments        │ │
│  │  /api/calendar     /api/courses/sync                     │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                              │                                │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │                     Service Layer                        │ │
│  │  InstructorService  CourseService  AssignmentService     │ │
│  │  CalendarService    CourseSyncService                    │ │
│  └──────────────────────────┬──────────────────────────────┘ │
│                              │                                │
│  ┌──────────────────────────┴──────────────────────────────┐ │
│  │                   Repository Layer (ABC)                  │ │
│  │  CourseRepository   InstructorRepository                  │ │
│  │  AssignmentRepository  CourseDateRepository               │ │
│  └────────┬─────────────────────────┬──────────────────────┘ │
│           │                         │                         │
│  ┌────────┴────────┐     ┌─────────┴───────────┐            │
│  │  Client Layer    │     │  Client Layer        │            │
│  │  NotionClient    │     │  SupabaseClient      │            │
│  └────────┬────────┘     └─────────┬───────────┘            │
└───────────┼─────────────────────────┼────────────────────────┘
            │                         │
   ┌────────┴────────┐     ┌─────────┴───────────┐
   │   Notion API     │     │   Supabase           │
   │   (읽기 전용)     │     │   (PostgreSQL + Auth) │
   └─────────────────┘     └─────────────────────┘
```

## 3. API 엔드포인트

| Method | Path | 설명 | Repository |
|--------|------|------|-----------|
| GET | `/api/instructors` | 강사 목록 | InstructorRepository |
| POST | `/api/instructors` | 강사 등록 | InstructorRepository |
| GET | `/api/instructors/{id}` | 강사 상세 | InstructorRepository |
| PUT | `/api/instructors/{id}` | 강사 수정 | InstructorRepository |
| DELETE | `/api/instructors/{id}` | 강사 삭제 | InstructorRepository |
| POST | `/api/courses/sync` | Notion에서 교육 동기화 | CourseRepository (Notion + Supabase) |
| GET | `/api/courses` | 교육 목록 | CourseRepository (Supabase) |
| GET | `/api/courses/{id}` | 교육 상세 + 날짜 | CourseRepository + CourseDateRepository |
| POST | `/api/courses/{id}/dates` | 교육 날짜 등록 | CourseDateRepository |
| DELETE | `/api/course-dates/{id}` | 교육 날짜 삭제 | CourseDateRepository |
| GET | `/api/assignments` | 배정 목록 (필터: 기간, 강사, 교육) | AssignmentRepository |
| POST | `/api/assignments` | 강사 배정 | AssignmentRepository |
| DELETE | `/api/assignments/{id}` | 배정 해제 | AssignmentRepository |
| GET | `/api/calendar` | 캘린더 데이터 (기간별) | AssignmentRepository + CourseDateRepository |

## 4. 소스코드 디렉토리 구조

```
backend/
├── main.py                          # FastAPI app, 라우터 등록
├── config.py                        # 환경변수, 설정
├── dependencies.py                  # Depends() 팩토리 (DI 구성)
├── requirements.txt
├── Procfile                         # Railway 배포
│
├── routers/
│   ├── instructors.py
│   ├── courses.py
│   ├── assignments.py
│   └── calendar.py
│
├── services/
│   ├── instructor_service.py
│   ├── course_service.py
│   ├── course_sync_service.py       # Notion → Supabase 동기화
│   ├── assignment_service.py
│   └── calendar_service.py
│
├── repositories/
│   ├── course_repository.py         # ABC
│   ├── instructor_repository.py     # ABC
│   ├── assignment_repository.py     # ABC
│   ├── course_date_repository.py    # ABC
│   └── impl/
│       ├── notion_course_repository.py      # Notion API → 교육 조회
│       ├── supabase_course_repository.py    # 로컬 캐시 CRUD
│       ├── supabase_instructor_repository.py
│       ├── supabase_assignment_repository.py
│       └── supabase_course_date_repository.py
│
├── clients/
│   ├── notion_client.py             # ABC
│   ├── supabase_client.py           # ABC
│   └── impl/
│       ├── notion_client_impl.py    # requests 기반 Notion API 호출
│       └── supabase_client_impl.py  # supabase-py 기반
│
├── schemas/                         # Pydantic 모델
│   ├── instructor.py
│   ├── course.py
│   ├── assignment.py
│   └── calendar.py
│
└── tests/
    ├── conftest.py                  # Fake 주입, app fixture
    ├── fakes/
    │   ├── fake_notion_course_repository.py
    │   ├── fake_instructor_repository.py
    │   ├── fake_assignment_repository.py
    │   └── fake_course_date_repository.py
    ├── test_assignments.py          # 중복 배정 차단 등
    ├── test_courses.py
    ├── test_instructors.py
    └── test_calendar.py

frontend/
├── index.html
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.js
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/                         # API 호출 함수
    │   ├── instructors.ts
    │   ├── courses.ts
    │   ├── assignments.ts
    │   └── calendar.ts
    ├── components/                   # 공통 UI 컴포넌트
    ├── pages/
    │   ├── Dashboard.tsx
    │   ├── Instructors.tsx
    │   ├── Courses.tsx
    │   ├── Assignments.tsx
    │   └── Calendar.tsx
    ├── hooks/                        # 커스텀 훅
    ├── lib/
    │   └── supabase.ts              # Supabase 클라이언트 초기화
    └── types/                        # TypeScript 타입
```

## 5. Repository 인터페이스 설계

### 5.1 CourseRepository (ABC)

```python
from abc import ABC, abstractmethod

class CourseRepository(ABC):
    """교육 과정 조회 인터페이스"""

    @abstractmethod
    async def list_courses(self, filters: dict | None = None) -> list[dict]:
        """교육 목록 조회"""
        ...

    @abstractmethod
    async def get_course(self, course_id: str) -> dict | None:
        """교육 상세 조회"""
        ...
```

**구현체:**
- `NotionCourseRepository` — Notion API에서 교육 목록/상세 조회 (동기화 소스)
- `SupabaseCourseRepository` — 로컬 캐시 CRUD (upsert, 목록, 상세)

### 5.2 InstructorRepository (ABC)

```python
class InstructorRepository(ABC):

    @abstractmethod
    async def list_instructors(self, is_active: bool | None = None) -> list[dict]:
        ...

    @abstractmethod
    async def get_instructor(self, instructor_id: str) -> dict | None:
        ...

    @abstractmethod
    async def create_instructor(self, data: dict) -> dict:
        ...

    @abstractmethod
    async def update_instructor(self, instructor_id: str, data: dict) -> dict:
        ...

    @abstractmethod
    async def delete_instructor(self, instructor_id: str) -> bool:
        ...
```

### 5.3 AssignmentRepository (ABC)

```python
class AssignmentRepository(ABC):

    @abstractmethod
    async def list_assignments(self, filters: dict | None = None) -> list[dict]:
        ...

    @abstractmethod
    async def create_assignment(self, data: dict) -> dict:
        """배정 생성. UNIQUE 위반 시 예외 발생."""
        ...

    @abstractmethod
    async def delete_assignment(self, assignment_id: str) -> bool:
        ...
```

### 5.4 CourseDateRepository (ABC)

```python
class CourseDateRepository(ABC):

    @abstractmethod
    async def list_dates_by_course(self, course_id: str) -> list[dict]:
        ...

    @abstractmethod
    async def create_dates(self, course_id: str, dates: list[dict]) -> list[dict]:
        ...

    @abstractmethod
    async def delete_date(self, date_id: str) -> bool:
        ...
```

## 6. Client 인터페이스 설계

### 6.1 NotionClient (ABC)

```python
class NotionClient(ABC):
    """Notion API 호출 인터페이스"""

    @abstractmethod
    async def query_database(self, database_id: str, filters: dict | None = None) -> list[dict]:
        """Notion DB 쿼리"""
        ...

    @abstractmethod
    async def get_page(self, page_id: str) -> dict:
        """Notion 페이지 속성 조회"""
        ...
```

**구현체:** `NotionClientImpl` — `requests` 기반, 기존 `notion-lecture-mcp`의 API 패턴 재활용

### 6.2 SupabaseClient (ABC)

```python
class SupabaseClient(ABC):
    """Supabase 호출 인터페이스"""

    @abstractmethod
    def table(self, table_name: str):
        """테이블 쿼리 빌더 반환"""
        ...
```

**구현체:** `SupabaseClientImpl` — `supabase-py` 기반

## 7. 의존성 주입 (DI)

```python
# dependencies.py
from functools import lru_cache

def get_notion_client() -> NotionClient:
    return NotionClientImpl(token=settings.NOTION_TOKEN)

def get_supabase_client() -> SupabaseClient:
    return SupabaseClientImpl(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)

def get_course_repository(client=Depends(get_supabase_client)) -> CourseRepository:
    return SupabaseCourseRepository(client)

def get_notion_course_repository(client=Depends(get_notion_client)) -> CourseRepository:
    return NotionCourseRepository(client, database_id=settings.NOTION_DB_LECTURE)

def get_instructor_repository(client=Depends(get_supabase_client)) -> InstructorRepository:
    return SupabaseInstructorRepository(client)

def get_assignment_repository(client=Depends(get_supabase_client)) -> AssignmentRepository:
    return SupabaseAssignmentRepository(client)
```

**라우터에서 사용:**
```python
@router.post("/courses/sync")
async def sync_courses(
    notion_repo: CourseRepository = Depends(get_notion_course_repository),
    local_repo: CourseRepository = Depends(get_course_repository),
):
    ...
```

## 8. Notion 동기화 흐름

```
1. 관리자 → POST /api/courses/sync
2. CourseSyncService 호출
3. NotionCourseRepository.list_courses()
   → NotionClient.query_database(DB_LECTURE_DASHBOARD)
   → Notion API 응답을 파싱하여 교육 목록 반환
4. 각 교육에 대해:
   SupabaseCourseRepository.upsert(notion_page_id, title, status, ...)
5. synced_at 갱신
6. 응답: { synced: 15, created: 3, updated: 12 }
```

## 9. 테스트 전략

### 9.1 Fake Repository

```python
# tests/fakes/fake_assignment_repository.py
class FakeAssignmentRepository(AssignmentRepository):
    def __init__(self):
        self._store: dict[str, dict] = {}
        self._unique_index: set[tuple[str, str]] = set()  # (instructor_id, date)

    async def create_assignment(self, data: dict) -> dict:
        key = (data["instructor_id"], str(data["date"]))
        if key in self._unique_index:
            raise DuplicateAssignmentError(f"강사 {key[0]}는 {key[1]}에 이미 배정됨")
        self._unique_index.add(key)
        assignment = {"id": str(uuid4()), **data}
        self._store[assignment["id"]] = assignment
        return assignment
```

### 9.2 테스트 DI 구성

```python
# tests/conftest.py
@pytest.fixture
def app():
    from main import create_app
    app = create_app()
    app.dependency_overrides[get_assignment_repository] = lambda: FakeAssignmentRepository()
    app.dependency_overrides[get_instructor_repository] = lambda: FakeInstructorRepository()
    app.dependency_overrides[get_course_repository] = lambda: FakeSupabaseCourseRepository()
    return app
```

### 9.3 핵심 테스트 케이스

| 테스트 | 검증 내용 |
|--------|----------|
| `test_create_assignment_success` | 정상 배정 생성 |
| `test_duplicate_assignment_blocked` | 같은 강사+같은 날짜 → 에러 |
| `test_same_day_different_instructor_ok` | 같은 날짜 다른 강사 → 성공 |
| `test_sync_courses_from_notion` | Notion 동기화 후 로컬 캐시 갱신 확인 |
| `test_instructor_crud` | 강사 등록/수정/삭제 |
| `test_calendar_view` | 기간별 캘린더 데이터 반환 |

## 10. 환경변수

| 변수 | 설명 | 예시 |
|------|------|------|
| `SUPABASE_URL` | Supabase 프로젝트 URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase 서비스 키 | `eyJ...` |
| `NOTION_TOKEN` | Notion Integration 토큰 | `ntn_...` |
| `NOTION_DB_LECTURE` | Notion 강의 대시보드 DB ID | `abc123...` |
| `PORT` | 서버 포트 (Railway 자동 주입) | `8000` |
