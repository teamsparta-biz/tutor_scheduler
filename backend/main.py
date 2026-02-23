from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import instructors, courses, assignments, calendar, availability


def create_app() -> FastAPI:
    app = FastAPI(title="Instructor Scheduler API")

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

    return app


app = create_app()
