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

-- assignments: 전체 조회 허용, 관리자만 CUD
CREATE POLICY assignments_select ON assignments
    FOR SELECT USING (true);
CREATE POLICY assignments_insert ON assignments
    FOR INSERT WITH CHECK (get_user_role() = 'admin');
CREATE POLICY assignments_update ON assignments
    FOR UPDATE USING (get_user_role() = 'admin');
CREATE POLICY assignments_delete ON assignments
    FOR DELETE USING (get_user_role() = 'admin');
