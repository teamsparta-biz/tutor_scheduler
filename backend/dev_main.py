"""개발용 서버 — Notion 동기화 기반 (Supabase 불필요)."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import instructors, courses, assignments, calendar, availability
from dependencies import (
    get_instructor_repository,
    get_course_repository,
    get_course_date_repository,
    get_assignment_repository,
    get_availability_repository,
)
from tests.fakes.fake_instructor_repository import FakeInstructorRepository
from tests.fakes.fake_course_repository import FakeCourseRepository
from tests.fakes.fake_course_date_repository import FakeCourseDateRepository
from tests.fakes.fake_assignment_repository import FakeAssignmentRepository
from tests.fakes.fake_availability_repository import FakeAvailabilityRepository
from clients.impl.notion_client_impl import NotionClientImpl
from services.notion_sync_service import NotionSyncService

# ── 공유 인스턴스 ──

fake_instructor_repo = FakeInstructorRepository()
fake_course_repo = FakeCourseRepository()
fake_course_date_repo = FakeCourseDateRepository()
fake_assignment_repo = FakeAssignmentRepository()
fake_availability_repo = FakeAvailabilityRepository()


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.NOTION_TOKEN and settings.NOTION_DB_TUTOR:
        try:
            sync_service = NotionSyncService(
                client=NotionClientImpl(token=settings.NOTION_TOKEN),
                instructor_repo=fake_instructor_repo,
                course_repo=fake_course_repo,
                course_date_repo=fake_course_date_repo,
                assignment_repo=fake_assignment_repo,
                settings=settings,
            )
            await sync_service.sync_all()
        except Exception as e:
            print(f"[dev] Notion sync failed: {e}")
            print("[dev] Starting with empty data")
    else:
        print("[dev] Notion credentials not configured, starting with empty data")
    yield


app = FastAPI(title="Instructor Scheduler API (dev)", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(instructors.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(assignments.router, prefix="/api")
app.include_router(calendar.router, prefix="/api")
app.include_router(availability.router, prefix="/api")

app.dependency_overrides[get_instructor_repository] = lambda: fake_instructor_repo
app.dependency_overrides[get_course_repository] = lambda: fake_course_repo
app.dependency_overrides[get_course_date_repository] = lambda: fake_course_date_repo
app.dependency_overrides[get_assignment_repository] = lambda: fake_assignment_repo
app.dependency_overrides[get_availability_repository] = lambda: fake_availability_repo
