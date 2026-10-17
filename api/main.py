from fastapi import FastAPI, HTTPException
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

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

app.include_router(companies_router)
app.include_router(buses_router)
app.include_router(drivers_router)
app.include_router(routes_router)
app.include_router(driver_routes_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/db-check")
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

    






