"""개발용 서버 — Notion 동기화 기반 (Supabase 불필요)."""

from contextlib import asynccontextmanager

import jwt
from jwt import PyJWKClient
from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from exceptions import AuthenticationError, AuthorizationError
from routers import instructors, courses, assignments, calendar, availability, auth
from dependencies import (
    get_instructor_repository,
    get_course_repository,
    get_course_date_repository,
    get_assignment_repository,
    get_availability_repository,
    get_current_user,
)
from schemas.auth import UserProfile
from tests.fakes.fake_instructor_repository import FakeInstructorRepository
from tests.fakes.fake_course_repository import FakeCourseRepository
from tests.fakes.fake_course_date_repository import FakeCourseDateRepository
from tests.fakes.fake_assignment_repository import FakeAssignmentRepository
from tests.fakes.fake_availability_repository import FakeAvailabilityRepository
from clients.impl.notion_client_impl import NotionClientImpl
from services.notion_sync_service import NotionSyncService

# Supabase JWT 검증용
_bearer_scheme = HTTPBearer(auto_error=False)
_jwks_client = PyJWKClient(
    f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)

# ── 공유 인스턴스 ──

fake_instructor_repo = FakeInstructorRepository()
fake_course_repo = FakeCourseRepository()
fake_course_date_repo = FakeCourseDateRepository()
fake_assignment_repo = FakeAssignmentRepository()
fake_availability_repo = FakeAvailabilityRepository()

# 개발용 기본 admin (토큰 없을 때 폴백)
_dev_admin = UserProfile(id="dev-profile", user_id="dev-user", role="admin", email="dev@test.com")


async def _dev_get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> UserProfile:
    """Dev: JWT 이메일 → 강사 auth_email 매칭. 실패 시 admin 폴백."""
    if not credentials:
        return _dev_admin

    # JWT 디코딩으로 이메일 추출
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(credentials.credentials)
        payload = jwt.decode(
            credentials.credentials,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        email = payload.get("email", "")
        user_id = payload.get("sub", "dev-user")
    except Exception:
        return _dev_admin

    # @teamsparta.co → admin
    if email.endswith("@teamsparta.co"):
        return UserProfile(
            id=f"dev-admin-{user_id[:8]}",
            user_id=user_id,
            email=email,
            role="admin",
        )

    # 강사 매칭: auth_email 또는 email 일치
    all_instructors = await fake_instructor_repo.list_instructors()
    for inst in all_instructors:
        if (inst.get("auth_email") == email) or (inst.get("email") == email):
            return UserProfile(
                id=f"dev-inst-{inst['id'][:8]}",
                user_id=user_id,
                email=email,
                role="instructor",
                instructor_id=inst["id"],
                display_name=inst.get("name"),
            )

    # 매칭 안됨 → 403
    raise AuthorizationError(
        "접근 권한이 없습니다. instructors 테이블에 등록된 이메일만 사용할 수 있습니다."
    )


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


@app.exception_handler(AuthenticationError)
async def authentication_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(status_code=401, content={"detail": str(exc)})


@app.exception_handler(AuthorizationError)
async def authorization_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(status_code=403, content={"detail": str(exc)})


@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(auth.router, prefix="/api")
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
app.dependency_overrides[get_current_user] = _dev_get_current_user
