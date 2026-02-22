# DB 스키마 설계: instructor-scheduler

> Supabase (PostgreSQL) 기반. 교육 데이터는 Notion에서 동기화하여 로컬 캐시로 유지.

## 1. 데이터 소스 분리

| 데이터 | 소스 | 저장소 | 비고 |
|--------|------|--------|------|
| 교육 과정 (courses) | **Notion** | Supabase (캐시) | 읽기 전용, Notion API 경유 동기화 |
| 강사 프로필 | Supabase | `instructors` 테이블 | 직접 CRUD |
| 교육 날짜 | Supabase | `course_dates` 테이블 | Notion course 참조 |
| 강사 배정 | Supabase | `assignments` 테이블 | course_dates + instructors FK |
| 사용자/인증 | Supabase Auth | `profiles` 테이블 | Auth 확장 |

## 2. ERD

```
┌─────────────┐       ┌─────────────────┐
│   profiles   │       │   instructors    │
├─────────────┤       ├─────────────────┤
│ id (PK)      │       │ id (PK)          │
│ user_id (FK) │──┐    │ name             │
│ role          │  │    │ email            │
│ display_name  │  │    │ phone            │
│ created_at    │  │    │ specialty        │
│ updated_at    │  │    │ is_active        │
└─────────────┘  │    │ profile_id (FK)  │──→ profiles.id
                  │    │ created_at       │
                  │    │ updated_at       │
                  │    └────────┬────────┘
                  │             │
                  │             │ 1:N
                  │             ▼
┌─────────────┐  │    ┌─────────────────┐
│   courses    │  │    │  assignments     │
├─────────────┤  │    ├─────────────────┤
│ id (PK)      │  │    │ id (PK)          │
│ notion_page_id│  │    │ course_date_id   │──→ course_dates.id
│ title         │  │    │ instructor_id    │──→ instructors.id
│ status        │  │    │ date (denorm)    │
│ target        │  │    │ class_name       │
│ synced_at     │  │    │ created_by       │──→ profiles.id
│ created_at    │  │    │ created_at       │
│ updated_at    │  │    │ updated_at       │
└──────┬──────┘  │    └─────────────────┘
       │          │    UNIQUE(instructor_id, date)
       │ 1:N      │
       ▼          │
┌─────────────────┐
│  course_dates    │
├─────────────────┤
│ id (PK)          │
│ course_id (FK)   │──→ courses.id
│ date             │
│ day_number       │
│ created_at       │
│ updated_at       │
└─────────────────┘
```

## 3. 테이블 상세

### 3.1 `profiles` — 사용자 프로필

Supabase Auth의 `auth.users`를 확장하는 테이블.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `user_id` | `uuid` | UNIQUE, NOT NULL, FK → auth.users(id) | Supabase Auth 사용자 |
| `role` | `text` | NOT NULL, DEFAULT 'instructor' | 'admin' 또는 'instructor' |
| `display_name` | `text` | | 표시 이름 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### 3.2 `instructors` — 강사 프로필

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `name` | `text` | NOT NULL | 강사 이름 |
| `email` | `text` | UNIQUE | 이메일 |
| `phone` | `text` | | 연락처 |
| `specialty` | `text` | | 전문 분야 |
| `is_active` | `boolean` | NOT NULL, DEFAULT true | 활성 상태 |
| `profile_id` | `uuid` | FK → profiles(id), NULLABLE | 로그인 가능한 강사만 연결 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### 3.3 `courses` — 교육 과정 (Notion 캐시)

Notion 강의 대시보드의 로컬 캐시. `notion_page_id`로 원본과 매핑.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `notion_page_id` | `text` | UNIQUE, NOT NULL | Notion 페이지 ID |
| `title` | `text` | NOT NULL | 교육 과정명 |
| `status` | `text` | | Notion 상태 (예: 진행중, 완료) |
| `target` | `text` | | 교육 대상 |
| `synced_at` | `timestamptz` | NOT NULL, DEFAULT now() | 마지막 동기화 시각 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

### 3.4 `course_dates` — 교육 개별 날짜

교육 과정의 각 날짜를 개별 레코드로 관리. 며칠짜리 교육은 여러 행.

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `course_id` | `uuid` | NOT NULL, FK → courses(id) ON DELETE CASCADE | |
| `date` | `date` | NOT NULL | 교육 날짜 |
| `day_number` | `integer` | NOT NULL, DEFAULT 1 | N일차 (예: 3일 교육의 2일차) |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**제약:** `UNIQUE(course_id, date)` — 같은 교육의 같은 날짜 중복 방지

### 3.5 `assignments` — 강사 배정

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `course_date_id` | `uuid` | NOT NULL, FK → course_dates(id) ON DELETE CASCADE | |
| `instructor_id` | `uuid` | NOT NULL, FK → instructors(id) ON DELETE CASCADE | |
| `date` | `date` | NOT NULL | 비정규화: course_dates.date 복사 (UNIQUE 제약용) |
| `class_name` | `text` | | 반 이름 (A반, B반 등) |
| `created_by` | `uuid` | FK → profiles(id) | 배정한 관리자 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | DEFAULT now() | |

**핵심 제약:** `UNIQUE(instructor_id, date)` — **같은 강사의 같은 날 중복 배정 방지** (업무 규칙 R1)

> `date` 컬럼을 비정규화한 이유: `instructor_id + date` UNIQUE 제약을 단일 테이블에서 걸기 위함. course_dates 조인 없이 제약 검사 가능.

## 4. DDL

```sql
-- 1. profiles
CREATE TABLE profiles (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        text NOT NULL DEFAULT 'instructor'
                CHECK (role IN ('admin', 'instructor')),
    display_name text,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- 2. instructors
CREATE TABLE instructors (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    email       text UNIQUE,
    phone       text,
    specialty   text,
    is_active   boolean NOT NULL DEFAULT true,
    profile_id  uuid REFERENCES profiles(id) ON DELETE SET NULL,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

-- 3. courses (Notion 캐시)
CREATE TABLE courses (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    notion_page_id  text UNIQUE NOT NULL,
    title           text NOT NULL,
    status          text,
    target          text,
    synced_at       timestamptz NOT NULL DEFAULT now(),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- 4. course_dates
CREATE TABLE course_dates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id   uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    date        date NOT NULL,
    day_number  integer NOT NULL DEFAULT 1,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now(),
    UNIQUE (course_id, date)
);

-- 5. assignments
CREATE TABLE assignments (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_date_id  uuid NOT NULL REFERENCES course_dates(id) ON DELETE CASCADE,
    instructor_id   uuid NOT NULL REFERENCES instructors(id) ON DELETE CASCADE,
    date            date NOT NULL,
    class_name      text,
    created_by      uuid REFERENCES profiles(id),
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now(),
    UNIQUE (instructor_id, date)
);

-- 인덱스
CREATE INDEX idx_assignments_date ON assignments(date);
CREATE INDEX idx_assignments_instructor ON assignments(instructor_id);
CREATE INDEX idx_course_dates_course ON course_dates(course_id);
CREATE INDEX idx_course_dates_date ON course_dates(date);
CREATE INDEX idx_courses_notion_page_id ON courses(notion_page_id);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_instructors_updated_at
    BEFORE UPDATE ON instructors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_courses_updated_at
    BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_course_dates_updated_at
    BEFORE UPDATE ON course_dates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_assignments_updated_at
    BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 5. RLS (Row Level Security) 정책

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 헬퍼: 현재 사용자의 role 조회
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
    SELECT role FROM profiles WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- profiles: 본인 프로필 읽기, 관리자 전체 접근
CREATE POLICY profiles_select ON profiles
    FOR SELECT USING (user_id = auth.uid() OR get_user_role() = 'admin');
CREATE POLICY profiles_update ON profiles
    FOR UPDATE USING (user_id = auth.uid());

-- instructors: 전체 조회 허용, 관리자만 CUD
CREATE POLICY instructors_select ON instructors
    FOR SELECT USING (true);
CREATE POLICY instructors_insert ON instructors
    FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY instructors_update ON instructors
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY instructors_delete ON instructors
    FOR DELETE USING (get_user_role() = 'admin');

-- courses: 전체 조회 허용, 관리자만 CUD (동기화)
CREATE POLICY courses_select ON courses
    FOR SELECT USING (true);
CREATE POLICY courses_insert ON courses
    FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY courses_update ON courses
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY courses_delete ON courses
    FOR DELETE USING (get_user_role() = 'admin');

-- course_dates: 전체 조회 허용, 관리자만 CUD
CREATE POLICY course_dates_select ON course_dates
    FOR SELECT USING (true);
CREATE POLICY course_dates_insert ON course_dates
    FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY course_dates_update ON course_dates
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY course_dates_delete ON course_dates
    FOR DELETE USING (get_user_role() = 'admin');

-- assignments: 전체 조회 허용 (강사는 RLS 대신 API 레벨에서 본인 필터링), 관리자만 CUD
CREATE POLICY assignments_select ON assignments
    FOR SELECT USING (true);
CREATE POLICY assignments_insert ON assignments
    FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY assignments_update ON assignments
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY assignments_delete ON assignments
    FOR DELETE USING (get_user_role() = 'admin');
```

## 6. Notion 동기화 흐름

```
관리자가 "교육 동기화" 클릭
  → API: POST /api/courses/sync
  → NotionCourseRepository.list_courses() — Notion API에서 교육 목록 조회
  → 각 교육에 대해:
      courses 테이블에 UPSERT (notion_page_id 기준)
      synced_at 갱신
  → 응답: 동기화된 교육 수, 신규/갱신 건수
```
