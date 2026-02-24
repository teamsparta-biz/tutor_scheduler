-- instructors: Notion 동기화용 page_id
ALTER TABLE instructors ADD COLUMN IF NOT EXISTS notion_page_id text UNIQUE;

-- courses: 배정 상태 추적
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assignment_status text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS total_dates integer DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assigned_dates integer DEFAULT 0;
