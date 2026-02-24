-- auth.users INSERT 시 profiles 자동 생성 트리거
-- @teamsparta.co → role='admin', 그 외 → role='instructor'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _role text;
    _email text;
BEGIN
    _email := NEW.email;

    IF _email LIKE '%@teamsparta.co' THEN
        _role := 'admin';
    ELSE
        _role := 'instructor';
    END IF;

    INSERT INTO public.profiles (user_id, role, display_name)
    VALUES (
        NEW.id,
        _role,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(_email, '@', 1))
    )
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
