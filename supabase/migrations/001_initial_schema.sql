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
