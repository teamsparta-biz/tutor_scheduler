import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# backend/ 를 sys.path에 추가
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from main import create_app


@pytest.fixture
def app():
    app = create_app()
    # feature 태스크에서 dependency_overrides 추가
    # app.dependency_overrides[get_assignment_repository] = lambda: FakeAssignmentRepository()
    # app.dependency_overrides[get_instructor_repository] = lambda: FakeInstructorRepository()
    # app.dependency_overrides[get_course_repository] = lambda: FakeCourseRepository()
    return app


@pytest.fixture
def client(app):
    return TestClient(app)
