
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Company, Driver
from schemas import DriverCreate, DriverResponse

router = APIRouter(
    prefix="/drivers",
    tags=["Drivers"],
)


@router.get("", response_model=list[DriverResponse])
def get_drivers(db: Session = Depends(get_db)):
    statement = select(Driver)
    return db.execute(statement).scalars().all()


@router.get("/{driver_id}", response_model=DriverResponse)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    statement = select(Driver).where(Driver.id == driver_id)
    driver = db.execute(statement).scalar_one_or_none()

    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    return driver


@router.post(
    "",
    response_model=DriverResponse,
    status_code=201,
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


@router.put("/{driver_id}", response_model=DriverResponse)
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


@router.delete("/{driver_id}", status_code=204)
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    result = db.execute(delete(Driver).where(Driver.id == driver_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Driver not found")
    db.commit()
    return Response(status_code=204)
