-- courses: 담당 매니저(lecture_PIC) + 영업 담당(sales_PIC)
ALTER TABLE courses ADD COLUMN IF NOT EXISTS manager text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS manager_email text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sales_rep text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS sales_rep_email text;
