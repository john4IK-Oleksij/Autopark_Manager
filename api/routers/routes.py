
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Company, Route
from schemas import RouteCreate, RouteResponse

router = APIRouter(
    prefix="/routes",
    tags=["Routes"],
)


@router.get("", response_model=list[RouteResponse])
def get_routes(db: Session = Depends(get_db)):
    statement = select(Route).order_by(Route.number)
    return db.execute(statement).scalars().all()


@router.get(
    "/{route_id}",
    response_model=RouteResponse,
    responses={404: {"description": "Route not found"}},
)
def get_route(route_id: int, db: Session = Depends(get_db)):
    statement = select(Route).where(Route.id == route_id)
    route = db.execute(statement).scalar_one_or_none()
    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Маршрут не знайдено",
        )
    return route


@router.post(
    "",
    response_model=RouteResponse,
    status_code=201,
    responses={
        404: {"description": "Company not found"},
        409: {"description": "Route number already exists"},
    },
)
def create_route(
    route_data: RouteCreate,
    db: Session = Depends(get_db),
):
    company = db.execute(
        select(Company).where(Company.id == route_data.company_id)
    ).scalar_one_or_none()
    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Перевізника не знайдено",
        )
    route = Route(
        number=route_data.number,
        title=route_data.title,
        distance_km=route_data.distance_km,
        company_id=route_data.company_id,
    )
    db.add(route)
    try:
        db.commit()
        db.refresh(route)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Маршрут із таким номером уже існує",
        )
    return route


@router.put(
    "/{route_id}",
    response_model=RouteResponse,
    responses={
        404: {"description": "Route or company not found"},
        409: {"description": "Route number already exists"},
    },
)
def update_route(
    route_id: int,
    route_data: RouteCreate,
    db: Session = Depends(get_db),
):
    route = db.get(Route, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")
    if db.get(Company, route_data.company_id) is None:
        raise HTTPException(status_code=404, detail="Перевізника не знайдено")

    route.number = route_data.number
    route.title = route_data.title
    route.distance_km = route_data.distance_km
    route.company_id = route_data.company_id
    try:
        db.commit()
        db.refresh(route)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Маршрут із таким номером уже існує",
        )
    return route


@router.delete(
    "/{route_id}",
    status_code=204,
    responses={
        404: {"description": "Route not found"},
        409: {"description": "Route has driver assignments"},
    },
)
def delete_route(route_id: int, db: Session = Depends(get_db)):
    route = db.get(Route, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Маршрут не знайдено")

    try:
        db.execute(delete(Route).where(Route.id == route_id))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Маршрут неможливо видалити: є призначення водіїв",
        )
    return Response(status_code=204)
