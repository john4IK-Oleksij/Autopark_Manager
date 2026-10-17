
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
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
    bus = Bus(
        plate_number=bus_data.plate_number,
        model=bus_data.model,
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


@router.put("/{bus_id}", response_model=BusResponse)
def update_bus(
    bus_id: int,
    bus_data: BusCreate,
    db: Session = Depends(get_db),
):
    bus = db.get(Bus, bus_id)
    if bus is None:
        raise HTTPException(status_code=404, detail="Bus not found")
    if db.get(Company, bus_data.company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

    bus.plate_number = bus_data.plate_number
    bus.model = bus_data.model
    bus.seats = bus_data.seats
    bus.company_id = bus_data.company_id
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


@router.delete("/{bus_id}", status_code=204)
def delete_bus(bus_id: int, db: Session = Depends(get_db)):
    result = db.execute(delete(Bus).where(Bus.id == bus_id))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Bus not found")
    db.commit()
    return Response(status_code=204)
