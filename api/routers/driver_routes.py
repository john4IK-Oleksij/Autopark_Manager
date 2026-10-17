
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from dependencies import get_db
from models import Driver, DriverRoute, Route
from schemas import DriverRouteCreate, DriverRouteResponse

router = APIRouter(
    prefix="/driver-routes",
    tags=["Driver Routes"],
)


@router.get("", response_model=list[DriverRouteResponse])
def get_driver_routes(db: Session = Depends(get_db)):
    statement = select(DriverRoute)
    return db.execute(statement).scalars().all()


@router.post(
    "",
    response_model=DriverRouteResponse,
    status_code=201,
)
def assign_driver_to_route(
    assignment_data: DriverRouteCreate,
    db: Session = Depends(get_db),
):
    driver = db.get(Driver, assignment_data.driver_id)
    if driver is None:
        raise HTTPException(
            status_code=404,
            detail="Driver not found",
        )

    route = db.get(Route, assignment_data.route_id)
    if route is None:
        raise HTTPException(
            status_code=404,
            detail="Route not found",
        )

    if driver.company_id != route.company_id:
        raise HTTPException(
            status_code=422,
            detail="Driver and route must belong to the same company",
        )

    existing = db.get(
        DriverRoute,
        (assignment_data.driver_id, assignment_data.route_id),
    )
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Driver is already assigned to this route",
        )

    assignment = DriverRoute(
        driver_id=assignment_data.driver_id,
        route_id=assignment_data.route_id,
    )
    db.add(assignment)

    try:
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Could not create this assignment",
        )

    return assignment


@router.delete("/{driver_id}/{route_id}", status_code=204)
def remove_driver_from_route(
    driver_id: int,
    route_id: int,
    db: Session = Depends(get_db),
):
    assignment = db.get(DriverRoute, (driver_id, route_id))

    if assignment is None:
        raise HTTPException(
            status_code=404,
            detail="Assignment not found",
        )

    db.delete(assignment)
    db.commit()
