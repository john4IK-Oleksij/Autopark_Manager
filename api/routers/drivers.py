
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Company, Driver, DriverRoute, Route
from schemas import (
    DriverCreate,
    DriverPageResponse,
    DriverResponse,
    RouteResponse,
)

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"],
)


@router.get("", response_model=DriverPageResponse)
def get_drivers(
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    total = db.scalar(select(func.count()).select_from(Driver)) or 0
    statement = (
        select(Driver)
        .order_by(Driver.id)
        .limit(limit)
        .offset(offset)
    )
    items = [
        DriverResponse.model_validate(driver)
        for driver in db.execute(statement).scalars().all()
    ]
    return DriverPageResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{driver_id}",
    response_model=DriverResponse,
    responses={404: {"description": "Driver not found"}},
)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    statement = select(Driver).where(Driver.id == driver_id)
    driver = db.execute(statement).scalar_one_or_none()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    return driver


@router.get(
    "/{driver_id}/routes",
    response_model=list[RouteResponse],
    responses={404: {"description": "Driver not found"}},
)
def get_driver_routes(driver_id: int, db: Session = Depends(get_db)):
    if db.get(Driver, driver_id) is None:
        raise HTTPException(status_code=404, detail="Driver not found")

    statement = (
        select(Route)
        .join(DriverRoute, DriverRoute.route_id == Route.id)
        .where(DriverRoute.driver_id == driver_id)
        .order_by(Route.id)
    )
    return db.execute(statement).scalars().all()


@router.post(
    "",
    response_model=DriverResponse,
    status_code=201,
    responses={
        404: {"description": "Company not found"},
        409: {"description": "Driver license number already exists"},
    },
)
def create_driver(
    driver_data: DriverCreate,
    db: Session = Depends(get_db),
):
    company = db.execute(
        select(Company).where(Company.id == driver_data.company_id)
    ).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )
    driver = Driver(
        license_number=driver_data.license_number,
        full_name=driver_data.full_name,
        phone=driver_data.phone,
        company_id=driver_data.company_id,
    )

    db.add(driver)

    try:
        db.commit()
        db.refresh(driver)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Driver with this license number already exists",
        )

    return driver


@router.put(
    "/{driver_id}",
    response_model=DriverResponse,
    responses={
        404: {"description": "Driver or company not found"},
        409: {"description": "Driver license number already exists"},
    },
)
def update_driver(
    driver_id: int,
    driver_data: DriverCreate,
    db: Session = Depends(get_db),
):
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    if db.get(Company, driver_data.company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

    driver.full_name = driver_data.full_name
    driver.phone = driver_data.phone
    driver.license_number = driver_data.license_number
    driver.company_id = driver_data.company_id
    try:
        db.commit()
        db.refresh(driver)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Driver with this license number already exists",
        )
    return driver


@router.delete(
    "/{driver_id}",
    status_code=204,
    responses={
        404: {"description": "Driver not found"},
        409: {"description": "Driver has related records"},
    },
)
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.get(Driver, driver_id)
    if driver is None:
        raise HTTPException(status_code=404, detail="Driver not found")
    try:
        db.execute(delete(Driver).where(Driver.id == driver_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Driver cannot be deleted while it has related records",
        )
    return Response(status_code=204)
