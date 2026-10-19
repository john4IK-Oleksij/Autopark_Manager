from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from database import engine
from routers.buses import router as buses_router
from routers.companies import router as companies_router
from routers.driver_routes import router as driver_routes_router
from routers.drivers import router as drivers_router
from routers.routes import router as routes_router

app = FastAPI(
    title="Autopark API",
    description="API для керування автобусним автопарком м.Одеси",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Accept", "Content-Type"],
)

app.include_router(companies_router)
app.include_router(buses_router)
app.include_router(drivers_router)
app.include_router(routes_router)
app.include_router(driver_routes_router)

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    return JSONResponse(
        status_code=409,
        content={"detail": "Порушено цілісність даних"},
    )


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get(
    "/db-check",
    responses={503: {"description": "Database connection failed"}},
)
def check_database():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"database": "connected"}
    except SQLAlchemyError:
        raise HTTPException(
            status_code=503,
            detail="Database connection failed",
        )


# Статичні ресурси
for folder in ("css", "js", "static"):
    folder_path = FRONTEND_DIR / folder
    if folder_path.is_dir():
        app.mount(
            f"/{folder}",
            StaticFiles(directory=str(folder_path)),
            name=folder,
        )

# Головна HTML-сторінка
@app.get("/", include_in_schema=False)
def serve_index():
    return FileResponse(str(FRONTEND_DIR / "index.html"))


# Інші HTML-сторінки
@app.get("/{page_name}.html", include_in_schema=False)
def serve_html(page_name: str):
    page_path = (FRONTEND_DIR / f"{page_name}.html").resolve()

    if page_path.parent != FRONTEND_DIR.resolve() or not page_path.is_file():
        return FileResponse(
            str(FRONTEND_DIR / "404.html"),
            status_code=404,
        )

    return FileResponse(str(page_path))


    



