
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Bus, Company
from schemas import BusCreate, BusResponse

router = APIRouter(
    prefix="/buses",
    tags=["Buses"],
)


@router.get("", response_model=list[BusResponse])
def get_buses(db: Session = Depends(get_db)):
    statement = select(Bus)
    return db.execute(statement).scalars().all()


@router.get("/{bus_id}", response_model=BusResponse)
def get_bus(bus_id: int, db: Session = Depends(get_db)):
    statement = select(Bus).where(Bus.id == bus_id)
    bus = db.execute(statement).scalar_one_or_none()
    if bus is None:
        raise HTTPException(
            status_code=404,
            detail="Bus not found",
        )

    return bus


@router.post("", response_model=BusResponse,
    status_code=201,
)
def create_bus(
    bus_data: BusCreate,
    db: Session = Depends(get_db),
):
    company = db.execute(
        select(Company).where(Company.id == bus_data.company_id)
    ).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )
    plate_number = bus_data.plate_number.strip()
    model = bus_data.model.strip()
    if not plate_number or not model:
        raise HTTPException(
            status_code=422,
            detail="Plate number and model cannot be empty",
        )
    bus = Bus(
        plate_number=plate_number,
        model=model,
        seats=bus_data.seats,
        company_id=bus_data.company_id,
    )
    db.add(bus)
    try:
        db.commit()
        db.refresh(bus)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Bus with this plate number already exists",
        )
    return bus
