import logging
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import jwt
from jwt import PyJWKClient

from config import settings

logger = logging.getLogger(__name__)

# Supabase JWKS 엔드포인트에서 공개키를 가져오는 클라이언트 (캐시 내장)
_jwks_client = PyJWKClient(
    f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)
from exceptions import AuthenticationError, AuthorizationError
from clients.notion_client import NotionClient
from clients.supabase_client import SupabaseClient
from clients.impl.notion_client_impl import NotionClientImpl
from clients.impl.supabase_client_impl import SupabaseClientImpl
from repositories.instructor_repository import InstructorRepository
from repositories.impl.supabase_instructor_repository import SupabaseInstructorRepository
from repositories.course_repository import CourseRepository
from repositories.impl.supabase_course_repository import SupabaseCourseRepository
from repositories.course_date_repository import CourseDateRepository
from repositories.impl.supabase_course_date_repository import SupabaseCourseDateRepository
from repositories.assignment_repository import AssignmentRepository
from repositories.impl.supabase_assignment_repository import SupabaseAssignmentRepository
from services.instructor_service import InstructorService
from services.course_service import CourseService
from services.assignment_service import AssignmentService
from services.calendar_service import CalendarService
from services.notion_sync_service import NotionSyncService
from services.instructor_course_service import InstructorCourseService
from repositories.availability_repository import AvailabilityRepository
from repositories.impl.supabase_availability_repository import SupabaseAvailabilityRepository
from services.availability_service import AvailabilityService
from repositories.profile_repository import ProfileRepository
from repositories.impl.supabase_profile_repository import SupabaseProfileRepository
from services.auth_service import AuthService
from schemas.auth import UserProfile

_bearer_scheme = HTTPBearer(auto_error=False)


def get_notion_client() -> NotionClient:
    return NotionClientImpl(token=settings.NOTION_TOKEN)


def get_supabase_client() -> SupabaseClient:
    return SupabaseClientImpl(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)


# --- Instructor ---

def get_instructor_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> InstructorRepository:
    return SupabaseInstructorRepository(client)


def get_instructor_service(
    repo: InstructorRepository = Depends(get_instructor_repository),
) -> InstructorService:
    return InstructorService(repo)


# --- Course ---

def get_course_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> CourseRepository:
    return SupabaseCourseRepository(client)


def get_course_date_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> CourseDateRepository:
    return SupabaseCourseDateRepository(client)


def get_course_service(
    repo: CourseRepository = Depends(get_course_repository),
    date_repo: CourseDateRepository = Depends(get_course_date_repository),
) -> CourseService:
    return CourseService(repo, date_repo)


# --- Assignment ---

def get_assignment_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> AssignmentRepository:
    return SupabaseAssignmentRepository(client)


def get_availability_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> AvailabilityRepository:
    return SupabaseAvailabilityRepository(client)


def get_availability_service(
    repo: AvailabilityRepository = Depends(get_availability_repository),
) -> AvailabilityService:
    return AvailabilityService(repo)


def get_assignment_service(
    repo: AssignmentRepository = Depends(get_assignment_repository),
    instructor_repo: InstructorRepository = Depends(get_instructor_repository),
    availability_repo: AvailabilityRepository = Depends(get_availability_repository),
) -> AssignmentService:
    return AssignmentService(repo, instructor_repo, availability_repo)


# --- Instructor Course ---

def get_instructor_course_service(
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
    course_repo: CourseRepository = Depends(get_course_repository),
    course_date_repo: CourseDateRepository = Depends(get_course_date_repository),
) -> InstructorCourseService:
    return InstructorCourseService(assignment_repo, course_repo, course_date_repo)


# --- Notion Sync ---

def get_notion_sync_service(
    client: NotionClient = Depends(get_notion_client),
    instructor_repo: InstructorRepository = Depends(get_instructor_repository),
    course_repo: CourseRepository = Depends(get_course_repository),
    course_date_repo: CourseDateRepository = Depends(get_course_date_repository),
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
) -> NotionSyncService:
    return NotionSyncService(
        client=client,
        instructor_repo=instructor_repo,
        course_repo=course_repo,
        course_date_repo=course_date_repo,
        assignment_repo=assignment_repo,
        settings=settings,
    )


# --- Calendar ---

def get_calendar_service(
    assignment_repo: AssignmentRepository = Depends(get_assignment_repository),
    course_date_repo: CourseDateRepository = Depends(get_course_date_repository),
    course_repo: CourseRepository = Depends(get_course_repository),
    instructor_repo: InstructorRepository = Depends(get_instructor_repository),
) -> CalendarService:
    return CalendarService(assignment_repo, course_date_repo, course_repo, instructor_repo)


# --- Auth ---

def get_profile_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> ProfileRepository:
    return SupabaseProfileRepository(client)


def get_auth_service(
    profile_repo: ProfileRepository = Depends(get_profile_repository),
) -> AuthService:
    return AuthService(profile_repo)


# user_id → UserProfile 캐시 (서버 프로세스 수명 동안 유지, TTL 10분)
_profile_cache: dict[str, tuple[float, UserProfile]] = {}
_PROFILE_CACHE_TTL = 600  # 10분


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserProfile:
    """JWT 토큰 검증 → 프로필 조회 (캐시 적용)."""
    import time

    if not credentials:
        raise AuthenticationError("인증 토큰이 필요합니다")

    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("토큰이 만료되었습니다")
    except jwt.InvalidTokenError as e:
        logger.error("JWT 디코딩 실패: %s", e)
        raise AuthenticationError("유효하지 않은 토큰입니다")

    user_id = payload.get("sub")
    email = payload.get("email", "")
    if not user_id:
        raise AuthenticationError("토큰에 사용자 정보가 없습니다")

    # 캐시 확인
    now = time.time()
    cached = _profile_cache.get(user_id)
    if cached and (now - cached[0]) < _PROFILE_CACHE_TTL:
        return cached[1]

    # 캐시 미스 → DB 조회
    client = get_supabase_client()
    profile_repo = SupabaseProfileRepository(client)
    auth_service = AuthService(profile_repo)
    profile = await auth_service.get_or_create_profile(user_id, email)
    _profile_cache[user_id] = (now, profile)
    return profile


async def require_admin(
    user: UserProfile = Depends(get_current_user),
) -> UserProfile:
    if user.role != "admin":
        raise AuthorizationError("관리자 권한이 필요합니다")
    return user
