"""Karobar Assistant API entry point.

Configures the FastAPI application, serves the built frontend in production,
and mounts the API routes defined in backend/routes.py.
"""
from pathlib import Path
from contextlib import asynccontextmanager
import os
import sys

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.persistence import init as init_persistence
from backend.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_persistence()
    yield


app = FastAPI(title="Karobar Assistant API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ImmutableStaticFiles(StaticFiles):
    """Serve versioned build assets with long-lived immutable caching."""

    async def get_response(self, path: str, scope):
        response = await super().get_response(path, scope)
        if response.status_code < 400:
            response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return response


def _frontend_dist_dir() -> Path | None:
    """Locate the built frontend (used by desktop/production deployments)."""
    candidates: list[Path] = []
    if getattr(sys, "frozen", False) and getattr(sys, "_MEIPASS", None):
        candidates.append(Path(sys._MEIPASS) / "frontend_dist")
    if os.environ.get("KAROBAR_FRONTEND_DIR"):
        candidates.append(Path(os.environ["KAROBAR_FRONTEND_DIR"]))
    candidates.append(Path(__file__).resolve().parent.parent / "frontend" / "dist")
    for candidate in candidates:
        if (candidate / "index.html").exists():
            return candidate
    return None


def _index_response(index_file: Path) -> FileResponse:
    """Serve index.html with no-cache so browsers always revalidate after a rebuild."""
    return FileResponse(index_file, headers={"Cache-Control": "no-cache"})


def _index_file() -> Path | None:
    dist = _frontend_dist_dir()
    if dist is None:
        return None
    return dist / "index.html"


def _serve_index():
    index_file = _index_file()
    if index_file is None:
        return {"message": "Karobar Assistant backend is running. Frontend not built yet."}
    return _index_response(index_file)


app.include_router(router)


@app.get("/")
def root():
    return _serve_index()


_dist_dir = _frontend_dist_dir()
if _dist_dir is not None and (_dist_dir / "assets").exists():
    app.mount("/assets", ImmutableStaticFiles(directory=_dist_dir / "assets"), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa(full_path: str):
    if full_path.startswith("api/"):
        return {"message": "Not found"}
    dist = _frontend_dist_dir()
    if dist is not None:
        file_path = (dist / full_path).resolve()
        if file_path.is_file():
            return FileResponse(file_path)
        index_file = _index_file()
        if index_file is not None:
            return _index_response(index_file)
    return {"message": "Karobar Assistant backend is running. Frontend not built yet."}
