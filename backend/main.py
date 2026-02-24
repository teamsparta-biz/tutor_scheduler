from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from exceptions import AuthenticationError, AuthorizationError
from routers import instructors, courses, assignments, calendar, availability, auth


def create_app() -> FastAPI:
    app = FastAPI(title="Instructor Scheduler API")

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

    return app


app = create_app()
