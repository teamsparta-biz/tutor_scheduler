from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


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

    # 라우터 등록 — feature 태스크에서 점진적 활성화
    # app.include_router(instructors.router, prefix="/api")
    # app.include_router(courses.router, prefix="/api")
    # app.include_router(assignments.router, prefix="/api")
    # app.include_router(calendar.router, prefix="/api")

    return app


app = create_app()
