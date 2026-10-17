
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
    statement = select(Route)
    return db.execute(statement).scalars().all()


@router.get("/{route_id}", response_model=RouteResponse)
def get_route(route_id: int, db: Session = Depends(get_db)):
    statement = select(Route).where(Route.id == route_id)
    route = db.execute(statement).scalar_one_or_none()
    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found",
        )
    return route


@router.post(
    "",
    response_model=RouteResponse,
    status_code=201,
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
            detail="Company not found",
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
            detail="Route with this number already exists",
        )
    return route


@router.put("/{route_id}", response_model=RouteResponse)
def update_route(
    route_id: int,
    route_data: RouteCreate,
    db: Session = Depends(get_db),
):
    route = db.get(Route, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    if db.get(Company, route_data.company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

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
            detail="Route with this number already exists",
        )
    return route


@router.delete("/{route_id}", status_code=204)
def delete_route(route_id: int, db: Session = Depends(get_db)):
    try:
        result = db.execute(delete(Route).where(Route.id == route_id))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Route not found")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Route cannot be deleted while it has driver assignments",
        )
    return Response(status_code=204)
