from fastapi import Depends

from config import settings
from clients.notion_client import NotionClient
from clients.supabase_client import SupabaseClient
from clients.impl.notion_client_impl import NotionClientImpl
from clients.impl.supabase_client_impl import SupabaseClientImpl
from repositories.instructor_repository import InstructorRepository
from repositories.impl.supabase_instructor_repository import SupabaseInstructorRepository
from repositories.course_repository import CourseRepository
from repositories.impl.supabase_course_repository import SupabaseCourseRepository
from repositories.impl.notion_course_repository import NotionCourseRepository
from repositories.course_date_repository import CourseDateRepository
from repositories.impl.supabase_course_date_repository import SupabaseCourseDateRepository
from repositories.assignment_repository import AssignmentRepository
from repositories.impl.supabase_assignment_repository import SupabaseAssignmentRepository
from services.instructor_service import InstructorService
from services.course_service import CourseService
from services.course_sync_service import CourseSyncService
from services.assignment_service import AssignmentService
from services.calendar_service import CalendarService
from services.notion_sync_service import NotionSyncService
from services.instructor_course_service import InstructorCourseService
from repositories.availability_repository import AvailabilityRepository
from services.availability_service import AvailabilityService


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


def get_notion_course_repository(
    client: NotionClient = Depends(get_notion_client),
) -> CourseRepository:
    return NotionCourseRepository(client, database_id=settings.NOTION_DB_LECTURE)


def get_course_service(
    repo: CourseRepository = Depends(get_course_repository),
    date_repo: CourseDateRepository = Depends(get_course_date_repository),
) -> CourseService:
    return CourseService(repo, date_repo)


def get_course_sync_service(
    notion_repo: CourseRepository = Depends(get_notion_course_repository),
    local_repo: CourseRepository = Depends(get_course_repository),
) -> CourseSyncService:
    return CourseSyncService(notion_repo, local_repo)


# --- Assignment ---

def get_assignment_repository(
    client: SupabaseClient = Depends(get_supabase_client),
) -> AssignmentRepository:
    return SupabaseAssignmentRepository(client)


def get_availability_repository() -> AvailabilityRepository:
    raise NotImplementedError("Override in dev_main or provide real implementation")


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
