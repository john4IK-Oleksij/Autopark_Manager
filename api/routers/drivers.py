
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
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
    license_number = driver_data.license_number.strip()
    full_name = driver_data.full_name.strip()
    phone = driver_data.phone.strip()
    if not license_number or not full_name or not phone:
        raise HTTPException(
            status_code=422,
            detail="License number, full name, and phone cannot be empty",
        )
    driver = Driver(
        license_number=license_number,
        full_name=full_name,
        phone=phone,
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
