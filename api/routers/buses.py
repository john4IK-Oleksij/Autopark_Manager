
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
    statement = select(Bus).order_by(Bus.plate_number)
    return db.execute(statement).scalars().all()


@router.get(
    "/{bus_id}",
    response_model=BusResponse,
    responses={404: {"description": "Bus not found"}},
)
def get_bus(bus_id: int, db: Session = Depends(get_db)):
    statement = select(Bus).where(Bus.id == bus_id)
    bus = db.execute(statement).scalar_one_or_none()
    if bus is None:
        raise HTTPException(
            status_code=404,
            detail="Автобус не знайдено",
        )

    return bus


@router.post("", response_model=BusResponse,
    status_code=201,
    responses={
        404: {"description": "Company not found"},
        409: {"description": "Bus plate number already exists"},
    },
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
            detail="Перевізника не знайдено",
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
            detail="Автобус із таким номером уже існує",
        )
    return bus


@router.put(
    "/{bus_id}",
    response_model=BusResponse,
    responses={
        404: {"description": "Bus or company not found"},
        409: {"description": "Bus plate number already exists"},
    },
)
def update_bus(
    bus_id: int,
    bus_data: BusCreate,
    db: Session = Depends(get_db),
):
    bus = db.get(Bus, bus_id)
    if bus is None:
        raise HTTPException(status_code=404, detail="Автобус не знайдено")
    if db.get(Company, bus_data.company_id) is None:
        raise HTTPException(status_code=404, detail="Перевізника не знайдено")

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
            detail="Автобус із таким номером уже існує",
        )
    return bus


@router.delete(
    "/{bus_id}",
    status_code=204,
    responses={
        404: {"description": "Bus not found"},
        409: {"description": "Bus has related records"},
    },
)
def delete_bus(bus_id: int, db: Session = Depends(get_db)):
    bus = db.get(Bus, bus_id)
    if bus is None:
        raise HTTPException(status_code=404, detail="Автобус не знайдено")
    try:
        db.execute(delete(Bus).where(Bus.id == bus_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Автобус неможливо видалити: є пов'язані записи",
        )
    return Response(status_code=204)
